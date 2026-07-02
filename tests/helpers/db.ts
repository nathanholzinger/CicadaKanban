export async function resetAndSeedDb() {
  const res = await fetch('http://localhost:3002/api/test/reset', { method: 'POST' });
  if (!res.ok) throw new Error(`DB reset failed: ${res.status} ${await res.text()}`);
}
