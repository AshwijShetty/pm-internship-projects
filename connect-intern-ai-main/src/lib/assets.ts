// Helpers to build free, publicly accessible logo/avatar URLs with fallbacks

export function companyLogoUrl(domain: string): string {
  // Primary: Clearbit Logo (free, no auth)
  return `https://logo.clearbit.com/${domain}`;
}

export function companyLogoFallbacks(domain: string): string[] {
  return [
    `https://unavatar.io/${domain}?fallback=false`, // Unavatar (no watermark)
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, // Google S2 favicons
  ];
}

export function defaultPlaceholder(): string {
  return "/placeholder.svg"; // from public/placeholder.svg
}

export function defaultAvatarUrl(name?: string): string {
  const n = (name || "User").trim();
  const encoded = encodeURIComponent(n);
  // ui-avatars free initials avatar
  return `https://ui-avatars.com/api/?name=${encoded}&background=random&size=64&bold=true`;
}

// Known company → domain mapping for internships card logos
const COMPANY_DOMAIN_MAP: Record<string, string> = {
  "Tata Consultancy Services": "tcs.com",
  "Infosys": "infosys.com",
  "Wipro": "wipro.com",
  "HDFC Bank": "hdfcbank.com",
  "Reliance Industries": "ril.com",
  "ITC Limited": "itcportal.com",
  "Tata Elxsi": "tataelxsi.com",
  "Gov SaaS Startup": "",
  "AgriTech Startup (Gov Partner)": "",
  "Education NGO": "",
};

export function companyDomainFor(name?: string): string | null {
  if (!name) return null;
  const key = name.trim();
  if (COMPANY_DOMAIN_MAP[key] === "") return null;
  return COMPANY_DOMAIN_MAP[key] || null;
}



