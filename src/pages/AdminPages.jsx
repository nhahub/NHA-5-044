import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { storeRequest } from '../data/api.js';
import { formatPrice } from '../data/catalog.js';
import { nextOrderStatus, statusLabel } from '../data/orderStatus.js';

export function AdminLayout({ user, isAdmin, refreshStorefront }) {
  if (user === undefined) return <p className="container page-space" role="status">Checking your session…</p>;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <section className="container page-space">
      <nav className="admin-nav" aria-label="Admin navigation">
        <NavLink to="/admin" end>Dashboard</NavLink>
        <NavLink to="/admin/products">Products</NavLink>
        <NavLink to="/admin/categories">Categories</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/coupons">Coupons</NavLink>
      </nav>
      <Outlet context={{ user, refreshStorefront }} />
    </section>
  );
}

function useAdminData(path) {
  const { user } = useOutletContext();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState(null);
  const key = user.uid + ':' + path + ':' + version;

  useEffect(() => {
    const controller = new AbortController();
    storeRequest(path, { user, signal: controller.signal }).then(
      (data) => { if (!controller.signal.aborted) setState({ key, data }); },
      (error) => { if (!controller.signal.aborted) setState({ key, error }); },
    );
    return () => controller.abort();
  }, [key, path, user]);

  return { ...(state?.key === key ? state : null), reload: () => setVersion((value) => value + 1) };
}

function LoadState({ error, reload }) {
  if (!error) return <p role="status">Loading…</p>;
  return <div className="form-stack">
    <p role="alert" className="form-error">{error.message}</p>
    <button className="button button-outline" type="button" onClick={reload}>Try again</button>
  </div>;
}

function useAdminAction() {
  const { user } = useOutletContext();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function save(path, method, body, onSuccess) {
    setPending(true);
    setError('');
    try {
      const result = await storeRequest(path, { user, method, body });
      onSuccess?.(result);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return { save, pending, error };
}

export function AdminDashboard() {
  const catalog = useAdminData('/admin/catalog');
  const activity = useAdminData('/admin/orders');

  return (
    <>
      <h1>Dashboard</h1>
      <div className="admin-metrics">
        <Link to="/admin/products"><strong>{catalog.data?.products.length ?? '—'}</strong> Products</Link>
        <Link to="/admin/orders"><strong>{activity.data?.count ?? '—'}</strong> Orders</Link>
      </div>
      {catalog.error && <LoadState {...catalog} />}
      {activity.error && <LoadState {...activity} />}
    </>
  );
}

function Table({ columns, rows, empty }) {
  if (!rows.length) return <p className="account-switch">{empty}</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>
          {rows.map(({ id, cells }) => <tr key={id}>{cells.map((cell, index) => <td key={columns[index]}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

export function AdminProducts() {
  const catalog = useAdminData('/admin/catalog');
  const { refreshStorefront } = useOutletContext();
  const { save, pending, error } = useAdminAction();

  return (
    <>
      <div className="section-heading">
        <h1>Product management</h1>
        <Link className="button button-primary" to="/admin/products/new">Add product</Link>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {catalog.data ? <Table columns={['Product', 'Category', 'Price (USD)', 'Stock', 'Visibility', 'Actions']}
        empty="No products yet."
        rows={catalog.data.products.map((product) => ({
          id: product.id,
          cells: [product.name, product.categoryLabel, formatPrice(product.priceCents), product.stock,
            product.active ? 'Active' : 'Archived',
            <div className="flex flex-wrap gap-3">
              <Link className="underlined" to={'/admin/products/' + product.id + '/edit'}>Edit {product.name}</Link>
              <button className="underlined" type="button" disabled={pending}
                aria-label={(product.active ? 'Archive ' : 'Restore ') + product.name}
                onClick={() => save('/admin/products/' + product.id + '/visibility', 'PATCH', { active: !product.active }, () => {
                  refreshStorefront();
                  catalog.reload();
                })}>{product.active ? 'Archive' : 'Restore'}</button>
            </div>],
        }))}
      /> : <LoadState {...catalog} />}
    </>
  );
}

export function AdminProductForm() {
  const { productId } = useParams();
  const catalog = useAdminData('/admin/catalog');
  const { refreshStorefront } = useOutletContext();
  const navigate = useNavigate();
  const { save, pending, error } = useAdminAction();
  const product = catalog.data?.products.find(({ id }) => String(id) === productId);

  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    save(product ? '/admin/products/' + product.id : '/admin/products', product ? 'PUT' : 'POST', {
      name: data.get('name'),
      category: data.get('category'),
      image: data.get('image'),
      detailImage: data.get('detailImage') || data.get('image'),
      description: data.get('description'),
      priceCents: Math.round(Number(data.get('price')) * 100),
      stock: Number(data.get('stock')),
      expectedStock: product?.stock,
    }, () => {
      refreshStorefront();
      navigate('/admin/products');
    });
  }

  return (
    <div className="narrow-page">
      <Link className="text-link back-link" to="/admin/products">Back to products</Link>
      <h1>{productId ? 'Edit product' : 'Add product'}</h1>
      {!catalog.data ? <LoadState {...catalog} /> : productId && !product ? <p>Product unavailable.</p> :
        !catalog.data.categories.length ? <p><Link className="underlined" to="/admin/categories">Add a category</Link> before creating a product.</p> : (
          <form className="form-stack" key={product?.id ?? 'new'} onSubmit={submit}>
            <label>Product name <input name="name" defaultValue={product?.name} maxLength={120} required /></label>
            <label>Category <select name="category" defaultValue={product?.category} required>
              {catalog.data.categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
            </select></label>
            <label>Price (USD) <input name="price" type="number" min="0" max="1000000" step="0.01" defaultValue={product ? product.priceCents / 100 : undefined} required /></label>
            <label>Stock <input name="stock" type="number" min="0" max="1000000" step="1" defaultValue={product?.stock} required /></label>
            <label>Image URL <input name="image" type="url" defaultValue={product?.image} maxLength={2000} required /></label>
            <label>Detail image URL (optional) <input name="detailImage" type="url"
              defaultValue={product?.detailImage !== product?.image ? product?.detailImage : undefined} maxLength={2000} /></label>
            <label>Description <textarea name="description" rows={4} maxLength={2000} defaultValue={product?.description} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {error && product && <button className="button button-outline" type="button" onClick={catalog.reload}>Reload product</button>}
            <button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save product'}</button>
          </form>
        )}
    </div>
  );
}

export function AdminCategories() {
  const catalog = useAdminData('/admin/catalog');
  const { refreshStorefront } = useOutletContext();
  const { save, pending, error } = useAdminAction();
  const [editing, setEditing] = useState(null);
  const [label, setLabel] = useState('');

  function reload() {
    setEditing(null);
    setLabel('');
    refreshStorefront();
    catalog.reload();
  }

  return <>
    <h1>Category management</h1>
    <form className="form-stack narrow-page" onSubmit={(event) => {
      event.preventDefault();
      save('/admin/categories' + (editing ? '/' + editing : ''), editing ? 'PATCH' : 'POST', { label }, reload);
    }}>
      <label>Category name <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} required /></label>
      <button className="button button-primary" type="submit" disabled={pending}>{editing ? 'Save category name' : 'Add category'}</button>
      {editing && <button className="underlined" type="button" disabled={pending} onClick={() => { setEditing(null); setLabel(''); }}>Cancel editing</button>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
    {catalog.data ? <Table columns={['Category', 'Products', 'Actions']} empty="No categories yet."
      rows={catalog.data.categories.map(({ id, label: categoryName }) => {
        const count = catalog.data.products.filter((product) => product.category === id).length;
        return { id, cells: [categoryName, count, <div className="flex flex-wrap gap-3">
          <button className="underlined" type="button" disabled={pending} onClick={() => { setEditing(id); setLabel(categoryName); }}>Rename {categoryName}</button>
          <button className="underlined" type="button" disabled={pending || count > 0}
            aria-label={'Remove ' + categoryName} onClick={() => {
              if (window.confirm('Remove the category ' + categoryName + '?')) save('/admin/categories/' + id, 'DELETE', undefined, reload);
            }}>Remove</button>
          {count > 0 && <small>Move its products to remove it.</small>}
        </div>] };
      })} /> : <LoadState {...catalog} />}
  </>;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

export function AdminOrders() {
  const [params] = useSearchParams();
  const after = params.get('after');
  const activity = useAdminData('/admin/orders' + (after ? '?after=' + encodeURIComponent(after) : ''));
  if (!activity.data) return <><h1>Order management</h1><LoadState {...activity} /></>;

  return <>
    <h1>Order management</h1>
    <Table columns={['Order', 'Date', 'Status', 'Total']} empty="No orders yet."
      rows={activity.data.orders.map((order) => ({
        id: order.id,
        cells: [<Link className="underlined" to={'/admin/orders/' + order.id}>{order.orderRef}</Link>,
          formatDate(order.createdAt), statusLabel(order.status), formatPrice(order.totalCents)],
      }))} />
    <div className="flex gap-4 account-switch">
      {after && <Link className="underlined" to="/admin/orders">Latest orders</Link>}
      {activity.data.next && <Link className="underlined" to={'/admin/orders?after=' + activity.data.next}>Older orders</Link>}
    </div>
  </>;
}

const statusActions = {
  processing: 'Start processing',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
};

export function AdminOrderDetails() {
  const { orderId } = useParams();
  const path = '/admin/orders/' + encodeURIComponent(orderId);
  const details = useAdminData(path);
  const { save, pending, error } = useAdminAction();
  const order = details.data;
  const next = nextOrderStatus[order?.status];

  return <div className="narrow-page">
    <Link className="text-link back-link" to="/admin/orders">Back to orders</Link>
    <h1>{order ? 'Order ' + order.orderRef : 'Order details'}</h1>
    {order ? <>
      <dl className="summary-totals">
        <div><dt>Status</dt><dd role="status">{statusLabel(order.status)}</dd></div>
        <div><dt>Date</dt><dd>{formatDate(order.createdAt)}</dd></div>
        <div><dt>Payment</dt><dd>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod} ({statusLabel(order.paymentStatus)})</dd></div>
        <div><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
      </dl>
      <ul className="summary-items">
        {order.items.map((item) => <li key={item.productId}><span>{item.productName} &times; {item.quantity}</span><span className="price">{formatPrice(item.lineTotalCents)}</span></li>)}
      </ul>
      <div className="form-stack account-switch">
        <h2>Delivery details</h2>
        <p>{order.delivery.recipientName}<br />{order.delivery.phone}<br />{order.delivery.address}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        {error && <button className="button button-outline" type="button" onClick={details.reload}>Reload order</button>}
        {next && <button className="button button-primary" type="button" disabled={pending}
          onClick={() => save(path + '/status', 'PATCH', { fromStatus: order.status, status: next }, details.reload)}>
          {pending ? 'Saving…' : statusActions[next]}
        </button>}
      </div>
    </> : <LoadState {...details} />}
  </div>;
}

export function AdminCoupons() {
  return <><h1>Coupon management</h1><p className="account-switch">No coupons available.</p></>;
}
