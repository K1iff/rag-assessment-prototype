import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// =========================================================================
// 1. CSV EXPORT ENGINE (Zero external dependencies)
// =========================================================================

export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) {
    console.warn('No data available to export to CSV.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let val = row[header] ?? '';
          if (typeof val === 'string') {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =========================================================================
// 2. EXCEL (XLSX) EXPORT ENGINE (Multi-Sheet Support)
// =========================================================================

export interface SheetDefinition {
  sheetName: string;
  data: Record<string, any>[];
}

export function exportToXLSX(filename: string, sheets: SheetDefinition[]): void {
  if (!sheets || sheets.length === 0) {
    console.warn('No sheet data provided for Excel export.');
    return;
  }

  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName.slice(0, 31)); // 31-char Excel limit
  });

  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

// =========================================================================
// 3. PDF REPORT GENERATOR: ITEM ANALYSIS AUDIT
// =========================================================================

export interface ItemAnalysisReportData {
  examTitle: string;
  subject: string;
  cohortName: string;
  generatedDate: string;
  metrics: {
    totalExaminees: number;
    totalItems: number;
    kr20Reliability: number;
    meanFacilityIndex: number;
    meanDiscriminationIndex: number;
  };
  items: {
    itemNumber: number;
    questionText: string;
    domain: string;
    competency: string;
    facilityIndex: number;
    discriminationIndex: number;
    status: string;
  }[];
}

export function exportItemAnalysisPDF(filename: string, data: ItemAnalysisReportData): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

  // 1. Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 792, 60, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('PSYCHOMETRIC ITEM ANALYSIS AUDIT REPORT', 40, 36);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(`Generated: ${data.generatedDate}`, 640, 36);

  // 2. Exam Context & Reliability Summary
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Exam: ${data.examTitle}`, 40, 85);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Subject: ${data.subject}  |  Batch: ${data.cohortName}`, 40, 100);

  // Summary Metrics Tiles
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 115, 712, 45, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('EXAMINEES', 60, 132);
  doc.text('TOTAL ITEMS', 180, 132);
  doc.text('KR-20 RELIABILITY', 310, 132);
  doc.text('MEAN DIFFICULTY (P)', 460, 132);
  doc.text('MEAN DISCRIMINATION (D)', 600, 132);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.metrics.totalExaminees), 60, 148);
  doc.text(String(data.metrics.totalItems), 180, 148);
  doc.text(Number(data.metrics.kr20Reliability).toFixed(2), 310, 148);
  doc.text(Number(data.metrics.meanFacilityIndex).toFixed(2), 460, 148);
  doc.text(Number(data.metrics.meanDiscriminationIndex).toFixed(2), 600, 148);

  // 3. Tabular Item Analysis Matrix
  const tableRows = data.items.map((it) => [
    `#${it.itemNumber}`,
    it.questionText.length > 55 ? `${it.questionText.slice(0, 52)}...` : it.questionText,
    it.domain,
    it.competency,
    it.facilityIndex.toFixed(2),
    it.discriminationIndex.toFixed(2),
    it.status,
  ]);

  autoTable(doc, {
    startY: 175,
    margin: { left: 40, right: 40 },
    head: [['#', 'Item Prompt', 'Domain', 'Competency Cluster', 'Diff (P)', 'Disc (D)', 'Diagnostic Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Blue-600
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 200 },
      2: { cellWidth: 110 },
      3: { cellWidth: 140 },
      4: { cellWidth: 50, halign: 'center' },
      5: { cellWidth: 50, halign: 'center' },
      6: { cellWidth: 87, fontStyle: 'bold' },
    },
  });

  const finalName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(finalName);
}

// =========================================================================
// 4. PDF REPORT GENERATOR: COHORT READINESS ROSTER
// =========================================================================

export interface CohortRosterReportData {
  cohortName: string;
  status: string;
  generatedDate: string;
  metrics: {
    totalStudents: number;
    boardReadyCount: number;
    readyPercentage: number;
    cohortAverage: number;
  };
  students: {
    name: string;
    email: string;
    attemptsCount: number;
    compositeScore: number;
    assessmentScore: number;
    abnormalScore: number;
    ioScore: number;
    devScore: number;
    readinessStatus: 'Ready' | 'Not Ready';
  }[];
}

export function exportCohortAnalyticsPDF(filename: string, data: CohortRosterReportData): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });

  // 1. Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 792, 60, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('BLEPP COHORT LICENSURE READINESS AUDIT', 40, 36);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Generated: ${data.generatedDate}`, 640, 36);

  // 2. Cohort Metadata Strip
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Cohort: ${data.cohortName} (${data.status})`, 40, 85);

  // Summary Metrics Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, 100, 712, 45, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL ENROLLED', 60, 117);
  doc.text('BOARD READY', 220, 117);
  doc.text('READINESS RATE', 380, 117);
  doc.text('BATCH TOS AVERAGE', 550, 117);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.metrics.totalStudents), 60, 133);
  doc.text(`${data.metrics.boardReadyCount} Students`, 220, 133);
  doc.text(`${data.metrics.readyPercentage.toFixed(1)}%`, 380, 133);
  doc.text(`${data.metrics.cohortAverage.toFixed(1)}%`, 550, 133);

  // 3. Student Readiness Matrix Table
  const tableRows = data.students.map((s) => [
    s.name,
    s.email,
    String(s.attemptsCount),
    `${s.assessmentScore}%`,
    `${s.abnormalScore}%`,
    `${s.ioScore}%`,
    `${s.devScore}%`,
    `${s.compositeScore}%`,
    s.readinessStatus,
  ]);

  autoTable(doc, {
    startY: 160,
    margin: { left: 40, right: 40 },
    head: [['Student Name', 'Email', 'Exams', 'Assess (40%)', 'Abnormal (20%)', 'I/O (20%)', 'Dev (20%)', 'TOS Composite', 'PRC Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110], // Teal-700
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 150 },
      2: { cellWidth: 45, halign: 'center' },
      3: { cellWidth: 65, halign: 'center' },
      4: { cellWidth: 65, halign: 'center' },
      5: { cellWidth: 60, halign: 'center' },
      6: { cellWidth: 60, halign: 'center' },
      7: { cellWidth: 75, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 62, halign: 'center', fontStyle: 'bold' },
    },
  });

  const finalName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(finalName);
}