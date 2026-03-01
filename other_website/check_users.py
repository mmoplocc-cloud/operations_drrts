from supabase import create_client

url = "https://hoalsyfkxnzfxmuvidtl.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYWxzeWZreG56ZnhtdXZpZHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDY1MTcsImV4cCI6MjA4NTQyMjUxN30.oHZqQmI29a6OeDKOgTDDJnezh3QMsS7kZaRHney6JsY"
supabase = create_client(url, key)

try:
    response = supabase.table("users").select("*").execute()
    print("Users:", response.data)
except Exception as e:
    print("Error:", e)
