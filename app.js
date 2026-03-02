document.addEventListener('DOMContentLoaded', () => {
    // Auto focus login input (if on login page)
    const loginInput = document.getElementById('login-username');
    if (loginInput) loginInput.focus();

    // Sidebar Toggle Logic
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-active');
            } else {
                sidebar.classList.toggle('collapsed');
                if (mainContent) mainContent.classList.toggle('expanded');
            }
        });
    }

    // Active Link Highlighting (excluding submenu toggle links)
    const currentUrl = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link:not(.submenu-toggle)');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentUrl) {
            link.classList.add('active');

            // If inside a submenu, open the parent submenu
            const parentSubmenu = link.closest('.submenu-list');
            if (parentSubmenu) {
                parentSubmenu.style.display = 'block';
                const parentToggle = parentSubmenu.previousElementSibling;
                if (parentToggle) parentToggle.classList.add('submenu-open');
            }
        } else {
            // Remove active class to handle cases where it was hardcoded in html
            if (currentUrl && currentUrl !== '' && currentUrl !== 'index.html') {
                link.classList.remove('active');
            }
        }
    });

    // Submenu Toggle Logic
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const submenu = toggle.nextElementSibling;
            toggle.classList.toggle('submenu-open');
            if (submenu.style.display === 'block') {
                submenu.style.display = 'none';
            } else {
                submenu.style.display = 'block';
            }
        });
    });

    // --- Dynamic User Profile & Access Control ---
    const userName = localStorage.getItem('user_name') || 'User';
    const employeeId = localStorage.getItem('employee_id') || localStorage.getItem('user_id')?.substring(0, 8) || 'Unknown';
    const userRole = localStorage.getItem('user_role') || 'manager';

    // Populate Sidebar & Header
    document.querySelectorAll('.user-name').forEach(el => el.textContent = userName);
    document.querySelectorAll('.header-user span').forEach(el => el.textContent = userName);
    document.querySelectorAll('.user-id').forEach(el => el.textContent = `ID: ${employeeId}`);
    document.querySelectorAll('.user-dept').forEach(el => el.textContent = `Role: ${userRole.toUpperCase()}`);

    // Role-Based Access Control: Inject Executive Report link if admin/hod
    if (userRole === 'admin' || userRole === 'hod') {
        const viewReportsToggle = Array.from(document.querySelectorAll('.submenu-toggle')).find(
            el => el.textContent.includes('View Reports')
        );
        if (viewReportsToggle) {
            const submenuList = viewReportsToggle.nextElementSibling;
            if (submenuList) {
                const li = document.createElement('li');
                li.className = 'nav-item';
                li.innerHTML = '<a href="executive_report.html" class="nav-link"><i class="fa-regular fa-circle"></i> <span>Executive Report</span></a>';
                submenuList.appendChild(li);
            }
        }
    }

    // Handle Logout
    const logoutBtn = document.querySelector('a[href="index.html"].text-danger');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                if (window.supabase) await supabase.auth.signOut();
            } catch (e) { console.error(e); }
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
});
