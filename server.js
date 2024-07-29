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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
