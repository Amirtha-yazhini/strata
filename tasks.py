import os
import json
import time
import ssl
import redis
from celery import Celery
from dotenv import load_dotenv

# Import the core logic from your previous phases
from extractor import extract_repository_history
from analyzer import analyze_codebase_history

load_dotenv()

# Initialize Celery and connect it to your Redis broker
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("strata_tasks", broker=redis_url, backend=redis_url)

if redis_url.startswith("rediss://"):
    # 1. Append the parameter straight to the URL strings so the backend client initializes safely
    if "ssl_cert_reqs" not in redis_url:
        # If your URL already has a '?' append with '&', otherwise add '?'
        separator = "&" if "?" in redis_url else "?"
        redis_url_with_params = f"{redis_url}{separator}ssl_cert_reqs=CERT_NONE"
    else:
        redis_url_with_params = redis_url

    celery_app = Celery("strata_tasks", broker=redis_url_with_params, backend=redis_url_with_params)
    
    # 2. Match Celery's configuration using Python's native SSL validation constants
    celery_app.conf.update(
        broker_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE},
        redis_backend_use_ssl={"ssl_cert_reqs": ssl.CERT_NONE}
    )
    redis_client = redis.from_url(redis_url_with_params)
else:
    # Local development fallback
    celery_app = Celery("strata_tasks", broker=redis_url, backend=redis_url)
    redis_client = redis.from_url(redis_url)

@celery_app.task(bind=True)
def run_full_archaeology_pipeline(self, repo_url: str):
    """
    Long-running background task that orchestrates data extraction and AI analysis.
    """
    # 1. Update progress state: Extraction
    self.update_state(state='PROGRESS', meta={'status': 'Excavating dig site (Cloning & Mining Git Repository)...'})
    
    # We will save intermediate data locally in a temp file named after the task ID
    temp_commits_file = f"commits_{self.request.id}.json"
    
    try:
        # Run Phase 1 Extraction (limit to 100 commits for testing speed)
        commits_data = extract_repository_history(repo_url, max_commits=100)
        
        with open(temp_commits_file, 'w', encoding='utf-8') as f:
            json.dump(commits_data, f)
            
        # 2. Update progress state: AI Processing
        self.update_state(state='PROGRESS', meta={'status': 'Carbon dating artifacts (Running AI Map-Reduce pipeline)...'})
        
        # Run Phase 2 AI Analysis
        analysis_result = analyze_codebase_history(temp_commits_file)
        
        # 3. Clean up the temporary intermediate file
        if os.path.exists(temp_commits_file):
            os.remove(temp_commits_file)
            
        # Return the final report artifact
        result = {
            "status": "Completed",
            "repo_url": repo_url,
            "eras": analysis_result.get("eras", []),
            "survival_guide": analysis_result.get("survival_guide", ""),
            "file_stats": analysis_result.get("file_stats", {})
        }
        
        # Cache the successful result for 24 hours (86400 seconds)
        redis_client.setex(f"cache:{repo_url}", 86400, json.dumps(result))
        
        return result
        
    except Exception as e:
        if os.path.exists(temp_commits_file):
            os.remove(temp_commits_file)
        self.update_state(state='FAILURE', meta={'status': f'Excavation collapsed: {str(e)}'})
        raise e