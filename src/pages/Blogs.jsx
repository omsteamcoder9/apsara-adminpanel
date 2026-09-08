// src/pages/Blogs.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { blogAPI } from '../api/blog';
import Sidebar from '../components/Sidebar';
import ConfirmationModal from '../components/ConfirmationModal';
import { FaSyncAlt, FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded hover:from-red-600 hover:to-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Blogs = () => {
  const { logout } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    title: ''
  });
  const [isMobile, setIsMobile] = useState(false);
  
  const navigate = useNavigate();

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch ALL blogs
  const fetchBlogs = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      console.log('📡 Fetching blogs...');
      const response = await blogAPI.getAllBlogs({});
      
      console.log('✅ Blogs from API:', response.data.data);
      
      const blogsData = response.data.data || [];
      setBlogs(blogsData);
      setFilteredBlogs(blogsData);
    } catch (err) {
      console.error('❌ Error fetching blogs:', err);
      setError('❌ Failed to fetch blogs');
      setBlogs([]);
      setFilteredBlogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Apply search filter
  useEffect(() => {
    if (!blogs.length) {
      setFilteredBlogs([]);
      return;
    }

    let result = [...blogs];

    if (searchTerm) {
      result = result.filter(blog =>
        blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBlogs(result);
  }, [blogs, searchTerm]);

  // Delete blog function
  const handleDelete = async (blogId, blogTitle) => {
    if (!blogId) return;
    
    try {
      console.log('🗑️ Deleting blog with ID:', blogId);
      await blogAPI.deleteBlog(blogId);
      
      // Remove from state
      const updatedBlogs = blogs.filter(blog => blog._id !== blogId);
      setBlogs(updatedBlogs);
      setFilteredBlogs(updatedBlogs);
      
      // Close modal
      setDeleteModal({ show: false, id: null, title: '' });
      
      // Show success message
      setError('✅ Blog deleted successfully!');
      setTimeout(() => setError(''), 3000);
      
    } catch (err) {
      console.error('❌ Delete error:', err);
      setError(err.response?.data?.message || '❌ Failed to delete blog');
      setDeleteModal({ show: false, id: null, title: '' });
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle create new blog
  const handleCreateNew = () => {
    navigate('/blogs/create');
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchBlogs(true);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mobile Card View Component
  const BlogCard = ({ blog, index }) => {
    const imageUrl = blog.image 
      ? `${import.meta.env.VITE_API_FILE_URL || 'http://localhost:5002'}/uploads/${blog.image}`
      : null;

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
            <div className="flex-shrink-0 h-12 w-12">
              {imageUrl ? (
                <img
                  className="h-12 w-12 rounded-lg object-cover"
                  src={imageUrl}
                  alt={blog.imageAlt || blog.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
              ) : (
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                  <span className="text-xs text-gray-300">No Img</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 truncate max-w-[180px]">
                {blog.title}
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-[180px]">
                {blog.description}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Created Date</p>
            <p className="text-sm text-gray-900">{formatDate(blog.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Blog ID</p>
            <p className="text-xs text-gray-500 font-mono">{blog._id?.substring(0, 8)}...</p>
          </div>
        </div>
        
        <div className="flex space-x-2 pt-3 border-t border-gray-100">
          <Link
            to={`/blogs/edit/${blog._id}`}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center gap-2"
          >
            <FaEdit size={14} />
            <span>Edit</span>
          </Link>
          <button
            onClick={() => {
              setDeleteModal({
                show: true,
                id: blog._id,
                title: blog.title || 'Untitled Blog'
              });
            }}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center gap-2"
          >
            <FaTrash size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 w-full h-screen overflow-y-auto">
          {/* Fixed Header */}
          <header className="bg-white shadow sticky top-0 z-20">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Blog Management</h1>
              </div>
              <div className="flex items-center">
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
                  title="Logout"
                >
                  <span className="hidden sm:inline mr-2">Logout</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col space-y-4">
              {/* Sticky Blogs Header - Fixed below main header */}
              <div 
                className="sticky top-[64px] z-10 bg-white py-3 border-b border-gray-200"
                style={{ 
                  marginLeft: '-1.5rem', 
                  marginRight: '-1.5rem', 
                  paddingLeft: '1.5rem', 
                  paddingRight: '1.5rem'
                }}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
                    All Blog Posts ({filteredBlogs.length})
                  </h2>
                  <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh blogs"
                    >
                      <FaSyncAlt className={`sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                      </span>
                    </button>
                    <button
                      onClick={handleCreateNew}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
                    >
                      <span className="hidden sm:inline mr-2">+</span>
                      <span>Create Post</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error/Success Message */}
              {error && (
                <div className={`px-4 py-3 rounded mb-4 text-sm ${
                  error.includes('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {error}
                </div>
              )}

              {/* Search - This will scroll */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search blogs by title, description, or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Clear Button */}
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Blogs Table/Cards Display */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading blogs...</p>
                  </div>
                ) : filteredBlogs.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {blogs.length === 0 ? 'No blogs found' : 'No results match your search'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {blogs.length === 0 ? 'Create your first blog post!' : 'Try adjusting your search'}
                    </p>
                    {blogs.length === 0 && (
                      <button
                        onClick={handleCreateNew}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors text-sm"
                      >
                        <FaPlus className="mr-2" />
                        Create New Post
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    {!isMobile ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blog Post</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredBlogs.map((blog, index) => {
                              const imageUrl = blog.image 
                                ? `${import.meta.env.VITE_API_FILE_URL || 'http://localhost:5002'}/uploads/${blog.image}`
                                : null;

                              return (
                                <tr key={blog._id} className="hover:bg-gray-50">
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 text-center">{index + 1}</div>
                                  </td>
                                  <td className="px-3 py-4">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-12 w-12">
                                        {imageUrl ? (
                                          <img
                                            className="h-12 w-12 rounded-lg object-cover"
                                            src={imageUrl}
                                            alt={blog.imageAlt || blog.title}
                                            onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                                            }}
                                          />
                                        ) : (
                                          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                            <span className="text-xs text-gray-300">No Img</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="ml-3">
                                        <div className="text-sm font-medium text-gray-900">
                                          {blog.title}
                                        </div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                          {blog.description}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                          ID: {blog._id?.substring(0, 8)}...
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {formatDate(blog.createdAt)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(blog.createdAt).toLocaleTimeString()}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                      <Link
                                        to={`/blogs/edit/${blog._id}`}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded text-xs font-medium flex items-center gap-1"
                                      >
                                        <FaEdit size={12} />
                                        <span>Edit</span>
                                      </Link>
                                      <button
                                        onClick={() => {
                                          setDeleteModal({
                                            show: true,
                                            id: blog._id,
                                            title: blog.title || 'Untitled Blog'
                                          });
                                        }}
                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-xs font-medium flex items-center gap-1"
                                      >
                                        <FaTrash size={12} />
                                        <span>Delete</span>
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
                      /* Mobile View - Card Layout */
                      <div className="p-4">
                        {filteredBlogs.map((blog, index) => (
                          <BlogCard key={blog._id} blog={blog} index={index} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.show}
          onClose={() => setDeleteModal({ show: false, id: null, title: '' })}
          onConfirm={() => handleDelete(deleteModal.id, deleteModal.title)}
          title="Delete Blog Post"
          message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </ErrorBoundary>
  );
};

export default Blogs;