import http.server
import socketserver
import json
from urllib.parse import urlparse
import urllib.request
import urllib.error
import sys
import os
import toml

# Get Supabase Credentials
sys.path.insert(0, '..')
try:
    secrets = toml.load("../.streamlit/secrets.toml")
    url = secrets["supabase"]["url"]
    key = secrets["supabase"]["key"]
except Exception as e:
    print("Error loading Supabase configuration from secrets.toml", e)
    sys.exit(1)

PORT = 8080

class ProxyAPIHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/login':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                email = data.get('email')
                password = data.get('password')
                
                print(f"Attempting login for: {email} using urllib (System Proxy aware)")
                
                # 1. Login via Supabase Auth API
                auth_req = urllib.request.Request(
                    f"{url}/auth/v1/token?grant_type=password",
                    data=json.dumps({"email": email, "password": password}).encode("utf-8"),
                    headers={
                        "apikey": key,
                        "Content-Type": "application/json"
                    }
                )
                
                with urllib.request.urlopen(auth_req, timeout=15) as auth_response:
                    auth_result = json.loads(auth_response.read().decode("utf-8"))
                
                user_id = auth_result["user"]["id"]
                access_token = auth_result["access_token"]
                
                # 2. Fetch User Table Details
                users_req = urllib.request.Request(
                    f"{url}/rest/v1/users?id=eq.{user_id}&select=id,full_name,role,employee_id",
                    headers={
                        "apikey": key,
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                )
                
                user_info = {}
                try:
                    with urllib.request.urlopen(users_req, timeout=10) as users_response:
                        users_result = json.loads(users_response.read().decode("utf-8"))
                        if users_result and len(users_result) > 0:
                            user_info = users_result[0]
                except Exception as db_err:
                    print("Warning: Could not fetch 'users' table profile info:", db_err)

                
                resp_data = {
                    "user_id": user_id,
                    "email": email,
                    "access_token": access_token,
                    "full_name": user_info.get("full_name", email),
                    "role": user_info.get("role", "manager"),
                    "employee_id": user_info.get("employee_id", "")
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"session": resp_data}).encode('utf-8'))
                
            except urllib.error.HTTPError as he:
                print("Login failed HTTP status:", he.code)
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Invalid credentials or API error ({he.code})"}).encode('utf-8'))
            except Exception as e:
                print("Login failed Network/System err:", e)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

# Ensure proper socket reuse to avoid "Address already in use" errors during dev
socketserver.TCPServer.allow_reuse_address = True

with socketserver.TCPServer(("", PORT), ProxyAPIHandler) as httpd:
    print(f"Custom Server running at http://localhost:{PORT}")
    print("This server provides the /api/login endpoint to bypass browser CORS.")
    httpd.serve_forever()
