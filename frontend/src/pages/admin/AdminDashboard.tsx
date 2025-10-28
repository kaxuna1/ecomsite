import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../../api/products';
import { fetchOrders } from '../../api/orders';

function AdminDashboard() {
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });

  const pendingOrders = orders?.filter((order) => order.status === 'pending').length ?? 0;

  return (
    <div className="space-y-10">
      <Helmet>
        <title>Admin Overview — Luxia</title>
      </Helmet>
      <section className="rounded-3xl bg-white/10 p-8 text-champagne">
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-champagne/70">
          Monitor product availability and manually confirm offline payments as they arrive.
        </p>
      </section>
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard label="Active products" value={products?.length ?? 0} />
        <MetricCard label="Pending payments" value={pendingOrders} />
        <MetricCard label="Total orders" value={orders?.length ?? 0} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl bg-white/10 p-6 text-center text-champagne shadow-xl">
      <p className="text-xs uppercase tracking-[0.4em] text-champagne/60">{label}</p>
      <p className="mt-4 text-3xl font-display">{value}</p>
    </article>
  );
}

export default AdminDashboard;
