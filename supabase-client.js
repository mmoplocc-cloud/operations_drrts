// supabase-client.js
const SUPABASE_URL = 'https://hoalsyfkxnzfxmuvidtl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvYWxzeWZreG56ZnhtdXZpZHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDY1MTcsImV4cCI6MjA4NTQyMjUxN30.oHZqQmI29a6OeDKOgTDDJnezh3QMsS7kZaRHney6JsY';

// Initialize the Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.supabase = supabaseClient;

// Function to check auth state on page load
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();

    // If not on the index (login) page and no session, redirect to login
    if (!session && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
    }

    // If on login page and logged in, redirect to dashboard
    if (session && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/'))) {
        window.location.href = 'dashboard.html';
    }

    return session;
}

// Call checkAuth when the document is ready, unless we're deliberately skipping it
if (!window.skipAuthCheck) {
    document.addEventListener('DOMContentLoaded', checkAuth);
}
