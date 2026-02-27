import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/services';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Customer } from '@/types';
import { 
  Users, 
  Plus, 
  Search,
  Eye,
  Edit,
  Trash2,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Hash,
  Globe,
  UserCircle,
  Store,
  FileText
} from 'lucide-react';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<Customer>>({
    customerType: 'Business',
    billingCountry: 'India',
    shippingCountry: 'India',
  });

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateOpen(false);
      setFormData({
        customerType: 'Business',
        billingCountry: 'India',
        shippingCountry: 'India',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Customer>) =>
      customersApi.update(selectedCustomer!.customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditOpen(false);
      setSelectedCustomer(null);
      setFormData({
        customerType: 'Business',
        billingCountry: 'India',
        shippingCountry: 'India',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(null);
    },
  });

  // Calculate customer counts by type
  const customerCounts = useMemo(() => {
    if (!customers) return { Business: 0, Individual: 0, total: 0 };
    
    return {
      Business: customers.filter(c => c.customerType === 1).length,
      Individual: customers.filter(c => c.customerType === 0).length,
      total: customers.length
    };
  }, [customers]);

  const typeCards = [
    { 
      type: 'All', 
      count: customerCounts.total, 
      icon: Users, 
      bgColor: 'bg-gray-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-gray-700',
      activeBorderColor: 'ring-4 ring-gray-400 ring-offset-2'
    },
    { 
      type: 'Business', 
      count: customerCounts.Business, 
      icon: Store, 
      bgColor: 'bg-blue-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-blue-700',
      activeBorderColor: 'ring-4 ring-blue-300 ring-offset-2'
    },
    { 
      type: 'Individual', 
      count: customerCounts.Individual, 
      icon: UserCircle, 
      bgColor: 'bg-purple-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      countColor: 'text-white',
      borderColor: 'border-purple-700',
      activeBorderColor: 'ring-4 ring-purple-300 ring-offset-2'
    },
  ];

  const handleTypeFilterClick = (type: string) => {
    if (type === 'All') {
      if (customerTypeFilter === undefined) return;
      setCustomerTypeFilter(undefined);
    } else {
      if (customerTypeFilter === type) return;
      setCustomerTypeFilter(type);
    }
  };

  const handleCreate = () => {
    if (!formData.companyName || !formData.contactPerson) {
      alert('Please fill in required fields');
      return;
    }
    
    const customerTypeEnum = formData.customerType === 'Individual' ? 0 : 1;
    
    createMutation.mutate({
      ...formData,
      customerType: customerTypeEnum as any,
    });
  };

  const handleUpdate = () => {
    if (!formData.companyName || !formData.contactPerson) {
      alert('Please fill in required fields');
      return;
    }
    
    const customerTypeEnum = formData.customerType === 'Individual' ? 0 : 1;
    
    updateMutation.mutate({
      ...formData,
      customerType: customerTypeEnum as any,
    });
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      ...customer,
      customerType: customer.customerType === 1 ? 'Business' : 'Individual',
    });
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    let filtered = customers;
    
    if (customerTypeFilter) {
      const typeValue = customerTypeFilter === 'Business' ? 1 : 0;
      filtered = filtered.filter(c => c.customerType === typeValue);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.companyName?.toLowerCase().includes(searchLower) ||
        customer.contactPerson?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [customers, customerTypeFilter, searchTerm]);

  const getCustomerTypeBadge = (type: number) => {
    if (type === 1) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
        <Store className="h-3 w-3" />
        Business
      </Badge>;
    }
    return <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
      <UserCircle className="h-3 w-3" />
      Individual
    </Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
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
              Customers
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manage your customer relationships and track interactions
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Plus className="h-6 w-6 text-blue-600" />
                  Add New Customer
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-red-500 rounded-full"></span>
                    Required Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                        value={formData.contactPerson || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, contactPerson: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Customer Type
                    </label>
                    <select
                      value={formData.customerType as string || 'Business'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="Business">Business</option>
                      <option value="Individual">Individual</option>
                    </select>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Alternate Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={formData.alternatePhone || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, alternatePhone: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
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
                </div>

                {/* Billing Address */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    Billing Address
                  </h3>
                  
                  <textarea
                    placeholder="Billing address"
                    value={formData.billingAddress || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, billingAddress: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows={2}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.billingCity || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, billingCity: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.billingState || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, billingState: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={formData.billingPostalCode || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, billingPostalCode: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={formData.billingCountry || 'India'}
                      onChange={(e) =>
                        setFormData({ ...formData, billingCountry: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Tax Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                    Tax Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        GST Number
                      </label>
                      <input
                        type="text"
                        placeholder="GST Number"
                        value={formData.gstNumber || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, gstNumber: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        placeholder="PAN Number"
                        value={formData.panNumber || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, panNumber: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
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
                      Create Customer
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customer Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {typeCards.map((card) => {
            const Icon = card.icon;
            const isActive = card.type === 'All' 
              ? customerTypeFilter === undefined 
              : customerTypeFilter === card.type;
            
            return (
              <Card
                key={card.type}
                className={`
                  relative overflow-hidden cursor-pointer transition-all duration-200
                  ${card.bgColor} border-2 ${card.borderColor}
                  hover:scale-105 hover:shadow-xl
                  ${isActive ? card.activeBorderColor : 'hover:brightness-110'}
                `}
                onClick={() => handleTypeFilterClick(card.type)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/20 text-white">
                      {card.count}
                    </span>
                  </div>
                  <p className={`text-sm font-medium ${card.textColor} opacity-90`}>
                    {card.type}
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
              placeholder="Search customers by company, contact, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </Card>

        {/* Customers Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers && filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, idx) => (
                    <tr 
                      key={customer.customerId} 
                      className={`transition-all duration-200 hover:bg-blue-50 group ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            {customer.companyName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{customer.companyName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{customer.contactPerson}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {customer.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </p>
                          )}
                          {customer.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getCustomerTypeBadge(customer.customerType)}
                      </td>
                      <td className="px-6 py-4">
                        {customer.industry ? (
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {customer.industry}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDate(customer.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Dialog open={isEditOpen && selectedCustomer?.customerId === customer.customerId} onOpenChange={setIsEditOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(customer)}
                                className="hover:bg-amber-100 hover:text-amber-600"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px]">
                              <DialogHeader>
                                <DialogTitle className="text-2xl flex items-center gap-2">
                                  <Edit className="h-6 w-6 text-amber-600" />
                                  Edit Customer
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-red-500 rounded-full"></span>
                                    Required Information
                                  </h3>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Company Name <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
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
                                        value={formData.contactPerson || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, contactPerson: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                      Customer Type
                                    </label>
                                    <select
                                      value={formData.customerType as string || 'Business'}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          customerType: e.target.value,
                                        })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    >
                                      <option value="Business">Business</option>
                                      <option value="Individual">Individual</option>
                                    </select>
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
                                        Email
                                      </label>
                                      <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Phone
                                      </label>
                                      <input
                                        type="tel"
                                        value={formData.phone || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, phone: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Alternate Phone
                                      </label>
                                      <input
                                        type="tel"
                                        value={formData.alternatePhone || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, alternatePhone: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        Website
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.website || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, website: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                      Industry
                                    </label>
                                    <input
                                      type="text"
                                      value={formData.industry || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, industry: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                  </div>
                                </div>

                                {/* Billing Address */}
                                <div className="space-y-4">
                                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                                    Billing Address
                                  </h3>
                                  
                                  <textarea
                                    placeholder="Billing address"
                                    value={formData.billingAddress || ''}
                                    onChange={(e) =>
                                      setFormData({ ...formData, billingAddress: e.target.value })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    rows={2}
                                  />

                                  <div className="grid grid-cols-2 gap-4">
                                    <input
                                      type="text"
                                      placeholder="City"
                                      value={formData.billingCity || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, billingCity: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                    <input
                                      type="text"
                                      placeholder="State"
                                      value={formData.billingState || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, billingState: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <input
                                      type="text"
                                      placeholder="Postal Code"
                                      value={formData.billingPostalCode || ''}
                                      onChange={(e) =>
                                        setFormData({ ...formData, billingPostalCode: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Country"
                                      value={formData.billingCountry || 'India'}
                                      onChange={(e) =>
                                        setFormData({ ...formData, billingCountry: e.target.value })
                                      }
                                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                    />
                                  </div>
                                </div>

                                {/* Tax Information */}
                                <div className="space-y-4">
                                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-yellow-500 rounded-full"></span>
                                    Tax Information
                                  </h3>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        GST Number
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.gstNumber || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, gstNumber: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                        PAN Number
                                      </label>
                                      <input
                                        type="text"
                                        value={formData.panNumber || ''}
                                        onChange={(e) =>
                                          setFormData({ ...formData, panNumber: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                      />
                                    </div>
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
                                      Update Customer
                                    </>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(customer.customerId)}
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
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">No customers found</p>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateOpen(true)}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create your first customer
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