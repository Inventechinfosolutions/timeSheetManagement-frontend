import * as XLSX from "xlsx";

/**
 * Opens an Excel file (.xlsx, .xls, .csv) in a new browser window/tab with a full-page interactive spreadsheet viewer.
 */
export const openExcelInNewTab = async (
  source: Blob | File | ArrayBuffer,
  fileName: string = "Spreadsheet.xlsx"
) => {
  // Open the window immediately to prevent popup blockers
  const newTab = window.open("", "_blank");

  try {
    let arrayBuffer: ArrayBuffer;
    if (source instanceof ArrayBuffer) {
      arrayBuffer = source;
    } else if (typeof Blob !== "undefined" && source instanceof Blob) {
      arrayBuffer = await source.arrayBuffer();
    } else {
      throw new Error("Invalid file source provided");
    }

    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
      cellDates: true,
    });

    const sheetNames = workbook.SheetNames || [];
    if (sheetNames.length === 0) {
      throw new Error("Workbook has no sheets");
    }

    const sheetsHtml: string[] = [];
    sheetNames.forEach((sheetName, index) => {
      const ws = workbook.Sheets[sheetName];
      const html = XLSX.utils.sheet_to_html(ws, {
        id: `sheet-table-${index}`,
        editable: false,
      });
      sheetsHtml.push(`
        <div id="sheet-${index}" class="sheet-content ${index === 0 ? "active" : ""}">
          ${html}
        </div>
      `);
    });

    const tabsHtml = sheetNames
      .map(
        (name, index) => `
      <button class="sheet-tab ${index === 0 ? "active" : ""}" onclick="switchSheet(${index})">
        📊 ${escapeHtml(name)}
      </button>
    `
      )
      .join("");

    const htmlDocument = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(fileName)} - Spreadsheet Viewer</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: #f4f7fe;
            color: #1e293b;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          header {
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04);
            flex-shrink: 0;
            gap: 16px;
            flex-wrap: wrap;
          }
          .header-title {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .excel-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
          }
          .file-info h1 {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
          .file-info p {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }
          .actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .search-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f1f5f9;
            padding: 7px 14px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            transition: all 0.2s;
          }
          .search-bar:focus-within {
            border-color: #10b981;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
          }
          .search-bar input {
            border: none;
            background: transparent;
            outline: none;
            font-size: 13px;
            width: 220px;
            color: #1e293b;
          }
          .btn-action {
            background: #ffffff;
            color: #334155;
            border: 1px solid #cbd5e1;
            padding: 8px 16px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
          }
          .btn-action:hover {
            background: #f8fafc;
            border-color: #94a3b8;
          }
          .sheet-nav {
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            padding: 8px 24px;
            display: flex;
            gap: 8px;
            overflow-x: auto;
            flex-shrink: 0;
          }
          .sheet-tab {
            padding: 7px 16px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }
          .sheet-tab:hover {
            background: #e2e8f0;
          }
          .sheet-tab.active {
            background: #10b981;
            color: white;
            border-color: #10b981;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
          }
          .content-area {
            flex: 1;
            overflow: auto;
            padding: 20px 24px;
          }
          .sheet-content {
            display: none;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
            border: 1px solid #e2e8f0;
            overflow: auto;
            max-height: calc(100vh - 160px);
          }
          .sheet-content.active {
            display: block;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
          }
          tr:first-child {
            background: #f8fafc;
            font-weight: 700;
            color: #0f172a;
            position: sticky;
            top: 0;
            z-index: 2;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          }
          th, td {
            padding: 10px 16px;
            border: 1px solid #e2e8f0;
            white-space: nowrap;
          }
          tr:nth-child(even) {
            background-color: #fafbfd;
          }
          tr:hover td {
            background-color: #f1f5f9;
          }
        </style>
      </head>
      <body>
        <header>
          <div class="header-title">
            <div class="excel-icon">XLS</div>
            <div class="file-info">
              <h1>${escapeHtml(fileName)}</h1>
              <p>${sheetNames.length} Sheet(s) • Live Spreadsheet Viewer</p>
            </div>
          </div>
          <div class="actions">
            <div class="search-bar">
              <span>🔍</span>
              <input type="text" id="searchInput" placeholder="Search in active sheet..." oninput="filterTable()">
            </div>
            <button class="btn-action" onclick="window.print()">🖨️ Print</button>
          </div>
        </header>
        <div class="sheet-nav">
          ${tabsHtml}
        </div>
        <div class="content-area">
          ${sheetsHtml.join("")}
        </div>
        <script>
          function switchSheet(index) {
            document.querySelectorAll('.sheet-tab').forEach((t, i) => {
              t.classList.toggle('active', i === index);
            });
            document.querySelectorAll('.sheet-content').forEach((c, i) => {
              c.classList.toggle('active', i === index);
            });
            filterTable();
          }

          function filterTable() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const activeContent = document.querySelector('.sheet-content.active');
            if (!activeContent) return;
            const rows = activeContent.querySelectorAll('tr');
            rows.forEach((row, idx) => {
              if (idx === 0) return;
              const text = row.innerText.toLowerCase();
              if (!query || text.includes(query)) {
                row.style.display = '';
              } else {
                row.style.display = 'none';
              }
            });
          }
        </script>
      </body>
      </html>
    `;

    if (newTab) {
      newTab.document.open();
      newTab.document.write(htmlDocument);
      newTab.document.close();
    }
  } catch (error) {
    console.error("Failed to render spreadsheet in new window:", error);
    if (newTab) {
      newTab.document.write(`
        <div style="font-family:sans-serif;padding:40px;text-align:center;">
          <h2>Error Opening Spreadsheet</h2>
          <p style="color:#ef4444;margin-top:8px;">${(error as any)?.message || "Failed to load spreadsheet"}</p>
        </div>
      `);
    }
  }
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
