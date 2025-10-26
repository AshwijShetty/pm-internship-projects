import type { Internship } from './recommender';

export type Domain = {
  key: string;
  title: string;
  keywords: string[];
  synonyms?: string[];
};

// Central taxonomy for internship domains
export const DOMAINS: Domain[] = [
  { key: 'app', title: 'App Development', keywords: ['android', 'ios', 'flutter', 'react native', 'kotlin', 'swift', 'app'], synonyms: ['mobile', 'apk'] },
  { key: 'web', title: 'Web Development', keywords: ['react', 'next.js', 'node', 'frontend', 'backend', 'full stack', 'html', 'css', 'javascript', 'typescript'], synonyms: ['web'] },
  { key: 'uiux', title: 'UI/UX & Design', keywords: ['ui/ux', 'ux', 'ui', 'figma', 'design', 'wireframe', 'prototype', 'user research'], synonyms: ['product design'] },
  { key: 'ml', title: 'AI/ML & Data', keywords: ['machine learning', 'deep learning', 'data', 'python', 'pandas', 'numpy', 'tensorflow', 'pytorch', 'statistics'], synonyms: ['ai', 'analytics', 'data science'] },
  { key: 'cloud', title: 'Cloud & DevOps', keywords: ['cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'ci/cd', 'terraform'], synonyms: [] },
  { key: 'semiconductor', title: 'Semiconductor & VLSI', keywords: ['vlsi', 'verilog', 'vhdl', 'fpga', 'asic', 'semiconductor', 'eda', 'rtl'], synonyms: ['chip design'] },
  { key: 'embedded', title: 'Embedded & IoT', keywords: ['embedded', 'microcontroller', 'arm', 'stm32', '8051', 'arduino', 'raspberry', 'iot', 'rtos'], synonyms: ['firmware'] },
  { key: 'cybersec', title: 'Cybersecurity', keywords: ['cybersecurity', 'security', 'pentest', 'owasp', 'kali', 'network security'], synonyms: ['infosec'] },
  { key: 'mechanical', title: 'Mechanical & CAD', keywords: ['autocad', 'solidworks', 'catia', 'ansys', 'mechanical', 'fea', 'hvac', 'thermodynamics'], synonyms: [] },
  { key: 'civil', title: 'Civil & Construction', keywords: ['civil', 'revit', 'etabs', 'staad', 'primavera', 'construction', 'structural'], synonyms: [] },
  { key: 'elec', title: 'Electrical & Power', keywords: ['power systems', 'power electronics', 'scada', 'plc', 'electrical'], synonyms: [] },
  { key: 'chemical', title: 'Chemical & Process', keywords: ['aspen', 'hysys', 'process', 'mass transfer', 'heat exchanger', 'process design'], synonyms: [] },
  { key: 'biotech', title: 'Biotech', keywords: ['bioprocess', 'lab', 'wet lab', 'pipetting', 'cell culture'], synonyms: [] },
  { key: 'finance', title: 'Finance & Commerce', keywords: ['accounting', 'tally', 'finance', 'taxation', 'excel', 'equity', 'markets'], synonyms: [] },
  { key: 'management', title: 'Management & Marketing', keywords: ['management', 'marketing', 'sales', 'market research', 'business analysis', 'strategy'], synonyms: [] },
  { key: 'content', title: 'Content & Media', keywords: ['content', 'copywriting', 'blogging', 'video editing', 'photography', 'social media'], synonyms: [] },
];

function toLowerWords(s: string) {
  return s.split(/[^a-zA-Z0-9+#.]+/).map((w) => w.toLowerCase()).filter(Boolean);
}

export function internshipBlob(i: Internship) {
  return `${i.title} ${i.company} ${i.description} ${i.location}`.toLowerCase();
}

export function keywordMatchScore(i: Internship, domain: Domain): number {
  const blob = internshipBlob(i);
  let score = 0;
  for (const k of domain.keywords) {
    if (blob.includes(k)) score += 2; // strong hit
  }
  for (const s of domain.synonyms || []) {
    if (blob.includes(s)) score += 1; // weak hit
  }
  return score;
}

export function intentForProfile(profile: any): Set<string> {
  const base: string[] = [];
  if (profile?.keySkills?.length) base.push(...profile.keySkills);
  if (profile?.extraSkills?.length) base.push(...profile.extraSkills);
  if (profile?.sectorInterest) base.push(profile.sectorInterest);
  if (profile?.course) base.push(profile.course);
  return new Set(toLowerWords(base.join(' ')));
}

export function domainIntentScore(domain: Domain, intent: Set<string>): number {
  let score = 0;
  for (const k of domain.keywords) if (intent.has(k)) score += 2;
  for (const s of domain.synonyms || []) if (intent.has(s)) score += 1;
  return score;
}

export function groupByDomains(internships: Internship[], profile: any) {
  const intent = intentForProfile(profile);
  const orderedDomains = [...DOMAINS].sort((a, b) => domainIntentScore(b, intent) - domainIntentScore(a, intent));

  return orderedDomains
    .map((d) => ({
      domain: d,
      items: internships
        .map((i) => ({ i, s: keywordMatchScore(i, d) }))
        .filter(({ s }) => s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 6)
        .map(({ i }) => i),
    }))
    .filter((x) => x.items.length > 0);
}
