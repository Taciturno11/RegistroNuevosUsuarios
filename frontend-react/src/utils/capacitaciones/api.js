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

  const response = await fetch(fullUrl, { ...opts, headers });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
};
