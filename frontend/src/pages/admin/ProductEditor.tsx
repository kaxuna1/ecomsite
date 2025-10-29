import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { fetchProduct, createProduct, updateProduct } from '../../api/products';
import { getAllAttributes } from '../../api/attributes';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { useAutoSave } from '../../hooks/useAutoSave';
import EditorLayout from '../../components/admin/ProductEditor/EditorLayout';
import DetailsTab from '../../components/admin/ProductEditor/tabs/DetailsTab';
import VariantsTab from '../../components/admin/ProductEditor/tabs/VariantsTab';

export interface ProductForm {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number;
  inventory: number;
  categories: string[];
  highlights?: string[];
  usage?: string;
  image?: FileList;
  isNew: boolean;
  isFeatured: boolean;
  // SEO fields
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImageUrl?: string;
  canonicalUrl?: string;
  // Custom attributes
  customAttributes?: Record<string, any>;
}

type TabType = 'details' | 'variants';

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewProduct = !id;

  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const hasShownDraftDialog = useRef(false);

  // Reset draft dialog flag when product ID changes
  useEffect(() => {
    hasShownDraftDialog.current = false;
  }, [id]);

  const form = useForm<ProductForm>({
    defaultValues: {
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      inventory: 0,
      categories: [],
      highlights: [],
      usage: '',
      isNew: false,
      isFeatured: false,
      customAttributes: {}
    }
  });

  const { formState: { isDirty, isSubmitting }, reset, handleSubmit, watch, getValues } = form;

  // Auto-save hook (only for existing products, not new ones)
  const { status: autoSaveStatus, loadDraft, clearDraft } = useAutoSave({
    watch,
    getValues,
    storageKey: isNewProduct ? `product-draft-new` : `product-draft-${id}`,
    enabled: true,
    debounceMs: 2000
  });

  // Fetch product data if editing
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(Number(id)),
    enabled: !isNewProduct,
  });

  // Fetch attributes
  const { data: attributes = [] } = useQuery({
    queryKey: ['admin-attributes'],
    queryFn: getAllAttributes
  });

  // Load product data into form
  useEffect(() => {
    if (product && !isNewProduct) {
      // Check for draft first
      const draft = loadDraft();

      if (draft && autoSaveStatus.hasDraft && !hasShownDraftDialog.current) {
        // Mark that we've shown the dialog to prevent showing it again
        hasShownDraftDialog.current = true;

        // Ask user if they want to restore the draft
        const restoreDraft = window.confirm(
          `A draft was found from ${autoSaveStatus.lastSaved?.toLocaleString()}. Would you like to restore it?`
        );

        if (restoreDraft) {
          reset(draft);
          // Restore image preview if it exists in the draft
          if (product.imageUrl) {
            setImagePreview(product.imageUrl);
          }
          return;
        } else {
          clearDraft();
        }
      }

      // Load product data from server
      reset({
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice || undefined,
        inventory: product.inventory,
        categories: product.categories,
        highlights: product.highlights || [],
        usage: product.usage || '',
        isNew: product.isNew || false,
        isFeatured: product.isFeatured || false,
        slug: product.slug || '',
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        metaKeywords: product.metaKeywords || [],
        ogImageUrl: product.ogImageUrl || '',
        canonicalUrl: product.canonicalUrl || '',
        customAttributes: product.customAttributes || {}
      });

      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    }
  }, [product, isNewProduct, reset, loadDraft, clearDraft, autoSaveStatus.hasDraft, autoSaveStatus.lastSaved]);

  // Unsaved changes protection (browser refresh only)
  useUnsavedChanges({ isDirty });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => createProduct(data),
    onSuccess: () => {
      clearDraft(); // Clear draft on successful creation
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/admin/products');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; formData: FormData }) =>
      updateProduct(data.id, data.formData),
    onSuccess: () => {
      clearDraft(); // Clear draft on successful update
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      reset(form.getValues()); // Reset form to clear dirty state
    }
  });

  const onSubmit = async (formData: ProductForm) => {
    const data = new FormData();

    // Basic fields
    data.append('name', formData.name);
    data.append('shortDescription', formData.shortDescription);
    data.append('description', formData.description);
    data.append('price', String(formData.price));
    if (formData.salePrice) data.append('salePrice', String(formData.salePrice));
    data.append('inventory', String(formData.inventory));
    data.append('categories', JSON.stringify(formData.categories));
    if (formData.highlights && formData.highlights.length > 0) {
      data.append('highlights', JSON.stringify(formData.highlights));
    }
    if (formData.usage) data.append('usage', formData.usage);
    data.append('isNew', String(formData.isNew));
    data.append('isFeatured', String(formData.isFeatured));

    // SEO fields
    if (formData.slug) data.append('slug', formData.slug);
    if (formData.metaTitle) data.append('metaTitle', formData.metaTitle);
    if (formData.metaDescription) data.append('metaDescription', formData.metaDescription);
    if (formData.metaKeywords && formData.metaKeywords.length > 0) {
      data.append('metaKeywords', JSON.stringify(formData.metaKeywords));
    }
    if (formData.ogImageUrl) data.append('ogImageUrl', formData.ogImageUrl);
    if (formData.canonicalUrl) data.append('canonicalUrl', formData.canonicalUrl);

    // Custom attributes
    if (formData.customAttributes) {
      data.append('customAttributes', JSON.stringify(formData.customAttributes));
    }

    // Image file
    if (formData.image && formData.image.length > 0) {
      data.append('image', formData.image[0]);
    }

    if (isNewProduct) {
      await createMutation.mutateAsync(data);
    } else {
      await updateMutation.mutateAsync({ id: Number(id), formData: data });
    }
  };

  const handleSave = () => {
    handleSubmit(onSubmit)();
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
    navigate('/admin/products');
  };

  if (isLoading && !isNewProduct) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blush border-t-transparent" />
      </div>
    );
  }

  return (
    <EditorLayout
      title={isNewProduct ? 'Create New Product' : `Edit: ${product?.name || 'Product'}`}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={isSubmitting}
      isDirty={isDirty}
      autoSaveStatus={autoSaveStatus}
    >
      {activeTab === 'details' && (
        <DetailsTab
          form={form}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          attributes={attributes}
        />
      )}
      {activeTab === 'variants' && !isNewProduct && (
        <VariantsTab productId={Number(id)} />
      )}
    </EditorLayout>
  );
}
