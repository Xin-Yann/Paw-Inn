import { getFirestore, collection, getDocs, query, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Initialize Firestore
const db = getFirestore();

// Function to fetch data and display it
async function fetchDataAndDisplay() {
    try {
        const roomCategories = [{ category: 'dog', collectionName: 'dog rooms' }];

        for (const { category, collectionName } of roomCategories) {
            // Create a reference to the collection
            const dogRoomsCollectionRef = collection(db, 'rooms', category, collectionName);

            const dogRoomsQuerySnapshot = await getDocs(query(dogRoomsCollectionRef));

            const roomContainer = document.getElementById('rooms');
            roomContainer.innerHTML = '';

            for (const doc of dogRoomsQuerySnapshot.docs) {
                const roomData = doc.data();
                console.log("Fetching image for room:", roomData.room_name, "Image path:", roomData.room_image);

                const roomHTML = `
                    <div class="rooms-container" room-id="${roomData.room_id}" room-name="${roomData.room_name}" room-category="${category}" room-price="${roomData.room_price}" room-image="${roomData.room_image}" room-description="${roomData.room_description}" room-size="${roomData.room_size}" room-quantity="${roomData.room_quantity}">
                        <img class="card-img-top" src="/image/${category}/${roomData.room_image}" alt="${roomData.room_name}" style="cursor: pointer;">
                        <div class="card-body">
                            <h4 class="card-title">${roomData.room_name}</h4>
                            <p class="card-desc" style="height:25px">Room Size: ${roomData.room_size} sqft</p>
                            <p class="card-desc" style="height:25px">${roomData.room_description}</p>
                            <p class="card-text"><small class="text-muted">Available Slots: ${roomData.room_quantity}</small></p>
                            <p class="product-price pt-3">Price: RM${roomData.room_price}</p>
                            <button class="btn btn-primary book-now" room-id="${roomData.room_id}" id="book_now">Book Now</button>
                        </div>
                    </div>
                `;
                roomContainer.innerHTML += roomHTML;
            }
        }

        // Add event listeners to images and cards
        document.querySelectorAll('.rooms-container').forEach(container => {
            container.addEventListener('click', (event) => {
                if (event.target.classList.contains('card-img-top')) {
                    const roomData = {
                        id: container.getAttribute('room-id'),
                        name: container.getAttribute('room-name'),
                        category: container.getAttribute('room-category'),
                        price: container.getAttribute('room-price'),
                        image: container.getAttribute('room-image'),
                        description: container.getAttribute('room-description'),
                        size: container.getAttribute('room-size'),
                        quantity: container.getAttribute('room-quantity')
                    };
                    showModal(roomData);
                }
            });
        });

        // Add event listeners for the "Book Now" buttons
        document.querySelectorAll('.book-now').forEach(button => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation(); // Prevent triggering the container click event
                const roomId = button.getAttribute('room-id');
                const container = button.closest('.rooms-container');
                const roomData = {
                    id: roomId,
                    name: container.getAttribute('room-name'),
                    category: container.getAttribute('room-category'),
                    price: container.getAttribute('room-price'),
                    image: container.getAttribute('room-image'),
                    description: container.getAttribute('room-description'),
                    size: container.getAttribute('room-size'),
                    quantity: container.getAttribute('room-quantity')
                };

                const roomDocRef = doc(db, 'rooms', roomData.category, 'dog rooms', roomData.id);
                try {
                    const roomDocSnap = await getDoc(roomDocRef);
                    if (roomDocSnap.exists()) {
                        const updatedRoomData = roomDocSnap.data();
                        if (updatedRoomData.room_quantity <= 0) {
                            window.alert(`No slots available for ${roomData.name}.`);
                            return; // Exit the function if no slots are available
                        }

                        // Store selected room data in sessionStorage
                        sessionStorage.setItem('selectedRoomName', roomData.name);
                        sessionStorage.setItem('selectedRoomCategory', roomData.category);
                        sessionStorage.setItem('selectedRoomPrice', roomData.price);

                        window.location.href = `../html/booking.html`;
                    } else {
                        console.log('No such document!');
                    }
                } catch (error) {
                    console.error('Error getting document:', error);
                }
            });
        });

    } catch (error) {
        console.error("Error fetching and displaying data:", error);
    }
}

async function showModal(roomData) {
    const modalBody = document.getElementById('modal-body-content');

    modalBody.innerHTML = '';

    // Image
    if (roomData.image) {
        const roomImage = document.createElement('img');
        roomImage.src = `/image/${roomData.category}/${roomData.image}`;
        roomImage.alt = 'Room Image';
        roomImage.classList.add('img-fluid', 'mb-3', 'justify-content-center');
        modalBody.appendChild(roomImage);
    }

    // Name
    const roomName = document.createElement('h4');
    roomName.textContent = roomData.name;
    modalBody.appendChild(roomName);

    // Description
    const roomDescription = document.createElement('p');
    roomDescription.textContent = roomData.description;
    modalBody.appendChild(roomDescription);

    // Quantity
    const roomQuantity = document.createElement('p');
    roomQuantity.textContent = `Room Slot: ${roomData.quantity}`;
    modalBody.appendChild(roomQuantity);

    // Size
    const roomSize = document.createElement('p');
    roomSize.textContent = `Size: ${roomData.size} sqft`;
    modalBody.appendChild(roomSize);

    // Price
    const roomPrice = document.createElement('h5');
    roomPrice.textContent = `RM ${roomData.price}`;
    modalBody.appendChild(roomPrice);

    const bookNowButton = document.createElement('button');
    bookNowButton.classList.add('btn', 'btn-primary');
    bookNowButton.style.width = '-webkit-fill-available';
    bookNowButton.style.marginTop = '8px';
    bookNowButton.textContent = 'Book Now';
    bookNowButton.classList.add('btn', 'btn-primary');
    bookNowButton.setAttribute('room-id', roomData.id);
    bookNowButton.setAttribute('room-name', roomData.name);
    bookNowButton.setAttribute('room-category', roomData.category);
    bookNowButton.setAttribute('room-price', roomData.price);

    // Add event listener for redirecting to the booking page
    bookNowButton.addEventListener('click', () => {
        sessionStorage.setItem('selectedRoomName', roomData.name);
        sessionStorage.setItem('selectedRoomCategory', roomData.category);
        sessionStorage.setItem('selectedRoomPrice', roomData.price);
        console.log("Redirecting to booking page...");
        window.location.href = `../html/booking.html`;
    });

    modalBody.appendChild(bookNowButton);

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('room-details-modal'));
    modal.show();
}



document.addEventListener('DOMContentLoaded', (event) => {
    fetchDataAndDisplay(); // Ensure this is called after DOM is fully loaded
});
