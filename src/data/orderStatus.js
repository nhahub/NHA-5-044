export const nextOrderStatus = Object.freeze({
  pending: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
});

export function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
