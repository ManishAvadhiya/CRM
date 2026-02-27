import { useQuery } from '@tanstack/react-query';
import { productVariantsApi } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import type { ProductVariant } from '@/types';
import { useState } from 'react';

export default function ProductVariantsPage() {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);

  const { data: variants, isLoading } = useQuery({
    queryKey: ['product-variants', !showInactiveOnly],
    queryFn: () => productVariantsApi.getAll(!showInactiveOnly),
  });

  const handleViewDetail = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setIsDetailOpen(true);
  };

  const filteredVariants = showInactiveOnly
    ? variants?.filter(v => !v.isActive)
    : variants;

  if (isLoading) {
    return <div className="p-8">Loading product variants...</div>;
  }

  return (
    <div className="p-8 space-y-6 min-h-full">
      {/* Page Header */}
      <div className="animate-in fade-in duration-500">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Product Variants</h1>
        <p className="text-slate-600 mt-2">View all available product offerings and pricing</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={showInactiveOnly ? 'default' : 'outline'}
          onClick={() => setShowInactiveOnly(!showInactiveOnly)}
          className={`transition-all ${
            showInactiveOnly
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              : 'hover:bg-slate-50'
          }`}
        >
          {showInactiveOnly ? 'Show Active' : 'Show Inactive'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVariants?.map((variant) => (
          <Card key={variant.variantId} className={`rounded-xl border-2 border-slate-200 hover:shadow-lg transition-all duration-300 ${!variant.isActive ? 'opacity-60' : 'hover:border-blue-300'}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{variant.variantName}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{variant.description}</p>
                </div>
                <Badge variant={variant.isActive ? 'default' : 'secondary'} className={`${variant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {variant.isActive ? '✓ Active' : '✗ Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <span className="text-slate-600">Single User:</span>
                    <p className="font-bold text-blue-600 text-lg">
                      {formatCurrency(variant.basePriceSingleUser)}
                    </p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-3">
                    <span className="text-slate-600">Multi User:</span>
                    <p className="font-bold text-cyan-600 text-lg">
                      {formatCurrency(variant.basePriceMultiUser)}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1 font-semibold">Annual Subscription Fee</p>
                  <p className="font-bold text-lg text-slate-900">
                    {formatCurrency(variant.annualSubscriptionFee)}
                  </p>
                </div>
                <Dialog open={isDetailOpen && selectedVariant?.variantId === variant.variantId} onOpenChange={setIsDetailOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewDetail(variant)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Product Details</DialogTitle>
                    </DialogHeader>
                    {selectedVariant && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-semibold">Name:</span>
                            <p>{selectedVariant.variantName}</p>
                          </div>
                          <div>
                            <span className="font-semibold">Status:</span>
                            <p className="flex items-center gap-2">
                              <Badge variant={selectedVariant.isActive ? 'default' : 'secondary'}>
                                {selectedVariant.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </p>
                          </div>
                          <div>
                            <span className="font-semibold">Display Order:</span>
                            <p>{selectedVariant.displayOrder}</p>
                          </div>
                        </div>

                        {selectedVariant.description && (
                          <div>
                            <span className="font-semibold">Description:</span>
                            <p className="text-sm text-muted-foreground">
                              {selectedVariant.description}
                            </p>
                          </div>
                        )}

                        <div className="border-t pt-4">
                          <h3 className="font-semibold mb-3">Pricing</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Single User Price:</span>
                              <span className="font-bold">
                                {formatCurrency(selectedVariant.basePriceSingleUser)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Multi User Price:</span>
                              <span className="font-bold">
                                {formatCurrency(selectedVariant.basePriceMultiUser)}
                              </span>
                            </div>
                            <div className="flex justify-between bg-blue-50 p-2 rounded">
                              <span className="font-semibold">Annual Subscription Fee:</span>
                              <span className="font-bold text-blue-600">
                                {formatCurrency(selectedVariant.annualSubscriptionFee)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {selectedVariant.features && (
                          <div className="border-t pt-4">
                            <h3 className="font-semibold mb-2">Features</h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedVariant.features}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!filteredVariants || filteredVariants.length === 0) && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No product variants found
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
