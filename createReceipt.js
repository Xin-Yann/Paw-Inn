const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function createReceiptPDF(paymentData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.276, 841.890]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText('RECEIPT', {
        x: 270,
        y: height - 50,
        size: 18,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText('Paws Inn', {
        x: 50,
        y: height - 100,
        size: 18,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Transaction ID: ${paymentData.transactionId}`, {
        x: 400,
        y: height - 100,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Date: ${new Date(paymentData.paymentDate).toISOString().split('T')[0]}`, {
        x: 400,
        y: height - 130,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawLine({
        start: { x: 50, y: height - 150 },
        end: { x: 550, y: height - 150 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Member Id: ${paymentData.memberDetails.membershipId}`, {
        x: 60,
        y: height - 180,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Member Name: ${paymentData.memberDetails.name}`, {
        x: 60,
        y: height - 205,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Points: ${paymentData.memberDetails.points}`, {
        x: 60,
        y: height - 230,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawLine({
        start: { x: 50, y: height - 255 },
        end: { x: 550, y: height - 255 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });

    const tableStartY = height - 275;
    page.drawText('Barcode', {
        x: 80,
        y: tableStartY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText('Product Name', {
        x: 180,
        y: tableStartY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText('Type', {
        x: 312,
        y: tableStartY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText('Price (RM)', {
        x: 380,
        y: tableStartY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText('Amount (RM)', {
        x: 460,
        y: tableStartY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawLine({
        start: { x: 50, y: tableStartY - 10 },
        end: { x: 550, y: tableStartY - 10 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });

    let currentY = tableStartY - 30;
    const maxTextWidth = 110; // Max width for product name in points
    const textWrapMargin = 50; // Margin to the right side for text wrapping

    paymentData.cartItems.forEach(item => {
        const barcodeText = item.barcode;
        const productName = item.name;
        const type = item.type;
        const price = item.price.toFixed(2);
        const amount = (item.price * item.quantity).toFixed(2);

        page.drawText(barcodeText, {
            x: 70,
            y: currentY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
        });

        const productNameLines = wrapText(productName, maxTextWidth, font, 10);
        productNameLines.forEach((line, index) => {
            page.drawText(line, {
                x: 175,
                y: currentY - index * 15,
                size: 10,
                font,
                color: rgb(0, 0, 0),
                maxWidth: maxTextWidth,
            });
        });

        page.drawText(type, {
            x: 310,
            y: currentY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
        });

        page.drawText(price, {
            x: 387,
            y: currentY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
        });

        page.drawText(amount, {
            x: 470,
            y: currentY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
        });

        currentY -= Math.max(20, productNameLines.length * 15); // Adjust the space based on the number of lines
    });

    page.drawLine({
        start: { x: 50, y: currentY - 10 },
        end: { x: 550, y: currentY - 10 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Subtotal: RM ${paymentData.subtotal.toFixed(2)}`, {
        x: 410,
        y: currentY - 40,
        size: 11,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Sales Tax (10%): RM ${paymentData.salesTax.toFixed(2)}`, {
        x: 370,
        y: currentY - 70,
        size: 11,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Discount: - RM ${paymentData.salesTax.toFixed(2)}`, {
        x: 408,
        y: currentY -103,
        size: 11,
        font,
        color: rgb(0, 0, 0),
    });


    page.drawText(`Point Discount: RM ${paymentData.totalPrice.toFixed(2)}`, {
        x: 378,
        y: currentY - 138,
        size: 11,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Total Price: RM ${paymentData.totalPrice.toFixed(2)}`, {
        x: 388,
        y: currentY - 175,
        size: 13,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Cash: RM ${paymentData.totalPrice.toFixed(2)}`, {
        x: 420,
        y: currentY - 230,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Change: RM ${paymentData.change.toFixed(2)}`, {
        x: 408,
        y: currentY - 265,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    if (paymentData.redeemedPoints > 0) {
        page.drawText(`Redeemed Points: ${paymentData.redeemedPoints}`, {
            x: 355,
            y: currentY - 300,
            size: 12,
            font,
            color: rgb(0, 0, 0),
        });
    }

    page.drawText(`Earned Points: ${paymentData.earnedPoints}`, {
        x: 375,
        y: currentY - 335,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawLine({
        start: { x: 50, y: currentY - 200 },
        end: { x: 550, y: currentY - 200 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });

    page.drawText(`Note:`, {
        x: 70,
        y: currentY - 230,
        size: 10,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`1. Good sold are non-refundable. `, {
        x: 70,
        y: currentY - 255,
        size: 10,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText(`2. Strictly no exchange for any product.`, {
        x: 70,
        y: currentY - 280,
        size: 10,
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

function wrapText(text, maxWidth, font, fontSize) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    lines.push(currentLine);
    return lines;
}

// Example usage
(async () => {
    const paymentData = {
        transactionId: '1234567890',
        paymentDate: '2024-08-12',
        memberDetails: {
            membershipId: 'MEM123456',
            name: 'John Doe',
            points: 1500,
        },
        cartItems: [
            { barcode: '123456789012', name: 'Dog Food 4lbs', type: 'Dry Food', price: 40.5, quantity: 1 },
            { barcode: '987654321098', name: 'Cat Toy Mouse toy for longer name', type: 'Toy', price: 12.99, quantity: 2 },
        ],
        subtotal: 66.48,
        salesTax: 6.65,
        totalPrice: 73.13,
        change: 26.87,
        redeemedPoints: 1000,
        earnedPoints: 500,
    };

    const pdfBase64 = await createReceiptPDF(paymentData);
    fs.writeFileSync('receipt.pdf', Buffer.from(pdfBase64, 'base64'));
    console.log('PDF created and saved as receipt.pdf');
})();
