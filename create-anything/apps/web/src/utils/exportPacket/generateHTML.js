import { format, parseISO } from "date-fns";

export function generateHTML({
  title,
  nickname,
  user,
  currentCase,
  planItems,
  uploads,
  selectedUploadIds,
  includeSections,
  notes,
  autoSummary,
  dateRange,
}) {
  const today = format(new Date(), "MMMM d, yyyy");

  // Group Plan Items
  const itemsByCategory = planItems.reduce((acc, item) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Group Uploads by tag and create lookup by plan_item_id
  const uploadsByTag = uploads.reduce((acc, file) => {
    const tag = file.tag || "Uncategorized";
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(file);
    return acc;
  }, {});

  const uploadsByPlanItem = {};
  uploads.forEach((file) => {
    if (file.plan_item_id) {
      if (!uploadsByPlanItem[file.plan_item_id]) {
        uploadsByPlanItem[file.plan_item_id] = [];
      }
      uploadsByPlanItem[file.plan_item_id].push(file);
    }
  });

  const planItemLookup = {};
  planItems.forEach((item) => {
    planItemLookup[item.id] = item;
  });

  const selectedFiles = uploads.filter((u) => selectedUploadIds.has(u.id));

  // Build Table of Contents
  const tocSections = [];
  let sectionNumber = 1;
  if (includeSections.summary)
    tocSections.push({ num: sectionNumber++, title: "Case Summary" });
  if (includeSections.notes)
    tocSections.push({
      num: sectionNumber++,
      title: "Weekly Summary & Notes",
    });
  if (includeSections.checklist)
    tocSections.push({
      num: sectionNumber++,
      title: "Weekly Plan Checklist",
    });
  if (includeSections.uploadIndex)
    tocSections.push({ num: sectionNumber++, title: "Document Index" });
  if (selectedFiles.length > 0)
    tocSections.push({ num: sectionNumber++, title: "Attached Documents" });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap');
        
        * { box-sizing: border-box; }
        body { 
          font-family: 'Inter', sans-serif; 
          color: #111; 
          line-height: 1.6; 
          margin: 0; 
          padding: 40px 60px; 
          font-size: 11pt;
        }
        h1, h2, h3 { font-family: 'Instrument Serif', serif; font-weight: normal; }
        h1 { font-size: 28pt; margin-bottom: 8pt; }
        h2 { 
          font-size: 18pt; 
          border-bottom: 2pt solid #ddd; 
          padding-bottom: 8pt; 
          margin-top: 24pt; 
          margin-bottom: 16pt; 
          page-break-after: avoid;
        }
        h3 { 
          font-size: 14pt; 
          font-weight: 600; 
          font-family: 'Inter', sans-serif; 
          margin-top: 16pt; 
          margin-bottom: 8pt; 
          color: #444; 
        }
        
        .cover-page { 
          text-align: center; 
          padding-top: 200pt; 
          page-break-after: always; 
        }
        .cover-title { font-size: 36pt; margin-bottom: 16pt; line-height: 1.2; }
        .cover-meta { color: #666; font-size: 11pt; margin-bottom: 4pt; }
        .confidential { 
          margin-top: 80pt; 
          font-size: 9pt; 
          color: #888; 
          text-transform: uppercase; 
          letter-spacing: 1pt; 
          border-top: 1pt solid #ddd;
          padding-top: 16pt;
        }
        
        .toc-page {
          page-break-after: always;
          padding-top: 40pt;
        }
        .toc-title {
          font-size: 24pt;
          font-family: 'Instrument Serif', serif;
          margin-bottom: 24pt;
          border-bottom: 2pt solid #ddd;
          padding-bottom: 12pt;
        }
        .toc-item {
          display: flex;
          justify-content: space-between;
          padding: 8pt 0;
          border-bottom: 1pt dotted #ddd;
        }
        .toc-item span:first-child {
          font-weight: 500;
        }
        
        .section { margin-bottom: 24pt; page-break-inside: avoid; }
        .grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 16pt; 
          margin-bottom: 16pt;
        }
        .card { 
          background: #f9f9f9; 
          padding: 12pt; 
          border-radius: 6pt; 
          border: 1pt solid #eee; 
        }
        .label { 
          font-size: 9pt; 
          color: #666; 
          text-transform: uppercase; 
          margin-bottom: 4pt; 
          font-weight: 500;
          letter-spacing: 0.5pt;
        }
        .value { font-size: 12pt; font-weight: 500; }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 10pt; 
          margin-bottom: 16pt;
        }
        th { 
          text-align: left; 
          border-bottom: 2pt solid #333; 
          padding: 8pt 6pt; 
          color: #111; 
          font-weight: 600;
          background: #f5f5f5;
        }
        td { 
          border-bottom: 1pt solid #eee; 
          padding: 8pt 6pt; 
          vertical-align: top; 
        }
        .status-completed { 
          color: #059669; 
          font-weight: 600; 
        }
        .status-pending { 
          color: #d97706; 
        }
        
        .page-footer { 
          position: fixed; 
          bottom: 20pt; 
          left: 0; 
          right: 0; 
          font-size: 8pt; 
          color: #999; 
          text-align: center; 
          padding: 8pt 0; 
          border-top: 1pt solid #eee;
        }
        
        .embedded-file { 
          page-break-before: always; 
          text-align: center; 
        }
        .embedded-img { 
          max-width: 100%; 
          max-height: 700pt; 
          object-fit: contain; 
        }
        .caption { 
          margin-top: 8pt; 
          font-style: italic; 
          color: #666; 
          font-size: 9pt;
        }

        @media print {
          .page-footer::after {
            content: counter(page);
          }
        }
      </style>
    </head>
    <body>
      <div class="page-footer">
        Page <span class="page-number"></span> • Generated ${today} • Reunify • Confidential
      </div>

      <!-- Cover Page -->
      <div class="cover-page">
        <h1 class="cover-title">${title}</h1>
        <div class="cover-meta">Case: ${nickname}</div>
        <div class="cover-meta">State: ${currentCase.state}</div>
        ${user?.name ? `<div class="cover-meta">Prepared by: ${user.name}</div>` : ""}
        <div class="cover-meta">Generated: ${today}</div>
        
        <div class="confidential">
          Confidential • For Personal Organization • Not Legal Advice
        </div>
      </div>

      <!-- Table of Contents -->
      <div class="toc-page">
        <div class="toc-title">Table of Contents</div>
        ${tocSections
          .map(
            (sec) => `
          <div class="toc-item">
            <span>${sec.num}. ${sec.title}</span>
            <span>Page ${sec.num + 1}</span>
          </div>
        `,
          )
          .join("")}
      </div>

      ${
        includeSections.summary
          ? `
      <div class="section">
        <h2>1. Case Summary</h2>
        <div class="grid">
          <div class="card">
            <div class="label">Current Stage</div>
            <div class="value">${currentCase.stage || "Not set"}</div>
          </div>
          <div class="card">
            <div class="label">Next Hearing</div>
            <div class="value">${currentCase.next_court_date ? format(parseISO(currentCase.next_court_date), "MMMM d, yyyy") : "Not scheduled"}</div>
          </div>
          <div class="card">
            <div class="label">Identified Risk Factors</div>
            <div class="value">${currentCase.risks?.join(", ") || "None listed"}</div>
          </div>
          <div class="card">
            <div class="label">State</div>
            <div class="value">${currentCase.state}</div>
          </div>
        </div>
        ${
          currentCase.notes
            ? `
        <div style="margin-top: 16pt;">
          <div class="label">Case Requirements & Notes</div>
          <div class="card" style="background: white; border: 1pt solid #ddd; margin-top: 8pt;">
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.5;">${currentCase.notes}</p>
          </div>
        </div>`
            : ""
        }
      </div>
      `
          : ""
      }

      ${
        includeSections.notes
          ? `
      <div class="section">
        <h2>2. Weekly Summary & Notes</h2>
        
        <h3>Auto-Generated Summary</h3>
        <div class="card" style="background: #f0f9ff; border: 1pt solid #bae6fd;">
          <p style="margin: 0; line-height: 1.6;">${autoSummary}</p>
        </div>

        ${
          notes
            ? `
        <h3 style="margin-top: 16pt;">Additional Notes for Court</h3>
        <div class="card" style="background: white; border: 1pt solid #ddd;">
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${notes}</p>
        </div>
        `
            : ""
        }
      </div>
      `
          : ""
      }

      ${
        includeSections.checklist
          ? `
      <div class="section">
        <h2>3. Weekly Plan Checklist</h2>
        <p style="color: #666; font-size: 10pt; margin-bottom: 16pt;">
          Tasks ${includeSections.completedOnly ? "completed" : "tracked"} during this reporting period (${dateRange === "all" ? "all time" : `last ${dateRange} days`}).
        </p>
        ${Object.entries(itemsByCategory)
          .map(
            ([category, items]) => `
          <h3>${category}</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 35%">Task</th>
                <th style="width: 15%">Status</th>
                <th style="width: 35%">Proof Needed</th>
                <th style="width: 15%">Completed</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>${item.title}</td>
                  <td class="${item.status === "completed" ? "status-completed" : "status-pending"}">
                    ${item.status === "completed" ? "✓ Completed" : "Pending"}
                  </td>
                  <td>${item.proof_needed || "—"}</td>
                  <td>${item.status === "completed" && item.updated_at ? format(parseISO(item.updated_at), "MM/dd/yy") : "—"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        `,
          )
          .join("")}
      </div>
      `
          : ""
      }

      ${
        includeSections.uploadIndex
          ? `
      <div class="section">
        <h2>4. Document Index</h2>
        <p style="color: #666; font-size: 10pt; margin-bottom: 16pt;">
          All documents uploaded and tracked in the system.
        </p>
        ${Object.entries(uploadsByTag)
          .map(
            ([tag, files]) => `
          <h3>${tag.charAt(0).toUpperCase() + tag.slice(1).replace(/_/g, " ")}</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 25%">Date</th>
                <th style="width: 35%">File Name</th>
                <th style="width: 25%">Related Task</th>
                <th style="width: 15%">Attached</th>
              </tr>
            </thead>
            <tbody>
              ${files
                .map((file) => {
                  const relatedTask =
                    file.plan_item_id && planItemLookup[file.plan_item_id]
                      ? planItemLookup[file.plan_item_id].title
                      : "—";
                  return `
                <tr>
                  <td>${format(parseISO(file.created_at), "MMM d, yyyy")}</td>
                  <td style="font-size: 9pt;">${file.tag === "exported_packet" ? "Court Packet (Previous)" : file.file_url.split("/").pop()?.substring(0, 40) || "Document"}</td>
                  <td style="font-size: 9pt;">${relatedTask}</td>
                  <td>${selectedUploadIds.has(file.id) ? "Yes (Below)" : "No"}</td>
                </tr>
              `;
                })
                .join("")}
            </tbody>
          </table>
        `,
          )
          .join("")}
      </div>
      `
          : ""
      }

      <!-- Embedded Files -->
      ${
        selectedFiles.length > 0
          ? `
        <div class="section">
          <h2>5. Attached Documents</h2>
          <p style="color: #666; font-size: 10pt; margin-bottom: 16pt;">
            Selected documents embedded for review.
          </p>
          ${selectedFiles
            .map((file) => {
              const isImage = file.file_url.match(/\.(jpeg|jpg|png|webp)$/i);
              const relatedTask =
                file.plan_item_id && planItemLookup[file.plan_item_id]
                  ? planItemLookup[file.plan_item_id].title
                  : null;
              if (isImage) {
                return `
                 <div class="embedded-file">
                   <img src="${file.file_url}" class="embedded-img" alt="Document" />
                   <div class="caption">
                     ${file.tag.replace(/_/g, " ")} ${relatedTask ? `• ${relatedTask}` : ""} • Uploaded ${format(parseISO(file.created_at), "MMMM d, yyyy")}
                   </div>
                 </div>
               `;
              } else {
                return `
                 <div class="embedded-file" style="display: flex; align-items: center; justify-content: center; min-height: 300pt; border: 2pt dashed #ccc; margin: 20pt 0; background: #fafafa;">
                   <div style="text-align: center; padding: 24pt;">
                     <div style="font-size: 48pt; color: #ddd; margin-bottom: 16pt;">📄</div>
                     <p style="font-weight: 600; margin-bottom: 8pt;">${file.file_url.split("/").pop()}</p>
                     <p class="caption" style="margin-bottom: 4pt;">${file.tag.replace(/_/g, " ")} ${relatedTask ? `• ${relatedTask}` : ""}</p>
                     <p class="caption">This document type cannot be previewed. Access via the secure portal.</p>
                     <p style="font-size: 8pt; color: #999; margin-top: 12pt; word-break: break-all;">${file.file_url}</p>
                   </div>
                 </div>
               `;
              }
            })
            .join("")}
        </div>
      `
          : ""
      }

      <script>
        // Add page numbers dynamically
        const pageNumbers = document.querySelectorAll('.page-number');
        pageNumbers.forEach((el, idx) => {
          el.textContent = idx + 1;
        });
      </script>
    </body>
    </html>
  `;
}
