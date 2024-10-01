import { getFirestore, collection, getDocs, query, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Initialize Firestore
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
            console.log("User is not authenticated.");
        }
    } catch (error) {
        console.error("Error in authentication state change:", error);
    }
});


// Function to fetch data and display it
async function fetchDataAndDisplay() {
    try {
        const roomCategories = [{ category: 'cat', collectionName: 'cat rooms' }];

        for (const { category, collectionName } of roomCategories) {
            // Create a reference to the collection
            const dogRoomsCollectionRef = collection(db, 'rooms', category, collectionName);

            const dogRoomsQuerySnapshot = await getDocs(query(dogRoomsCollectionRef));

            const roomContainer = document.getElementById('rooms');
            roomContainer.innerHTML = '';

            for (const doc of dogRoomsQuerySnapshot.docs) {
                const roomData = doc.data();
                console.log("Fetching image for room:", roomData.room_name, "Image path:", roomData.room_image);

                // Determine the overall availability status
                let isAvailable = false;
                let isSellingFast = false;

                // roomData.room_quantity.forEach(quantityMap => {
                //     for (const quantity of Object.values(quantityMap)) {
                //         const parsedQuantity = parseInt(quantity);
                //         if (parsedQuantity > 0) {
                //             isAvailable = true;
                //         }
                //         if (parsedQuantity > 0 && parsedQuantity < 5) {
                //             isSellingFast = true;
                //         }
                //     }
                // });

                if (Array.isArray(roomData.room_quantity)) {

                    roomData.room_quantity.forEach((quantityObj, index) => {
                        Object.entries(quantityObj).forEach(([date, quantity]) => {
                            const parsedQuantity = parseInt(quantity, 10);
                            console.log("Date:", date, "Quantity:", parsedQuantity);
                            if (!isNaN(parsedQuantity)) {
                                if (parsedQuantity > 0) {
                                    isAvailable = true;
                                }
                                if (parsedQuantity > 0 && parsedQuantity < 5) {
                                    isSellingFast = true;
                                }
                            }
                        });

                    });

                    console.log("room_quantity is an object:", roomData.room_quantity);
                } else {
                    console.warn("room_quantity is not an object:", roomData.room_quantity);
                }


                let statusMessage = "None";
                if (isAvailable) {
                    statusMessage = isSellingFast ? "Selling Fast" : "Available";
                }

                if (!isAvailable) {
                    statusMessage = "Fully Booked";
                }

                const roomHTML = `
            <div class="rooms-container" room-id="${roomData.room_id}" room-name="${roomData.room_name}" room-category="${category}" room-price="${roomData.room_price}" room-image="${roomData.room_image}" room-description="${roomData.room_description}" room-size="${roomData.room_size}" room-status="${statusMessage}">
                <img class="card-img-top pb-3" src="/image/${category}/${roomData.room_image}" alt="${roomData.room_name}" style="cursor: pointer;">
                <div class="card-body">
                    <h4 class="card-title pt-3">${roomData.room_name}</h4>
                    <p class="card-desc" style="height:25px">${roomData.room_description}</p>
                    <p class="pt-3"><b>Room Size:</b> ${roomData.room_size} sqft</p>
                    <p >Available Status: ${statusMessage}</p>
                    <h5 class="product-price py-3">RM${roomData.room_price}</h5>
                    <button class="btn btn-primary book-now" room-id="${roomData.room_id}" id="book-now">Book Now</button>
                </div>
            </div>
        `;
                roomContainer.innerHTML += roomHTML;
            }
        }


        // Add event listeners to images and cards
        document.querySelectorAll('.rooms-container').forEach(container => {
            container.addEventListener('click', () => {
                const roomData = {
                    id: container.getAttribute('room-id'),
                    name: container.getAttribute('room-name'),
                    category: container.getAttribute('room-category'),
                    price: container.getAttribute('room-price'),
                    image: container.getAttribute('room-image'),
                    description: container.getAttribute('room-description'),
                    size: container.getAttribute('room-size'),
                    quantity: container.getAttribute('room-status')
                };
                showModal(roomData);
            });
        });

        document.querySelectorAll('.card-img-top').forEach(container => {
            container.addEventListener('click', () => {
                const roomData = {
                    id: container.getAttribute('room-id'),
                    name: container.getAttribute('room-name'),
                    category: container.getAttribute('room-category'),
                    price: container.getAttribute('room-price'),
                    image: container.getAttribute('room-image'),
                    description: container.getAttribute('room-description'),
                    size: container.getAttribute('room-size'),
                    quantity: container.getAttribute('room-status')
                };
                showModal(roomData);
            });

        });

        // Add event listeners for the "Book Now" buttons
        document.querySelectorAll('.book-now').forEach(button => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation(); // Prevent triggering the container click event
                const userId = getCurrentUserId();
                if (!userId) {
                    window.alert(`Please login to make booking.`);
                    window.location.href = "/html/login.html";
                    return;
                }
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
                    quantity: container.getAttribute('room-status')
                };

                if (roomData.quantity === "Fully Booked" || roomData.quantity == "None") {
                    window.alert(`No slots available for ${roomData.name}.`);
                } else {
                    // Store selected room data in sessionStorage
                    sessionStorage.setItem('selectedRoomName', roomData.name);
                    sessionStorage.setItem('selectedRoomCategory', roomData.category);
                    sessionStorage.setItem('selectedRoomPrice', roomData.price);

                    window.location.href = `../html/booking.html`;
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
        roomImage.classList.add('img-fluid', 'mb-5', 'justify-content-center');
        modalBody.appendChild(roomImage);
    }

    // Name
    const roomName = document.createElement('h4');
    roomName.classList.add('pb-3');
    roomName.style.fontWeight = "bold";
    roomName.textContent = roomData.name;
    modalBody.appendChild(roomName);

    // Description
    const roomDescription = document.createElement('p');
    roomDescription.style.fontWeight = "normal";
    roomDescription.textContent = roomData.description;
    modalBody.appendChild(roomDescription);

    // Quantity
    const roomQuantity = document.createElement('p');
    roomQuantity.classList.add('pt-3');
    roomQuantity.textContent = `Available Staus: ${roomData.quantity}`;
    modalBody.appendChild(roomQuantity);

    // Size
    const roomSize = document.createElement('p');
    roomSize.textContent = `Size: ${roomData.size} sqft`;
    modalBody.appendChild(roomSize);

    // Price
    const roomPrice = document.createElement('h4');
    roomPrice.classList.add('py-3');
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
    bookNowButton.setAttribute('room-status', roomData.quantity);


    // Add event listener for redirecting to the booking page
    bookNowButton.addEventListener('click', () => {
        const userId = getCurrentUserId();
        if (!userId) {
            window.alert(`Please login to make booking.`);
            window.location.href = "/html/login.html";
            return;
        }
        if (roomData.quantity == "Fully Booked" || roomData.quantity == "None") {
            window.alert(`No slots available for ${roomData.name}.`);
        } else {
            sessionStorage.setItem('selectedRoomName', roomData.name);
            sessionStorage.setItem('selectedRoomCategory', roomData.category);
            sessionStorage.setItem('selectedRoomPrice', roomData.price);
            console.log("Redirecting to booking page...");
            window.location.href = `../html/booking.html`;
        }
    });


    modalBody.appendChild(bookNowButton);

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('room-details-modal'));
    modal.show();
}

document.addEventListener('DOMContentLoaded', (event) => {
    fetchDataAndDisplay(); // Ensure this is called after DOM is fully loaded
});
