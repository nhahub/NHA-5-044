import { cartSubtotal } from '../data/catalog.js';
import useStoredState from './useStoredState.js';

export default function useCart(products) {
  const [savedItems, setSavedItems] = useStoredState('watch-heaven-cart-v1', []);
  const productsById = new Map(products.map((product) => [product.id, product]));

  const items = savedItems.flatMap((item) => {
    const product = productsById.get(item?.id);
    if (!product || product.stock < 1 || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return [];
    }

    return [{ ...product, qty: Math.min(item.quantity, product.stock) }];
  });

  function addItem(product) {
    if (product.stock < 1) return;

    setSavedItems((current) => {
      if (!current.some((item) => item?.id === product.id)) {
        return [...current, { id: product.id, quantity: 1 }];
      }

      return current.map((item) => item?.id === product.id
        ? { id: item.id, quantity: Math.max(1, Math.min((Number(item.quantity) || 0) + 1, product.stock)) }
        : item,
      );
    });
  }

  function changeQuantity(productId, change) {
    const product = productsById.get(productId);
    if (!product || product.stock < 1) return;

    setSavedItems((current) =>
      current.map((item) => {
        if (item?.id !== productId) return item;

        const quantity = Math.min(item.quantity, product.stock);
        return {
          id: productId,
          quantity: Math.max(1, Math.min(quantity + change, product.stock)),
        };
      }),
    );
  }

  function removeItem(productId) {
    setSavedItems((current) => current.filter((item) => item?.id !== productId));
  }

  function clearCart() {
    setSavedItems([]);
  }

  return {
    items,
    subtotal: cartSubtotal(items),
    count: items.reduce((total, item) => total + item.qty, 0),
    addItem,
    changeQuantity,
    removeItem,
    clearCart,
  };
}
