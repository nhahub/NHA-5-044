import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { formatPrice } from '../data/catalog.js';
import { statusLabel } from '../data/orderStatus.js';
import useOrderData from '../hooks/useOrderData.js';

export function AccountForm({ mode }) {
  const isRegister = mode === 'register';
  const isAdmin = mode === 'admin';
  const navigate = useNavigate();
  const title = isRegister ? 'Create an account' : isAdmin ? 'Admin sign in' : 'Sign in';

  function enterPreview(event) {
    event.preventDefault();
    navigate(isAdmin ? '/admin' : '/profile');
  }

  return (
    <section className="container page-space narrow-page">
      <h1>{title}</h1>
      <p className="muted">Account preview. Use sample details to explore the frontend.</p>
      <form className="form-stack" onSubmit={enterPreview}>
        {isRegister && <label>Full name <input name="name" autoComplete="name" required /></label>}
        <label>Email <input name="email" type="email" autoComplete="email" required /></label>
        <label>Password <input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required /></label>
        <button className="button button-primary" type="submit">{isRegister ? 'Continue to preview' : 'Open account preview'}</button>
      </form>
      {!isAdmin && <p className="account-switch">{isRegister ? 'Already have an account? ' : 'New to Watch Heaven? '}
        <Link className="underlined" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
      </p>}
    </section>
  );
}

export function ProfilePage({ user }) {
  if (user === undefined) {
    return <p className="container page-space" role="status">Checking your session…</p>;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <section className="container page-space narrow-page">
      <h1>My account</h1>
      <p className="account-switch break-all">{user.email}</p>
      <Link className="text-link account-switch" to="/orders">View order history</Link>
    </section>
  );
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="container page-space narrow-page">
      <h1>Contact us</h1>
      <form className="form-stack" onSubmit={(event) => {
        event.preventDefault();
        event.currentTarget.reset();
        setSubmitted(true);
      }}>
        <label>Full name <input name="name" autoComplete="name" required /></label>
        <label>Email <input name="email" type="email" autoComplete="email" required /></label>
        <label>Subject <input name="subject" required /></label>
        <label>Message <textarea name="message" rows={5} required /></label>
        <button className="button button-primary" type="submit">Preview message submission</button>
        {submitted && <p role="status">Message validated in this preview.</p>}
      </form>
    </section>
  );
}

function orderDate(order) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(order.createdAt));
}

function OrderLoadState({ error, retry }) {
  if (!error) return <p role="status">Loading orders…</p>;
  if (error.status === 404) return <p>This order is unavailable.</p>;
  return <>
    <p className="form-error" role="alert">{error.message}</p>
    <button className="button button-primary" type="button" onClick={retry}>Try again</button>
  </>;
}

export function OrdersPage({ user }) {
  const { data: orders, error, retry } = useOrderData(user);
  return (
    <section className="container page-space">
      <h1>Order history</h1>
      {!orders ? <OrderLoadState error={error} retry={retry} /> : orders.length === 0 ? (
        <div className="empty-state">
          <p>You have no orders yet.</p>
          <Link className="button button-primary" to="/shop">Browse watches</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link className="underlined" to={'/orders/' + order.id}>{order.orderRef}</Link></td>
                  <td>{orderDate(order)}</td><td>{statusLabel(order.status)}</td><td>{formatPrice(order.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function OrderPage({ user }) {
  const { orderId } = useParams();
  const { data: order, error, retry } = useOrderData(user, '/' + encodeURIComponent(orderId));
  return (
    <section className="container page-space narrow-page">
      <Link className="text-link back-link" to="/orders">Back to orders</Link>
      <h1>{order ? 'Order ' + order.orderRef : 'Order details'}</h1>
      {!order ? <OrderLoadState error={error} retry={retry} /> : (
        <>
          <dl className="summary-totals">
            <div><dt>Date</dt><dd>{orderDate(order)}</dd></div>
            <div><dt>Status</dt><dd>{statusLabel(order.status)}</dd></div>
            <div><dt>Payment</dt><dd>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}</dd></div>
            <div><dt>Payment status</dt><dd>{statusLabel(order.paymentStatus)}</dd></div>
            <div><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
          </dl>
          <ul className="summary-items">
            {order.items.map((item) => <li key={item.productId}><span>{item.productName} &times; {item.quantity}</span><span className="price">{formatPrice(item.lineTotalCents)}</span></li>)}
          </ul>
          <div className="form-stack account-switch">
            <h2>Delivery details</h2>
            <p>{order.delivery.recipientName}<br />{order.delivery.phone}<br />{order.delivery.address}</p>
          </div>
        </>
      )}
    </section>
  );
}
