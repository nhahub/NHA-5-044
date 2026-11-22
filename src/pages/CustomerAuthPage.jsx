import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase.js';

const badCredentials = 'The email or password is incorrect.';
const errorMessages = {
  'auth/email-already-in-use': 'This email already has an account. Try logging in.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Choose a stronger password.',
  'auth/password-does-not-meet-requirements': 'Choose a password that meets the password requirements.',
  'auth/invalid-credential': badCredentials,
  'auth/wrong-password': badCredentials,
  'auth/user-not-found': badCredentials,
  'auth/user-disabled': 'This account is unavailable. Contact support for help.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'Check your internet connection and try again.',
  'auth/operation-not-allowed': 'Email and password sign-in is currently unavailable.',
};

export default function CustomerAuthPage({ mode, user, isAdmin }) {
  const { state } = useLocation();
  const isRegister = mode === 'register';
  const staffLogin = mode === 'admin';
  const title = isRegister ? 'Create an account' : staffLogin ? 'Staff sign in' : 'Log in';
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!auth || pending) return;

    const fields = new FormData(event.currentTarget);
    const email = fields.get('email').trim();
    const password = fields.get('password');

    setError('');
    setPending(true);

    try {
      const authenticate = isRegister
        ? createUserWithEmailAndPassword
        : signInWithEmailAndPassword;
      await authenticate(auth, email, password);
    } catch (failure) {
      setError(errorMessages[failure.code] ?? 'Could not continue. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (user === undefined) {
    return <p className="container page-space" role="status">Checking your session…</p>;
  }

  const returnTo = typeof state?.returnTo === 'string' && /^\/(?:checkout|orders(?:\/[a-f0-9]{64})?)$/.test(state.returnTo)
    ? state.returnTo
    : '/shop';
  if (user && staffLogin) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    return (
      <section className="container page-space narrow-page">
        <h1>Staff access required</h1>
        <p>This account cannot manage Watch Heaven.</p>
        <button className="button button-primary account-switch" type="button" onClick={() => signOut(auth)}>
          Sign out and switch account
        </button>
      </section>
    );
  }
  if (user) return <Navigate to={returnTo} replace />;

  return (
    <section className="container page-space narrow-page">
      <h1>{title}</h1>

      {auth ? (
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
            />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="button button-primary" type="submit" disabled={pending}>
            {pending ? 'Please wait…' : title}
          </button>
        </form>
      ) : (
        <p className="form-error account-switch" role="alert">
          Customer accounts are currently unavailable.
        </p>
      )}

      {!staffLogin && <p className="account-switch">
        {isRegister ? 'Already have an account? ' : 'New to Watch Heaven? '}
        <Link className="underlined" to={isRegister ? '/login' : '/register'} state={{ returnTo }}>
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>}
    </section>
  );
}
