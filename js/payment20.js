import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
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
    const userDocRef = doc(db, 'book', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const bookings = userData.bookings || [];
      const newestBooking = bookings[bookings.length - 1];

      if (newestBooking) {
        document.getElementById('book_id').textContent = newestBooking.book_id;
        document.getElementById('book_date').textContent = newestBooking.book_date;
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

// Function to update room quantity
async function updateRoomQuantity(category, roomName, quantity) {
  try {
    const roomCategories = [
      { category: 'cat', collectionName: 'cat rooms' },
      { category: 'dog', collectionName: 'dog rooms' },
      { category: 'rabbit', collectionName: 'rabbit rooms' },
      { category: 'cage', collectionName: 'cage rooms' },
    ];

    console.log(`Updating room quantity for category: ${category}, roomName: ${roomName}, quantity: ${quantity}`);

    for (const { category: roomCategory, collectionName } of roomCategories) {
      console.log(`Checking category: ${roomCategory}, collection: ${collectionName}`);
      
      if (roomCategory === category) {
        const docRef = doc(collection(db, 'rooms'), roomCategory);
        const roomCollectionRef = collection(docRef, collectionName);
        const roomQuerySnapshot = await getDocs(roomCollectionRef);

        console.log(`Documents in ${collectionName}: ${roomQuerySnapshot.size}`);

        for (const docSnap of roomQuerySnapshot.docs) {
          const roomData = docSnap.data();
          console.log(`Checking room: ${roomData.room_name}`);

          if (roomData.room_name === roomName) {
            const roomDocRef = doc(roomCollectionRef, docSnap.id);
            const currentQuantity = roomData.room_quantity || 0;
            const newQuantity = currentQuantity - quantity;

            await updateDoc(roomDocRef, {
              room_quantity: newQuantity
            });

            console.log(`Room quantity updated for ${roomName} in ${category}: ${currentQuantity} - ${quantity} = ${newQuantity}`);
            return true; // Indicate success and exit function
          }
        }
      }
    }

    console.log(`Room ${roomName} not found in category ${category}.`);
    return false; // Indicate room not found
  } catch (error) {
    console.error('Error updating room quantity:', error);
    throw error;
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

    const userDocRef = doc(db, 'book', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const bookingsArray = userData.bookings || [];
      const newestBooking = bookingsArray[bookingsArray.length - 1];

      if (!newestBooking) {
        console.error("No bookings found for user ID:", userId);
        return;
      }

      const paymentId = await generatePaymentID();

      const response = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: newestBooking.price, currency: 'myr' }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client secret from server');
      }

      const { clientSecret } = await response.json();

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
        console.log('Newest booking:', newestBooking);
        console.log('Category:', newestBooking.category);

        if (paymentIntent.status === 'succeeded') {
          const remainingBookings = bookingsArray.slice(0, -1);

          await setDoc(userDocRef, { bookings: remainingBookings }, { merge: true });

          const paymentDocRef = doc(db, 'payments', userId);

          try {
            const docSnap = await getDoc(paymentDocRef);

            if (docSnap.exists()) {
              const paymentData = docSnap.data();
              let paymentsArray = paymentData.payments || [];

              console.log('Payment data before push:', paymentsArray);

              paymentsArray.push({
                paymentId: paymentId,
                userId: userId,
                amount: newestBooking.price,
                payment_date: new Date().toISOString(),
                book_id:newestBooking.book_id,
                book_date:newestBooking.book_date,
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
                status: 'Paid',
              });

              console.log('Payment data after push:', paymentsArray);

              await setDoc(paymentDocRef, { payments: paymentsArray }, { merge: true });

              const deductionResult = await updateRoomQuantity(newestBooking.category, newestBooking.room_name, 1);
              console.log(deductionResult); // Optional: log the result of the deduction function
            }

            console.log('Payment details successfully saved.');
          } catch (error) {
            console.error('Error saving payment details:', error);
            throw new Error('Failed to save payment details');
          }

          alert('Payment confirmed for the latest booking.');
          window.location.href = "../html/bookingHistory.html";
        } else {
          console.error("No bookings found for user ID:", userId);
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
