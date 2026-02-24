import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});

  // Enum mappings for backend numeric enums
  const customerTypeMap: Record<number, string> = {
    0: 'Individual',
    1: 'Business',
  };

  const getCustomerTypeDisplay = (value: any) => customerTypeMap[Number(value)] || 'Unknown';

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: customersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCreateOpen(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Customer>) =>
      customersApi.update(selectedCustomer!.customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditOpen(false);
      setIsDetailOpen(false);
      setSelectedCustomer(null);
      setFormData({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedCustomer(null);
      setIsDetailOpen(false);
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    updateMutation.mutate(formData);
  };

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(customer);
    setIsDetailOpen(true);
  };

  const handleEdit = () => {
    setIsDetailOpen(false);
    setIsEditOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading customers...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customers</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>+ New Customer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <input
                type="text"
                placeholder="Company Name"
                value={formData.companyName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Contact Person"
                value={formData.contactPerson || ''}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone || ''}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="Website"
                value={formData.website || ''}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={formData.customerType || 'Individual'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerType: e.target.value as Customer['customerType'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option>Individual</option>
                <option>Business</option>
              </select>
              <input
                type="text"
                placeholder="Billing Address"
                value={formData.billingAddress || ''}
                onChange={(e) =>
                  setFormData({ ...formData, billingAddress: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="GST Number"
                value={formData.gstNumber || ''}
                onChange={(e) =>
                  setFormData({ ...formData, gstNumber: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <Button onClick={handleCreate} className="w-full">
                Create Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {customers?.map((customer) => (
          <Card key={customer.customerId}>
            <CardHeader>
              <CardTitle className="text-lg">{customer.companyName}</CardTitle>
              <p className="text-sm text-muted-foreground">{getCustomerTypeDisplay(customer.customerType)}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">Contact: </span>
                  {customer.contactPerson}
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {customer.email || 'N/A'}
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  {customer.phone || 'N/A'}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Dialog open={isDetailOpen && selectedCustomer?.customerId === customer.customerId} onOpenChange={setIsDetailOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(customer)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Customer Details</DialogTitle>
                    </DialogHeader>
                    {selectedCustomer && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-semibold">Company:</span>
                            <p>{selectedCustomer.companyName}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Type:</span>
                            <p>{getCustomerTypeDisplay(selectedCustomer.customerType)}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Contact:</span>
                            <p>{selectedCustomer.contactPerson}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Email:</span>
                            <p>{selectedCustomer.email || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Phone:</span>
                            <p>{selectedCustomer.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Website:</span>
                            <p>{selectedCustomer.website || 'N/A'}</p>
                          </div>
                        </div>
                        {(selectedCustomer.orders?.length || 0) > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2">Orders ({selectedCustomer.orders?.length})</h3>
                            <div className="text-sm space-y-1">
                              {selectedCustomer.orders?.map((order) => (
                                <p key={order.orderId}>{order.orderNumber}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {(selectedCustomer.subscriptions?.length || 0) > 0 && (
                          <div>
                            <h3 className="font-semibold mb-2">Subscriptions ({selectedCustomer.subscriptions?.length})</h3>
                            <div className="text-sm space-y-1">
                              {selectedCustomer.subscriptions?.map((sub) => (
                                <p key={sub.subscriptionId}>{sub.subscriptionNumber}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEdit}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(selectedCustomer.customerId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                {isEditOpen && selectedCustomer?.customerId === customer.customerId && (
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        <input
                          type="text"
                          placeholder="Company Name"
                          value={formData.companyName || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, companyName: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="Contact Person"
                          value={formData.contactPerson || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, contactPerson: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={formData.email || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={formData.phone || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="Website"
                          value={formData.website || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, website: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="Billing Address"
                          value={formData.billingAddress || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, billingAddress: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="GST Number"
                          value={formData.gstNumber || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, gstNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <Button onClick={handleUpdate} className="w-full">
                          Update Customer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
