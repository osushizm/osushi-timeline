import { getCollection } from 'astro:content';

export async function GET() {
  const entries = await getCollection('diary');
  const dates = entries.map((e) => {
    const d = e.data.date;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  });
  return new Response(JSON.stringify(dates), {
    headers: { 'Content-Type': 'application/json' },
  });
}
