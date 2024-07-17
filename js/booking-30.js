import { getFirestore, collection, setDoc, doc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {

  const db = getFirestore();
  const auth = getAuth();

  function getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
  }

  auth.onAuthStateChanged(async (user) => {
    try {
      if (user) {
        const userId = getCurrentUserId();
        if (!userId) {
          console.error("Invalid userId:", userId);
          return;
        }
        await fetchUserPayments(userId);
        await initCalendar(userId);
        console.log("User authenticated. User ID:", userId);
      } else {
      }
    } catch (error) {
      console.error("Error in authentication state change:", error);
    }
  });

  var currentDateTime = new Date();
  var year = currentDateTime.getFullYear();
  var month = (currentDateTime.getMonth() + 1);
  var date = (currentDateTime.getDate() + 1);

  if (date < 10) {
    date = '0' + date;
  }
  if (month < 10) {
    month = '0' + month;
  }

  var dateTomorrow = year + "-" + month + "-" + date;
  var checkinElem = document.querySelector("#checkin");
  var checkoutElem = document.querySelector("#checkout");

  checkinElem.setAttribute("min", dateTomorrow);

  checkinElem.onchange = function () {
    checkoutElem.setAttribute("min", this.value);
  }

  // Retrieve selected room name from sessionStorage
  const selectedRoomName = sessionStorage.getItem('selectedRoomName');
  if (selectedRoomName) {
    // Update the input field with the selected room name
    document.getElementById('room_name').value = selectedRoomName;
  }

  const selectedRoomPrice = sessionStorage.getItem('selectedRoomPrice');
  if (selectedRoomPrice) {
    // Update the input field with the selected room price
    document.getElementById('price').textContent = selectedRoomPrice;
  } else {
    console.error('Selected Room Price is undefined or null.');
  }


  // Inside the click event listener for the submit button
  document.getElementById("submit").addEventListener("click", async () => {
    try {
      const userId = getCurrentUserId();

      const roomName = document.getElementById('room_name').value;
      const checkinDate = document.getElementById('checkin').value;
      const checkoutDate = document.getElementById('checkout').value;
      const ownerName = document.getElementById('owner_name').value;
      const petName = document.getElementById('pet_name').value;
      const email = document.getElementById('email').value;
      const contact = document.getElementById('contact').value;
      const category = document.getElementById('category').value;
      const foodCategory = document.getElementById('food_category').value;
      const roomPrice = document.getElementById('price').textContent;
      const status = document.getElementById('status').value;

      // Validate required fields
      if (!roomName || !checkinDate || !checkoutDate || !ownerName || !petName || !email || !contact || !foodCategory) {
        alert('Please fill out all required fields.');
        return;
      }

      // Create or update a document within the "bookings" collection using the userId as the document ID
      const userDocRef = doc(db, 'book', userId);

      // Fetch the current data from Firestore
      const docSnap = await getDoc(userDocRef);
      let bookingsArray = [];

      if (docSnap.exists()) {
        // If the document exists, fetch its current data and update it
        const userData = docSnap.data();
        bookingsArray = userData.bookings || [];
      }

      // Construct new booking object
      const newBooking = {
        room_name: roomName,
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
        owner_name: ownerName,
        pet_name: petName,
        email: email,
        contact: contact,
        category: category,
        food_category: foodCategory,
        price: roomPrice,
        status: status
      };

      // Add the new booking to the array
      bookingsArray.push(newBooking);

      // Update the document in Firestore with the updated bookings array
      await setDoc(userDocRef, { bookings: bookingsArray }, { merge: true });

      console.log('Booking added to array in Firestore for user ID:', userId);
      // After successful booking addition, navigate to payment page
      console.log('Navigating to payment page...');
      window.location.href = "../html/payment.html";
    } catch (e) {
      console.error('Error saving booking details:', e);
      console.log('Error saving booking details: ' + e.message);
    }
  });

  // Define the function to fetch user payments
  async function fetchUserPayments(userId) {
    try {
      if (!userId) {
        throw new Error("Invalid userId:", userId);
      }

      const paymentDocRef = doc(db, 'payments', userId);
      const docSnapshot = await getDoc(paymentDocRef);

      if (docSnapshot.exists()) {
        const paymentData = docSnapshot.data().payments; // Assuming payments is an array

        if (!Array.isArray(paymentData)) {
          throw new Error("Invalid payments data:", paymentData);
        }

        const events = paymentData.map(payment => {
          // Validate and convert timestamps
          if (payment.checkin_date && payment.checkout_date &&
            typeof payment.checkin_date === 'string' && typeof payment.checkout_date === 'string') {
            return {
              title: payment.room_name || 'Unknown Room', // Fallback if room_name is missing
              start: new Date(payment.checkin_date), // Convert string to Date
              end: new Date(payment.checkout_date), // Convert string to Date
              className: 'payment-event'
            };
          } else {
            console.warn('Invalid payment data:', payment);
            return null; // Skip invalid data
          }
        }).filter(event => event !== null); // Filter out null events

        return events;
      } else {
        console.log('No payment document found for userId:', userId);
        return [];
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  // Function to initialize FullCalendar and render with fetched events
  async function initCalendar(userId) {
    try {
      if (!userId) {
        throw new Error("Invalid userId:", userId);
      }

        // Fetch user payments
        const events = await fetchUserPayments(userId);

        // Initialize FullCalendar with fetched events
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            initialDate: '2024-07-17',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: ''
            },
            events: events, // Assign fetched events to FullCalendar's events array
            eventDidMount: function (info) {
                // Apply the event's className to its element as a CSS class
                info.el.classList.add(info.event.extendedProps.className);
            }
        });

        // Render the calendar with updated events
        calendar.render();

    } catch (error) {
        // Handle error appropriately
        console.error('Failed to initialize calendar:', error);
    }
}

});

