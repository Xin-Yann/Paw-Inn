import { getFirestore, doc, getDoc, setDoc, updateDoc, query, collection, getDocs, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();
const stripe = Stripe('pk_test_51PLiKDHzquwkd6f4bfXP8K4Vhe69OYRBKhR0SIdtaof4VdVoXDWWI3hLYtqk6KqEKeYYOWbRLMgr4BtumdxhdXBX00GNGUlLiI');
const elements = stripe.elements();

document.addEventListener("DOMContentLoaded", () => {

  (function () {
    emailjs.init("9R5K8FyRub386RIu8");
  })();


  function getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userId = user.uid;
      fetchAndDisplayBooking(userId);
      const userEmail = sessionStorage.getItem('userEmail');
      if (userEmail) {
        fetchAndDisplayPersonalDetails(userEmail);
      } else {
        console.log('No user email found in session storage.');
      }
    } else {
      console.error('No authenticated user found.');
    }
  });

  async function fetchAndDisplayBooking(userId) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const book_id = urlParams.get('book_id');
      const userDocRef = doc(db, 'book', userId);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const bookings = userData.bookings || [];

        let booking;
        if (book_id) {
          // Find the booking with the specific book_id
          booking = bookings.find(b => b.book_id === book_id);
          if (!booking) {
            console.error('No booking found with ID:', book_id);
            return;
          }
        } else {
          // Get the newest booking
          booking = bookings[bookings.length - 1];
          if (!booking) {
            console.error('No bookings found for user ID:', userId);
            return;
          }
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

  async function generatePaymentID() {
    const paymentCounterDocRef = doc(db, 'metadata', 'paymentCounter');
    try {
      const paymentCounterDoc = await getDoc(paymentCounterDocRef);
      let newPaymentID = 1;
      if (paymentCounterDoc.exists()) {
        newPaymentID = paymentCounterDoc.data().lastPaymentID + 1;
      }
      await setDoc(paymentCounterDocRef, { lastPaymentID: newPaymentID });
      return `P${newPaymentID.toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('Failed to generate payment ID: ', e);
      throw new Error('Failed to generate payment ID');
    }
  }

  function generateOTP() {
    let otpNumber = Math.floor(100000 + Math.random() * 900000);
    return otpNumber.toString();
  }

  const cooldownPeriod = 30 * 1000;
  const maxAttempts = 4;

  function resendOTP() {
    try {

      let resendAttempts = parseInt(sessionStorage.getItem('resendAttempts')) || 0;
      const lastResendTime = sessionStorage.getItem('lastResendTime');
      const currentTime = Date.now();

      if (resendAttempts >= maxAttempts) {
        alert("You have exceeded the maximum number of OTP resend attempts. The payment will now be canceled.");
        cancelPayment();
        return;
      }

      if (lastResendTime && (currentTime - lastResendTime < cooldownPeriod)) {
        const timeLeft = Math.ceil((cooldownPeriod - (currentTime - lastResendTime)) / 1000);
        alert(`Please wait ${timeLeft} seconds before requesting another OTP.`);
        return;
      }

      const newOTP = generateOTP();
      const otpExpirationTime = currentTime + (5 * 60 * 1000);

      sessionStorage.setItem("generatedOTP", newOTP);
      sessionStorage.setItem("otpGenerationTime", currentTime.toString());
      sessionStorage.setItem("otpExpirationTime", otpExpirationTime.toString());
      sessionStorage.setItem('lastResendTime', currentTime.toString());

      resendAttempts += 1;
      sessionStorage.setItem('resendAttempts', resendAttempts.toString());

      const userEmail = sessionStorage.getItem('userEmail');
      const userName = sessionStorage.getItem('userName');
      if (userEmail) {
        emailjs.send('service_7e6jx2j', 'template_l3gma7d', {
          from_name: userName,
          to_email: userEmail,
          otp: newOTP,
          expiration_time: new Date(otpExpirationTime).toLocaleString()
        }).then((response) => {
          console.log("OTP sent successfully", response.status, response.text);
          alert('A new OTP has been sent to your email.');
        }, (error) => {
          console.error("Failed to send OTP:", error);
          alert('Failed to send OTP. Please try again later.');
        });
      } else {
        console.error("User email not found in session storage.");
        alert('User email not found. Please log in again.');
      }

    } catch (error) {
      console.error("Error resending OTP:", error);
      alert('Error resending OTP. Please try again.');
    }
  }

  document.getElementById("resend-otp").addEventListener("click", function (e) {
    e.preventDefault();

    const resend = document.getElementById("resend-otp");
    resend.style.pointerEvents = 'none';
    resend.style.opacity = '0.5';

    resendOTP();

    setTimeout(() => {
      console.log("Enabling link after 30 seconds.");
      resend.style.pointerEvents = 'auto';
      resend.style.opacity = '1';
    }, cooldownPeriod);
  });

  function cancelPayment() {
    alert('Your payment has been canceled due to exceeding OTP resend limits.');
    sessionStorage.removeItem('generatedOTP');
    sessionStorage.removeItem('otpGenerationTime');
    sessionStorage.removeItem('otpExpirationTime');
    sessionStorage.removeItem('lastResendTime');
    sessionStorage.removeItem('resendAttempts');

    window.location.href = '../html/payment.html';
  }

  async function verifyOTP() {
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
      window.alert("OTP has expired. Please request a new OTP.");
      throw new Error("OTP has expired. Please request a new OTP.");
    }

    if (enteredOTP.length === 0) {
      window.alert("Please enter an OTP.");
      throw new Error("Please enter an OTP.");
    } else if (enteredOTP.length !== 6) {
      window.alert("Input must be exactly 6 characters.");
      throw new Error("Input must be exactly 6 characters.");
    } else if (enteredOTP !== generatedOTP) {
      window.alert("Invalid OTP. Please try again.");
      throw new Error("Invalid OTP. Please try again.");
    }

  }

  document.getElementById("verify-otp").addEventListener("click", async function (e) {
    e.preventDefault();
    try {
      await verifyOTP();
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
        const paymentDetails = JSON.parse(sessionStorage.getItem('paymentDetails'));

        const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: paymentDetails.paymentMethodId,
        });

        if (error) {
          console.error('Error confirming payment:', error);
          alert('Error confirming payment: ' + error.message);
        } else {
          console.log('Newest booking:', newestBooking);
          if (paymentIntent.status === 'succeeded') {
            const remainingBookings = bookingsArray.slice(0, -1);
            await setDoc(userDocRef, { bookings: remainingBookings }, { merge: true });

            const paymentDocRef = doc(db, 'payments', userId);
            let paymentsArray = [];

            try {
              const docSnap = await getDoc(paymentDocRef);
              if (docSnap.exists()) {
                const paymentData = docSnap.data();
                paymentsArray = paymentData.payments || [];
              } else {
                console.log("Creating new payments document for the user");
              }

              const totalPrice = newestBooking.totalPrice;
              const points = await calculatePoints(totalPrice) ?? 0;
              const redeemedPoints = sessionStorage.getItem('redeemedPoints') ?? 0;
              const updatedPoints = await updatePoints(points);

              console.log('Points:', redeemedPoints);
              console.log('Updated Points:', updatedPoints);

              paymentsArray.push({
                paymentId: paymentId || '',
                userId: userId || '',
                amount: Number(newestBooking.price) || 0,
                payment_date: new Date().toISOString(),
                book_id: newestBooking.book_id || '',
                book_date: newestBooking.book_date || '',
                room_name: newestBooking.room_name || '',
                checkin_date: newestBooking.checkin_date || '',
                checkout_date: newestBooking.checkout_date || '',
                owner_name: newestBooking.owner_name || '',
                pet_name: newestBooking.pet_name || '',
                email: newestBooking.email || '',
                contact: newestBooking.contact || '',
                category: newestBooking.category || '',
                food_category: newestBooking.food_category || '',
                vaccination_image: newestBooking.vaccination_image || '',
                nights: Number(newestBooking.nights) || 0,
                serviceTax: Number(newestBooking.serviceTax) || 0,
                salesTax: Number(newestBooking.salesTax) || 0,
                price: Number(newestBooking.price) || 0,
                subtotal: Number(newestBooking.subtotal) || 0,
                totalPrice: Number(newestBooking.totalPrice) || 0,
                pointsRedeemed: Number(redeemedPoints) || 0,
                newPoints: Number(points) || 0,
                status: 'Paid'
              });

              await setDoc(paymentDocRef, { payments: paymentsArray }, { merge: true });

              await sendEmailNotificationOnSuccess(newestBooking, redeemedPoints, points);

              // Update room quantity
              const deductionResult = await updateRoomQuantity(newestBooking.category, newestBooking.room_name, newestBooking.checkin_date, newestBooking.checkout_date);
              console.log(deductionResult);

              sessionStorage.removeItem('bookingId');
              sessionStorage.removeItem('otpGenerationTime');
              sessionStorage.removeItem('otpExpirationTime');
              sessionStorage.removeItem('lastResendTime');
              sessionStorage.removeItem('resendAttempts');
              sessionStorage.removeItem('paymentDetails');
              sessionStorage.removeItem('selectedRoomCategory');
              sessionStorage.removeItem('selectedRoomName');
              sessionStorage.removeItem('selectedRoomPrice');
              sessionStorage.removeItem(' userEmail');

              alert('Payment confirmed for the latest booking.');
              window.location.href = "../html/bookingHistory.html";
            } catch (error) {
              console.error('Error saving payment details:', error);
              throw new Error('Failed to save payment details');
            }
          }
        }
      } else {
        console.error("No bookings found for user ID:", userId);
      }
    } catch (e) {
      console.error('Error confirming payment:', e);
    }

  });

  async function fetchAndDisplayPersonalDetails(email) {
    try {
      console.log(`Fetching details for email: ${email}`);
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log('User data fetched:', userData);
          document.getElementById('email').textContent = userData.email || '';
          const pointsDisplay = document.getElementById('point');
          if (pointsDisplay) {
            const points = userData.points || 0;
            pointsDisplay.textContent = `Point: ${points}`;
            console.log(`User points: ${points}`);
          } else {
            console.error('Element with ID "point" not found.');
          }
        });
      } else {
        console.log('User details document does not exist.');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }

  async function calculatePoints(totalPrice) {
    const pointsPerRM = 1;
    const wholeRM = Math.floor(totalPrice);
    const points = wholeRM * pointsPerRM;
    return points;
  }

  async function updatePoints(points) {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user is currently logged in.");
        return;
      }
      const userEmail = user.email;
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDocRef = querySnapshot.docs[0].ref;
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const existingPoints = Number(userData.points) || 0;
          const updatedPoints = existingPoints + Number(points);
          await updateDoc(userDocRef, { points: updatedPoints });
          window.alert(`Points updated successfully. New points: ${updatedPoints}`);
          console.log(`Points updated successfully. New points: ${updatedPoints}`);
          fetchAndDisplayPersonalDetails(userEmail);
          return updatedPoints;
        } else {
          console.log('User document does not exist.');
        }
      } else {
        console.log('No user document found with the specified email.');
      }
    } catch (error) {
      console.error('Error updating points:', error);
    }
  }

  async function sendEmailNotificationOnSuccess(newestBooking, redeemedPoints, points) {
    try {
      const date = new Date().toISOString();

      const invoiceResponse = await fetch('/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newestBooking, redeemedPoints, points })
      });

      if (!invoiceResponse.ok) throw new Error('Failed to generate invoice');

      const { invoiceUrl } = await invoiceResponse.json();
      console.log('Generated Invoice URL:', invoiceUrl);

      const emailResponse = await emailjs.send('service_7e6jx2j', 'template_winshbo', {
        to_email: newestBooking.email,
        subject: 'Booking Confirmation',
        date: date,
        book_id: newestBooking.book_id,
        user_name: newestBooking.owner_name,
        pet_name: newestBooking.pet_name,
        room_name: newestBooking.room_name,
        checkin_date: newestBooking.checkin_date,
        checkout_date: newestBooking.checkout_date,
        price: newestBooking.price,
        subtotal: newestBooking.subtotal,
        serviceTax: newestBooking.serviceTax,
        salesTax: newestBooking.salesTax,
        amount: newestBooking.totalPrice,
        status: 'Paid',
        invoice_url: invoiceUrl,
        pointsRedeemed: redeemedPoints,
        newPoints: points
      });

      console.log('Points Redeemed:', redeemedPoints);
      console.log('New Points:', points);

      console.log('Email sent successfully to:', newestBooking.email);
      console.log('Response status:', emailResponse.status);
      console.log('Response text:', emailResponse.text);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

});
