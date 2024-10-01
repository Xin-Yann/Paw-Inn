const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function createInvoicePDF(newestBooking) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.276, 841.890]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText('INVOICE', {
        x: 270,
        y: height - 50,
        size: 20,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText('Paws Inn', {
        x: 50,
        y: height - 100,
        size: 20,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Invoice ID: ${newestBooking.book_id}`, {
        x: 450,
        y: height - 100,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Date: ${new Date().toISOString().split('T')[0]}`, {
        x: 450,
        y: height - 130,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    const lineY = height - 160; // Adjust this value as needed to position the line correctly
    page.drawLine({
        start: { x: 50, y: lineY },
        end: { x: 550, y: lineY },
        thickness: 1, // Adjust thickness as needed
        color: rgb(0, 0, 0),
    });

    page.drawText(`Customer Name: ${newestBooking.owner_name}`, {
        x: 50,
        y: height - 200,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Pet Name: ${newestBooking.pet_name}`, {
        x: 50,
        y: height - 225,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Check-in Date: ${newestBooking.checkin_date}`, {
        x: 50,
        y: height - 250,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Check-out Date: ${newestBooking.checkout_date}`, {
        x: 50,
        y: height - 275,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawLine({
        start: { x: 50, y: 525 },
        end: { x: 550, y: 525},
        thickness: 1, // Adjust thickness as needed
        color: rgb(0, 0, 0),
    });

    page.drawText(`Room Name`, {
        x: 80,
        y: height - 340,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Category`, {
        x: 180,
        y: height - 340,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Nights`, {
        x: 275,
        y: height - 340,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Price (per nights)`, {
        x: 340,
        y: height - 340,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Amount (RM)`, {
        x: 450,
        y: height - 340,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawLine({
        start: { x: 50, y: 485 },
        end: { x: 550, y: 485 },
        thickness: 1, // Adjust thickness as needed
        color: rgb(0, 0, 0),
    });

    page.drawText(`${newestBooking.room_name}`, {
        x: 80,
        y: height - 390,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`rabbit`, {
        x: 188,
        y: height - 390,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`1`, {
        x: 285,
        y: height - 390,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`${newestBooking.price}`, {
        x: 370,
        y: height - 390,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`${newestBooking.subtotal}`, {
        x: 470,
        y: height - 390,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawLine({
        start: { x: 50, y: 420},
        end: { x: 550, y: 420 },
        thickness: 1, // Adjust thickness as needed
        color: rgb(0, 0, 0),
    });

    page.drawText(`Redeemed Points: ${newestBooking.pointsRedeemed}`, {
        x: 75,
        y: height - 460,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Earned Points: ${newestBooking.newPoints}`, {    
        x: 75,
        y: height - 490,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Subtotal: RM ${newestBooking.price}`, {
        x: 420,
        y: height - 460,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Service Tax (SST 6%): RM ${newestBooking.serviceTax}`, {
        x: 345,
        y: height - 490,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Sales Tax (10%): RM ${newestBooking.salesTax}`, {
        x: 376,
        y: height - 520,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Total Price: RM ${newestBooking.totalPrice}`, {
        x: 397,
        y: height - 555,
        size: 14,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawLine({
        start: { x: 50, y: 250},
        end: { x: 550, y: 250 },
        thickness: 1, // Adjust thickness as needed
        color: rgb(0, 0, 0),
    });

    page.drawText(`Note:`, {
        x: 70,
        y: height - 630,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`1. All bookings are non-refundable.`, {
        x: 70,
        y: height - 655,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`2. Please review the Online Check-In information in the email.`, {
        x: 70,
        y: height - 680,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`**This is a computer-generated invoice no signature is required.**`, {
        x: 130,
        y: height - 800,
        size: 11,
        font,
        color: rgb(128 / 255, 128 / 255, 128 / 255), // Normalize RGB values
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes).toString('base64');
}

// Example usage
(async () => {
    const newestBooking = {
        book_id: '12345',
        owner_name: 'John Doe',
        pet_name: 'Fluffy',
        room_name: 'Deluxe Suite',
        checkin_date: '2024-08-01',
        checkout_date: '2024-08-07',
        price: '500',
        subtotal: '500',
        serviceTax: '10',
        salesTax: '10',
        totalPrice: '600',
        pointsRedeemed: '60', 
        newPoints: '100'
    };

    const pdfBase64 = await createInvoicePDF(newestBooking);
    fs.writeFileSync('invoice.pdf', Buffer.from(pdfBase64, 'base64'));
    console.log('PDF created and saved as invoice.pdf');
})();
