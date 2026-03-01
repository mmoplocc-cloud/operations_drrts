document.addEventListener('DOMContentLoaded', () => {
    const passwordForm = document.querySelector('form');
    if (!passwordForm) return;

    // Attach an ID to the form for easier manipulation if missing
    passwordForm.id = 'changePasswordForm';

    const currentPwdInput = document.getElementById('currentPassword') || passwordForm.querySelector('input[type="password"]'); // Sometimes we don't have current password input
    const newPwdInput = document.getElementById('newPassword') || passwordForm.querySelectorAll('input[type="password"]')[1];
    const confirmPwdInput = document.getElementById('confirmPassword') || passwordForm.querySelectorAll('input[type="password"]')[2];

    // Fallbacks if IDs are different in the HTML
    const inputs = passwordForm.querySelectorAll('input[type="password"]');

    const submitBtn = passwordForm.querySelector('button[type="button"]') || passwordForm.querySelector('button[type="submit"]');

    // Add message container
    const msgContainer = document.createElement('div');
    msgContainer.style.marginTop = '1rem';
    passwordForm.insertBefore(msgContainer, submitBtn.parentElement || submitBtn);

    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        let newPassword, confirmPassword;
        if (inputs.length >= 2) {
            // Assuming structure is current, new, confirm or new, confirm
            if (inputs.length === 3) {
                newPassword = inputs[1].value;
                confirmPassword = inputs[2].value;
            } else {
                newPassword = inputs[0].value;
                confirmPassword = inputs[1].value;
            }
        }

        if (!newPassword || !confirmPassword) {
            showMessage('Please fill in required fields.', 'var(--danger)');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('New passwords do not match!', 'var(--danger)');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters long.', 'var(--danger)');
            return;
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
        submitBtn.disabled = true;

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            showMessage('Password updated successfully! You can now use your new password.', 'var(--success)');
            passwordForm.reset();

        } catch (err) {
            console.error('Password Update Error:', err);
            showMessage(err.message || 'Error updating password. Make sure you are logged in.', 'var(--danger)');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    function showMessage(msg, color) {
        msgContainer.textContent = msg;
        msgContainer.style.color = color;
    }
});
