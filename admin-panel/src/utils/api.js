const BASE_URL = 'http://localhost:5000'

const handleResponse = (res) => {
  if (!res.ok) return res.json().catch(() => { 
    if (res.status === 401) window.dispatchEvent(new Event('unauthorized'));
    throw new Error(`HTTP ${res.status}`) 
  }).then(err => { 
    if (res.status === 401) window.dispatchEvent(new Event('unauthorized'));
    throw new Error(err.message || `HTTP ${res.status}`) 
  })
  return res.json()
}

export const api = {
  get: (path, token) =>
    fetch(`${BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(handleResponse),

  post: (path, body, token) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    }).then(handleResponse),

  put: (path, body, token) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    }).then(handleResponse),

  patch: (path, body, token) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    }).then(handleResponse),

  delete: (path, token) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(handleResponse),
}
