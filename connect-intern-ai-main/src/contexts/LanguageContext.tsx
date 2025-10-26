import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'kn' | 'te' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'pm_internship_scheme': 'PM Internship Scheme',
    'welcome': 'Welcome to PM Internship Scheme',
    'find_internships': 'Find Perfect Internships',
    'login_with_google': 'Login with Google',
    'profile': 'Profile',
    'internships': 'Internships',
    'logout': 'Logout',
    'name': 'Name',
    'location': 'Location',
    'state': 'State',
    'city': 'City',
    'sector_interest': 'Sector Interest',
    'key_skills': 'Key Skills',
    'extra_skills': 'Extra Skills',
    'aspirations': 'Aspirations Description',
    'upload_cv': 'Upload CV',
    'save_profile': 'Save Profile',
    'search_internships': 'Search Internships',
    'internship_type': 'Internship Type',
    'location_type': 'Location Type',
    'course': 'Course',
    'show_more': 'Show More',
    'recommended_for_you': 'Recommended for You',
    'guide_video': 'How to Use Guide',
  },
  hi: {
    'pm_internship_scheme': 'पीएम इंटर्नशिप योजना',
    'welcome': 'पीएम इंटर्नशिप योजना में आपका स्वागत है',
    'find_internships': 'सही इंटर्नशिप खोजें',
    'login_with_google': 'गूगल से लॉगिन करें',
    'profile': 'प्रोफाइल',
    'internships': 'इंटर्नशिप',
    'logout': 'लॉगआउट',
    'name': 'नाम',
    'location': 'स्थान',
    'state': 'राज्य',
    'city': 'शहर',
    'sector_interest': 'क्षेत्रीय रुचि',
    'key_skills': 'मुख्य कौशल',
    'extra_skills': 'अतिरिक्त कौशल',
    'aspirations': 'आकांक्षा विवरण',
    'upload_cv': 'सीवी अपलोड करें',
    'save_profile': 'प्रोफाइल सेव करें',
    'search_internships': 'इंटर्नशिप खोजें',
    'internship_type': 'इंटर्नशिप प्रकार',
    'location_type': 'स्थान प्रकार',
    'course': 'कोर्स',
    'show_more': 'और दिखाएं',
    'recommended_for_you': 'आपके लिए सुझावित',
    'guide_video': 'उपयोग गाइड',
  },
  kn: {
    'pm_internship_scheme': 'ಪ್ರಧಾನಮಂತ್ರಿ ಇಂಟರ್ನ್‌ಶಿಪ್ ಯೋಜನೆ',
    'welcome': 'ಪ್ರಧಾನಮಂತ್ರಿ ಇಂಟರ್ನ್‌ಶಿಪ್ ಯೋಜನೆಗೆ ಸುಸ್ವಾಗತ',
    'find_internships': 'ಸರಿಯಾದ ಇಂಟರ್ನ್‌ಶಿಪ್ ಹುಡುಕಿ',
    'login_with_google': 'ಗೂಗಲ್‌ನೊಂದಿಗೆ ಲಾಗಿನ್ ಮಾಡಿ',
    'profile': 'ಪ್ರೊಫೈಲ್',
    'internships': 'ಇಂಟರ್ನ್‌ಶಿಪ್‌ಗಳು',
    'logout': 'ಲಾಗ್ ಔಟ್',
    'name': 'ಹೆಸರು',
    'location': 'ಸ್ಥಳ',
    'state': 'ರಾಜ್ಯ',
    'city': 'ನಗರ',
    'sector_interest': 'ಕ್ಷೇತ್ರದ ಆಸಕ್ತಿ',
    'key_skills': 'ಮುಖ್ಯ ಕೌಶಲ್ಯಗಳು',
    'extra_skills': 'ಹೆಚ್ಚುವರಿ ಕೌಶಲ್ಯಗಳು',
    'aspirations': 'ಮಹತ್ವಾಕಾಂಕ್ಷೆಗಳ ವಿವರಣೆ',
    'upload_cv': 'ಸಿವಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    'save_profile': 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ',
    'search_internships': 'ಇಂಟರ್ನ್‌ಶಿಪ್ ಹುಡುಕಿ',
    'internship_type': 'ಇಂಟರ್ನ್‌ಶಿಪ್ ಪ್ರಕಾರ',
    'location_type': 'ಸ್ಥಳದ ಪ್ರಕಾರ',
    'course': 'ಕೋರ್ಸ್',
    'show_more': 'ಹೆಚ್ಚು ತೋರಿಸಿ',
    'recommended_for_you': 'ನಿಮಗಾಗಿ ಶಿಫಾರಸು',
    'guide_video': 'ಬಳಕೆಯ ಮಾರ್ಗದರ್ಶಿ',
  },
  te: {
    'pm_internship_scheme': 'ప్రధానమంత్రి ఇంటర్న్‌షిప్ పథకం',
    'welcome': 'ప్రధానమంత్రి ఇంటర్న్‌షిప్ పథకానికి స్వాగతం',
    'find_internships': 'సరైన ఇంటర్న్‌షిప్‌లను కనుగొనండి',
    'login_with_google': 'గూగుల్‌తో లాగిన్ చేయండి',
    'profile': 'ప్రొఫైల్',
    'internships': 'ఇంటర్న్‌షిప్‌లు',
    'logout': 'లాగ్ అవుట్',
    'name': 'పేరు',
    'location': 'స్థలం',
    'state': 'రాష్ట్రం',
    'city': 'నగరం',
    'sector_interest': 'రంగ ఆసక్తి',
    'key_skills': 'ముఖ్య నైపుణ్యాలు',
    'extra_skills': 'అదనపు నైపుణ్యాలు',
    'aspirations': 'ఆకాంక్షల వివరణ',
    'upload_cv': 'సివి అప్‌లోడ్ చేయండి',
    'save_profile': 'ప్రొఫైల్ సేవ్ చేయండి',
    'search_internships': 'ఇంటర్న్‌షిప్‌లను వెతకండి',
    'internship_type': 'ఇంటర్న్‌షిప్ రకం',
    'location_type': 'స్థల రకం',
    'course': 'కోర్సు',
    'show_more': 'మరిన్ని చూపించు',
    'recommended_for_you': 'మీకు సిఫార్సు చేయబడినవి',
    'guide_video': 'వాడుక గైడ్',
  },
  ta: {
    'pm_internship_scheme': 'பிரதம மந்திரி பயிற்சித் திட்டம்',
    'welcome': 'பிரதம மந்திரி பயிற்சித் திட்டத்திற்கு வரவேற்கிறோம்',
    'find_internships': 'சரியான பயிற்சிகளைக் கண்டறியுங்கள்',
    'login_with_google': 'கூகிளுடன் உள்நுழையுங்கள்',
    'profile': 'சுயவிவரம்',
    'internships': 'பயிற்சிகள்',
    'logout': 'வெளியேறு',
    'name': 'பெயர்',
    'location': 'இடம்',
    'state': 'மாநிலம்',
    'city': 'நகரம்',
    'sector_interest': 'துறை ஆர்வம்',
    'key_skills': 'முக்கிய திறன்கள்',
    'extra_skills': 'கூடுதல் திறன்கள்',
    'aspirations': 'அபிலாஷைகள் விளக்கம்',
    'upload_cv': 'சிவி பதிவேற்றுங்கள்',
    'save_profile': 'சுயவிவரத்தைச் சேமிக்கவும்',
    'search_internships': 'பயிற்சிகளைத் தேடுங்கள்',
    'internship_type': 'பயிற்சி வகை',
    'location_type': 'இட வகை',
    'course': 'பாடத்திட்டம்',
    'show_more': 'மேலும் காட்டு',
    'recommended_for_you': 'உங்களுக்கு பரிந்துரைக்கப்பட்டவை',
    'guide_video': 'பயன்பாட்டு வழிகாட்டி',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};