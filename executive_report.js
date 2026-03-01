document.addEventListener('DOMContentLoaded', async () => {
    // Basic access check
    const role = localStorage.getItem('user_role');
    if (role !== 'admin' && role !== 'hod') {
        alert("Access Denied. You do not have permission to view this page.");
        window.location.href = 'dashboard.html';
        return;
    }

    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    if (!window.supabase) {
        console.error("Supabase client not initialized");
        return;
    }

    try {
        // --- Fetch Summary Data ---
        const { data: inspections, error } = await supabase
            .from('footplate_inspections')
            .select('*')
            .order('inspection_date', { ascending: false });

        if (error) throw error;

        // Populate Summary Cards
        const totalCount = inspections.length;
        document.getElementById('val-total').textContent = totalCount;

        // This Month
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let monthCount = 0;
        let totalScoreSum = 0;

        inspections.forEach(insp => {
            const inspDate = new Date(insp.inspection_date);
            if (inspDate >= thisMonthStart) monthCount++;
            totalScoreSum += (insp.overall_total || 0);
        });

        document.getElementById('val-month').textContent = monthCount;

        const avgScore = totalCount > 0 ? (totalScoreSum / totalCount).toFixed(1) : "0.0";
        document.getElementById('val-avg').textContent = avgScore;

        // --- Fetch Employee Data mapped to ID (for names) ---
        const { data: employees } = await supabase.from('employees').select('employee_id, name');
        const employeeMap = {};
        if (employees) {
            employees.forEach(emp => {
                employeeMap[emp.employee_id] = emp.name;
            });
        }

        // --- Populate Latest Inspections Table (Top 10) ---
        const latestTableBody = document.querySelector('#latest-table tbody');
        latestTableBody.innerHTML = ''; // clear loading

        if (inspections.length === 0) {
            latestTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No inspections found.</td></tr>';
        } else {
            const top10 = inspections.slice(0, 10);
            top10.forEach(insp => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${insp.inspection_date}</td>
                    <td>${insp.employee_id}</td>
                    <td>${employeeMap[insp.employee_id] || 'Unknown'}</td>
                    <td>${insp.inspected_by_name || 'Unknown'}</td>
                    <td>${insp.overall_total}</td>
                `;
                latestTableBody.appendChild(tr);
            });
        }

        // --- Populate Inspector Performance (Last 30 Days) ---
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentInspections = inspections.filter(insp => new Date(insp.inspection_date) >= thirtyDaysAgo);

        // Group by inspector
        const inspectorStats = {};
        recentInspections.forEach(insp => {
            const inspector = insp.inspected_by_name || 'Unknown';
            if (!inspectorStats[inspector]) {
                inspectorStats[inspector] = { count: 0, totalScore: 0, min: 999, max: -1 };
            }
            const s = inspectorStats[inspector];
            s.count++;
            s.totalScore += (insp.overall_total || 0);
            if ((insp.overall_total || 0) < s.min) s.min = (insp.overall_total || 0);
            if ((insp.overall_total || 0) > s.max) s.max = (insp.overall_total || 0);
        });

        const inspectorTableBody = document.querySelector('#inspector-table tbody');
        inspectorTableBody.innerHTML = ''; // clear loading

        const inspectorKeys = Object.keys(inspectorStats);
        if (inspectorKeys.length === 0) {
            inspectorTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No inspections in the last 30 days.</td></tr>';
        } else {
            // Sort by count descending
            inspectorKeys.sort((a, b) => inspectorStats[b].count - inspectorStats[a].count);

            inspectorKeys.forEach(key => {
                const s = inspectorStats[key];
                const avg = (s.totalScore / s.count).toFixed(1);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${key}</td>
                    <td>${s.count}</td>
                    <td>${avg}</td>
                    <td>${s.min}</td>
                    <td>${s.max}</td>
                `;
                inspectorTableBody.appendChild(tr);
            });
        }

    } catch (err) {
        console.error("Dashboard Load Error:", err);
        document.querySelector('#latest-table tbody').innerHTML = `<tr><td colspan="5" style="color:var(--danger);text-align:center;">Error loading data: ${err.message}</td></tr>`;
        document.querySelector('#inspector-table tbody').innerHTML = `<tr><td colspan="5" style="color:var(--danger);text-align:center;">Error loading data: ${err.message}</td></tr>`;
    }
});
