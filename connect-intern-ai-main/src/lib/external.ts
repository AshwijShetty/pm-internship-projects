import type { Internship } from './recommender';

// Fetch internships from multiple external sources.
// Configure via:
// - VITE_JOB_SOURCES: comma-separated URLs OR a JSON array string of URLs
// Each URL should return an array of objects with at least: id, company, title, location, skills[]
// Optional fields: stipend, duration, type, mode, description, logo

type ExternalInternship = Partial<Internship> & { id: string };

function parseSources(): string[] {
  const raw = (import.meta as any).env?.VITE_JOB_SOURCES;
  if (!raw) return [];
  try {
    if (raw.trim().startsWith('[')) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter((u: any) => typeof u === 'string') : [];
    }
  } catch {}
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalize(item: ExternalInternship): Internship | null {
  if (!item?.id || !item?.company || !item?.title || !item?.location) return null;
  return {
    id: String(item.id),
    company: item.company!,
    logo: item.logo,
    title: item.title!,
    type: (item.type as any) === 'unpaid' ? 'unpaid' : 'paid',
    mode: (item.mode as any) === 'offline' ? 'offline' : 'online',
    duration: item.duration || '3 months',
    location: item.location!,
    stipend: item.stipend,
    skills: Array.isArray(item.skills) ? (item.skills as string[]) : [],
    description: item.description || '',
  };
}

export async function fetchExternalInternships(): Promise<Internship[]> {
  const urls = parseSources();
  if (!urls.length) return [];

  const results: Internship[] = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        const list: ExternalInternship[] = Array.isArray(data) ? data : data?.results || [];
        for (const item of list) {
          const norm = normalize(item);
          if (norm) results.push(norm);
        }
      } catch {}
    })
  );

  // de-duplicate by id
  const byId = new Map<string, Internship>();
  for (const it of results) byId.set(it.id, it);
  return Array.from(byId.values());
}
