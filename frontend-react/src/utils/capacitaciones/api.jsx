// ✅ Obtener la URL del backend desde la variable de entorno
const getBackendURL = () => {
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  return `${backendURL}/api`;
};

// ✅ Función para hacer peticiones al backend usando fetch
export const api = async (url, opts = {}) => {
  const token = localStorage.getItem('token');
  const headers = opts.headers ? { ...opts.headers } : {};

  // Agregar Content-Type si hay body en métodos relevantes
  if (opts.body && ['POST', 'PUT', 'PATCH'].includes(opts.method)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let fullUrl;

  if (url.startsWith('http')) {
    fullUrl = url;
  } else if (url.startsWith('/api/')) {
    fullUrl = `${getBackendURL().replace('/api', '')}${url}`;
  } else {
    fullUrl = `${getBackendURL()}${url}`;
  }

  console.log('🌐 API Call:', {
    url,
    fullUrl,
    method: opts.method || 'GET',
    headers,
    body: opts.body,
    hasContentType: !!headers['Content-Type'],
  });

  const response = await fetch(fullUrl, { ...opts, headers });

  console.log('📡 Response:', {
    status: response.status,
    ok: response.ok,
    statusText: response.statusText
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status} - ${errorText}`);
  }

  return await response.json();
};
