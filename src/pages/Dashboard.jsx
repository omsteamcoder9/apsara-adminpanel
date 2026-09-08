// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { LogOut, Users, ShoppingBag, Clock, AlertTriangle, Package, TrendingUp, DollarSign, Activity, Zap } from 'lucide-react';
import { statsAPI } from '../api/stats';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalOrders: 0,
    revenue: 0,
    pendingOrders: 0,
    todayOrders: 0,
    lowStockCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await statsAPI.getComprehensiveStats();
        
        if (response.data.success) {
          const stats = response.data.data;
          setDashboardData({
            totalUsers: stats.overview?.totalUsers || 0,
            totalOrders: stats.overview?.totalOrders || 0,
            revenue: stats.financial?.totalRevenue || 0,
            pendingOrders: stats.shipping?.statusBreakdown?.pending || 0,
            todayOrders: stats.overview?.todayRevenue || 0,
            lowStockCount: stats.products?.lowStockCount || 0
          });
        } else {
          throw new Error(response.data.message || 'Failed to fetch dashboard data');
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data from server');
        setDashboardData({
          totalUsers: 0,
          totalOrders: 0,
          revenue: 0,
          pendingOrders: 0,
          todayOrders: 0,
          lowStockCount: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      id: 1,
      title: 'Total Revenue',
      value: `₹${dashboardData.revenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-200'
    },
    {
      id: 2,
      title: 'Total Orders',
      value: dashboardData.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-indigo-500',
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 3,
      title: 'Total Users',
      value: dashboardData.totalUsers.toLocaleString(),
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 4,
      title: 'Pending Orders',
      value: dashboardData.pendingOrders.toLocaleString(),
      icon: Clock,
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-50 to-amber-50',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Sidebar />
      
      <div className="flex-1 w-full">
        {/* Modern Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 px-6 py-1 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Welcome back, <span className="font-semibold text-gray-700">{user?.name || 'Admin'}</span> 
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 font-medium">Live</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:shadow-sm"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Stats Grid - Premium Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.id}
                  className={`group relative bg-white rounded-2xl border ${stat.borderColor} p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  {/* Decorative Circle */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1.5">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg shadow-${stat.color}-500/20`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    {/* Mini Trend Indicator */}
                    <div className="mt-4 flex items-center gap-1.5">
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <TrendingUp size={12} />
                        <span>Active</span>
                      </div>
                      <span className="text-xs text-gray-400">• Updated now</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Section - Premium Design */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Quick Stats Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg shadow-blue-500/20">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Performance Overview</h3>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Live</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs text-gray-500 font-medium">Today's Orders</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardData.todayOrders}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Zap size={14} className="text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">Real-time</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                  <p className="text-xs text-gray-500 font-medium">Low Stock Items</p>
                  <p className={`text-2xl font-bold mt-1 ${dashboardData.lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {dashboardData.lowStockCount}
                  </p>
                  {dashboardData.lowStockCount > 0 && (
                    <div className="mt-2 flex items-center gap-1">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-xs text-red-600 font-medium">Needs attention</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Status Card */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg">System Status</h3>
                </div>
                
                <p className="text-white/80 text-sm mb-5">All systems are operational</p>
                
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Active & Running</span>
                  <span className="ml-auto text-xs text-white/60">v2.0</span>
                </div>
                
                {dashboardData.lowStockCount > 0 && (
                  <div className="mt-4 bg-red-500/20 border border-red-400/30 rounded-xl p-3 backdrop-blur-sm">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-300" />
                      {dashboardData.lowStockCount} items need restocking
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;