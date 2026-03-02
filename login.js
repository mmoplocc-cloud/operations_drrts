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
        // If the user entered an Employee ID (no '@' symbol), append a dummy domain for Supabase Auth
        // This is a standard workaround since Supabase requires an email address natively.
        if (!email.includes('@')) {
            email = email + '@operations.local';
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';
        errorContainer.style.display = 'none';

        try {
            // Use native Supabase Auth now that the app is securely hosted
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: passwordInput
            });

            if (error) {
                throw error;
            }

            // Successfully logged in! Now fetch user role from public.users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (userError) {
                console.warn('Could not fetch user role details. Assuming default role.', userError);
            }

            // Store session details in localStorage for JS use
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_email', data.user.email);

            if (userData) {
                localStorage.setItem('user_name', userData.full_name || data.user.email);
                localStorage.setItem('user_role', userData.role || 'manager');
                if (userData.employee_id) localStorage.setItem('employee_id', userData.employee_id);
            } else {
                localStorage.setItem('user_name', data.user.email);
                localStorage.setItem('user_role', 'manager');
            }

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
