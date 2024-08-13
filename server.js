require('dotenv').config();
const express = require('express');
const { join } = require('path');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());
app.use(express.static(join(__dirname))); // Serve static files from the main directory
app.use('/invoices', express.static(join(__dirname, 'invoices')));
app.use('/receipts', express.static(join(__dirname, 'receipt')));


// Route to create a PaymentIntent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    // Convert amount to smallest currency unit (sen for MYR)
    const amountInSen = Math.round(amount * 100); // Convert RM to sen

    // Create a PaymentIntent with the specified amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSen,
      currency: currency,
    });

    // Send client secret back to client-side
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    res.status(500).json({ error: 'Failed to create PaymentIntent' });
  }
});

// Route to generate and download invoice
app.post('/generate-invoice', async (req, res) => {
  try {
    const { newestBooking } = req.body;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.276, 841.890]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Generate PDF content
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
      end: { x: 550, y: 525 },
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

    page.drawText(`${newestBooking.category}`, {
      x: 188,
      y: height - 390,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${newestBooking.nights}`, {
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
      start: { x: 50, y: 420 },
      end: { x: 550, y: 420 },
      thickness: 1, // Adjust thickness as needed
      color: rgb(0, 0, 0),
    });

    page.drawText(`Subtotal: RM ${newestBooking.subtotal}`, {
      x: 430,
      y: height - 460,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Service Tax (SST 6%): RM ${newestBooking.serviceTax}`, {
      x: 355,
      y: height - 490,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Sales Tax (10%): RM ${newestBooking.salesTax}`, {
      x: 386,
      y: height - 520,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Total Price: RM ${newestBooking.totalPrice}`, {
      x: 406,
      y: height - 555,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawLine({
      start: { x: 50, y: 250 },
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
    const filePath = path.join(__dirname, 'invoices', `${newestBooking.book_id}.pdf`);
    fs.writeFileSync(filePath, Buffer.from(pdfBytes));

    // Log filePath and URL
    console.log('File Path:', filePath);
    const invoiceUrl = `http://localhost:${PORT}/invoices/${newestBooking.book_id}.pdf`;
    console.log('Generated Invoice URL:', invoiceUrl);

    res.json({ invoiceUrl });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});
// Route to generate and send e-receipt
// Route to generate and send e-receipt
app.post('/generate-receipt', async (req, res) => {
  try {
    const { paymentData } = req.body; // Expect paymentData in request body
    console.log('Received paymentData:', paymentData);

    // Check if paymentData and required properties are present
    if (!paymentData || !paymentData.transactionId || !paymentData.paymentDate || !paymentData.cartItems) {
      throw new Error('Invalid payment data');
    }

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
      const price = parseFloat(item.price); // Ensure price is a number
      const amount = parseFloat(item.price) * parseFloat(item.quantity);
      const change = parseFloat(paymentData.change);

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

      page.drawText(String(price.toFixed(2)), {
        x: 387,
        y: currentY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      page.drawText(String(amount.toFixed(2)), {
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
      y: currentY - 103,
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
      page.drawText(`Redeemed Points: ${paymentData.pointsRedeemed}`, {
        x: 355,
        y: currentY - 300,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
    }

    page.drawText(`Earned Points: ${paymentData.pointsEarned}`, {
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

    // Save PDF and return path to client
    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(__dirname, 'receipts', `${paymentData.transactionId}.pdf`);
    fs.writeFileSync(filePath, Buffer.from(pdfBytes));

    const receiptUrl = `http://localhost:${PORT}/receipts/${paymentData.transactionId}.pdf`;
    res.json({ receiptUrl });
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
});

// Helper function to wrap text
function wrapText(text, maxWidth, font, size) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + ' ' + word, size);

    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
