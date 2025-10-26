import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import { ArrowRight, Search as SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';

// Logo fallback utility function
const logoWithFallback = (primary: string, fallbacks: string[]) => {
  return {
    src: primary,
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget as HTMLImageElement & { _fb?: number };
      const next = img._fb || 0;
      if (next < fallbacks.length) {
        img._fb = next + 1;
        img.src = fallbacks[next];
      } else {
        img.src = '/placeholder.svg';
      }
    },
  };
};

const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const companies = [
    { name: 'Tata Group', domain: 'tata.com', industry: 'Conglomerate' },
    { name: 'Infosys', domain: 'infosys.com', industry: 'IT Services' },
    { name: 'Wipro', domain: 'wipro.com', industry: 'Technology' },
    { name: 'TCS', domain: 'tcs.com', industry: 'IT Consulting' },
    { name: 'Reliance', domain: 'ril.com', industry: 'Petroleum' },
    { name: 'HDFC Bank', domain: 'hdfcbank.com', industry: 'Banking' },
    { name: 'ITC', domain: 'itcportal.com', industry: 'FMCG' },
    { name: 'Bharti Airtel', domain: 'airtel.com', industry: 'Telecom' },
  ];


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white">
      <Header />
      
      {/* Hero Section with Background - Enhanced */}
      <section className="relative min-h-[80vh] flex items-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80"></div>
        </div>
        
        <div className="container mx-auto relative z-10 mt-16">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            {/* Left Side - Content */}
            <div className="w-full lg:w-2/3 text-center lg:text-left">
              <motion.div 
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.h1 
                  className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-none tracking-tight"
                >
                  <motion.span 
                    className="block"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    Welcome to
                  </motion.span>
                  <motion.span 
                    className="text-yellow-400 mt-2 md:mt-4 block"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 0.4,
                      type: "spring",
                      stiffness: 100
                    }}
                  >
                    PM Internship Scheme
                  </motion.span>
                </motion.h1>
                
                <motion.p 
                  className="text-xl md:text-2xl text-blue-100 mt-6 max-w-2xl mx-auto lg:mx-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Empowering India's youth with AI-powered internship recommendations. 
                  Find opportunities that match your skills, interests, and aspirations.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <button
                    onClick={() => navigate('/profile')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-semibold py-3 px-6 rounded-full flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <span>Complete Your Profile</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate('/internships')}
                    className="bg-transparent hover:bg-white/10 border-2 border-white text-white font-semibold py-3 px-6 rounded-full flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
                  >
                    <span>Browse Internships</span>
                    <SearchIcon className="w-5 h-5" />
                  </button>
                </motion.div>
              </motion.div>
            </div>
            
            {/* Right Side - India Map and PM Image */}
            <div className="w-full lg:w-1/3 flex flex-col items-center space-y-6 mt-10 lg:mt-0">
              {/* India Map */}
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-4 bg-yellow-400/20 rounded-full blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 w-full">
                  <div className="bg-blue-900/30 rounded-lg overflow-hidden w-full">
                    <img 
                      src="/images/india-map.png" 
                      alt="India Map" 
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'https://via.placeholder.com/300x300?text=India+Map';
                      }}
                    />
                  </div>
                  <p className="mt-4 text-center text-blue-100 text-lg font-medium">Nationwide Opportunities</p>
                </div>
              </div>

              {/* PM Image - Enhanced */}
              <div className="relative w-full max-w-md">
                <div className="absolute -inset-2 bg-yellow-400/20 rounded-full blur-xl"></div>
                <div className="relative bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-center bg-gradient-to-r from-blue-900/80 to-blue-800/80 p-2">
                    <img 
                      src="/pm%20img/profile-260514-feature1.avif" 
                      alt="Honorable Prime Minister" 
                      className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover rounded-lg shadow-xl transform transition-transform duration-300 hover:scale-105"
                      style={{
                        objectPosition: 'center 30%',
                        maxWidth: '100%',
                        height: 'auto',
                        maxHeight: '400px'
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = 'https://via.placeholder.com/400x300?text=PM+Image';
                      }}
                    />
                  </div>
                  <div className="p-3 text-center">
                    <h3 className="text-lg font-semibold text-yellow-400">Honorable Prime Minister</h3>
                    <p className="text-sm text-blue-100">Prime Minister's Internship Scheme</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section className="py-16 bg-white text-blue-900 relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400"></div>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-3xl font-bold text-blue-900 mb-2">10,000+</div>
              <div className="text-gray-600">Active Internships</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-blue-900 mb-2">500+</div>
              <div className="text-gray-600">Partner Companies</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-blue-900 mb-2">1M+</div>
              <div className="text-gray-600">Students Placed</div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-blue-900 mb-2">28</div>
              <div className="text-gray-600">States Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-4">
            Partnered Companies
          </h2>
          <div className="w-24 h-1 bg-yellow-500 mx-auto mb-12"></div>
          
          <div className="relative overflow-hidden">
            <div className="flex scroll-animate space-x-8 py-4">
              {[...companies, ...companies].map((company, index) => (
                <div key={index} className="flex-shrink-0 gov-card p-6 w-64">
                  <div className="flex items-center space-x-4">
                    {(() => {
                      const primary = `https://logo.clearbit.com/${company.domain}`;
                      const fallbacks = [
                        `https://unavatar.io/${company.domain}?fallback=false`,
                        `https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`,
                      ];
                      return (
                        <img
                          src={primary}
                          alt={company.name}
                          className="company-logo"
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
                    <div>
                      <h3 className="font-semibold text-foreground">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">{company.industry}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-blue-900 mb-4">
              Why Choose PM Internship Scheme?
            </h2>
            <div className="w-24 h-1 bg-yellow-500 mx-auto mb-12"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="gov-card p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">AI-Powered Matching</h3>
                <p className="text-muted-foreground">
                  Our Gemini AI analyzes your profile to suggest the most relevant internships
                </p>
              </div>
              
              <div className="gov-card p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Multi-Language Support</h3>
                <p className="text-muted-foreground">
                  Available in 5 Indian languages for better accessibility
                </p>
              </div>
              
              <div className="gov-card p-6 text-center">
                <div className="w-16 h-16 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Mobile Friendly</h3>
                <p className="text-muted-foreground">
                  Optimized for mobile devices and low-bandwidth connections
                </p>
              </div>
              
              <div className="gov-card p-6 text-center">
                <div className="w-16 h-16 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Personalized Recommendations</h3>
                <p className="text-muted-foreground">
                  Get 3-5 highly relevant internship suggestions instead of overwhelming lists
                </p>
              </div>
              
              <div className="gov-card p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Top Companies</h3>
                <p className="text-muted-foreground">
                  Access internships from India's leading companies and startups
                </p>
              </div>
              
              <div className="gov-card p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Career Growth</h3>
                <p className="text-muted-foreground">
                  Build skills, gain experience, and accelerate your career journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students who have found their dream internships with us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-semibold px-8 py-3 rounded-full hover:scale-105 transition-transform shadow-lg"
              >
                Get Started Now
              </button>
              <button
                onClick={() => navigate('/about')}
                className="bg-transparent hover:bg-white/10 border-2 border-white text-white font-semibold px-8 py-3 rounded-full hover:scale-105 transition-transform"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Contact Us */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">Contact Us</h3>
              <address className="not-italic">
                <p className="mb-2">A Wing, 5th Floor, Shastri Bhawan,</p>
                <p className="mb-2">Dr Rajendra Prasad Rd,</p>
                <p className="mb-4">New Delhi - 110001</p>
                <p className="mb-2">
                  <a href="mailto:pminternship@mca.gov.in" className="hover:text-yellow-400 transition-colors">
                    pminternship[at]mca.gov.in
                  </a>
                </p>
                <p className="mb-4">
                  <a href="tel:1800116090" className="hover:text-yellow-400 transition-colors">
                    1800 11 6090
                  </a>
                </p>
                <p className="text-sm text-gray-400">
                  Build Version: 1758558855355
                </p>
              </address>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="hover:text-yellow-400 transition-colors">About Us</a></li>
                <li><a href="/internships" className="hover:text-yellow-400 transition-colors">Find Internships</a></li>
                <li><a href="/guidelines" className="hover:text-yellow-400 transition-colors">Guidelines</a></li>
                <li><a href="/faq" className="hover:text-yellow-400 transition-colors">FAQs</a></li>
              </ul>
            </div>

            {/* Statistics */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">Statistics</h3>
              <div className="text-3xl font-bold text-yellow-400 mb-2">4,16,04,764</div>
              <p className="text-gray-300">Total Visitors</p>
            </div>

            {/* About */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">About</h3>
              <p className="mb-4">
                This site is owned by <span className="text-yellow-400">Ministry of Corporate Affairs</span>.
              </p>
              <p className="text-sm text-gray-400">
                © 2024 PM-INTERNSHIP, All Rights Reserved.
              </p>
              <p className="mt-2 text-sm">
                Technical collaboration with{' '}
                <a href="https://bisag-n.gov.in/" target="_blank" rel="noopener noreferrer" 
                   className="text-yellow-400 hover:underline">
                  BISAG-N
                </a>
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;