// src/components/EditCategoryModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Trash2, Sparkles, Loader, Wand2 } from 'lucide-react';
import api from '../api/axiosConfig';

// ✅ Helper function to capitalize first letter
const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// ✅ Helper function to get full image URL (supports R2 and local)
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // ✅ If it's already a full URL (R2) - return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // ✅ If it's a local path starting with /uploads/
  const baseUrl = import.meta.env.VITE_API_IMG_URL || 'http://localhost:5002/uploads';
  if (imagePath.startsWith('/uploads/')) {
    return `${baseUrl}${imagePath}`;
  }
  
  // ✅ If it's just a filename
  if (!imagePath.startsWith('/')) {
    return `${baseUrl}/${imagePath}`;
  }
  
  // ✅ Fallback
  return `${baseUrl}${imagePath}`;
};

const EditCategoryModal = ({ isOpen, onClose, onEditCategory, category }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImagePath, setGeneratedImagePath] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

  const imageBaseUrl = import.meta.env.VITE_API_IMG_URL || 'http://localhost:5002/uploads';

  // ✅ FIXED: Properly set image preview when category changes
  useEffect(() => {
    if (category) {
      console.log('📝 Editing category:', category);
      console.log('📸 Category image:', category.image);
      
      setFormData({
        name: category.name || '',
        description: category.description || '',
        status: category.status || 'active'
      });
      
      // ✅ Handle image
      if (category.image) {
        setExistingImage(category.image);
        // ✅ Use helper to get full URL
        const fullUrl = getFullImageUrl(category.image);
        console.log('🖼️ Image full URL:', fullUrl);
        setImagePreview(fullUrl);
      } else {
        setExistingImage(null);
        setImagePreview(null);
      }
      
      setImageFile(null);
      setDeleteImage(false);
      setGeneratedContent(null);
      setShowPreview(false);
      setGeneratedImagePath(null);
      setGeneratedImageUrl(null);
    }
  }, [category]);

  // ✅ Generate image using Pollinations.ai
  const generateImage = async () => {
    const capitalizedName = capitalizeFirstLetter(formData.name.trim());
    if (!capitalizedName) {
      setError('Please enter a category name first');
      return;
    }

    setGeneratingImage(true);
    setError('');

    try {
      const response = await api.post('/categories/generate-image-preview', {
        name: capitalizedName
      });

      if (response.data.success) {
        const imageUrl = response.data.data.imageUrl;
        const imagePath = response.data.data.imagePath;
        setGeneratedImageUrl(imageUrl);
        setGeneratedImagePath(imagePath);
        setImagePreview(imageUrl);
        setImageFile(null);
        setDeleteImage(false);
        setExistingImage(null);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Failed to generate image. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  // ✅ Generate content using AI
  const generateContent = async () => {
    const capitalizedName = capitalizeFirstLetter(formData.name.trim());
    if (!capitalizedName) {
      setError('Please enter a category name first');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedContent(null);

    try {
      const response = await api.post('/categories/generate-preview', {
        name: capitalizedName
      });

      if (response.data.success) {
        setGeneratedContent(response.data.data);
        setShowPreview(true);
        
        if (!formData.description || formData.description.trim() === '' || formData.description === category?.description) {
          setFormData(prev => ({
            ...prev,
            description: response.data.data.description
          }));
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setError('Failed to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    const capitalized = capitalizeFirstLetter(value);
    setFormData(prev => ({ ...prev, name: capitalized }));
    
    setGeneratedContent(null);
    setShowPreview(false);
    setGeneratedImageUrl(null);
    setGeneratedImagePath(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      setDeleteImage(false);
      setGeneratedImageUrl(null);
      setGeneratedImagePath(null);
      setExistingImage(null);
    }
  };

  const removeImage = () => {
    // Revoke blob URL if it's a preview
    if (imagePreview && !existingImage && !generatedImageUrl && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setGeneratedImageUrl(null);
    setGeneratedImagePath(null);
    setDeleteImage(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      handleNameChange(e);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const capitalizedName = capitalizeFirstLetter(formData.name.trim());
    if (!capitalizedName) {
      setError('Category name is required');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', capitalizedName);
      
      if (formData.description && formData.description.trim()) {
        submitData.append('description', formData.description.trim());
      }
      
      submitData.append('status', formData.status);
      
      // ✅ Priority: uploaded image > generated image path > keep existing
      if (deleteImage) {
        submitData.append('deleteImage', 'true');
        console.log('🗑️ Deleting image');
      } else if (imageFile) {
        submitData.append('image', imageFile);
        console.log('📷 Using uploaded image');
      } else if (generatedImagePath) {
        submitData.append('existingImagePath', generatedImagePath);
        console.log('📷 Using generated image path:', generatedImagePath);
      } else if (existingImage) {
        // Keep existing image - send the path
        submitData.append('existingImagePath', existingImage);
        console.log('📷 Keeping existing image:', existingImage);
      }
      
      await onEditCategory(category._id, submitData);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-500" />
            Edit Category
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Image Upload with AI Generate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-500 transition-colors">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-lg"
                    onError={(e) => {
                      console.log('❌ Image failed to load:', imagePreview);
                      e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', imagePreview);
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                  {generatedImageUrl && (
                    <span className="absolute -bottom-6 left-0 text-[10px] text-green-600 font-medium whitespace-nowrap">
                      ✨ AI Generated
                    </span>
                  )}
                  {existingImage && !generatedImageUrl && (
                    <span className="absolute -bottom-6 left-0 text-[10px] text-blue-600 font-medium whitespace-nowrap">
                      📁 Existing
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <label className="flex flex-col items-center cursor-pointer w-full">
                    <ImageIcon size={28} className="text-gray-400" />
                    <span className="text-xs text-blue-600 mt-1">Upload Image</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                  </label>
                  
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="text-xs text-gray-400">OR</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={generateImage}
                    disabled={generatingImage || !formData.name}
                    className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {generatingImage ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        Generate with AI
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400">
                    AI will create a professional image for this category
                  </p>
                </div>
              )}
            </div>
            {existingImage && !deleteImage && !imageFile && !generatedImageUrl && (
              <p className="text-xs text-green-600 mt-1">✓ Current image will be kept</p>
            )}
            {imageFile && (
              <p className="text-xs text-green-600 mt-1">✓ Using uploaded image</p>
            )}
            {generatedImageUrl && (
              <p className="text-xs text-green-600 mt-1">✓ Using AI-generated image</p>
            )}
            {deleteImage && (
              <p className="text-xs text-red-600 mt-1">✗ Image will be deleted</p>
            )}
          </div>

          {/* Name - Required with AI Generate button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase-first"
                placeholder="Enter category name (e.g., Pants)"
              />
              <button
                type="button"
                onClick={generateContent}
                disabled={generating || !formData.name}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 whitespace-nowrap text-sm"
              >
                {generating ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                Generate
              </button>
            </div>
          </div>

          {/* Description - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description 
              <span className="text-gray-400 text-xs ml-1">(optional - AI can generate)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              placeholder="Description will be auto-generated if left empty"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white py-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Updating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Update Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;