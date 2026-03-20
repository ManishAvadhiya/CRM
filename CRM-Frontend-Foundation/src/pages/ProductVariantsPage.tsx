import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productVariantsApi } from '@/services';
import { formatCurrency } from '@/lib/utils';
import type { ProductVariant } from '@/types';
import { Package, ChevronRight, X } from 'lucide-react';

function DetailPanel({ variant, onClose }: { variant: ProductVariant; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">{variant.variantName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Product details</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${variant.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {variant.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {variant.description && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{variant.description}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pricing</p>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Single User</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(variant.basePriceSingleUser)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Multi User</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(variant.basePriceMultiUser)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-semibold text-gray-700">Annual Subscription</span>
              <span className="text-base font-bold text-indigo-600">{formatCurrency(variant.annualSubscriptionFee)}</span>
            </div>
          </div>
          {variant.features && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Features</p>
              <p className="text-sm text-gray-700 leading-relaxed">{variant.features}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ProductVariantsPage() {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);

  const { data: variants, isLoading } = useQuery({
    queryKey: ['product-variants', !showInactiveOnly],
    queryFn: () => productVariantsApi.getAll(!showInactiveOnly),
  });

  const filteredVariants = showInactiveOnly ? variants?.filter(v => !v.isActive) : variants;

  return (
    <div className="bg-gray-50 min-h-screen p-6 lg:p-8">
      {selectedVariant && <DetailPanel variant={selectedVariant} onClose={() => setSelectedVariant(null)} />}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Variants</h1>
            <p className="text-sm text-gray-400 mt-0.5">View available products and pricing tiers</p>
          </div>
          <button
            onClick={() => setShowInactiveOnly(!showInactiveOnly)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${showInactiveOnly ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}
          >
            {showInactiveOnly ? 'Show Active' : 'Show Inactive'}
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : !filteredVariants || filteredVariants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center h-48 gap-2">
            <Package className="w-8 h-8 text-gray-200" />
            <p className="text-sm text-gray-400">No product variants found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVariants.map((variant) => (
              <div
                key={variant.variantId}
                onClick={() => setSelectedVariant(variant)}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group ${!variant.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${variant.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                    {variant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{variant.variantName}</h3>
                {variant.description && <p className="text-xs text-gray-400 line-clamp-2 mb-4">{variant.description}</p>}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Single User</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(variant.basePriceSingleUser)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Multi User</p>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(variant.basePriceMultiUser)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Annual Fee</p>
                    <p className="text-sm font-bold text-indigo-600">{formatCurrency(variant.annualSubscriptionFee)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
