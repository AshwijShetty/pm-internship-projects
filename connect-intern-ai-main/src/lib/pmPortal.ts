import type { Internship } from "./recommender";

// Fetch internships from PM Internship Scheme-compatible API.
// Configure endpoint via VITE_PM_PORTAL_API returning an array of items.
// Expected minimally: id, company, title, location, skills[]; optional: stipend, duration, type, mode, description, logo

type RemoteInternship = Partial<Internship> & { id: string };

function normalizeRemote(item: RemoteInternship): Internship | null {
  if (!item?.id || !item?.company || !item?.title || !item?.location) return null;
  return {
    id: String(item.id),
    company: item.company!,
    logo: item.logo || "https://via.placeholder.com/60x60?text=JOB",
    title: item.title!,
    type: (item.type as any) === "unpaid" ? "unpaid" : "paid",
    mode: (item.mode as any) === "offline" ? "offline" : "online",
    duration: item.duration || "3 months",
    location: item.location!,
    stipend: item.stipend, // keep INR strings from server
    skills: Array.isArray(item.skills) ? (item.skills as string[]) : [],
    description: item.description || "",
  };
}

export async function fetchPortalInternships(): Promise<Internship[]> {
  const url = (import.meta as any).env?.VITE_PM_PORTAL_API;
  if (!url) return [];

  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    const list: RemoteInternship[] = Array.isArray(data) ? data : data?.results || [];
    const mapped = list
      .map(normalizeRemote)
      .filter((x): x is Internship => Boolean(x));
    return mapped;
  } catch (_) {
    return [];
  }
}


