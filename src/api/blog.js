// api/blog.js
import api from './axiosConfig';

export const blogAPI = {
  // =============== PUBLIC ROUTES (exact backend match) ===============
  
// src/api/blog.js - Update getAllBlogs
getAllBlogs: (params = {}) => {
  // Send empty params to get ALL blogs
  return api.get('/blogs', { 
    params: {
      ...params,
      status: '' // Make sure status is empty
    }
  });
},
  
  // GET /api/blogs/categories
  getBlogCategories: () => api.get('/blogs/categories'),
  
  // GET /api/blogs/tags
  getBlogTags: () => api.get('/blogs/tags'),
  
  // GET /api/blogs/:slug
  getBlogBySlug: (slug) => api.get(`/blogs/${slug}`),
  
  // GET /api/blogs/:id/related
  getRelatedBlogs: (id) => api.get(`/blogs/${id}/related`),
  
  // =============== PROTECTED ROUTES (exact backend match) ===============
  
  // POST /api/blogs/:id/like
  toggleLike: (id) => api.post(`/blogs/${id}/like`),
  
  // =============== ADMIN/AUTHOR ROUTES (exact backend match) ===============
  
  // POST /api/blogs
  createBlog: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    return api.post('/blogs', formData, config);
  },
  
  // PUT /api/blogs/:id
  updateBlog: (id, formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    return api.put(`/blogs/${id}`, formData, config);
  },
  getBlogById: (id) => api.get(`/blogs/id/${id}`),

  // DELETE /api/blogs/:id
  deleteBlog: (id) => api.delete(`/blogs/${id}`)
};