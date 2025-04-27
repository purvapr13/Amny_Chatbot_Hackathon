from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from db_utils import job_db_setup, models
from app.schemas import JobSchema

router = APIRouter()


# Dependency to get DB session
def get_db():
    db = job_db_setup.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/remote_jobs", response_model=List[JobSchema])
async def get_remote_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.Job).all()
    print(f"Fetched {len(jobs)} jobs from DB")
    for job in jobs:
        job.tags = job.get_tags()
    return jobs
