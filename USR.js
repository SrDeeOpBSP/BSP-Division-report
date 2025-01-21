// Fetch the CSV file and parse it using PapaParse
fetch('CREW.csv')
    .then(response => response.text())
    .then(csvText => {
        const data = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        }).data;

        populateCliNames(data);
    })
    .catch(error => {
        console.error('Error fetching the CSV file:', error);
    });

// Populate the CLI Names dropdown with unique values from the CSV data
function populateCliNames(data) {
    const cliNames = [...new Set(data.map(item => item['CLI NAME']))]; // Get unique CLI NAMEs
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

// Populate the ALP ID dropdown based on the selected CLI Name
function populateLpIds(data, selectedCliName) {
    const filteredData = data.filter(item => item['CLI NAME'] === selectedCliName);
    const lpIdDropdown = document.getElementById('crewId');

    lpIdDropdown.innerHTML = '<option value="">Select CREW ID</option>'; // Reset ALP ID dropdown

    filteredData.forEach(item => {
        const option = document.createElement('option');
        option.value = item['CREW ID'];
        option.textContent = item['CREW ID'];
        lpIdDropdown.appendChild(option);
    });

    lpIdDropdown.addEventListener('change', function() {
        autoFillDetails(filteredData, this.value);
    });
}

// Auto-fill the form details based on the selected LP ID
function autoFillDetails(data, selectedLpId) {
    const selectedData = data.find(item => item['CREW ID'] === selectedLpId);

    document.getElementById('crewName').value = selectedData['CREW NAME'] || '';
    document.getElementById('desg').value = selectedData['DESG'] || '';
    document.getElementById('hq').value = selectedData['HQ'] || '';
}

// Handle form submission
document.getElementById('usrForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true; // Disable the submit button to prevent multiple submissions
    var formData = new FormData(this);
    var data = {};
    formData.forEach((value, key) => data[key] = value);

    console.log('Final Data being submitted:', data); // Debugging line

    fetch('https://script.google.com/macros/s/AKfycbxJ6R-LajG6XovTC-6YnHUfjEVUNIKoKEu9tWvGnY5cGG5pKDSJAK1RQcnM8sezrmc4/exec', { // Replace with your actual Web App URL
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(data)
    })
    .then(response => {
        alert('Form data submitted successfully!');
        document.getElementById('footplateForm').reset(); // Reset the form after submission

        // Reset the BEAT field handling
        selectBeat.setAttribute('name', 'BEAT');
        otherBeatInput.setAttribute('name', 'BEAT_OTHER');
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
        submitButton.disabled = false; // Re-enable the submit button after submission is complete
    });
});