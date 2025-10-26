"""
Automated Pipeline for Internship Data Processing

This script handles the complete pipeline from scraping to recommendation generation
with proper error handling, logging, and notifications.
"""

import sys
import os
import json
import logging
import smtplib
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
CONFIG = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'email_sender': 'your-email@gmail.com',
    'email_password': 'your-app-password',  # Use App Password for Gmail
    'email_recipient': 'admin@example.com',
    'data_dir': Path(__file__).parent / '..' / 'data',
    'frontend_data_dir': Path(__file__).parent / '..' / 'src' / 'data'
}

class PipelineError(Exception):
    """Custom exception for pipeline errors"""
    pass

class EmailNotifier:
    """Handles email notifications for the pipeline"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        
    def send_notification(self, subject: str, message: str, is_error: bool = False) -> bool:
        """Send an email notification"""
        if not all([self.config.get('email_sender'), self.config.get('email_password'), self.config.get('email_recipient')]):
            logger.warning("Email configuration is incomplete. Notifications will not be sent.")
            return False
            
        try:
            msg = MIMEMultipart()
            msg['From'] = self.config['email_sender']
            msg['To'] = self.config['email_recipient']
            msg['Subject'] = f"[{'ERROR' if is_error else 'INFO'}] {subject}"
            
            msg.attach(MIMEText(message, 'plain'))
            
            with smtplib.SMTP(self.config['smtp_server'], self.config['smtp_port']) as server:
                server.starttls()
                server.login(self.config['email_sender'], self.config['email_password'])
                server.send_message(msg)
                
            logger.info("Notification email sent successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send notification email: {e}")
            return False

class Pipeline:
    """Main pipeline class that orchestrates the data processing"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.notifier = EmailNotifier(config)
        
        # Ensure directories exist
        self.config['data_dir'].mkdir(parents=True, exist_ok=True)
        self.config['frontend_data_dir'].mkdir(parents=True, exist_ok=True)
    
    def run_scraper(self) -> bool:
        """Run the scraper and handle any errors"""
        try:
            from scraper import main as run_scraper
            logger.info("Starting scraper...")
            result = run_scraper()
            if result != 0:
                raise PipelineError(f"Scraper failed with exit code {result}")
            logger.info("Scraper completed successfully")
            return True
            
        except Exception as e:
            error_msg = f"Scraper failed: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
            logger.error(error_msg)
            self.notifier.send_notification(
                "Scraper Failed",
                f"The scraper encountered an error:\n\n{error_msg}",
                is_error=True
            )
            return False
    
    def run_recommendations(self) -> bool:
        """Run the recommendation system and handle any errors"""
        try:
            from update_recommendations import main as run_recommendations
            logger.info("Generating recommendations...")
            result = run_recommendations()
            if result != 0:
                raise PipelineError(f"Recommendation system failed with exit code {result}")
            logger.info("Recommendations generated successfully")
            return True
            
        except Exception as e:
            error_msg = f"Recommendation system failed: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
            logger.error(error_msg)
            self.notifier.send_notification(
                "Recommendation System Failed",
                f"The recommendation system encountered an error:\n\n{error_msg}",
                is_error=True
            )
            return False
    
    def verify_output(self) -> bool:
        """Verify that the output files were generated correctly"""
        try:
            required_files = [
                self.config['data_dir'] / 'internships.json',
                self.config['frontend_data_dir'] / 'internships.json',
                self.config['frontend_data_dir'] / 'recommendations.json'
            ]
            
            for file in required_files:
                if not file.exists():
                    raise PipelineError(f"Required file not found: {file}")
                
                # Verify JSON is valid
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    if isinstance(data, list) and not data:
                        logger.warning(f"File {file} is an empty list")
                        
                except json.JSONDecodeError as e:
                    raise PipelineError(f"Invalid JSON in {file}: {str(e)}")
            
            logger.info("Output verification successful")
            return True
            
        except Exception as e:
            error_msg = f"Output verification failed: {str(e)}"
            logger.error(error_msg)
            self.notifier.send_notification(
                "Output Verification Failed",
                f"Output verification failed:\n\n{error_msg}",
                is_error=True
            )
            return False
    
    def run(self) -> bool:
        """Run the complete pipeline"""
        start_time = datetime.now()
        logger.info("Starting pipeline...")
        
        try:
            # Run scraper
            if not self.run_scraper():
                return False
            
            # Generate recommendations
            if not self.run_recommendations():
                return False
            
            # Verify output
            if not self.verify_output():
                return False
            
            # Calculate and log duration
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"Pipeline completed successfully in {duration:.2f} seconds")
            
            # Send success notification
            self.notifier.send_notification(
                "Pipeline Completed Successfully",
                f"The pipeline completed successfully in {duration:.2f} seconds.\n\n"
                f"Output files updated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            
            return True
            
        except Exception as e:
            error_msg = f"Pipeline failed: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
            logger.error(error_msg)
            self.notifier.send_notification(
                "Pipeline Failed",
                f"The pipeline encountered an error:\n\n{error_msg}",
                is_error=True
            )
            return False

def setup_scheduled_task():
    """Helper function to set up a scheduled task on Windows"""
    script_path = Path(__file__).resolve()
    python_path = sys.executable
    
    # Create a batch file to run the pipeline
    batch_content = f"""
    @echo off
    "{python_path}" "{script_path}" %*
    """
    
    batch_path = script_path.with_suffix('.bat')
    with open(batch_path, 'w') as f:
        f.write(batch_content)
    
    # Command to create a scheduled task (run daily at 2 AM)
    task_name = "InternshipPipeline"
    command = (
        f'schtasks /create /tn "{task_name}" '
        f'/tr "{batch_path}" '
        '/sc DAILY /st 02:00 /ru SYSTEM /rl HIGHEST'
    )
    
    logger.info(f"To set up the scheduled task, run this command as administrator:\n{command}")
    return command

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run the internship data processing pipeline')
    parser.add_argument('--setup-task', action='store_true', help='Set up a scheduled task')
    args = parser.parse_args()
    
    if args.setup_task:
        setup_scheduled_task()
    else:
        pipeline = Pipeline(CONFIG)
        success = pipeline.run()
        sys.exit(0 if success else 1)
