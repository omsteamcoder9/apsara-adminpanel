// src/pages/Products.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddProductModal from '../components/AddProductModal';
import EditProductModal from '../components/EditProductModal';
import { productsAPI } from '../api/products';
import { categoriesAPI } from '../api/categories';
import { FaSignOutAlt, FaSortAmountDown, FaSortAmountUp, FaSyncAlt, FaSearch } from 'react-icons/fa';
import { Layers } from 'lucide-react';

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

const Products = () => {
  const { isAdmin, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting State - Default 'newest'
  const [sortOption, setSortOption] = useState('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  const API_FILE_URL = import.meta.env.VITE_API_FILE_URL || 'http://localhost:5002';

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      console.log('📡 Fetching categories...');
      const response = await categoriesAPI.getAllCategories();
      console.log('✅ Categories response:', response.data);
      
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.data)) {
          setCategories(response.data.data);
          console.log(`✅ Loaded ${response.data.data.length} categories`);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
    }
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📡 Fetching products from API...');
      
      const response = await productsAPI.getAllProducts();
      
      console.log('✅ API Response:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: Object.keys(response.data || {}),
        success: response.data?.success,
        count: response.data?.count
      });
      
      let productsArray = [];
      
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.data)) {
          productsArray = response.data.data;
          console.log(`✅ Found ${productsArray.length} products in response.data.data`);
        } 
        else if (Array.isArray(response.data.products)) {
          productsArray = response.data.products;
          console.log(`✅ Found ${productsArray.length} products in response.data.products`);
        }
        else if (Array.isArray(response.data)) {
          productsArray = response.data;
          console.log(`✅ Found ${productsArray.length} products in response.data (direct array)`);
        }
      }
      
      console.log(`📊 Total products to render: ${productsArray.length}`);
      
      if (productsArray.length > 0) {
        const firstProduct = productsArray[0];
        console.log('🔍 First product structure:', {
          id: firstProduct._id,
          name: firstProduct.name,
          stock: firstProduct.stock,
          seller: firstProduct.seller,
          hasImages: !!firstProduct.images,
          imageCount: firstProduct.images?.length || 0,
          imagePath: firstProduct.images?.[0]?.image,
          hasVariants: !!firstProduct.variants,
          variantCount: firstProduct.variants?.length || 0,
          category: firstProduct.category,
          createdAt: firstProduct.createdAt
        });
      }
      
      setProducts(productsArray);
      
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setError(error.response?.data?.message || 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch both products and categories on mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Apply search, sorting, and filtering
  useEffect(() => {
    if (!products.length) {
      setFilteredProducts([]);
      return;
    }

    let result = [...products];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.seller?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category && typeof product.category === 'object' && product.category.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(product => {
        const categoryId = typeof product.category === 'string' 
          ? product.category 
          : product.category?._id;
        return categoryId === selectedCategory;
      });
    }

    // Apply sorting - Newest First is default
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'price-low':
          return (parseFloat(a.basePrice) || 0) - (parseFloat(b.basePrice) || 0);
        case 'price-high':
          return (parseFloat(b.basePrice) || 0) - (parseFloat(a.basePrice) || 0);
        case 'stock-low':
          return (getTotalStock(a) || 0) - (getTotalStock(b) || 0);
        case 'stock-high':
          return (getTotalStock(b) || 0) - (getTotalStock(a) || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(result);
  }, [products, searchTerm, sortOption, selectedCategory]);

  // Helper function to get category name
  const getCategoryName = (product) => {
    if (!product.category) return 'N/A';
    
    if (typeof product.category === 'string') {
      const foundCategory = categories.find(cat => cat._id === product.category);
      return foundCategory ? foundCategory.name : 'Category';
    }
    
    if (typeof product.category === 'object' && product.category !== null) {
      if (product.category.name) {
        return product.category.name;
      }
      if (product.category._id) {
        const foundCategory = categories.find(cat => cat._id === product.category._id);
        return foundCategory ? foundCategory.name : 'Category';
      }
    }
    
    return 'N/A';
  };

  // ✅ UPDATED: Get product image - supports both local and R2 URLs
// ✅ FIXED: Get product image - supports both local and R2 URLs
// ✅ UPDATED: Get product image - supports all URL formats
// ✅ DEBUG VERSION - Add this temporarily
const getProductImage = (product) => {
  if (!product) {
    console.log('❌ No product provided');
    return null;
  }
  
  console.log('🖼️ Getting image for:', product.name);
  console.log('📊 Product data:', {
    images: product.images,
    ogImage: product.ogImage,
    variants: product.variants?.length
  });
  
  // ✅ Check main images FIRST
  if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    const imagePath = firstImage?.image || firstImage;
    
    console.log('📸 Main image path:', imagePath);
    
    if (imagePath) {
      // ✅ If it's already a full URL (R2)
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.log('✅ R2 URL detected, returning:', imagePath);
        return imagePath;
      }
      
      // ✅ If it's a local path
      if (imagePath.startsWith('/uploads/')) {
        const fullUrl = `${API_FILE_URL}${imagePath}`;
        console.log('📁 Local image URL:', fullUrl);
        return fullUrl;
      }
      
      // ✅ If it's just a filename
      if (!imagePath.startsWith('/')) {
        const fullUrl = `${API_FILE_URL}/uploads/${imagePath}`;
        console.log('📁 Filename only, using:', fullUrl);
        return fullUrl;
      }
      
      console.log('⚠️ Unknown format, returning as is:', imagePath);
      return imagePath;
    }
  }
  
  // ✅ Check OG Image as fallback
  if (product.ogImage) {
    const imagePath = product.ogImage;
    console.log('🖼️ Using OG Image:', imagePath);
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads/')) {
      return `${API_FILE_URL}${imagePath}`;
    }
    return imagePath;
  }
  
  // ✅ Check variants as last resort
  if (product.variants && product.variants.length > 0) {
    const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
    if (defaultVariant?.images && defaultVariant.images.length > 0) {
      const imagePath = defaultVariant.images[0]?.image || defaultVariant.images[0];
      console.log('📸 Variant image:', imagePath);
      
      if (imagePath) {
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          return imagePath;
        }
        if (imagePath.startsWith('/uploads/')) {
          return `${API_FILE_URL}${imagePath}`;
        }
        return imagePath;
      }
    }
  }
  
  console.log('❌ No image found for:', product.name);
  return null;
};
  const handleAddProduct = async (productData) => {
    try {
      console.log('🔄 handleAddProduct called');
      
      const requiredFields = ['name', 'basePrice', 'description', 'seller', 'category'];
      const missingFields = [];
      
      requiredFields.forEach(field => {
        const value = productData.get(field);
        if (!value || value.trim() === '') {
          missingFields.push(field);
        }
      });
      
      const mainStock = productData.get('stock');
      
      if (!mainStock || parseInt(mainStock) <= 0) {
        missingFields.push('stock');
      }
      
      if (missingFields.length > 0) {
        const errorMsg = `❌ Missing required fields: ${missingFields.join(', ')}`;
        setError(errorMsg);
        console.error('Missing fields:', missingFields);
        return;
      }

      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      if (!isAdmin) {
        setError('Admin privileges required');
        return;
      }

      console.log('📤 Sending to API...');
      
      const response = await productsAPI.createProduct(productData);
      
      console.log('🔍 FULL API RESPONSE:', response);
      
      let newProduct;
      
      if (response.data && response.data.product) {
        newProduct = response.data.product;
      } else if (response.data && response.data.data) {
        newProduct = response.data.data;
      } else if (response.data) {
        newProduct = response.data;
      }
      
      console.log('🔍 Extracted newProduct:', newProduct);
      
      if (newProduct && newProduct._id) {
        if (typeof newProduct.category === 'string') {
          const categoryId = newProduct.category;
          const foundCategory = categories.find(cat => cat._id === categoryId);
          
          if (foundCategory) {
            newProduct.category = foundCategory;
            console.log('✅ Replaced category ID with category object:', foundCategory.name);
          } else {
            newProduct.category = {
              _id: categoryId,
              name: 'Category'
            };
            console.log('⚠️ Category not found in list, using temporary object');
          }
        }
        
        newProduct.createdAt = new Date().toISOString();
        
        setProducts(prevProducts => [newProduct, ...prevProducts]);
        setIsModalOpen(false);
        
        setError('✅ Product added successfully!');
        setTimeout(() => setError(''), 3000);
      } else {
        console.error('❌ Invalid product data in response:', newProduct);
        setError('❌ Product was created but could not display it immediately');
        fetchProducts();
      }
      
    } catch (error) {
      console.error('❌ Error in handleAddProduct:', error);
      
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        if (error.response.status === 400) {
          const errorMsg = error.response.data?.message || 'Bad Request - Check required fields';
          const missingFields = error.response.data?.missingFields || [];
          
          if (missingFields.length > 0) {
            setError(`❌ Missing: ${missingFields.join(', ')}`);
          } else {
            setError(`❌ ${errorMsg}`);
          }
        } else if (error.response.status === 404) {
          setError('❌ API endpoint not found. Check backend routes.');
        } else if (error.response.status === 401) {
          setError('❌ Unauthorized. Please login again.');
        } else if (error.response.status === 403) {
          setError('❌ Access forbidden. Admin privileges required.');
        } else {
          setError(`❌ ${error.response.data?.message || 'Failed to add product'}`);
        }
      } else if (error.request) {
        setError('❌ Cannot connect to server. Make sure backend is running.');
      } else {
        setError(`❌ ${error.message || 'Failed to add product'}`);
      }
    }
  };

  const handleEditProduct = async (productId, productData) => {
    try {
      console.log('🔄 handleEditProduct called for product:', productId);

      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      if (!isAdmin) {
        setError('Admin privileges required');
        return;
      }

      console.log('📤 Sending update to API...');
      
      const response = await productsAPI.updateProduct(productId, productData);
      
      console.log('🔍 FULL EDIT API RESPONSE:', response);
      
      let updatedProduct;
      
      if (response.data && response.data.product) {
        updatedProduct = response.data.product;
      } else if (response.data && response.data.data) {
        updatedProduct = response.data.data;
      } else if (response.data) {
        updatedProduct = response.data;
      }
      
      console.log('🔍 Extracted updatedProduct:', updatedProduct);
      
      if (updatedProduct && updatedProduct._id) {
        if (typeof updatedProduct.category === 'string') {
          const categoryId = updatedProduct.category;
          const foundCategory = categories.find(cat => cat._id === categoryId);
          
          if (foundCategory) {
            updatedProduct.category = foundCategory;
          } else {
            updatedProduct.category = {
              _id: categoryId,
              name: 'Category'
            };
          }
        }
        
        const existingProduct = products.find(p => p._id === productId);
        if (existingProduct?.createdAt) {
          updatedProduct.createdAt = existingProduct.createdAt;
        }
        
        setProducts(prevProducts => 
          prevProducts.map(product => {
            if (product._id === productId) {
              return {
                ...product,
                ...updatedProduct,
                stock: updatedProduct.stock !== undefined ? updatedProduct.stock : product.stock,
                seller: updatedProduct.seller !== undefined ? updatedProduct.seller : product.seller
              };
            }
            return product;
          })
        );
        
        setIsEditModalOpen(false);
        setEditingProduct(null);
        
        setError('✅ Product updated successfully!');
        setTimeout(() => setError(''), 3000);
      } else {
        console.error('❌ Invalid updated product data:', updatedProduct);
        setError('❌ Product was updated but could not display changes immediately');
      }
      
    } catch (error) {
      console.error('❌ Error in handleEditProduct:', error);
      
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        if (error.response.status === 404) {
          setError('❌ Product not found or API endpoint not found.');
        } else if (error.response.status === 401) {
          setError('❌ Unauthorized. Please login again.');
        } else if (error.response.status === 403) {
          setError('❌ Access forbidden. Admin privileges required.');
        } else {
          setError(`❌ ${error.response.data.message || 'Failed to update product'}`);
        }
      } else if (error.request) {
        setError('❌ Cannot connect to server. Make sure backend is running.');
      } else {
        setError(`❌ ${error.message || 'Failed to update product'}`);
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      console.log('Deleting product:', id);
      
      const response = await productsAPI.deleteProduct(id);
      
      console.log('Product deleted successfully:', response.data);

      setProducts(prevProducts => prevProducts.filter(product => product._id !== id));
      
      setError('✅ Product deleted successfully!');
      setTimeout(() => setError(''), 3000);
      
    } catch (error) {
      console.error('Error deleting product:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to delete product';
      
      setError(`❌ ${errorMessage}`);
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setIsEditModalOpen(false);
  };

  // Helper functions
  const getTotalStock = (product) => {
    return product.stock || 0;
  };

  const getSellerName = (product) => {
    return product.seller || 'N/A';
  };

  const getPriceDisplay = (product) => {
    return product.basePrice || product.price || '0';
  };

  // Check if product has variants
  const hasVariants = (product) => {
    return product.variants && product.variants.length > 0;
  };

  // Get variant count
  const getVariantCount = (product) => {
    return product.variants?.length || 0;
  };

  // Get sort button label based on current option
  const getSortLabel = () => {
    switch (sortOption) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'name-asc': return 'Name (A to Z)';
      case 'name-desc': return 'Name (Z to A)';
      case 'price-low': return 'Price (Low to High)';
      case 'price-high': return 'Price (High to Low)';
      case 'stock-low': return 'Stock (Low to High)';
      case 'stock-high': return 'Stock (High to Low)';
      default: return 'Sort';
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory('all');
    setSortOption('newest');
    setSearchTerm('');
  };

  // Safe rendering
  const productsToRender = Array.isArray(filteredProducts) ? filteredProducts : [];

  // Mobile Card View Component
  const ProductCard = ({ product, index }) => {
    const totalStock = getTotalStock(product);
    const categoryName = getCategoryName(product);
    const sellerName = getSellerName(product);
    const priceDisplay = getPriceDisplay(product);
    const productImage = getProductImage(product);
    const hasVariants = product.variants && product.variants.length > 0;
    const variantCount = getVariantCount(product);
    
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                {product.description}
              </p>
              {hasVariants && (
                <span className="inline-flex items-center mt-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                  <Layers size={12} className="mr-1" />
                  {variantCount} Variants
                </span>
              )}
            </div>
          </div>
          
          {/* Status Badge */}
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ 
            product.status === 'active' 
              ? 'bg-green-100 text-green-800'
              : product.status === 'inactive'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {product.status || 'active'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-sm font-semibold text-gray-900">₹{priceDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Stock</p>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ 
              totalStock > 10 
                ? 'bg-green-100 text-green-800' 
                : totalStock > 0 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {totalStock} in stock
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Seller</p>
            <p className="text-sm text-gray-900 truncate">{sellerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="text-sm text-gray-900 truncate">{categoryName}</p>
          </div>
        </div>
        
        {/* Image Section */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">
            {hasVariants ? 'Variant Image' : 'Product Image'}
          </p>
          <div className="flex flex-wrap gap-2">
            {productImage ? (
              <img 
                src={productImage}
                alt={product.name}
                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"><span class="text-xs text-gray-300">No Image</span></div>';
                }}
              />
            ) : (
              <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-xs text-gray-300">No Image</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {isAdmin && (
          <div className="flex space-x-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => openEditModal(product)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteProduct(product._id)}
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
                <h1 className="text-xl font-bold text-gray-800">Products Management</h1>
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
              {/* Sticky Product Header */}
            <div className="sticky top-[64px] z-10 bg-white py-3 border-b border-gray-200" style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
    <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
      All Products ({productsToRender.length})
    </h2>
    <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
      <button
        onClick={fetchProducts}
        disabled={loading}
        className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refresh products"
      >
        <FaSyncAlt className={`sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">
          {loading ? 'Refreshing...' : 'Refresh'}
        </span>
      </button>
      {isAdmin && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
        >
          <span className="hidden sm:inline mr-2">+</span>
          <span>Add Product</span>
        </button>
      )}
    </div>
  </div>
</div>

              {/* Search and Filter */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="relative w-full sm:w-48">
                    <button
                      onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
                    >
                      <span className="truncate">
                        {selectedCategory === 'all' ? 'All Categories' : categories.find(c => c._id === selectedCategory)?.name || 'Category'}
                      </span>
                      <svg className={`w-4 h-4 ml-2 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {filterDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <button
                          onClick={() => { setSelectedCategory('all'); setFilterDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          All Categories
                        </button>
                        {categories.map(category => (
                          <button
                            key={category._id}
                            onClick={() => { setSelectedCategory(category._id); setFilterDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative w-full sm:w-40">
                    <button
                      onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
                    >
                      <div className="flex items-center">
                        <FaSortAmountDown className="mr-2 text-gray-400" />
                        <span className="truncate">{getSortLabel()}</span>
                      </div>
                      <svg className={`w-4 h-4 ml-2 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {sortDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <button onClick={() => { setSortOption('newest'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                          <FaSortAmountDown className="inline mr-2" /> Newest First
                        </button>
                        <button onClick={() => { setSortOption('oldest'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                          <FaSortAmountUp className="inline mr-2" /> Oldest First
                        </button>
                        <div className="border-t my-1"></div>
                        <button onClick={() => { setSortOption('name-asc'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Name (A to Z)</button>
                        <button onClick={() => { setSortOption('name-desc'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Name (Z to A)</button>
                        <div className="border-t my-1"></div>
                        <button onClick={() => { setSortOption('price-low'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Price (Low to High)</button>
                        <button onClick={() => { setSortOption('price-high'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Price (High to Low)</button>
                        <div className="border-t my-1"></div>
                        <button onClick={() => { setSortOption('stock-low'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Stock (Low to High)</button>
                        <button onClick={() => { setSortOption('stock-high'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Stock (High to Low)</button>
                      </div>
                    )}
                  </div>

                  {/* Clear Button */}
                  {(selectedCategory !== 'all' || sortOption !== 'newest' || searchTerm) && (
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

              {/* Products Display */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading products...</p>
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
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              {isAdmin && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {productsToRender.length > 0 ? (
                              productsToRender.map((product, index) => {
                                const totalStock = getTotalStock(product);
                                const categoryName = getCategoryName(product);
                                const sellerName = getSellerName(product);
                                const priceDisplay = getPriceDisplay(product);
                                const productImage = getProductImage(product);
                                const hasVariants = product.variants && product.variants.length > 0;
                                const variantCount = getVariantCount(product);
                                
                                return (
                                  <tr key={product._id} className="hover:bg-gray-50">
                                    <td className="px-3 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 text-center">{index + 1}</div></td>
<td className="px-3 py-4 whitespace-nowrap">
  <div className="flex items-center justify-center">
    {productImage ? (
      <img 
        src={productImage} 
        alt={product.name} 
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover border border-gray-200"
        onError={(e) => {
          console.log('❌ Image failed to load:', e.target.src);
          e.target.style.display = 'none';
          const parent = e.target.parentNode;
          if (parent) {
            parent.innerHTML = `<div class="h-10 w-10 sm:h-12 sm:w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
              <span class="text-xs text-gray-400">No Image</span>
            </div>`;
          }
        }}
      />
    ) : (
      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
        <span className="text-xs text-gray-400">No Image</span>
      </div>
    )}
  </div>
</td>


                                    <td className="px-3 py-4">
                                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div>
                                      {hasVariants && (
                                        <span className="inline-flex items-center mt-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                          <Layers size={12} className="mr-1" />
                                          {variantCount} Variants
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-3 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">₹{priceDisplay}</div></td>
                                    <td className="px-3 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{categoryName}</div></td>
                                    <td className="px-3 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${totalStock > 10 ? 'bg-green-100 text-green-800' : totalStock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{totalStock} in stock</span></td>
                                    <td className="px-3 py-4 whitespace-nowrap"><div className="text-sm text-gray-500 truncate max-w-[100px]">{sellerName}</div></td>
                                    <td className="px-3 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{product.status || 'active'}</span></td>
                                    {isAdmin && (
                                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                          <button onClick={() => openEditModal(product)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded text-xs font-medium">Edit</button>
                                          <button onClick={() => handleDeleteProduct(product._id)} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded text-xs font-medium">Delete</button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })
                            ) : (
                              <tr><td colSpan={isAdmin ? "9" : "8"} className="px-6 py-8 text-center text-gray-500">No products found</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4">
                        {productsToRender.length > 0 ? productsToRender.map((product, index) => <ProductCard key={product._id} product={product} index={index} />) : <div className="text-center py-8 text-gray-500">No products found</div>}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>

          {/* Add Product Modal */}
          <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddProduct={handleAddProduct} />

          {/* Edit Product Modal */}
          <EditProductModal isOpen={isEditModalOpen} onClose={closeEditModal} onEditProduct={handleEditProduct} product={editingProduct} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Products;