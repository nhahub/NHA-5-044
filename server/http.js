export class HttpError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const rejectedTokens = new Set([
  'auth/argument-error', 'auth/id-token-expired', 'auth/invalid-id-token',
  'auth/id-token-revoked', 'auth/user-disabled', 'auth/user-not-found',
]);

export function requireIdentity(auth, { admin = false } = {}) {
  return async (req, res, next) => {
    const token = /^Bearer (\S+)$/i.exec(req.get('Authorization') ?? '')?.[1];
    if (!token) throw new HttpError(401, 'Log in to continue.');
    try {
      req.identity = await auth.verifyIdToken(token, admin);
    } catch (error) {
      if (rejectedTokens.has(error.code)) throw new HttpError(401, 'Your session is invalid or expired. Log in again.');
      throw error;
    }
    if (admin && req.identity.admin !== true) throw new HttpError(403, 'This account does not have staff access.');
    next();
  };
}
