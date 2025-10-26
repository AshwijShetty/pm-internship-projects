"""
Enhanced Recommendation System for Internships

This script provides sophisticated internship recommendations using:
1. Content-based filtering
2. TF-IDF vectorization for text similarity
3. Skill matching with weighting
4. Location-based filtering
5. Sector/domain matching
"""

import json
import os
import sys
from datetime import datetime, timedelta
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from collections import defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import spacy

# Load English language model for NLP
nlp = spacy.load('en_core_web_sm')

# Paths
SCRAPED_DATA_PATH = Path("./data/internships.json")
FRONTEND_DATA_PATH = Path("../src/data/internships.json")
RECOMMENDATIONS_PATH = Path("../src/data/recommendations.json")

# Configuration
CONFIG = {
    'weights': {
        'skills': 0.40,       # Increased weight for skills matching
        'location': 0.30,     # Increased weight for location preferences
        'sector': 0.15,       # Slightly reduced weight for sector
        'title': 0.10,        # Reduced weight for title
        'description': 0.05   # Small weight for description
    },
    'location_boost': {
        'exact_match': 1.0,   # Full score for exact city match
        'state_match': 0.7,   # 70% for state match
        'remote': 0.9,        # High score for remote (preferred by many students)
        'hybrid': 0.6,        # Medium score for hybrid
        'onsite': 0.3         # Lower score for onsite only
    },
    'min_similarity': 0.15,   # Increased minimum similarity threshold
    'max_recommendations': 20,  # Maximum number of recommendations to return
    'experience_penalty': 0.7,  # Penalty for experience level mismatch
    'duration_penalty': 0.9,    # Penalty for duration mismatch
    'stipend_threshold': 0.5,   # Minimum stipend threshold (as ratio of preferred)
    'preferred_skills_boost': 1.2,  # Boost for preferred skills
    'required_skills_penalty': 0.5  # Penalty for missing required skills
}

# Sample user profile for recommendations - based on Indian student profile
SAMPLE_PROFILE = {
    "id": "STU2023001",
    "name": "Priya Sharma",
    "email": "priya.sharma@example.com",
    "phone": "+91 9876543210",
    "education": [
        {
            "degree": "B.Tech in Computer Science",
            "institution": "Indian Institute of Technology, Delhi",
            "year": 2024,
            "cgpa": 8.7
        }
    ],
    "location": {
        "city": "Bangalore",
        "state": "Karnataka",
        "country": "India",
        "willingToRelocate": True,
        "preferredLocations": ["Bangalore", "Remote", "Hybrid", "Pune", "Hyderabad"]
    },
    "skills": {
        "programming": ["Python", "JavaScript", "Java", "C++"],
        "web": ["React", "Node.js", "Express", "Django", "Flask"],
        "databases": ["MySQL", "MongoDB"],
        "cloud": ["AWS", "Firebase"],
        "tools": ["Git", "Docker", "Postman"],
        "softSkills": ["Communication", "Teamwork", "Problem Solving", "Leadership"]
    },
    "interests": {
        "sectors": ["Information Technology", "FinTech", "E-commerce", "EdTech"],
        "technologies": ["AI/ML", "Cloud Computing", "Blockchain", "Cybersecurity"],
        "roles": ["Full Stack Development", "Backend Development", "Cloud Engineering"]
    },
    "experience": [
        {
            "role": "Web Development Intern",
            "company": "Tech Solutions India",
            "duration": "3 months",
            "description": "Developed and maintained web applications using React and Node.js"
        }
    ],
    "projects": [
        {
            "title": "E-commerce Website",
            "description": "Built a full-stack e-commerce platform with MERN stack",
            "technologies": ["MongoDB", "Express", "React", "Node.js", "Redux"]
        }
    ],
    "certifications": [
        "Full Stack Web Development - Udemy",
        "AWS Certified Cloud Practitioner"
    ],
    "preferences": {
        "jobType": ["Internship", "Full-time"],
        "workMode": ["Remote", "Hybrid", "On-site"],
        "duration": "3-6 months",
        "startDate": "2023-06-01",
        "minStipend": 20000,
        "preferredStipend": 30000,
        "noticePeriod": "Immediate",
        "willingToWorkOnWeekends": True,
        "shiftTimings": "Flexible"
    },
    "languages": [
        {"name": "English", "proficiency": "Fluent"},
        {"name": "Hindi", "proficiency": "Native"},
        {"name": "Kannada", "proficiency": "Conversational"}
    ],
    "social": {
        "linkedin": "linkedin.com/in/priyasharma",
        "github": "github.com/priyasharma",
        "portfolio": "priyasharma.dev"
    },
    "additionalInfo": {
        "githubContributions": 150,
        "hackathonsAttended": 3,
        "openSourceContributions": True,
        "blog": "medium.com/@priyasharma"
    },
    "system": {
        "lastUpdated": "2023-05-15T10:30:00Z",
        "profileCompletion": 85,
        "accountStatus": "active"
    }
}

def preprocess_text(text: str) -> str:
    """Preprocess text for NLP tasks"""
    if not text:
        return ""
    
    # Convert to string if not already
    text = str(text)
    
    # Basic cleaning
    text = ' '.join(text.split())  # Remove extra whitespace
    
    # Process with spaCy for lemmatization and stopword removal
    doc = nlp(text.lower())
    tokens = [
        token.lemma_ 
        for token in doc 
        if not token.is_stop and not token.is_punct and not token.is_space
    ]
    
    return ' '.join(tokens)

def extract_skills(text: str) -> List[str]:
    """Extract skills from text using NLP"""
    if not text:
        return []
    
    # This is a simplified version - in production, you might want to use a more sophisticated approach
    # like a pre-trained NER model or a skills database
    doc = nlp(text.lower())
    
    # Look for noun phrases that might represent skills
    skills = []
    for chunk in doc.noun_chunks:
        # Simple heuristic: if the chunk is 1-3 words and not a stop word
        if 1 <= len(chunk) <= 3 and not any(t.is_stop for t in chunk):
            skills.append(chunk.text)
    
    return list(set(skills))

def calculate_skill_similarity(user_skills: List[str], job_skills: List[str]) -> float:
    """Calculate similarity between user skills and job skills"""
    if not user_skills or not job_skills:
        return 0.0
    
    # Convert to sets for easier comparison
    user_skills = set(skill.lower() for skill in user_skills)
    job_skills = set(skill.lower() for skill in job_skills)
    
    # Jaccard similarity
    intersection = len(user_skills.intersection(job_skills))
    union = len(user_skills.union(job_skills))
    
    return intersection / union if union > 0 else 0.0

def calculate_location_score(user_locations: List[str], job_location: str) -> float:
    """Calculate location match score"""
    if not job_location:
        return 0.0
    
    job_location = job_location.lower()
    
    # Check for remote/hybrid first
    if 'remote' in job_location.lower():
        return CONFIG['location_boost']['remote']
    if 'hybrid' in job_location.lower():
        return CONFIG['location_boost']['hybrid']
    
    # Check for exact city/state matches
    for loc in user_locations:
        loc = loc.lower()
        if loc in job_location:
            if loc == job_location:
                return CONFIG['location_boost']['exact_match']
            else:
                # Check if it's a state match
                # This is a simplified check - in production, you'd want a more robust solution
                return CONFIG['location_boost']['state_match']
    
    return 0.0

def calculate_sector_similarity(user_sector: str, job_sectors: List[str]) -> float:
    """Calculate sector/domain similarity"""
    if not user_sector or not job_sectors:
        return 0.0
    
    user_sector = user_sector.lower()
    job_sectors = [s.lower() for s in job_sectors]
    
    # Simple exact match for now - could be enhanced with word embeddings
    return 1.0 if user_sector in job_sectors else 0.0

def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculate text similarity using TF-IDF and cosine similarity"""
    if not text1 or not text2:
        return 0.0
    
    # Preprocess texts
    text1 = preprocess_text(text1)
    text2 = preprocess_text(text2)
    
    if not text1 or not text2:
        return 0.0
    
    # Create TF-IDF vectors
    vectorizer = TfidfVectorizer()
    try:
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return max(0.0, min(1.0, similarity))  # Ensure value is between 0 and 1
    except Exception:
        return 0.0

def load_scraped_data(data_file: Path) -> List[Dict[str, Any]]:
    """Load and preprocess scraped internship data"""
    try:
        if not data_file.exists():
            print(f"Error: Data file not found: {data_file}")
            print("Please run scraper.py first to generate the data file.")
            return []
        
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not isinstance(data, list):
                print("Error: Invalid data format. Expected a list of internships.")
                return []
            
            # Preprocess the data
            for item in data:
                # Ensure all required fields exist
                item.setdefault('skills', [])
                item.setdefault('description', '')
                item.setdefault('sector', [])
                item.setdefault('location', '')
                
                # Extract skills from description if not already present
                if not item['skills'] and item['description']:
                    item['skills'] = extract_skills(item['description'])
            
            return data
            
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON data: {e}")
        return []
    except Exception as e:
        print(f"Error loading data: {e}")
        return []

def score_internship(profile: Dict[str, Any], internship: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, float]]:
    """
    Score a single internship based on the user profile
    Returns a tuple of (internship, scores) where scores is a dict of component scores
    """
    scores = {}
    
    # 1. Skill matching (35% weight)
    user_skills = profile.get('keySkills', []) + profile.get('extraSkills', [])
    job_skills = internship.get('skills', [])
    skill_score = calculate_skill_similarity(user_skills, job_skills)
    scores['skill_score'] = skill_score
    
    # 2. Location matching (25% weight)
    user_locations = [profile.get('city', ''), profile.get('state', '')]
    if 'preferredLocations' in profile:
        user_locations.extend(profile['preferredLocations'])
    
    location_score = calculate_location_score(
        user_locations,
        internship.get('location', '')
    )
    scores['location_score'] = location_score
    
    # 3. Sector matching (20% weight)
    sector_score = calculate_sector_similarity(
        profile.get('sectorInterest', ''),
        internship.get('sector', [])
    )
    scores['sector_score'] = sector_score
    
    # 4. Title matching (15% weight)
    title_score = calculate_text_similarity(
        ' '.join(profile.get('keySkills', []) + [profile.get('aspirations', '')]),
        internship.get('title', '')
    )
    scores['title_score'] = title_score
    
    # 5. Description matching (5% weight)
    desc_score = calculate_text_similarity(
        ' '.join(profile.get('keySkills', []) + [profile.get('aspirations', '')]),
        internship.get('description', '')
    )
    scores['description_score'] = desc_score
    
    # Calculate weighted total score
    weights = CONFIG['weights']
    total_score = (
        skill_score * weights['skills'] +
        location_score * weights['location'] +
        sector_score * weights['sector'] +
        title_score * weights['title'] +
        desc_score * weights['description']
    )
    
    # Apply experience level filter if specified
    if 'experienceLevel' in profile and 'experience' in internship:
        user_exp = profile['experienceLevel'].lower()
        job_exp = internship['experience'].lower()
        
        # Simple experience level matching
        exp_levels = ['beginner', 'intermediate', 'expert']
        try:
            user_exp_idx = exp_levels.index(user_exp)
            job_exp_idx = exp_levels.index(job_exp)
            
            # Penalize if job requires more experience than user has
            if job_exp_idx > user_exp_idx:
                total_score *= 0.7  # Reduce score by 30%
                scores['experience_penalty'] = 0.7
        except ValueError:
            pass
    
    # Apply duration filter if specified
    if 'preferredDuration' in profile and 'duration' in internship:
        pref_duration = profile['preferredDuration'].lower()
        job_duration = str(internship.get('duration', '')).lower()
        
        # Simple duration matching
        if 'flexible' not in job_duration and pref_duration != job_duration:
            total_score *= 0.9  # Small penalty for non-matching duration
            scores['duration_penalty'] = 0.9
    
    scores['total_score'] = total_score
    
    # Add explanation for the score
    internship['_score_explanation'] = {
        'components': scores,
        'weights': weights
    }
    
    return (internship, scores)

def recommend_internships(
    profile: Dict[str, Any], 
    internships: List[Dict[str, Any]], 
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Advanced recommendation function that scores and ranks internships
    based on multiple factors including skills, location, sector, and text similarity.
    """
    if not internships:
        return []
    
    # Score all internships
    scored_internships = []
    
    for intern in internships:
        try:
            scored_intern, scores = score_internship(profile, intern)
            if scores['total_score'] >= CONFIG['min_similarity']:
                scored_internships.append((scored_intern, scores['total_score']))
        except Exception as e:
            print(f"Error scoring internship {intern.get('id', 'unknown')}: {e}")
            continue
    
    # Sort by total score (descending)
    scored_internships.sort(key=lambda x: x[1], reverse=True)
    
    # Get top recommendations
    top_recommendations = [intern for intern, score in scored_internships[:limit]]
    
    # If we don't have enough recommendations above the threshold,
    # fill with the highest scoring ones, even if below threshold
    if len(top_recommendations) < limit and len(internships) > len(top_recommendations):
        remaining = [intern for intern, score in scored_internships[len(top_recommendations):]]
        remaining.sort(key=lambda x: x[1], reverse=True)
        top_recommendations.extend(intern for intern, _ in remaining[:limit - len(top_recommendations)])
    
    return top_recommendations

def save_recommendations(recommendations: List[Dict[str, Any]], explain: bool = False) -> bool:
    """
    Save recommendations to a JSON file
    
    Args:
        recommendations: List of recommended internships
        explain: Whether to include score explanations in the output
    """
    try:
        # Ensure the directory exists
        RECOMMENDATIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        # Prepare data for saving
        data_to_save = []
        
        for rec in recommendations:
            # Create a clean copy without internal scoring data unless explain=True
            clean_rec = {k: v for k, v in rec.items() if not k.startswith('_')}
            
            if explain and '_score_explanation' in rec:
                clean_rec['_explanation'] = rec['_score_explanation']
            
            data_to_save.append(clean_rec)
        
        # Save to file
        with open(RECOMMENDATIONS_PATH, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=2)
            
        print(f"\nSuccessfully saved {len(data_to_save)} recommendations to {RECOMMENDATIONS_PATH}")
        return True
        
    except Exception as e:
        print(f"Error saving recommendations: {e}")
        return False

def update_frontend_data(internships: List[Dict[str, Any]]) -> bool:
    """
    Update the frontend's internship data with enhanced information
    """
    if not internships:
        print("No internships to update. Skipping frontend update.")
        return False
    
    try:
        # Ensure the directory exists
        FRONTEND_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        # Prepare data for frontend
        frontend_data = []
        
        for intern in internships:
            # Create a clean copy without internal fields
            clean_intern = {k: v for k, v in intern.items() if not k.startswith('_')}
            
            # Add any additional frontend-specific fields
            clean_intern['postedDate'] = intern.get('postedDate', datetime.now().strftime('%Y-%m-%d'))
            clean_intern['isNew'] = True  # Could be used for highlighting new listings
            
            frontend_data.append(clean_intern)
        
        # Save to file
        with open(FRONTEND_DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(frontend_data, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully updated frontend data at {FRONTEND_DATA_PATH}")
        return True
        
    except Exception as e:
        print(f"Error updating frontend data: {e}")
        return False

def load_user_profile(profile_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Load a user profile by ID from database or return the default profile
    
    Args:
        profile_id: Unique identifier for the user profile
        
    Returns:
        Dict containing the user's profile information
    """
    if not profile_id:
        return SAMPLE_PROFILE
        
    try:
        # In a production environment, this would connect to your database
        # For example, using SQLAlchemy, Django ORM, or another database client
        
        # Example with SQLite (commented out as it's just for illustration)
        """
        import sqlite3
        from pathlib import Path
        
        db_path = Path(__file__).parent.parent / 'data' / 'users.db'
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Fetch user data
        cursor.execute(
            'SELECT * FROM user_profiles WHERE id = ?', 
            (profile_id,)
        )
        user_data = cursor.fetchone()
        
        if not user_data:
            print(f"No profile found for ID: {profile_id}. Using default profile.")
            return SAMPLE_PROFILE
            
        # Convert database row to dictionary
        columns = [desc[0] for desc in cursor.description]
        profile = dict(zip(columns, user_data))
        
        # Handle JSON fields if needed
        json_fields = ['education', 'skills', 'experience', 'preferences']
        for field in json_fields:
            if field in profile and profile[field]:
                profile[field] = json.loads(profile[field])
                
        return profile
        """
        
        # For now, we'll return the sample profile with the provided ID
        profile = SAMPLE_PROFILE.copy()
        profile['id'] = profile_id
        return profile
        
    except Exception as e:
        print(f"Error loading profile {profile_id}: {e}")
        print("Falling back to default profile")
        return SAMPLE_PROFILE

def main():
    import argparse
    
    # Set up argument parsing
    parser = argparse.ArgumentParser(description='Update internship recommendations')
    parser.add_argument('--profile', type=str, help='User profile ID', default=None)
    parser.add_argument('--limit', type=int, help='Maximum number of recommendations', default=10)
    parser.add_argument('--explain', action='store_true', help='Include score explanations in output')
    args = parser.parse_args()
    
    print("=" * 60)
    print("Enhanced Internship Recommendation System")
    print("=" * 60)
    
    # Load the user profile
    print(f"\nLoading user profile...")
    user_profile = load_user_profile(args.profile)
    print(f"Loaded profile for: {user_profile.get('name', 'Unknown User')}")
    
    # Load scraped data
    print(f"\nLoading scraped data from: {SCRAPED_DATA_PATH.absolute()}")
    internships = load_scraped_data(SCRAPED_DATA_PATH)
    
    if not internships:
        print("\nError: No internships found in the data file.")
        print("Please run 'python scraper.py' first to generate internship data.")
        return 1
    
    print(f"Successfully loaded {len(internships)} internships")
    
    # Update frontend data
    print("\nUpdating frontend data...")
    if not update_frontend_data(internships):
        print("Warning: Failed to update frontend data")
    
    # Generate recommendations
    print("\nGenerating recommendations...")
    try:
        # Generate recommendations using our enhanced recommender
        recommendations = recommend_internships(
            user_profile, 
            internships, 
            limit=args.limit
        )
        
        if not recommendations:
            print("Warning: No recommendations could be generated.")
            # If no recommendations, use a random sample
            recommendations = internships[:args.limit]
        
        # Print summary
        print("\n" + "=" * 60)
        print("Recommendations Generated Successfully!")
        print("=" * 60)
        print(f"Total recommendations: {len(recommendations)}")
        
        # Save recommendations with or without explanations
        if not save_recommendations(recommendations, explain=args.explain):
            print("Warning: Failed to save recommendations")
        
        # Show a sample recommendation with score breakdown
        if recommendations:
            sample = recommendations[0]
            print("\nSample recommendation:")
            print("-" * 60)
            print(f"Title: {sample.get('title', 'N/A')}")
            print(f"Company: {sample.get('company', 'N/A')}")
            print(f"Location: {sample.get('location', 'N/A')}")
            print(f"Skills: {', '.join(sample.get('skills', ['N/A']))}")
            
            if args.explain and '_score_explanation' in sample:
                print("\nScore Breakdown:")
                print("-" * 30)
                for key, value in sample['_score_explanation'].get('components', {}).items():
                    if key != 'total_score':
                        weight = sample['_score_explanation'].get('weights', {}).get(key.split('_')[0], 0)
                        print(f"{key.replace('_', ' ').title()}: {value:.2f} (weight: {weight:.0%})")
                
                print("-" * 30)
                print(f"Total Score: {sample['_score_explanation']['components'].get('total_score', 0):.2f}")
        
        print("\nRecommendations have been updated successfully!")
        return 0
        
    except Exception as e:
        error_msg = f"Error generating recommendations: {e}"
        print(f"\n{error_msg}")
        print("\nPlease check the following:")
        print("1. The format of the internship data")
        print("2. The structure of the user profile")
        print("3. The recommendation logic in recommend_internships()")
        
        # Log the full traceback
        import traceback
        traceback.print_exc()
        
        return 1

if __name__ == "__main__":
    main()
