def parse_remote_jobs(raw_job: dict) -> dict:
    return {
        "id": raw_job.get("id"),
        "title": raw_job.get("title"),
        "company_name": raw_job.get("company_name"),
        "location": raw_job.get("location"),
        "category": raw_job.get("category"),
        "tags": raw_job.get("tags"),
        "url": raw_job.get("url"),
        "description": raw_job.get("description"),
        "published_at": raw_job.get("published_at"),
        "source": "remoteful",
        "employment_type": raw_job.get("employment_type") or "",
        "experience_level": raw_job.get("experience_level") or ""
    }
