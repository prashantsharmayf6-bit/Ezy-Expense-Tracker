import { Transaction, Category } from "../types";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatCurrency, formatDate } from "./utils";

// Extend jsPDF type for autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToExcel = (transactions: Transaction[], categories: Category[]) => {
  const data = transactions.map((t) => ({
    Date: formatDate(t.date),
    Description: t.description,
    Category: categories.find((c) => c.id === t.categoryId)?.name || "Unknown",
    Payment: t.paymentType || "Cash",
    Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    Amount: t.amount,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  XLSX.writeFile(workbook, "EZY_Expense_Journal.xlsx");
};

export const exportToPDF = (transactions: Transaction[], categories: Category[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text("EZY Expense Tracker - Journal Statement", 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  const tableData = transactions.map((t) => [
    formatDate(t.date),
    t.description,
    categories.find((c) => c.id === t.categoryId)?.name || "Unknown",
    t.paymentType || "Cash",
    t.type.charAt(0).toUpperCase() + t.type.slice(1),
    formatCurrency(t.amount),
  ]);

  doc.autoTable({
    startY: 40,
    head: [["Date", "Description", "Category", "Payment", "Type", "Amount"]],
    body: tableData,
    headStyles: { fillColor: [24, 24, 27] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save("EZY_Expense_Journal.pdf");
};
