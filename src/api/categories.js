// src/api/categories.js
import api from './axiosConfig';

export const categoriesAPI = {
  // Get all categories
  getAllCategories: () => api.get('/categories'),
  
  // Get active categories only
  getActiveCategories: () => api.get('/categories/active'),
  
  // Get single category
  getCategory: (id) => api.get(`/categories/${id}`),
  
  // Create category - Send FormData with image
  createCategory: (categoryData) => {
    if (categoryData instanceof FormData) {
      return api.post('/categories', categoryData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/categories', categoryData);
  },
  
  // Update category - Send FormData with image
  updateCategory: (id, categoryData) => {
    if (categoryData instanceof FormData) {
      return api.put(`/categories/${id}`, categoryData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/categories/${id}`, categoryData);
  },
  
  // Delete category
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};