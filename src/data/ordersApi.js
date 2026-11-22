import { storeRequest } from './api.js';

export function requestOrders(user, path = '', { order, signal } = {}) {
  return storeRequest('/orders' + path, { user, method: order ? 'POST' : 'GET', body: order, signal });
}
