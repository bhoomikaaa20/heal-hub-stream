// src/utils/pdfGenerator.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BillItem {
    medicineName: string;
    quantity: number;
    price: number;
}

interface GeneratePDFParams {
    patientName: string;
    doctorName?: string;
    items: BillItem[];
    total: number;
    paymentMode: string;
}

export const generateInvoicePDF = ({
    patientName,
    doctorName,
    items,
    total,
    paymentMode,
}: GeneratePDFParams) => {
    const doc = new jsPDF();

    // 🏥 HEADER
    doc.setFontSize(18);
    doc.setTextColor("#555");
    doc.text("MedFlow Hospital", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor("#777");
    doc.text("Andhra Pradesh, India", 14, 26);

    // 🧾 BILL INFO
    doc.setFontSize(12);
    doc.setTextColor("#000");
    doc.text(`Bill ID: ${Date.now()}`, 140, 20);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 26);

    // 👤 DETAILS
    doc.text(`Patient: ${patientName}`, 14, 40);
    doc.text(`Doctor: ${doctorName || "N/A"}`, 14, 46);

    // 💊 TABLE
    const tableData = items.map((item) => [
        item.medicineName,
        item.quantity,
        `${item.price}`,
        `${item.quantity * item.price}`,
    ]);

    autoTable(doc, {
        startY: 55,
        head: [["Medicine", "Qty", "Price", "Total"]],
        body: tableData,
        theme: "grid",
        headStyles: {
            fillColor: [85, 85, 85], // your #555 theme
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 70;

    // 💰 TOTAL
    doc.setFontSize(14);
    doc.text(`Grand Total: ${total}`, 140, finalY + 10);

    // 💳 PAYMENT
    doc.setFontSize(12);
    doc.text(`Payment Mode: ${paymentMode}`, 14, finalY + 10);

    // 🙏 FOOTER
    doc.setFontSize(10);
    doc.setTextColor("#777");
    doc.text("Thank you for choosing HealHub 💙", 14, finalY + 25);

    // 💾 SAVE
    doc.save(`Bill_${patientName}.pdf`);
};