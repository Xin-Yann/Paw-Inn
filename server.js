require('dotenv').config();
const express = require('express');
const { join } = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
const PORT = 8081;

app.use(express.json());
app.use(cors());
app.use(express.static(join(__dirname))); // Adjust the static files directory if needed

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
