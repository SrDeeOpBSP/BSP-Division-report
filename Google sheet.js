document.addEventListener('DOMContentLoaded', () => {
    // --- NEW PART: AUTO-FILL NUMBER FIELDS WITH 0 ---
    // This finds all input fields that are for numbers
    const numberInputs = document.querySelectorAll('input[type="number"]');
    // This loops through each one and sets its default value to 0
    numberInputs.forEach(input => {
        input.value = 0;
    });
    
    // --- PART 1: AUTO-FILL LOGIC FOR CLI ID (Existing Code) ---
    const cliIdInput = document.getElementById('cliId');
    const cliNameInput = document.getElementById('cliName');
    const cliHqInput = document.getElementById('cliHq');

    const fetchCliData = async (id) => {
        if (!id) {
            cliNameInput.value = '';
            cliHqInput.value = '';
            return;
        }
        try {
            const response = await fetch('CLIMICRO.csv');
            if (!response.ok) {
                console.error("Error: Could not find CLIMICRO.csv");
                return;
            }
            const data = await response.text();
            const rows = data.trim().split('\n');
            let found = false;
            for (const row of rows) {
                const columns = row.split(',');
                if (columns.length >= 3 && columns[0].trim().toUpperCase() === id.toUpperCase()) {
                    cliNameInput.value = columns[1].trim();
                    cliHqInput.value = columns[2].trim();
                    found = true;
                    break;
                }
            }
            if (!found) {
                cliNameInput.value = '';
                cliHqInput.value = '';
            }
        } catch (error) {
            console.error("Failed to fetch or process CSV:", error);
        }
    };

    // Listen for input in the CLI ID field
    cliIdInput.addEventListener('input', (e) => {
        // This is the key line for your requirement
        // It converts to uppercase and removes anything that is NOT a capital letter or number
        const sanitizedValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // Update the input field with the sanitized value
        e.target.value = sanitizedValue;
        
        // Fetch data based on the clean ID
        fetchCliData(sanitizedValue);
    });

    // --- PART 2: FORM SUBMISSION LOGIC (Existing Code) ---
    const form = document.getElementById('abnormalityReportForm');
    const submitButton = document.getElementById('submitButton');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
        const formData = new FormData(form);
        fetch(form.action, {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(result => {
            console.log('Success:', result);
            alert('Form submitted successfully!');
            form.reset();
            // After resetting the form, we need to re-apply the default 0 values
            document.querySelectorAll('input[type="number"]').forEach(input => {
                input.value = 0;
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while submitting the form.');
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'SUBMIT';
        });
    });
});