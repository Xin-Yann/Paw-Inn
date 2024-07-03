import { getFirestore, collection, getDocs, query, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();

// Function to fetch data and display it
async function fetchDataAndDisplay() {
    try {
        // Reference to the specific document with ID "cat" in the "rooms" collection
        const catDocRef = doc(collection(db, 'rooms'), 'cat');
        const catRoomsCollectionRef = collection(catDocRef, 'cat rooms');

        // Get the documents in the "cat rooms" subcollection
        const catRoomsQuerySnapshot = await getDocs(query(catRoomsCollectionRef));

        // Get the element to display rooms
        const room = document.getElementById('rooms');
        room.innerHTML = '';

        // Iterate through each document and create HTML for it
        for (const doc of catRoomsQuerySnapshot.docs) {
            const roomData = doc.data();
            
            try {
                // Fetch imageUrl from roomData
                const imageUrl = roomData.room_image;
                
                const roomHTML = `
                    <div class="rooms-container">
                        <span class="product-id" style="display: none;">${roomData.room_id}</span>
                        <img class="card-img-top" src="/image/cat/${imageUrl}" alt="${roomData.room_name}" style="height:280px">
                        
                        <div class="card-body">
                            <h5 class="card-title">${roomData.room_name}</h5>
                            <p class="card-desc" style="height:25px">${roomData.room_size}</p>
                            <p class="card-desc" style="height:25px">${roomData.room_description}</p>
                            <p class="card-text"><small class="text-muted">Available Slots: ${roomData.room_slot}</small></p>
                            <p class="product-price pt-3">Price: RM${roomData.room_price}</p>
                            <a href="" class="btn btn-primary add-cart">Book Now</a>
                        </div>
                    </div>
                `;
                room.innerHTML += roomHTML;
            } catch (imageError) {
                console.error("Error fetching image URL for room:", roomData.room_name, imageError);
            }
        }
    } catch (error) {
        console.error("Error fetching and displaying data:", error);
    }
}

// Call the function to fetch and display data
fetchDataAndDisplay();
