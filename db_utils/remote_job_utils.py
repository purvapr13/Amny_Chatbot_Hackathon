import requests


def fetch_remoteful_jobs(limit=5):
    url = 'https://remoteful.dev/api/remote_jobs'
    params = {'limit': limit,
              "location": "WORLDWIDE"}
    response = requests.get(url, params=params)
    if response.status_code != 200:
        print(f"❌ API call failed: {response.status_code}")
        return []

    data = response.json().get('jobs', [])
    print(f"🌐 Jobs fetched from API: {len(data)}")
    return data


