import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/landing');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    // Simulate Google login for demo purposes
    // In a real implementation, you would integrate with Google OAuth
    const mockUser = {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      picture: 'https://via.placeholder.com/40'
    };
    
    login(mockUser);
    navigate('/landing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Government Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-primary font-bold text-2xl">PM</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('pm_internship_scheme')}
          </h1>
          <p className="text-white/80 text-lg">
            {t('find_internships')}
          </p>
        </div>

        {/* Login Card */}
        <div className="gov-card p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {t('welcome')}
            </h2>
            <p className="text-muted-foreground">
              Sign in to access personalized internship recommendations
            </p>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-border hover:border-primary/20 hover:shadow-md transition-all duration-300 px-6 py-4 rounded-lg focus-visible:gov-focus"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-foreground">
              {t('login_with_google')}
            </span>
          </button>

          {/* Features List */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>AI-powered internship recommendations</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Multi-language support</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Mobile-friendly interface</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>Personalized career guidance</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/60 text-sm">
          Government of India Initiative
        </div>
      </div>
    </div>
  );
};

export default Login;