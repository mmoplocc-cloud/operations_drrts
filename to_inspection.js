document.addEventListener('DOMContentLoaded', () => {
    const employeeIdInput = document.getElementById('employeeId');
    const employeeNameInput = document.getElementById('employeeName');
    const lookupBtn = employeeIdInput.nextElementSibling; // The button right next to the input

    lookupBtn.addEventListener('click', async () => {
        const id = employeeIdInput.value.trim();
        if (!id) return;

        lookupBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const { data, error } = await supabase
                .from('employees')
                .select('name')
                .eq('employee_id', id)
                .single();

            if (data) {
                employeeNameInput.value = data.name;
            } else {
                alert('Employee not found in the database. Please verify the ID.');
                employeeNameInput.value = '';
            }
        } catch (err) {
            console.error(err);
            alert('Error looking up employee.');
        } finally {
            lookupBtn.innerHTML = 'Lookup';
        }
    });

    const submitBtn = document.getElementById('submitInspectionBtn');

    submitBtn.addEventListener('click', async () => {
        const empId = employeeIdInput.value.trim();
        const empName = employeeNameInput.value.trim();
        const dateStr = document.getElementById('inspectionDate').value;

        if (!empId || !empName) {
            alert("Please lookup and provide a valid Employee ID before submitting.");
            return;
        }

        // Get totals
        const totalA1 = parseInt(document.getElementById('totalA1').textContent) || 0;
        const totalA2 = parseInt(document.getElementById('totalA2').textContent) || 0;
        const totalC = parseInt(document.getElementById('totalC').textContent) || 0;
        const grandTotal = parseInt(document.getElementById('grand-total').textContent) || 0;

        // Get Obs
        const obsGeneral = document.getElementById('obsGeneral').value.trim();
        const obsDefects = document.getElementById('obsDefects').value.trim();
        const obsCorrective = document.getElementById('obsCorrective').value.trim();

        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert("You must be logged in to submit an inspection.");
            return;
        }

        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

        try {
            // Get user info from localStorage
            const userId = localStorage.getItem('user_id');
            const userName = localStorage.getItem('user_name');
            const userRole = localStorage.getItem('user_role');

            // 1. Insert into footplate_inspections
            const insertRecord = {
                employee_id: empId,
                inspection_date: dateStr,
                inspected_by_user_id: userId,
                inspected_by_name: userName,
                inspected_by_role: userRole,
                part_a_total: totalA1 + totalA2,
                part_b_total: 0,
                part_c_total: totalC,
                overall_total: grandTotal,
                observations: obsGeneral || null,
                defects_identified: obsDefects || null,
                corrective_actions: obsCorrective || null
            };

            const { data: inspectionData, error: inspectionError } = await window.supabase
                .from('footplate_inspections')
                .insert([insertRecord])
                .select();

            if (inspectionError) {
                console.error("Insert error:", inspectionError);
                // Check if it's a unique constraint error
                if (inspectionError.code === '23505') {
                    throw new Error(`An inspection for employee ${empId} on ${dateStr} already exists.`);
                }
                throw new Error("Failed to save inspection record.");
            }

            const inspectionId = inspectionData[0].id;

            // 2. Insert into inspection_scores
            const scoreRecords = [];

            // Collect Part A - Driving (class: p-a)
            document.querySelectorAll('#sectionA-Driving tr:not(.total-row)').forEach((tr, index) => {
                const itemText = tr.children[1].textContent.trim();
                const score = parseInt(tr.querySelector('.p-a').value) || 0;
                scoreRecords.push({
                    inspection_id: inspectionId,
                    part: 'A',
                    section: 'Driving Skill',
                    item_no: index + 1,
                    item_text: itemText,
                    max_marks: 1,
                    marks_awarded: score
                });
            });

            // Collect Part A - Safety (class: p-a-s)
            document.querySelectorAll('#sectionA-Safety tr:not(.total-row)').forEach((tr, index) => {
                const itemText = tr.children[1].textContent.trim();
                const score = parseInt(tr.querySelector('.p-a-s').value) || 0;
                scoreRecords.push({
                    inspection_id: inspectionId,
                    part: 'A',
                    section: 'Safety',
                    item_no: index + 1,
                    item_text: itemText,
                    max_marks: 1,
                    marks_awarded: score
                });
            });

            // Collect Part C (class: p-c)
            document.querySelectorAll('#sectionC tr:not(.total-row)').forEach((tr, index) => {
                const itemText = tr.children[1].textContent.trim();
                const score = parseInt(tr.querySelector('.p-c').value) || 0;
                scoreRecords.push({
                    inspection_id: inspectionId,
                    part: 'C',
                    section: 'Rating by Nominated Line Manager',
                    item_no: index + 1,
                    item_text: itemText,
                    max_marks: 2,
                    marks_awarded: score
                });
            });

            if (scoreRecords.length > 0) {
                const { error: scoresError } = await window.supabase
                    .from('inspection_scores')
                    .insert(scoreRecords);

                if (scoresError) {
                    throw new Error("Failed to save detailed scores, but main record was created.");
                }
            }

            alert("Inspection submitted successfully!");
            // Reset form
            document.getElementById('inspectionForm').reset();
            document.querySelectorAll('.total-row td:last-child').forEach(td => td.textContent = '0');
            document.getElementById('grand-total').textContent = '0';
            employeeNameInput.value = '';

        } catch (err) {
            console.error(err);
            alert(err.message || 'An error occurred during submission.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});
