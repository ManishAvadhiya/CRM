import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeadHistoryTimeline } from '@/components/ui/LeadHistoryTimeline';
import { leadsService } from '@/services/leadsService';
import { customersApi } from '@/services';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

import { 
  ArrowLeft, 
  MessageSquare, 
  CheckCircle, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  Calendar,
  Clock,
  Edit3,
  X,
  Save,
  AlertCircle,
  FileText,
  MapPin,
  Hash,
  Briefcase,
  Tag
} from 'lucide-react';

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lead, setLead] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customerFormData, setCustomerFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    alternatePhone: '',
    website: '',
    industry: '',
    customerType: 'Business',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingCountry: 'India',
    billingPostalCode: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingCountry: 'India',
    shippingPostalCode: '',
    gstNumber: '',
    panNumber: '',
  });

  const leadStatuses = ['New', 'Demo', 'Converted', 'Lost'];

  useEffect(() => {
    loadLeadDetails();
  }, [id]);

  const loadLeadDetails = async () => {
    try {
      setIsLoading(true);
      if (id) {
        const data = await leadsService.getWithHistory(parseInt(id));
        setLead(data);
        setHistory(data.history || []);
        setNewStatus(data.status || '');
      }
    } catch (error) {
      console.error('Error loading lead:', error);
      setError('Failed to load lead details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !id) return;

    setError('');
    setSuccess('');
    try {
      setIsSubmitting(true);
      await leadsService.addNote(parseInt(id), noteText);
      setNoteText('');
      setShowAddNote(false);
      setSuccess('Note added successfully');
      await loadLeadDetails();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error adding note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || !id) return;

    if (newStatus === lead?.status) {
      setShowStatusChange(false);
      return;
    }

    setError('');
    setSuccess('');
    try {
      setIsSubmitting(true);
      await leadsService.updateStatus(parseInt(id), { status: newStatus });
      setShowStatusChange(false);
      setSuccess('Lead status updated successfully');
      await loadLeadDetails();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error updating status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError('');
    setSuccess('');
    try {
      setIsSubmitting(true);
      
      const customerTypeEnum = (customerFormData.customerType || 'Business') === 'Individual' ? 0 : 1;
      
      const customerData = {
        leadId: parseInt(id),
        companyName: customerFormData.companyName || lead.companyName,
        contactPerson: customerFormData.contactPerson || lead.contactName,
        email: customerFormData.email || lead.email,
        phone: customerFormData.phone || lead.phone,
        website: customerFormData.website || lead.website,
        industry: customerFormData.industry || lead.industry,
        alternatePhone: customerFormData.alternatePhone,
        customerType: customerTypeEnum as any,
        billingAddress: customerFormData.billingAddress,
        billingCity: customerFormData.billingCity,
        billingState: customerFormData.billingState,
        billingCountry: customerFormData.billingCountry,
        billingPostalCode: customerFormData.billingPostalCode,
        shippingAddress: customerFormData.shippingAddress,
        shippingCity: customerFormData.shippingCity,
        shippingState: customerFormData.shippingState,
        shippingCountry: customerFormData.shippingCountry,
        shippingPostalCode: customerFormData.shippingPostalCode,
        gstNumber: customerFormData.gstNumber,
        panNumber: customerFormData.panNumber,
      };

      await customersApi.create(customerData);
      await leadsService.updateStatus(parseInt(id), { status: 'Converted' });
      
      setShowConvertForm(false);
      setSuccess('Lead converted to customer successfully');
      await loadLeadDetails();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error converting lead to customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      New: 'bg-blue-100 text-blue-800 border-blue-200',
      Demo: 'bg-purple-100 text-purple-800 border-purple-200',
      Converted: 'bg-green-100 text-green-800 border-green-200',
      Lost: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New':
        return <Tag className="h-4 w-4" />;
      case 'Demo':
        return <Calendar className="h-4 w-4" />;
      case 'Converted':
        return <CheckCircle className="h-4 w-4" />;
      case 'Lost':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const canEdit = user?.role === 'ManagementAdmin' || lead?.createdBy === user?.userId;
  const canConvert = canEdit && lead?.status !== 'Converted' && lead?.status !== 'Lost';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Lead not found</p>
          <Button onClick={() => navigate('/leads')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with breadcrumb */}
        <div className="mb-6">
          {/* <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <button 
              onClick={() => navigate('/leads')}
              className="hover:text-blue-600 transition-colors"
            >
              Leads
            </button>
            <span>/</span>
            <span className="text-gray-700">{lead.name}</span>
          </div> */}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/leads')}
                variant="ghost"
                size="sm"
                className="hover:bg-gray-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
              <Badge className={`${getStatusColor(lead.status)} flex items-center gap-1`}>
                {getStatusIcon(lead.status)}
                {lead.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Content - Lead Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Information Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Lead Information
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                        <p className="text-gray-900 mt-1">{lead.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Company</p>
                        <p className="text-gray-900 mt-1">{lead.companyName || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Website</p>
                        <p className="text-gray-900 mt-1">{lead.website || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                        <p className="text-gray-900 mt-1">{lead.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Briefcase className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</p>
                        <p className="text-gray-900 mt-1">{lead.industry || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Tag className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Source</p>
                        <p className="text-gray-900 mt-1">{lead.leadSource || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {lead.notes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium text-gray-700">Notes</p>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {canEdit && (
                  <div className="mt-6 flex flex-wrap gap-3 border-t pt-6">
                    <Button
                      onClick={() => setShowAddNote(true)}
                      variant="outline"
                      className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                    <Button
                      onClick={() => setShowStatusChange(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Change Status
                    </Button>
                    {canConvert && (
                      <Button
                        onClick={() => setShowConvertForm(true)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Convert to Customer
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Add Note Form */}
            {showAddNote && canEdit && (
              <Card className="overflow-hidden border-blue-200">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Add a Note
                  </h3>
                </div>
                <form onSubmit={handleAddNote} className="p-6">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write your note here..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                  <div className="flex gap-3 mt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !noteText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Add Note
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddNote(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Change Status Form */}
            {showStatusChange && canEdit && (
              <Card className="overflow-hidden border-purple-200">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-3">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Change Status
                  </h3>
                </div>
                <form onSubmit={handleStatusChange} className="p-6">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a status</option>
                    {leadStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-3 mt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !newStatus || newStatus === lead.status}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Status
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowStatusChange(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Convert to Customer Form */}
            {showConvertForm && canConvert && (
              <Card className="overflow-hidden border-green-200">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-3">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Convert Lead to Customer
                  </h3>
                </div>
                <form onSubmit={handleConvert} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={customerFormData.companyName || lead.companyName || ''}
                          onChange={(e) =>
                            setCustomerFormData({
                              ...customerFormData,
                              companyName: e.target.value,
                            })
                          }
                          placeholder="Company name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          value={customerFormData.contactPerson || lead.contactName || ''}
                          onChange={(e) =>
                            setCustomerFormData({
                              ...customerFormData,
                              contactPerson: e.target.value,
                            })
                          }
                          placeholder="Contact person"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                          Email
                        </label>
                        <input
                          type="email"
                          value={customerFormData.email || lead.email || ''}
                          onChange={(e) =>
                            setCustomerFormData({
                              ...customerFormData,
                              email: e.target.value,
                            })
                          }
                          placeholder="Email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={customerFormData.phone || lead.phone || ''}
                          onChange={(e) =>
                            setCustomerFormData({
                              ...customerFormData,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Phone"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Address */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Billing Address
                    </h4>
                    <textarea
                      value={customerFormData.billingAddress}
                      onChange={(e) =>
                        setCustomerFormData({
                          ...customerFormData,
                          billingAddress: e.target.value,
                        })
                      }
                      placeholder="Billing address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={customerFormData.billingCity}
                        onChange={(e) =>
                          setCustomerFormData({
                            ...customerFormData,
                            billingCity: e.target.value,
                          })
                        }
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={customerFormData.billingState}
                        onChange={(e) =>
                          setCustomerFormData({
                            ...customerFormData,
                            billingState: e.target.value,
                          })
                        }
                        placeholder="State"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={customerFormData.billingPostalCode}
                        onChange={(e) =>
                          setCustomerFormData({
                            ...customerFormData,
                            billingPostalCode: e.target.value,
                          })
                        }
                        placeholder="Postal Code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={customerFormData.gstNumber}
                        onChange={(e) =>
                          setCustomerFormData({
                            ...customerFormData,
                            gstNumber: e.target.value,
                          })
                        }
                        placeholder="GST Number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Converting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Convert to Customer
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowConvertForm(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>

          {/* Sidebar - Metadata */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Details
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
                    <Badge className={`${getStatusColor(lead.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(lead.status)}
                      {lead.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created</p>
                    <p className="text-gray-900 font-medium">
                      {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(lead.createdAt), 'h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created By</p>
                    <p className="text-gray-900 font-medium">{lead.createdByName || 'Unknown'}</p>
                  </div>
                </div>

                {lead.updatedAt && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Last Updated</p>
                      <p className="text-gray-900 font-medium">
                        {format(new Date(lead.updatedAt), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(lead.updatedAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* History Timeline */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lead History
            </h2>
          </div>
          
          <div className="p-6">
            {history && history.length > 0 ? (
              <LeadHistoryTimeline history={history} />
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No history events yet</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}