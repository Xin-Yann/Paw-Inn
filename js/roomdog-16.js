import { getFirestore, collection, getDocs, query, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();

// Function to fetch data and display it
async function fetchDataAndDisplay() {
    try {
        // Reference to the specific document with ID "dog" in the "rooms" collection
        const dogDocRef = doc(collection(db, 'rooms'), 'dog');
        const dogRoomsCollectionRef = collection(dogDocRef, 'dog rooms');

        // Get the documents in the "dog rooms" subcollection
        const dogRoomsQuerySnapshot = await getDocs(query(dogRoomsCollectionRef));

        // Get the element to display rooms
        const room = document.getElementById('rooms');
        room.innerHTML = '';

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
                        <p class="card-desc" style="height:25px">Room Size: ${roomData.room_size}</p>
                        <p class="card-desc" style="height:25px">${roomData.room_description}</p>
                        <p class="card-text"><small class="text-muted">Available Slots: ${roomData.room_slot}</small></p>
                        <p class="product-price pt-3">Price: RM${roomData.room_price}</p>
                        <a href="" class="btn btn-primary add-cart">Book Now</a>
                    </div>
                </div>
            `;
            room.innerHTML += roomHTML;
        }
    } catch (error) {
        console.error("Error fetching and displaying data:", error);
    }
}

// Call the function to fetch and display data
fetchDataAndDisplay();
