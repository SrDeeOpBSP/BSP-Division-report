async function fetchCLI() {
    let cliId = document.getElementById("cli_id").value.trim();
    if (!cliId) return;

    try {
        const response = await fetch("CLIMICRO.csv"); // CLI Data File
        if (!response.ok) throw new Error("Failed to fetch CLI data");

        const data = await response.text();
        const rows = data.split(/\r?\n/).map(row => row.split(",")); // Handling both LF & CRLF line endings

        let cliDetails = rows.find(row => row[0]?.trim() === cliId);
        if (cliDetails && cliDetails.length >= 3) {
            document.getElementById("cli_name").value = cliDetails[1]?.trim() || "";
            document.getElementById("cli_hq").value = cliDetails[2]?.trim() || "";
        }
    } catch (error) {
        console.error("CLI Data Fetch Error:", error);
    }
}

async function fetchCrew() {
    let crewId = document.getElementById("crew_id").value.trim();
    if (!crewId) return;

    try {
        const response = await fetch("CREWM.csv"); // Crew Data File
        if (!response.ok) throw new Error("Failed to fetch Crew data");

        const data = await response.text();
        const rows = data.split(/\r?\n/).map(row => row.split(",")); // Handling both LF & CRLF line endings

        let crewDetails = rows.find(row => row[0]?.trim() === crewId);
        if (crewDetails && crewDetails.length >= 4) {
            document.getElementById("crew_name").value = crewDetails[1]?.trim() || "";
            document.getElementById("crew_desg").value = crewDetails[2]?.trim() || "";
            document.getElementById("crew_hq").value = crewDetails[3]?.trim() || "";
        }
    } catch (error) {
        console.error("Crew Data Fetch Error:", error);
    }
}

// Google Sheet Web App URL
const googleSheetURL = "https://script.google.com/macros/s/AKfycbw9xyK1WhaatHCIxp_gwnKncXhyNCaFDrhnoGaCYG47uQAFVfKpt_NxJYZg9rki7G2Jsw/exec";

// Form Submit Handling
document.getElementById("crewForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    let submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    submitBtn.style.backgroundColor = "orange";

    let formData = {
        date: document.getElementById("date").value,
        cli_id: document.getElementById("cli_id").value,
        cli_name: document.getElementById("cli_name").value,
        cli_hq: document.getElementById("cli_hq").value,
        crew_id: document.getElementById("crew_id").value,
        crew_name: document.getElementById("crew_name").value,
        crew_desg: document.getElementById("crew_desg").value,
        crew_hq: document.getElementById("crew_hq").value,
        station_num: document.getElementById("station_num").value,
        station_name: document.getElementById("station_name").value.toUpperCase(),
        correct_diagram: document.getElementById("correct_diagram").value,
        rating: document.getElementById("rating").value
    };

    try {
        const response = await fetch(googleSheetURL, {
            method: "POST",
            mode: "no-cors", // Bypass CORS for local testing
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        alert("Data submitted (check the sheet to confirm)!");
        this.reset();
    } catch (error) {
        alert("Network error: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "SUBMIT";
        submitBtn.style.backgroundColor = "blue";
    }
});