from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from celery.result import AsyncResult
from tasks import celery_app, run_full_archaeology_pipeline

app = FastAPI(title="Strata API", description="AI Code Archaeology Pipeline Engine")

# Enable CORS so our future Frontend UI can talk to the backend safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    repo_url: str

@app.post("/api/analyze")
def start_analysis(request: AnalysisRequest):
    """
    Triggers the background task and instantly returns a tracking job ID.
    """
    # Dispatch task to Celery asynchronously
    task = run_full_archaeology_pipeline.delay(request.repo_url)
    return {"job_id": task.id, "status": "Queued"}

@app.get("/api/status/{job_id}")
def get_analysis_status(job_id: str):
    """
    Polled periodically by the frontend to get live progress details or final results.
    """
    task_result = AsyncResult(job_id, app=celery_app)
    
    response = {
        "job_id": job_id,
        "state": task_result.state
    }
    
    if task_result.state == 'PROGRESS':
        response["status"] = task_result.info.get('status')
    elif task_result.state == 'SUCCESS':
        response["status"] = "Analysis finished successfully!"
        response["result"] = task_result.result
    elif task_result.state == 'FAILURE':
        response["status"] = "An error occurred during execution."
        response["error"] = str(task_result.info)
        
    return response