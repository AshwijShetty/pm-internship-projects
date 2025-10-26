import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { getAppliedIds } from '@/lib/storage';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number>(0);

  useEffect(() => {
    const update = () => setAppliedCount(getAppliedIds().length);
    update();
    window.addEventListener('applied:changed', update);
    return () => window.removeEventListener('applied:changed', update);
  }, []);

  const languages = [
    { code: 'en' as Language, name: 'English', nativeName: 'English' },
    { code: 'hi' as Language, name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'kn' as Language, name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'te' as Language, name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ta' as Language, name: 'Tamil', nativeName: 'தமிழ்' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="gov-header sticky top-0 z-50 border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-4 hover:opacity-90 transition-opacity">
              {/* PM Internship Logo */}
              <div className="h-12 w-auto">
                <img 
                  src="/images/pm-logo.jpg" 
                  alt="PM Internship Scheme" 
                  className="h-full w-auto object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = 'https://via.placeholder.com/150x60?text=PM+Internship';
                  }}
                />
              </div>
              
              {/* Divider */}
              <div className="h-12 w-px bg-white/30"></div>
              
              {/* Government of India Logo */}
              <div className="h-12 w-auto">
                <img 
                  src="/images/govt-india-logo.png" 
                  alt="Government of India" 
                  className="h-full w-auto object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = 'https://via.placeholder.com/150x60?text=Govt+of+India';
                  }}
                />
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/landing" 
              className="text-white hover:text-white/80 transition-colors font-medium"
            >
              {t('welcome')}
            </Link>
            <Link 
              to="/profile" 
              className="text-white hover:text-white/80 transition-colors font-medium"
            >
              {t('profile')}
            </Link>
            <Link 
              to="/internships" 
              className="text-white hover:text-white/80 transition-colors font-medium"
            >
              {t('internships')}
            </Link>
            <Link 
              to="/applied" 
              className="relative text-white hover:text-white/80 transition-colors font-medium"
            >
              Applied
              {appliedCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-xs bg-white/20 text-white rounded-full px-2 py-0.5">
                  {appliedCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Right Side - Language Selector and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors focus-visible:gov-focus"
              >
                <span className="font-medium">
                  {languages.find(lang => lang.code === language)?.nativeName}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-secondary transition-colors ${
                        language === lang.code ? 'bg-secondary text-primary font-medium' : 'text-foreground'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{lang.nativeName}</div>
                        <div className="text-sm text-muted-foreground">{lang.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors focus-visible:gov-focus"
                >
                  {user.picture ? (
                    <img 
                      src={user.picture} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-white/20 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=64&bold=true`;
                      }}
                    />
                  ) : (
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&size=64&bold=true`}
                      alt={user?.name || 'User'}
                      className="w-8 h-8 rounded-full border-2 border-white/20 object-cover"
                    />
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-border rounded-lg shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-destructive hover:bg-destructive/10 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;