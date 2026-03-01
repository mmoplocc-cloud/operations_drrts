document.addEventListener('DOMContentLoaded', () => {
    // If not on the login page, skip
    if (!document.getElementById('loginForm')) return;

    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');

    // Add an error message container if it doesn't exist
    let errorContainer = document.getElementById('error-message');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-message';
        errorContainer.style.color = 'var(--danger)';
        errorContainer.style.fontSize = '0.85rem';
        errorContainer.style.marginTop = '1rem';
        errorContainer.style.display = 'none';
        loginForm.insertBefore(errorContainer, loginBtn);
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('username').value.trim();
        const passwordInput = document.getElementById('password').value;

        if (!usernameInput || !passwordInput) {
            showError('Please enter both User Name/Email and Password.');
            return;
        }

        // Format email. If it's just an ID like '30001133', we might need to append a domain if Supabase requires it.
        // Assuming the streamlit app used email. We'll try it as is first.
        // If it's just numbers, it might be registered as id@mmo.com or similar. We'll just pass the input for now.
        let email = usernameInput;
        // Basic check: if it looks like just an ID, many systems append a dummy email domain
        if (!email.includes('@')) {
            // Uncomment the next line if a specific domain is required
            // email = email + '@example.com'; 
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';
        errorContainer.style.display = 'none';

        try {
            // Use local Python proxy to bypass browser CORS block on Supabase
            const response = await fetch('http://localhost:8080/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: passwordInput })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Authentication failed');
            }

            const sessionData = result.session;

            // Store session details in localStorage for JS use
            localStorage.setItem('user_id', sessionData.user_id);
            localStorage.setItem('user_email', sessionData.email);
            localStorage.setItem('user_name', sessionData.full_name);
            localStorage.setItem('user_role', sessionData.role);
            if (sessionData.employee_id) localStorage.setItem('employee_id', sessionData.employee_id);

            // Redirect to dashboard
            window.location.href = 'dashboard.html';

        } catch (err) {
            console.error('Login Error:', err);
            let msg = 'Invalid username or password.';
            if (err.message) {
                msg = err.message;
            }
            showError(`Error: ${msg}`);
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Sign In';
        }
    });

    function showError(msg) {
        errorContainer.textContent = msg;
        errorContainer.style.display = 'block';
    }
});
