// App.jsx (or your main routing component)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import OrdersPage from './pages/OrdersPage';
import CustomerPage from './pages/CustomerPage';
import Settings from './pages/Settings';
import BackupManagement from './pages/BackupManagement'; // ✅ ADD THIS

// Import Blog pages
import Blogs from './pages/Blogs';
import CreateBlog from './pages/CreateBlog';
import EditBlog from './pages/EditBlog';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Blog Routes */}
            <Route 
              path="/blogs" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Blogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blogs/create" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <CreateBlog />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blogs/edit/:id" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <EditBlog />
                </ProtectedRoute>
              } 
            />
            
            {/* Categories */}
            <Route 
              path="/categories" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Categories />
                </ProtectedRoute>
              } 
            />
            
            {/* Products */}
            <Route 
              path="/products" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Products />
                </ProtectedRoute>
              } 
            />
            
            {/* Orders */}
            <Route 
              path="/orders" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <OrdersPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Customers */}
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <CustomerPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Backup Management - ✅ ADD THIS */}
            <Route 
              path="/backup" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <BackupManagement />
                </ProtectedRoute>
              } 
            />
            
            {/* Settings */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;