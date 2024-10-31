import { getFirestore, doc, getDoc, setDoc, updateDoc, query, collection, getDocs, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

// Initialize Firebase Storage
const storage = getStorage();

const db = getFirestore();
const auth = getAuth();
const stripe = Stripe('pk_test_51PLiKDHzquwkd6f4bfXP8K4Vhe69OYRBKhR0SIdtaof4VdVoXDWWI3hLYtqk6KqEKeYYOWbRLMgr4BtumdxhdXBX00GNGUlLiI');
const elements = stripe.elements();

document.addEventListener("DOMContentLoaded", () => {

  (function () {
    emailjs.init("9R5K8FyRub386RIu8"); // Replace with your EmailJS user ID
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

  let totalPrice;

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
          booking = bookings.find(b => b.book_id === book_id);
          if (!booking) {
            console.error('No booking found with ID:', book_id);
            return;
          }
        } else {
          booking = bookings[bookings.length - 1];
          if (!booking) {
            console.error('No bookings found for user ID:', userId);
            return;
          }
        }
        document.getElementById('book_id').textContent = booking.book_id;
        document.getElementById('book_date').textContent = booking.book_date;
        document.getElementById('room_name').textContent = booking.room_name;
        document.getElementById('checkin_date').textContent = booking.checkin_date;
        document.getElementById('checkout_date').textContent = booking.checkout_date;
        document.getElementById('owner_name').textContent = booking.owner_name;
        document.getElementById('pet_name').textContent = booking.pet_name;
        document.getElementById('email').textContent = booking.email;
        document.getElementById('contact').textContent = booking.contact;
        document.getElementById('category').textContent = booking.category;
        document.getElementById('food_category').textContent = booking.food_category;
        document.getElementById('nights').textContent = booking.nights;
        document.getElementById('price').textContent = booking.price;
        document.getElementById('service').textContent = booking.serviceTax;
        document.getElementById('sales').textContent = booking.salesTax;
        document.getElementById('subtotal').textContent = booking.subtotal;
        document.getElementById('totalprice').textContent = booking.totalPrice;

        if (booking.vaccination_image) {
          const storageRef = ref(storage, booking.vaccination_image); 
          const imageUrl = await getDownloadURL(storageRef); 
          const imageElement = document.getElementById('vaccination_image');
          imageElement.src = imageUrl;
          imageElement.style.display = 'block'; 
        } else {
          document.getElementById('vaccination_image').style.display = 'none';
        }

        totalPrice = booking.totalPrice;


      } else {
        console.error('No document found for user ID:', userId);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  }

  const cardNumberElement = elements.create('cardNumber');
  cardNumberElement.mount('#card-number-element');

  const cardExpiryElement = elements.create('cardExpiry');
  cardExpiryElement.mount('#card-expiry-element');

  const cardCvcElement = elements.create('cardCvc');
  cardCvcElement.mount('#card-cvc-element');

  async function validateCardDetails() {
    const cardHolderName = document.getElementById('cardHolder').value.trim();

    const { error: cardNumberError, paymentMethod } = await stripe.createPaymentMethod({
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

    if (!cardNumberElement || !cardCvcElement || !cardExpiryElement || !cardHolderName) {
      window.alert(`Please fill in all credit card detials.`)
      return false;
    }

    if (cardNumberError) {
      window.alert(`Card Number Error: ${cardNumberError.message}`);
      return false;
    }

    if (cardExpiryError) {
      window.alert(`Card Expiry Error: ${cardExpiryError.message}`);
      return false;
    }

    if (cardCvcError) {
      window.alert(`Card CVC Error: ${cardCvcError.message}`);
      return false;
    }

    const paymentDetails = {
      cardHolderName: cardHolderName,
      paymentMethodId: paymentMethod.id, 
    };
    sessionStorage.setItem('paymentDetails', JSON.stringify(paymentDetails));

    console.log("Payment details stored in session:", paymentDetails);

    return true;
  }

  function generateOTP() {
    let otpNumber = Math.floor(100000 + Math.random() * 900000);
    return otpNumber.toString();
  }

  document.getElementById("payment").addEventListener("click", function (e) {
    e.preventDefault();
    SendMailOtp();
  });

  async function SendMailOtp() {
    try {

      const isCardValid = await validateCardDetails();
      if (!isCardValid) {
        return;
      }

      let resendAttempts = sessionStorage.getItem('resendAttempts');
      if (!resendAttempts) {
        sessionStorage.setItem('resendAttempts', '1'); // First attempt
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
            const otpGenerationTime = Date.now(); 
            const otpExpirationTime = otpGenerationTime + 10 * 60 * 1000; 

            const bookingId = document.getElementById('book_id').textContent; 
            const redeemedPoints = parseFloat(document.getElementById('point_amount').textContent.replace(/[^0-9]/g, "").trim()) || 0;

            sessionStorage.setItem("generatedOTP", otp.trim());
            sessionStorage.setItem("otpGenerationTime", otpGenerationTime.toString());
            sessionStorage.setItem("otpExpirationTime", otpExpirationTime.toString());
            sessionStorage.setItem("bookingId", bookingId); 
            sessionStorage.setItem("redeemedPoints", redeemedPoints.toString());

            const templateParams = {
              from_name: userName,
              to_email: userEmail,
              otp: otp,
              expiration_time: new Date(otpExpirationTime).toLocaleString()
            };

            console.log('Sending email with params:', templateParams);

            try {
              const response = await emailjs.send('service_7e6jx2j', 'template_l3gma7d', templateParams);
              window.alert("Success! OTP sent.");
              // updateButtonVisibility();
              window.console.log('Success:', response);
              window.location.href = `../html/otp.html`;
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

  // document.getElementById("confirm-payment").disabled = true;

  // async function SendMailOtp() {
  //   try {
  //     const isCardValid = await validateCardDetails();
  //     if (!isCardValid) {
  //       return;
  //     }

  //     const userId = getCurrentUserId();
  //     const usersCollectionRef = collection(db, 'users');
  //     const userQuery = query(usersCollectionRef, where('userId', '==', userId));
  //     const querySnapshot = await getDocs(userQuery);

  //     if (!querySnapshot.empty) {
  //       for (const doc of querySnapshot.docs) {
  //         const userData = doc.data();
  //         const userEmail = userData.email;
  //         const userName = userData.name;

  //         console.log('User Email:', userEmail);

  //         if (userEmail && userEmail.trim() !== '') {
  //           const otp = generateOTP();
  //           const otpGenerationTime = Date.now(); // Current time in milliseconds
  //           const otpExpirationTime = otpGenerationTime + 10 * 60 * 1000; // 10 minutes from now
  //           sessionStorage.setItem("generatedOTP", otp.trim());
  //           sessionStorage.setItem("otpGenerationTime", otpGenerationTime.toString());
  //           sessionStorage.setItem("otpExpirationTime", otpExpirationTime.toString());

  //           const templateParams = {
  //             from_name: userName,
  //             to_email: userEmail,
  //             otp: otp,
  //             expiration_time: new Date(otpExpirationTime).toLocaleString() // Formatted expiration time
  //           };

  //           console.log('Sending email with params:', templateParams);

  //           try {
  //             const response = await emailjs.send('service_7e6jx2j', 'template_l3gma7d', templateParams);
  //             window.alert("Success! OTP sent.");
  //             updateButtonVisibility();
  //             window.console.log('Success:', response);
  //           } catch (error) {
  //             alert("Failed to send OTP.");
  //             console.error('Error:', error);
  //           }
  //         } else {
  //           console.log('Invalid email address:', userEmail);
  //         }
  //       }
  //     } else {
  //       console.log("No such user found!");
  //     }
  //   } catch (error) {
  //     console.log("Error fetching user data:", error);
  //   }
  // }

  // document.getElementById("send-otp").addEventListener("click", function (e) {
  //   e.preventDefault();
  //   SendMailOtp();
  // });




  // document.addEventListener("DOMContentLoaded", function () {
  //   // document.getElementById("send-otp").addEventListener("click", function (e) {
  //   //   e.preventDefault();
  //   //   SendMailOtp();
  //   // });

  //   // document.getElementById("verify-otp").addEventListener("click", function (e) {
  //   //   e.preventDefault();
  //   //   verifyOTP();
  //   // });
  // });




  // Handle form submission for payment
  // const form = document.getElementById('payment-form');
  // form.addEventListener('submit', async (event) => {
  //   event.preventDefault();

  //   try {
  //     const userId = getCurrentUserId();
  //     if (!userId) {
  //       console.error("Invalid userId:", userId);
  //       return;
  //     }

  //     const userDocRef = doc(db, 'book', userId);
  //     const docSnap = await getDoc(userDocRef);

  //     if (docSnap.exists()) {
  //       const userData = docSnap.data();
  //       const bookingsArray = userData.bookings || [];
  //       const newestBooking = bookingsArray[bookingsArray.length - 1];

  //       if (!newestBooking) {
  //         console.error("No bookings found for user ID:", userId);
  //         return;
  //       }

  //       const paymentId = await generatePaymentID();

  //       const response = await fetch('/create-payment-intent', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({ amount: newestBooking.price, currency: 'myr' }),
  //       });

  //       if (!response.ok) {
  //         throw new Error('Failed to fetch client secret from server');
  //       }

  //       const { clientSecret } = await response.json();

  //       const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
  //         payment_method: {
  //           card: cardNumberElement,
  //           billing_details: {
  //             name: document.getElementById('cardHolder').value,
  //           },
  //         }
  //       });

  //       if (error) {
  //         console.error('Error confirming payment:', error);
  //         alert('Error confirming payment: ' + error.message);
  //       } else {
  //         console.log('Newest booking:', newestBooking);
  //         console.log('Category:', newestBooking.category);

  //         if (paymentIntent.status === 'succeeded') {
  //           const remainingBookings = bookingsArray.slice(0, -1);

  //           await setDoc(userDocRef, { bookings: remainingBookings }, { merge: true });

  //           const paymentDocRef = doc(db, 'payments', userId);

  //           try {
  //             const docSnap = await getDoc(paymentDocRef);

  //             let paymentsArray = [];

  //             if (docSnap.exists()) {
  //               const paymentData = docSnap.data();
  //               paymentsArray = paymentData.payments || [];
  //             } else {
  //               console.log("Creating new payments document for the user");
  //             }
  //             const totalPrice = newestBooking.totalPrice;

  //             paymentsArray.push({
  //               paymentId: paymentId,
  //               userId: userId,
  //               amount: newestBooking.price,
  //               payment_date: new Date().toISOString(),
  //               book_id: newestBooking.book_id,
  //               book_date: newestBooking.book_date,
  //               room_name: newestBooking.room_name,
  //               checkin_date: newestBooking.checkin_date,
  //               checkout_date: newestBooking.checkout_date,
  //               owner_name: newestBooking.owner_name,
  //               pet_name: newestBooking.pet_name,
  //               email: newestBooking.email,
  //               contact: newestBooking.contact,
  //               category: newestBooking.category,
  //               food_category: newestBooking.food_category,
  //               vaccination_image: newestBooking.vaccination_image,
  //               nights: newestBooking.nights,
  //               serviceTax: newestBooking.serviceTax,
  //               salesTax: newestBooking.salesTax,
  //               price: newestBooking.price,
  //               subtotal: newestBooking.subtotal,
  //               totalPrice: newestBooking.totalPrice,
  //               status: 'Paid',
  //             });
  //             await setDoc(paymentDocRef, { payments: paymentsArray }, { merge: true });

  //             // Send email notification
  //             await sendEmailNotificationOnSuccess(newestBooking);

  //             // Calculate and update member points
  //             const points = await calculatePoints(totalPrice);
  //             await updatePoints(points);

  //             // Update room quantity
  //             const deductionResult = await updateRoomQuantity(newestBooking.category, newestBooking.room_name, newestBooking.checkin_date, newestBooking.checkout_date);
  //             console.log(deductionResult);

  //             console.log('Payment details successfully saved.');

  //           } catch (error) {
  //             console.error('Error saving payment details:', error);
  //             throw new Error('Failed to save payment details');
  //           }

  //           alert('Payment confirmed for the latest booking.');
  //           window.location.href = "../html/bookingHistory.html";
  //         } else {
  //           console.error("No bookings found for user ID:", userId);
  //         }

  //       }
  //     } else {
  //       console.error("No bookings found for user ID:", userId);
  //     }
  //   } catch (e) {
  //     console.error('Error confirming payment:', e);
  //     alert('Error confirming payment. Please try again.');
  //   }
  // });

  async function fetchAndDisplayPersonalDetails(email) {
    try {
      console.log(`Fetching details for email: ${email}`);
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log('User data fetched:', userData);
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

  // async function calculatePoints(totalPrice) {
  //   const pointsPerRM = 1;
  //   const wholeRM = Math.floor(totalPrice);
  //   const points = wholeRM * pointsPerRM;
  //   return points;
  // }

  // async function updatePoints(points) {
  //   try {
  //     const user = auth.currentUser;
  //     if (!user) {
  //       console.error("No user is currently logged in.");
  //       return;
  //     }
  //     const userEmail = user.email;
  //     const usersCollection = collection(db, 'users');
  //     const q = query(usersCollection, where("email", "==", userEmail));
  //     const querySnapshot = await getDocs(q);
  //     if (!querySnapshot.empty) {
  //       const userDocRef = querySnapshot.docs[0].ref;
  //       const userDocSnap = await getDoc(userDocRef);
  //       if (userDocSnap.exists()) {
  //         const userData = userDocSnap.data();
  //         const existingPoints = Number(userData.points) || 0;
  //         const updatedPoints = existingPoints + Number(points);
  //         await updateDoc(userDocRef, { points: updatedPoints });
  //         window.alert(`Points updated successfully. New points: ${updatedPoints}`);
  //         console.log(`Points updated successfully. New points: ${updatedPoints}`);
  //         fetchAndDisplayPersonalDetails(userEmail); // Refresh the points display
  //       } else {
  //         console.log('User document does not exist.');
  //       }
  //     } else {
  //       console.log('No user document found with the specified email.');
  //     }
  //   } catch (error) {
  //     console.error('Error updating points:', error);
  //   }
  // }

  function printAmount(elementId, message) {
    document.getElementById(elementId).textContent = message;
  }

  async function redeemPoints() {
    try {
      const pointsText = document.getElementById('point').textContent;
      let points = parseFloat(pointsText.replace(/[^0-9.]/g, "").trim());
      if (points <= 0) {
        window.alert('No points available for redemption.');
        return;
      }
      const redeemedDiscount = points / 100;
      printAmount("point_amount", `-RM${redeemedDiscount.toFixed(2)}`);
      const totalPriceText = document.getElementById('totalprice').textContent;
      const totalPrice = parseFloat(totalPriceText.replace(/[^0-9.]/g, "").trim());
      // const pointsToDeduct = redeemedDiscount * 1000;
      const updatedTotalPrice = totalPrice - redeemedDiscount;
      printAmount("totalprice", `${updatedTotalPrice.toFixed(2)}`);
      console.log(`Total price: ${totalPrice}`);
      const user = auth.currentUser;
      const email = user ? user.email : null;

      if (email) {
        const pointsToDeduct = redeemedDiscount * 1000;
        await updateUserPointsByEmail(email, pointsToDeduct);
      }
      await fetchAndDisplayPersonalDetails(email);
    } catch (error) {
      console.error('Error redeeming points:', error);
    }
  }

  async function updateUserPointsByEmail(email, pointsToDeduct) {
    const q = query(collection(db, 'users'), where('email', '==', email));
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userRef = userDoc.ref;
        const userData = userDoc.data();
        const currentPoints = userData.points || 0;
        const updatedPoints = Math.max(0, currentPoints - pointsToDeduct);
        await updateDoc(userRef, { points: updatedPoints });
        console.log(`User points updated successfully. New points: ${updatedPoints}`);
        fetchAndDisplayPersonalDetails(email); // Refresh the points display
      } else {
        console.error('User document does not exist for the given email.');
      }
    } catch (error) {
      console.error('Error updating user points by email:', error);
    }
  }

  document.getElementById('redeem').addEventListener('click', (event) => {
    event.preventDefault(); // Prevents the form submission
    redeemPoints(); // Call the redeemPoints function
  });



});
