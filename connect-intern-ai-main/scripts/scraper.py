"""
PM Internship Scheme Scraper

This script demonstrates how to ethically scrape internship data from the PM Internship Scheme portal.
It includes rate limiting, caching, and respects robots.txt.
"""

import requests
import time
from bs4 import BeautifulSoup
from urllib.robotparser import RobotFileParser
from typing import List, Dict, Optional
import json
from pathlib import Path
import os
import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
import unicodedata

# Configuration
BASE_URL = "https://pminternship.mca.gov.in/"
CACHE_DIR = Path("./data/cache")
CACHE_EXPIRY_HOURS = 24  # Cache data for 24 hours
REQUEST_DELAY = 2  # Delay between requests in seconds
OUTPUT_DIR = Path("./data")

# Mapping of location names to standard formats
LOCATION_MAPPING = {
    'bengaluru': 'Bangalore',
    'banglore': 'Bangalore',
    'mumbai': 'Mumbai',
    'delhi': 'Delhi',
    'hyderabad': 'Hyderabad',
    'chennai': 'Chennai',
    'pune': 'Pune',
    'gurgaon': 'Gurugram',
    'noida': 'Noida',
    'remote': 'Remote',
    'work from home': 'Remote',
    'wfh': 'Remote',
    'hybrid': 'Hybrid'
}

# Common skills mapping for standardization
SKILLS_MAPPING = {
    'js': 'JavaScript',
    'reactjs': 'React',
    'nodejs': 'Node.js',
    'python3': 'Python',
    'ml': 'Machine Learning',
    'ai': 'Artificial Intelligence',
    'dl': 'Deep Learning',
    'nlp': 'Natural Language Processing',
    'dbms': 'Database Management',
    'sql': 'SQL',
    'nosql': 'NoSQL'
}

# Create cache directory if it doesn't exist
CACHE_DIR.mkdir(parents=True, exist_ok=True)

class RateLimitedSession(requests.Session):
    """Session with rate limiting"""
    def __init__(self, delay=1.0):
        super().__init__()
        self.delay = delay
        self.last_request = 0
        
    def request(self, *args, **kwargs):
        # Implement rate limiting
        elapsed = time.time() - self.last_request
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        
        response = super().request(*args, **kwargs)
        self.last_request = time.time()
        return response

def get_robots_parser():
    """Get the robots.txt parser"""
    rp = RobotFileParser()
    try:
        robots_url = f"{BASE_URL.rstrip('/')}/robots.txt"
        print(f"Checking robots.txt at: {robots_url}")
        
        # Skip SSL verification for robots.txt to avoid certificate issues
        import urllib.request
        import ssl
        
        # Create unverified SSL context
        ssl_context = ssl._create_unverified_context()
        
        # Add a custom user agent
        req = urllib.request.Request(
            robots_url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        
        # Fetch robots.txt with the unverified context
        with urllib.request.urlopen(req, context=ssl_context, timeout=10) as response:
            content = response.read().decode('utf-8')
            
        # Parse the robots.txt content
        rp.parse(content.splitlines())
        print("Successfully parsed robots.txt")
        
    except Exception as e:
        print(f"Warning: Could not fetch/parse robots.txt: {e}")
        # If we can't fetch robots.txt, assume all paths are allowed
        rp.allow_all = True
        
    return rp

def is_allowed(url: str, user_agent: str = "*") -> bool:
    """Check if scraping is allowed for the given URL"""
    rp = get_robots_parser()
    return rp.can_fetch(user_agent, url)

def standardize_skill(skill: str) -> str:
    """Standardize skill names using the mapping"""
    if not skill:
        return ""
    skill = str(skill).strip().lower()
    return SKILLS_MAPPING.get(skill, skill.title())

def standardize_location(location: str) -> str:
    """Standardize location names"""
    if not location:
        return 'Remote'  # Default to Remote if no location specified
    
    location = str(location).strip().lower()
    
    # Check for remote/hybrid first
    if any(term in location for term in ['remote', 'work from home', 'wfh']):
        return 'Remote'
    if 'hybrid' in location:
        return 'Hybrid'
    
    # Check for known locations
    for key, value in LOCATION_MAPPING.items():
        if key in location:
            return value
    
    # If no match, return title-cased version
    return location.title()

def extract_skills_from_text(text: str) -> List[str]:
    """Extract and standardize skills from text"""
    if not text:
        return []
    
    # Common skill separators
    separators = [',', ';', '|', '/', ' and ', ' & ', ' or ']
    
    # Replace separators with commas
    text = str(text).lower()
    for sep in separators:
        text = text.replace(sep, ',')
    
    # Split and clean skills
    skills = []
    for skill in text.split(','):
        skill = skill.strip()
        if skill and len(skill) > 1:  # Skip empty or single-character skills
            skills.append(standardize_skill(skill))
    
    return list(set(skills))  # Remove duplicates

def get_cached_data(cache_key: str) -> Optional[dict]:
    """Get cached data if it exists and is not expired"""
    cache_file = CACHE_DIR / f"{cache_key}.json"
    
    if not cache_file.exists():
        return None
        
    try:
        # Check if cache is expired
        mtime = datetime.fromtimestamp(cache_file.stat().st_mtime)
        if datetime.now() - mtime > timedelta(hours=CACHE_EXPIRY_HOURS):
            return None
            
        # Return cached data
        with open(cache_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading cache {cache_key}: {e}")
        return None

def save_to_cache(cache_key: str, data: dict):
    """Save data to cache"""
    try:
        cache_file = CACHE_DIR / f"{cache_key}.json"
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving to cache {cache_key}: {e}")

def fetch_page(url: str, session: RateLimitedSession) -> Optional[str]:
    """Fetch a web page with error handling and caching"""
    cache_key = f"page_{hash(url) & 0xFFFFFFFF}"
    
    # Check cache first
    cached = get_cached_data(cache_key)
    if cached:
        return cached.get('content')
    
    # Check robots.txt
    if not is_allowed(url):
        print(f"Access to {url} is disallowed by robots.txt")
        return None
    
    try:
        print(f"Fetching: {url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }
        
        # Disable SSL verification for the session
        session.verify = False
        
        # Disable SSL warnings
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Set a longer timeout
        response = session.get(url, headers=headers, timeout=30, verify=False)
        response.raise_for_status()
        
        # Check if the response contains an error page
        if "error" in response.text.lower() or "not found" in response.text.lower():
            print(f"Warning: Page may be an error page: {url}")
            return None
            
        # Cache the response
        save_to_cache(cache_key, {
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'content': response.text
        })
        
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

def extract_internships(html: str) -> List[Dict[str, Any]]:
    """
    Extract internship data from HTML with enhanced parsing and standardization
    """
    soup = BeautifulSoup(html, 'html.parser')
    internships = []
    
    # Find all internship listings - adjust selectors based on actual HTML structure
    listings = soup.select('.internship-card, .job-listing, .internship-item, .job-card')
    
    if not listings:
        print("Warning: No internship listings found with standard selectors. Trying alternative selectors...")
        listings = soup.find_all(['div', 'article'], class_=lambda x: x and ('intern' in str(x).lower() or 'job' in str(x).lower()))
    
    if not listings:
        print("Warning: No listings found with any selector. Using fallback method.")
        # Try to find any card-like elements that might contain job listings
        listings = soup.select('.card, .panel, .box')
    
    print(f"Found {len(listings)} potential listings to process")
    
    for listing in listings:
        try:
            # Skip if the listing doesn't look like a job/internship
            listing_text = listing.get_text(' ', strip=True).lower()
            if not any(term in listing_text for term in ['intern', 'job', 'position', 'opening', 'vacancy', 'hire', 'apply']):
                continue
                
            # Extract basic information with error handling
            title = 'Internship Position'
            company = 'Company Not Specified'
            location = 'Remote'
            
            # Try to find title
            title_elems = listing.find_all(['h2', 'h3', 'h4', 'h5', 'a', 'div', 'span'], 
                                         class_=lambda x: x and any(term in str(x).lower() for term in ['title', 'role', 'position']))
            
            for elem in title_elems:
                text = elem.get_text(strip=True)
                if text and len(text) > 5 and len(text) < 100:  # Reasonable length for a title
                    title = text
                    break
            
            # Try to find company
            company_elems = listing.find_all(['div', 'span', 'p', 'h5'], 
                                           class_=lambda x: x and any(term in str(x).lower() for term in ['company', 'org', 'employer']))
            
            for elem in company_elems:
                text = elem.get_text(strip=True)
                if text and text.lower() not in ['company', 'organization']:
                    company = text
                    break
            
            # Try to find location
            location_elems = listing.find_all(['div', 'span', 'p'], 
                                           class_=lambda x: x and any(term in str(x).lower() for term in ['location', 'place', 'city', 'remote']))
            
            for elem in location_elems:
                text = elem.get_text(strip=True)
                if text and len(text) < 50:  # Location shouldn't be too long
                    location = text
                    break
            
            # Extract details with flexible parsing
            details = {}
            detail_items = listing.find_all(['div', 'li', 'p'], class_=lambda x: x and ('detail' in str(x).lower() or 'info' in str(x).lower()))
            
            for item in detail_items:
                text = item.get_text(strip=True).lower()
                if ':' in text:
                    label, value = text.split(':', 1)
                    details[label.strip()] = value.strip()
                elif 'stipend' in text:
                    details['stipend'] = text.replace('stipend', '').strip()
                elif 'duration' in text:
                    details['duration'] = text.replace('duration', '').strip()
            
            # Extract description
            desc_elem = listing.find(['div', 'section'], class_=lambda x: x and ('description' in str(x).lower() or 'desc' in str(x).lower()))
            description = desc_elem.get_text('\n', strip=True) if desc_elem else ''
            
            # Extract skills (try multiple approaches)
            skills = []
            
            # 1. From skills section
            skills_section = listing.find(['div', 'ul'], class_=lambda x: x and ('skill' in str(x).lower() or 'tech' in str(x).lower()))
            if skills_section:
                skills.extend([standardize_skill(skill.get_text(strip=True)) 
                            for skill in skills_section.find_all(['span', 'li', 'div'], recursive=False) 
                            if skill.get_text(strip=True)])
            
            # 2. From description if no skills found
            if not skills and description:
                skills = extract_skills_from_text(description)
            
            # 3. From title as fallback
            if not skills and title:
                skills = extract_skills_from_text(title)
            
            # Create standardized internship dictionary
            internship = {
                'id': f"int_{abs(hash(f'{title}{company}{location}'))}",
                'title': title.strip(),
                'company': company.strip(),
                'location': location,
                'type': details.get('type', details.get('job type', 'Full-time')),
                'duration': details.get('duration', 'Not specified'),
                'stipend': details.get('stipend', 'Not specified'),
                'posted_date': datetime.now().strftime('%Y-%m-%d'),
                'apply_by': details.get('apply by', details.get('last date', 'Not specified')),
                'skills': list(set(skills)),  # Remove duplicates
                'description': description,
                'requirements': details.get('requirements', ''),
                'responsibilities': details.get('responsibilities', ''),
                'sector': details.get('sector', 'Information Technology'),
                'experience_required': details.get('experience', 'Fresher'),
                'job_type': details.get('job type', 'Internship'),
                'source': 'PM Internship Portal',
                'application_link': listing.find('a', href=True)['href'] if listing.find('a', href=True) else '',
                'scraped_at': datetime.now().isoformat(),
                'metadata': {
                    'premium': False,
                    'verified': False,
                    'featured': 'featured' in str(listing).lower()
                }
            }
            
            # Clean empty values
            internship = {k: v for k, v in internship.items() if v not in [None, '', []]}
            
            internships.append(internship)
            
        except Exception as e:
            print(f"Error processing listing: {e}")
            import traceback
            print(traceback.format_exc())
            continue
            
    return internships

def scrape_internships() -> List[Dict[str, Any]]:
    """Main function to scrape internships from the PM Internship Scheme website"""
    session = RateLimitedSession(delay=1)
    
    # List of potential paths where internships might be listed
    potential_paths = [
        '/internships',
        '/opportunities',
        '/jobs',
        '/careers',
        '/current-openings',
        '/vacancies',
        '/',  # Sometimes the homepage lists internships
        '/internship-opportunities',
        '/current-opportunities',
        '/internship-program',
        '/student-opportunities',
        '/career-opportunities'
    ]
    
    # Try each potential path until we find internships or exhaust all options
    for path in potential_paths:
        url = f"{BASE_URL.rstrip('/')}{path}"
        print(f"\nTrying URL: {url}")
        
        # Check cache first
        cache_key = f"internships_{hash(url) & 0xFFFFFFFF}"
        cached_data = get_cached_data(cache_key)
        
        if cached_data and 'internships' in cached_data:
            print(f"Found {len(cached_data['internships'])} internships in cache for {path}")
            return cached_data['internships']  # Skip to next path if we found cached data
        
        # Fetch the page
        html = fetch_page(url, session)
        if not html:
            print(f"Failed to fetch page: {url}")
            continue
        
        # Extract internships
        internships = extract_internships(html)
        
        if not internships:
            print(f"No internships found at {url}")
            continue
            
        print(f"Found {len(internships)} internships at {path}")
        
        # Save to cache
        save_to_cache(cache_key, {
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'internships': internships
        })
        
        return internships
        
    # If we still don't have any internships, use sample data
    print("\nNo internships found on any path. Using sample data.")
    return get_sample_internships()

def get_sample_internships() -> List[Dict[str, Any]]:
    """Return sample internship data for testing"""
    current_date = datetime.now()
    return [
        {
            'id': 'sample_1',
            'title': 'Software Development Intern',
            'company': 'Tech Innovators Inc',
            'location': 'Bangalore, India',
            'type': 'Full-time',
            'duration': '6 months',
            'stipend': '₹25,000 - ₹35,000 per month',
            'skills': ['Python', 'JavaScript', 'React', 'Node.js'],
            'description': 'Work on cutting-edge web applications using modern technologies.',
            'posted_date': current_date.strftime('%Y-%m-%d'),
            'apply_by': (current_date + timedelta(days=30)).strftime('%Y-%m-%d'),
            'sector': 'Information Technology',
            'experience_required': 'Fresher',
            'job_type': 'Internship',
            'application_link': 'https://example.com/apply/sample1',
            'metadata': {
                'source': 'sample_data',
                'scraped_at': current_date.isoformat(),
                'quality_score': 0.95,
                'premium': False,
                'verified': True,
                'featured': True
            }
        },
        {
            'id': 'sample_2',
            'title': 'Data Science Intern',
            'company': 'Data Insights Ltd',
            'location': 'Remote',
            'type': 'Full-time',
            'duration': '3 months',
            'stipend': '₹20,000 - ₹30,000 per month',
            'skills': ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'Data Analysis'],
            'description': 'Work with our data science team to analyze large datasets and build ML models.',
            'posted_date': current_date.strftime('%Y-%m-%d'),
            'apply_by': (current_date + timedelta(days=45)).strftime('%Y-%m-%d'),
            'sector': 'Data Science',
            'experience_required': '0-1 years',
            'job_type': 'Internship',
            'application_link': 'https://example.com/apply/sample2',
            'metadata': {
                'source': 'sample_data',
                'scraped_at': current_date.isoformat(),
                'quality_score': 0.90,
                'premium': False,
                'verified': True,
                'featured': False
            }
        },
        {
            'id': 'sample_3',
            'title': 'Frontend Development Intern',
            'company': 'WebCraft Solutions',
            'location': 'Hybrid (Delhi NCR)',
            'type': 'Part-time',
            'duration': '4 months',
            'stipend': '₹15,000 - ₹25,000 per month',
            'skills': ['HTML', 'CSS', 'JavaScript', 'React', 'UI/UX'],
            'description': 'Assist in developing responsive web interfaces and improve user experience.',
            'posted_date': current_date.strftime('%Y-%m-%d'),
            'apply_by': (current_date + timedelta(days=20)).strftime('%Y-%m-%d'),
            'sector': 'Web Development',
            'experience_required': 'Fresher',
            'job_type': 'Internship',
            'application_link': 'https://example.com/apply/sample3',
            'metadata': {
                'source': 'sample_data',
                'scraped_at': current_date.isoformat(),
                'quality_score': 0.85,
                'premium': True,
                'verified': True,
                'featured': True
            }
        }
    ]

def format_for_recommendation(internship: Dict) -> Dict:
    """
    Format internship data for the recommendation system with enhanced fields
    """
    # Calculate a quality score based on available information
    quality_score = 0.5  # Base score
    
    # Increase score for complete information
    if internship.get('description'):
        quality_score += 0.2
    if internship.get('skills'):
        quality_score += 0.1
    if internship.get('stipend') and 'not specified' not in internship['stipend'].lower():
        quality_score += 0.1
    if internship.get('apply_by') and 'not specified' not in internship['apply_by'].lower():
        quality_score += 0.1
    
    # Cap the score at 1.0
    quality_score = min(1.0, quality_score)
    
    # Format the internship data
    formatted = {
        'id': internship.get('id', ''),
        'title': internship.get('title', '').strip(),
        'company': {
            'name': internship.get('company', '').strip(),
            'sector': internship.get('sector', 'Information Technology'),
            'size': internship.get('company_size', 'Not specified')
        },
        'location': {
            'city': internship.get('location', 'Remote'),
            'type': 'remote' if 'remote' in internship.get('location', '').lower() else 
                   'hybrid' if 'hybrid' in internship.get('location', '').lower() else 'onsite',
            'relocation_assistance': False
        },
        'job_details': {
            'type': internship.get('job_type', 'Internship'),
            'duration': internship.get('duration', 'Not specified'),
            'stipend': internship.get('stipend', 'Not specified'),
            'start_date': 'Immediate',
            'posted_date': internship.get('posted_date', datetime.now().strftime('%Y-%m-%d')),
            'deadline': internship.get('apply_by', 'Not specified'),
            'openings': 1,
            'experience_required': internship.get('experience_required', 'Fresher')
        },
        'requirements': {
            'skills': [{'name': skill, 'required': True} for skill in internship.get('skills', [])],
            'education': ['Any Graduate', 'Any Post Graduate'],  # Default, can be overridden
            'experience': internship.get('experience_required', '0 years'),
            'languages': ['English']
        },
        'description': {
            'summary': internship.get('description', '')[:200] + '...' if internship.get('description') else '',
            'responsibilities': internship.get('responsibilities', '').split('\n') if 'responsibilities' in internship else [],
            'perks': ['Certificate', 'Letter of Recommendation', 'Flexible work hours'],
            'skills_you_will_learn': [s for s in internship.get('skills', []) if s not in ['Python', 'JavaScript']][:5]
        },
        'application': {
            'process': 'Apply through the provided link',
            'documents_required': ['Resume', 'Cover Letter'],
            'deadline': internship.get('apply_by', 'Not specified'),
            'link': internship.get('application_link', '')
        },
        'metadata': {
            'source': 'PM Internship Portal',
            'scraped_at': datetime.now().isoformat(),
            'quality_score': round(quality_score, 2),
            'premium': False,
            'verified': False,
            'featured': internship.get('metadata', {}).get('featured', False),
            'views': 0,
            'applications': 0
        },
        # For backward compatibility with existing code
        'skills': internship.get('skills', []),
        'sector': internship.get('sector', 'Information Technology'),
        'type': internship.get('job_type', 'Internship'),
        'stipend': internship.get('stipend', 'Not specified'),
        'posted_date': internship.get('posted_date', datetime.now().strftime('%Y-%m-%d')),
        'apply_by': internship.get('apply_by', 'Not specified')
    }
    
    # Clean empty values
    return {k: v for k, v in formatted.items() if v not in [None, '', []]}

def save_internships(internships: List[Dict[str, Any]], filename: str = 'internships.json') -> str:
    """
    Save internships to a JSON file with proper formatting and backup
    
    Args:
        internships: List of internship dictionaries to save
        filename: Output filename (will be saved in OUTPUT_DIR)
        
    Returns:
        str: Path to the saved file, or empty string on failure
    """
    try:
        # Ensure output directory exists
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        output_file = OUTPUT_DIR / filename
        
        # Create a backup if the file already exists
        if output_file.exists():
            backup_file = OUTPUT_DIR / f"{output_file.stem}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{output_file.suffix}"
            import shutil
            shutil.copy2(output_file, backup_file)
            print(f"Created backup at: {backup_file}")
        
        # Save with pretty printing and handle datetime serialization
        def json_serial(obj):
            """JSON serializer for objects not serializable by default json code"""
            if isinstance(obj, (datetime, datetime.date)):
                return obj.isoformat()
            raise TypeError(f"Type {type(obj)} not serializable")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(
                internships, 
                f, 
                ensure_ascii=False, 
                indent=2, 
                default=json_serial,
                sort_keys=True
            )
        
        print(f"\n✅ Successfully saved {len(internships)} internships to {output_file}")
        return str(output_file.absolute())
        
    except Exception as e:
        print(f"❌ Error saving internships: {e}")
        import traceback
        traceback.print_exc()
        return ""

def validate_internships(internships: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Validate and clean internship data
    
    Args:
        internships: List of internship dictionaries to validate
        
    Returns:
        Tuple containing (valid_internships, invalid_internships)
    """
    valid = []
    invalid = []
    
    required_fields = ['id', 'title', 'company', 'location']
    
    for intern in internships:
        try:
            # Create a clean copy to avoid modifying the original
            cleaned = {k: v for k, v in intern.items() if v is not None}
            
            # Check required fields
            missing_fields = [field for field in required_fields if not cleaned.get(field)]
            if missing_fields:
                invalid.append({
                    'internship': cleaned.get('id', 'unknown'),
                    'reason': f'Missing required fields: {missing_fields}',
                    'data': cleaned
                })
                continue
            
            # Clean and validate data
            cleaned['id'] = str(cleaned['id']).strip()
            cleaned['title'] = str(cleaned.get('title', 'Untitled Internship')).strip()
            
            # Handle company field (can be string or dict)
            if isinstance(cleaned.get('company'), str):
                cleaned['company'] = {'name': cleaned['company'].strip()}
            elif isinstance(cleaned.get('company'), dict):
                # Ensure company has at least a name
                if 'name' not in cleaned['company'] or not cleaned['company']['name']:
                    cleaned['company']['name'] = 'Company Not Specified'
            else:
                cleaned['company'] = {'name': 'Company Not Specified'}
            
            # Standardize location
            location = cleaned.get('location')
            if location:
                if isinstance(location, dict):
                    # If location is already a dict, ensure it has required fields
                    cleaned['location'] = {
                        'city': standardize_location(location.get('city', '')),
                        'type': location.get('type', 'onsite')
                    }
                else:
                    # If location is a string, convert to dict
                    location_str = str(location).lower()
                    location_type = 'remote' if 'remote' in location_str else 'hybrid' if 'hybrid' in location_str else 'onsite'
                    cleaned['location'] = {
                        'city': standardize_location(location_str),
                        'type': location_type
                    }
            else:
                cleaned['location'] = {'city': 'Remote', 'type': 'remote'}
            
            # Ensure skills is a list of strings
            if 'skills' not in cleaned or not isinstance(cleaned['skills'], list):
                cleaned['skills'] = []
            else:
                cleaned['skills'] = list(set([
                    standardize_skill(str(skill).strip())
                    for skill in cleaned['skills']
                    if str(skill).strip()
                ]))
            
            # Set default values for optional fields
            cleaned.setdefault('description', 'No description provided.')
            cleaned.setdefault('stipend', 'Not specified')
            cleaned.setdefault('duration', 'Not specified')
            cleaned.setdefault('job_type', 'Internship')
            cleaned.setdefault('sector', 'Information Technology')
            cleaned.setdefault('experience_required', 'Fresher')
            
            # Handle dates
            current_date = datetime.now()
            if 'posted_date' not in cleaned:
                cleaned['posted_date'] = current_date.strftime('%Y-%m-%d')
                
            if 'apply_by' not in cleaned:
                # Default to 30 days from now if no apply_by date
                cleaned['apply_by'] = (current_date + timedelta(days=30)).strftime('%Y-%m-%d')
            
            # Ensure metadata exists
            if 'metadata' not in cleaned or not isinstance(cleaned['metadata'], dict):
                cleaned['metadata'] = {}
                
            # Set default metadata values
            cleaned['metadata'].setdefault('source', 'sample_data')
            cleaned['metadata'].setdefault('scraped_at', current_date.isoformat())
            cleaned['metadata'].setdefault('quality_score', 0.8)
            cleaned['metadata'].setdefault('premium', False)
            cleaned['metadata'].setdefault('verified', False)
            cleaned['metadata'].setdefault('featured', False)
            
            # Ensure application link exists
            if 'application_link' not in cleaned or not cleaned['application_link']:
                cleaned['application_link'] = '#'
            
            valid.append(cleaned)
            
        except Exception as e:
            import traceback
            error_info = {
                'internship': str(intern.get('id', 'unknown')),
                'error': str(e),
                'traceback': traceback.format_exc(),
                'data': intern
            }
            print(f"\n⚠️  Error validating internship: {error_info}")
            invalid.append(error_info)
    
    return valid, invalid

def main():
    """
    Main function to run the PM Internship Scraper
    
    Returns:
        int: 0 on success, 1 on failure
    """
    print("=" * 60)
    print("PM Internship Scheme Scraper - Enhanced")
    print("=" * 60)
    
    start_time = datetime.now()
    
    # Check robots.txt
    if not is_allowed(BASE_URL):
        print("WARNING: Scraping is not allowed by robots.txt. Exiting...")
        return 1
    
    # Create a rate-limited session
    session = RateLimitedSession(delay=1)
    
    try:
        # Scrape internships
        print("\nScraping internships...")
        raw_internships = scrape_internships()
        
        if not raw_internships:
            print("No internships found. Exiting...")
            return 1
        
        print(f"\nFound {len(raw_internships)} internships. Processing...")
        
        # Format for recommendation system
        formatted_internships = []
        for intern in raw_internships:
            try:
                formatted = format_for_recommendation(intern)
                formatted_internships.append(formatted)
            except Exception as e:
                print(f"WARNING: Error formatting internship: {e}")
                continue
        
        # Validate and clean the data
        valid_internships, invalid_internships = validate_internships(formatted_internships)
        
        # Save invalid internships for debugging
        if invalid_internships:
            print(f"\nWARNING: Found {len(invalid_internships)} invalid internships. See invalid_internships.json for details.")
            save_internships(invalid_internships, 'invalid_internships.json')
        
        if not valid_internships:
            print("❌ No valid internships to save. Exiting...")
            return 1
        
        # Save the valid internships
        output_file = save_internships(valid_internships)
        
        # Generate a simple report
        duration = datetime.now() - start_time
        print("\n" + "=" * 60)
        print("📋 Scraping Report")
        print("=" * 60)
        print(f"Total found: {len(raw_internships)}")
        print(f"Valid: {len(valid_internships)}")
        print(f"Invalid: {len(invalid_internships)}")
        print(f"Time taken: {duration.total_seconds():.2f} seconds")
        print(f"Output file: {output_file}")
        
        # Show a sample of the first valid internship
        if valid_internships:
            print("\nSample valid internship:")
            sample = valid_internships[0].copy()
            # Truncate long fields for display
            for field in ['description', 'requirements']:
                if field in sample and len(str(sample[field])) > 100:
                    sample[field] = str(sample[field])[:100] + '...'
            print(json.dumps(sample, indent=2, ensure_ascii=False))
        
        return 0
        
    except KeyboardInterrupt:
        print("\n⚠️  Process interrupted by user")
        return 1
        
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        import traceback
        traceback.print_exc()
        return 1
        print("1. Review the scraped data in the 'data' directory")
        print("2. Run 'python update_recommendations.py' to update the frontend")
        print("3. Check the output for any warnings or errors that need attention")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        print("\nAn error occurred during scraping. Please check the following:")
        print("1. Internet connection")
        print("2. Website availability (try opening in a browser)")
        print("3. Error message above for specific details")
        print("\nIf the issue persists, you may need to update the selectors in the script.")
        return 1
    
    return 0

if __name__ == "__main__":
    main()
