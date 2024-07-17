import { getFirestore, collection, getDocs, query, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();

// Variable to store selected room name
let selectedRoomName = '';

// Function to fetch data and display it
async function fetchDataAndDisplay() {
    try {
        // Reference to the specific document with ID "dog" in the "rooms" collection
        const dogDocRef = doc(collection(db, 'rooms'), 'dog');
        const dogRoomsCollectionRef = collection(dogDocRef, 'dog rooms');

        // Get the documents in the "dog rooms" subcollection
        const dogRoomsQuerySnapshot = await getDocs(query(dogRoomsCollectionRef));

        // Get the element to display rooms
        const roomContainer = document.getElementById('rooms');
        roomContainer.innerHTML = '';

        // Iterate through each document and create HTML for it
        for (const doc of dogRoomsQuerySnapshot.docs) {
            const roomData = doc.data();
            console.log("Fetching image for room:", roomData.room_name, "Image path:", roomData.room_image);

            // Create the HTML for each room
            const roomHTML = `
                <div class="rooms-container">
                    <span class="product-id" style="display: none;">${roomData.room_id}</span>
                    <img class="card-img-top" src="/image/dog/${roomData.room_image}" alt="${roomData.room_name}">
                    
                    <div class="card-body">
                        <h4 class="card-title">${roomData.room_name}</h4>
                        <p class="card-desc" style="height:25px">Room Size: ${roomData.room_size} sqft</p>
                        <p class="card-desc" style="height:25px">${roomData.room_description}</p>
                        <p class="card-text"><small class="text-muted">Available Slots: ${roomData.room_quantity}</small></p>
                        <p class="product-price pt-3">Price: RM${roomData.room_price}</p>
                        <button class="btn btn-primary submit" data-room-name="${roomData.room_name}" product_price="${roomData.room_price}">Book Now</button>
                    </div>
                </div>
            `;
            roomContainer.innerHTML += roomHTML;
        }

        const bookButtons = document.querySelectorAll('.submit');
        bookButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const roomName = button.getAttribute('data-room-name');
                
                // Retrieve the price associated with the selected room
                const roomPriceElement = button.parentElement.querySelector('.product-price');
                
                // Check if roomPriceElement is not null or undefined and then retrieve the price
                let roomPrice = '';
                if (roomPriceElement) {
                    roomPrice = roomPriceElement.textContent.replace('Price: RM', '').trim(); // Remove 'Price: RM' and trim whitespace
                } else {
                    console.error('Price element not found for room:', roomName);
                    // Handle the error or fallback gracefully
                }
        
                // Store selected room name and price in sessionStorage
                sessionStorage.setItem('selectedRoomName', roomName);
                sessionStorage.setItem('selectedRoomPrice', roomPrice);
        
                // Redirect to booking page
                window.location.href = `/html/booking.html`;
            });
        });
        

    } catch (error) {
        console.error("Error fetching and displaying data:", error);
    }
}

// Call the function to fetch and display data when the DOM is loaded
document.addEventListener('DOMContentLoaded', (event) => {
    fetchDataAndDisplay();
});