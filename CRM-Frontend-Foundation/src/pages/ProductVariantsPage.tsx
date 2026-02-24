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
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Product Variants</h1>
          <p className="text-muted-foreground">View all available product variants</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showInactiveOnly ? 'default' : 'outline'}
            onClick={() => setShowInactiveOnly(!showInactiveOnly)}
          >
            {showInactiveOnly ? 'Show Active' : 'Show Inactive'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVariants?.map((variant) => (
          <Card key={variant.variantId} className={!variant.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{variant.variantName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{variant.description}</p>
                </div>
                <Badge variant={variant.isActive ? 'default' : 'secondary'}>
                  {variant.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Single User:</span>
                    <p className="font-semibold text-lg">
                      {formatCurrency(variant.basePriceSingleUser)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Multi User:</span>
                    <p className="font-semibold text-lg">
                      {formatCurrency(variant.basePriceMultiUser)}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Annual Subscription Fee</p>
                  <p className="font-bold text-lg">
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
