import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import { Upload, Save } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { getProfileData, setProfileData as setProfileDataStorage, type StoredProfileData } from '../lib/storage';

interface ProfileData {
  name: string;
  state: string;
  city: string;
  course: string;
  sectorInterest: string;
  keySkills: string[];
  extraSkills: string[];
  aspirations: string;
  cvFile: File | null;
}

const Profile: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    state: '',
    city: '',
    course: '',
    sectorInterest: '',
    keySkills: [],
    extraSkills: [],
    aspirations: '',
    cvFile: null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli',
    'Daman and Diu', 'Lakshadweep', 'Puducherry'
  ];

  const metropolitanCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai',
    'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
    'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
    'Varanasi', 'Srinagar', 'Dhanbad', 'Jodhpur', 'Amritsar', 'Raipur',
    'Allahabad', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada'
  ];

  const sectors = [
    'Information Technology', 'Banking & Finance', 'Healthcare', 'Education',
    'Manufacturing', 'Retail & E-commerce', 'Automotive', 'Telecommunications',
    'Agriculture', 'Renewable Energy', 'Media & Entertainment', 'Hospitality',
    'Real Estate', 'Logistics & Transportation', 'Pharmaceuticals', 'Textiles',
    'Food & Beverages', 'Aerospace & Defense', 'Chemicals', 'Mining'
  ];

  const courseOptions = [
    'Engineering', 'Management', 'Commerce', 'Arts', 'Science', 'Diploma', 'Polytechnic', 'Other'
  ];

  const techSkills = [
    // Core CS/IT
    'C', 'C++', 'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'NoSQL',
    'Data Structures', 'Algorithms', 'Operating Systems', 'Computer Networks', 'DBMS', 'OOP',
    'Machine Learning', 'Deep Learning', 'Data Analysis', 'Artificial Intelligence', 'Blockchain',
    'Cloud Computing', 'AWS', 'Azure', 'GCP', 'DevOps', 'Docker', 'Kubernetes', 'CI/CD',
    'Mobile Development', 'Web Development', 'REST APIs', 'GraphQL',

    // ECE / EEE / Instrumentation
    'Digital Electronics', 'Analog Electronics', 'Microcontrollers', 'Embedded Systems',
    'ARM Cortex', '8051', 'PIC', 'IoT', 'VLSI', 'Verilog', 'VHDL', 'FPGA', 'PCB Design',
    'Circuit Design', 'LTspice', 'Proteus', 'MATLAB', 'Simulink', 'Signal Processing', 'DSP',
    'Control Systems', 'Power Systems', 'Power Electronics', 'SCADA', 'PLC',

    // Mechanical / Mechatronics / Aerospace
    'Thermodynamics', 'Fluid Mechanics', 'Heat Transfer', 'Strength of Materials',
    'Manufacturing Processes', 'CNC', 'CAD/CAM', 'SolidWorks', 'CATIA', 'AutoCAD', 'ANSYS',
    'Mechatronics', 'Robotics', 'HVAC', 'Mechanical Design', 'Finite Element Analysis',

    // Civil
    'Structural Analysis', 'Geotechnical Engineering', 'Surveying', 'Transportation Engineering',
    'Construction Management', 'Revit', 'ETABS', 'STAAD.Pro', 'Primavera',

    // Chemical / Biotech
    'Process Control', 'Process Design', 'Aspen HYSYS', 'Mass Transfer', 'Heat Exchangers',
    'Materials Science', 'Bioprocess Engineering', 'Lab Safety',

    // General Engineering/Tools
    'Project Management', 'Technical Writing', 'Quality Control', 'Six Sigma', 'MS Office'
  ];

  const artsSkills = [
    'Creative Writing', 'Photography', 'Graphic Design', 'Public Speaking', 'Content Creation',
    'Social Media', 'Video Editing', 'UI/UX Basics', 'Storytelling', 'Research',
    'Illustration', 'Event Management', 'Copywriting', 'Blogging', 'Presentation Skills'
  ];

  const managementSkills = [
    'Project Management', 'Excel', 'Business Analysis', 'Marketing', 'Communication',
    'Leadership', 'Sales', 'Customer Relationship', 'Market Research', 'Presentation', 'Strategic Planning'
  ];

  const commerceSkills = [
    'Accounting', 'Tally', 'Finance', 'Excel', 'Taxation', 'Business Law', 'Financial Analysis', 'MS Office', 'Data Entry'
  ];

  const scienceSkills = [
    'Research', 'Lab Techniques', 'Data Analysis', 'Statistics', 'Report Writing', 'Scientific Method'
  ];

  const diplomaSkills = [
    'AutoCAD', 'Electronics', 'Embedded Systems', 'CNC', 'Quality Control', 'Mechanical Drafting', 'Maintenance'
  ];

  const generalSkills = [
    'MS Office', 'Communication', 'Problem Solving', 'Team Work', 'Time Management', 'Writing', 'Presentation Skills'
  ];

  const getSkillsForCourse = (course: string) => {
    switch (course) {
      case 'engineering':
        return techSkills;
      case 'management':
        return managementSkills;
      case 'commerce':
        return commerceSkills;
      case 'arts':
        return artsSkills;
      case 'science':
        return scienceSkills;
      case 'diploma':
        return diplomaSkills;
      case 'polytechnic':
        return diplomaSkills;
      case 'other':
        return generalSkills;
      default:
        return techSkills;
    }
  };

  const extraSkillsList = [
    'Communication', 'Leadership', 'Team Work', 'Problem Solving', 'Negotiation',
    'Time Management', 'Critical Thinking', 'Creativity', 'Adaptability',
    'Project Management', 'Customer Service', 'Sales', 'Marketing',
    'Research Skills', 'Public Speaking', 'Analytical Skills', 'Technical Writing'
  ];

  const handleSkillToggle = (skill: string, type: 'key' | 'extra') => {
    if (type === 'key') {
      setProfileData(prev => ({
        ...prev,
        keySkills: prev.keySkills.includes(skill)
          ? prev.keySkills.filter(s => s !== skill)
          : [...prev.keySkills, skill]
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        extraSkills: prev.extraSkills.includes(skill)
          ? prev.extraSkills.filter(s => s !== skill)
          : [...prev.extraSkills, skill]
      }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Read a base64 snapshot (guard against very large files)
      const MAX_BASE64_BYTES = 2 * 1024 * 1024; // ~2MB
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = typeof result === 'string' ? result : '';
        setProfileData(prev => ({ ...prev, cvFile: file }));
        // Persist metadata + optional base64 into storage immediately
        saveProfileToStorage({
          cvFileBase64: base64.length <= MAX_BASE64_BYTES ? base64 : undefined,
          cvFileName: file.name,
          cvFileType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save all current fields to localStorage
    saveProfileToStorage();
    
    toast({
      title: "Profile Saved Successfully!",
      description: "Your profile has been updated. You can now view personalized internship recommendations.",
    });

    // Navigate to internships page
    navigate('/internships');
  };

  // Helper to persist to localStorage via storage util
  const saveProfileToStorage = (partial?: Partial<StoredProfileData>) => {
    const existing = getProfileData() || ({} as StoredProfileData);
    const toStore: StoredProfileData = {
      name: profileData.name,
      state: profileData.state,
      city: profileData.city,
      course: profileData.course,
      sectorInterest: profileData.sectorInterest,
      keySkills: profileData.keySkills,
      extraSkills: profileData.extraSkills,
      aspirations: profileData.aspirations,
      cvFileBase64: existing.cvFileBase64,
      cvFileName: existing.cvFileName,
      cvFileType: existing.cvFileType,
      ...partial,
    };
    try {
      setProfileDataStorage(toStore);
    } catch {}
  };

  // Load saved profile data on mount using storage util
  useEffect(() => {
    const saved = getProfileData();
    if (saved) {
      setProfileData(prev => ({
        ...prev,
        ...saved,
        cvFile: null, // cannot restore File from storage
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save on changes (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      saveProfileToStorage();
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData.name, profileData.state, profileData.city, profileData.course, profileData.sectorInterest, profileData.keySkills, profileData.extraSkills, profileData.aspirations]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="gov-card p-8">
            <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
              {t('profile')} Information
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="gov-input"
                      placeholder="Enter your full name"
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('course')}
                  </label>
                  <select
                    value={profileData.course}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProfileData(prev => ({ ...prev, course: value, keySkills: [] }));
                    }}
                    className="gov-select"
                  >
                    <option value="">Select Course</option>
                    {courseOptions.map(c => (
                      <option key={c} value={c.toLowerCase()}>{c}</option>
                    ))}
                  </select>
                </div>
                </div>
              </section>

              {/* Location */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">{t('location')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('state')} *
                    </label>
                    <select
                      required
                      value={profileData.state}
                      onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                      className="gov-select"
                    >
                      <option value="">Select State</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('city')} *
                    </label>
                    <select
                      required
                      value={profileData.city}
                      onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                      className="gov-select"
                    >
                      <option value="">Select City</option>
                      {metropolitanCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Sector Interest */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">{t('sector_interest')}</h2>
                <select
                  required
                  value={profileData.sectorInterest}
                  onChange={(e) => setProfileData(prev => ({ ...prev, sectorInterest: e.target.value }))}
                  className="gov-select"
                >
                  <option value="">Select Sector</option>
                  {sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </section>

              {/* Key Skills */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-foreground">{t('key_skills')}</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
                    {profileData.course === 'arts' ? 'Arts Track' : 'Engineering / General Track'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Select the core skills that best describe you.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {getSkillsForCourse(profileData.course).map(skill => {
                    const selected = profileData.keySkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill, 'key')}
                        className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border'
                        }`}
                        aria-pressed={selected}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Extra Skills */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">{t('extra_skills')}</h2>
                <p className="text-sm text-muted-foreground mb-3">Complement your profile with soft skills and general abilities.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {extraSkillsList.map(skill => {
                    const selected = profileData.extraSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill, 'extra')}
                        className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                          selected
                            ? 'bg-accent text-accent-foreground border-accent'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border'
                        }`}
                        aria-pressed={selected}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Aspirations */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">{t('aspirations')}</h2>
                <textarea
                  value={profileData.aspirations}
                  onChange={(e) => setProfileData(prev => ({ ...prev, aspirations: e.target.value }))}
                  className="gov-input h-32 resize-none"
                  placeholder="Describe your career aspirations, goals, and what you hope to achieve through internships..."
                />
              </section>

              {/* CV Upload */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">{t('upload_cv')}</h2>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-foreground font-medium">
                      {profileData.cvFile ? profileData.cvFile.name : 'Click to upload your CV'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supported formats: PDF, DOC, DOCX (Max 5MB)
                    </p>
                  </label>
                </div>
              </section>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button
                  type="submit"
                  className="gov-button-primary text-lg px-8 py-4 flex items-center space-x-2 mx-auto"
                >
                  <Save className="w-5 h-5" />
                  <span>{t('save_profile')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;