import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/services/leadsService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Lead } from '@/types';
import { 
  Users, 
  Plus, 
  Search,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

export default function LeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Lead>>({});

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.getAll(), // Remove statusFilter from queryKey
    staleTime: 30000, // Keep data fresh for 30 seconds
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsCreateOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Lead>) =>
      leadsApi.update(selectedLead!.leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditOpen(false);
      setSelectedLead(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => leadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLead(null);
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: number) => leadsApi.convert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedLead(null);
    },
  });

  // Enum mappings for backend numeric enums
  const statusMap: Record<string, number> = {
    'New': 0,
    'Demo': 1,
    'Converted': 2,
    'Lost': 3,
  };

  const statusReverseMap: Record<number, string> = {
    0: 'New',
    1: 'Demo',
    2: 'Converted',
    3: 'Lost',
  };

  const leadSourceMap: Record<string, number> = {
    'Website': 0,
    'Referral': 1,
    'ColdCall': 2,
    'Campaign': 3,
    'SocialMedia': 4,
    'Other': 5,
  };

  const leadSourceReverseMap: Record<number, string> = {
    0: 'Website',
    1: 'Referral',
    2: 'ColdCall',
    3: 'Campaign',
    4: 'SocialMedia',
    5: 'Other',
  };

  const ratingMap: Record<string, number> = {
    'Hot': 0,
    'Warm': 1,
    'Cold': 2,
  };

  const ratingReverseMap: Record<number, string> = {
    0: 'Hot',
    1: 'Warm',
    2: 'Cold',
  };

  // Helper function to get display names
  const getStatusDisplay = (value: any) => statusReverseMap[Number(value)] || 'Unknown';
  const getSourceDisplay = (value: any) => leadSourceReverseMap[Number(value)] || 'N/A';
  const getRatingDisplay = (value: any) => ratingReverseMap[Number(value)] || 'N/A';

  // Calculate lead counts by status - using useMemo to prevent recalculations
  // These counts should be based on ALL leads, not filtered ones
  const leadCounts = useMemo(() => {
    if (!leads) return { New: 0, Demo: 0, Converted: 0, Lost: 0, total: 0 };
    
    return {
      New: leads.filter(l => getStatusDisplay(l.status) === 'New').length,
      Demo: leads.filter(l => getStatusDisplay(l.status) === 'Demo').length,
      Converted: leads.filter(l => getStatusDisplay(l.status) === 'Converted').length,
      Lost: leads.filter(l => getStatusDisplay(l.status) === 'Lost').length,
      total: leads.length
    };
  }, [leads]); // Only recalculate when leads data actually changes

  const statusCards = [
    { 
      status: 'All', 
      count: leadCounts.total, 
      icon: Users, 
      bgColor: 'bg-gray-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-gray-700',
      activeBorderColor: 'ring-4 ring-gray-400 ring-offset-2'
    },
    { 
      status: 'New', 
      count: leadCounts.New, 
      icon: Clock, 
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-blue-700',
      activeBorderColor: 'ring-4 ring-blue-300 ring-offset-2'
    },
    { 
      status: 'Demo', 
      count: leadCounts.Demo, 
      icon: TrendingUp, 
      bgColor: 'bg-purple-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-purple-700',
      activeBorderColor: 'ring-4 ring-purple-300 ring-offset-2'
    },
    { 
      status: 'Converted', 
      count: leadCounts.Converted, 
      icon: CheckCircle, 
      bgColor: 'bg-green-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-green-700',
      activeBorderColor: 'ring-4 ring-green-300 ring-offset-2'
    },
    { 
      status: 'Lost', 
      count: leadCounts.Lost, 
      icon: XCircle, 
      bgColor: 'bg-red-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-red-700',
      activeBorderColor: 'ring-4 ring-red-300 ring-offset-2'
    },
  ];

  const handleStatusFilterClick = (status: string) => {
    // Prevent unnecessary updates if same filter is clicked
    if (status === 'All') {
      if (statusFilter === undefined) return;
      setStatusFilter(undefined);
    } else {
      if (statusFilter === status) return;
      setStatusFilter(status);
    }
  };

  const handleCreate = () => {
    if (!formData.companyName?.trim() || !formData.contactName?.trim()) {
      alert('Company Name and Contact Name are required');
      return;
    }
    createMutation.mutate({
      companyName: formData.companyName.trim(),
      contactName: formData.contactName.trim(),
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      industry: formData.industry?.trim() || undefined,
      status: statusMap[formData.status || 'New'] as unknown as Lead['status'],
      notes: formData.notes?.trim() || undefined,
      leadSource: formData.leadSource ? leadSourceMap[formData.leadSource] as unknown as Lead['leadSource'] : undefined,
      rating: formData.rating ? ratingMap[formData.rating] as unknown as Lead['rating'] : undefined,
      assignedTo: formData.assignedTo,
      estimatedValue: formData.estimatedValue,
      expectedCloseDate: formData.expectedCloseDate,
    });
  };

  const handleUpdate = () => {
    if (!formData.companyName?.trim() || !formData.contactName?.trim()) {
      alert('Company Name and Contact Name are required');
      return;
    }
    updateMutation.mutate({
      companyName: formData.companyName.trim(),
      contactName: formData.contactName.trim(),
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      industry: formData.industry?.trim() || undefined,
      status: statusMap[formData.status || 'New'] as unknown as Lead['status'],
      notes: formData.notes?.trim() || undefined,
      leadSource: formData.leadSource ? leadSourceMap[formData.leadSource] as unknown as Lead['leadSource'] : undefined,
      rating: formData.rating ? ratingMap[formData.rating] as unknown as Lead['rating'] : undefined,
      assignedTo: formData.assignedTo,
      estimatedValue: formData.estimatedValue,
      expectedCloseDate: formData.expectedCloseDate,
    });
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData(lead);
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleConvert = (id: number) => {
    if (confirm('Convert this lead to a customer?')) {
      convertMutation.mutate(id);
    }
  };

  // Filter leads based on status and search - this is just for display
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    
    let filtered = leads;
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(lead => getStatusDisplay(lead.status) === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.companyName?.toLowerCase().includes(searchLower) ||
        lead.contactName?.toLowerCase().includes(searchLower) ||
        lead.email?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [leads, statusFilter, searchTerm]);

  const getStatusBadgeColor = (status: string) => {
    const displayStatus = getStatusDisplay(status);
    switch (displayStatus) {
      case 'Converted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Demo':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Lost':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getRatingIcon = (rating: any) => {
    const displayRating = getRatingDisplay(rating);
    switch (displayRating) {
      case 'Hot':
        return <span className="text-red-500">🔥</span>;
      case 'Warm':
        return <span className="text-orange-500">🌡️</span>;
      case 'Cold':
        return <span className="text-blue-500">❄️</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-500">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Leads
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manage and track your sales pipeline
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Create Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Plus className="h-6 w-6 text-blue-600" />
                  Create New Lead
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                {/* Required Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-500 rounded-full"></span>
                    Required Information
                  </h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter company name"
                      value={formData.companyName || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter contact person name"
                      value={formData.contactName || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, contactName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="contact@company.com"
                        value={formData.email || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={formData.phone || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Website
                    </label>
                    <input
                      type="text"
                      placeholder="www.company.com"
                      value={formData.website || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Business Details
                  </h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Industry
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Technology, Finance, Healthcare"
                      value={formData.industry || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, industry: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Lead Source
                      </label>
                      <select
                        value={formData.leadSource || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, leadSource: (e.target.value || undefined) as Lead['leadSource'] })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select source</option>
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                        <option value="ColdCall">Cold Call</option>
                        <option value="Campaign">Campaign</option>
                        <option value="SocialMedia">Social Media</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Lead Rating
                      </label>
                      <select
                        value={formData.rating || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, rating: (e.target.value || undefined) as Lead['rating'] })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select rating</option>
                        <option value="Hot">🔥 Hot (High Priority)</option>
                        <option value="Warm">🌡️ Warm (Medium Priority)</option>
                        <option value="Cold">❄️ Cold (Low Priority)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pipeline & Timeline */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    Pipeline & Timeline
                  </h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Lead Status
                    </label>
                    <select
                      value={formData.status || 'New'}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as Lead['status'] })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="New">New</option>
                      <option value="Demo">Demo</option>
                      <option value="Converted">Converted</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Estimated Value (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.estimatedValue || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, estimatedValue: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Expected Close Date
                      </label>
                      <input
                        type="date"
                        value={formData.expectedCloseDate ? formData.expectedCloseDate.split('T')[0] : ''}
                        onChange={(e) =>
                          setFormData({ ...formData, expectedCloseDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                    Additional Information
                  </h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Notes
                    </label>
                    <textarea
                      placeholder="Add any additional notes about this lead..."
                      value={formData.notes || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  onClick={handleCreate} 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold h-11 rounded-lg transition-all duration-200 mt-6" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Lead
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Status Cards - These counts will NEVER change when filtering */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statusCards.map((card) => {
            const Icon = card.icon;
            const isActive = card.status === 'All' 
              ? statusFilter === undefined 
              : statusFilter === card.status;
            
            return (
              <Card
                key={card.status}
                className={`
                  relative overflow-hidden cursor-pointer transition-all duration-200
                  ${card.bgColor} border-2 ${card.borderColor}
                  hover:scale-105 hover:shadow-xl
                  ${isActive ? card.activeBorderColor : 'hover:brightness-110'}
                `}
                onClick={() => handleStatusFilterClick(card.status)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white/20 text-white`}>
                      {card.count}
                    </span>
                  </div>
                  <p className={`text-sm font-medium ${card.textColor} opacity-90`}>
                    {card.status}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${card.countColor}`}>
                    {card.count}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Search Bar */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by company, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </Card>

        {/* Leads Table - Shows filtered results */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads && filteredLeads.length > 0 ? (
                  filteredLeads.map((lead, idx) => (
                    <tr 
                      key={lead.leadId} 
                      className={`transition-all duration-200 hover:bg-blue-50 group ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            {lead.companyName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{lead.companyName}</p>
                            {lead.industry && (
                              <p className="text-xs text-gray-500">{lead.industry}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{lead.contactName || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {lead.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </p>
                          )}
                          {lead.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusBadgeColor(lead.status)}>
                          {getStatusDisplay(lead.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {getRatingIcon(lead.rating)}
                          <span className="text-sm text-gray-600">
                            {getRatingDisplay(lead.rating)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {getSourceDisplay(lead.leadSource)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lead.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/leads/${lead.leadId}`)}
                            className="hover:bg-blue-100 hover:text-blue-600"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Dialog open={isEditOpen && selectedLead?.leadId === lead.leadId} onOpenChange={setIsEditOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(lead)}
                                className="hover:bg-amber-100 hover:text-amber-600"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2">
                                  <Edit className="h-6 w-6 text-amber-600" />
                                  Edit Lead
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                                {/* Required Section */}
                                <div className="space-y-4">
                                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-red-500 rounded-full"></span>
                                    Required Information
                                  </h3>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                      Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Enter company name"
                                      value={formData.companyName || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, companyName: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                      Contact Person <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Enter contact person name"
                                      value={formData.contactName || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, contactName: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                  </div>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-4">
                                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                    Contact Information
                                  </h3>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Email Address
                                      </label>
                                      <input
                                        type="email"
                                        placeholder="contact@company.com"
                                        value={formData.email || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Phone Number
                                      </label>
                                      <input
                                        type="tel"
                                        placeholder="+91 XXXXX XXXXX"
                                        value={formData.phone || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, phone: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                      Website
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="www.company.com"
                                      value={formData.website || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, website: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                  </div>
                                </div>

                                {/* Business Details */}
                                <div className="space-y-4">
                                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                                    Business Details
                                  </h3>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                      Industry
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g., Technology, Finance, Healthcare"
                                      value={formData.industry || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, industry: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Lead Source
                                      </label>
                                      <select
                                        value={formData.leadSource || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, leadSource: (e.target.value || undefined) as Lead['leadSource'] })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      >
                                        <option value="">Select source</option>
                                        <option value="Website">Website</option>
                                        <option value="Referral">Referral</option>
                                        <option value="ColdCall">Cold Call</option>
                                        <option value="Campaign">Campaign</option>
                                        <option value="SocialMedia">Social Media</option>
                                        <option value="Other">Other</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Lead Rating
                                      </label>
                                      <select
                                        value={formData.rating || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, rating: (e.target.value || undefined) as Lead['rating'] })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      >
                                        <option value="">Select rating</option>
                                        <option value="Hot">🔥 Hot (High Priority)</option>
                                        <option value="Warm">🌡️ Warm (Medium Priority)</option>
                                        <option value="Cold">❄️ Cold (Low Priority)</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                {/* Pipeline & Timeline */}
                                <div className="space-y-4">
                                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                    Pipeline & Timeline
                                  </h3>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                      Lead Status
                                    </label>
                                    <select
                                      value={formData.status || 'New'}
                                      onChange={(e) =>
                                        setFormData({ ...formData, status: e.target.value as Lead['status'] })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    >
                                      <option value="New">New</option>
                                      <option value="Demo">Demo</option>
                                      <option value="Converted">Converted</option>
                                      <option value="Lost">Lost</option>
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Estimated Value (₹)
                                      </label>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.estimatedValue || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, estimatedValue: e.target.value ? Number(e.target.value) : undefined })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Expected Close Date
                                      </label>
                                      <input
                                        type="date"
                                        value={formData.expectedCloseDate ? formData.expectedCloseDate.split('T')[0] : ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, expectedCloseDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Additional Notes */}
                                <div className="space-y-4">
                                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                                    Additional Information
                                  </h3>
                                  
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                      Notes
                                    </label>
                                    <textarea
                                      placeholder="Add any additional notes about this lead..."
                                      value={formData.notes || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      rows={3}
                                    />
                                  </div>
                                </div>

                                {/* Submit Button */}
                                <Button 
                                  onClick={handleUpdate} 
                                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold h-11 rounded-lg transition-all duration-200 mt-6" 
                                  disabled={updateMutation.isPending}
                                >
                                  {updateMutation.isPending ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Update Lead
                                    </>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {getStatusDisplay(lead.status) !== 'Converted' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConvert(lead.leadId)}
                              className="hover:bg-green-100 hover:text-green-600"
                              title="Convert to Customer"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lead.leadId)}
                            className="hover:bg-red-100 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">No leads found</p>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateOpen(true)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create your first lead
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}