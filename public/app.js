async function createShortLink(evt) {
  evt.preventDefault();
  const url = document.getElementById('url').value.trim();
  const alias = document.getElementById('alias').value.trim();
  const expiresIn = document.getElementById('expiresIn').value;
  const expiresAt = document.getElementById('expiresAt').value;
  const expireAction = document.getElementById('expireAction').value;
  const expireMessage = document.getElementById('expireMessage').value.trim();
  const password = document.getElementById('password').value;
  const token = localStorage.getItem('token') || '';
  const body = { url, alias, expiresInMinutes: expiresIn || undefined, expiresAt: expiresAt || undefined, expireAction, expireMessage, password };
  const API_BASE = (window.API_BASE || '').replace(/\/$/, '');
  const endpoint = (API_BASE ? API_BASE : '') + '/api/links/create';
  let res, data;
  const el = document.getElementById('result');
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch (e) {
    el.textContent = 'Cannot reach server. Please start it and reload the page.';
    return;
  }
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text().catch(() => '');
    el.textContent = (text && text.length < 300 ? text : '') || `Invalid response from server (status ${res.status})`;
    return;
  }
  if (res.ok) {
    const shortBase = API_BASE || location.origin;
    const shortUrl = `${shortBase}/${data.code}`;
    const qrUrl = `${API_BASE ? API_BASE : ''}/api/links/${data.code}/qr`;
    el.innerHTML = `<strong>Short URL:</strong> <a href="${shortUrl}" target="_blank">${shortUrl}</a><br/><img src="${qrUrl}" alt="QR" style="margin-top:10px; border-radius:8px;"/>`;
  } else {
    el.textContent = data.error || 'Failed to create link';
  }
}

document.getElementById('create-form').addEventListener('submit', createShortLink);