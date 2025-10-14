document.addEventListener('DOMContentLoaded', function() {
    const cliIdInput = document.getElementById('cliId');
    const cliNameInput = document.getElementById('cliName');
    const cliHqInput = document.getElementById('cliHq');
    const form = document.getElementById('nightfootplatereport');
    const submitButton = document.getElementById('submitButton');
    
    let cliDataMap = new Map();

    // Function to fetch and parse the CSV file
    function loadCSV() {
        Papa.parse('CLIMICRO.csv', {
            download: true,
            header: false,
            skipEmptyLines: true,
            complete: function(results) {
                // The provided CSV has some formatting issues where a single record is split into two lines.
                // This logic manually corrects those specific known issues.
                let correctedData = [];
                for (let i = 0; i < results.data.length; i++) {
                    let row = results.data[i];
                    // Manual correction for BSP0052
                    if (row.length > 1 && row[0].includes("CHATARJEE DSL") && i > 0 && results.data[i-1][0] === "BSP0052") {
                        correctedData[correctedData.length - 1][1] += " " + row[0]; // Append name part
                        continue; // Skip adding this row as a new entry
                    }
                    // Manual correction for BSP0201
                    if (row.length > 1 && row[0].includes("ANANDA RAO") && i > 0 && results.data[i-1][0] === "BSP0201") {
                         correctedData[correctedData.length - 1][1] += " " + row[0]; // Append name part
                        continue; // Skip adding this row as a new entry
                    }
                    correctedData.push(row);
                }

                correctedData.forEach(row => {
                    if (row.length >= 3) {
                        const id = row[0].trim();
                        const name = row[1].trim();
                        const hq = row[2].trim();
                        if (id) {
                            cliDataMap.set(id, { name: name, hq: hq });
                        }
                    }
                });
                console.log("CSV data loaded and processed successfully.");
            },
            error: function(error) {
                console.error("Error loading or parsing CSV file:", error);
                alert("Could not load the CLI data file (CLIMICRO.csv). Please make sure it's in the same folder as the HTML file.");
            }
        });
    }

    // Listener for the CLI ID input field
    cliIdInput.addEventListener('input', function() {
        const id = this.value.trim().toUpperCase();
        if (cliDataMap.has(id)) {
            const data = cliDataMap.get(id);
            cliNameInput.value = data.name;
            cliHqInput.value = data.hq;
        } else {
            cliNameInput.value = '';
            cliHqInput.value = '';
        }
    });

    // Original form submission logic
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission
        submitButton.disabled = true; // Disable button to prevent multiple submissions
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
            form.reset(); // Reset the form fields
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while submitting the form.');
        })
        .finally(() => {
            submitButton.disabled = false; // Re-enable the button
            submitButton.textContent = 'SUBMIT';
        });
    });

    // Load the CSV data when the page is ready
    loadCSV();
});