// Global variables to store data from CSV files
let cliData = [];
let beatData = [];
let cliMicroData = [];

// Fetch the CLI.csv file for LP details
fetch('CLI.csv')
    .then(response => response.text())
    .then(csvText => {
        cliData = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;
    })
    .catch(error => {
        console.error('Error fetching the CLI.csv file:', error);
    });

// Fetch the BEAT.csv file for MAJOR BEAT
fetch('BEAT.csv')
    .then(response => response.text())
    .then(csvText => {
        beatData = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;
    })
    .catch(error => {
        console.error('Error fetching the BEAT.csv file:', error);
    });

// ## NEW: Fetch the CLIMICRO.csv file for CLI ID to CLI NAME mapping
fetch('CLIMICRO.csv')
    .then(response => response.text())
    .then(csvText => {
        cliMicroData = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;
    })
    .catch(error => {
        console.error('Error fetching the CLIMICRO.csv file:', error);
    });

// ## NEW: Event listener for the CLI ID input field
// EVENT 1: INSTANTLY FILLS NAME WHILE TYPING (NO ALERT)
document.getElementById('cliId').addEventListener('input', function() {
    const cliIdInput = this.value.toUpperCase();
    this.value = cliIdInput; 
    const cliNameField = document.getElementById('cliName');
    
    const cliRecord = cliMicroData.find(item => item['LI ID'] === cliIdInput);

    if (cliRecord) {
        // Match found, fill the details
        const foundCliName = cliRecord['NAME']; 
        cliNameField.value = foundCliName;
        populateLpIds(cliData, foundCliName);
    } else {
        // NO MATCH FOUND - Just clear the fields silently
        cliNameField.value = '';
        document.getElementById('lpId').innerHTML = '<option value="">Select LP ID</option>';
        document.getElementById('lpName').value = '';
        document.getElementById('desg').value = '';
        document.getElementById('hq').value = '';
        document.getElementById('majorBeat').innerHTML = '<option value="">Select MAJOR BEAT</option>';
    }
});
// EVENT 2: SHOWS ALERT ONLY IF THE FINAL ID IS INVALID
document.getElementById('cliId').addEventListener('blur', function() {
    // Check if the user has typed something but the name field is still empty
    if (this.value !== '' && document.getElementById('cliName').value === '') {
        alert('Invalid CLI ID. Please try again.');
    }
});
// Populate LP IDs based on the selected CLI NAME
function populateLpIds(data, selectedCliName) {
    const filteredData = data.filter(item => item['CLI NAME'] === selectedCliName);
    const lpIdDropdown = document.getElementById('lpId');

    lpIdDropdown.innerHTML = '<option value="">Select LP ID</option>'; // Reset dropdown

    filteredData.forEach(item => {
        const option = document.createElement('option');
        option.value = item['LP ID'];
        option.textContent = item['LP ID'];
        lpIdDropdown.appendChild(option);
    });

    // We add the event listener here to ensure it's fresh for the new options
    lpIdDropdown.onchange = function() {
        autoFillDetails(filteredData, this.value);
    };
}

// Auto-fill LP details and populate MAJOR BEAT
function autoFillDetails(data, selectedLpId) {
    const selectedData = data.find(item => item['LP ID'] === selectedLpId);

    document.getElementById('lpName').value = selectedData ? selectedData['LP NAME'] || '' : '';
    document.getElementById('desg').value = selectedData ? selectedData['DESG'] || '' : '';
    document.getElementById('hq').value = selectedData ? selectedData['HQ'] || '' : '';

    const hqValue = selectedData ? selectedData['HQ'] || '' : '';
    populateMajorBeat(hqValue);
}

// Populate MAJOR BEAT dropdown based on HQ
function populateMajorBeat(hq) {
    const majorBeatDropdown = document.getElementById('majorBeat');
    majorBeatDropdown.innerHTML = '<option value="">Select MAJOR BEAT</option>'; // Reset dropdown

    if (hq && beatData.length > 0) {
        const filteredBeats = beatData.filter(item => item['HQ'] === hq);
        filteredBeats.forEach(item => {
            const option = document.createElement('option');
            option.value = item['BEAT'];
            option.textContent = item['BEAT'];
            majorBeatDropdown.appendChild(option);
        });
    }
}

// Handle BEAT field (unchanged)
document.getElementById('BEAT').addEventListener('change', function() {
    var otherBeatInput = document.getElementById('otherBeatInput');
    if (this.value === 'OTHER') {
        otherBeatInput.style.display = 'block';
        otherBeatInput.required = true;
    } else {
        otherBeatInput.style.display = 'none';
        otherBeatInput.required = false;
    }
});

// Handle form submission
document.getElementById('footplateForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const form = this; // Reference to the form
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    var selectBeat = document.getElementById('BEAT');
    var otherBeatInput = document.getElementById('otherBeatInput');
    
    if (selectBeat.value === 'OTHER') {
        selectBeat.setAttribute('name', 'BEAT_OTHER');
        otherBeatInput.setAttribute('name', 'BEAT');
    }

    var formData = new FormData(form);
    var data = {};
    formData.forEach((value, key) => data[key] = value);

    console.log('Final Data being submitted:', data);

    fetch('https://script.google.com/macros/s/AKfycby3eD7SlhNdZ632fu5_h7rSnanaMvmH-hwAYhFjK21ulEbswrX7rjCyMnNIpNMoJwFd/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data)
    })
    .then(response => {
        alert('Form data submitted successfully!');
        
        // ## MODIFIED: Keep CLI ID and NAME, reset the rest
        const cliIdValue = document.getElementById('cliId').value;
        const cliNameValue = document.getElementById('cliName').value;
        
        form.reset(); // Reset the entire form
        
        // Restore the values
        document.getElementById('cliId').value = cliIdValue;
        document.getElementById('cliName').value = cliNameValue;

        // Restore original names for the BEAT fields
        selectBeat.setAttribute('name', 'BEAT');
        otherBeatInput.setAttribute('name', 'BEAT_OTHER');
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
        submitButton.disabled = false;
    });
});