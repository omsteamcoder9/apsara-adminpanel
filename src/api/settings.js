// src/api/settings.js
import api from './axiosConfig';

export const settingsAPI = {
  // Get public settings (no authentication required)
  getPublicSettings: () => api.get('/settings/public'),
  
  // Get all settings (admin only)
  getAllSettings: () => api.get('/settings'),
  
  // Update settings (admin only)
  updateSettings: (settingsData) => {
    // Use FormData for file uploads, otherwise regular JSON
    if (settingsData instanceof FormData) {
      return api.put('/settings', settingsData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.put('/settings', settingsData);
  },
  
  // Delete QR code (admin only)
  deleteQrCode: (type) => api.delete(`/settings/qr-code/${type}`),
  
  // Upload QR code (admin only)
  uploadQrCode: (type, file) => {
    const formData = new FormData();
    formData.append(type, file);
    
    return api.post(`/settings/qr-code/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};