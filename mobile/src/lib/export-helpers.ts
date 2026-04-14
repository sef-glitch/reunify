import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Task, Case, Document, Evidence } from './auth-context';

// ==================== CSV EXPORT ====================

/**
 * Exports tasks to a CSV file and shares it
 */
export async function exportTasksToCSV(
  tasks: Task[],
  cases: Case[],
  options?: { caseId?: string; includeCompleted?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Filter tasks
    let filteredTasks = tasks;
    if (options?.caseId) {
      filteredTasks = filteredTasks.filter((t) => t.caseId === options.caseId);
    }
    if (!options?.includeCompleted) {
      filteredTasks = filteredTasks.filter((t) => t.status !== 'completed');
    }

    // Get case name helper
    const getCaseName = (caseId: string) =>
      cases.find((c) => c.id === caseId)?.name || 'Unknown';

    // Generate CSV content
    const headers = ['Title', 'Description', 'Case', 'Priority', 'Status', 'Due Date', 'Created', 'Completed'];
    const rows = filteredTasks.map((task) => [
      escapeCSV(task.title),
      escapeCSV(task.description),
      escapeCSV(getCaseName(task.caseId)),
      task.priority,
      task.status,
      task.dueDate ? formatDateForCSV(task.dueDate) : '',
      formatDateForCSV(task.createdAt),
      task.completedAt ? formatDateForCSV(task.completedAt) : '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    // Write to file
    const filename = `reunify_tasks_${new Date().toISOString().split('T')[0]}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Tasks',
        UTI: 'public.comma-separated-values-text',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Export tasks error:', error);
    return { success: false, error: 'Failed to export tasks' };
  }
}

// ==================== COURT PACKET PDF EXPORT ====================

interface CourtPacketOptions {
  caseId: string;
  caseName: string;
  selectedDocumentIds: string[];
  selectedEvidenceIds: string[];
  includeEvidenceList: boolean;
}

/**
 * Generates a court packet combining selected documents and evidence list
 * Note: Since expo-print can't generate complex PDFs with images, this creates
 * a text-based document. For production, you'd use a native PDF library.
 */
export async function generateCourtPacket(
  documents: Document[],
  evidence: Evidence[],
  cases: Case[],
  options: CourtPacketOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const caseInfo = cases.find((c) => c.id === options.caseId);
    const selectedDocs = documents.filter((d) => options.selectedDocumentIds.includes(d.id));
    const selectedEvidence = evidence.filter((e) => options.selectedEvidenceIds.includes(e.id));

    // Build HTML content for the court packet
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Court Packet - ${escapeHTML(options.caseName)}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; margin: 40px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0; color: #666; }
    .section { margin: 30px 0; page-break-inside: avoid; }
    .section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
    .document { margin: 20px 0; padding: 15px; border: 1px solid #ddd; background: #f9f9f9; }
    .document-title { font-weight: bold; margin-bottom: 10px; }
    .document-meta { font-size: 12px; color: #666; margin-bottom: 10px; }
    .document-content { white-space: pre-wrap; font-size: 14px; }
    .evidence-list { margin-top: 20px; }
    .evidence-item { padding: 10px; border-bottom: 1px solid #eee; }
    .evidence-item:last-child { border-bottom: none; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>COURT PACKET</h1>
    <p><strong>Case:</strong> ${escapeHTML(options.caseName)}</p>
    ${caseInfo ? `<p><strong>Location:</strong> ${escapeHTML(caseInfo.county)}, ${escapeHTML(caseInfo.state)}</p>` : ''}
    <p><strong>Prepared:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="section">
    <div class="section-title">TABLE OF CONTENTS</div>
    <table>
      <tr><th>Item</th><th>Type</th><th>Page</th></tr>
      ${selectedDocs.map((doc, i) => `<tr><td>${i + 1}. ${escapeHTML(doc.title)}</td><td>Document</td><td>-</td></tr>`).join('')}
      ${options.includeEvidenceList ? '<tr><td>Evidence Index</td><td>List</td><td>-</td></tr>' : ''}
    </table>
  </div>
`;

    // Add selected documents
    if (selectedDocs.length > 0) {
      htmlContent += '<div class="section"><div class="section-title">DOCUMENTS</div>';
      for (const doc of selectedDocs) {
        htmlContent += `
        <div class="document">
          <div class="document-title">${escapeHTML(doc.title)}</div>
          <div class="document-meta">Category: ${doc.category} | Last Updated: ${formatDateForDisplay(doc.updatedAt)}</div>
          <div class="document-content">${escapeHTML(doc.content)}</div>
        </div>
        `;
      }
      htmlContent += '</div>';
    }

    // Add evidence list
    if (options.includeEvidenceList && selectedEvidence.length > 0) {
      htmlContent += `
      <div class="section">
        <div class="section-title">EVIDENCE INDEX</div>
        <table>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Type</th>
            <th>Date Added</th>
            <th>Tags</th>
            <th>Notes</th>
          </tr>
          ${selectedEvidence.map((ev, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHTML(ev.title)}</td>
              <td>${ev.type}</td>
              <td>${formatDateForDisplay(ev.createdAt)}</td>
              <td>${ev.tags.join(', ')}</td>
              <td>${escapeHTML(ev.notes).substring(0, 100)}${ev.notes.length > 100 ? '...' : ''}</td>
            </tr>
          `).join('')}
        </table>
        <p><em>Note: Actual evidence files are stored separately and should be provided with this packet.</em></p>
      </div>
      `;
    }

    htmlContent += `
  <div class="footer">
    <p>Generated by Reunify | ${new Date().toISOString()}</p>
    <p>This document is for organizational purposes only. Consult with your attorney before submitting to court.</p>
  </div>
</body>
</html>
    `;

    // Generate PDF using expo-print
    const pdf = await Print.printToBase64Async({ html: htmlContent, base64: true });

    // Write PDF to file
    const filename = `court_packet_${options.caseName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, pdf, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Court Packet',
        UTI: 'com.adobe.pdf',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Generate court packet error:', error);
    return { success: false, error: 'Failed to generate court packet' };
  }
}

// ==================== HELPERS ====================

function escapeCSV(str: string): string {
  if (!str) return '';
  // If contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateForCSV(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US');
}

function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
