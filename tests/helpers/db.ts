import { API } from './api';

export async function resetAndSeedDb() {
  const res = await fetch(`${API}/test/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`DB reset failed: ${res.status} ${await res.text()}`);
}
