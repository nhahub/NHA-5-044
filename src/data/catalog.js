const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatPrice(cents) {
  return currency.format(cents / 100);
}

export function productPath(product) {
  return '/shop/' + product.id;
}

export function cartSubtotal(items) {
  return items.reduce((subtotal, item) => subtotal + item.priceCents * item.qty, 0);
}
