// src/pages/OrdersPage.jsx - Mobile Responsive Fix with Refresh Text
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ordersAPI } from '../api/orders';
import { paymentsAPI } from '../api/payments';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Search, Filter } from 'lucide-react';
import { FaSyncAlt, FaTag, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';

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

const OrdersPage = () => {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundStatus, setRefundStatus] = useState({});
  const [activeRefundOrderId, setActiveRefundOrderId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState({});
  const [userRole, setUserRole] = useState('admin');
  const [isMobile, setIsMobile] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, orderId: null, orderNumber: null });
  
  // Filtering States
  const [sortOption, setSortOption] = useState('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Ref to prevent double API calls
  const hasFetched = useRef(false);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status', icon: '📋' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'confirmed', label: 'Confirmed', icon: '✅' },
    { value: 'processing', label: 'Processing', icon: '⚙️' },
    { value: 'shipped', label: 'Shipped', icon: '🚚' },
    { value: 'delivered', label: 'Delivered', icon: '📦' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' }
  ];

  // ===== MOVED THESE FUNCTIONS HERE - ABOVE useMemo =====
  const getCustomerInfo = (order) => {
    const name = order.customer?.name || order.user?.name || order.customerName || order.guestUser?.name;
    const email = order.customer?.email || order.user?.email || order.customerEmail || order.guestUser?.email || order.email;
    const phone = order.customer?.phone || order.user?.phone || order.phoneNumber || order.guestUser?.phone;
    const isGuest = !order.customer?.name && !order.user?.name;
    return { name, email, phone, isGuest };
  };

  const getOrderId = (order) => {
    if (!order) return null;
    if (order.receipt) {
      return order.receipt.receiptNumber || order.receipt._id || order.receipt.orderId || order.receipt.id;
    }
    return order._id || order.id || order.orderId;
  };
  // ======================================================

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch orders on mount - only once
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchOrders();
    }
  }, []);

  // Use useMemo for filtered orders - NO infinite loop
  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];
    
    let result = [...orders];

    // Apply status filter
    if (selectedStatus !== 'all') {
      result = result.filter(order => order.orderStatus === selectedStatus);
    }

    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => {
        const customer = getCustomerInfo(order);
        const orderId = getOrderId(order);
        return (
          (order.orderId && order.orderId.toLowerCase().includes(term)) ||
          (order.orderNumber && order.orderNumber.toLowerCase().includes(term)) ||
          (customer.name && customer.name.toLowerCase().includes(term)) ||
          (customer.email && customer.email.toLowerCase().includes(term)) ||
          (customer.phone && customer.phone.toLowerCase().includes(term))
        );
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.createdAt || b.orderDate || b.date || 0) - new Date(a.createdAt || a.orderDate || a.date || 0);
        case 'oldest':
          return new Date(a.createdAt || a.orderDate || a.date || 0) - new Date(b.createdAt || b.orderDate || b.date || 0);
        case 'amount-high':
          return (b.finalAmount || b.totalAmount || 0) - (a.finalAmount || a.totalAmount || 0);
        case 'amount-low':
          return (a.finalAmount || a.totalAmount || 0) - (b.finalAmount || b.totalAmount || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [orders, sortOption, selectedStatus, searchTerm]);

  const fetchOrders = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('❌ You are not logged in. Please login again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const response = await ordersAPI.getOrders();
      
      if (response.data && response.data.success === false && response.data.message === 'Not authorized to access this route') {
        setError('❌ Session expired. Please login again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      let ordersData = [];
      
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      } else if (Array.isArray(response)) {
        ordersData = response;
      } else if (response.data && response.data.success && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      }
      
      setOrders(ordersData || []);
      
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      
      if (err.response && err.response.status === 401) {
        setError('❌ Session expired. Please login again.');
      } else if (err.response && err.response.status === 403) {
        setError('❌ You do not have permission to access orders.');
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(`❌ ${err.response.data.message}`);
      } else if (err.message === 'Network Error') {
        setError('❌ Cannot connect to server. Please check your internet connection.');
      } else {
        setError(`❌ Failed to fetch orders: ${err.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchOrders(true);
  };

  // Get sort button label based on current option
  const getSortLabel = () => {
    switch (sortOption) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'amount-high': return 'Amount (High to Low)';
      case 'amount-low': return 'Amount (Low to High)';
      default: return 'Sort';
    }
  };

  // Get status display label
  const getStatusLabel = () => {
    const found = statusOptions.find(opt => opt.value === selectedStatus);
    return found ? `${found.icon} ${found.label}` : 'All Status';
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedStatus('all');
    setSortOption('newest');
    setSearchTerm('');
  };

const handleDeleteOrder = async (orderId, orderNumber) => {
  if (!orderId) {
    return;
  }

  try {
    setLoading(true);
    const response = await ordersAPI.deleteOrder(orderId);
    
    if (response.data.success) {
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      setDeleteModal({ show: false, orderId: null, orderNumber: null });
      // Success message removed - no notification shown
    }
  } catch (error) {
    setError('❌ Failed to delete order');
    setTimeout(() => setError(''), 3000);
  } finally {
    setLoading(false);
  }
};

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === 'cancelled') {
      const confirmCancel = window.confirm(
        '⚠️ Are you sure you want to cancel this order?\n' +
        'This will:\n' +
        '• Restore product stock\n' +
        '• Cancel ShipRocket shipment (if exists)\n' +
        '• Send cancellation notification'
      );
      if (!confirmCancel) return;
    }

    if (newStatus === 'delivered') {
      const confirmDeliver = window.confirm(
        '✅ Mark this order as delivered?\n' +
        'This will:\n' +
        '• Auto-complete COD payments (if applicable)\n' +
        '• Send delivery confirmation email'
      );
      if (!confirmDeliver) return;
    }

    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));

      const order = orders.find(o => o._id === orderId);
      if (!order) {
        alert('Order not found');
        return;
      }

      const paymentOrderId = order.orderId || order.razorpayOrderId || order.paymentId;
      
      if (!paymentOrderId) {
        alert('Cannot update status: Order identifier not found');
        return;
      }

      const response = await paymentsAPI.updatePaymentStatus(paymentOrderId, {
        orderStatus: newStatus,
        ...(newStatus === 'cancelled' && {
          cancellationReason: 'Cancelled by admin via dashboard',
          notes: `Order status changed to ${newStatus} by admin`
        }),
        ...(newStatus === 'delivered' && {
          notes: `Order marked as delivered by admin`
        })
      });
      
      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  orderStatus: newStatus, 
                  paymentStatus: response.data.order?.paymentStatus || order.paymentStatus,
                  ...(response.data.order || {})
                }
              : order
          )
        );
        
        alert(`✅ Order status updated to ${newStatus}`);
        setTimeout(() => fetchOrders(), 1000);
      } else {
        alert(`❌ Failed to update status: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert(`❌ Error updating status: ${error.response?.data?.message || error.message}`);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handlePaymentStatusUpdate = async (orderId, newPaymentStatus) => {
    try {
      setStatusUpdating(prev => ({ ...prev, [orderId]: true }));

      const order = orders.find(o => o._id === orderId);
      if (!order) {
        alert('Order not found');
        return;
      }

      const paymentOrderId = order.orderId || order.razorpayOrderId || order.paymentId;
      
      if (!paymentOrderId) {
        alert('Cannot update payment status: Order identifier not found');
        return;
      }

      const response = await paymentsAPI.updatePaymentStatus(paymentOrderId, {
        paymentStatus: newPaymentStatus,
        notes: `Payment status updated to ${newPaymentStatus} by admin`
      });
      
      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { 
                  ...order, 
                  paymentStatus: newPaymentStatus,
                  orderStatus: response.data.order?.orderStatus || order.orderStatus
                }
              : order
          )
        );
        
        alert(`✅ Payment status updated to ${newPaymentStatus}`);
        setTimeout(() => fetchOrders(), 1000);
      } else {
        alert(`❌ Failed to update payment status: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Payment status update error:', error);
      alert(`❌ Error updating payment status: ${error.response?.data?.message || error.message}`);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'confirmed', label: 'Confirmed', color: 'blue' },
      { value: 'processing', label: 'Processing', color: 'indigo' },
      { value: 'shipped', label: 'Shipped', color: 'purple' },
      { value: 'delivered', label: 'Delivered', color: 'green' },
      { value: 'cancelled', label: 'Cancelled', color: 'red' },
    ];

    const statusFlow = {
      pending: ['pending', 'confirmed', 'processing', 'cancelled'],
      confirmed: ['confirmed', 'processing', 'shipped', 'cancelled'],
      processing: ['processing', 'shipped', 'cancelled'],
      shipped: ['shipped', 'delivered', 'cancelled'],
      delivered: ['delivered'],
      cancelled: ['cancelled'],
    };

    const allowedStatuses = statusFlow[currentStatus] || [currentStatus];
    
    return allStatuses.filter(status => allowedStatuses.includes(status.value));
  };

  const getPaymentStatusOptions = (currentPaymentStatus) => {
    const allPaymentStatuses = [
      { value: 'pending', label: 'Pending', color: 'yellow' },
      { value: 'completed', label: 'Completed', color: 'green' },
      { value: 'failed', label: 'Failed', color: 'red' },
      { value: 'refunded', label: 'Refunded', color: 'purple' },
      { value: 'partially_refunded', label: 'Partially Refunded', color: 'indigo' },
    ];

    const paymentStatusFlow = {
      pending: ['pending', 'completed', 'failed'],
      completed: ['completed', 'refunded', 'partially_refunded'],
      failed: ['failed'],
      refunded: ['refunded'],
      partially_refunded: ['partially_refunded'],
    };

    const allowedStatuses = paymentStatusFlow[currentPaymentStatus] || [currentPaymentStatus];
    
    return allPaymentStatuses.filter(status => allowedStatuses.includes(status.value));
  };

  const isRefundable = (order) => {
    if (!order) return false;
    
    const isCancelled = order.orderStatus === 'cancelled';
    const hasPaid = order.paymentStatus === 'completed' || 
                   order.paymentStatus === 'partially_refunded';
    const hasPaymentId = order.paymentId && order.paymentId.trim() !== '';
    const notFullyRefunded = order.paymentStatus !== 'refunded';
    
    return isCancelled && hasPaid && hasPaymentId && notFullyRefunded;
  };

  const processRefund = async (order) => {
    if (!order) {
      alert('Cannot process refund: Order data is missing');
      return;
    }

    if (!order.paymentId) {
      alert('Cannot process refund: Payment ID not found');
      return;
    }

    if (!isRefundable(order)) {
      alert(`This order cannot be refunded because:
      • Order Status: ${order.orderStatus}
      • Payment Status: ${order.paymentStatus}
      • Payment ID: ${order.paymentId ? 'Exists' : 'Missing'}`);
      return;
    }

    const refundAmount = order.finalAmount || order.totalAmount || 0;
    
    if (!confirm(`Are you sure you want to refund ₹${refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} for order ${order.orderId}?`)) {
      return;
    }

    try {
      setRefundLoading(true);
      setActiveRefundOrderId(order._id);
      setRefundStatus(prev => ({
        ...prev,
        [order._id]: { status: 'processing', message: 'Processing refund...' }
      }));
      
      const refundData = {
        refund_amount: refundAmount,
        notes: {
          reason: 'Order cancelled',
          processedBy: 'admin',
          orderId: order.orderId
        }
      };

      const response = await paymentsAPI.refundPayment(order.paymentId, refundData);
      
      if (response.data.success) {
        setRefundStatus(prev => ({
          ...prev,
          [order._id]: { 
            status: 'success', 
            message: `Refunded ₹${(response.data.refund.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
            refundId: response.data.refund.id
          }
        }));
        
        alert(`✅ Refund processed successfully!\nRefund ID: ${response.data.refund.id}`);
        setTimeout(() => fetchOrders(), 1500);
      } else {
        setRefundStatus(prev => ({
          ...prev,
          [order._id]: { 
            status: 'error', 
            message: response.data.message || 'Refund failed'
          }
        }));
        alert(`⚠️ Refund failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Refund failed';
      setRefundStatus(prev => ({
        ...prev,
        [order._id]: { status: 'error', message: errorMessage }
      }));
      alert(`Refund failed: ${errorMessage}`);
    } finally {
      setRefundLoading(false);
      setTimeout(() => setActiveRefundOrderId(null), 3000);
    }
  };

  const fetchOrderReceipt = async (orderId) => {
    try {
      if (!orderId) {
        alert('Order ID is missing. Please check the order data.');
        return;
      }
      
      setReceiptLoading(true);
      const response = await ordersAPI.printOrderReceipt(orderId);
      
      if (!response) {
        throw new Error('No response received from API');
      }
      
      const orderData = response.data || response;
      setSelectedOrder(orderData);
      setShowReceiptModal(true);
      
    } catch (err) {
      console.error('Error fetching order receipt:', err);
      alert(`Error: ${err.response?.data?.message || err.message || 'Failed to load receipt details'}`);
    } finally {
      setReceiptLoading(false);
    }
  };

  const downloadPDFReceipt = async (orderId) => {
    try {
      if (!orderId) {
        alert('Order ID is missing. Please try viewing the receipt first.');
        return;
      }

      setReceiptLoading(true);
      setDownloadStatus('Starting download...');
      
      const response = await ordersAPI.printOrderReceiptPDF(orderId, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setDownloadStatus('✅ PDF downloaded successfully!');
      alert('PDF downloaded successfully!');
      
    } catch (err) {
      console.error('Error downloading PDF receipt:', err);
      setDownloadStatus(`❌ Download failed: ${err.message}`);
      alert(`Download failed: ${err.message}`);
    } finally {
      setReceiptLoading(false);
      setTimeout(() => setDownloadStatus(''), 3000);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border border-purple-200',
      delivered: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      processing: 'bg-blue-100 text-blue-800 border border-blue-200',
      refunded: 'bg-purple-100 text-purple-800 border border-purple-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    if (!paymentStatus) return null;
    
    const paymentStatusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      failed: 'bg-red-100 text-red-800 border border-red-200',
      refunded: 'bg-purple-100 text-purple-800 border border-purple-200',
      partially_refunded: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      processing: 'bg-blue-100 text-blue-800 border border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[paymentStatus] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).replace('_', ' ')}
      </span>
    );
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.orderStatus === 'pending').length;
  const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered' || order.orderStatus === 'completed').length;
  const refundedOrders = orders.filter(order => order.paymentStatus === 'refunded' || order.paymentStatus === 'partially_refunded').length;

  const ReceiptModal = ({ order, onClose, onPrint, onDownloadPDF }) => {
    if (!order) return null;

    const receiptData = order.receipt || order;
    const orderId = receiptData.receiptNumber || receiptData.orderNumber || receiptData.orderId || receiptData._id;
    const customerName = receiptData.customer?.name || receiptData.user?.name || receiptData.guestUser?.name || receiptData.shippingAddress?.fullName || 'N/A';
    const customerEmail = receiptData.customer?.email || receiptData.user?.email || receiptData.guestUser?.email || receiptData.email || 'N/A';
    const customerPhone = receiptData.customer?.phone || receiptData.user?.phone || receiptData.guestUser?.phone || receiptData.shippingAddress?.phone || 'N/A';
    const items = receiptData.products || receiptData.items || [];
    const subtotal = receiptData.pricing?.subtotal || receiptData.totalAmount || receiptData.subtotal || 0;
    const shipping = receiptData.pricing?.shipping || receiptData.shippingFee || receiptData.shippingCharges || 0;
    const tax = receiptData.pricing?.tax || receiptData.taxAmount || receiptData.tax || 0;
    const total = receiptData.pricing?.total || receiptData.finalAmount || receiptData.total || subtotal + shipping + tax;
    const orderDate = receiptData.createdAt || receiptData.orderDate || receiptData.date;
    const paymentStatus = receiptData.payment?.status || receiptData.paymentStatus;
    const paymentMethod = receiptData.payment?.method || receiptData.paymentMethod;
    const paymentId = receiptData.paymentId;
    const razorpayOrderId = receiptData.razorpayOrderId;
    const orderStatus = receiptData.orderStatus;
    const isGuestOrder = receiptData.isGuestOrder;
    const shippingAddress = receiptData.shippingAddress;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🛒</div>
              <div>
                <h1 className="font-bold text-sm sm:text-base">ORDER RECEIPT</h1>
                <p className="text-white/80 text-xs sm:text-sm">#{orderId?.substring(0, 12)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-0.5 rounded text-xs ${isGuestOrder ? 'bg-orange-500' : 'bg-green-500'}`}>
                {isGuestOrder ? 'Guest' : 'Reg'}
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 min-w-[60px]">Date:</span>
                <span className="text-xs sm:text-sm font-medium flex-1 text-right">{formatDate(orderDate)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 min-w-[60px]">Payment:</span>
                <div className="flex-1 text-right">{getPaymentStatusBadge(paymentStatus)}</div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-500 min-w-[60px]">Status:</span>
                <div className="flex-1 text-right">{getStatusBadge(orderStatus)}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-500 min-w-[60px]">Method:</span>
                <span className="text-xs sm:text-sm font-medium capitalize flex-1 text-right">{paymentMethod}</span>
              </div>
            </div>

            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded border">
              <h3 className="font-bold text-sm sm:text-base truncate">{customerName}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">📧</span>
                  <span className="truncate">{customerEmail}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">📞</span>
                  <span>{customerPhone}</span>
                </div>
              </div>
              {shippingAddress && (
                <div className="mt-2 pt-2 border-t text-xs sm:text-sm">
                  <div className="font-medium text-gray-600">Shipping:</div>
                  <div className="text-gray-500 truncate">{shippingAddress.address}, {shippingAddress.city}</div>
                </div>
              )}
            </div>

            <div className="mb-3 sm:mb-4">
              <h3 className="font-bold text-sm sm:text-base mb-1">Items ({items.length})</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={item._id || index} className="flex justify-between items-center p-1.5 hover:bg-gray-50 rounded border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">{item.product?.name || item.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs sm:text-sm">{formatCurrency((item.price || 0) * (item.quantity || 1))}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50/50 p-3 sm:p-4 rounded border border-blue-200">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-700">Shipping:</span>
                  <span className="font-semibold">{formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-700">Tax:</span>
                  <span className="font-semibold">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200 font-bold text-base sm:text-lg">
                  <span>TOTAL:</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {(paymentId || razorpayOrderId) && (
              <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded border text-xs sm:text-sm">
                {paymentId && <div><span className="text-gray-500">Payment ID:</span> <span className="font-medium">{paymentId.substring(0, 16)}...</span></div>}
                {razorpayOrderId && <div><span className="text-gray-500">Razorpay ID:</span> <span className="font-medium">{razorpayOrderId.substring(0, 16)}...</span></div>}
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 border-t bg-gray-50 flex justify-between items-center">
            {downloadStatus ? (
              <div className={`px-2 py-1 rounded text-xs ${
                downloadStatus.includes('✅') ? 'bg-green-100 text-green-800' :
                downloadStatus.includes('❌') ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {downloadStatus.length > 20 ? downloadStatus.substring(0, 20) + '...' : downloadStatus}
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-gray-500">{formatDate(orderDate)}</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={onDownloadPDF}
                disabled={receiptLoading}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded text-xs sm:text-sm hover:from-blue-700 hover:to-purple-700 disabled:from-blue-300 disabled:to-purple-300 flex items-center gap-1 min-w-[60px] sm:min-w-[80px] justify-center"
              >
                <span>📥</span>
                {receiptLoading ? '...' : 'PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal = ({ show, onClose, onConfirm, orderNumber }) => {
    if (!show) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Delete Order</h3>
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete order #{orderNumber}? This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Card Component
  const OrderCard = ({ order, index }) => {
    const customer = getCustomerInfo(order);
    const orderId = getOrderId(order);
    const isRefundableOrder = isRefundable(order);
    
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 truncate max-w-[180px]">
                {order.orderId || order.orderNumber || order._id?.substring(-6)}
              </h3>
              <p className="text-xs text-gray-500">
                {formatDate(order.createdAt || order.orderDate || order.date)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">
              ₹{formatCurrency(order.finalAmount || order.totalAmount || 0)}
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900">{customer.name}</p>
          <p className="text-xs text-gray-500 truncate">{customer.email}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Order Status</p>
            <div className="mt-1">
              {userRole === 'admin' ? (
                <select
                  value={order.orderStatus}
                  onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                  disabled={statusUpdating[order._id]}
                  className="text-xs border rounded px-2 py-1 w-full"
                >
                  {getStatusOptions(order.orderStatus).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                  order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.orderStatus || 'pending'}
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment</p>
            <div className="mt-1">
              {userRole === 'admin' ? (
                <select
                  value={order.paymentStatus}
                  onChange={(e) => handlePaymentStatusUpdate(order._id, e.target.value)}
                  disabled={statusUpdating[order._id]}
                  className="text-xs border rounded px-2 py-1 w-full"
                >
                  {getPaymentStatusOptions(order.paymentStatus).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.paymentStatus || 'pending'}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => fetchOrderReceipt(orderId)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded text-sm font-medium"
          >
            Receipt
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => setDeleteModal({ show: true, orderId: order._id, orderNumber: order.orderId })}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium"
            >
              Delete
            </button>
          )}
          {isRefundableOrder && (
            <button
              onClick={() => processRefund(order)}
              disabled={refundLoading && activeRefundOrderId === order._id}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refund
            </button>
          )}
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

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 bg-gray-50">
          <div className={`p-4 rounded-lg border ${
            error.includes('✅') 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`${error.includes('✅') ? 'text-green-800' : 'text-red-800'}`}>{error}</p>
            <button 
              onClick={() => fetchOrders(true)}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded hover:from-blue-700 hover:to-purple-700"
            >
              Retry
            </button>
            {error.includes('login again') && (
              <button 
                onClick={logout}
                className="mt-2 ml-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded hover:from-red-600 hover:to-red-700"
              >
                Login Again
              </button>
            )}
          </div>
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
                <h1 className="text-xl font-bold text-gray-800">Orders Management</h1>
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

          {/* Main Content */}
          <main className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col space-y-4">
              {/* Sticky Orders Header - Fixed below main header */}
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
                    All Orders ({filteredOrders.length})
                  </h2>
                  <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh orders"
                    >
                      <FaSyncAlt className={`sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Search and Filter - This will scroll */}
              <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Status Filter Dropdown */}
                  <div className="relative w-full sm:w-48">
                    <button
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
                    >
                      <span className="truncate">
                        {selectedStatus === 'all' ? 'All Status' : getStatusLabel()}
                      </span>
                      <svg className={`w-4 h-4 ml-2 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {statusDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <button
                          onClick={() => { setSelectedStatus('all'); setStatusDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          All Status
                        </button>
                        {statusOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => { setSelectedStatus(option.value); setStatusDropdownOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            {option.icon} {option.label}
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
                        <button onClick={() => { setSortOption('amount-high'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                          Amount (High to Low)
                        </button>
                        <button onClick={() => { setSortOption('amount-low'); setSortDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">
                          Amount (Low to High)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Clear Button */}
                  {(selectedStatus !== 'all' || sortOption !== 'newest' || searchTerm) && (
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

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total</p>
                      <p className="text-xl font-bold text-gray-800">{totalOrders}</p>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">T</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Pending</p>
                      <p className="text-xl font-bold text-yellow-600">{pendingOrders}</p>
                    </div>
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">P</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Delivered</p>
                      <p className="text-xl font-bold text-green-600">{deliveredOrders}</p>
                    </div>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">D</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Refunded</p>
                      <p className="text-xl font-bold text-purple-600">{refundedOrders}</p>
                    </div>
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">R</div>
                  </div>
                </div>
              </div>

              {/* Orders Display */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {refreshing ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading orders...</p>
                  </div>
                ) : (
                  <>
                    {!Array.isArray(orders) ? (
                      <div className="text-center py-6 sm:py-8">
                        <p className="text-red-500 text-sm sm:text-lg">Data format error</p>
                        <button 
                          onClick={() => fetchOrders(true)}
                          className="mt-2 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded text-sm hover:from-blue-700 hover:to-purple-700"
                        >
                          Retry
                        </button>
                      </div>
                    ) : filteredOrders.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <Search className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                        <h3 className="mt-1 sm:mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                        {(selectedStatus !== 'all' || searchTerm) && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 text-sm"
                          >
                            Clear Filters
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
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.map((order, index) => {
                                  const customer = getCustomerInfo(order);
                                  const orderId = getOrderId(order);
                                  const isRefundableOrder = isRefundable(order);
                                  
                                  return (
                                    <tr key={order._id || order.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 text-center">{index + 1}</div>
                                      </td>
                                      <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{order.orderId || order.orderNumber || order._id?.substring(-6)}</div>
                                      </td>
                                      <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{customer.name}</div>
                                        <div className="text-xs text-gray-500">{customer.email}</div>
                                      </td>
                                      <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatDate(order.createdAt || order.orderDate || order.date)}</div>
                                      </td>
                                      <td className="px-3 py-4 whitespace-nowrap">
                                        {userRole === 'admin' ? (
                                          <select
                                            value={order.orderStatus}
                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                            disabled={statusUpdating[order._id]}
                                            className="text-xs border rounded px-1.5 py-0.5 w-full max-w-[100px]"
                                          >
                                            {getStatusOptions(order.orderStatus).map(option => (
                                              <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                            order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                                            order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {order.orderStatus || 'pending'}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-4 whitespace-nowrap">
                                        {userRole === 'admin' ? (
                                          <select
                                            value={order.paymentStatus}
                                            onChange={(e) => handlePaymentStatusUpdate(order._id, e.target.value)}
                                            disabled={statusUpdating[order._id]}
                                            className="text-xs border rounded px-1.5 py-0.5 w-full max-w-[100px]"
                                          >
                                            {getPaymentStatusOptions(order.paymentStatus).map(option => (
                                              <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                                            order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {order.paymentStatus || 'pending'}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{formatCurrency(order.finalAmount || order.totalAmount || 0)}</div>
                                      </td>
                                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                          <button onClick={() => fetchOrderReceipt(orderId)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded text-xs font-medium">Receipt</button>
                                          {userRole === 'admin' && (
                                            <button onClick={() => setDeleteModal({ show: true, orderId: order._id, orderNumber: order.orderId })} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded text-xs font-medium">Delete</button>
                                          )}
                                          {isRefundableOrder && (
                                            <button
                                              onClick={() => processRefund(order)}
                                              disabled={refundLoading && activeRefundOrderId === order._id}
                                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-medium disabled:bg-red-300"
                                            >
                                              Refund
                                            </button>
                                          )}
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
                            {filteredOrders.map((order, index) => (
                              <OrderCard key={order._id || order.id} order={order} index={index} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>

        {showReceiptModal && (
          <ReceiptModal
            order={selectedOrder}
            onClose={() => setShowReceiptModal(false)}
            onPrint={printReceipt}
            onDownloadPDF={() => {
              const orderId = selectedOrder?.receipt?.receiptNumber || 
                             selectedOrder?.receipt?._id || 
                             selectedOrder?.receipt?.orderId || 
                             selectedOrder?.receipt?.id ||
                             selectedOrder?._id || 
                             selectedOrder?.id || 
                             selectedOrder?.orderId;
              
              if (!orderId) {
                alert('❌ Cannot download PDF: Order ID not found.');
                return;
              }
              downloadPDFReceipt(orderId);
            }}
          />
        )}

        <DeleteConfirmationModal
          show={deleteModal.show}
          onClose={() => setDeleteModal({ show: false, orderId: null, orderNumber: null })}
          onConfirm={() => handleDeleteOrder(deleteModal.orderId, deleteModal.orderNumber)}
          orderNumber={deleteModal.orderNumber}
        />
      </div>
    </ErrorBoundary>
  );
};

export default OrdersPage;