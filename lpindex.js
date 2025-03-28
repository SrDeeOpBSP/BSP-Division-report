// Fetch the CLI.csv file (existing code remains unchanged)
fetch('CLI.csv')
    .then(response => response.text())
    .then(csvText => {
        const data = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;
        populateCliNames(data);
    })
    .catch(error => {
        console.error('Error fetching the CLI.csv file:', error);
    });

// Fetch the BEAT.csv file for MAJOR BEAT
let beatData = []; // Global variable to store BEAT.csv data
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

// Populate CLI Names (unchanged)
function populateCliNames(data) {
    const cliNames = [...new Set(data.map(item => item['CLI NAME']))];
    const cliNameDropdown = document.getElementById('cliName');

    cliNames.forEach(cli => {
        const option = document.createElement('option');
        option.value = cli;
        option.textContent = cli;
        cliNameDropdown.appendChild(option);
    });

    cliNameDropdown.addEventListener('change', function() {
        populateLpIds(data, this.value);
    });
}

// Populate LP IDs (unchanged)
function populateLpIds(data, selectedCliName) {
    const filteredData = data.filter(item => item['CLI NAME'] === selectedCliName);
    const lpIdDropdown = document.getElementById('lpId');

    lpIdDropdown.innerHTML = '<option value="">Select LP ID</option>';

    filteredData.forEach(item => {
        const option = document.createElement('option');
        option.value = item['LP ID'];
        option.textContent = item['LP ID'];
        lpIdDropdown.appendChild(option);
    });

    lpIdDropdown.addEventListener('change', function() {
        autoFillDetails(filteredData, this.value);
    });
}

// Auto-fill details including MAJOR BEAT
function autoFillDetails(data, selectedLpId) {
    const selectedData = data.find(item => item['LP ID'] === selectedLpId);

    document.getElementById('lpName').value = selectedData['LP NAME'] || '';
    document.getElementById('desg').value = selectedData['DESG'] || '';
    document.getElementById('hq').value = selectedData['HQ'] || '';

    // Populate MAJOR BEAT based on HQ
    const hqValue = selectedData['HQ'] || '';
    populateMajorBeat(hqValue);
}

// New function to populate MAJOR BEAT dropdown
function populateMajorBeat(hq) {
    const majorBeatDropdown = document.getElementById('majorBeat');
    majorBeatDropdown.innerHTML = '<option value="">Select MAJOR BEAT</option>'; // Reset dropdown

    if (hq && beatData.length > 0) {
        const filteredBeats = beatData.filter(item => item['HQ'] === hq); // Filter BEAT.csv based on HQ
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

// Handle form submission (unchanged, MAJOR BEAT automatically included in formData)
document.getElementById('footplateForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    var selectBeat = document.getElementById('BEAT');
    var otherBeatInput = document.getElementById('otherBeatInput');
    
    if (selectBeat.value === 'OTHER') {
        selectBeat.setAttribute('name', 'BEAT_OTHER');
        otherBeatInput.setAttribute('name', 'BEAT');
    }

    var formData = new FormData(this);
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
        document.getElementById('footplateForm').reset();
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