import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/services/leadsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import type { Lead } from '@/types';

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<Lead>>({});

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', statusFilter],
    queryFn: () => leadsApi.getAll(statusFilter),
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
    'Contacted': 1,
    'Qualified': 2,
    'Converted': 3,
    'Lost': 4,
  };

  const statusReverseMap: Record<number, string> = {
    0: 'New',
    1: 'Contacted',
    2: 'Qualified',
    3: 'Converted',
    4: 'Lost',
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

  if (isLoading) {
    return <div className="p-8">Loading leads...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage your sales leads</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ Create Lead</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
              {/* Required Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  Required Information
                </h3>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={formData.companyName || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">The name of the company</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter contact person name"
                    value={formData.contactName || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">Name of the person to contact</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Website
                  </label>
                  <input
                    type="text"
                    placeholder="www.company.com"
                    value={formData.website || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Business Details</h3>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Industry
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Technology, Finance, Healthcare"
                    value={formData.industry || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                      Lead Source
                    </label>
                    <select
                      value={formData.leadSource || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, leadSource: (e.target.value || undefined) as Lead['leadSource'] })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select source</option>
                      <option value="Website">Website</option>
                      <option value="Referral">Referral</option>
                      <option value="ColdCall">Cold Call</option>
                      <option value="Campaign">Campaign</option>
                      <option value="SocialMedia">Social Media</option>
                      <option value="Other">Other</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">How you found this lead</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                      Lead Rating
                    </label>
                    <select
                      value={formData.rating || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, rating: (e.target.value || undefined) as Lead['rating'] })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select rating</option>
                      <option value="Hot">🔥 Hot (High Priority)</option>
                      <option value="Warm">🌡️ Warm (Medium Priority)</option>
                      <option value="Cold">❄️ Cold (Low Priority)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Priority level of the lead</p>
                  </div>
                </div>
              </div>

              {/* Pipeline & Timeline */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Pipeline & Timeline</h3>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Lead Status
                  </label>
                  <select
                    value={formData.status || 'New'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as Lead['status'] })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Current stage in the sales pipeline</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                      Estimated Value (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.estimatedValue || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedValue: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Potential deal value</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                      Expected Close Date
                    </label>
                    <input
                      type="date"
                      value={formData.expectedCloseDate ? formData.expectedCloseDate.split('T')[0] : ''}
                      onChange={(e) =>
                        setFormData({ ...formData, expectedCloseDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })
                      }
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">When you expect to close</p>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Additional Information</h3>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Notes
                  </label>
                  <textarea
                    placeholder="Add any additional notes about this lead..."
                    value={formData.notes || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleCreate} 
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold h-11 rounded-lg transition-all duration-200 mt-6" 
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? '⚙️ Creating...' : '✓ Create Lead'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Button
          variant={statusFilter === undefined ? 'default' : 'outline'}
          onClick={() => setStatusFilter(undefined)}
        >
          All
        </Button>
        {['New', 'Contacted', 'Qualified', 'Converted', 'Lost'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {leads?.map((lead) => (
          <Card key={lead.leadId}>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle>{lead.companyName}</CardTitle>
                <p className="text-sm text-muted-foreground">{lead.contactName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                lead.status === 'Converted' ? 'bg-green-100 text-green-800' :
                lead.status === 'Qualified' ? 'bg-blue-100 text-blue-800' :
                lead.status === 'Lost' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {getStatusDisplay(lead.status)}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {lead.email || 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  {lead.phone || 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  {formatDate(lead.createdAt)}
                </div>
                <div>
                  <span className="text-muted-foreground">Rating: </span>
                  {getRatingDisplay(lead.rating)}
                </div>
                <div>
                  <span className="text-muted-foreground">Lead Source: </span>
                  {getSourceDisplay(lead.leadSource)}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Dialog open={isEditOpen && selectedLead?.leadId === lead.leadId} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(lead)}
                    >
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Edit Lead</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                      {/* Required Section */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <span className="text-red-500">*</span>
                          Required Information
                        </h3>
                        
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Company Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter company name"
                            value={formData.companyName || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, companyName: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Contact Person <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter contact person name"
                            value={formData.contactName || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, contactName: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
                        
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Email Address
                          </label>
                          <input
                            type="email"
                            placeholder="contact@company.com"
                            value={formData.email || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+91 XXXXX XXXXX"
                            value={formData.phone || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Website
                          </label>
                          <input
                            type="text"
                            placeholder="www.company.com"
                            value={formData.website || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, website: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>

                      {/* Business Details */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900">Business Details</h3>
                        
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Industry
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Technology, Finance, Healthcare"
                            value={formData.industry || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, industry: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                              Lead Source
                            </label>
                            <select
                              value={formData.leadSource || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, leadSource: (e.target.value || undefined) as Lead['leadSource'] })
                              }
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                              Lead Rating
                            </label>
                            <select
                              value={formData.rating || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, rating: (e.target.value || undefined) as Lead['rating'] })
                              }
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                        <h3 className="text-sm font-semibold text-slate-900">Pipeline & Timeline</h3>
                        
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Lead Status
                          </label>
                          <select
                            value={formData.status || 'New'}
                            onChange={(e) =>
                              setFormData({ ...formData, status: e.target.value as Lead['status'] })
                            }
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Converted">Converted</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                              Estimated Value (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={formData.estimatedValue || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, estimatedValue: e.target.value ? Number(e.target.value) : undefined })
                              }
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                              Expected Close Date
                            </label>
                            <input
                              type="date"
                              value={formData.expectedCloseDate ? formData.expectedCloseDate.split('T')[0] : ''}
                              onChange={(e) =>
                                setFormData({ ...formData, expectedCloseDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })
                              }
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900">Additional Information</h3>
                        
                        <div>
                          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Notes
                          </label>
                          <textarea
                            placeholder="Add any additional notes about this lead..."
                            value={formData.notes || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, notes: e.target.value })
                            }
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button 
                        onClick={handleUpdate} 
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold h-11 rounded-lg transition-all duration-200 mt-6" 
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? '⚙️ Updating...' : '✓ Update Lead'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {lead.status !== 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConvert(lead.leadId)}
                  >
                    Convert to Customer
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(lead.leadId)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
