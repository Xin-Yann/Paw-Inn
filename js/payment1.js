import { getFirestore, doc, getDoc, setDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();
const stripe = Stripe('pk_test_51PLiKDHzquwkd6f4bfXP8K4Vhe69OYRBKhR0SIdtaof4VdVoXDWWI3hLYtqk6KqEKeYYOWbRLMgr4BtumdxhdXBX00GNGUlLiI');
const elements = stripe.elements();

function getCurrentUserId() {
  const user = auth.currentUser;
  return user ? user.uid : null;
}

// Function to display bookings from Firestore
async function fetchAndDisplayBooking(userId) {
  try {
    // Fetch the user's bookings from Firestore
    const userDocRef = doc(db, 'book', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const bookings = userData.bookings || [];

      // Get the most recent booking (assuming the latest booking is the last one in the array)
      const newestBooking = bookings[bookings.length - 1];

      // Display the newest booking details on the payment page
      if (newestBooking) {
        document.getElementById('room_name').textContent = newestBooking.room_name;
        document.getElementById('checkin_date').textContent = newestBooking.checkin_date;
        document.getElementById('checkout_date').textContent = newestBooking.checkout_date;
        document.getElementById('owner_name').textContent = newestBooking.owner_name;
        document.getElementById('pet_name').textContent = newestBooking.pet_name;
        document.getElementById('email').textContent = newestBooking.email;
        document.getElementById('contact').textContent = newestBooking.contact;
        document.getElementById('category').textContent = newestBooking.category;
        document.getElementById('food_category').textContent = newestBooking.food_category;
        document.getElementById('price').textContent = newestBooking.price;
      } else {
        console.error('No bookings found for user ID:', userId);
      }
    } else {
      console.error('No document found for user ID:', userId);
    }
  } catch (error) {
    console.error('Error fetching booking details:', error);
  }
}

// Initialize Stripe Elements
const cardNumberElement = elements.create('cardNumber');
cardNumberElement.mount('#card-number-element');

const cardExpiryElement = elements.create('cardExpiry');
cardExpiryElement.mount('#card-expiry-element');

const cardCvcElement = elements.create('cardCvc');
cardCvcElement.mount('#card-cvc-element');

async function generatePaymentID() {
  const paymentCounterDocRef = doc(db, 'metadata', 'paymentCounter');
  try {
    const paymentCounterDoc = await getDoc(paymentCounterDocRef);
    let newPaymentID = 1;
    if (paymentCounterDoc.exists()) {
      newPaymentID = paymentCounterDoc.data().lastPaymentID + 1;
    }
    await setDoc(paymentCounterDocRef, { lastPaymentID: newPaymentID });
    return `P${newPaymentID.toString().padStart(2, '0')}`; // Example format: P00001
  } catch (e) {
    console.error('Failed to generate payment ID: ', e);
    throw new Error('Failed to generate payment ID');
  }
}


// Handle form submission for payment
const form = document.getElementById('payment-form');
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error("Invalid userId:", userId);
      return;
    }

    // Fetch user's bookings from Firestore
    const userDocRef = doc(db, 'book', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const bookingsArray = userData.bookings || [];

      // Assuming you want to process the most recent booking
      const newestBooking = bookingsArray[bookingsArray.length - 1];

      if (!newestBooking) {
        console.error("No bookings found for user ID:", userId);
        return;
      }

      const paymentId = await generatePaymentID();

      // Fetch client secret from server for each payment attempt
      const response = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: newestBooking.price, currency: 'myr' }), // Adjust as per your needs
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client secret from server');
      }

      const { clientSecret } = await response.json();

      // Confirm payment with Stripe using clientSecret
      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: document.getElementById('cardHolder').value,
          },
        }
      });

      if (error) {
        console.error('Error confirming payment:', error);
        alert('Error confirming payment: ' + error.message);
      } else {
        if (paymentIntent.status === 'succeeded') {
          // Payment succeeded, process the booking in Firestore

          // Placeholder logic: Remove the processed booking from the user's bookings
          const remainingBookings = bookingsArray.slice(0, -1); // Remove the last booking

          // Update Firestore document with remaining bookings
          await setDoc(userDocRef, { bookings: remainingBookings }, { merge: true });

          const paymentDocRef = doc(db, 'payments', userId);

          try {
            const docSnap = await getDoc(paymentDocRef);
          
            // Check if the user document exists
            if (docSnap.exists()) {
              const paymentData = docSnap.data();
              let paymentsArray = paymentData.payments || [];
          
              // Add new payment details to the array
              paymentsArray.push({
                paymentId: paymentId,
                userId: userId,
                amount: newestBooking.price,
                payment_date: new Date().toISOString(),
                room_name: newestBooking.room_name,
                checkin_date: newestBooking.checkin_date,
                checkout_date: newestBooking.checkout_date,
                owner_name: newestBooking.owner_name,
                pet_name: newestBooking.pet_name,
                email: newestBooking.email,
                contact: newestBooking.contact,
                category: newestBooking.category,
                food_category: newestBooking.food_category,
                price: newestBooking.price,
                booking_date: new Date().toISOString(),
                status: 'paid',
                // Add more payment details as needed
              });
          
              // Update Firestore document with the updated payments array
              await setDoc(paymentDocRef, { payments: paymentsArray }, { merge: true })
            }
            console.log('Payment details successfully saved.');
          } catch (error) {
            console.error('Error saving payment details:', error);
            throw new Error('Failed to save payment details');
          }

          alert('Payment confirmed for the latest booking.');
          window.location.href = "../html/bookingHistory.html"; // Redirect to success page
        }
      }
    } else {
      console.error("No bookings found for user ID:", userId);
    }
  } catch (e) {
    console.error('Error confirming payment:', e);
    alert('Error confirming payment. Please try again.');
  }
});

// Ensure the function is called when the page loads
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userId = user.uid;
      fetchAndDisplayBooking(userId);
    } else {
      console.error('No authenticated user found.');
    }
  });
});
