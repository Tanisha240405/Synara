'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ShoppersButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    if (searchParams.get('showShoppers') === 'true') {
      setIsOpen(true);
      // Clean up the URL parameter asynchronously to prevent state batching race conditions
      setTimeout(() => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('showShoppers');
        const query = newParams.toString() ? `?${newParams.toString()}` : '';
        router.replace(`${pathname}${query}`, { scroll: false });
      }, 100);
    }
  }, [searchParams, pathname, router]);

  const { data: shoppers, error, isLoading } = useSWR(isOpen ? '/api/customers' : null, fetcher);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-surface-container-lowest border border-outline-variant px-md py-xs rounded flex items-center gap-sm hover:border-primary hover:text-primary transition-colors text-on-surface text-sm font-bold"
      >
        <span className="material-symbols-outlined text-[18px]">group</span>
        View Shoppers
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 w-full max-w-4xl max-h-[85vh] rounded-xl flex flex-col shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="flex justify-between items-center p-md border-b border-outline-variant/30 bg-surface-container-low">
              <div>
                <h2 className="text-headline-md font-headline-md text-on-surface flex items-center gap-sm">
                  <span className="material-symbols-outlined text-primary">group</span>
                  Shoppers Directory
                </h2>
                <p className="text-label-xs text-on-surface-variant mt-1">Recently acquired or engaged shoppers across categories.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0 bg-surface-container-lowest">
              {isLoading ? (
                <div className="p-xl flex flex-col items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-4xl mb-md">progress_activity</span>
                  <p>Loading shoppers...</p>
                </div>
              ) : error ? (
                <div className="p-xl text-error text-center">Failed to load shoppers.</div>
              ) : shoppers?.length === 0 ? (
                <div className="p-xl text-center text-on-surface-variant">No shoppers found. Generate mock data first!</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container/50 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="p-md font-bold text-on-surface-variant tracking-wider uppercase text-xs w-12 text-center">#</th>
                      <th className="p-md font-bold text-on-surface-variant tracking-wider uppercase text-xs">Shopper</th>
                      <th className="p-md font-bold text-on-surface-variant tracking-wider uppercase text-xs">Category (Tier)</th>
                      <th className="p-md font-bold text-on-surface-variant tracking-wider uppercase text-xs">City</th>
                      <th className="p-md font-bold text-on-surface-variant tracking-wider uppercase text-xs text-right">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {shoppers?.map((shopper: any, index: number) => {
                      // Map categories to vibrant colours
                      let tierColor = 'bg-surface-variant text-on-surface-variant';
                      let tierIcon = 'person';
                      if (shopper.tier === 'gold') {
                        tierColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                        tierIcon = 'stars';
                      } else if (shopper.tier === 'silver') {
                        tierColor = 'bg-slate-300/20 text-slate-300 border border-slate-300/30';
                        tierIcon = 'workspace_premium';
                      } else if (shopper.tier === 'bronze') {
                        tierColor = 'bg-orange-700/20 text-orange-400 border border-orange-700/30';
                        tierIcon = 'military_tech';
                      }

                      return (
                        <tr key={shopper.id} className="hover:bg-surface-container-low/50 transition-colors group">
                          <td className="p-md text-on-surface-variant font-mono text-xs text-center">{index + 1}</td>
                          <td className="p-md">
                            <div className="font-bold text-on-surface">{shopper.name}</div>
                            <div className="text-xs text-on-surface-variant mt-0.5">{shopper.email || shopper.phone}</div>
                          </td>
                          <td className="p-md">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tierColor}`}>
                              <span className="material-symbols-outlined text-[14px]">{tierIcon}</span>
                              {shopper.tier || 'Regular'}
                            </span>
                          </td>
                          <td className="p-md text-on-surface-variant">
                            {shopper.city || 'Unknown'}
                          </td>
                          <td className="p-md text-right font-data-tabular font-bold text-on-surface">
                            ₹{Number(shopper.totalSpend).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
