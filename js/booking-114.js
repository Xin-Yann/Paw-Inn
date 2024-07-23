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
        fetchUserDataFromFirestore(userId);
        // await fetchUserPayments(userId);
        await initCalendar(userId);
        console.log("User authenticated. User ID:", userId);
      } else {
      }
    } catch (error) {
      console.error("Error in authentication state change:", error);
    }
  });

  // Get the current date and format it as YYYY-MM-DD
  var currentDateTime = new Date();
  var year = currentDateTime.getFullYear();
  var month = (currentDateTime.getMonth() + 1);
  var date = currentDateTime.getDate();

  if (date < 10) {
    date = '0' + date;
  }
  if (month < 10) {
    month = '0' + month;
  }

  var todayDate = year + "-" + month + "-" + date;

  // Calculate tomorrow's date
  var dateTomorrow = new Date();
  dateTomorrow.setDate(dateTomorrow.getDate() + 1);
  var yearTomorrow = dateTomorrow.getFullYear();
  var monthTomorrow = (dateTomorrow.getMonth() + 1);
  var dateTmrw = dateTomorrow.getDate();

  if (dateTmrw < 10) {
    dateTmrw = '0' + dateTmrw;
  }
  if (monthTomorrow < 10) {
    monthTomorrow = '0' + monthTomorrow;
  }

  var dateTomorrowFormatted = yearTomorrow + "-" + monthTomorrow + "-" + dateTmrw;

  // Set the min attribute and default value for the check-in input field
  var checkinElem = document.querySelector("#checkin");
  var checkoutElem = document.querySelector("#checkout");

  checkinElem.setAttribute("min", dateTomorrowFormatted);
  checkinElem.value = dateTomorrowFormatted;

  // Ensure the checkout date cannot be earlier than the check-in date
  checkinElem.onchange = function () {
    checkoutElem.setAttribute("min", this.value);
  }

  // Optionally set a default value for the checkout field (e.g., the day after the check-in date)
  var defaultCheckoutDate = new Date();
  defaultCheckoutDate.setDate(defaultCheckoutDate.getDate() + 2); // Set default checkout to 2 days after check-in

  var yearDefault = defaultCheckoutDate.getFullYear();
  var monthDefault = (defaultCheckoutDate.getMonth() + 1);
  var dateDefault = defaultCheckoutDate.getDate();

  if (dateDefault < 10) {
    dateDefault = '0' + dateDefault;
  }
  if (monthDefault < 10) {
    monthDefault = '0' + monthDefault;
  }

  var defaultCheckoutDateFormatted = yearDefault + "-" + monthDefault + "-" + dateDefault;
  checkoutElem.setAttribute("min", dateTomorrowFormatted);
  checkoutElem.value = defaultCheckoutDateFormatted;

  // Retrieve selected room name from sessionStorage
  const selectedRoomName = sessionStorage.getItem('selectedRoomName');
  const selectedRoomPrice = sessionStorage.getItem('selectedRoomPrice');
  const selectedRoomCategory = sessionStorage.getItem('selectedRoomCategory');

  document.getElementById('room_name').value = selectedRoomName;
  document.getElementById('price').textContent = selectedRoomPrice;
  document.getElementById('category').value = selectedRoomCategory;

  // Fetch room quantity and display it

  // async function fetchRoomQuantity(year = new Date().getFullYear()) {
  //   try {
  //     const roomCategories = [
  //       { category: 'cat', collectionName: 'cat rooms' },
  //       { category: 'dog', collectionName: 'dog rooms' },
  //       { category: 'rabbit', collectionName: 'rabbit rooms' },
  //       { category: 'cage', collectionName: 'cage rooms' },
  //     ];

  //     const events = [];
  //     const fixedDate = new Date(year, 7, 1); // Set to August 1st, adjust as needed
  //     const today = new Date(); // Current date

  //     for (const { category, collectionName } of roomCategories) {
  //       const docRef = doc(collection(db, 'rooms'), category);
  //       const roomCollectionRef = collection(docRef, collectionName);
  //       const roomQuerySnapshot = await getDocs(roomCollectionRef);

  //       roomQuerySnapshot.forEach(docSnap => {
  //         if (docSnap.exists()) {
  //           const roomData = docSnap.data();
  //           const roomQuantity = roomData.room_quantity || 0;
  //           const roomName = roomData.room_name || 'Unknown';

  //           // Create an event for the fixed date
  //           const eventDate = new Date(fixedDate); // Clone the fixed date
  //           eventDate.setHours(0, 0, 0, 0); // Ensure the time is set to 00:00:00

  //           // Only include events from today onwards
  //           if (eventDate >= today) {
  //             const event = {
  //               title: `Category: ${category.toUpperCase()}, ${roomName}, ${roomQuantity}`,
  //               extendedProps: { category: category },
  //               start: eventDate.toISOString().split('T')[0], // Keep only the date part in ISO format
  //               allDay: true, // Ensure the event is displayed within a single day
  //               className: 'room-event'
  //             };

  //             events.push(event);

  //             console.log(`Event created for date: ${eventDate.toISOString().split('T')[0]}`, event);
  //           }
  //         }
  //       });
  //     }

  //     console.log('Fetched events:', events);

  //     return events;
  //   } catch (error) {
  //     console.error('Error fetching room quantity:', error);
  //     return [];
  //   }
  // }

  async function generateBookingID() {
    const bookingCounterDocRef = doc(db, 'metadata', 'bookingCounter');
    try {
      const bookingCounterDoc = await getDoc(bookingCounterDocRef);
      let newBookingID = 1;
      if (bookingCounterDoc.exists()) {
        newBookingID = bookingCounterDoc.data().lastBookingID + 1;
      }
      await setDoc(bookingCounterDocRef, { lastBookingID: newBookingID });
      return `B${newBookingID.toString().padStart(2, '0')}`; // Example format: P00001
    } catch (e) {
      console.error('Failed to generate booking ID: ', e);
      throw new Error('Failed to generate booking ID');
    }
  }

  async function fetchUserDataFromFirestore(userId) {
    try {
      if (userId) {
        const usersCollectionRef = collection(db, 'users');
        const querySnapshot = await getDocs(query(usersCollectionRef, where('userId', '==', userId)));

        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          document.getElementById('owner_name').value = userData.name || '';
          document.getElementById('email').value = userData.email || '';
          document.getElementById('contact').value = userData.contact || '';
        });
      }
    } catch (e) {
      console.error('Error fetching user data: ', e);
    }
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
      const bookingId = await generateBookingID();

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
        book_id: bookingId,
        book_date: new Date().toISOString(),
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
  async function fetchRoomQuantity(year = new Date().getFullYear()) {
    try {
      const roomCategories = [
        { category: 'cat', collectionName: 'cat rooms' },
        { category: 'dog', collectionName: 'dog rooms' },
        { category: 'rabbit', collectionName: 'rabbit rooms' },
        { category: 'cage', collectionName: 'cage rooms' },
      ];

      const roomData = [];

      for (const { category, collectionName } of roomCategories) {
        const docRef = doc(collection(db, 'rooms'), category);
        const roomCollectionRef = collection(docRef, collectionName);
        const roomQuerySnapshot = await getDocs(roomCollectionRef);

        roomQuerySnapshot.forEach(docSnap => {
          if (docSnap.exists()) {
            const room = docSnap.data();
            const roomName = room.room_name || 'Unknown';
            const roomQuantities = room.room_quantity || []; // Array of maps

            // Process data for each month
            roomQuantities.forEach((monthData, monthIndex) => {
              for (const [date, quantity] of Object.entries(monthData)) {
                const roomDate = new Date(date);
                if (roomDate.getFullYear() === year) {
                  roomData.push({
                    category,
                    roomName,
                    date: date, // Store date as string
                    quantity: parseInt(quantity, 10),
                    month: roomDate.getMonth(), // Store month index for filtering
                  });
                }
              }
            });
          }
        });
      }

      console.log('Fetched room data:', roomData);
      return roomData;
    } catch (error) {
      console.error('Error fetching room quantity:', error);
      return [];
    }
  }
  async function initCalendar() {
    const calendarEl = document.getElementById('calendar');

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      initialDate: new Date().toISOString().split('T')[0],
      events: [], // No events to show
      validRange: {
        start: new Date().getFullYear() + '-01-01', // Start of the year
        end: new Date().getFullYear() + '-12-31'   // End of the year
      },
      dayCellDidMount: async function (info) {
        const cellDate = new Date(info.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (cellDate >= today) {
          const cell = info.el.querySelector('.fc-daygrid-day-frame');
          if (cell) {
            const roomData = await fetchRoomQuantity(); // Fetch room data

            const filterContainer = document.createElement('div');
            filterContainer.className = 'filter-controls';
            filterContainer.innerHTML = `
              <button data-category="dog">Dog</button>
              <button data-category="cat">Cat</button>
              <button data-category="rabbit">Rabbit</button>
              <button data-category="cage">Cage</button>
            `;

            cell.appendChild(filterContainer);

            filterContainer.querySelectorAll('button').forEach(button => {
              button.addEventListener('click', function () {
                const category = this.getAttribute('data-category');
                filterRoomData(category, roomData, cellDate.getDate(), cellDate.getMonth());
              });
            });
          }
        }
      }
    });

    function filterRoomData(category, roomData, day, month) {
      const filteredData = roomData.filter(room => {
        const roomDate = new Date(room.date);
        return roomDate.getDate() === day && roomDate.getMonth() === month && (category === 'all' || room.category === category);
      });
      console.log('Filtered room data:', filteredData);
      displayRoomDetails(filteredData);
    }

    function displayRoomDetails(roomData) {
      const modalTitle = document.getElementById('eventModalLabel');
      const modalBody = document.querySelector('#eventModal .modal-body');

      let modalContent = '<ul>';
      roomData.forEach(room => {
        modalContent += `
          <li>
            <strong>Room Name:</strong> ${room.roomName}<br>
            <strong>Quantity:</strong> ${room.quantity}
          </li>
        `;
      });
      modalContent += '</ul>';

      modalTitle.textContent = `Room Details`;
      modalBody.innerHTML = modalContent;

      // Show the modal
      const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
      eventModal.show();
    }

    calendar.render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCalendar();
  });



});