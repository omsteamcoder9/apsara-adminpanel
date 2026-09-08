// src/pages/CustomerPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Trash2,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  RefreshCw,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { adminAPI } from '../api/admin';
import CustomerDetailsModal from '../components/CustomerDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { FaSyncAlt } from 'react-icons/fa';

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

const CustomerPage = () => {
  const { logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGuestToggleModalOpen, setIsGuestToggleModalOpen] = useState(false);
  const [customerToAction, setCustomerToAction] = useState(null);
  const [actionType, setActionType] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch all customers
  const fetchCustomers = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('📡 Fetching customers...');
      const response = await adminAPI.getAllUsers();
      
      let users = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          users = response.data.data;
        } else if (response.data.users && Array.isArray(response.data.users)) {
          users = response.data.users;
        } else if (Array.isArray(response.data)) {
          users = response.data;
        } else {
          const keys = Object.keys(response.data);
          for (const key of keys) {
            if (Array.isArray(response.data[key])) {
              users = response.data[key];
              break;
            }
          }
        }
      } else if (Array.isArray(response)) {
        users = response;
      }
      
      console.log('✅ Fetched users:', users.length, users);
      setCustomers(users);
      setFilteredCustomers(users);
      
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      setCustomers([]);
      setFilteredCustomers([]);
      setError('❌ Failed to fetch customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchCustomers(true);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Search and filter logic
  useEffect(() => {
    let results = customers;

    if (searchTerm) {
      results = results.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType !== 'all') {
      if (selectedType === 'guest') {
        results = results.filter(customer => customer.isGuest);
      } else if (selectedType === 'registered') {
        results = results.filter(customer => !customer.isGuest);
      } else if (selectedType === 'admin') {
        results = results.filter(customer => customer.role === 'admin');
      } else if (selectedType === 'user') {
        results = results.filter(customer => customer.role === 'user');
      }
    }

    setFilteredCustomers(results);
  }, [searchTerm, selectedType, customers]);

  // Handle customer deletion
  const handleDelete = async () => {
    if (!customerToAction) return;
    
    try {
      console.log('Sending delete request for ID:', customerToAction._id);
      const response = await adminAPI.deleteUser(customerToAction._id);
      console.log('Delete response:', response);
      
      if (response.status === 200 || response.status === 204 || response.data?.success) {
        setCustomers(prev => prev.filter(c => c._id !== customerToAction._id));
        setFilteredCustomers(prev => prev.filter(c => c._id !== customerToAction._id));
        
        setIsDeleteModalOpen(false);
        setCustomerToAction(null);
        
        setError('✅ Customer deleted successfully!');
        setTimeout(() => setError(''), 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(`❌ Failed to delete customer: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle guest status toggle
  const handleGuestToggle = async () => {
    if (!customerToAction) return;

    try {
      await adminAPI.editUser(customerToAction._id, { 
        isGuest: !customerToAction.isGuest 
      });
      
      setCustomers(prev => prev.map(c => 
        c._id === customerToAction._id 
          ? { ...c, isGuest: !c.isGuest }
          : c
      ));
      setFilteredCustomers(prev => prev.map(c => 
        c._id === customerToAction._id 
          ? { ...c, isGuest: !c.isGuest }
          : c
      ));
      setIsGuestToggleModalOpen(false);
      setCustomerToAction(null);
      
      setError('✅ Customer status updated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error updating guest status:', error);
      setError('❌ Failed to update customer status');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Open modals
  const openDeleteModal = (customer) => {
    setCustomerToAction(customer);
    setIsDeleteModalOpen(true);
  };

  const openGuestToggleModal = (customer) => {
    setCustomerToAction(customer);
    setActionType(customer.isGuest ? 'makeRegistered' : 'makeGuest');
    setIsGuestToggleModalOpen(true);
  };

  const openDetailsModal = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  // Get user type badge
  const getUserTypeBadge = (isGuest) => {
    if (isGuest) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <User className="w-3 h-3 mr-1" />
          Guest
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200">
        <Users className="w-3 h-3 mr-1" />
        Registered
      </span>
    );
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin' },
      user: { bg: 'bg-green-100', text: 'text-green-800', label: 'User' },
      guest: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Guest' }
    };
    
    const config = roleConfig[role] || roleConfig.user;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Shield className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
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

  // Clear all filters
  const clearFilters = () => {
    setSelectedType('all');
    setSearchTerm('');
  };

  // Get filter label
  const getFilterLabel = () => {
    switch (selectedType) {
      case 'all': return 'All Users';
      case 'registered': return 'Registered';
      case 'guest': return 'Guest';
      case 'admin': return 'Admins';
      case 'user': return 'Regular Users';
      default: return 'Filter';
    }
  };

  // Mobile Card View Component
  const CustomerCard = ({ customer, index }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {customer.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {customer.name || 'Unnamed User'}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              {getUserTypeBadge(customer.isGuest)}
              {getRoleBadge(customer.role)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="text-sm text-gray-900 truncate">{customer.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Phone</p>
          <p className="text-sm text-gray-900">{customer.phone || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Joined</p>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="w-3 h-3" />
            {formatDate(customer.createdAt)}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">User ID</p>
          <p className="text-xs text-gray-500 font-mono">{customer._id?.substring(0, 8)}...</p>
        </div>
      </div>
      
      <div className="flex space-x-2 pt-3 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            openGuestToggleModal(customer);
          }}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center gap-2"
        >
          {customer.isGuest ? (
            <>
              <Users size={16} />
              <span>Make Registered</span>
            </>
          ) : (
            <>
              <User size={16} />
              <span>Make Guest</span>
            </>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDeleteModal(customer);
          }}
          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center gap-2"
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex-1 w-full h-screen overflow-y-auto">
          {/* Fixed Header */}
          <header className="bg-white shadow sticky top-0 z-20">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Customers Management</h1>
              </div>
              <div className="flex items-center">
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

          <main className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col space-y-4">
              {/* Sticky Customers Header - Fixed below main header */}
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
                    All Customers ({filteredCustomers.length})
                  </h2>
                  <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh customers"
                    >
                      <FaSyncAlt className={`sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                      </span>
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

              {/* Search and Filter - This will scroll */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search customers by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative w-full sm:w-48">
                    <button
                      onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
                    >
                      <span className="truncate">
                        <Filter className="inline mr-2 text-slate-400" size={14} />
                        {getFilterLabel()}
                      </span>
                      <svg className={`w-4 h-4 ml-2 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {filterDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <button
                          onClick={() => { setSelectedType('all'); setFilterDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          All Users
                        </button>
                        <button
                          onClick={() => { setSelectedType('registered'); setFilterDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          <Users size={14} className="inline mr-2 text-blue-500" />
                          Registered
                        </button>
                        <button
                          onClick={() => { setSelectedType('guest'); setFilterDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          <User size={14} className="inline mr-2 text-purple-500" />
                          Guest
                        </button>
                        <div className="border-t my-1"></div>
                        <button
                          onClick={() => { setSelectedType('admin'); setFilterDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          <Shield size={14} className="inline mr-2 text-red-500" />
                          Admins
                        </button>
                        <button
                          onClick={() => { setSelectedType('user'); setFilterDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          <Users size={14} className="inline mr-2 text-green-500" />
                          Regular Users
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Clear Button */}
                  {(selectedType !== 'all' || searchTerm) && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Table/Cards Display */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {customers.length === 0 ? 'No customers found' : 'No results match your search'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {customers.length === 0 ? 'Try refreshing the page' : 'Try adjusting your search or filter'}
                    </p>
                    {customers.length === 0 && (
                      <button
                        onClick={handleRefresh}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <RefreshCw size={16} className="mr-2" />
                        Refresh
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
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCustomers.map((customer, index) => (
                              <tr 
                                key={customer._id} 
                                className="hover:bg-slate-50 transition-colors cursor-pointer"
                                onClick={() => openDetailsModal(customer)}
                              >
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 text-center">{index + 1}</div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                      {customer.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-800 text-sm">{customer.name || 'Unnamed User'}</p>
                                      <p className="text-xs text-slate-500">ID: {customer._id?.substring(0, 8)}...</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3 h-3 text-slate-400" />
                                      <span className="text-sm truncate max-w-[150px]">{customer.email}</span>
                                    </div>
                                    {customer.phone ? (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3 text-slate-400" />
                                        <span className="text-sm">{customer.phone}</span>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-slate-400">No phone</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(customer.createdAt)}
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  {getUserTypeBadge(customer.isGuest)}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap">
                                  {getRoleBadge(customer.role)}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openGuestToggleModal(customer);
                                      }}
                                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded text-xs font-medium"
                                    >
                                      {customer.isGuest ? 'Make Reg.' : 'Make Guest'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(customer);
                                      }}
                                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded text-xs font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Mobile View - Card Layout */
                      <div className="p-4">
                        {filteredCustomers.map((customer, index) => (
                          <div 
                            key={customer._id}
                            onClick={() => openDetailsModal(customer)}
                            className="cursor-pointer"
                          >
                            <CustomerCard customer={customer} index={index} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>

          {/* Customer Details Modal */}
          {isDetailsModalOpen && selectedCustomer && (
            <CustomerDetailsModal
              customer={selectedCustomer}
              onClose={() => setIsDetailsModalOpen(false)}
              onGuestToggle={openGuestToggleModal}
              onDelete={openDeleteModal}
            />
          )}

          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && customerToAction && (
            <ConfirmationModal
              isOpen={isDeleteModalOpen}
              title="Delete Customer"
              message={`Are you sure you want to delete ${customerToAction.name}? This action cannot be undone.`}
              confirmText="Delete"
              cancelText="Cancel"
              onConfirm={handleDelete}
              onClose={() => {
                setIsDeleteModalOpen(false);
                setCustomerToAction(null);
              }}
              onCancel={() => {
                setIsDeleteModalOpen(false);
                setCustomerToAction(null);
              }}
              type="danger"
            />
          )}

          {/* Guest/Registered Toggle Modal */}
          {isGuestToggleModalOpen && customerToAction && (
            <ConfirmationModal
              isOpen={isGuestToggleModalOpen}
              title={actionType === 'makeGuest' ? 'Convert to Guest User' : 'Convert to Registered User'}
              message={`Are you sure you want to convert ${customerToAction.name} to ${actionType === 'makeGuest' ? 'a guest user' : 'a registered user'}?`}
              confirmText={actionType === 'makeGuest' ? 'Make Guest' : 'Make Registered'}
              cancelText="Cancel"
              onConfirm={handleGuestToggle}
              onClose={() => {
                setIsGuestToggleModalOpen(false);
                setCustomerToAction(null);
              }}
              onCancel={() => {
                setIsGuestToggleModalOpen(false);
                setCustomerToAction(null);
              }}
              type={actionType === 'makeGuest' ? 'warning' : 'info'}
              icon={actionType === 'makeGuest' ? <User className="w-6 h-6 text-yellow-600" /> : <Users className="w-6 h-6 text-blue-600" />}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CustomerPage;