// src/pages/BackupManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { backupAPI } from '../api/backup';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Database, 
  Mail, 
  Trash2, 
  RefreshCw, 
  Calendar,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Clock,
  FileArchive,
  Send,
  Shield,
  Server,
  Download,
  Info,
  Star
} from 'lucide-react';

const BackupManagement = () => {
  const { logout } = useAuth();
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [deletingBackup, setDeletingBackup] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, fileName: null });
  
  const hasFetched = useRef(false);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch backups on mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchBackups();
    }
  }, []);

  const fetchBackups = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('❌ You are not logged in. Please login again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      console.log('🔍 Fetching backups...');
      
      // Fetch backups list
      const response = await backupAPI.getBackups();
      console.log('📊 Backup response:', response.data);
      
      if (response.data && response.data.success) {
        const backupData = response.data.backups || [];
        console.log('📁 Backups found:', backupData.length);
        setBackups(backupData);
        
        if (backupData.length === 0) {
          setError('ℹ️ No backups found. Create your first backup!');
        }
      } else {
        setError('❌ Failed to fetch backups');
        console.error('❌ Invalid response:', response.data);
      }

      // Fetch stats
      try {
        const statsResponse = await backupAPI.getBackupStats();
        console.log('📊 Stats response:', statsResponse.data);
        if (statsResponse.data && statsResponse.data.success) {
          setStats(statsResponse.data.stats);
        }
      } catch (statsErr) {
        console.warn('Failed to fetch stats:', statsErr);
      }
      
    } catch (err) {
      console.error('❌ Error fetching backups:', err);
      
      if (err.response && err.response.status === 401) {
        setError('❌ Session expired. Please login again.');
      } else if (err.response && err.response.status === 403) {
        setError('❌ You do not have permission to access backups.');
      } else if (err.message === 'Network Error') {
        setError('❌ Cannot connect to server. Please check your internet connection.');
      } else {
        setError(`❌ Failed to fetch backups: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchBackups(true);
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      setError('');
      setSuccess('');
      
      const response = await backupAPI.createAndSendBackup();
      console.log('✅ Backup created:', response.data);
      
      if (response.data && response.data.success) {
        setSuccess('✅ Backup created and sent to email successfully!');
        setTimeout(() => setSuccess(''), 5000);
        await fetchBackups(true);
      } else {
        setError('❌ Failed to create backup');
      }
    } catch (err) {
      console.error('❌ Error creating backup:', err);
      setError(`❌ Failed to create backup: ${err.response?.data?.message || err.message}`);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (fileName) => {
    try {
      setDeletingBackup(fileName);
      setError('');
      setSuccess('');
      
      const response = await backupAPI.deleteBackup(fileName);
      console.log('✅ Backup deleted:', response.data);
      
      if (response.data && response.data.success) {
        setSuccess(`✅ Backup "${fileName}" deleted successfully!`);
        setTimeout(() => setSuccess(''), 5000);
        await fetchBackups(true);
      } else {
        setError('❌ Failed to delete backup');
      }
    } catch (err) {
      console.error('❌ Error deleting backup:', err);
      setError(`❌ Failed to delete backup: ${err.response?.data?.message || err.message}`);
    } finally {
      setDeletingBackup(null);
      setDeleteModal({ show: false, fileName: null });
    }
  };

  // ✅ Format date for display - shows IST
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // If it's already a formatted string (displayTime), return it
      if (typeof dateString === 'string' && dateString.includes('IST')) {
        return dateString;
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMinutes < 1) {
        return 'Just now';
      }
      if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      }
      if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
      
      // Format as IST
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} IST`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // ✅ For relative time display
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMinutes < 1) {
        return 'Just now';
      }
      if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      }
      if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
      return `${diffDays} days ago`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatFileSize = (sizeInMB) => {
    if (sizeInMB === undefined || sizeInMB === null) return '0 MB';
    if (sizeInMB < 0.001) {
      return `${(sizeInMB * 1024 * 1024).toFixed(2)} B`;
    }
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(2)} KB`;
    }
    if (sizeInMB > 1024) {
      return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
    return `${sizeInMB.toFixed(2)} MB`;
  };

  const getStatusBadge = (sizeInMB) => {
    if (sizeInMB > 20) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertCircle size={14} className="mr-1" />,
        label: 'Large'
      };
    } else if (sizeInMB > 10) {
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock size={14} className="mr-1" />,
        label: 'Medium'
      };
    } else {
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle size={14} className="mr-1" />,
        label: 'Small'
      };
    }
  };

  const getFileIcon = (sizeInMB) => {
    if (sizeInMB > 20) return '📦';
    if (sizeInMB > 10) return '📁';
    return '📄';
  };

  const getStorageBadge = (backup) => {
    if (backup.emailSent) {
      return {
        label: '📧 In Email',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <Mail size={14} className="mr-1" />
      };
    }
    return {
      label: '💾 On Server',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <HardDrive size={14} className="mr-1" />
    };
  };

  // Mobile Card Component - ONLY changes for mobile
  const BackupCard = ({ backup, index }) => {
    const status = getStatusBadge(backup.sizeInMB);
    const storage = getStorageBadge(backup);
    const isDeleting = deletingBackup === backup.fileName;
    const fileIcon = getFileIcon(backup.sizeInMB);
    const isLatest = backup.isLatest || (index === 0 && backups.length > 0);
    
    return (
      <div className={`bg-white rounded-lg shadow border p-4 mb-4 hover:shadow-md transition-shadow ${isLatest ? 'border-blue-400 border-2' : 'border-gray-200'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-500 pt-0.5">#{index + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                  {backup.fileName}
                </h3>
                {isLatest && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex-shrink-0">
                    <Star size={12} className="mr-1 fill-blue-500 text-blue-500" />
                    Latest
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 break-words">
                {formatDate(backup.createdAt)}
              </p>
            </div>
          </div>
          <div className="text-2xl flex-shrink-0 ml-2">{fileIcon}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Size</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {formatFileSize(backup.sizeInMB)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.color} truncate max-w-full`}>
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>
        
        <div className="mb-3">
          <p className="text-xs text-gray-500">Storage</p>
          <div className="flex flex-wrap items-center gap-1">
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${storage.color}`}>
              {storage.icon}
              {storage.label}
            </span>
            {backup.emailRecipient && (
              <span className="text-xs text-gray-500 truncate max-w-[150px]">
                Sent to: {backup.emailRecipient}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => setDeleteModal({ show: true, fileName: backup.fileName })}
            disabled={isDeleting}
            className="flex-1 min-w-[100px] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <RefreshCw size={14} className="animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} className="mr-2" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal = ({ show, onClose, onConfirm, fileName }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Delete Backup</h3>
          <p className="text-gray-600 text-center mb-6 break-words">
            Are you sure you want to delete backup <strong className="text-gray-900">{fileName}</strong>? This action cannot be undone.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="w-full sm:flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 bg-gray-50">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Get the latest backup
  const latestBackup = backups.length > 0 ? backups[0] : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 w-full h-screen overflow-y-auto">
        {/* Fixed Header - EXACTLY as original, only added mobile text truncation */}
        <header className="bg-white shadow sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center min-w-0">
              <Database className="mr-2 text-blue-600 flex-shrink-0" size={24} />
              <h1 className="text-xl font-bold text-gray-800 truncate">Backup Management</h1>
              <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex-shrink-0">
                Admin
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition duration-200 flex items-center disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw size={18} className={`${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </button>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
                title="Logout"
              >
                <span className="hidden sm:inline mr-2">Logout</span>
                <LogOut size={isMobile ? 14 : 18} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6">
          <div className="mb-6">
            {/* Stats Cards - EXACTLY as original */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Backups</p>
                    <p className="text-2xl font-bold text-gray-800">{backups.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white">
                    <Database size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Total Size</p>
                    <p className="text-2xl font-bold text-gray-800 truncate">
                      {formatFileSize(stats?.totalSizeMB || backups.reduce((sum, b) => sum + (b.sizeInMB || 0), 0))}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white">
                    <HardDrive size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Latest Backup</p>
                    {latestBackup ? (
                      <>
                        <p className="text-sm font-semibold text-gray-800 truncate max-w-[100px]">
                          {latestBackup.fileName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {formatDate(latestBackup.createdAt)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No backups</p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <Calendar size={20} />
                  </div>
                </div>
                {latestBackup && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 truncate max-w-full">
                      <Star size={10} className="mr-1 fill-blue-500 text-blue-500 flex-shrink-0" />
                      {formatDate(latestBackup.createdAt)}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Storage Type</p>
                    <p className="text-lg font-bold text-green-600">♾️ Permanent</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                    <Shield size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Info Banner - EXACTLY as original */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start">
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Info size={20} className="text-green-600" />
                </div>
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-green-800">♾️ Permanent Storage - Never Expires</h4>
                <p className="text-sm text-green-700">
                  All backups are stored permanently in your email inbox. 
                  No expiry date, unlimited downloads, available forever.
                </p>
                {latestBackup && (
                  <p className="text-xs text-green-600 mt-1 truncate">
                    ⭐ Latest backup: {latestBackup.fileName} ({formatFileSize(latestBackup.sizeInMB)}) - {formatDate(latestBackup.createdAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons - EXACTLY as original */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creatingBackup ? (
                    <>
                      <RefreshCw size={18} className="animate-spin mr-2" />
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <Database size={18} className="mr-2" />
                      Create & Send Backup
                    </>
                  )}
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh List
                </button>
              </div>
              
              <div className="mt-3 text-xs text-gray-500 flex items-center justify-center flex-wrap gap-4">
                <span className="flex items-center whitespace-nowrap">
                  <Shield size={14} className="mr-1" />
                  Secure
                </span>
                <span className="flex items-center whitespace-nowrap">
                  <Mail size={14} className="mr-1" />
                  Email Delivery
                </span>
                <span className="flex items-center whitespace-nowrap">
                  <CheckCircle size={14} className="mr-1 text-green-500" />
                  No Expiry
                </span>
                <span className="flex items-center whitespace-nowrap">
                  <Download size={14} className="mr-1" />
                  Unlimited Downloads
                </span>
              </div>
            </div>

            {/* Messages - EXACTLY as original */}
            {error && (
              <div className={`px-4 py-3 rounded mb-4 flex items-center ${
                error.includes('ℹ️') 
                  ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                  : error.includes('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {error.includes('ℹ️') ? <AlertCircle size={18} className="mr-2 flex-shrink-0" /> : null}
                {error.includes('✅') ? <CheckCircle size={18} className="mr-2 flex-shrink-0" /> : null}
                <span className="break-words">{error}</span>
              </div>
            )}

            {success && (
              <div className="px-4 py-3 rounded mb-4 bg-green-50 border border-green-200 text-green-700 flex items-center">
                <CheckCircle size={18} className="mr-2 flex-shrink-0" />
                <span className="break-words">{success}</span>
              </div>
            )}

            {/* Backups List - EXACTLY as original */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {refreshing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading backups...</p>
                </div>
              ) : (
                <>
                  {backups.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No backups found</h3>
                      <p className="mt-1 text-sm text-gray-500">Create your first backup using the button above.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View - COMPLETELY UNCHANGED */}
                      {!isMobile ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {backups.map((backup, index) => {
                                const status = getStatusBadge(backup.sizeInMB);
                                const storage = getStorageBadge(backup);
                                const isDeleting = deletingBackup === backup.fileName;
                                const fileIcon = getFileIcon(backup.sizeInMB);
                                const isLatest = backup.isLatest || (index === 0 && backups.length > 0);
                                
                                return (
                                  <tr key={index} className={`hover:bg-gray-50 transition-colors ${isLatest ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-500">{index + 1}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <span className="text-lg mr-2">{fileIcon}</span>
                                        <div className="flex items-center gap-2">
                                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                            {backup.fileName}
                                          </div>
                                          {isLatest && (
                                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                                              <Star size={12} className="mr-1 fill-blue-500 text-blue-500" />
                                              Latest
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {formatFileSize(backup.sizeInMB)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-500">
                                        {formatDate(backup.createdAt)}
                                      </div>
                                      <div className="text-xs text-blue-600 font-medium">
                                        {getRelativeTime(backup.createdAt)}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        🇮🇳 IST
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                                        {status.icon}
                                        {status.label}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex flex-col">
                                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${storage.color}`}>
                                          {storage.icon}
                                          {storage.label}
                                        </span>
                                        {backup.emailRecipient && (
                                          <span className="text-xs text-gray-500 mt-1 truncate max-w-[120px]">
                                            To: {backup.emailRecipient}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => setDeleteModal({ show: true, fileName: backup.fileName })}
                                          disabled={isDeleting}
                                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                                          title="Delete backup"
                                        >
                                          {isDeleting ? (
                                            <>
                                              <RefreshCw size={12} className="animate-spin mr-1" />
                                              Deleting
                                            </>
                                          ) : (
                                            <>
                                              <Trash2 size={12} className="mr-1" />
                                              Delete
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        /* Mobile View - ONLY this changes for mobile */
                        <div className="p-4">
                          {backups.map((backup, index) => (
                            <BackupCard key={index} backup={backup} index={index} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer Info - EXACTLY as original, only added truncate for mobile */}
            <div className="mt-4 text-center text-xs text-gray-500 flex flex-wrap items-center justify-center gap-4">
              <span className="flex items-center whitespace-nowrap">
                <Server size={12} className="mr-1" />
                Database: ebay
              </span>
              <span className="flex items-center whitespace-nowrap">
                <FileArchive size={12} className="mr-1" />
                {backups.length} backup{backups.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center whitespace-nowrap">
                <Shield size={12} className="mr-1" />
                Encrypted
              </span>
              <span className="flex items-center text-green-600 font-medium whitespace-nowrap">
                <CheckCircle size={12} className="mr-1" />
                Never Expires
              </span>
              {latestBackup && (
                <span className="flex items-center text-blue-600 font-medium whitespace-nowrap">
                  <Star size={12} className="mr-1 fill-blue-500 text-blue-500" />
                  <span className="hidden xs:inline">Latest: </span>{formatDate(latestBackup.createdAt)}
                </span>
              )}
            </div>
          </div>
        </main>
      </div>

      <DeleteConfirmationModal
        show={deleteModal.show}
        onClose={() => setDeleteModal({ show: false, fileName: null })}
        onConfirm={() => handleDeleteBackup(deleteModal.fileName)}
        fileName={deleteModal.fileName}
      />
    </div>
  );
};

export default BackupManagement;