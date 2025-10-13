// Global variables to store data from CSV files
let cliAlpData = [];
let cliMicroData = [];

// Fetch the CLIALP.csv file for ALP details
fetch('CLIALP.csv')
    .then(response => response.text())
    .then(csvText => {
        cliAlpData = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;
    })
    .catch(error => {
        console.error('Error fetching the CLIALP.csv file:', error);
    });

// Fetch the CLIMICRO.csv file for CLI ID to CLI NAME mapping
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

// EVENT 1: INSTANTLY FILLS NAME WHILE TYPING (NO ALERT)
document.getElementById('cliId').addEventListener('input', function() {
    const cliIdInput = this.value.toUpperCase();
    this.value = cliIdInput; 
    const cliNameField = document.getElementById('cliName');
    
    // Assuming CLIMICRO.csv has headers 'LI ID' and 'NAME'
    const cliRecord = cliMicroData.find(item => item['LI ID'] === cliIdInput);

    if (cliRecord) {
        const foundCliName = cliRecord['NAME']; 
        cliNameField.value = foundCliName;
        // Populate ALP IDs based on the found CLI NAME
        populateAlpIds(cliAlpData, foundCliName);
    } else {
        // NO MATCH FOUND - Just clear the fields silently
        cliNameField.value = '';
        document.getElementById('alpId').innerHTML = '<option value="">Select ALP ID</option>';
        document.getElementById('alpName').value = '';
        document.getElementById('desg').value = '';
        document.getElementById('hq').value = '';
    }
});

// EVENT 2: SHOWS ALERT ONLY IF THE FINAL ID IS INVALID
document.getElementById('cliId').addEventListener('blur', function() {
    // Check if the user has typed something but the name field is still empty
    if (this.value !== '' && document.getElementById('cliName').value === '') {
        alert('Invalid CLI ID. Please try again.');
    }
});

// Populate the ALP ID dropdown based on the selected CLI Name
function populateAlpIds(data, selectedCliName) {
    const filteredData = data.filter(item => item['CLI NAME'] === selectedCliName);
    const alpIdDropdown = document.getElementById('alpId');

    alpIdDropdown.innerHTML = '<option value="">Select ALP ID</option>'; // Reset ALP ID dropdown

    filteredData.forEach(item => {
        const option = document.createElement('option');
        option.value = item['ALP ID'];
        option.textContent = item['ALP ID'];
        alpIdDropdown.appendChild(option);
    });

    alpIdDropdown.onchange = function() {
        autoFillDetails(filteredData, this.value);
    };
}

// Auto-fill the form details based on the selected ALP ID
function autoFillDetails(data, selectedAlpId) {
    const selectedData = data.find(item => item['ALP ID'] === selectedAlpId);

    document.getElementById('alpName').value = selectedData ? selectedData['ALP NAME'] || '' : '';
    document.getElementById('desg').value = selectedData ? selectedData['DESG'] || '' : '';
    document.getElementById('hq').value = selectedData ? selectedData['HQ'] || '' : '';
}

// Handle the BEAT field, including the "OTHER" option (Unchanged)
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

    fetch('https://script.google.com/macros/s/AKfycbwxnVSd3eGB4SvHVz2IINLEat031qB4xvNKbe8BcdPyg5BQpL0xkbQuAyu_B-fTdIqB0A/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data)
    })
    .then(response => {
        alert('Form data submitted successfully!');
        
        // MODIFIED: Keep CLI ID and NAME, reset the rest
        const cliIdValue = document.getElementById('cliId').value;
        const cliNameValue = document.getElementById('cliName').value;
        
        form.reset(); // Reset the entire form
        
        // Restore the values
        document.getElementById('cliId').value = cliIdValue;
        document.getElementById('cliName').value = cliNameValue;

        // Reset the BEAT field handling
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