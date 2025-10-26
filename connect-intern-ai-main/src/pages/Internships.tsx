import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import { Search, MapPin, Clock, DollarSign, Star } from 'lucide-react';
import { normalizeStipendToINR } from '@/lib/currency';
import { companyDomainFor } from '@/lib/assets';
import { recommendInternships } from '@/lib/recommender';
import { LOCAL_INTERNSHIPS } from '@/lib/internships';
import { getLocalInternships, setLocalInternships, hasLocalInternships, addApplied, isApplied } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { groupByDomains } from '@/lib/domains';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Internship {
  id: string;
  company: string;
  logo?: string;
  title: string;
  type: 'paid' | 'unpaid';
  mode: 'online' | 'offline';
  duration: string;
  location: string;
  stipend?: string;
  skills: string[];
  description: string;
  recommended?: boolean;
  isRecommended?: boolean; // Added for UI purposes
}

interface InternshipFilter {
  internshipType: string;
  locationType: string;
  course: string;
}

interface InternshipCardProps {
  internship: Internship & { isRecommended?: boolean };
  className?: string;
  onApply?: (id: string, company: string) => void;
}

const InternshipCard: React.FC<InternshipCardProps> = ({ 
  internship, 
  className = '',
  onApply = () => {}
}) => {
  const applied = isApplied(internship.id);
  
  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!applied) {
      onApply(internship.id, internship.company);
      const evt = new CustomEvent('apply-internship', { 
        detail: { 
          id: internship.id, 
          company: internship.company 
        } 
      });
      window.dispatchEvent(evt);
    }
  };

  return (
    <div className={`relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {internship.isRecommended && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          Best AI Match
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start space-x-4 mb-4">
          {(() => {
            const domain = companyDomainFor(internship.company);
            const fallbacks = domain
              ? [
                  `https://logo.clearbit.com/${domain}`,
                  `https://unavatar.io/${domain}?fallback=false`,
                  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                ]
              : [];
            const initial = internship.logo || (fallbacks[0] || '/placeholder.svg');
            return (
              <img
                src={initial}
                alt={internship.company}
                className="w-12 h-12 rounded-lg object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement & { _fb?: number };
                  const next = img._fb || 0;
                  if (next < fallbacks.length) {
                    img._fb = next + 1;
                    img.src = fallbacks[next];
                  } else {
                    img.src = '/placeholder.svg';
                  }
                }}
              />
            );
          })()}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg mb-1 truncate">
              {internship.title}
            </h3>
            <p className="text-muted-foreground mb-2">{internship.company}</p>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{internship.location} • {internship.mode}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{internship.duration}</span>
          </div>
          {internship.stipend && (
            <div className="flex items-center space-x-2 text-sm text-success">
              <DollarSign className="w-4 h-4" />
              <span>{normalizeStipendToINR(internship.stipend)}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {internship.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
              {skill}
            </span>
          ))}
          {internship.skills.length > 3 && (
            <span className="text-muted-foreground text-xs px-2 py-1">
              +{internship.skills.length - 3} more
            </span>
          )}
        </div>
        <button
          onClick={handleApply}
          className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
            applied
              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={applied}
        >
          {applied ? 'Applied' : 'Apply Now'}
        </button>
      </div>
    </div>
  );
};

interface SmartDomainSectionsProps {
  internships: Internship[];
  profile?: any;
  onApply: (id: string, company: string) => void;
}

const SmartDomainSections: React.FC<SmartDomainSectionsProps> = ({ 
  internships = [], 
  profile, 
  onApply 
}) => {
  const sections = useMemo(() => {
    try {
      return groupByDomains(internships, profile) || [];
    } catch (error) {
      console.error('Error grouping domains:', error);
      return [];
    }
  }, [internships, profile]);
  
  if (!sections || !sections.length) return null;
  
  return (
    <div className="space-y-8 mb-8">
      {sections.map((section) => (
        <div key={section?.domain?.key || Math.random()}>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {section?.domain?.title || 'Other Opportunities'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(section.items || []).map((internship) => (
              <InternshipCard 
                key={internship.id} 
                internship={internship} 
                onApply={onApply}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Internships = (): JSX.Element => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [filters, setFilters] = useState<InternshipFilter>({
    internshipType: 'all',
    locationType: 'all',
    course: 'all',
  });

  const [showMore, setShowMore] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [internships, setInternships] = useState<Internship[]>(() => {
    const local = getLocalInternships();
    if (local && local.length) return local as Internship[];
    return LOCAL_INTERNSHIPS;
  });
  
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [recommendedInternships, setRecommended] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Add search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Load profile data
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const savedProfile = localStorage.getItem('profileData');
    if (savedProfile) {
      try {
        setProfileData(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Error parsing profile data:', error);
      }
    }
  }, [isAuthenticated, navigate]);

  // Load internships
  const loadInternships = useCallback(async () => {
    let isMounted = true;
    
    try {
      setIsLoading(true);
      setError(null);
      
      let loadedInternships: Internship[] = [];
      
      if (await hasLocalInternships()) {
        const local = await getLocalInternships();
        if (local) {
          loadedInternships = local as Internship[];
        }
      } else {
        loadedInternships = [...LOCAL_INTERNSHIPS];
        await setLocalInternships(loadedInternships);
      }
      
      if (isMounted) {
        setInternships(loadedInternships);
      }
      
      // Get profile data for recommendations with better defaults
      const savedProfile = localStorage.getItem('profileData');
      const profile = savedProfile ? JSON.parse(savedProfile) : {};
      
      // Generate recommendations with enhanced profile data
      const recommended = await recommendInternships(
        {
          keySkills: Array.isArray(profile.skills) ? profile.skills : [],
          extraSkills: Array.isArray(profile.interests) ? profile.interests : [],
          sectorInterest: profile.sector || '',
          city: profile.city || '',
          state: profile.state || '',
          course: profile.course || '',
          aspirations: profile.careerGoals || ''
        },
        loadedInternships,
        5
      );
      
      if (isMounted) {
        setRecommended(recommended);
      }
    } catch (error) {
      if (isMounted) {
        console.error('Error loading internships:', error);
        setError('Failed to load internships. Please try again later.');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  useEffect(() => {
    loadInternships();
  }, [loadInternships]);
  
  // Filter internships based on search and filters
  const filteredInternships = useMemo((): Internship[] => {
    try {
      // Start with all internships if no recommendations, otherwise use recommendations
      const sourceInternships = recommendedInternships.length > 0 ? recommendedInternships : internships;
      
      return sourceInternships.filter(internship => {
        // Apply search filter if any
        if (searchTerm && searchTerm.trim() !== '') {
          const searchLower = searchTerm.toLowerCase().trim();
          const matchesSearch = 
            (internship.title || '').toLowerCase().includes(searchLower) ||
            (internship.company || '').toLowerCase().includes(searchLower) ||
            (internship.skills || []).some(skill => 
              skill.toLowerCase().includes(searchLower)
            );
          if (!matchesSearch) return false;
        }
        
        // Apply type filter
        if (filters.internshipType && filters.internshipType !== 'all' && 
            internship.type !== filters.internshipType) {
          return false;
        }
        
        // Apply location filter
        if (filters.locationType && filters.locationType !== 'all') {
          if (filters.locationType === 'online' && internship.mode !== 'online') {
            return false;
          }
          if (filters.locationType === 'offline' && internship.mode !== 'offline') {
            return false;
          }
        }
        
        // Apply course/skill filter
        if (filters.course && filters.course !== 'all') {
          const hasMatchingSkill = (internship.skills || []).some(skill => 
            skill.toLowerCase().includes(filters.course.toLowerCase())
          );
          if (!hasMatchingSkill) return false;
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error filtering internships:', error);
      return [];
    }
  }, [internships, recommendedInternships, searchTerm, filters]);

  // Mark recommended internships
  const internshipsWithRecommendations = useMemo(() => {
    if (recommendedInternships.length === 0) return filteredInternships;
    
    const recommendedIds = new Set(recommendedInternships.map(r => r.id));
    return filteredInternships.map(internship => ({
      ...internship,
      isRecommended: recommendedIds.has(internship.id)
    }));
  }, [filteredInternships, recommendedInternships]);

  const handleApply = useCallback(async (id: string, company: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      await addApplied(id);
      setAppliedIds(prev => [...prev, id]);
      
      toast({
        title: 'Application Submitted',
        description: `Your application for ${company} has been submitted successfully!`,
      });
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    }
  }, [isAuthenticated, navigate, toast]);

  // Listen for apply events from cards
  useEffect(() => {
    const handler = (e: CustomEvent<{ id: string; company: string }>) => {
      if (e.detail) {
        handleApply(e.detail.id, e.detail.company).catch(console.error);
      }
    };
    
    window.addEventListener('apply-internship', handler);
    return () => {
      window.removeEventListener('apply-internship', handler);
    };
  }, [handleApply]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {t('internships')}
          </h1>
          {profileData && (
            <p className="text-muted-foreground">
              Recommended for you: {profileData.name} • {profileData.sectorInterest}
            </p>
          )}
        </div>

        {/* Search and Filters */}
        <div className="gov-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Filter Internships</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Internship Type
              </label>
              <select
                value={filters.internshipType}
                onChange={(e) => setFilters(prev => ({ ...prev, internshipType: e.target.value }))}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                <option value="">All Types</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <select
                value={filters.locationType}
                onChange={(e) => setFilters(prev => ({ ...prev, locationType: e.target.value }))}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                <option value="">All Locations</option>
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Course
              </label>
              <select
                value={filters.course}
                onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value }))}
                className="w-full p-2 border rounded-md bg-background text-foreground"
              >
                <option value="">All Courses</option>
                <option value="computer-science">Computer Science</option>
                <option value="engineering">Engineering</option>
                <option value="business">Business</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            {showMore ? 'Show Less' : 'Show More Filters'}
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Recommended Internships */}
            {recommendedInternships.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center space-x-2 mb-6">
                  <Star className="w-6 h-6 text-accent" />
                  <h2 className="text-2xl font-bold text-foreground">Recommended For You</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {internshipsWithRecommendations
                    .filter(internship => internship.isRecommended)
                    .map((internship) => (
                      <InternshipCard 
                        key={internship.id} 
                        internship={internship}
                        onApply={handleApply}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Domain Sections */}
            <SmartDomainSections 
              internships={internshipsWithRecommendations}
              profile={profileData}
              onApply={handleApply}
            />
          </>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Internships;
