document.addEventListener('DOMContentLoaded', async () => {
    // Skip on login page
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || document.getElementById('loginForm')) {
        return;
    }

    // Delay a bit to ensure supabase is ready and session is checked
    setTimeout(async () => {
        if (!window.supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const employeeId = localStorage.getItem('employee_id');
        if (!employeeId) return;

        try {
            // 1. Get Employee's designation
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('designation')
                .eq('employee_id', employeeId)
                .single();

            if (empError || !empData) return;
            const designation = empData.designation;

            // 2. Fetch assignments for this designation
            const { data: assignments, error: assgError } = await supabase
                .from('instruction_designation_assignments')
                .select('instruction_id')
                .eq('designation', designation);

            if (assgError || !assignments || assignments.length === 0) return;
            const instructionIds = assignments.map(a => a.instruction_id);

            // 3. Fetch the active instructions
            const { data: instructions, error: instError } = await supabase
                .from('instructions')
                .select('id, title, content')
                .in('id', instructionIds)
                .eq('is_active', true);

            if (instError || !instructions || instructions.length === 0) return;

            // 4. Fetch acknowledgements by this employee
            const { data: acks, error: ackError } = await supabase
                .from('instruction_acknowledgements')
                .select('instruction_id')
                .eq('employee_id', employeeId)
                .in('instruction_id', instructions.map(i => i.id));

            const ackedIds = (acks || []).map(a => a.instruction_id);

            // 5. Filter for pending
            const pendingInstructions = instructions.filter(inst => !ackedIds.includes(inst.id));

            if (pendingInstructions.length > 0) {
                showInstructionPopup(pendingInstructions, employeeId);
            }

        } catch (err) {
            console.error("Failed to check for pending instructions:", err);
        }
    }, 500); // Slight delay for auth state settling
});

function showInstructionPopup(instructions, employeeId) {
    const overlay = document.createElement('div');
    overlay.id = 'instructionBlockingOverlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.85); z-index: 99999;
        display: flex; justify-content: center; align-items: center;
        backdrop-filter: blur(5px); padding: 1rem;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white; padding: 2rem; border-radius: 12px;
        width: 100%; max-width: 600px; max-height: 85vh;
        overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    `;

    let html = `
        <h2 style="color: #dc2626; margin-top: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem;">
            <i class="fa-solid fa-triangle-exclamation"></i> Mandatory Instructions Pending
        </h2>
        <p style="font-size: 0.95rem;">You have new instructions that require your acknowledgement before you can access the system.</p>
        <hr style="margin: 1rem 0; border: 0; border-top: 1px solid #e2e8f0;">
    `;

    instructions.forEach((inst, index) => {
        html += `
            <div class="instruction-block" data-id="${inst.id}" style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #1e293b; font-size: 1.1rem;">${index + 1}. ${inst.title}</h3>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.9rem;">
                    ${inst.content}
                </div>
                <button class="btn btn-primary ack-btn" data-id="${inst.id}" style="width: 100%;">
                    I Acknowledge and Understand
                </button>
            </div>
        `;
    });

    html += `
        <div id="ackStatus" style="text-align: center; font-weight: bold; margin-top: 1rem;">
            Pending Approvals: <span id="pendingCount">${instructions.length}</span>
        </div>
    `;

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    let remaining = instructions.length;
    const buttons = modal.querySelectorAll('.ack-btn');
    const pendingCountSpan = modal.querySelector('#pendingCount');

    buttons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const instructionId = e.target.getAttribute('data-id');
            const block = e.target.closest('.instruction-block');

            e.target.disabled = true;
            e.target.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Acknowledging...';

            try {
                const { error } = await supabase
                    .from('instruction_acknowledgements')
                    .insert([{ instruction_id: instructionId, employee_id: employeeId }]);

                if (error) throw error;

                e.target.innerHTML = '<i class="fa-solid fa-check"></i> Acknowledged';
                e.target.classList.replace('btn-primary', 'btn-secondary');
                block.style.opacity = '0.6';

                remaining--;
                pendingCountSpan.textContent = remaining;

                if (remaining === 0) {
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                        document.body.style.overflow = '';
                    }, 500);
                }

            } catch (err) {
                console.error("Failed to acknowledge:", err);
                alert("Failed to save acknowledgement.");
                e.target.disabled = false;
                e.target.innerHTML = 'I Acknowledge and Understand';
            }
        });
    });
}
