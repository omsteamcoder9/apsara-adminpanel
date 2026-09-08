// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { 
  Save, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingCart, 
  CreditCard, 
  Link as LinkIcon, 
  Key,
  X,
  Check,
  Truck,
  Package,
  Clock,
  Globe as GlobeIcon,
  RefreshCw,
  Shield,
  AlertCircle,
  FileText,
  CheckCircle,
  ArrowRight,
  Plus,
  Minus,
  Lock,
  Eye,
  ShieldCheck,
  Database,
  Users,
  FileSignature,
  ScrollText,
  ShieldAlert,
  MessageCircle,
  PhoneCall,
  Lock as LockIcon,
  Building,
  Hash,
  Code,
  Trash2,
  LogOut,
  Settings as SettingsIcon,
  Layout,
  Headphones,
  Share2,
  FileLock,
  FileText as FileTextIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { FaSyncAlt } from 'react-icons/fa';
import { settingsAPI } from '../api/settings';

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

const Settings = () => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showSecretModalInput, setShowSecretModalInput] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [razorpayKeyIdInput, setRazorpayKeyIdInput] = useState('');
  const [razorpayKeySecretInput, setRazorpayKeySecretInput] = useState('');

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [settings, setSettings] = useState({
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: '',
    cashOnDeliveryEnabled: true,
    contactNumber: '',
    whatsappNumber: '',
    callNumber: '',
    contactEmail: '',
    companyAddress: '',
    siteName: '',
    siteTitle: '',
    siteDescription: '',
    footerText: '',
    footerLinks: [],
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
    maintenanceMode: false,
    metaKeywords: [],
    googleAnalyticsId: '',
    gstinNumber: '',
    phonePeNumber: '',
    googlePayNumber: '',
    shippingInfo: '',
    orderProcessingTime: '',
    standardShippingDelivery: '',
    standardShippingCost: '',
    standardFreeShippingThreshold: '',
    expressShippingDelivery: '',
    expressShippingCost: '',
    expressFreeShippingThreshold: '',
    overnightShippingDelivery: '',
    overnightShippingCost: '',
    internationalShippingDelivery: '',
    internationalShippingNote: '',
    returnsPolicyTitle: '',
    returnsPolicyDescription: '',
    returnProcessSteps: [],
    returnTimeframe: '',
    returnConditions: [],
    customerShippingResponsibility: '',
    nonReturnableItems: [],
    defectiveItemsNote: '',
    refundProcessingTime: '',
    refundNote: '',
    refundAmountFormula: '',
    refundAmountDescription: '',
    exchangePolicy: '',
    privacyPolicyTitle: '',
    privacyPolicyLastUpdated: '',
    privacyPolicyEffectiveImmediately: true,
    privacyPolicyIntroduction: '',
    dataWeCollect: [],
    howWeUseInformation: [],
    privacyIntroductionSection: '',
    informationWeCollectSection: '',
    howWeUseInformationSection: '',
    dataSecuritySection: '',
    dataProtectionRightsSection: '',
    contactUsSection: '',
    dataProtectionRightsList: [],
    securityMeasuresSection: '',
    termsOfServiceTitle: '',
    termsOfServiceLastUpdated: '',
    termsImportantNotice: '',
    termsUserRequirements: [],
    termsSections: [],
    termsIntellectualProperty: '',
    termsLimitationLiability: '',
    termsChangesNotice: '',
    termsContactInfo: '',
    headerScripts: '',
    bodyScripts: '',
    footerScripts: '',
  });

  const [footerLinks, setFooterLinks] = useState([]);
  const [newFooterLink, setNewFooterLink] = useState({ name: '', url: '' });
  const [metaKeywordInput, setMetaKeywordInput] = useState('');
  
  const [newReturnStep, setNewReturnStep] = useState({ title: '', description: '' });
  const [newReturnCondition, setNewReturnCondition] = useState('');
  const [newNonReturnableItem, setNewNonReturnableItem] = useState('');
  
  const [newDataWeCollect, setNewDataWeCollect] = useState('');
  const [newHowWeUseInfo, setNewHowWeUseInfo] = useState('');
  const [newDataProtectionRight, setNewDataProtectionRight] = useState('');
  
  const [newTermsUserRequirement, setNewTermsUserRequirement] = useState('');
  const [newTermsSection, setNewTermsSection] = useState({ 
    number: 1, 
    title: '', 
    content: '' 
  });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings.footerLinks && settings.footerLinks.length > 0) {
      setFooterLinks(settings.footerLinks);
    }
  }, [settings.footerLinks]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAllSettings();
      
      if (response.data.success) {
        const data = response.data.data;
        setSettings(data);
        
        if (data.razorpayKeyId) {
          setRazorpayKeyIdInput(data.razorpayKeyId);
        }
        
        if (data.footerLinks) {
          setFooterLinks(data.footerLinks);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRazorpayToggle = (enabled) => {
    if (enabled) {
      setShowRazorpayModal(true);
      setRazorpayKeyIdInput(settings.razorpayKeyId || '');
      setRazorpayKeySecretInput(settings.razorpayKeySecret || '');
    } else {
      setSettings(prev => ({
        ...prev,
        razorpayEnabled: false
      }));
    }
  };

  const saveRazorpayKeys = async () => {
    if (!razorpayKeyIdInput.trim()) {
      showNotification('error', 'Please enter Razorpay Key ID');
      return;
    }
    
    if (!razorpayKeyIdInput.startsWith('rzp_test_') && !razorpayKeyIdInput.startsWith('rzp_live_')) {
      showNotification('error', 'Razorpay Key ID should start with "rzp_test_" or "rzp_live_"');
      return;
    }
    
    try {
      setSaving(true);
      
      const updatedSettings = {
        ...settings,
        razorpayEnabled: true,
        razorpayKeyId: razorpayKeyIdInput.trim(),
        ...(razorpayKeySecretInput.trim() && { razorpayKeySecret: razorpayKeySecretInput.trim() })
      };
      
      setSettings(updatedSettings);
      
      const dataToSend = {
        ...updatedSettings,
        footerLinks: footerLinks,
      };

      const response = await settingsAPI.updateSettings(dataToSend);
      
      if (response.data.success) {
        showNotification('success', 'Razorpay keys saved successfully!');
        setShowRazorpayModal(false);
        setRazorpayKeyIdInput('');
        setRazorpayKeySecretInput('');
        
        setSettings(response.data.data);
        if (response.data.data.footerLinks) {
          setFooterLinks(response.data.data.footerLinks);
        }
      }
    } catch (error) {
      console.error('Error saving Razorpay keys:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to save Razorpay keys');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFooterLink = () => {
    if (newFooterLink.name.trim() && newFooterLink.url.trim()) {
      const updatedLinks = [...footerLinks, { ...newFooterLink }];
      setFooterLinks(updatedLinks);
      setNewFooterLink({ name: '', url: '' });
    }
  };

  const handleRemoveFooterLink = (index) => {
    const updatedLinks = footerLinks.filter((_, i) => i !== index);
    setFooterLinks(updatedLinks);
  };

  const handleAddMetaKeyword = () => {
    if (metaKeywordInput.trim()) {
      setSettings(prev => ({
        ...prev,
        metaKeywords: [...prev.metaKeywords, metaKeywordInput.trim()]
      }));
      setMetaKeywordInput('');
    }
  };

  const handleRemoveMetaKeyword = (index) => {
    setSettings(prev => ({
      ...prev,
      metaKeywords: prev.metaKeywords.filter((_, i) => i !== index)
    }));
  };

  const handleAddReturnStep = () => {
    if (newReturnStep.title.trim() && newReturnStep.description.trim()) {
      setSettings(prev => ({
        ...prev,
        returnProcessSteps: [...prev.returnProcessSteps, { ...newReturnStep }]
      }));
      setNewReturnStep({ title: '', description: '' });
    }
  };

  const handleRemoveReturnStep = (index) => {
    setSettings(prev => ({
      ...prev,
      returnProcessSteps: prev.returnProcessSteps.filter((_, i) => i !== index)
    }));
  };

  const handleAddReturnCondition = () => {
    if (newReturnCondition.trim()) {
      setSettings(prev => ({
        ...prev,
        returnConditions: [...prev.returnConditions, newReturnCondition.trim()]
      }));
      setNewReturnCondition('');
    }
  };

  const handleRemoveReturnCondition = (index) => {
    setSettings(prev => ({
      ...prev,
        returnConditions: prev.returnConditions.filter((_, i) => i !== index)
    }));
  };

  const handleAddNonReturnableItem = () => {
    if (newNonReturnableItem.trim()) {
      setSettings(prev => ({
        ...prev,
        nonReturnableItems: [...prev.nonReturnableItems, newNonReturnableItem.trim()]
      }));
      setNewNonReturnableItem('');
    }
  };

  const handleRemoveNonReturnableItem = (index) => {
    setSettings(prev => ({
      ...prev,
      nonReturnableItems: prev.nonReturnableItems.filter((_, i) => i !== index)
    }));
  };

  const handleAddDataWeCollect = () => {
    if (newDataWeCollect.trim()) {
      setSettings(prev => ({
        ...prev,
        dataWeCollect: [...prev.dataWeCollect, newDataWeCollect.trim()]
      }));
      setNewDataWeCollect('');
    }
  };

  const handleRemoveDataWeCollect = (index) => {
    setSettings(prev => ({
      ...prev,
      dataWeCollect: prev.dataWeCollect.filter((_, i) => i !== index)
    }));
  };

  const handleAddHowWeUseInfo = () => {
    if (newHowWeUseInfo.trim()) {
      setSettings(prev => ({
        ...prev,
        howWeUseInformation: [...prev.howWeUseInformation, newHowWeUseInfo.trim()]
      }));
      setNewHowWeUseInfo('');
    }
  };

  const handleRemoveHowWeUseInfo = (index) => {
    setSettings(prev => ({
      ...prev,
      howWeUseInformation: prev.howWeUseInformation.filter((_, i) => i !== index)
    }));
  };

  const handleAddDataProtectionRight = () => {
    if (newDataProtectionRight.trim()) {
      setSettings(prev => ({
        ...prev,
        dataProtectionRightsList: [...prev.dataProtectionRightsList, newDataProtectionRight.trim()]
      }));
      setNewDataProtectionRight('');
    }
  };

  const handleRemoveDataProtectionRight = (index) => {
    setSettings(prev => ({
      ...prev,
      dataProtectionRightsList: prev.dataProtectionRightsList.filter((_, i) => i !== index)
    }));
  };

  const handleAddTermsUserRequirement = () => {
    if (newTermsUserRequirement.trim()) {
      setSettings(prev => ({
        ...prev,
        termsUserRequirements: [...prev.termsUserRequirements, newTermsUserRequirement.trim()]
      }));
      setNewTermsUserRequirement('');
    }
  };

  const handleRemoveTermsUserRequirement = (index) => {
    setSettings(prev => ({
      ...prev,
      termsUserRequirements: prev.termsUserRequirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddTermsSection = () => {
    if (newTermsSection.title.trim() && newTermsSection.content.trim()) {
      const newSection = {
        ...newTermsSection,
        number: settings.termsSections.length + 1
      };
      
      setSettings(prev => ({
        ...prev,
        termsSections: [...prev.termsSections, newSection]
      }));
      setNewTermsSection({ number: newSection.number + 1, title: '', content: '' });
    }
  };

  const handleRemoveTermsSection = (index) => {
    setSettings(prev => ({
      ...prev,
      termsSections: prev.termsSections.filter((_, i) => i !== index).map((section, idx) => ({
        ...section,
        number: idx + 1
      }))
    }));
    
    if (newTermsSection.number > 1) {
      setNewTermsSection(prev => ({ ...prev, number: prev.number - 1 }));
    }
  };

  const handleUpdateTermsSection = (index, field, value) => {
    const newSections = [...settings.termsSections];
    newSections[index][field] = value;
    setSettings(prev => ({ ...prev, termsSections: newSections }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const dataToSend = {
        ...settings,
        footerLinks: footerLinks,
        razorpayEnabled: settings.razorpayEnabled,
        razorpayKeyId: settings.razorpayKeyId,
        razorpayKeySecret: settings.razorpayKeySecret,
        cashOnDeliveryEnabled: settings.cashOnDeliveryEnabled,
        maintenanceMode: settings.maintenanceMode,
        privacyPolicyEffectiveImmediately: settings.privacyPolicyEffectiveImmediately
      };

      const response = await settingsAPI.updateSettings(dataToSend);
      
      if (response.data.success) {
        showNotification('success', 'Settings saved successfully!');
        setSettings(response.data.data);
        if (response.data.data.footerLinks) {
          setFooterLinks(response.data.data.footerLinks);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('error', error.response?.data?.message || error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'scripts', label: 'Scripts', icon: Code },
    { id: 'contact', label: 'Contact', icon: Headphones },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'footer', label: 'Footer', icon: Layout },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'returns', label: 'Returns', icon: RefreshCw },
    { id: 'privacy', label: 'Privacy', icon: FileLock },
    { id: 'terms', label: 'Terms', icon: FileTextIcon },
  ];

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
                <h1 className="text-xl font-bold text-gray-800">Settings</h1>
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
              {/* Sticky Settings Header - Fixed below main header */}
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
                    All Settings
                  </h2>
                  <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                    <button
                      onClick={fetchSettings}
                      disabled={loading}
                      className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh settings"
                    >
                      <FaSyncAlt className={`sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">
                        {loading ? 'Refreshing...' : 'Refresh'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Notification */}
              {notification.message && (
                <div className={`px-4 py-3 rounded mb-4 text-sm ${
                  notification.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {notification.message}
                </div>
              )}
              
              {/* Razorpay Modal */}
              {showRazorpayModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Razorpay Keys</h3>
                        <button
                          onClick={() => setShowRazorpayModal(false)}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Key ID</label>
                          <input
                            type="text"
                            value={razorpayKeyIdInput}
                            onChange={(e) => setRazorpayKeyIdInput(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="rzp_test_XXXXXXXXXXXXX"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                          <div className="relative">
                            <input
                              type={showSecretModalInput ? "text" : "password"}
                              value={razorpayKeySecretInput}
                              onChange={(e) => setRazorpayKeySecretInput(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm pr-10"
                              placeholder="Enter secret key"
                            />
                            <button
                              type="button"
                              onClick={() => setShowSecretModalInput(!showSecretModalInput)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowRazorpayModal(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveRazorpayKeys}
                          disabled={saving}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {saving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check size={16} />
                              Save
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Settings Content */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Section Navigation - Horizontal Scrollable - Names Always Visible */}
                <div className="border-b border-gray-200 bg-gray-50 p-2 overflow-x-auto">
                  <div className="flex gap-1 sm:gap-2 min-w-max">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      const isActive = activeSection === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <Icon size={isMobile ? 14 : 16} />
                          <span className="text-[10px] sm:text-sm">{section.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Settings Content */}
                <div className="p-4 sm:p-6">
                  <form onSubmit={handleSubmit}>
                    {/* General Settings */}
                    {activeSection === 'general' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">General Settings</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Name</label>
                            <input
                              type="text"
                              name="siteName"
                              value={settings.siteName}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="My Store"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Title</label>
                            <input
                              type="text"
                              name="siteTitle"
                              value={settings.siteTitle}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Best Online Store"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Description</label>
                            <textarea
                              name="siteDescription"
                              value={settings.siteDescription}
                              onChange={handleInputChange}
                              rows="3"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="Your one-stop shop"
                            />
                          </div>
                          <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3 sm:gap-0">
                            <div>
                              <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
                              <p className="text-sm text-gray-500">Only admins can access when enabled</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                name="maintenanceMode"
                                checked={settings.maintenanceMode}
                                onChange={handleInputChange}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment Settings */}
                    {activeSection === 'payment' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">Payment Settings</h3>
                        
                        {/* GST */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">GST Information</h4>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">GSTIN Number</label>
                            <input
                              type="text"
                              name="gstinNumber"
                              value={settings.gstinNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="22AAAAA0000A1Z5"
                            />
                          </div>
                        </div>

                        {/* Razorpay */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3 sm:gap-0">
                            <div>
                              <h4 className="font-medium text-gray-900">Razorpay</h4>
                              <p className="text-sm text-gray-500">Online payment gateway</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={settings.razorpayEnabled}
                                onChange={(e) => handleRazorpayToggle(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          {settings.razorpayEnabled && (
                            <div className="bg-white p-3 rounded border">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                                <div>
                                  <p className="text-xs text-gray-500">Key ID</p>
                                  <p className="text-sm font-mono">{settings.razorpayKeyId || 'Not set'}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRazorpayKeyIdInput(settings.razorpayKeyId || '');
                                    setRazorpayKeySecretInput(settings.razorpayKeySecret || '');
                                    setShowRazorpayModal(true);
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                  {settings.razorpayKeyId ? 'Edit' : 'Set'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cash on Delivery */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3 sm:gap-0">
                          <div>
                            <h4 className="font-medium text-gray-900">Cash on Delivery</h4>
                            <p className="text-sm text-gray-500">Pay when you receive</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="cashOnDeliveryEnabled"
                              checked={settings.cashOnDeliveryEnabled}
                              onChange={handleInputChange}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Script Tags */}
                    {activeSection === 'scripts' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">Script Tags</h3>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-700 flex items-start gap-2">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            Only add scripts from trusted sources. Incorrect scripts can break your site.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Header Scripts</label>
                          <p className="text-xs text-gray-500 mb-2">Added in &lt;head&gt; section</p>
                          <textarea
                            name="headerScripts"
                            value={settings.headerScripts}
                            onChange={handleInputChange}
                            rows="4"
                            className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="<!-- Add header scripts here -->"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Body Scripts</label>
                          <p className="text-xs text-gray-500 mb-2">Added after opening &lt;body&gt;</p>
                          <textarea
                            name="bodyScripts"
                            value={settings.bodyScripts}
                            onChange={handleInputChange}
                            rows="4"
                            className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="<!-- Add body scripts here -->"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Footer Scripts</label>
                          <p className="text-xs text-gray-500 mb-2">Added before closing &lt;/body&gt;</p>
                          <textarea
                            name="footerScripts"
                            value={settings.footerScripts}
                            onChange={handleInputChange}
                            rows="4"
                            className="w-full px-3 py-2 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="<!-- Add footer scripts here -->"
                          />
                        </div>
                      </div>
                    )}

                    {/* Contact Settings */}
                    {activeSection === 'contact' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">Contact Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
                            <input
                              type="tel"
                              name="contactNumber"
                              value={settings.contactNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="+91 1234567890"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
                            <input
                              type="tel"
                              name="whatsappNumber"
                              value={settings.whatsappNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="+91 1234567890"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Call Number</label>
                            <input
                              type="tel"
                              name="callNumber"
                              value={settings.callNumber}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="+91 1234567890"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
                            <input
                              type="email"
                              name="contactEmail"
                              value={settings.contactEmail}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="contact@example.com"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Address</label>
                            <textarea
                              name="companyAddress"
                              value={settings.companyAddress}
                              onChange={handleInputChange}
                              rows="3"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="123 Street, City, Country"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Social Media */}
                    {activeSection === 'social' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">Social Media Links</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                          {['facebookUrl', 'twitterUrl', 'instagramUrl', 'youtubeUrl', 'linkedinUrl'].map((field) => (
                            <div key={field}>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
                                {field.replace('Url', '').replace(/([A-Z])/g, ' $1').trim()} URL
                              </label>
                              <input
                                type="url"
                                name={field}
                                value={settings[field]}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder={`https://${field.replace('Url', '').toLowerCase()}.com/yourpage`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Settings */}
                    {activeSection === 'footer' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">Footer Settings</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Footer Text</label>
                          <textarea
                            name="footerText"
                            value={settings.footerText}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="© 2024 My Store. All rights reserved."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Footer Links</label>
                          <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                            {footerLinks.map((link, index) => (
                              <div key={index} className="flex flex-col sm:flex-row gap-2 p-2 bg-gray-50 rounded-lg">
                                <input
                                  type="text"
                                  value={link.name}
                                  onChange={(e) => {
                                    const newLinks = [...footerLinks];
                                    newLinks[index].name = e.target.value;
                                    setFooterLinks(newLinks);
                                  }}
                                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  placeholder="Link Name"
                                />
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={(e) => {
                                    const newLinks = [...footerLinks];
                                    newLinks[index].url = e.target.value;
                                    setFooterLinks(newLinks);
                                  }}
                                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  placeholder="https://example.com"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFooterLink(index)}
                                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={newFooterLink.name}
                              onChange={(e) => setNewFooterLink(prev => ({ ...prev, name: e.target.value }))}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Link Name"
                            />
                            <input
                              type="url"
                              value={newFooterLink.url}
                              onChange={(e) => setNewFooterLink(prev => ({ ...prev, url: e.target.value }))}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="https://example.com"
                            />
                            <button
                              type="button"
                              onClick={handleAddFooterLink}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Plus size={16} className="inline mr-1" />
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shipping Settings */}
                    {activeSection === 'shipping' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">Shipping Settings</h3>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">General Information</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Shipping Info</label>
                              <textarea
                                name="shippingInfo"
                                value={settings.shippingInfo}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Shipping policy description"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Processing Time</label>
                              <textarea
                                name="orderProcessingTime"
                                value={settings.orderProcessingTime}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="1-2 business days"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Standard Shipping</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Time</label>
                              <input
                                type="text"
                                name="standardShippingDelivery"
                                value={settings.standardShippingDelivery}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="5-7 days"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost</label>
                              <input
                                type="text"
                                name="standardShippingCost"
                                value={settings.standardShippingCost}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="₹4.99"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Free Shipping Above</label>
                              <input
                                type="text"
                                name="standardFreeShippingThreshold"
                                value={settings.standardFreeShippingThreshold}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="₹50"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">International Shipping</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Time</label>
                              <input
                                type="text"
                                name="internationalShippingDelivery"
                                value={settings.internationalShippingDelivery}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="10-15 days"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Note</label>
                              <textarea
                                name="internationalShippingNote"
                                value={settings.internationalShippingNote}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="International shipping costs vary by destination"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Returns & Refunds */}
                    {activeSection === 'returns' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">Returns & Refunds</h3>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Policy Overview</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Policy Title</label>
                              <input
                                type="text"
                                name="returnsPolicyTitle"
                                value={settings.returnsPolicyTitle}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Returns & Refunds Policy"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Policy Description</label>
                              <textarea
                                name="returnsPolicyDescription"
                                value={settings.returnsPolicyDescription}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="We want you to be completely satisfied with your purchase"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Return Process</h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {settings.returnProcessSteps.map((step, index) => (
                              <div key={index} className="flex flex-col sm:flex-row gap-2 p-2 bg-white rounded border">
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => {
                                    const newSteps = [...settings.returnProcessSteps];
                                    newSteps[index].title = e.target.value;
                                    setSettings(prev => ({ ...prev, returnProcessSteps: newSteps }));
                                  }}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder="Step Title"
                                />
                                <input
                                  type="text"
                                  value={step.description}
                                  onChange={(e) => {
                                    const newSteps = [...settings.returnProcessSteps];
                                    newSteps[index].description = e.target.value;
                                    setSettings(prev => ({ ...prev, returnProcessSteps: newSteps }));
                                  }}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder="Step Description"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveReturnStep(index)}
                                  className="text-red-600 hover:text-red-800 px-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <input
                              type="text"
                              value={newReturnStep.title}
                              onChange={(e) => setNewReturnStep(prev => ({ ...prev, title: e.target.value }))}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Step Title"
                            />
                            <input
                              type="text"
                              value={newReturnStep.description}
                              onChange={(e) => setNewReturnStep(prev => ({ ...prev, description: e.target.value }))}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Step Description"
                            />
                            <button
                              type="button"
                              onClick={handleAddReturnStep}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Plus size={16} className="inline mr-1" />
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Conditions</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Timeframe</label>
                              <input
                                type="text"
                                name="returnTimeframe"
                                value={settings.returnTimeframe}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="30 days"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Conditions</label>
                              <div className="space-y-2 mb-2 max-h-40 overflow-y-auto">
                                {settings.returnConditions.map((condition, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                    <span className="text-sm">{condition}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveReturnCondition(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newReturnCondition}
                                  onChange={(e) => setNewReturnCondition(e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="Add condition"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddReturnCondition}
                                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Refund Information</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Processing Time</label>
                              <input
                                type="text"
                                name="refundProcessingTime"
                                value={settings.refundProcessingTime}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="5-10 business days"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Refund Note</label>
                              <textarea
                                name="refundNote"
                                value={settings.refundNote}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Refund processing note"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Privacy Policy */}
                    {activeSection === 'privacy' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">Privacy Policy</h3>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Policy Header</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                              <input
                                type="text"
                                name="privacyPolicyTitle"
                                value={settings.privacyPolicyTitle}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Privacy Policy"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Updated</label>
                              <input
                                type="text"
                                name="privacyPolicyLastUpdated"
                                value={settings.privacyPolicyLastUpdated}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="2026"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Introduction</label>
                              <textarea
                                name="privacyPolicyIntroduction"
                                value={settings.privacyPolicyIntroduction}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Introduction text"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Data We Collect</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {settings.dataWeCollect.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm">{item}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDataWeCollect(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={newDataWeCollect}
                              onChange={(e) => setNewDataWeCollect(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Add data type"
                            />
                            <button
                              type="button"
                              onClick={handleAddDataWeCollect}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">How We Use Information</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {settings.howWeUseInformation.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm">{item}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveHowWeUseInfo(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={newHowWeUseInfo}
                              onChange={(e) => setNewHowWeUseInfo(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Add usage purpose"
                            />
                            <button
                              type="button"
                              onClick={handleAddHowWeUseInfo}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Terms of Service */}
                    {activeSection === 'terms' && (
                      <div className="space-y-4 sm:space-y-6">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 border-b pb-3">Terms of Service</h3>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Policy Header</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                              <input
                                type="text"
                                name="termsOfServiceTitle"
                                value={settings.termsOfServiceTitle}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Terms of Service"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Updated</label>
                              <input
                                type="text"
                                name="termsOfServiceLastUpdated"
                                value={settings.termsOfServiceLastUpdated}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="2026"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">Important Notice</label>
                              <textarea
                                name="termsImportantNotice"
                                value={settings.termsImportantNotice}
                                onChange={handleInputChange}
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Important notice"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">User Requirements</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {settings.termsUserRequirements.map((req, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <span className="text-sm">{req}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTermsUserRequirement(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={newTermsUserRequirement}
                              onChange={(e) => setNewTermsUserRequirement(e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Add requirement"
                            />
                            <button
                              type="button"
                              onClick={handleAddTermsUserRequirement}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Terms Sections</h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {settings.termsSections.map((section, index) => (
                              <div key={index} className="p-2 bg-white rounded border space-y-2">
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <span className="text-xs text-gray-500 font-medium">#{section.number}</span>
                                  <input
                                    type="text"
                                    value={section.title}
                                    onChange={(e) => handleUpdateTermsSection(index, 'title', e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Section Title"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTermsSection(index)}
                                    className="text-red-600 hover:text-red-800 px-2"
                                  >
                                    ×
                                  </button>
                                </div>
                                <textarea
                                  value={section.content}
                                  onChange={(e) => handleUpdateTermsSection(index, 'content', e.target.value)}
                                  rows="2"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder="Section Content"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-3">
                            <input
                              type="text"
                              value={newTermsSection.title}
                              onChange={(e) => setNewTermsSection(prev => ({ ...prev, title: e.target.value }))}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Section Title"
                            />
                            <input
                              type="text"
                              value={newTermsSection.content}
                              onChange={(e) => setNewTermsSection(prev => ({ ...prev, content: e.target.value }))}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Section Content"
                            />
                            <button
                              type="button"
                              onClick={handleAddTermsSection}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Plus size={16} className="inline mr-1" />
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Settings;