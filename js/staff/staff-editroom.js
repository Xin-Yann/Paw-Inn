import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

// Function to get query parameter by name
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to fetch and display room details
async function fetchAndDisplayProductDetails() {
    try {
        const roomCategory = getQueryParam('category');
        const roomId = getQueryParam('id');
        const roomType = decodeURIComponent(getQueryParam('type'));

        if (!roomId || !roomType || !roomCategory) {
            alert('No room category, id or type found in URL');
            return;
        }

        const roomDocRef = doc(db, 'rooms', roomCategory, roomType, roomId);
        const roomSnapshot = await getDoc(roomDocRef);

        if (roomSnapshot.exists()) {
            const roomData = roomSnapshot.data();
            document.getElementById('room_category').value = roomCategory;
            document.getElementById('room_type').value = roomType;
            document.getElementById('room_id').value = roomId;
            document.getElementById('room_name').value = roomData.room_name || '';
            document.getElementById('room_description').value = roomData.room_description || '';
            document.getElementById('room_price').value = roomData.room_price || '';
            document.getElementById('room_quantity').value = roomData.room_quantity || '';
            document.getElementById('room_size').value = roomData.room_size || '';
        } else {
            alert('No such document!');
        }
    } catch (error) {
        console.error('Error fetching room details:', error);
    }
}

// Function to save edited room details
async function saveProductDetails() {
    try {
        const roomCategory = document.getElementById('room_category').value;
        const roomId = document.getElementById('room_id').value;
        const roomType = document.getElementById('room_type').value;
        const roomName = document.getElementById('room_name').value;
        const roomDescription = document.getElementById('room_description').value;
        const roomPrice = document.getElementById('room_price').value;
        const roomQuantity = parseInt(document.getElementById('room_quantity').value);
        const roomSize = document.getElementById('room_size').value;

        const roomDocRef = doc(db, 'rooms', roomCategory, roomType, roomId);

        // Check if required fields are filled
        if (!roomName || !roomPrice || !roomQuantity|| !roomSize || !roomDescription) {
            alert('Please fill out all required fields: name, price, quantity, size.');
            return;
        }

        // Check if the file input actually has a file
        const imageFile = document.getElementById('room_image').files[0];
        let imageName;

        if (imageFile) {
            imageName = imageFile.name; // Get the file name without uploading
            document.getElementById('room_image').value = imageName;
        } else {
            // Fetch the existing data to potentially get the existing image
            const currentSnapshot = await getDoc(roomDocRef);
            const currentData = currentSnapshot.exists() ? currentSnapshot.data() : {};
            imageName = currentData.room_image; // Retain the existing image name if no new file is uploaded
        }

        const updatedData = {
            room_image: imageName,
            room_name: roomName,
            room_description: roomDescription,
            room_price: roomPrice,
            room_quantity: roomQuantity,
            room_size: roomSize,
        };

        await updateDoc(roomDocRef, updatedData);
        alert('Room updated successfully!');
        
        
    } catch (error) {
        console.error('Error saving product details:', error);
        alert('Error saving product details: ' + error.message);
    }
}

document.getElementById('edit').addEventListener('click', saveProductDetails);

document.addEventListener('DOMContentLoaded', fetchAndDisplayProductDetails);
