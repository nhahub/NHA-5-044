import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { ArrowUpRight, ShoppingBag, UserRound, Watch } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { auth } from '../firebase.js';

export default function StoreLayout({ cartCount, user }) {
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError('');

    try {
      await signOut(auth);
    } catch {
      setLogoutError('Could not log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="wordmark" to="/">
            <Watch size={23} strokeWidth={1.6} aria-hidden="true" />
            Watch Heaven
          </Link>

          <nav className="site-nav" aria-label="Main navigation">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/shop">Shop</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>

          <div className="header-actions">
            <Link className="icon-link" to={user ? '/profile' : '/login'} aria-label="My account">
              <UserRound size={19} aria-hidden="true" />
            </Link>
            <Link className="icon-link cart-link" to="/cart" aria-label={'Cart, ' + cartCount + ' items'}>
              <ShoppingBag size={19} aria-hidden="true" />
              <span>{cartCount}</span>
            </Link>
          </div>
        </div>
        {user && (
          <div className="container flex flex-wrap items-center gap-x-3 gap-y-1 pb-3 text-sm">
            <span className="min-w-0 break-all">Signed in as {user.email}</span>
            <button className="underlined" type="button" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
            {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
          </div>
        )}
      </header>

      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <Link className="wordmark" to="/">Watch Heaven</Link>
          <nav aria-label="Footer navigation">
            <Link to="/shop">Shop watches</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/admin/login">Admin <ArrowUpRight size={13} aria-hidden="true" /></Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
