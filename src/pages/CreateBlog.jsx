// src/pages/CreateBlog.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { blogAPI } from '../api/blog';

const CreateBlog = () => {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [ogImagePreview, setOgImagePreview] = useState(''); // NEW: For OG image preview
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    imageAlt: '',
    excerpt: '',
    category: '',
    tags: '',
  
    // SEO fields
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: ''
    // REMOVED: ogImage - handled as file upload
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [ogImageFile, setOgImageFile] = useState(null); // NEW: For OG image file
  const [charCount, setCharCount] = useState({
    title: 0,
    metaTitle: 0,
    metaDescription: 0
  });

  // Fetch blog data for edit
  useEffect(() => {
    if (isEditMode) {
      fetchBlogData();
    }
  }, [id]);

  const fetchBlogData = async () => {
    try {
      const response = await blogAPI.getBlogById(id);
      const blog = response.data.data;
      
      // Convert arrays to strings for form inputs
      setFormData({
        title: blog.title || '',
        description: blog.description || '',
        content: blog.content || '',
        imageAlt: blog.imageAlt || '',
        excerpt: blog.excerpt || '',
        category: blog.category || '',
        tags: blog.tags?.join(', ') || '',

        metaTitle: blog.metaTitle || '',
        metaDescription: blog.metaDescription || '',
        metaKeywords: blog.metaKeywords?.join(', ') || '',
        canonicalUrl: blog.canonicalUrl || '',
        ogTitle: blog.ogTitle || '',
        ogDescription: blog.ogDescription || ''
        // REMOVED: ogImage from formData
      });

      // Update character counts
      setCharCount({
        title: blog.title?.length || 0,
        metaTitle: blog.metaTitle?.length || 0,
        metaDescription: blog.metaDescription?.length || 0
      });
      
      // Set image preview if exists
      if (blog.image) {
        setImagePreview(`http://localhost:5000/uploads/${blog.image}`);
      }
      
      // Set OG image preview if exists and different from main image
      if (blog.ogImage && blog.ogImage !== blog.image) {
        setOgImagePreview(`http://localhost:5000/uploads/${blog.ogImage}`);
      }
    } catch (err) {
      setError('Failed to load blog data');
      console.error('Fetch error:', err);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Update character count for relevant fields
    if (['title', 'metaTitle', 'metaDescription'].includes(name)) {
      setCharCount(prev => ({ ...prev, [name]: value.length }));
    }
  };

  // Handle blog image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // NEW: Handle OG image selection
  const handleOgImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOgImageFile(file);
      setOgImagePreview(URL.createObjectURL(file));
    }
  };

  // Generate excerpt from description
  const generateExcerpt = () => {
    if (formData.description) {
      const excerpt = formData.description.substring(0, 250) + '...';
      setFormData({ ...formData, excerpt });
    }
  };

  // Generate SEO fields
  const generateSEOFIelds = () => {
    const updates = {};
    
    // Generate from title
    if (formData.title) {
      if (!formData.metaTitle) {
        updates.metaTitle = formData.title.substring(0, 65);
      }
      if (!formData.ogTitle) {
        updates.ogTitle = formData.title;
      }
    }
    
    // Generate from description
    if (formData.description) {
      if (!formData.metaDescription) {
        updates.metaDescription = formData.description.substring(0, 155);
      }
      if (!formData.ogDescription) {
        updates.ogDescription = formData.description.substring(0, 155);
      }
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData({ ...formData, ...updates });
      
      // Update character counts
      if (updates.metaTitle) {
        setCharCount(prev => ({ ...prev, metaTitle: updates.metaTitle.length }));
      }
      if (updates.metaDescription) {
        setCharCount(prev => ({ ...prev, metaDescription: updates.metaDescription.length }));
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      setLoading(false);
      return;
    }

    if (!formData.content.trim()) {
      setError('Content is required');
      setLoading(false);
      return;
    }

    if (!isEditMode && !imageFile) {
      setError('Featured image is required');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          // Convert arrays to strings for backend
          if (key === 'tags' || key === 'metaKeywords') {
            formDataToSend.append(key, formData[key]);
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      // Append blog image if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      // Append OG image if selected (separate field)
      if (ogImageFile) {
        formDataToSend.append('ogImage', ogImageFile);
      }

      console.log('Form data being sent:', {
        title: formData.title,
        hasImage: !!imageFile,
        hasOgImage: !!ogImageFile
      });

      if (isEditMode) {
        await blogAPI.updateBlog(id, formDataToSend);
      } else {
        await blogAPI.createBlog(formDataToSend);
      }

      navigate('/blogs');
    } catch (err) {
      console.error('Save error details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update your blog content' : 'Write and publish a new blog post'}
          </p>
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
              {/* Title - REQUIRED */}
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
                  onBlur={generateSEOFIelds}
                />
                <div className={`text-xs mt-1 text-right ${charCount.title > 200 ? 'text-red-500' : 'text-gray-500'}`}>
                  {charCount.title}/200 characters
                </div>
              </div>

              {/* Description - REQUIRED */}
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
                  onBlur={generateExcerpt}
                />
              </div>

              {/* Content - REQUIRED */}
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
              {/* Image Upload - REQUIRED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image * <span className="text-red-500">(Required)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {imagePreview ? (
                    <div>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-48 w-full object-cover rounded-lg mb-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImageFile(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">Upload blog image</p>
                    </div>
                  )}
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required={!isEditMode}
                  />
                  <label
                    htmlFor="image-upload"
                    className="mt-2 inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md cursor-pointer"
                  >
                    Choose Image
                  </label>
                </div>
              </div>

        

     
              {/* SEO Section */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-3">SEO Settings (Optional)</h3>
                
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
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </span>
                  ) : isEditMode ? (
                    'Update Blog'
                  ) : (
                    'Publish Blog'
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

export default CreateBlog;