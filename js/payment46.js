import { getFirestore, doc, getDoc, setDoc, updateDoc, query, collection, getDocs, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();
const stripe = Stripe('pk_test_51PLiKDHzquwkd6f4bfXP8K4Vhe69OYRBKhR0SIdtaof4VdVoXDWWI3hLYtqk6KqEKeYYOWbRLMgr4BtumdxhdXBX00GNGUlLiI');
const elements = stripe.elements();

(function () {
  emailjs.init("9R5K8FyRub386RIu8"); // Replace with your EmailJS user ID
})();


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
async function updateRoomQuantity(category, roomName, checkinDate, checkoutDate) {
  try {
    const roomCategories = [
      { category: 'cat', collectionName: 'cat rooms' },
      { category: 'dog', collectionName: 'dog rooms' },
      { category: 'rabbit', collectionName: 'rabbit rooms' },
      { category: 'cage', collectionName: 'cage rooms' },
    ];

    console.log(`Updating room quantity for category: ${category}, roomName: ${roomName}, checkinDate: ${checkinDate}, checkoutDate: ${checkoutDate}`);

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
            const currentQuantities = roomData.room_quantity || [];

            console.log('Initial quantities:', currentQuantities);

            const startDate = new Date(checkinDate);
            const endDate = new Date(checkoutDate);

            // Update quantities in each map
            for (const monthData of currentQuantities) {
              for (const [date, quantity] of Object.entries(monthData)) {
                const dateObj = new Date(date);
                if (dateObj >= startDate && dateObj <= endDate) {
                  console.log(`Processing date: ${date}`);

                  // Convert quantity to number if it's a string
                  const currentQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
                  console.log(`Current quantity for ${date}: ${currentQuantity}`);

                  if (currentQuantity > 0) {
                    const newQuantity = currentQuantity - 1;
                    const updatedQuantity = Math.max(newQuantity, 0);

                    console.log(`Updated quantity for ${date}: ${updatedQuantity}`);
                    monthData[date] = updatedQuantity.toString();
                  } else {
                    console.log(`No need to update quantity for ${date} (already 0 or negative)`);
                  }
                }
              }
            }

            console.log('Final quantities:', currentQuantities);

            await updateDoc(roomDocRef, {
              room_quantity: currentQuantities
            });

            console.log(`Room quantity updated for ${roomName} in ${category} from ${checkinDate} to ${checkoutDate}`);
            return true;
          }
        }
      }
    }

    console.log(`Room ${roomName} not found in category ${category}.`);
    return false;
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
    return `P${newPaymentID.toString().padStart(2, '0')}`; // Example format: P01
  } catch (e) {
    console.error('Failed to generate payment ID: ', e);
    throw new Error('Failed to generate payment ID');
  }
}

async function validateCardDetails() {
  const cardHolderName = document.getElementById('cardHolder').value.trim();
  const { error: cardNumberError } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardNumberElement,
    billing_details: {
      name: cardHolderName,
    },
  });

  const { error: cardExpiryError } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardExpiryElement,
    billing_details: {
      name: cardHolderName,
    },
  });

  const { error: cardCvcError } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardCvcElement,
    billing_details: {
      name: cardHolderName,
    },
  });

  // Check if there are any errors
  // Handle card number errors
  if (!cardNumberElement || !cardCvcElement || !cardExpiryElement || !cardHolderName) {
    window.alert(`Please fill in all credit card detials.`)
    return false;
  }

  if (cardNumberError) {
    window.alert(`Card Number Error: ${cardNumberError.message}`);
    return false;
  }

  // Handle card expiry errors
  if (cardExpiryError) {
    window.alert(`Card Expiry Error: ${cardExpiryError.message}`);
    return false;
  }

  // Handle card CVC errors
  if (cardCvcError) {
    window.alert(`Card CVC Error: ${cardCvcError.message}`);
    return false;
  }

  if (!cardHolderName) {
    window.alert("Please Fill in Card Holder Name");
    return;
  }

  return true; // Validation successful
}

function generateOTP() {
  let otpNumber = Math.floor(100000 + Math.random() * 900000);
  return otpNumber.toString();
}

document.getElementById("confirm-payment").disabled = true;

async function SendMail() {
  try {

    const isCardValid = await validateCardDetails();
    if (!isCardValid) {
      return; // Exit the function if card details are not valid
    }

    const userId = getCurrentUserId();
    const usersCollectionRef = collection(db, 'users');
    const userQuery = query(usersCollectionRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      for (const doc of querySnapshot.docs) {
        const userData = doc.data();
        const userEmail = userData.email;
        const userName = userData.name;

        console.log('User Email:', userEmail);

        if (userEmail && userEmail.trim() !== '') {
          const otp = generateOTP();
          const otpGenerationTime = Date.now(); // Current time in milliseconds
          const otpExpirationTime = otpGenerationTime + 10 * 60 * 1000; // 10 minutes from now
          sessionStorage.setItem("generatedOTP", otp.trim());
          sessionStorage.setItem("otpGenerationTime", otpGenerationTime.toString());
          sessionStorage.setItem("otpExpirationTime", otpExpirationTime.toString());

          const templateParams = {
            from_name: userName,
            to_email: userEmail,
            otp: otp,
            expiration_time: new Date(otpExpirationTime).toLocaleString() // Formatted expiration time
          };

          console.log('Sending email with params:', templateParams);

          try {
            const response = await emailjs.send('service_7e6jx2j', 'template_l3gma7d', templateParams);
            alert("Success! OTP sent.");
            updateButtonVisibility();
            console.log('Success:', response);
          } catch (error) {
            alert("Failed to send OTP.");
            console.error('Error:', error);
          }
        } else {
          console.log('Invalid email address:', userEmail);
        }
      }
    } else {
      console.log("No such user found!");
    }
  } catch (error) {
    console.log("Error fetching user data:", error);
  }
}

function updateButtonVisibility() {
  document.getElementById("send-otp").style.display = "none";
  document.getElementById("verify-otp").style.display = "block";
}

function verifyOTP() {
  const enteredOTP = document.getElementById("otp").value.trim();
  const generatedOTP = sessionStorage.getItem("generatedOTP").trim();
  const otpGenerationTime = parseInt(sessionStorage.getItem("otpGenerationTime"), 10);
  const otpExpirationTime = parseInt(sessionStorage.getItem("otpExpirationTime"), 10);
  const currentTime = Date.now();

  console.log('Entered OTP:', enteredOTP);
  console.log('Generated OTP:', generatedOTP);
  console.log('OTP Expiration Time:', new Date(otpExpirationTime).toLocaleString());
  console.log('Current Time:', new Date(currentTime).toLocaleString());

  if (currentTime > otpExpirationTime) {
    alert("OTP has expired. Please request a new OTP.");
    return;
  }

  if (enteredOTP === generatedOTP) {
    alert("OTP verified successfully!");

    // Disable or hide OTP section after successful verification
    document.getElementById("otp").disabled = true;
    document.getElementById("verify-otp").disabled = true;
    document.getElementById("confirm-payment").disabled = false;
    // Optionally, you can show a success message or proceed with further actions
  } else {
    alert("Invalid OTP. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("send-otp").addEventListener("click", function (e) {
    e.preventDefault();
    SendMail();
  });

  document.getElementById("verify-otp").addEventListener("click", function (e) {
    e.preventDefault();
    verifyOTP();
  });
});

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
                book_id: newestBooking.book_id,
                book_date: newestBooking.book_date,
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

              const deductionResult = await updateRoomQuantity(newestBooking.category, newestBooking.room_name, newestBooking.checkin_date, newestBooking.checkout_date);
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
