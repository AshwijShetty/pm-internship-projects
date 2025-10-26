import type { Internship } from "./recommender";

const KEY = "internshipsData";
const PROFILE_KEY = "profileData";
const APPLIED_KEY = "appliedInternships";

export function getLocalInternships(): Internship[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // Basic validation of required fields
    return parsed.filter((i) => i && i.id && i.company && i.title && i.location);
  } catch {
    return null;
  }
}

export function setLocalInternships(items: Internship[]): void {
  const safe = Array.isArray(items) ? items : [];
  localStorage.setItem(KEY, JSON.stringify(safe));
}

export function hasLocalInternships(): boolean {
  return !!localStorage.getItem(KEY);
}

export function clearLocalInternships(): void {
  localStorage.removeItem(KEY);
}

// ---- Profile Storage ----
export type StoredProfileData = {
  name: string;
  state: string;
  city: string;
  course: string;
  sectorInterest: string;
  keySkills: string[];
  extraSkills: string[];
  aspirations: string;
  // Optional CV snapshot (base64) and metadata
  cvFileBase64?: string; // Consider size implications; store small files only
  cvFileName?: string;
  cvFileType?: string;
  updatedAt?: string;
};

export function getProfileData(): StoredProfileData | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Basic shape check
    if (parsed && typeof parsed === "object") return parsed as StoredProfileData;
    return null;
  } catch {
    return null;
  }
}

export function setProfileData(data: StoredProfileData): void {
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  } as StoredProfileData;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(payload));
}

export function clearProfileData(): void {
  localStorage.removeItem(PROFILE_KEY);
}



// ---- Applied Internships Storage ----
export function getAppliedIds(): string[] {
  try {
    const raw = localStorage.getItem(APPLIED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    return [];
  } catch {
    return [];
  }
}

export function setAppliedIds(ids: string[]): void {
  const unique = Array.from(new Set(ids));
  localStorage.setItem(APPLIED_KEY, JSON.stringify(unique));
}

export function addApplied(id: string): void {
  const current = getAppliedIds();
  if (!current.includes(id)) {
    current.push(id);
    setAppliedIds(current);
  }
}

export function removeApplied(id: string): void {
  const current = getAppliedIds().filter((x) => x !== id);
  setAppliedIds(current);
}

export function isApplied(id: string): boolean {
  return getAppliedIds().includes(id);
}

