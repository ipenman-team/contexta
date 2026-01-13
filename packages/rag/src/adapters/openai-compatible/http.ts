export async function postJson<T>(url: string, apiKey: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`openai-compatible http ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}
