document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('employeeTableBody');

    // Check if Supabase client is available
    if (!window.supabase) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Supabase client not initialized.</td></tr>';
        return;
    }

    try {
        // Fetch employees from Supabase
        const { data: employees, error } = await supabase
            .from('employees')
            .select('employee_id, name, department, designation, status')
            .order('employee_id', { ascending: true });

        if (error) {
            throw error;
        }

        // Clear loading message
        tableBody.innerHTML = '';

        if (!employees || employees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No employees found.</td></tr>';
            return;
        }

        // Populate table
        employees.forEach(emp => {
            const tr = document.createElement('tr');

            // Handle status styling
            let statusHtml = '';
            const statusLower = (emp.status || '').toLowerCase();
            if (statusLower === 'active') {
                statusHtml = `<span class="status-badge status-active">Active</span>`;
            } else if (statusLower === 'inactive' || statusLower === 'on leave') {
                statusHtml = `<span class="status-badge status-inactive">${emp.status}</span>`;
            } else {
                statusHtml = `<span class="status-badge" style="background-color:#e2e8f0; color:#475569;">${emp.status || 'Unknown'}</span>`;
            }

            tr.innerHTML = `
                <td>${emp.employee_id || '-'}</td>
                <td>${emp.name || '-'}</td>
                <td>${emp.department || '-'}</td>
                <td>${emp.designation || '-'}</td>
                <td>${statusHtml}</td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error fetching employees:', err);
        tableBody.innerHTML = `<tr><td colspan="5" class="text-danger text-center">Failed to load employee data: ${err.message}</td></tr>`;
    }
});
