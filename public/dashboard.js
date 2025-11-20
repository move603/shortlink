async function loadAnalytics() {
  const code = document.getElementById('code').value.trim();
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const country = document.getElementById('country').value.trim();
  const device = document.getElementById('device').value.trim();
  const token = localStorage.getItem('token') || '';
  const API_BASE = (window.API_BASE || '').replace(/\/$/, '');
  const params = new URLSearchParams({});
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (country) params.set('country', country);
  if (device) params.set('device', device);
  const endpoint = `${API_BASE ? API_BASE : ''}/api/links/${encodeURIComponent(code)}/analytics?${params.toString()}`;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res, data;
  try {
    res = await fetch(endpoint, { headers });
  } catch (e) {
    document.getElementById('stats').textContent = 'Cannot reach server.';
    return;
  }
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text().catch(() => '');
    document.getElementById('stats').textContent = (text && text.length < 300 ? text : '') || `Invalid response (status ${res.status})`;
    return;
  }
  if (!res.ok) { document.getElementById('stats').textContent = data.error || 'Error'; return; }
  document.getElementById('stats').innerHTML = `CTR: ${data.ctr} | Clicks: ${data.totals.clicks}`;
  const ctxClicks = document.getElementById('chartClicks').getContext('2d');
  new Chart(ctxClicks, { type: 'line', data: { labels: Object.keys(data.byDay), datasets: [{ label: 'Clicks', data: Object.values(data.byDay), borderColor: '#22c55e' }] } });
  const ctxCountries = document.getElementById('chartCountries').getContext('2d');
  new Chart(ctxCountries, { type: 'bar', data: { labels: Object.keys(data.byCountry), datasets: [{ label: 'Countries', data: Object.values(data.byCountry), backgroundColor: '#22c55e' }] } });
}

document.getElementById('load').addEventListener('click', loadAnalytics);