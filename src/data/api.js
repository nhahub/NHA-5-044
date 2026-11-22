export async function storeRequest(path, { user, method = 'GET', body, signal } = {}) {
  const headers = {};
  if (user) headers.Authorization = 'Bearer ' + await user.getIdToken();
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch('/api' + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal,
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const result = isJson ? await response.json() : null;
  if (!response.ok || !result) {
    const error = new Error(result?.message ?? 'The store service is unavailable. Please try again.');
    error.status = response.status;
    error.existingOrderId = result?.existingOrderId;
    error.catalogChanged = result?.catalogChanged;
    throw error;
  }
  return result;
}
