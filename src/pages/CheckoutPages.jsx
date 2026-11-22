import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Clock3, ShoppingBag } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ProductImage } from '../components/ProductCard.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import { formatPrice, productPath } from '../data/catalog.js';
import { requestOrders } from '../data/ordersApi.js';

function EmptyCart() {
  return (
    <section className="container empty-state">
      <ShoppingBag size={32} strokeWidth={1.4} aria-hidden="true" />
      <h1>Your cart is empty</h1>
      <Link className="button button-primary" to="/shop">Browse watches <ArrowRight size={17} aria-hidden="true" /></Link>
    </section>
  );
}

export function CartPage({ cart }) {
  if (!cart.items.length) return <EmptyCart />;

  return (
    <section className="container page-space">
      <h1>Shopping cart</h1>
      <div className="checkout-layout">
        <ul className="cart-items">
          {cart.items.map((item) => (
            <li key={item.id} className="cart-item">
              <Link className="cart-thumb" to={productPath(item)} aria-label={item.name}>
                <ProductImage src={item.image} alt="" />
              </Link>
              <div>
                <Link className="cart-item-name" to={productPath(item)}>{item.name}</Link>
                <p className="price">{formatPrice(item.priceCents)}</p>
                <div className="cart-controls">
                  <div className="quantity-control">
                    <button type="button" aria-label={'Decrease ' + item.name + ' quantity'} disabled={item.qty <= 1} onClick={() => cart.changeQuantity(item.id, -1)}>&minus;</button>
                    <span>{item.qty}</span>
                    <button type="button" aria-label={'Increase ' + item.name + ' quantity'} disabled={item.qty >= item.stock} onClick={() => cart.changeQuantity(item.id, 1)}>+</button>
                  </div>
                  <button type="button" className="underlined" onClick={() => cart.removeItem(item.id)}>Remove</button>
                </div>
              </div>
              <p className="price cart-line-total">{formatPrice(item.priceCents * item.qty)}</p>
            </li>
          ))}
        </ul>
        <OrderSummary items={cart.items} subtotal={cart.subtotal}>
          <Link className="button button-primary full-width" to="/checkout">Proceed to checkout <ArrowRight size={17} aria-hidden="true" /></Link>
        </OrderSummary>
      </div>
    </section>
  );
}

export function CheckoutPage({ cart, user, refreshCatalog }) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const requestKey = 'watch-heaven-checkout:' + user.uid;

  if (!cart.items.length) return <EmptyCart />;

  async function placeOrder(event) {
    event.preventDefault();
    if (sending.current || failure?.existingOrderId) return;
    const form = event.currentTarget;
    const details = new FormData(form);
    const name = details.get('name').trim();
    const phone = details.get('phone').trim();
    const address = details.get('address').trim();
    const phoneDigits = phone.replace(/\D/g, '');

    const nextErrors = {};
    if (!name) nextErrors.name = 'Enter your full name.';
    if (!/^\+?[0-9 ()-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    if (!address) nextErrors.address = 'Enter your delivery address.';

    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      form.elements.namedItem(firstError)?.focus();
      return;
    }

    sending.current = true;
    setPending(true);
    setFailure(null);

    try {
      let requestId = sessionStorage.getItem(requestKey);
      if (!requestId) {
        requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('');
        sessionStorage.setItem(requestKey, requestId);
      }
      const order = await requestOrders(user, '', {
        order: {
          requestId,
          expectedTotalCents: cart.subtotal,
          delivery: { recipientName: name, phone, address },
          items: cart.items.map(({ id, qty }) => ({ productId: id, quantity: qty })),
        },
        signal: AbortSignal.timeout(30_000),
      });

      sessionStorage.removeItem(requestKey);
      cart.clearCart();
      refreshCatalog();
      navigate('/payment/success', { replace: true, state: { orderId: order.id, orderRef: order.orderRef } });
    } catch (error) {
      if (error.catalogChanged) refreshCatalog();
      const message = error.status ? error.message : 'Could not confirm the order. Check your connection and try again.';
      setFailure({ message, existingOrderId: error.existingOrderId });
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return (
    <section className="container page-space">
      <Link className="text-link back-link" to="/cart"><ArrowLeft size={16} aria-hidden="true" /> Back to cart</Link>
      <h1>Checkout</h1>
      <form className="checkout-layout" onSubmit={placeOrder} noValidate>
        <div className="form-stack">
          <h2>Delivery details</h2>
          <label>
            Full name
            <input name="name" autoComplete="name" required maxLength={120} aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined} />
          </label>
          {errors.name && <p className="form-error" id="name-error" role="alert">{errors.name}</p>}
          <label>
            Phone number
            <input name="phone" type="tel" autoComplete="tel" required maxLength={40} aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'phone-error' : undefined} />
          </label>
          {errors.phone && <p className="form-error" id="phone-error" role="alert">{errors.phone}</p>}
          <label>
            Delivery address
            <textarea name="address" rows={3} autoComplete="street-address" required maxLength={500} aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? 'address-error' : undefined} />
          </label>
          {errors.address && <p className="form-error" id="address-error" role="alert">{errors.address}</p>}
        </div>
        <OrderSummary items={cart.items} subtotal={cart.subtotal}>
          <p className="payment-method">Cash on Delivery</p>
          {failure && <p className="form-error" role="alert">{failure.message}</p>}
          {failure?.existingOrderId && <Link className="underlined" to={'/orders/' + failure.existingOrderId}
            onClick={() => sessionStorage.removeItem(requestKey)}>View saved order</Link>}
          <button className="button button-primary full-width" type="submit" disabled={pending || Boolean(failure?.existingOrderId)}>
            {pending ? 'Saving order…' : 'Place order'} <ArrowRight size={17} aria-hidden="true" />
          </button>
        </OrderSummary>
      </form>
    </section>
  );
}

const paymentStates = {
  success: { title: 'Order placed', description: 'You’ll pay when your order arrives.', icon: CheckCircle2 },
  failure: { title: 'Payment failed', description: 'You can return to checkout and review your order.', icon: CircleAlert },
  pending: { title: 'Payment pending', description: 'View your order history to check its status.', icon: Clock3 },
};

export function PaymentPage() {
  const { pathname, state } = useLocation();
  const status = pathname.split('/').filter(Boolean).at(-1);
  const result = paymentStates[status];
  const StatusIcon = result.icon;
  const confirmed = status === 'success';
  const orderId = confirmed ? state?.orderId : null;

  return (
    <section className="container empty-state">
      <StatusIcon size={38} strokeWidth={1.5} aria-hidden="true" />
      <h1>{confirmed && !orderId ? 'Order confirmation' : result.title}</h1>
      <p className="muted">{confirmed && !orderId ? 'Open your order history to check for saved orders.' : result.description}</p>
      {orderId && <p className="price">{state.orderRef}</p>}
      <Link className="button button-primary" to={orderId ? '/orders/' + orderId : status === 'failure' ? '/checkout' : '/orders'}>
        {orderId ? 'View order' : status === 'failure' ? 'Return to checkout' : 'Order history'}
      </Link>
    </section>
  );
}
