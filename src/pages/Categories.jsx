// src/pages/Categories.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddCategoryModal from '../components/AddCategoryModal';
import EditCategoryModal from '../components/EditCategoryModal';
import { categoriesAPI } from '../api/categories';
import { FaEdit, FaTrash, FaPlus, FaSignOutAlt, FaSyncAlt, FaSearch, FaFilter } from 'react-icons/fa';

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

const Categories = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchCategories = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('📡 Fetching categories...');
      const response = await categoriesAPI.getAllCategories();
      console.log('✅ Categories response:', response.data);
      
      let categoriesArray = [];
      const data = response.data;
      
      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        categoriesArray = data.data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categoriesArray = data.categories;
      } else {
        throw new Error('Unexpected response format');
      }

      setCategories(categoriesArray);
      setFilteredCategories(categoriesArray);
      setError('');
      console.log(`✅ Loaded ${categoriesArray.length} categories`);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message || 'Failed to load categories');
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Apply search and sorting
  useEffect(() => {
    if (!categories.length) {
      setFilteredCategories([]);
      return;
    }

    let results = [...categories];

    if (searchTerm) {
      results = results.filter(category =>
        category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    results.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.createdAt || b.updatedAt || 0);
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setFilteredCategories(results);
  }, [searchTerm, sortOrder, categories]);

  const handleRefresh = () => {
    fetchCategories(true);
  };

  const handleAddCategory = async (categoryData) => {
    try {
      console.log('🔄 Adding category...');
      const response = await categoriesAPI.createCategory(categoryData);
      console.log('✅ Category added:', response.data);
      
      const newCategories = [...categories, response.data.data];
      setCategories(newCategories);
      setFilteredCategories(newCategories);
      setIsModalOpen(false);
      setError('✅ Category added successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error adding category:', error);
      setError(error.response?.data?.message || 'Failed to add category');
    }
  };

  const handleEditCategory = async (categoryId, categoryData) => {
    try {
      console.log('🔄 Updating category:', categoryId);
      const response = await categoriesAPI.updateCategory(categoryId, categoryData);
      console.log('✅ Category updated:', response.data);
      
      const updatedCategories = categories.map(cat => 
        cat._id === categoryId ? response.data.data : cat
      );
      setCategories(updatedCategories);
      setFilteredCategories(updatedCategories);
      setIsEditModalOpen(false);
      setEditingCategory(null);
      setError('✅ Category updated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error updating category:', error);
      setError(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      console.log('🗑️ Deleting category:', id);
      await categoriesAPI.deleteCategory(id);
      console.log('✅ Category deleted');
      
      const remainingCategories = categories.filter(cat => cat._id !== id);
      setCategories(remainingCategories);
      setFilteredCategories(remainingCategories);
      setError('✅ Category deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete category';
      setError(errorMsg);
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingCategory(null);
    setIsEditModalOpen(false);
  };

  const categoriesToRender = Array.isArray(filteredCategories) ? filteredCategories : [];

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSortOrder('newest');
  };

  // Mobile Card View Component
  const CategoryCard = ({ category, index }) => {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {category.name}
              </h3>
              <p className="text-xs text-gray-500">Slug: {category.slug}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ 
            category.status === 'active' 
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {category.status || 'active'}
          </span>
        </div>
        
        <div className="mb-3">
          <p className="text-xs text-gray-500">Description</p>
          <p className="text-sm text-gray-700">{category.description || 'No description'}</p>
        </div>
        
        {/* Actions */}
        {isAdmin && (
          <div className="flex space-x-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => openEditModal(category)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteCategory(category._id)}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        {/* Main content area with scroll */}
        <div className="flex-1 w-full h-screen overflow-y-auto">
          {/* Fixed Header */}
          <header className="bg-white shadow sticky top-0 z-20">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Categories Management</h1>
              </div>
              <div className="flex items-center">
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
                  title="Logout"
                >
                  <span className="hidden sm:inline mr-2">Logout</span>
                  <FaSignOutAlt />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-4 sm:p-6 ">
            <div className="mb-6 flex flex-col space-y-4 ">
              {/* Sticky Categories Header - Fixed below main header */}
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
                    All Categories ({categoriesToRender.length})
                  </h2>
                  <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                    <button
                      onClick={handleRefresh}
                      disabled={loading || refreshing}
                      className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh categories"
                    >
                      <FaSyncAlt className={`sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                      </span>
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
                      >
                        <span className="hidden sm:inline mr-2">+</span>
                        <span>Add Category</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Search and Filter - This will scroll */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Sort Filter */}
                  <div className="relative w-full sm:w-48">
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>

                  {/* Clear Button - Shows only when filters active */}
                  {(searchTerm || sortOrder !== 'newest') && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className={`px-4 py-3 rounded mb-4 text-sm ${ 
                  error.includes('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {error}
                </div>
              )}

              {/* Categories Display - This will scroll */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading categories...</p>
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
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              {isAdmin && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {categoriesToRender.length > 0 ? (
                              categoriesToRender.map((category, index) => (
                                <tr key={category._id} className="hover:bg-gray-50">
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 text-center">{index + 1}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{category.slug}</div>
                                  </td>
                                  <td className="px-3 py-4">
                                    <div className="text-sm text-gray-500 truncate max-w-[200px]">{category.description || 'No description'}</div>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      category.status === 'active' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {category.status || 'active'}
                                    </span>
                                  </td>
                                  {isAdmin && (
                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex space-x-2">
                                        <button onClick={() => openEditModal(category)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded text-xs font-medium">Edit</button>
                                        <button onClick={() => handleDeleteCategory(category._id)} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded text-xs font-medium">Delete</button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={isAdmin ? "6" : "5"} className="px-6 py-8 text-center text-gray-500">
                                  No categories found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Mobile Card View */
                      <div className="p-4">
                        {categoriesToRender.length > 0 ? (
                          categoriesToRender.map((category, index) => (
                            <CategoryCard key={category._id} category={category} index={index} />
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">No categories found</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>

          {/* Add Category Modal */}
          <AddCategoryModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAddCategory={handleAddCategory}
          />

          {/* Edit Category Modal */}
          <EditCategoryModal 
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            onEditCategory={handleEditCategory}
            category={editingCategory}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Categories;