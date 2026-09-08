// src/components/AddProductModal.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { categoriesAPI } from '../api/categories';
import { productsAPI } from '../api/products';
import { 
  X, Upload, Plus, Trash2, Tag, Package, DollarSign, 
  FileText, Settings, Image, ChevronDown, ChevronUp, 
  Save, AlertCircle, Info, Sparkles, Loader, Wand2
} from 'lucide-react';
import api from '../api/axiosConfig';

// ✅ Helper function to capitalize first letter
const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const AddProductModal = ({ isOpen, onClose, onAddProduct }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    basePrice: '',
    description: '',
    category: '',
    seller: '',
    stock: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImageFile: null,
    ogImagePreview: null,
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mainImageFiles, setMainImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);
  const [specifications, setSpecifications] = useState([]);
  const [keyFeatures, setKeyFeatures] = useState([]);
  const [newKeyFeature, setNewKeyFeature] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    category: true,
    specifications: false,
    features: false,
    images: true,
    description: true,
    seo: false
  });
  
  // ✅ AI Generation States
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // ✅ Image Generation States
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImagePath, setGeneratedImagePath] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

  const previewUrls = useRef(new Set());
  const modalContentRef = useRef(null);

  const addPreviewUrl = useCallback((url) => {
    if (url) previewUrls.current.add(url);
  }, []);

  const cleanupPreviews = useCallback(() => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const scrollToElement = (elementId) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element && modalContentRef.current) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + modalContentRef.current.scrollTop - 100;
        
        modalContentRef.current.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        
        element.classList.add('ring-2', 'ring-blue-600', 'border-blue-600');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-600', 'border-blue-600');
        }, 3000);
      }
    }, 100);
  };

  useEffect(() => {
    if (error && error.includes('fieldId:')) {
      const fieldId = error.split('fieldId:')[1].split('|')[0];
      scrollToElement(fieldId);
    }
  }, [error]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    return cleanupPreviews;
  }, [cleanupPreviews]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoriesAPI.getActiveCategories();
      
      let categoriesArray = [];
      if (Array.isArray(response.data)) {
        categoriesArray = response.data;
      } else if (response.data.categories && Array.isArray(response.data.categories)) {
        categoriesArray = response.data.categories;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        categoriesArray = response.data.data;
      }
      
      setCategories(categoriesArray);
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
      setError('Failed to fetch categories');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const resetForm = () => {
    if (formData.ogImagePreview) {
      URL.revokeObjectURL(formData.ogImagePreview);
    }
    
    cleanupPreviews();
    
    setFormData({
      name: '',
      slug: '',
      basePrice: '',
      description: '',
      category: '',
      seller: '',
      stock: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImageFile: null,
      ogImagePreview: null,
    });
    setMainImageFiles([]);
    setImagePreviews([]);
    setError('');
    setAutoGenerateSlug(true);
    setSpecifications([]);
    setKeyFeatures([]);
    setNewKeyFeature('');
    setExpandedSections({
      basic: true,
      category: true,
      specifications: false,
      features: false,
      images: true,
      description: true,
      seo: false
    });
    setGeneratedContent(null);
    setShowPreview(false);
    setGeneratedImagePath(null);
    setGeneratedImageUrl(null);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ✅ Generate content using AI
  const generateContent = async () => {
    const capitalizedName = capitalizeFirstLetter(formData.name.trim());
    if (!capitalizedName) {
      setError('Please enter a product name first');
      scrollToElement('product-name');
      return;
    }

    setGenerating(true);
    setError('');
    setGeneratedContent(null);

    try {
      const response = await api.post('/products/generate-preview', {
        name: capitalizedName
      });

      if (response.data.success) {
        const data = response.data.data;
        setGeneratedContent(data);
        setShowPreview(true);
        
        // ✅ Auto-fill fields with generated content
        setFormData(prev => ({
          ...prev,
          description: data.description || prev.description,
          metaTitle: data.metaTitle ? data.metaTitle.substring(0, 60) : prev.metaTitle,
          metaDescription: data.metaDescription ? data.metaDescription.substring(0, 160) : prev.metaDescription,
          canonicalUrl: data.canonicalUrl || prev.canonicalUrl,
          ogTitle: data.ogTitle ? data.ogTitle.substring(0, 60) : prev.ogTitle,
          ogDescription: data.ogDescription ? data.ogDescription.substring(0, 160) : prev.ogDescription,
        }));
        
        // ✅ Auto-fill specifications
        if (data.specifications && data.specifications.length > 0) {
          setSpecifications(data.specifications);
        }
        
        // ✅ Auto-fill key features
        if (data.keyFeatures && data.keyFeatures.length > 0) {
          setKeyFeatures(data.keyFeatures);
        }
        
        // ✅ Auto-fill meta keywords
        if (data.metaKeywords && data.metaKeywords.length > 0) {
          setFormData(prev => ({
            ...prev,
            metaKeywords: data.metaKeywords.join(', ')
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

  // ✅ Generate image using Pollinations.ai
  const generateProductImage = async () => {
    const capitalizedName = capitalizeFirstLetter(formData.name.trim());
    if (!capitalizedName) {
      setError('Please enter a product name first');
      scrollToElement('product-name');
      return;
    }

    setGeneratingImage(true);
    setError('');

    try {
      const response = await api.post('/products/generate-image-preview', {
        name: capitalizedName
      });

      if (response.data.success) {
        const imageUrl = response.data.data.imageUrl;
        const imagePath = response.data.data.imagePath;
        setGeneratedImageUrl(imageUrl);
        setGeneratedImagePath(imagePath);
        
        // Add to image previews
        setImagePreviews(prev => [...prev, imageUrl]);
        // Add to files (as a placeholder with isGenerated flag)
        setMainImageFiles(prev => [...prev, { 
          isGenerated: true, 
          path: imagePath,
          url: imageUrl
        }]);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError('Failed to generate image. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let updatedValue = value;
    
    // ✅ Capitalize first letter for name field
    if (name === 'name') {
      updatedValue = capitalizeFirstLetter(value);
    }
    
    const updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : updatedValue
    };

    if (name === 'name' && autoGenerateSlug) {
      const generatedSlug = updatedValue
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      updatedFormData.slug = generatedSlug;
    }

    setFormData(updatedFormData);
  };

  const handleAddKeyFeature = () => {
    if (newKeyFeature.trim() !== '') {
      setKeyFeatures([...keyFeatures, newKeyFeature.trim()]);
      setNewKeyFeature('');
    }
  };

  const handleRemoveKeyFeature = (index) => {
    const updatedKeyFeatures = [...keyFeatures];
    updatedKeyFeatures.splice(index, 1);
    setKeyFeatures(updatedKeyFeatures);
  };

  const handleSpecificationChange = (index, field, value) => {
    const updatedSpecifications = [...specifications];
    updatedSpecifications[index] = {
      ...updatedSpecifications[index],
      [field]: value
    };
    setSpecifications(updatedSpecifications);
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    const updatedSpecifications = [...specifications];
    updatedSpecifications.splice(index, 1);
    setSpecifications(updatedSpecifications);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const previews = files.map(file => {
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      return preview;
    });
    
    setMainImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...previews]);
    
    setError('');
    e.target.value = '';
  };

  const removeImagePreview = (index) => {
    const url = imagePreviews[index];
    if (url && !url.includes('pollinations')) {
      URL.revokeObjectURL(url);
      previewUrls.current.delete(url);
    }
    
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newFiles = mainImageFiles.filter((_, i) => i !== index);
    
    setImagePreviews(newPreviews);
    setMainImageFiles(newFiles);
    
    // If removing the generated image, clear the path
    if (newFiles.length === 0 || !newFiles.some(f => f.isGenerated)) {
      setGeneratedImagePath(null);
      setGeneratedImageUrl(null);
    }
  };

  const handleSlugToggle = (e) => {
    setAutoGenerateSlug(e.target.checked);
    if (e.target.checked && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      
      setFormData(prev => ({
        ...prev,
        slug: generatedSlug
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || formData.name.trim() === '') {
      setError('fieldId:product-name|Please enter a product name');
      scrollToElement('product-name');
      return;
    }

    if (!formData.slug || formData.slug.trim() === '') {
      setError('fieldId:product-slug|Please enter a product slug');
      scrollToElement('product-slug');
      return;
    }

    if (!formData.category || formData.category === '') {
      setError('fieldId:product-category|Please select a category');
      scrollToElement('product-category');
      return;
    }

    if (!formData.seller || formData.seller.trim() === '') {
      setError('fieldId:product-seller|Please enter a seller name');
      scrollToElement('product-seller');
      return;
    }

    const basePrice = parseFloat(formData.basePrice) || 0;
    if (basePrice <= 0) {
      setError('fieldId:product-base-price|Please enter a valid base price');
      scrollToElement('product-base-price');
      return;
    }

    if (!formData.description || formData.description.trim() === '') {
      setError('fieldId:product-description|Please enter a product description');
      scrollToElement('product-description');
      return;
    }

    if (!formData.stock || formData.stock === '' || parseInt(formData.stock) < 0) {
      setError('fieldId:product-stock|Please enter a valid stock quantity');
      scrollToElement('product-stock');
      return;
    }
    
    if (mainImageFiles.length === 0) {
      setError('fieldId:product-images|Please upload at least one product image');
      scrollToElement('product-images');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      
      const capitalizedName = capitalizeFirstLetter(formData.name.trim());
      submitData.append('name', capitalizedName);
      
      const basicFields = ['slug', 'category', 'seller', 'description'];
      basicFields.forEach(key => {
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });

      submitData.append('basePrice', formData.basePrice);
      submitData.append('stock', formData.stock);

      if (specifications.length > 0) {
        const validSpecifications = specifications.filter(spec => 
          spec.key.trim() !== '' && spec.value.trim() !== ''
        );
        if (validSpecifications.length > 0) {
          submitData.append('specifications', JSON.stringify(validSpecifications));
        }
      }

      if (keyFeatures.length > 0) {
        submitData.append('keyFeatures', JSON.stringify(keyFeatures));
      }

      const seoTextFields = ['metaTitle', 'metaDescription', 'canonicalUrl', 'ogTitle', 'ogDescription'];
      seoTextFields.forEach(field => {
        if (formData[field] && formData[field].trim() !== '') {
          submitData.append(field, formData[field].trim());
        }
      });

      if (formData.metaKeywords && formData.metaKeywords.trim() !== '') {
        const keywords = formData.metaKeywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k !== '');
        if (keywords.length > 0) {
          submitData.append('metaKeywords', JSON.stringify(keywords));
        }
      }

      // ✅ Handle images - priority: uploaded files > AI-generated image
      let hasUploadedImage = false;
      mainImageFiles.forEach(file => {
        if (file && !file.isGenerated) {
          submitData.append('images', file);
          hasUploadedImage = true;
        }
      });
      
      // If no uploaded images but we have a generated image
      if (!hasUploadedImage && generatedImagePath) {
        submitData.append('existingImagePath', generatedImagePath);
        console.log('📷 Using AI-generated image:', generatedImagePath);
      }

      if (formData.ogImageFile) {
        submitData.append('ogImage', formData.ogImageFile);
      } else if (mainImageFiles.length > 0 && mainImageFiles[0] && !mainImageFiles[0].isGenerated) {
        submitData.append('ogImage', mainImageFiles[0]);
      }

      // ✅ Auto-generate content flag
      if (generatedContent) {
        submitData.append('autoGenerateContent', 'true');
      }

      await onAddProduct(submitData);
      handleClose();
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create product');
      if (modalContentRef.current) modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    cleanupPreviews();
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const renderCategorySelector = () => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center">
        <Tag size={14} className="mr-1 text-gray-500" />
        Category <span className="text-red-500 ml-1">*</span>
      </label>
      {categoriesLoading ? (
        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading categories...</span>
        </div>
      ) : (
        <select
          id="product-category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm bg-white"
        >
          <option value="">-- Select a category --</option>
          {Array.isArray(categories) && categories.length > 0 ? (
            categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))
          ) : (
            <option value="" disabled>No categories available</option>
          )}
        </select>
      )}
    </div>
  );

  const renderSimpleProduct = () => (
    <div className="space-y-4">
      {/* Basic Information */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('basic')}
        >
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <Info size={16} className="mr-2 text-gray-500" />
            Basic Information
          </h3>
          {expandedSections.basic ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
        
        {expandedSections.basic && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Seller <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-seller"
                  type="text"
                  name="seller"
                  value={formData.seller}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                  placeholder="Enter seller name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-slug"
                      checked={autoGenerateSlug}
                      onChange={handleSlugToggle}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                    />
                    <label htmlFor="auto-slug" className="text-xs text-gray-600">Auto-generate from name</label>
                  </div>
                  <input
                    id="product-slug"
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    disabled={autoGenerateSlug}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:bg-gray-50 disabled:cursor-not-allowed text-sm"
                    placeholder="product-slug"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category & Pricing */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('category')}
        >
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <DollarSign size={16} className="mr-2 text-gray-500" />
            Category & Pricing
          </h3>
          {expandedSections.category ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
        
        {expandedSections.category && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderCategorySelector()}
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-stock"
                  type="text"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                  placeholder="Enter stock quantity"
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Base Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xs">₹</span>
                </div>
                <input
                  id="product-base-price"
                  type="text"
                  name="basePrice"
                  value={formData.basePrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Enter base price for this product</p>
            </div>
          </div>
        )}
      </div>

      {/* Images with AI Generation */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('images')}
        >
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <Image size={16} className="mr-2 text-gray-500" />
            Product Images <span className="text-red-500 ml-1">*</span>
          </h3>
          {expandedSections.images ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
        
        {expandedSections.images && (
          <div className="p-3 sm:p-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 hover:border-blue-600 transition-colors">
              <input
                id="product-images"
                type="file"
                multiple
                onChange={handleImageChange}
                accept="image/*"
                className="w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
            
            {/* ✅ AI Image Generation Button */}
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-xs text-gray-400">OR</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
              <button
                type="button"
                onClick={generateProductImage}
                disabled={generatingImage || !formData.name}
                className="w-full mt-2 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                {generatingImage ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Generating Product Image...
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Generate Product Image with AI
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-400 mt-1 text-center">
                AI will create a professional product image
              </p>
            </div>
            
            <p className="text-xs text-amber-600 mt-2">⚠️ At least one image required</p>
            
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-600 mb-2">Image Previews ({imagePreviews.length})</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100?text=Error';
                          }}
                        />
                        {generatedImageUrl && preview === generatedImageUrl && (
                          <span className="absolute top-1 left-1 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded">
                            AI
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImagePreview(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-lg hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description with AI Generate Button */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('description')}
        >
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <FileText size={16} className="mr-2 text-gray-500" />
            Description <span className="text-red-500 ml-1">*</span>
          </h3>
          {expandedSections.description ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </div>
        
        {expandedSections.description && (
          <div className="p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                id="product-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                placeholder="Enter product description"
              />
              <button
                type="button"
                onClick={generateContent}
                disabled={generating || !formData.name}
                className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-sm"
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
        )}
      </div>

      {/* Specifications */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('specifications')}
        >
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <Settings size={16} className="mr-2 text-gray-500" />
            Specifications (Optional)
          </h3>
          <div className="flex items-center">
            {specifications.length > 0 && (
              <span className="mr-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                {specifications.length}
              </span>
            )}
            {expandedSections.specifications ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
        </div>
        
        {expandedSections.specifications && (
          <div className="p-3 sm:p-4 space-y-3">
            {specifications.length > 0 ? (
              <div className="space-y-3">
                {specifications.map((spec, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-gray-600">Specification #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={spec.key}
                        onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Key (e.g. Material)"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="Value (e.g. Cotton)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                <p className="text-xs text-gray-500">No specifications added yet.</p>
              </div>
            )}
            
            <button
              type="button"
              onClick={addSpecification}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} className="mr-1" />
              Add Specification
            </button>
          </div>
        )}
      </div>

      {/* Key Features */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div 
          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
          onClick={() => toggleSection('features')}
        >
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <Package size={16} className="mr-2 text-gray-500" />
            Key Features (Optional)
          </h3>
          <div className="flex items-center">
            {keyFeatures.length > 0 && (
              <span className="mr-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                {keyFeatures.length}
              </span>
            )}
            {expandedSections.features ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
        </div>
        
        {expandedSections.features && (
          <div className="p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={newKeyFeature}
                onChange={(e) => setNewKeyFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyFeature())}
                placeholder="Enter a key feature"
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
              />
              <button
                type="button"
                onClick={handleAddKeyFeature}
                disabled={!newKeyFeature.trim()}
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} className="mr-1" />
                Add
              </button>
            </div>
            
            {keyFeatures.length > 0 && (
              <div className="space-y-2 mt-3">
                {keyFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700 flex-1">{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyFeature(index)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderSeoSettings = () => (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
        onClick={() => toggleSection('seo')}
      >
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <Settings size={16} className="mr-2 text-gray-500" />
          SEO Settings (Optional)
        </h3>
        {expandedSections.seo ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </div>
      
      {expandedSections.seo && (
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Meta Title
                <span className="ml-2 text-gray-400 text-[10px]">
                  {formData.metaTitle?.length || 0}/60
                </span>
              </label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle || ''}
                onChange={handleInputChange}
                maxLength="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Title for search engines"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Meta Description
                <span className="ml-2 text-gray-400 text-[10px]">
                  {formData.metaDescription?.length || 0}/160
                </span>
              </label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription || ''}
                onChange={handleInputChange}
                maxLength="160"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Description for search engines"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Meta Keywords
              </label>
              <input
                type="text"
                name="metaKeywords"
                value={formData.metaKeywords || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Canonical URL
              </label>
              <input
                type="text"
                name="canonicalUrl"
                value={formData.canonicalUrl || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="https://yourstore.com/product-slug"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                OG:Title (Social Media)
              </label>
              <input
                type="text"
                name="ogTitle"
                value={formData.ogTitle || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Title for social sharing"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                OG:Description (Social Media)
              </label>
              <textarea
                name="ogDescription"
                value={formData.ogDescription || ''}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Description for social sharing"
              />
            </div>
          </div>
          
          {formData.metaTitle && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Search Result Preview:</p>
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="text-blue-700 text-base font-medium truncate">
                  {formData.metaTitle || 'Product Name'}
                </div>
                <div className="text-green-700 text-xs truncate">
                  https://yourstore.com/products/{formData.slug || 'product-slug'}
                </div>
                <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                  {formData.metaDescription || 'Product description will appear here...'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] m-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <Package size={18} className="mr-2 text-blue-600" />
              Add New Product
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Set base price for your product
            </p>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4 overflow-y-auto flex-1" ref={modalContentRef}>
          {error && !error.includes('fieldId:') && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center">
                <AlertCircle size={18} className="mr-2 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {renderSimpleProduct()}
            {renderSeoSettings()}
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || categoriesLoading}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
            >
              <Save size={16} className="mr-2" />
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;