import { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import StoreLayout from './components/StoreLayout.jsx';
import { auth } from './firebase.js';
import useCatalog from './hooks/useCatalog.js';
import useCart from './hooks/useCart.js';
import { ContactPage, OrderPage, OrdersPage, ProfilePage } from './pages/AccountPages.jsx';
import CustomerAuthPage from './pages/CustomerAuthPage.jsx';
import { AdminCategories, AdminCoupons, AdminDashboard, AdminLayout, AdminOrderDetails, AdminOrders, AdminProductForm, AdminProducts } from './pages/AdminPages.jsx';
import { CartPage, CheckoutPage, PaymentPage } from './pages/CheckoutPages.jsx';
import { CatalogStatus, HomePage, ProductPage, ShopPage } from './pages/ShopPages.jsx';

function RequireCustomer({ user, children }) {
  const { pathname } = useLocation();
  if (user === undefined) return <p className="container page-space" role="status">Checking your session…</p>;
  if (!user) return <Navigate to="/login" state={{ returnTo: pathname }} replace />;
  return children;
}

export default function App() {
  const { pathname } = useLocation();
  const [{ user, isAdmin }, setSession] = useState({ user: auth ? undefined : null, isAdmin: false });
  const { products, categories, error, retry } = useCatalog();
  const cart = useCart(products ?? []);
  const catalogStatus = products === null ? <CatalogStatus error={error} retry={retry} /> : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!auth) return;
    let revision = 0;
    const stop = onIdTokenChanged(auth, async (current) => {
      const attempt = ++revision;
      if (!current) {
        setSession({ user: null, isAdmin: false });
        return;
      }
      let staff = false;
      try {
        staff = (await current.getIdTokenResult()).claims.admin === true;
      } catch {
        // A token lookup failure leaves the dashboard locked.
      }
      if (attempt === revision) setSession({ user: current, isAdmin: staff });
    });
    return () => { revision++; stop(); };
  }, []);

  return (
    <Routes>
      <Route element={<StoreLayout cartCount={cart.count} user={user} />}>
        <Route index element={<HomePage products={products} categories={categories} catalogStatus={catalogStatus} />} />
        <Route path="shop" element={catalogStatus ?? <ShopPage products={products} categories={categories} />} />
        <Route path="shop/:id" element={catalogStatus ?? <ProductPage cart={cart} products={products} />} />
        <Route path="watches/:id" element={catalogStatus ?? <ProductPage cart={cart} products={products} />} />
        <Route path="cart" element={catalogStatus ?? <CartPage cart={cart} />} />
        <Route path="cart/empty" element={<Navigate to="/cart" replace />} />
        <Route path="checkout" element={<RequireCustomer user={user}>
          {catalogStatus ?? <CheckoutPage key={user?.uid} cart={cart} user={user} refreshCatalog={retry} />}
        </RequireCustomer>} />
        <Route path="payment/success" element={<PaymentPage />} />
        <Route path="payment/failure" element={<PaymentPage />} />
        <Route path="payment/pending" element={<PaymentPage />} />
        <Route path="login" element={<CustomerAuthPage key="login" mode="login" user={user} />} />
        <Route path="register" element={<CustomerAuthPage key="register" mode="register" user={user} />} />
        <Route path="profile" element={<ProfilePage user={user} />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="orders" element={<RequireCustomer user={user}><OrdersPage user={user} /></RequireCustomer>} />
        <Route path="orders/:orderId" element={<RequireCustomer user={user}><OrderPage user={user} /></RequireCustomer>} />
        <Route path="admin/login" element={<CustomerAuthPage key="admin" mode="admin" user={user} isAdmin={isAdmin} />} />
        <Route path="admin" element={<AdminLayout user={user} isAdmin={isAdmin} refreshStorefront={retry} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm key="new" />} />
          <Route path="products/:productId/edit" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderId" element={<AdminOrderDetails />} />
          <Route path="coupons" element={<AdminCoupons />} />
        </Route>
        <Route path="*" element={
          <section className="container empty-state">
            <h1>Page unavailable</h1>
            <Link className="button button-primary" to="/shop">Browse watches</Link>
          </section>
        } />
      </Route>
    </Routes>
  );
}
