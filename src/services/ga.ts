import { config } from '../config';

export async function sendGaEvent(eventName: string, params: Record<string, any>) {
  if (!config.gaMeasurementId || !config.gaApiSecret) return;
  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${config.gaMeasurementId}&api_secret=${config.gaApiSecret}`;
  const body = {
    client_id: params.client_id || '555',
    events: [{ name: eventName, params }]
  };
  try {
    await (globalThis as any).fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    // swallow
  }
}