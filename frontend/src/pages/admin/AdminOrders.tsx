import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrders, updateOrderStatus } from '../../api/orders';

function AdminOrders() {
  const queryClient = useQueryClient();
  const {
    data: orders,
    isLoading
  } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  });

  return (
    <div className="space-y-10">
      <Helmet>
        <title>Orders — Luxia</title>
      </Helmet>
      <section className="rounded-3xl bg-white/10 p-8 text-champagne">
        <h1 className="font-display text-3xl">Manual Payments</h1>
        <p className="mt-2 text-sm text-champagne/70">
          Confirm orders once offline payments are verified. Customers receive updates automatically.
        </p>
      </section>
      <div className="space-y-4">
        {isLoading && <p className="text-champagne/60">Loading orders…</p>}
        {!isLoading && !orders?.length && <p className="text-champagne/60">No orders yet.</p>}
        {orders?.map((order) => (
          <article key={order.id} className="rounded-3xl bg-white/5 p-6 text-champagne shadow-md">
            <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-champagne/60">Order #{order.id}</p>
                <h2 className="font-display text-xl">{order.customer.name}</h2>
                <p className="text-sm text-champagne/70">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3">
                <StatusButton
                  label="Pending"
                  active={order.status === 'pending'}
                  onClick={() => updateMutation.mutate({ id: order.id, status: 'pending' })}
                />
                <StatusButton
                  label="Paid"
                  active={order.status === 'paid'}
                  onClick={() => updateMutation.mutate({ id: order.id, status: 'paid' })}
                />
                <StatusButton
                  label="Fulfilled"
                  active={order.status === 'fulfilled'}
                  onClick={() => updateMutation.mutate({ id: order.id, status: 'fulfilled' })}
                />
              </div>
            </header>
            <section className="mt-4 grid gap-4 text-sm text-champagne/80 md:grid-cols-3">
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-champagne/60">Contact</h3>
                <p>{order.customer.email}</p>
                {order.customer.phone && <p>{order.customer.phone}</p>}
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-champagne/60">Address</h3>
                <p className="whitespace-pre-line">{order.customer.address}</p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.3em] text-champagne/60">Notes</h3>
                <p>{order.customer.notes || '—'}</p>
              </div>
            </section>
            <section className="mt-4">
              <h3 className="text-xs uppercase tracking-[0.3em] text-champagne/60">Items</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {order.items.map((item) => (
                  <li key={item.productId}>
                    {`${item.quantity} × ${item.name ?? `Product ${item.productId}`} — $${
                      item.price !== undefined ? item.price.toFixed(2) : '—'
                    }`}
                  </li>
                ))}
              </ul>
            </section>
            <footer className="mt-4 flex items-center justify-between text-sm">
              <p>Total: ${order.total.toFixed(2)}</p>
              <p className="text-champagne/60">Status: {order.status}</p>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

function StatusButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] ${
        active ? 'bg-blush text-midnight' : 'border border-champagne text-champagne'
      }`}
    >
      {label}
    </button>
  );
}

export default AdminOrders;
