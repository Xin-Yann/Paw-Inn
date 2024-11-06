import { getFirestore, doc, getDoc, updateDoc,  } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

//Function to fetch room detials 
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

async function saveProductDetails() {
    try {
        const roomCategory = document.getElementById('room_category').value;
        const roomId = document.getElementById('room_id').value;
        const roomType = document.getElementById('room_type').value;
        const roomName = document.getElementById('room_name').value;
        const roomDescription = document.getElementById('room_description').value;
        const roomPrice = parseFloat(document.getElementById('room_price').value);
        const roomQuantity = parseInt(document.getElementById('room_quantity').value);
        const roomSize = parseInt(document.getElementById('room_size').value);

        const roomDocRef = doc(db, 'rooms', roomCategory, roomType, roomId);

        // Check if price, quantity and size format
        const price = /^\d+(\.\d{1,2})?$/;
        const quantityAndSize = /^\d+$/;

        if (!price.test(roomPrice)) {
            alert('Invalid Price. Please enter a valid number with up to two decimal places.');
            return;
        } 

        if (!quantityAndSize.test(roomQuantity)) {
            alert('Invalid Quantity. Please enter a valid number.');
            return;
        }  
        
        if (!quantityAndSize.test(roomSize)) {
            alert('Invalid Size. Please enter a valid number.');
            return;
        }

         // Check if required fields are filled
        if (!roomName || !roomPrice || !roomQuantity || !roomSize || !roomDescription) {
            alert('Please fill out all required fields: name, price, quantity, size.');
            return;
        }

        const roomSnapshot = await getDoc(roomDocRef);
        if (!roomSnapshot.exists()) {
            alert('Room not found!');
            return;
        }

        const currentRoomData = roomSnapshot.data();
       
        const today = new Date();
        const endDate = new Date();
        endDate.setFullYear(today.getFullYear() + 2);
        const date = generateDate(today, endDate);
        let roomQuantitybyMonth = [];
        let index = -1;
        let currentMonth = "";

        date.forEach(date => {
            const [year, month] = date.split('-');
            const monthIndex = `${year}-${month}`;

            if (monthIndex !== currentMonth) {
                currentMonth = monthIndex;
                index++;
                roomQuantitybyMonth[index] = {};
            }

            roomQuantitybyMonth[index][date]= roomQuantity;
        
        });
       
        const imageFile = document.getElementById('room_image').files[0];
        let imageName;

        if (imageFile) {
            imageName = imageFile.name;
        } else {
            imageName = currentRoomData.room_image;
        }

        const updatedData = {
            room_image: imageName,
            room_name: roomName,
            room_description: roomDescription,
            room_price: roomPrice,
            room_quantity: roomQuantitybyMonth,
            room_size: roomSize,
        };

        await updateDoc(roomDocRef, updatedData);
        alert('Room updated successfully!');

        window.location.href = "../staff/staff-room.html";

    } catch (error) {
        console.error('Error saving product details:', error);
        alert('Error saving product details: ' + error.message);
    }
}

function formattedDate(date) {
    return date.toISOString().split('T')[0];
}

function generateDate(startDate, endDate) {
    const dateArray = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dateArray.push(formattedDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
}

document.getElementById('edit').addEventListener('click', saveProductDetails);

document.addEventListener('DOMContentLoaded', fetchAndDisplayProductDetails);
