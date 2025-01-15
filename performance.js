async function fetchData() {
  const month = document.getElementById("month").value;
  const year = document.getElementById("year").value;
  const parameter = document.getElementById("parameter").value;

  const primarySheetId = "1Pn0sosMuxX2XZYRe9qIvkGM06GcyIWdEeaD0gfPeRZU";
  const primarySheetName = "DAILY REPORT";
  const secondarySheetId = "1mtFaqe5gLIRYeC7wv6sj7DOv42mQvgDYd9EmV33P5yI";
  const secondarySheetName = "OTHER DUTY";
  const apiKey = "AIzaSyAw23pJz0K9fZb2rRRAe2C2cJDilRc0Kac";

  const primaryUrl = `https://sheets.googleapis.com/v4/spreadsheets/${primarySheetId}/values/${primarySheetName}?key=${apiKey}`;
  const secondaryUrl = `https://sheets.googleapis.com/v4/spreadsheets/${secondarySheetId}/values/${secondarySheetName}?key=${apiKey}`;

  const primaryResponse = await fetch(primaryUrl);
  const primaryData = await primaryResponse.json();

  const secondaryResponse = await fetch(secondaryUrl);
  const secondaryData = await secondaryResponse.json();

  const primaryRows = primaryData.values || [];
  const secondaryRows = secondaryData.values || [];

  const tableBody = document.getElementById("reportTable").querySelector("tbody");
  tableBody.innerHTML = "";

  const selectedMonth = new Date(`${month} 1, ${year}`).getMonth();
  const selectedYear = parseInt(year, 10);

  const excludedCliNames = [
    "AJAY KUMAR/BSP", "ABDUL SAMAD GHAURI/PND", "H.N.NAYAK/RIG", "RAVINDRA KUMAR SWARNKAR/USL", "CLI NAME/CLI LOBBY"
  ];

  const cliMap = {};

  // Initialize the cliMap with keys for each CLI NAME/LOBBY combination (except for excluded names)
  primaryRows.forEach(row => {
    const [cliName, cliLobby, date, ...values] = row;
    if (cliName && cliLobby) {
      const cliKey = `${cliName}/${cliLobby}`;
      if (!excludedCliNames.includes(cliKey)) {  // Exclude specific CLI names
        if (!cliMap[cliKey]) {
          cliMap[cliKey] = Array(31).fill("");  // Initialize with empty strings instead of nulls
        }
      }
    }
  });

  secondaryRows.forEach(row => {
    const [cliName, cliLobby, dutyType, date] = row;
    if (cliName && cliLobby) {
      const cliKey = `${cliName}/${cliLobby}`;
      if (!excludedCliNames.includes(cliKey)) {  // Exclude specific CLI names
        if (!cliMap[cliKey]) {
          cliMap[cliKey] = Array(31).fill("");  // Initialize with empty strings if not already in cliMap
        }
      }
    }
  });

  // Populate data for the selected month
  const selectedParameterIndex = {
    FOOTPLATE_DURING_WEE_HOURS: 3,
    FOOTPLATE_EXCLUDING_WEE_HOURS: 5,
    AUTO_AND_IB_AMBUSH: 8,
    LEVEL_CROSSING_AMBUSH: 10,
    CD_ZONES_AMBUSH: 12,
    BA_AMBUSH: 14,
    SPEED_GUN_CHECKING: 16,
    CVVRS_ANALYSIS: 19,
    SPM_ANALYSIS: 21,
    FAMILY_SAFETY_SEMINAR: 26,
    RUNNING_ROOM_INSPECTION: 27,
    LOBBY_INSPECTION: 29,
  }[parameter];

  const dateMap = {};

  if (parameter !== "ALL") {
    primaryRows.forEach(row => {
      const [cliName, cliLobby, date, ...values] = row;
      if (!date || !cliName || !cliLobby || !values[selectedParameterIndex - 3]) return;

      const entryDate = new Date(date);
      if (entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear) {
        const day = entryDate.getDate();
        const cliKey = `${cliName}/${cliLobby}`;

        if (!dateMap[cliKey]) {
          dateMap[cliKey] = Array(31).fill("");  // Initialize with empty strings instead of nulls
        }
        const value = parseInt(values[selectedParameterIndex - 3]) || 0;
        dateMap[cliKey][day - 1] = value > 0 ? value : "";  // Only show if greater than 0
      }
    });

    // Show rows for selected parameter
    let grandTotalSum = 0;
    let columnTotals = Array(31).fill(0);

    Object.keys(dateMap).sort().forEach(cliKey => {
      const counts = dateMap[cliKey];
      const rowTotal = counts.reduce((sum, count) => sum + (count || 0), 0);
      grandTotalSum += rowTotal;

      counts.forEach((count, index) => {
        columnTotals[index] += count || 0;
      });

      let rowHtml = `<tr>
        <td>${cliKey}</td>
        ${counts.map(count => `<td>${count !== "" ? count : ""}</td>`).join("")}
        <td style="font-weight: bold;">${rowTotal}</td>
      </tr>`;

      tableBody.innerHTML += rowHtml;
    });

    // Grand total row for selected parameter
    let footerHtml = `<tr style="font-weight: bold; background-color: #f4f4f4;">
      <td>Grand Total</td>`;

    columnTotals.forEach(total => {
      footerHtml += `<td>${total}</td>`;
    });

    footerHtml += `<td>${grandTotalSum}</td></tr>`;
    tableBody.innerHTML += footerHtml;

    return;
  }

  // Process dates and duty types for all rows
  primaryRows.forEach(row => {
    const [cliName, cliLobby, date] = row;
    const entryDate = new Date(date);
    if (cliName && cliLobby) {
      const cliKey = `${cliName}/${cliLobby}`;
      if (!excludedCliNames.includes(cliKey)) {  // Exclude specific CLI names
        if (!dateMap[cliKey]) {
          dateMap[cliKey] = Array(31).fill(""); // Initialize with empty strings instead of nulls
        }
        if (entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear) {
          const day = entryDate.getDate();
          dateMap[cliKey][day - 1] = "SB"; // Set to SB for the selected month (Submitted)
        }
      }
    }
  });

  // Process secondary sheet (for all CLI NAME/LOBBY combinations)
  secondaryRows.forEach(row => {
    const [cliName, cliLobby, dutyType, date] = row;
    const entryDate = new Date(date);
    if (cliName && cliLobby) {
      const cliKey = `${cliName}/${cliLobby}`;
      if (!excludedCliNames.includes(cliKey)) {  // Exclude specific CLI names
        if (!dateMap[cliKey]) {
          dateMap[cliKey] = Array(31).fill(""); // Initialize with empty strings instead of nulls
        }
        if (entryDate.getMonth() === selectedMonth && entryDate.getFullYear() === selectedYear) {
          const day = entryDate.getDate();
          // Check if "training" is in the duty type and replace with "TR"
          if (dutyType.toLowerCase().includes("training")) {
            dateMap[cliKey][day - 1] = "TR"; // Training
          } else if (dutyType.toLowerCase() === "leave" || dutyType.toLowerCase() === "rest") {
            dateMap[cliKey][day - 1] = "LV"; // Leave or Rest
          } else {
            dateMap[cliKey][day - 1] = "OD"; // Other Duty
          }
        }
      }
    }
  });

  // Fill missing dates with PN (Pending)
  Object.keys(dateMap).forEach(cliKey => {
    dateMap[cliKey] = dateMap[cliKey].map(value => value || "PN");  // Fill with "PN" if empty
  });

  const grandTotal = Array(31).fill(0);
  let grandTotalSum = 0;

  // Show rows for ALL parameter
  let columnTotals = Array(31).fill(0);

  // Sort rows by CLI LOBBY (second part of CLI NAME/CLI LOBBY format)
Object.keys(dateMap)
.sort((a, b) => {
  // Extract CLI LOBBY from the keys
  const aLobby = a.split('/')[1]; // Get CLI LOBBY from "CLI NAME/CLI LOBBY"
  const bLobby = b.split('/')[1]; // Get CLI LOBBY from "CLI NAME/CLI LOBBY"
  return aLobby.localeCompare(bLobby); // Compare based on CLI LOBBY alphabetically
})
.forEach(cliKey => {
  const statuses = dateMap[cliKey];
  const rowTotal = statuses.filter(status => status === "SB").length;

  statuses.forEach((status, index) => {
    if (status === "SB") grandTotal[index]++;
    columnTotals[index] += (status === "SB" ? 1 : 0);
  });

  grandTotalSum += rowTotal;

  let rowHtml = `<tr>
    <td>${cliKey}</td>`; // Display CLI NAME/CLI LOBBY as is

  statuses.forEach((status, index) => {
    let statusStyle = "";
    // Status Descriptions:
    // "PN" = Pending, "SB" = Submitted, "OD" = Other Duty, "TR" = Training, "LV" = Leave/Rest
    if (status === "SB") {
      statusStyle = "background-color: green; color: white;";
    } else if (status === "LV") {
      statusStyle = "background-color: yellow; color: black;";
    } else if (status === "OD") {
      statusStyle = "background-color: purple; color: white;";
    } else if (status === "TR") {
      statusStyle = "background-color: orange; color: black;";
    } else {
      statusStyle = "background-color: red; color: black;";  // "PN" case
    }
    rowHtml += `<td style="${statusStyle}">${status !== "" ? status : ""}</td>`;
  });

  rowHtml += `<td style="font-weight: bold;">${rowTotal}</td></tr>`;
  tableBody.innerHTML += rowHtml;
});


  // Footer with grand totals
  let footerHtml = `<tr style="font-weight: bold; background-color: #f4f4f4;">
    <td>Grand Total</td>`;

  columnTotals.forEach(total => {
    footerHtml += `<td>${total}</td>`;
  });

  footerHtml += `<td>${grandTotalSum}</td></tr>`;
  tableBody.innerHTML += footerHtml;
}
function downloadExcel() {
  // Get the table element
  const table = document.getElementById('reportTable');

  // Convert the table to a worksheet
  const workbook = XLSX.utils.table_to_book(table, { sheet: "Report" });

  // Export the workbook to Excel
  XLSX.writeFile(workbook, 'Daily_Report.xlsx');
}