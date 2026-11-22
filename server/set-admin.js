import { auth } from './firebase.js';

const [action, uid] = process.argv.slice(2);
if (!['grant', 'revoke'].includes(action) || !uid) {
  console.error('Usage: npm run admin:role -- grant|revoke FIREBASE_UID');
  process.exit(1);
}

const user = await auth.getUser(uid);
const claims = { ...user.customClaims };
if (action === 'grant') claims.admin = true;
else delete claims.admin;
await auth.setCustomUserClaims(uid, claims);
if (action === 'revoke') await auth.revokeRefreshTokens(uid);
console.log(action === 'grant' ? 'Staff access granted. Sign in again to use it.' : 'Staff access revoked.');
