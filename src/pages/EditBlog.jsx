// src/pages/EditBlog.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { blogAPI } from '../api/blog';

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // State for current image from database
  const [currentImage, setCurrentImage] = useState('');
  const [currentOgImage, setCurrentOgImage] = useState('');
  
  // State for new image uploads
  const [imageFile, setImageFile] = useState(null);
  const [ogImageFile, setOgImageFile] = useState(null);
  
  // State for previews
  const [imagePreview, setImagePreview] = useState('');
  const [ogImagePreview, setOgImagePreview] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    imageAlt: '',
    excerpt: '',
    category: '',
    tags: '',

    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: ''
  });

  const [charCount, setCharCount] = useState({
    title: 0,
    metaTitle: 0,
    metaDescription: 0
  });

  // Fetch blog data by ID
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await blogAPI.getBlogById(id);
        const blog = response.data.data;
        
        if (!blog) {
          setError('Blog not found');
          return;
        }
        
        console.log('📊 Blog API response:', {
          image: blog.image, // "1770274062619-image.webp"
          imageUrl: blog.imageUrl, // "/uploads/1770274062619-image.webp"
          ogImage: blog.ogImage,
          ogImageUrl: blog.ogImageUrl
        });
        
        // Store current image filenames from database
        setCurrentImage(blog.image || '');
        setCurrentOgImage(blog.ogImage || '');
        
        // Set form data
        const updatedFormData = {
          title: blog.title || '',
          description: blog.description || '',
          content: blog.content || '',
          imageAlt: blog.imageAlt || '',
          excerpt: blog.excerpt || '',
          category: blog.category || '',
          tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : blog.tags || '',
    
          metaTitle: blog.metaTitle || '',
          metaDescription: blog.metaDescription || '',
          metaKeywords: Array.isArray(blog.metaKeywords) ? blog.metaKeywords.join(', ') : blog.metaKeywords || '',
          canonicalUrl: blog.canonicalUrl || '',
          ogTitle: blog.ogTitle || '',
          ogDescription: blog.ogDescription || ''
        };
        
        setFormData(updatedFormData);
        
        // Update character counts
        setCharCount({
          title: blog.title?.length || 0,
          metaTitle: blog.metaTitle?.length || 0,
          metaDescription: blog.metaDescription?.length || 0
        });
        
        // 🖼️ SET IMAGE PREVIEWS
        // Use backend's imageUrl directly
// ✅ Use the VITE_API_FILE_URL from your .env
if (blog.image) {
  const imageUrl = `${import.meta.env.VITE_API_FILE_URL}/uploads/${blog.image}`;
  console.log('✅ Setting FULL image URL:', imageUrl);
  setImagePreview(imageUrl);
}

// ✅ Same for OG image
if (blog.ogImage) {
  const ogImageUrl = `${import.meta.env.VITE_API_FILE_URL}/uploads/${blog.ogImage}`;
  console.log('✅ Setting OG image URL:', ogImageUrl);
  setOgImagePreview(ogImageUrl);
}
        
      } catch (err) {
        console.error('❌ Error fetching blog:', err);
        setError('Failed to load blog data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchBlogData();
    }
  }, [id]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (['title', 'metaTitle', 'metaDescription'].includes(name)) {
      setCharCount(prev => ({ ...prev, [name]: value.length }));
    }
  };

  // Handle blog image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 New image selected:', file.name);
      setImageFile(file);
      // Create preview for new image
      const previewUrl = URL.createObjectURL(file);
      console.log('🖼️ Created blob preview URL:', previewUrl);
      setImagePreview(previewUrl);
    }
  };

  // Handle OG image selection
  const handleOgImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 New OG image selected:', file.name);
      setOgImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      console.log('🖼️ Created OG blob preview URL:', previewUrl);
      setOgImagePreview(previewUrl);
    }
  };

// Remove selected new image
const handleRemoveNewImage = () => {
  console.log('🗑️ Removing new image, reverting to:', currentImage);
  setImageFile(null);
  if (currentImage) {
    const imageUrl = `${import.meta.env.VITE_API_FILE_URL}/uploads/${currentImage}`;
    console.log('🔄 Reverting to:', imageUrl);
    setImagePreview(imageUrl);
  } else {
    setImagePreview('');
  }
};

// Remove selected new OG image
const handleRemoveNewOgImage = () => {
  console.log('🗑️ Removing new OG image, reverting to:', currentOgImage);
  setOgImageFile(null);
  if (currentOgImage) {
    const ogImageUrl = `${import.meta.env.VITE_API_FILE_URL}/uploads/${currentOgImage}`;
    console.log('🔄 Reverting OG to:', ogImageUrl);
    setOgImagePreview(ogImageUrl);
  } else {
    setOgImagePreview('');
  }
};
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append new blog image if selected
      if (imageFile) {
        console.log('📤 Uploading new image:', imageFile.name);
        formDataToSend.append('image', imageFile);
      }
      
      // Append new OG image if selected
      if (ogImageFile) {
        console.log('📤 Uploading new OG image:', ogImageFile.name);
        formDataToSend.append('ogImage', ogImageFile);
      }

      const response = await blogAPI.updateBlog(id, formDataToSend);
      
      if (response.data.success) {
        navigate('/blogs');
      } else {
        setError(response.data.message || 'Update failed');
      }
      
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update blog');
    } finally {
      setSaving(false);
    }
  };

  // Delete blog
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }
    
    try {
      await blogAPI.deleteBlog(id);
      navigate('/blogs');
    } catch (err) {
      setError('Failed to delete blog: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading blog data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Edit Blog Post</h1>
              <p className="text-gray-600">Update blog content and settings</p>
            </div>
         
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title * <span className="text-red-500">(Required)</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  maxLength="200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter blog title"
                />
                <div className={`text-xs mt-1 text-right ${charCount.title > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                  {charCount.title}/200 characters
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description * <span className="text-red-500">(Required)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the blog"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content * <span className="text-red-500">(Required)</span>
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required
                  rows="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Write your blog content here..."
                />
              </div>
           
           

   

         
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              {/* Current/New Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                  <span className="text-xs text-gray-500 ml-2">
                    {imageFile ? '(New image selected)' : '(Current image)'}
                  </span>
                </label>
                <div className="border rounded-lg p-4">
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-48 w-full object-cover rounded-lg mb-3"
                        onLoad={() => console.log('✅ Image loaded successfully from:', imagePreview)}
                        onError={(e) => {
                          console.error('❌ Image failed to load!');
                          console.error('Src attribute:', e.target.src);
                          console.error('Current imagePreview state:', imagePreview);
                          console.error('CurrentImage:', currentImage);
                          
                          e.target.onerror = null;
                          e.target.style.backgroundColor = '#f0f0f0';
                          e.target.style.display = 'flex';
                          e.target.style.alignItems = 'center';
                          e.target.style.justifyContent = 'center';
                          e.target.style.color = '#666';
                          e.target.style.fontSize = '14px';
                          e.target.style.textAlign = 'center';
                          e.target.innerHTML = `Image failed to load<br>URL: ${imagePreview}`;
                        }}
                      />
                      
                      {/* Show actions based on whether new image is selected */}
                      {imageFile ? (
                        <div className="flex justify-between">
                          <span className="text-sm text-green-600">New image selected</span>
                          <button
                            type="button"
                            onClick={handleRemoveNewImage}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove new image
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Current image from database
                          <div className="text-xs text-gray-500 mt-1">
                            URL: {imagePreview}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">No image available</p>
                      <p className="text-xs text-gray-500 mt-1">
                        imagePreview state: {imagePreview ? 'Has value' : 'Empty'}
                      </p>
                    </div>
                  )}
                  
                  {/* Image Upload Input */}
                  <div className="mt-4">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {imageFile ? 'New image will replace current image' : 'Select new image to replace current'}
                    </p>
                  </div>
                </div>
              </div>


        

              {/* SEO Section */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-3">SEO Settings</h3>
                
                <div className="space-y-4">
                  {/* Meta Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title (Max 70 chars)
                    </label>
                    <input
                      type="text"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleChange}
                      maxLength="70"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Title for search engines"
                    />
                    <div className={`text-xs mt-1 text-right ${charCount.metaTitle > 70 ? 'text-red-500' : 'text-gray-500'}`}>
                      {charCount.metaTitle}/70 characters
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description (Max 160 chars)
                    </label>
                    <textarea
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleChange}
                      rows="2"
                      maxLength="160"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description for search results"
                    />
                    <div className={`text-xs mt-1 text-right ${charCount.metaDescription > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                      {charCount.metaDescription}/160 characters
                    </div>
                  </div>

                  {/* Meta Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      name="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Comma-separated keywords"
                    />
                  </div>

                  {/* Canonical URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      name="canonicalUrl"
                      value={formData.canonicalUrl}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/blog-post"
                    />
                  </div>

                  {/* OG Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Open Graph Title
                    </label>
                    <input
                      type="text"
                      name="ogTitle"
                      value={formData.ogTitle}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Title for social media"
                    />
                  </div>

                  {/* OG Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Open Graph Description
                    </label>
                    <textarea
                      name="ogDescription"
                      value={formData.ogDescription}
                      onChange={handleChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description for social media"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Updating...
                    </span>
                  ) : (
                    'Update Blog'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/blogs')}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBlog;