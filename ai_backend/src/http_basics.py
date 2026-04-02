import urllib.request
import json

def explore_http():
    url = "https://api.github.com/users/chinmaydubey007"
    print(f"--- Sending GET Request to {url} ---\n")

    try:
        # Making the HTTP Request
        response = urllib.request.urlopen(url)

        # 1. Look at the Status Code
        print(f"Status Code: {response.getcode()} (200 means OK!)")

        # 2. Look at the Headers
        print("\n--- Important Headers Received ---")
        headers = dict(response.getheaders())
        print(f"Content-Type: {headers.get('Content-Type')}")
        print(f"Server: {headers.get('Server')}")

        # 3. Look at the Body (Data)
        print("\n--- Response Body (JSON Data) ---")
        body = response.read().decode('utf-8')
        data = json.loads(body)
        print(f"GitHub Username: {data.get('login')}")
        print(f"Public Repos: {data.get('public_repos')}")

    except Exception as e:
        print(f"HTTP Request Failed: {e}")

if __name__ == "__main__":
    explore_http()
