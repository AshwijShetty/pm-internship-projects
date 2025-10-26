// Lightweight recommendation service integrating Gemini with a local fallback
// Requires env: VITE_GEMINI_API_KEY (optional). If absent, falls back to rule-based scoring.

export type CandidateProfile = {
  name?: string;
  state?: string;
  city?: string;
  sectorInterest?: string;
  keySkills?: string[];
  extraSkills?: string[];
  aspirations?: string;
  course?: string;
};

export type BaseInternship = {
  id: string;
  company: string;
  logo?: string;
  title: string;
  type: "paid" | "unpaid";
  mode: "online" | "offline";
  duration: string;
  location: string;
  stipend?: string; // e.g., "₹15,000/month"
  skills: string[];
  description: string;
};

export type Internship = BaseInternship & {
  isRecommended?: boolean;
  recommendationScore?: number;
  _scores?: {
    skill: number;
    sector: number;
    location: number;
    experience: number;
  };
};

type RecommendedInternship = BaseInternship & {
  isRecommended: true;
  recommendationScore: number;
};

export type Recommendation = {
  id: string;
  score: number;
};

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Enhanced skill normalization and synonym mapping with categories
const SKILL_SYNONYMS: Record<string, string[]> = {
  // Programming Languages
  'javascript': ['js', 'es6', 'es2015', 'node', 'nodejs', 'react', 'angular', 'vue'],
  'typescript': ['ts', 'typescriptlang'],
  'python': ['python3', 'python2', 'django', 'flask', 'pandas', 'numpy'],
  'java': ['java8', 'java11', 'spring', 'springboot'],
  'c++': ['cpp', 'cplusplus'],
  'c#': ['csharp', 'dotnet', '.net'],
  'go': ['golang'],
  'ruby': ['ruby on rails', 'rails'],
  'php': ['php7', 'php8', 'laravel', 'wordpress'],
  'swift': ['swiftui'],
  'kotlin': ['android'],
  'dart': ['flutter'],
  
  // Web Technologies
  'html': ['html5'],
  'css': ['css3', 'sass', 'scss', 'less'],
  'react': ['react.js', 'reactjs', 'next.js', 'nextjs', 'gatsby'],
  'angular': ['angularjs', 'angular.js'],
  'vue': ['vue.js', 'vuejs', 'nuxt', 'nuxt.js'],
  'node.js': ['node', 'nodejs', 'express', 'nest.js', 'nestjs'],
  
  // Databases
  'sql': ['mysql', 'postgresql', 'postgres', 'sqlite', 'mariadb'],
  'mongodb': ['mongo'],
  'redis': [],
  'postgresql': ['postgres', 'pg'],
  'dynamodb': [],
  
  // Cloud & DevOps
  'aws': ['amazon web services', 's3', 'lambda', 'ec2', 'rds', 'dynamodb'],
  'azure': ['microsoft azure'],
  'gcp': ['google cloud', 'google cloud platform'],
  'docker': ['containers'],
  'kubernetes': ['k8s'],
  'terraform': [],
  'ansible': [],
  
  // AI/ML
  'machine learning': ['ml', 'deep learning', 'dl', 'ai', 'artificial intelligence'],
  'tensorflow': ['tf'],
  'pytorch': [],
  'nlp': ['natural language processing'],
  'computer vision': ['cv', 'opencv'],
  
  // Tools & Others
  'git': ['github', 'gitlab', 'bitbucket'],
  'linux': ['ubuntu', 'debian', 'centos', 'bash', 'shell'],
  'rest': ['restful', 'rest api'],
  'graphql': [],
  'redux': ['redux toolkit', 'rtk'],
  'webpack': ['vite', 'parcel'],
  'jest': ['testing', 'unit testing'],
  'cypress': ['e2e testing'],
  'jira': ['atlassian'],
  'agile': ['scrum', 'kanban'],
};

// Experience level indicators
const EXPERIENCE_LEVELS = {
  entry: ['entry', 'intern', 'internship', 'fresher', 'junior', 'trainee', 'student'],
  mid: ['mid-level', 'mid level', 'experienced', '2+ years', '3+ years'],
  senior: ['senior', 'lead', 'architect', '5+ years', 'manager', 'director']
};

function normalizeString(value?: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special chars
    .trim();
}

function normalizeSkills(skills: string[]): Set<string> {
  const normalized = new Set<string>();
  
  for (const skill of skills) {
    const normSkill = normalizeString(skill);
    normalized.add(normSkill);
    
    // Add synonyms
    for (const [primary, synonyms] of Object.entries(SKILL_SYNONYMS)) {
      if (synonyms.includes(normSkill) || normSkill.includes(primary)) {
        normalized.add(primary);
        synonyms.forEach(s => normalized.add(s));
      }
    }
  }
  
  return normalized;
}

interface SkillMatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

function calculateSkillMatch(profileSkills: string[], jobSkills: string[]): SkillMatchResult {
  if (!profileSkills?.length || !jobSkills?.length) {
    return { score: 0, matchedSkills: [], missingSkills: [...new Set(jobSkills)] };
  }
  
  // Normalize and expand skills with synonyms
  const profileSet = normalizeSkills(profileSkills);
  const jobSet = normalizeSkills(jobSkills);
  
  // Track exact matches and partial matches
  const matchedSkills = new Set<string>();
  const missingSkills = new Set<string>();
  
  // First pass: exact matches
  for (const jobSkill of jobSet) {
    if (profileSet.has(jobSkill)) {
      matchedSkills.add(jobSkill);
    } else {
      missingSkills.add(jobSkill);
    }
  }
  
  // Second pass: check for partial matches and synonyms
  const partialMatches = new Set<string>();
  for (const jobSkill of missingSkills) {
    for (const profileSkill of profileSet) {
      // Check if jobSkill is contained in profileSkill or vice versa
      if (jobSkill.includes(profileSkill) || profileSkill.includes(jobSkill)) {
        partialMatches.add(jobSkill);
        break;
      }
    }
  }
  
  // Add partial matches to matched skills
  partialMatches.forEach(skill => {
    missingSkills.delete(skill);
    matchedSkills.add(skill);
  });
  
  // Calculate score with partial match penalty
  const exactMatchScore = matchedSkills.size / jobSet.size;
  const partialMatchPenalty = 0.5; // Penalty for partial matches
  const partialMatchScore = (matchedSkills.size - partialMatches.size) / jobSet.size;
  const partialMatchContribution = (partialMatches.size / jobSet.size) * partialMatchPenalty;
  
  const score = Math.min(1, exactMatchScore + partialMatchContribution);
  
  return {
    score,
    matchedSkills: Array.from(matchedSkills),
    missingSkills: Array.from(missingSkills)
  };
}

function calculateSectorMatch(profile: CandidateProfile, job: BaseInternship): number {
  if (!profile.sectorInterest && !profile.course && !profile.aspirations) return 0;
  
  const searchText = [
    job.title,
    job.company,
    job.description,
    job.skills.join(' ')
  ].join(' ').toLowerCase();
  
  let score = 0;
  
  // Check sector interest
  if (profile.sectorInterest) {
    const sectorTerms = profile.sectorInterest.toLowerCase().split(/[,\s]+/);
    const sectorMatch = sectorTerms.some(term => 
      searchText.includes(term) && term.length > 3
    );
    if (sectorMatch) score += 0.4;
  }
  
  // Check course relevance
  if (profile.course) {
    const courseTerms = profile.course.toLowerCase().split(/[,\s]+/);
    const courseMatch = courseTerms.some(term => 
      searchText.includes(term) && term.length > 3
    );
    if (courseMatch) score += 0.3;
  }
  
  // Check aspirations
  if (profile.aspirations) {
    const aspirationTerms = profile.aspirations.toLowerCase().split(/[,\s]+/);
    const aspirationMatch = aspirationTerms.some(term => 
      searchText.includes(term) && term.length > 3
    );
    if (aspirationMatch) score += 0.3;
  }
  
  return Math.min(score, 1);
}

function calculateLocationMatch(profile: CandidateProfile, job: BaseInternship): number {
  // Remote jobs are always a good match
  if (job.mode === 'online' || job.location.toLowerCase().includes('remote')) {
    return 0.8; // Slightly less than perfect to prefer local when available
  }
  
  if (!profile.city && !profile.state) return 0.5; // Neutral score if no location info
  
  const jobLocation = normalizeString(job.location);
  
  // Exact city match
  if (profile.city && jobLocation.includes(normalizeString(profile.city))) {
    return 1.0;
  }
  
  // State match
  if (profile.state && jobLocation.includes(normalizeString(profile.state))) {
    return 0.7;
  }
  
  // No location match
  return 0;
}

function calculateExperienceMatch(profile: CandidateProfile, job: BaseInternship): number {
  // If no experience info, assume entry level
  const userLevel = profile.aspirations?.toLowerCase().includes('senior') ? 'senior' : 
                   profile.aspirations?.toLowerCase().includes('experience') ? 'mid' : 'entry';
  
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  
  // Check for experience level indicators in job description
  const jobLevel = Object.entries(EXPERIENCE_LEVELS).find(([_, terms]) => 
    terms.some(term => jobText.includes(term))
  )?.[0] || 'entry';
  
  // Score based on how well the experience levels match
  const levelScores: Record<string, Record<string, number>> = {
    entry: { entry: 1.0, mid: 0.7, senior: 0.3 },
    mid: { entry: 0.5, mid: 1.0, senior: 0.7 },
    senior: { entry: 0.2, mid: 0.5, senior: 1.0 }
  };
  
  return levelScores[userLevel]?.[jobLevel] || 0.5;
}

// ScoredInternship extends BaseInternship directly to avoid type conflicts with Internship
interface ScoredInternship extends BaseInternship {
  isRecommended: boolean;
  recommendationScore: number;
  _scores: {
    skill: SkillMatchResult;
    sector: number;
    location: number;
    experience: number;
    total: number;
  };
  _matchedSkills: string[];
  _missingSkills: string[];
}

export function ruleBasedScore(profile: CandidateProfile, job: BaseInternship): ScoredInternship | null {
  // Combine all profile skills
  const allProfileSkills = [...(profile.keySkills || []), ...(profile.extraSkills || [])];
  
  // Calculate individual component scores
  const skillMatch = calculateSkillMatch(allProfileSkills, job.skills);
  const sectorScore = calculateSectorMatch(profile, job);
  const locationScore = calculateLocationMatch(profile, job);
  const experienceScore = calculateExperienceMatch(profile, job);
  
  // Calculate base score with weights
  const weights = {
    skill: 0.6,   // Highest weight for skills
    sector: 0.25,  // Sector/domain match
    location: 0.1, // Location preference
    experience: 0.05 // Experience level
  };
  
  // Calculate weighted score
  let totalScore = (
    (skillMatch.score * weights.skill) +
    (sectorScore * weights.sector) +
    (locationScore * weights.location) +
    (experienceScore * weights.experience)
  );
  
  // Apply boosters for strong matches
  const boosters = {
    skillMatch: 1.2,           // 20% boost for perfect skill matches
    sectorMatch: 1.15,         // 15% boost for sector match
    locationMatch: 1.1,        // 10% boost for location match
    experienceMatch: 1.05      // 5% boost for experience match
  };
  
  // Apply boosters for strong matches
  if (skillMatch.score > 0.8) totalScore *= boosters.skillMatch;
  if (sectorScore > 0.8) totalScore *= boosters.sectorMatch;
  if (locationScore > 0.8) totalScore *= boosters.locationMatch;
  if (experienceScore > 0.8) totalScore *= boosters.experienceMatch;
  
  // Apply penalties for poor matches
  const penalties = {
    noSkillMatch: 0.1,         // 90% penalty if no skills match
    poorSectorMatch: 0.5,      // 50% penalty if sector doesn't match well
    locationMismatch: 0.7,     // 30% penalty for location mismatch
    experienceMismatch: 0.8    // 20% penalty for experience mismatch
  };
  
  // Apply penalties
  if (skillMatch.score === 0) totalScore *= penalties.noSkillMatch;
  if (sectorScore < 0.3) totalScore *= penalties.poorSectorMatch;
  if (locationScore < 0.3 && job.mode !== 'online') {
    totalScore *= penalties.locationMismatch;
  }
  if (experienceScore < 0.3) {
    totalScore *= penalties.experienceMismatch;
  }
  
  // Check for minimum thresholds
  if (totalScore < 0.4) return null;
  
  // Cap the score at 1.0
  totalScore = Math.min(1, Math.max(0, totalScore));
  
  // Return the scored internship with detailed scoring information
  return {
    ...job,
    _scores: {
      skill: skillMatch,
      sector: sectorScore,
      location: locationScore,
      experience: experienceScore,
      total: totalScore
    },
    _matchedSkills: skillMatch.matchedSkills,
    _missingSkills: skillMatch.missingSkills,
    isRecommended: totalScore >= 0.7,
    recommendationScore: totalScore
  };
}

function buildGeminiPrompt(profile: CandidateProfile, internships: Internship[]) {
  return `You are a career assistant for the PM Internship Scheme in India.
The audience has low digital literacy. Return the top 3-5 internship IDs with numeric scores in JSON only.

Candidate:
${JSON.stringify(profile)}

Internships:
${JSON.stringify(internships)}

Instructions:
- Score each internship from 0 to 1 based on skill match, sector interest, and location preference.
- Prefer beginner-friendly roles for first-time interns.
- Consider Indian context and keep stipend/currency as-is (INR strings).
- Output strictly this JSON shape: { "recommendations": [ { "id": string, "score": number } ] } with 3 to 5 items.`;
}

export async function getGeminiRecommendations(profile: CandidateProfile, internships: Internship[]): Promise<Recommendation[]> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set VITE_GEMINI_API_KEY in your .env file');
  }

  try {
    const prompt = buildGeminiPrompt(profile, internships);
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Try to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    const parsed = JSON.parse(jsonStr);
    const recs = (parsed?.recommendations || []) as Recommendation[];
    return Array.isArray(recs) ? recs.slice(0, 5) : null;
  } catch (_) {
    return null;
  }
}

export function getRuleBasedRecommendations(profile: CandidateProfile, internships: BaseInternship[], limit = 5): ScoredInternship[] {
  // Get all skills from profile (both key skills and interests)
  const profileSkills = [...(profile.keySkills || []), ...(profile.extraSkills || [])];
  const normalizedProfileSkills = normalizeSkills(profileSkills);
  
  // First, filter out completely irrelevant internships with VERY strict criteria
  const filtered = internships.filter(job => {
    // 1. Must have at least one matching skill from the profile
    const jobSkills = new Set(job.skills.map(s => s.toLowerCase().trim()));
    const hasMatchingSkill = Array.from(normalizedProfileSkills).some(skill => 
      job.skills.some(js => js.toLowerCase().includes(skill))
    );
    
    // 2. Strong sector match required (60% threshold)
    const sectorMatch = calculateSectorMatch(profile, job) >= 0.6;
    
    // 3. Location must be compatible (online or very close match for on-site)
    const isOnline = job.mode === 'online';
    const locationScore = calculateLocationMatch(profile, job);
    const locationMatch = isOnline || locationScore >= 0.75;
    
    // 4. Experience level must be compatible (60% threshold)
    const experienceMatch = calculateExperienceMatch(profile, job) >= 0.6;
    
    // 5. Check if job title/description contains any of the profile's key terms
    const profileTerms = [
      ...(profile.sectorInterest ? [profile.sectorInterest.toLowerCase()] : []),
      ...(profile.course ? [profile.course.toLowerCase()] : []),
      ...(profile.aspirations ? [profile.aspirations.toLowerCase()] : [])
    ].filter(Boolean);
    
    const jobText = `${job.title} ${job.description} ${job.company}`.toLowerCase();
    const hasMatchingTerm = profileTerms.length === 0 || 
      profileTerms.some(term => term.length > 3 && jobText.includes(term));
    
    // Only include if ALL conditions are met
    const shouldInclude = hasMatchingSkill && sectorMatch && locationMatch && 
                         experienceMatch && hasMatchingTerm;
    
    if (!shouldInclude) {
      console.debug('Filtered out internship due to insufficient match:', {
        id: job.id,
        title: job.title,
        company: job.company,
        reason: {
          hasMatchingSkill,
          sectorMatch,
          locationMatch,
          experienceMatch,
          hasMatchingTerm
        }
      });
    }
    
    return shouldInclude;
  });
  
  // If we have no relevant matches, return empty array instead of showing irrelevant ones
  if (filtered.length === 0) {
    console.warn('No relevant internships found based on profile');
    return [];
  }
  
  // Only use the filtered list - don't fall back to irrelevant internships
  const toScore = filtered;
  
  // Score and sort
  const scored = toScore
    .map((j) => {
      const scoreResult = ruleBasedScore(profile, j);
      if (!scoreResult) return null;
      
      // Create a new object with all required properties
      const scoredInternship: ScoredInternship = {
        ...j,
        isRecommended: true,
        recommendationScore: scoreResult.recommendationScore,
        _scores: {
          skill: scoreResult._scores.skill,
          sector: scoreResult._scores.sector,
          location: scoreResult._scores.location,
          experience: scoreResult._scores.experience,
          total: scoreResult._scores.total
        },
        _matchedSkills: [...scoreResult._matchedSkills],
        _missingSkills: [...scoreResult._missingSkills]
      };
      
      return scoredInternship;
    })
    .filter((item): item is ScoredInternship => item !== null);
  
  // Sort by score (descending) and apply minimum score threshold
  const MIN_SCORE = 0.7; // Very high minimum score threshold for strict matching
  
  // First, sort by score
  const sortedByScore = [...scored].sort((a, b) => b.recommendationScore - a.recommendationScore);
  
  let finalResults: ScoredInternship[];
  
  // Then, prioritize sector matches by moving them to the top
  if (profile.sectorInterest) {
    const sectorTerms = profile.sectorInterest.toLowerCase().split(/[,\s]+/);
    
    const scoredWithSectorPriority = sortedByScore.map(rec => {
      const jobText = `${rec.title} ${rec.company} ${rec.description}`.toLowerCase();
      const isSectorMatch = sectorTerms.some(term => 
        term.length > 3 && jobText.includes(term)
      );
      
      return { ...rec, isSectorMatch } as ScoredInternship & { isSectorMatch: boolean };
    });
    
    // Sort with sector matches first, then by score within each group
    scoredWithSectorPriority.sort((a, b) => {
      if (a.isSectorMatch && !b.isSectorMatch) return -1;
      if (!a.isSectorMatch && b.isSectorMatch) return 1;
      return (b.recommendationScore || 0) - (a.recommendationScore || 0);
    });
    
    // Remove the temporary flag and filter by minimum score
      finalResults = scoredWithSectorPriority
        .map(({ isSectorMatch, ...rest }) => ({
          ...rest,
          recommendationScore: rest.recommendationScore || 0
        } as ScoredInternship))
        .filter(rec => rec.recommendationScore >= MIN_SCORE);
  } else {
    // If no sector specified, just sort by score
      finalResults = sortedByScore
        .map(rec => ({
          ...rec,
          recommendationScore: rec.recommendationScore || 0
        } as ScoredInternship))
        .filter(rec => rec.recommendationScore >= MIN_SCORE);
  }
  
  // Log detailed scoring for debugging
  if (finalResults.length > 0 && process.env.NODE_ENV === 'development') {
    console.group('Recommendation Scoring');
    console.log('Profile:', {
      skills: [...(profile.keySkills || []), ...(profile.extraSkills || [])],
      sector: profile.sectorInterest,
      course: profile.course,
      location: `${profile.city}, ${profile.state}`
    });
    
    console.log('Top matches:');
    finalResults.slice(0, Math.min(3, finalResults.length)).forEach((r, i) => {
      // No need to find the job again, we already have all the data in r
      console.group(`#${i + 1} (Score: ${r.recommendationScore.toFixed(2)})`);
      console.log('Title:', r.title);
      console.log('Company:', r.company);
      console.log('Scores:', {
        skill: r._scores.skill.score.toFixed(2),
        sector: r._scores.sector.toFixed(2),
        location: r._scores.location.toFixed(2),
        experience: r._scores.experience.toFixed(2)
      });
      console.groupEnd();
    });
    
    if (finalResults.length < scored.length) {
      console.log(`Filtered out ${scored.length - finalResults.length} low-scoring items`);
    }
    console.groupEnd();
  }
  
  return finalResults.slice(0, limit);
}

export async function recommendInternships(
  profile: CandidateProfile,
  internships: BaseInternship[],
  limit = 5,
  maxRetries = 2
): Promise<RecommendedInternship[]> {
  if (!internships?.length) {
    console.warn('No internships available for recommendations');
    return [];
  }

  console.log('Generating recommendations for profile:', {
    ...profile,
    keySkills: profile.keySkills?.length,
    extraSkills: profile.extraSkills?.length,
  });
  
  let results: RecommendedInternship[] = [];
  let lastError: Error | null = null;
  
  // First try Gemini recommendations if API key is available
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Attempting Gemini recommendation (${attempt + 1}/${maxRetries})`);
        const geminiRecs = await getGeminiRecommendations(profile, internships);
        
        if (geminiRecs?.length > 0) {
          const idToJob = new Map(internships.map((j) => [j.id, j] as const));
          results = geminiRecs
            .map((r) => {
              const job = idToJob.get(r.id);
              if (!job) return null;
              return {
                ...job,
                isRecommended: true,
                recommendationScore: r.score
              };
            })
            .filter((j): j is RecommendedInternship => j !== null)
            .slice(0, limit);
          
          console.log(`Successfully got ${results.length} recommendations from Gemini`);
          return results;
        }
      } catch (error) {
        console.warn(`Gemini recommendation attempt ${attempt + 1} failed:`, error);
        lastError = error as Error;
        // Exponential backoff before retry
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    console.warn('Gemini recommendations failed, falling back to rule-based');
  } else {
    console.log('Gemini API key not found, using rule-based recommendations');
  }
  
  // Fall back to rule-based recommendations
  try {
    console.log('Generating rule-based recommendations');
    const ruleBased = getRuleBasedRecommendations(profile, internships, limit);
    const idToJob = new Map(internships.map((j) => [j.id, j] as const));
    
    results = ruleBased
      .map((r) => {
        const job = idToJob.get(r.id);
        if (!job) return null;
        return {
          ...job,
          isRecommended: true,
          recommendationScore: r.recommendationScore
        };
      })
      .filter((j): j is RecommendedInternship => j !== null);
    
    console.log(`Generated ${results.length} rule-based recommendations`);
  } catch (error) {
    console.error('Error in rule-based recommendations:', error);
    // If everything fails, return top internships by default
    results = internships
      .slice(0, limit)
      .map(job => ({
        ...job,
        isRecommended: true,
        recommendationScore: 1.0 // Default high score for fallback
      }));
  }
  
  return results;
}

// Ask Gemini to propose internships directly (synthetic suggestions) based on profile.
// This does not scrape real-time data; it generates structured suggestions for discovery UX.
export async function geminiSuggestInternships(profile: CandidateProfile, limit = 6, maxRetries = 2): Promise<Internship[]> {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set VITE_GEMINI_API_KEY in your .env file');
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const prompt = `You are a smart internship recommender for Indian students.
Given the following candidate profile, propose ${limit} suitable internship opportunities.
Return ONLY valid JSON of this shape: {
  "internships": [
    {
      "id": string, // unique, kebab-case, start with "ai-"
      "company": string,
      "logo": string | null,
      "title": string,
      "type": "paid" | "unpaid",
      "mode": "online" | "offline",
      "duration": string,
      "location": string,
      "stipend": string | null,
      "skills": string[],
      "description": string
    }
  ]
}
Guidelines:
- Prefer realistic Indian companies and city names. If unsure, use well-known companies/startups or "Remote, India".
- Keep stipend strings in INR format like "₹10,000/month" when applicable.
- Ensure IDs are unique and prefixed with ai- (e.g., ai-react-fe-remote-tcs-1).
- Align titles and skills with the candidate's course, sectorInterest, and keySkills.

Candidate Profile:\n${JSON.stringify(profile, null, 2)}\n`;

      const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.4,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 2000
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = text.match(/```(?:json\n)?([\s\S]*?)\n```/s) || text.match(/\{[\s\S]*\}/s);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : text;
      
      try {
        const result = JSON.parse(jsonStr);
        if (result?.internships && Array.isArray(result.internships)) {
          return result.internships
            .map((item: any) => ({
              id: `ai-${Math.random().toString(36).substring(2, 10)}`,
              company: String(item.company || 'Tech Company').trim(),
              logo: item.logo || undefined,
              title: String(item.title || 'Internship').trim(),
              type: item.type === 'unpaid' ? 'unpaid' : 'paid',
              mode: item.mode === 'offline' ? 'offline' : 'online',
              duration: String(item.duration || '3-6 months'),
              location: String(item.location || 'Remote, India'),
              stipend: item.stipend || undefined,
              skills: Array.isArray(item.skills) 
                ? item.skills.map(String).filter((s: string) => s.trim().length > 0)
               : [],
              description: String(item.description || 'Great learning opportunity').trim()
            }))
            .filter((i: Internship) => i && i.id && i.company && i.title && i.location)
            .slice(0, limit);
        }
        throw new Error('Invalid response format from Gemini');
      } catch (e) {
        console.warn('Retrying due to parse error:', e);
        throw e;
      }
    } catch (error) {
      console.warn(`Gemini suggestion attempt ${attempt + 1} failed:`, error);
      lastError = error as Error;
      // Exponential backoff before retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  // If all retries fail, return some fallback suggestions
  console.warn('Using fallback suggestions after Gemini API failures');
  return [];
}


