// Function to dynamically get the backend URL
const getBackendURL = () => {
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
};

export const api = async (url, opts = {}) => {
  const token = localStorage.getItem('token');
  const headers = opts.headers ? { ...opts.headers } : {};

  // Agregar Content-Type para requests con body
  if (opts.body && (opts.method === 'POST' || opts.method === 'PUT' || opts.method === 'PATCH')) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let fullUrl;
  if (url.startsWith('http')) {
    fullUrl = url;
  } else if (url.startsWith('/api/')) {
    fullUrl = `http://localhost:3001${url}`;
  } else {
    fullUrl = `${getBackendURL()}${url}`;
  }

  console.log('🌐 API Call:', {
    url,
    fullUrl,
    method: opts.method || 'GET',
    headers,
    body: opts.body,
    bodyType: typeof opts.body,
    bodyLength: opts.body ? opts.body.length : 'No body',
    hasContentType: !!headers['Content-Type'],
    contentType: headers['Content-Type']
  });

  const response = await fetch(fullUrl, { ...opts, headers });
  
  console.log('📡 Response:', {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
};
