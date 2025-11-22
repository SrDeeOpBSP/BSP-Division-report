let barChart, pieChart;
// API key
const API_KEY = 'AIzaSyAw23pJz0K9fZb2rRRAe2C2cJDilRc0Kac'; 

// ======================================================================================
// CONSTANTS
// ======================================================================================
const SPM_SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/1XcmhgkXH0fQlUQG3oLmEUrVnUVk3p_gyYqBMPyXfGv0/values/Sheet1!A:AZ?key=${API_KEY}`;
const CVVRS_SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/1BEVUi7CPmrbGYdoom30vr94tGHkSsGeWGLfYLZJX76Q/values/Sheet1!B:T?key=${API_KEY}`;
const MAIN_REPORT_URL = `https://sheets.googleapis.com/v4/spreadsheets/1Pn0sosMuxX2XZYRe9qIvkGM06GcyIWdEeaD0gfPeRZU/values/DAILY REPORT!A:AE?key=${API_KEY}`;

document.addEventListener('DOMContentLoaded', function() {
    populateDropdowns();
    document.getElementById('printButton').addEventListener('click', printReport);
    document.getElementById('pdfButton').addEventListener('click', downloadPDF);
});

async function populateDropdowns() {
    try {
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/1Pn0sosMuxX2XZYRe9qIvkGM06GcyIWdEeaD0gfPeRZU/values/DAILY REPORT!A:B?key=${API_KEY}`);
        const data = await response.json();
        
        if (!data.values || data.values.length <= 1) return;

        const cliNames = new Set();
        const cliLobbies = new Set();

        for (let i = 1; i < data.values.length; i++) {
            const row = data.values[i];
            if (row[0]) cliNames.add(row[0]);
            if (row[1]) cliLobbies.add(row[1]);
        }

        const sortedCliNames = Array.from(cliNames).sort();
        const sortedCliLobbies = Array.from(cliLobbies).sort();

        const cliNameSelect = document.getElementById('cliName');
        cliNameSelect.innerHTML = '<option value="" disabled selected>Select CLI Name</option>';
        sortedCliNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            cliNameSelect.appendChild(option);
        });
        cliNameSelect.insertAdjacentHTML('beforeend', '<option value="ALL">ALL</option>');

        const cliLobbySelect = document.getElementById('cliLobby');
        cliLobbySelect.innerHTML = '<option value="" disabled selected>Select CLI Lobby</option>';
        sortedCliLobbies.forEach(lobby => {
            const option = document.createElement('option');
            option.value = lobby;
            option.textContent = lobby;
            cliLobbySelect.appendChild(option);
        });
        cliLobbySelect.insertAdjacentHTML('beforeend', '<option value="ALL">ALL</option>');
    } catch (error) {
        console.error("Error populating dropdowns:", error);
    }
}

document.getElementById('dutyForm').addEventListener('submit', function(event) {
    event.preventDefault(); 
    
    const cliName = document.getElementById('cliName').value;
    const cliLobby = document.getElementById('cliLobby').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    fetchData(cliName, cliLobby, fromDate, toDate);
});

// ======================================================================================
// UPDATED FUNCTION: BETTER DATE PARSING FOR FORMULA BASED SHEETS
// ======================================================================================
async function fetchExternalSheetData(sheetUrl, fromDate, toDate, cliName, sheetName, columnConfig) {
    let doneCount = 0;
    let abnormalitySum = 0;
    
    try {
        const response = await fetch(sheetUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.values) {
            const startDate = new Date(fromDate);
            const endDate = new Date(toDate);
            
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            console.log(`[${sheetName}] Searching for dates between:`, startDate.toLocaleDateString(), 'AND', endDate.toLocaleDateString());

            for (let i = 1; i < data.values.length; i++) {
                const row = data.values[i];
                const originalTimestampStr = row[columnConfig.timestamp]; 
                
                if (!originalTimestampStr) continue;

                let timestamp;

                // 1. Try Standard JS Parsing first (Handles MM/DD/YYYY used by IMPORTRANGE)
                const nativeDate = new Date(originalTimestampStr);
                
                if (!isNaN(nativeDate.getTime())) {
                    timestamp = nativeDate;
                } else {
                    // 2. Fallback: Manual Parsing for DD/MM/YYYY if native fails
                    const dateTimeParts = originalTimestampStr.split(' ');
                    const dateParts = dateTimeParts[0].split('/');
                    
                    if (dateParts.length === 3) {
                        const day = parseInt(dateParts[0], 10);
                        const month = parseInt(dateParts[1], 10);
                        const year = parseInt(dateParts[2], 10);
                        timestamp = new Date(year, month - 1, day);
                    }
                }

                // If timestamp is still invalid, skip row
                if (!timestamp || isNaN(timestamp.getTime())) continue;

                const rowCliName = row[columnConfig.cliName]; 
                
                // Logic
                const dateMatches = timestamp >= startDate && timestamp <= endDate;
                const cliMatches = cliName === 'ALL' || rowCliName === cliName;
                
                if (dateMatches && cliMatches) {
                    doneCount++;
                    // Parse abnormality as integer safely
                    const abnValue = parseInt(row[columnConfig.abnormality], 10);
                    abnormalitySum += isNaN(abnValue) ? 0 : abnValue;
                }
            }
        }
        console.log(`[${sheetName}] Final Count:`, { done: doneCount, abnormality: abnormalitySum });
        return { done: doneCount, abnormality: abnormalitySum };
    } catch (error) {
        console.error(`Error fetching ${sheetName} data:`, error);
        alert(`Could not fetch data for ${sheetName}.`);
        return { done: 0, abnormality: 0 };
    }
}

// ======================================================================================
// UPDATED FUNCTION: CORRECT COLUMN INDEX FOR SPM (AO = 40)
// ======================================================================================
async function fetchData(cliName, cliLobby, fromDate, toDate) {
    try {
        // Define column configurations for each sheet
        
        // SPM UPDATED: abnormality is now at Index 40 (Column AO)
        // timestamp: A (0), cliName: T (19), abnormality: AO (40)
        const spmColumns = { timestamp: 0, cliName: 19, abnormality: 40 }; 
        
        const cvvrsColumns = { timestamp: 0, cliName: 2, abnormality: 18 }; // B=0, D=2, T=18

        const [mainDataResponse, spmData, cvvrsData] = await Promise.all([
            fetch(MAIN_REPORT_URL),
            fetchExternalSheetData(SPM_SHEET_URL, fromDate, toDate, cliName, 'SPM', spmColumns),
            fetchExternalSheetData(CVVRS_SHEET_URL, fromDate, toDate, cliName, 'CVVRS', cvvrsColumns)
        ]);

        const mainData = await mainDataResponse.json();
        const filteredData = mainData.values ? mainData.values.filter(row => {
            const rowDate = new Date(row[2]);
            if (isNaN(rowDate.getTime())) return false;
            const cliNameMatches = cliName === 'ALL' || row[0] === cliName;
            const cliLobbyMatches = cliLobby === 'ALL' || row[1] === cliLobby;
            const dateMatches = rowDate >= new Date(fromDate) && rowDate <= new Date(new Date(toDate).setHours(23,59,59,999));
            return cliNameMatches && cliLobbyMatches && dateMatches;
        }) : [];

        displayData(filteredData, spmData, cvvrsData);
    } catch (error) {
        console.error("Error during data fetching:", error);
    }
}

function displayData(filteredData, spmData, cvvrsData) {
    const tableBody = document.getElementById('reportFormBody');
    tableBody.innerHTML = '';

    const parameters = {
        'FOOTPLATE DURING WEE HOURS': 3, 'FOOTPLATE EXCLUDING WEE HOURS': 5,
        'SPECIAL FOOTPLATE': 7, 'AUTO AND IB AMBUSH(NO OF TRAINS)': 8,
        'LEVEL CROSSING AMBUSH(NO OF TRAINS)': 10, 'CD ZONES AMBUSH(NO OF TRAINS)': 12,
        'BA AMBUSH(NO OF CREWS)': 14, 'SPEED GUN CHECKING(NO OF TRAINS)': 16,
        'COUNCELLING AT LOBBY CONCERNED TO SAFETY(NO OF CREWS)': 18,
        'SHUNTING PROCEDURE & RULES INVOLVED AS PER GR 5.13': 23,
        'COUNSELLING FOR PERSONAL SAFETY OF CREW': 24, 'LONG HOURS DUTY OF CREW': 25,
        'FAMILY/SAFETY SEMINAR': 26, 'RUNNING ROOM INSPECTION': 27,
        'LOBBY INSPECTION': 29
    };
    
    const abnormalityColumns = {
        'FOOTPLATE DURING WEE HOURS': 4, 'FOOTPLATE EXCLUDING WEE HOURS': 6,
        'AUTO AND IB AMBUSH(NO OF TRAINS)': 9, 'LEVEL CROSSING AMBUSH(NO OF TRAINS)': 11,
        'CD ZONES AMBUSH(NO OF TRAINS)': 13, 'BA AMBUSH(NO OF CREWS)': 15,
        'SPEED GUN CHECKING(NO OF TRAINS)': 17, 'RUNNING ROOM INSPECTION': 28,
        'LOBBY INSPECTION': 30
    };

    const allParametersInOrder = [
        'FOOTPLATE DURING WEE HOURS', 'FOOTPLATE EXCLUDING WEE HOURS', 'SPECIAL FOOTPLATE', 
        'AUTO AND IB AMBUSH(NO OF TRAINS)', 'LEVEL CROSSING AMBUSH(NO OF TRAINS)', 
        'CD ZONES AMBUSH(NO OF TRAINS)', 'BA AMBUSH(NO OF CREWS)', 'SPEED GUN CHECKING(NO OF TRAINS)', 
        'COUNCELLING AT LOBBY CONCERNED TO SAFETY(NO OF CREWS)', 'CVVRS ANALYSIS(NO OF TRAINS)', 
        'SPM ANALYSIS(NO OF TRAINS)', 'SHUNTING PROCEDURE & RULES INVOLVED AS PER GR 5.13', 
        'COUNSELLING FOR PERSONAL SAFETY OF CREW', 'LONG HOURS DUTY OF CREW', 'FAMILY/SAFETY SEMINAR', 
        'RUNNING ROOM INSPECTION', 'LOBBY INSPECTION'
    ];

    const highlightParameters = ['FOOTPLATE DURING WEE HOURS', 'FOOTPLATE EXCLUDING WEE HOURS', 'CVVRS ANALYSIS(NO OF TRAINS)', 'SPM ANALYSIS(NO OF TRAINS)', 'RUNNING ROOM INSPECTION', 'LOBBY INSPECTION'];

    const total = {};
    const abnormalities = {};

    allParametersInOrder.forEach(param => {
        total[param] = 0;
        abnormalities[param] = 0;
    });

    filteredData.forEach(row => {
        for (const param in parameters) {
            total[param] += parseInt(row[parameters[param]], 10) || 0;
        }
        for (const param in abnormalityColumns) {
            abnormalities[param] += parseInt(row[abnormalityColumns[param]], 10) || 0;
        }
    });

    // Insert external data
    total['SPM ANALYSIS(NO OF TRAINS)'] = spmData.done;
    abnormalities['SPM ANALYSIS(NO OF TRAINS)'] = spmData.abnormality;
    total['CVVRS ANALYSIS(NO OF TRAINS)'] = cvvrsData.done;
    abnormalities['CVVRS ANALYSIS(NO OF TRAINS)'] = cvvrsData.abnormality;
    
    const totalDone = Object.values(total).reduce((sum, val) => sum + val, 0);
    const totalAbnormalities = Object.values(abnormalities).reduce((sum, val) => sum + val, 0);

    allParametersInOrder.forEach(param => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = param;
        row.insertCell().textContent = total[param] || '0';
        row.insertCell().textContent = abnormalities[param] || '0';
        if (highlightParameters.includes(param)) {
            row.style.backgroundColor = 'lightgreen';
        }
    });

    const totalRow = tableBody.insertRow();
    totalRow.style.fontWeight = 'bold';
    totalRow.style.backgroundColor = 'yellow';
    totalRow.insertCell().textContent = 'TOTAL';
    totalRow.insertCell().textContent = totalDone;
    totalRow.insertCell().textContent = totalAbnormalities;

    document.getElementById('reportForm').style.border = '2px solid black';

    renderBarChart(total);
    renderPieChart(abnormalities);
}

function renderBarChart(total) {
    const ctx = document.getElementById('barGraphCanvas').getContext('2d');
    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, {
        type: 'bar', data: { labels: Object.keys(total), datasets: [{ label: 'Total Done', data: Object.values(total), backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 }] },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
}

function renderPieChart(abnormalities) {
    const ctx = document.getElementById('pieChartCanvas').getContext('2d');
    if (pieChart) pieChart.destroy();
    const chartLabels = Object.keys(abnormalities).filter(key => abnormalities[key] > 0);
    const chartData = chartLabels.map(key => abnormalities[key]);
    pieChart = new Chart(ctx, {
        type: 'pie', data: { labels: chartLabels, datasets: [{ label: 'Abnormalities', data: chartData, backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)'], borderWidth: 1 }] },
        options: { responsive: true }
    });
}

function printReport() {
    const reportForm = document.getElementById('reportForm');
    const cliName = document.getElementById('cliName').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const newWindow = window.open('', '', 'width=800,height=600');
    newWindow.document.write(`<html><head><title>Print Report</title><style>body { font-family: Arial, sans-serif; } table { width: 100%; border-collapse: collapse; } table, th, td { border: 1px solid black; } th, td { padding: 8px; text-align: left; } tr:last-child { font-weight: bold; background-color: yellow; }</style></head><body><h1>DAILY REPORT ANALYSIS of ${cliName} from ${fromDate} to ${toDate}</h1>${reportForm.outerHTML}</body></html>`);
    newWindow.document.close();
    newWindow.onload = () => newWindow.print();
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const { autoTable } = jsPDF;
    const pdf = new jsPDF();
    const cliName = document.getElementById('cliName').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    pdf.setFontSize(16);
    pdf.text(`DAILY REPORT ANALYSIS of ${cliName} from ${fromDate} to ${toDate}`, 14, 15);
    pdf.autoTable({ html: '#reportForm', startY: 25, styles: { font: 'helvetica', fontSize: 10 }, headStyles: { fillColor: [0, 123, 255] },
        didParseCell: function(data) {
            if (data.row.index === data.table.body.length - 1) {
                data.row.styles.fillColor = [255, 255, 0];
                data.row.styles.fontStyle = 'bold';
            }
        }
    });
    pdf.save('report.pdf');
}
