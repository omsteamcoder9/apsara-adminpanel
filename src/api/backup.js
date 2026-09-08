// src/api/backup.js
import api from './axiosConfig';

export const backupAPI = {
  // Create backup and send to email
  createAndSendBackup: () => api.post('/backup/create'),
  
  // Create backup only (no email)
  createBackupOnly: () => api.post('/backup/create-only'),
  
  // Send existing backup via email
  sendBackup: (fileName) => api.post(`/backup/send/${fileName}`),
  
  // List all backups
  getBackups: () => api.get('/backup/list'),
  
  // Get backup statistics
  getBackupStats: () => api.get('/backup/stats'),
  
  // Delete backup
  deleteBackup: (fileName) => api.delete(`/backup/${fileName}`),
};