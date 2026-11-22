import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  BackupPayload,
  BudgetConfig,
  Expense,
  ExpenseCategory,
  Income,
} from '../types/expense';
import { formatDateDisplay, formatINRPlain, formatTimeDisplay, getTodayISO } from './formatters';
import { buildCategoryAnalysis } from './calculations';

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportExpensesToCSV(
  expenses: Expense[],
  categories: ExpenseCategory[],
  filenamePrefix = 'shyam-expenses'
): void {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = ['Date', 'Time', 'Category', 'Description', 'Payment Method', 'Amount (INR)'];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = expenses.map((e) => [
    e.date,
    e.time,
    catMap.get(e.categoryId) ?? 'Other Expenses',
    e.description || '-',
    e.paymentMethod,
    e.amount.toFixed(2),
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filenamePrefix}-${getTodayISO()}.csv`);
}

function escapeXml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportToExcelWorkbook(
  expenses: Expense[],
  incomes: Income[],
  categories: ExpenseCategory[],
  budget: BudgetConfig,
  periodLabel: string
): void {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const catSummary = buildCategoryAnalysis(expenses, categories, budget).filter((c) => c.total > 0);

  const expenseRowsXml = expenses
    .map(
      (e) => `<Row>
        <Cell><Data ss:Type="String">${escapeXml(e.date)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(e.time)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(catMap.get(e.categoryId) ?? 'Other Expenses')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(e.description || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(e.paymentMethod)}</Data></Cell>
        <Cell><Data ss:Type="Number">${e.amount.toFixed(2)}</Data></Cell>
      </Row>`
    )
    .join('\n');

  const categoryRowsXml = catSummary
    .map(
      (c) => `<Row>
        <Cell><Data ss:Type="String">${escapeXml(c.category.name)}</Data></Cell>
        <Cell><Data ss:Type="Number">${c.count}</Data></Cell>
        <Cell><Data ss:Type="Number">${c.total.toFixed(2)}</Data></Cell>
        <Cell><Data ss:Type="Number">${c.percentage.toFixed(2)}</Data></Cell>
      </Row>`
    )
    .join('\n');

  const incomeRowsXml = incomes
    .map(
      (i) => `<Row>
        <Cell><Data ss:Type="String">${escapeXml(i.date)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(i.time)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(i.source)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(i.description || '-')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXml(i.paymentMethod)}</Data></Cell>
        <Cell><Data ss:Type="Number">${i.amount.toFixed(2)}</Data></Cell>
      </Row>`
    )
    .join('\n');

  const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header"><Font ss:Bold="1"/></Style>
  </Styles>
  <Worksheet ss:Name="Expenses">
    <Table>
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Period: ${escapeXml(periodLabel)}</Data></Cell>
      </Row>
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Time</Data></Cell>
        <Cell><Data ss:Type="String">Category</Data></Cell>
        <Cell><Data ss:Type="String">Description</Data></Cell>
        <Cell><Data ss:Type="String">Payment Method</Data></Cell>
        <Cell><Data ss:Type="String">Amount (INR)</Data></Cell>
      </Row>
      ${expenseRowsXml}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Category Summary">
    <Table>
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Category</Data></Cell>
        <Cell><Data ss:Type="String">Transactions</Data></Cell>
        <Cell><Data ss:Type="String">Total (INR)</Data></Cell>
        <Cell><Data ss:Type="String">Share (%)</Data></Cell>
      </Row>
      ${categoryRowsXml}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Income">
    <Table>
      <Row ss:StyleID="Header">
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Time</Data></Cell>
        <Cell><Data ss:Type="String">Source</Data></Cell>
        <Cell><Data ss:Type="String">Description</Data></Cell>
        <Cell><Data ss:Type="String">Payment Method</Data></Cell>
        <Cell><Data ss:Type="String">Amount (INR)</Data></Cell>
      </Row>
      ${incomeRowsXml}
    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, `shyam-expense-report-${getTodayISO()}.xls`);
}

export function exportReportToPDF(
  expenses: Expense[],
  incomes: Income[],
  categories: ExpenseCategory[],
  budget: BudgetConfig,
  periodLabel: string
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const totalInc = incomes.reduce((s, i) => s + i.amount, 0);

  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SHYAM EXPENSE MANAGER', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Expense Report: ${periodLabel}  |  Generated: ${formatDateDisplay(getTodayISO())}`, 14, 21);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Financial Summary', 14, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Total Expenses: ${formatINRPlain(totalSpent)}`, 14, 45);
  doc.text(`Total Transactions: ${expenses.length}`, 90, 45);
  doc.text(`Period Income: ${formatINRPlain(totalInc)}`, 14, 51);
  doc.text(`Net Balance: ${formatINRPlain(totalInc - totalSpent)}`, 90, 51);

  const catSummary = buildCategoryAnalysis(expenses, categories, budget).filter((c) => c.total > 0);
  let nextY = 58;

  if (catSummary.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Category Breakdown', 14, nextY);

    autoTable(doc, {
      startY: nextY + 3,
      head: [['Category', 'Transactions', 'Share %', 'Total Amount']],
      body: catSummary.map((c) => [
        c.category.name,
        String(c.count),
        `${c.percentage.toFixed(1)}%`,
        formatINRPlain(c.total),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    const lastAuto = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
    nextY = (lastAuto?.finalY ?? nextY + 20) + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Transaction Ledger', 14, nextY);

  autoTable(doc, {
    startY: nextY + 3,
    head: [['Date', 'Time', 'Category', 'Description', 'Method', 'Amount']],
    body:
      expenses.length > 0
        ? expenses.map((e) => [
            formatDateDisplay(e.date),
            formatTimeDisplay(e.time),
            catMap.get(e.categoryId) ?? 'Other Expenses',
            e.description || '-',
            e.paymentMethod,
            formatINRPlain(e.amount),
          ])
        : [['-', '-', '-', 'No expenses in selected range', '-', formatINRPlain(0)]],
    theme: 'striped',
    headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    columnStyles: {
      5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`shyam-expense-report-${getTodayISO()}.pdf`);
}

export function downloadJsonBackup(payload: BackupPayload): void {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  triggerDownload(blob, `shyam-expense-backup-${getTodayISO()}.json`);
}

export function parseAndValidateBackupFile(rawText: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as BackupPayload).app !== 'SHYAM EXPENSE MANAGER' ||
    !(parsed as BackupPayload).data
  ) {
    throw new Error('Invalid backup format. Please select a valid SHYAM EXPENSE MANAGER backup file.');
  }

  const p = parsed as BackupPayload;
  if (!Array.isArray(p.data.expenses) || !Array.isArray(p.data.categories)) {
    throw new Error('Backup file is missing required expense or category records.');
  }

  return {
    app: 'SHYAM EXPENSE MANAGER',
    schemaVersion: 1,
    exportedAt: p.exportedAt || new Date().toISOString(),
    data: {
      expenses: p.data.expenses.filter(
        (e) => e && typeof e.id === 'string' && typeof e.amount === 'number' && typeof e.date === 'string'
      ),
      incomes: Array.isArray(p.data.incomes)
        ? p.data.incomes.filter(
            (i) => i && typeof i.id === 'string' && typeof i.amount === 'number' && typeof i.date === 'string'
          )
        : [],
      categories: p.data.categories.filter(
        (c) => c && typeof c.id === 'string' && typeof c.name === 'string'
      ),
      budget: p.data.budget ?? {
        id: 'default',
        monthlyLimit: 0,
        warningThresholdPct: 80,
        categoryLimits: {},
        updatedAt: Date.now(),
      },
    },
  };
}
