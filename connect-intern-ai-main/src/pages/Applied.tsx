import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { getAppliedIds, getLocalInternships, removeApplied } from '@/lib/storage';
import { LOCAL_INTERNSHIPS } from '@/lib/internships';
import { MapPin, Clock, DollarSign } from 'lucide-react';
import { normalizeStipendToINR } from '@/lib/currency';
import { companyDomainFor } from '@/lib/assets';
import { useToast } from '@/hooks/use-toast';

const Applied: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [appliedIds, setAppliedIds] = useState<string[]>(() => getAppliedIds());
  const [internships, setInternships] = useState(() => {
    const local = getLocalInternships();
    if (local && local.length) return local;
    return LOCAL_INTERNSHIPS;
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const update = () => setAppliedIds(getAppliedIds());
    window.addEventListener('applied:changed', update);
    return () => window.removeEventListener('applied:changed', update);
  }, []);

  const appliedList = useMemo(() => {
    const byId = new Map(internships.map((i) => [i.id, i] as const));
    return appliedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [appliedIds, internships]);

  const { toast } = useToast();

  const handleWithdraw = (id: string, company: string) => {
    removeApplied(id);
    setAppliedIds((prev) => prev.filter((x) => x !== id));
    window.dispatchEvent(new CustomEvent('applied:changed'));
    toast({
      title: 'Application withdrawn',
      description: `You have withdrawn your application from ${company}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Applied Internships</h1>
          <p className="text-muted-foreground">{appliedList.length} application{appliedList.length === 1 ? '' : 's'}</p>
        </div>

        {appliedList.length === 0 ? (
          <div className="gov-card p-8 text-center">
            <p className="text-muted-foreground mb-4">You haven't applied to any internships yet.</p>
            <button
              className="gov-button-primary"
              onClick={() => navigate('/internships')}
            >
              Browse Internships
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appliedList.map((internship) => (
              <div key={internship!.id} className="internship-card">
                <div className="flex items-start space-x-4 mb-4">
                  {(() => {
                    const domain = companyDomainFor(internship!.company);
                    const fallbacks = domain
                      ? [
                          `https://logo.clearbit.com/${domain}`,
                          `https://unavatar.io/${domain}?fallback=false`,
                          `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                        ]
                      : [];
                    const initial = internship!.logo || (fallbacks[0] || '/placeholder.svg');
                    return (
                      <img
                        src={initial}
                        alt={internship!.company}
                        className="company-logo flex-shrink-0"
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
                      {internship!.title}
                    </h3>
                    <p className="text-muted-foreground mb-2">{internship!.company}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{internship!.location} • {internship!.mode}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{internship!.duration}</span>
                  </div>
                  {internship!.stipend && (
                    <div className="flex items-center space-x-2 text-sm text-success">
                      <DollarSign className="w-4 h-4" />
                      <span>{normalizeStipendToINR(internship!.stipend!)}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {internship!.skills.slice(0, 3).map((skill) => (
                    <span key={skill} className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    className="gov-button-accent"
                    onClick={() => handleWithdraw(internship!.id, internship!.company)}
                  >
                    Withdraw Application
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applied;
