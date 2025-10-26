"""
Test Integration Script

This script tests the integration between the scraper and recommendation system.
It runs the scraper to get fresh data and then generates recommendations.
"""

import sys
import os
from pathlib import Path
import json

# Add the scripts directory to the path
sys.path.append(str(Path(__file__).parent))

def run_scraper():
    """Run the scraper to get fresh internship data"""
    print("=" * 60)
    print("Running Scraper...")
    print("=" * 60)
    
    # Import the scraper module
    from scraper import main as run_scraper
    
    # Run the scraper
    return run_scraper()

def run_recommendations():
    """Run the recommendation system with the scraped data"""
    print("\n" + "=" * 60)
    print("Generating Recommendations...")
    print("=" * 60)
    
    # Import the update_recommendations module
    from update_recommendations import main as run_recommendations
    
    # Run the recommendations
    return run_recommendations()

def verify_data_files():
    """Verify that the data files were created and contain valid data"""
    print("\n" + "=" * 60)
    print("Verifying Data Files...")
    print("=" * 60)
    
    # Check scraped data
    scraped_file = Path("data/internships.json")
    if not scraped_file.exists():
        print(f"Error: Scraped data file not found: {scraped_file}")
        return False
    
    # Check frontend data
    frontend_file = Path("../src/data/internships.json")
    if not frontend_file.exists():
        print(f"Error: Frontend data file not found: {frontend_file}")
        return False
    
    # Check recommendations
    rec_file = Path("../src/data/recommendations.json")
    if not rec_file.exists():
        print(f"Error: Recommendations file not found: {rec_file}")
        return False
    
    # Load and validate the data
    try:
        with open(scraped_file, 'r', encoding='utf-8') as f:
            scraped_data = json.load(f)
            print(f"Scraped data contains {len(scraped_data)} internships")
            
        with open(frontend_file, 'r', encoding='utf-8') as f:
            frontend_data = json.load(f)
            print(f"Frontend data contains {len(frontend_data)} internships")
            
        with open(rec_file, 'r', encoding='utf-8') as f:
            rec_data = json.load(f)
            print(f"Generated {len(rec_data)} recommendations")
            
        return True
        
    except Exception as e:
        print(f"Error verifying data files: {e}")
        return False

def main():
    """Main function to run the integration test"""
    print("=" * 60)
    print("Integration Test: Scraper + Recommendation System")
    print("=" * 60)
    
    # Run the scraper
    if run_scraper() != 0:
        print("\nError: Scraper failed. See above for details.")
        return 1
    
    # Run the recommendations
    if run_recommendations() != 0:
        print("\nError: Recommendation system failed. See above for details.")
        return 1
    
    # Verify the data files
    if not verify_data_files():
        print("\nError: Data verification failed. See above for details.")
        return 1
    
    print("\n" + "=" * 60)
    print("Integration Test Completed Successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Check the generated files in the 'data' and '../src/data' directories")
    print("2. Review the recommendations in '../src/data/recommendations.json'")
    print("3. Start the frontend to see the updated data")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
