import requests
import os
import json


CACHE_FILE = "cached_remote_jobs.json"


def filter_jobs_by_location(jobs, location_filter=("WORLDWIDE", "ASIA-ONLY")):
    """
    Filters the jobs based on the location field (e.g., WORLDWIDE, ASIA-ONLY)
    """
    return [job for job in jobs if job['location'] in location_filter]


def fetch_remoteful_jobs(limit=10, use_cache=True):
    if use_cache and os.path.exists(CACHE_FILE):
        print("📁 Loading jobs from local cache...")
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cached_jobs = json.load(f)

        # Filter cached jobs based on location before returning them
        filtered_cached_jobs = filter_jobs_by_location(cached_jobs)
        print(f"🌐 Jobs loaded from cache: {len(filtered_cached_jobs)}")
        return filtered_cached_jobs

    url = 'https://remoteful.dev/api/remote_jobs'
    params = {'limit': limit}
    response = requests.get(url, params=params)

    if response.status_code != 200:
        print(f"❌ API call failed: {response.status_code}")
        return []

    data = response.json().get('jobs', [])
    print(f"🌐 Jobs fetched from API: {len(data)}")

    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    filtered_jobs = filter_jobs_by_location(data)

    # Print filtered jobs
    if filtered_jobs:
        for job in filtered_jobs:
            print(f"Job Title: {job['title']}, Company: {job['company_name']}, Location: {job['location']}")
    else:
        print(f"No jobs found for location: worldwide and asia-only")
    return filtered_jobs








