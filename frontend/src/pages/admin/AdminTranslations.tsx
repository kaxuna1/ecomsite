import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  shortDescription: string;
  description: string;
  highlights?: string[];
  usage?: string;
}

interface Translation {
  id: number;
  product_id: number;
  language_code: string;
  name: string;
  short_description: string;
  description: string;
  highlights?: string[];
  usage?: string;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
}

export default function AdminTranslations() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('ka');
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    highlights: [] as string[],
    usage: '',
    metaTitle: '',
    metaDescription: ''
  });

  // Fetch all products in English
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'en'],
    queryFn: async () => {
      const res = await api.get('/products?lang=en');
      return res.data as Product[];
    }
  });

  // Fetch translation for selected product
  const { data: translation, isLoading: translationLoading } = useQuery<Translation>({
    queryKey: ['translation', selectedProduct?.id, selectedLanguage],
    queryFn: async () => {
      const res = await api.get(`/products/${selectedProduct!.id}/translations/${selectedLanguage}`);
      return res.data;
    },
    enabled: !!selectedProduct,
    retry: false
  });

  // Update form when translation loads
  useEffect(() => {
    if (translation) {
      setFormData({
        name: translation.name || '',
        shortDescription: translation.short_description || '',
        description: translation.description || '',
        highlights: translation.highlights || [],
        usage: translation.usage || '',
        metaTitle: translation.meta_title || '',
        metaDescription: translation.meta_description || ''
      });
    } else if (selectedProduct) {
      // No translation exists, start with empty form
      setFormData({
        name: '',
        shortDescription: '',
        description: '',
        highlights: [],
        usage: '',
        metaTitle: '',
        metaDescription: ''
      });
    }
  }, [translation, selectedProduct]);

  // Save translation mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(
        `/products/${selectedProduct!.id}/translations/${selectedLanguage}`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translation'] });
      toast.success('Translation saved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save translation');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      name: formData.name,
      shortDescription: formData.shortDescription,
      description: formData.description,
      highlights: formData.highlights,
      usage: formData.usage,
      metaTitle: formData.metaTitle,
      metaDescription: formData.metaDescription
    });
  };

  const addHighlight = () => {
    setFormData({ ...formData, highlights: [...formData.highlights, ''] });
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData({ ...formData, highlights: newHighlights });
  };

  const removeHighlight = (index: number) => {
    const newHighlights = formData.highlights.filter((_, i) => i !== index);
    setFormData({ ...formData, highlights: newHighlights });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-champagne">Product Translations</h1>
        <p className="mt-1 text-sm text-champagne/70">
          Manage product translations for different languages
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Product List Sidebar */}
        <aside className="col-span-3">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h2 className="font-display text-lg text-champagne mb-4">Products</h2>
            {productsLoading ? (
              <p className="text-champagne/60">Loading...</p>
            ) : (
              <div className="space-y-2">
                {products?.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm ${
                      selectedProduct?.id === product.id
                        ? 'bg-blush text-midnight font-semibold'
                        : 'text-champagne hover:bg-white/10'
                    }`}
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Translation Editor */}
        <main className="col-span-9">
          {selectedProduct ? (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
              {/* Language Selector */}
              <div className="mb-6 flex items-center gap-4">
                <label className="font-semibold text-sm text-champagne">
                  Target Language:
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-champagne focus:outline-none focus:ring-2 focus:ring-blush"
                >
                  <option value="ka" className="bg-midnight">Georgian (ქართული)</option>
                  <option value="en" className="bg-midnight">English</option>
                </select>
              </div>

              {/* Translation Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Original (English) Column */}
                  <div>
                    <h3 className="font-display text-lg mb-4 text-champagne">
                      Original (English)
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Name
                        </label>
                        <p className="p-3 bg-white/5 rounded-xl border border-white/10 text-champagne">
                          {selectedProduct.name}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Short Description
                        </label>
                        <p className="p-3 bg-white/5 rounded-xl border border-white/10 text-champagne text-sm">
                          {selectedProduct.shortDescription}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Description
                        </label>
                        <p className="p-3 bg-white/5 rounded-xl border border-white/10 text-champagne text-sm">
                          {selectedProduct.description}
                        </p>
                      </div>
                      {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                            Highlights
                          </label>
                          <ul className="list-disc list-inside p-3 bg-white/5 rounded-xl border border-white/10 text-champagne text-sm space-y-1">
                            {selectedProduct.highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Translation Column */}
                  <div>
                    <h3 className="font-display text-lg mb-4 text-champagne">
                      Translation ({selectedLanguage.toUpperCase()})
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne focus:outline-none focus:ring-2 focus:ring-blush"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Short Description *
                        </label>
                        <textarea
                          value={formData.shortDescription}
                          onChange={(e) =>
                            setFormData({ ...formData, shortDescription: e.target.value })
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne text-sm focus:outline-none focus:ring-2 focus:ring-blush"
                          rows={3}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Description *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne text-sm focus:outline-none focus:ring-2 focus:ring-blush"
                          rows={5}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Highlights
                        </label>
                        {formData.highlights.map((highlight, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={highlight}
                              onChange={(e) => updateHighlight(index, e.target.value)}
                              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-champagne focus:outline-none focus:ring-2 focus:ring-blush"
                            />
                            <button
                              type="button"
                              onClick={() => removeHighlight(index)}
                              className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 border border-rose-500/20"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addHighlight}
                          className="text-blush hover:text-champagne text-sm font-semibold"
                        >
                          + Add Highlight
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                          Usage
                        </label>
                        <textarea
                          value={formData.usage}
                          onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne text-sm focus:outline-none focus:ring-2 focus:ring-blush"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEO Fields */}
                <div className="border-t border-white/10 pt-6">
                  <h4 className="font-display text-lg text-champagne mb-4">SEO Metadata</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          setFormData({ ...formData, metaTitle: e.target.value })
                        }
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne focus:outline-none focus:ring-2 focus:ring-blush"
                        placeholder="SEO title for this product"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-champagne/70 mb-2 uppercase tracking-wider">
                        Meta Description
                      </label>
                      <input
                        type="text"
                        value={formData.metaDescription}
                        onChange={(e) =>
                          setFormData({ ...formData, metaDescription: e.target.value })
                        }
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-champagne focus:outline-none focus:ring-2 focus:ring-blush"
                        placeholder="SEO description for this product"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-6 py-2.5 rounded-full border border-white/20 text-champagne hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="px-6 py-2.5 rounded-full bg-blush text-midnight font-semibold hover:bg-champagne transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save Translation'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-12 text-center">
              <p className="text-champagne/70 text-lg">
                Select a product from the left to manage translations
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
