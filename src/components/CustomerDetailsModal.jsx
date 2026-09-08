// src/components/CustomerDetailsModal.jsx
import React from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  ShoppingBag,
  CreditCard,
  Package,
  Edit,
  Trash2,
  UserX,
  UserCheck
} from 'lucide-react';

const CustomerDetailsModal = ({ customer, onClose, onDeactivate, onDelete }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Customer Details</h2>
            <p className="text-slate-600">View and manage customer information</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Profile */}
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {customer.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800">{customer.name}</h3>
              <p className="text-slate-600">{customer.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-sm font-medium capitalize">
                  {customer.role || 'customer'}
                </span>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Contact Information */}
            <div className="bg-slate-50 rounded-xl p-5 border border-blue-100">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Contact Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-slate-50 rounded-xl p-5 border border-blue-100">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Account Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">Joined</p>
                    <p className="font-medium">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">Last Updated</p>
                    <p className="font-medium">{formatDate(customer.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {customer.address && (
            <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-blue-100">
              <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Address
              </h4>
              <div className="text-slate-700">
                {customer.address.street && <p>{customer.address.street}</p>}
                {customer.address.city && customer.address.state && (
                  <p>{customer.address.city}, {customer.address.state}</p>
                )}
                {customer.address.country && <p>{customer.address.country}</p>}
                {customer.address.zipCode && <p>ZIP: {customer.address.zipCode}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={() => onDeactivate(customer)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
              customer.isActive 
                ? 'text-amber-600 hover:bg-amber-50 border border-amber-200' 
                : 'text-green-600 hover:bg-green-50 border border-green-200'
            }`}
          >
            {customer.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
            {customer.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
          <button
            onClick={() => onDelete(customer)}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Customer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;