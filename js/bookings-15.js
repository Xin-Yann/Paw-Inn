import { getFirestore, collection, setDoc, doc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

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
    };

    // Add the new booking to the array
    bookingsArray.push(newBooking);

    // Update the document in Firestore with the updated bookings array
    await setDoc(userDocRef, { bookings: bookingsArray }, { merge: true });

    window.location.href = "../html/payment.html";
    window.location.reload();

    console.log('Booking added to array in Firestore for user ID: ', userId);
  } catch (e) {
    console.error('Error saving booking details: ', e);
    alert('Error saving booking details: ' + e.message);
  }
});

