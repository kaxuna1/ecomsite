import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useRef } from 'react';
import { createProduct, deleteProduct, fetchProducts, updateProduct } from '../../api/products';
import type { Product } from '../../types/product';

interface ProductForm {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  inventory: number;
  categories: string;
  highlights?: string;
  usage?: string;
  image?: FileList;
}

function AdminProducts() {
  const queryClient = useQueryClient();
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const editingRef = useRef<number>(0);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ProductForm>({
    defaultValues: {
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      inventory: 0,
      categories: '',
      highlights: '',
      usage: ''
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      reset();
      setValue('image', undefined as unknown as FileList);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => updateProduct(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      reset();
      editingRef.current = 0;
      setValue('image', undefined as unknown as FileList);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  });

  const onSubmit = (form: ProductForm) => {
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('shortDescription', form.shortDescription);
    formData.append('description', form.description);
    formData.append('price', String(form.price));
    formData.append('inventory', String(form.inventory));
    formData.append(
      'categories',
      JSON.stringify(
        form.categories
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    );
    formData.append(
      'highlights',
      JSON.stringify(
        (form.highlights ?? '')
          .split(';')
          .map((entry) => entry.trim())
          .filter(Boolean)
      )
    );
    formData.append('usage', form.usage ?? '');
    if (form.image?.[0]) {
      formData.append('image', form.image[0]);
    }

    if (editingRef.current) {
      updateMutation.mutate({ id: editingRef.current, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (product: Product) => {
    editingRef.current = product.id;
    reset({
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price,
      inventory: product.inventory,
      categories: product.categories.join(', '),
      highlights: product.highlights?.join('; ') ?? '',
      usage: product.usage ?? ''
    });
    setValue('image', undefined as unknown as FileList);
  };

  const cancelEdit = () => {
    editingRef.current = 0;
    reset({
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      inventory: 0,
      categories: '',
      highlights: '',
      usage: ''
    });
    setValue('image', undefined as unknown as FileList);
  };

  return (
    <div className="space-y-10">
      <Helmet>
        <title>Manage Products — Luxia</title>
      </Helmet>
      <section className="rounded-3xl bg-white/10 p-8 text-champagne">
        <h1 className="font-display text-3xl">Ritual Catalogue</h1>
        <p className="mt-2 text-sm text-champagne/70">Upload, update, or archive products. Images are stored on the server.</p>
      </section>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-3xl bg-white/5 p-8 text-champagne">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-[0.4em] text-champagne/60">
              Name
              <input
                className="mt-2 w-full rounded-full border border-white/20 bg-midnight px-4 py-3"
                {...register('name', { required: 'Required' })}
              />
            </label>
            {errors.name && <p className="mt-1 text-xs text-rose-200">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.4em] text-champagne/60">
              Price (USD)
              <input
                type="number"
                step="0.01"
                min={0}
                className="mt-2 w-full rounded-full border border-white/20 bg-midnight px-4 py-3"
                {...register('price', { required: 'Required', valueAsNumber: true })}
              />
            </label>
            {errors.price && <p className="mt-1 text-xs text-rose-200">{errors.price.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.4em] text-champagne/60">
            Short description
            <input
              className="mt-2 w-full rounded-full border border-white/20 bg-midnight px-4 py-3"
              {...register('shortDescription', { required: 'Required' })}
            />
          </label>
          {errors.shortDescription && <p className="mt-1 text-xs text-rose-200">{errors.shortDescription.message}</p>}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.4em] text-champagne/60">
            Full description
            <textarea
              rows={5}
              className="mt-2 w-full rounded-3xl border border-white/20 bg-midnight px-4 py-3"
              {...register('description', { required: 'Required' })}
            />
          </label>
          {errors.description && <p className="mt-1 text-xs text-rose-200">{errors.description.message}</p>}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-[0.4em] text-champagne/60">
              Inventory
              <input
                type="number"
                min={0}
                className="mt-2 w-full rounded-full border border-white/20 bg-midnight px-4 py-3"
                {...register('inventory', { required: 'Required', valueAsNumber: true })}
              />
            </label>
            {errors.inventory && <p className="mt-1 text-xs text-rose-200">{errors.inventory.message}</p>}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-[0.4em] text-champagne/60">
              Categories (comma separated)
              <input
                className="mt-2 w-full rounded-full border border-white/20 bg-midnight px-4 py-3"
                {...register('categories', { required: 'Required' })}
              />
            </label>
            {errors.categories && <p className="mt-1 text-xs text-rose-200">{errors.categories.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.4em] text-champagne/60">
            Highlights (semicolon separated)
            <input
              className="mt-2 w-full rounded-full border border-white/20 bg-midnight px-4 py-3"
              {...register('highlights')}
            />
          </label>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.4em] text-champagne/60">
            Usage instructions
            <textarea
              rows={3}
              className="mt-2 w-full rounded-3xl border border-white/20 bg-midnight px-4 py-3"
              {...register('usage')}
            />
          </label>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.4em] text-champagne/60">
            Upload image
            <input
              type="file"
              accept="image/*"
              className="mt-2 w-full rounded-full border border-white/20 bg-midnight px-4 py-3"
              {...register('image')}
            />
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" className="btn-primary bg-blush text-midnight hover:bg-champagne">
            {editingRef.current ? 'Update product' : 'Create product'}
          </button>
          {editingRef.current ? (
            <button type="button" className="btn-secondary border-champagne text-champagne" onClick={cancelEdit}>
              Cancel edit
            </button>
          ) : null}
        </div>
        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-xs text-rose-200">Unable to save product. Please review the form.</p>
        )}
      </form>
      <section className="space-y-4">
        <h2 className="font-display text-2xl text-champagne">Current rituals</h2>
        <ul className="space-y-4" aria-label="Product list">
          {products?.map((product) => (
            <li key={product.id} className="rounded-3xl bg-white/5 p-6 text-champagne shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-champagne/60">
                    {product.categories.join(' • ')}
                  </p>
                  <h3 className="font-display text-xl">{product.name}</h3>
                  <p className="text-sm text-champagne/70">${product.price.toFixed(2)} — {product.inventory} in stock</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" className="btn-secondary border-champagne text-champagne" onClick={() => startEdit(product)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary border-rose-300 text-rose-200"
                    onClick={() => deleteMutation.mutate(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default AdminProducts;
