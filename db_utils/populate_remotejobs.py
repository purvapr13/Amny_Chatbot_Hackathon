from .job_db_setup import SessionLocal
from .models import Job
from .remote_job_utils import fetch_remoteful_jobs
from .parse_remotejobs import parse_remote_jobs


def insert_remote_jobs():
    session = SessionLocal()
    jobs = fetch_remoteful_jobs(limit=10, use_cache=True)

    print(f"📦 Fetched {len(jobs)} remote jobs. Inserting into DB...")

    try:
        for job_data in jobs:
            parsed = parse_remote_jobs(job_data)
            job = Job(**parsed)
            if parsed.get('tags'):
                job.set_tags(parsed['tags'])
            session.merge(job)  # merge = insert or update based on PK
        session.commit()
        print("✅ Remote jobs successfully inserted.")
    except Exception as e:
        print(f"❌ Error inserting jobs: {e}")
        session.rollback()
    finally:
        session.close()
