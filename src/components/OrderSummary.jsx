import { formatPrice } from '../data/catalog.js';

export default function OrderSummary({ items, subtotal, children }) {
  return (
    <aside className="summary-panel" aria-label="Order summary">
      <h2>Order summary</h2>
      <ul className="summary-items">
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.name} <small>&times; {item.qty}</small></span>
            <span className="price">{formatPrice(item.priceCents * item.qty)}</span>
          </li>
        ))}
      </ul>
      <dl className="summary-totals">
        <div className="summary-total"><dt>Total</dt><dd>{formatPrice(subtotal)}</dd></div>
      </dl>
      {children}
    </aside>
  );
}
