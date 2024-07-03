import { getFirestore, collection, setDoc, doc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

document.getElementById("add").addEventListener("click", async () => {
    try {
        const category = document.getElementById('room_category').value;
        const type = document.getElementById('room_type').value;
        const roomId = document.getElementById('room_id').value;

        const roomName = document.getElementById('room_name').value;
        const roomDescription = document.getElementById('room_description').value;
        const roomPrice = document.getElementById('room_price').value;
        const roomQuantity = document.getElementById('room_quantity').value;
        const roomSize = document.getElementById('room_size').value;

        if (!roomId || !roomName || !roomPrice || !roomQuantity|| !roomSize) {
            alert('Please fill out all required fields: category, type, ID, name, price, quantity, size.');
            return;
        }

        if (category === "Select category") {
            alert('Please select a category.');
            return;
        }

        if (type === "Select type") {
            alert('Please select a type.');
            return;
        }

        // Check if the room ID already exists
        const roomRef = doc(collection(db, 'rooms', category, type), roomId);
        const roomSnapshot = await getDoc(roomRef);

        if (roomSnapshot.exists()) {
            alert('Room ID already exists. Please choose a different ID.');
            return;
        }

        // Check if the room name already exists
        const roomsQuery = query(collection(db, 'rooms', category, type), where("room_name", "==", roomName));
        const querySnapshot = await getDocs(roomsQuery);

        if (!querySnapshot.empty) {
            alert('Room name already exists. Please choose a different name.');
            return;
        }

        // Get the full path of the image
        const imagePath = document.getElementById('room_image').value;
        // Extract only the file name
        const imageName = imagePath.split('\\').pop().split('/').pop();

        // Set the document in Firestore
        await setDoc(roomRef, {
            room_id: roomId,
            room_image: imageName,
            room_name: roomName,
            room_description: roomDescription,
            room_price: roomPrice,
            room_quantity: roomQuantity,
            room_size: roomSize,
        });

        alert('Room added successfully!');
        window.location.reload();

        console.log('Document written with ID: ', roomId);
    } catch (e) {
        console.error('Error adding document: ', e);
        alert('Error adding document: ' + e.message);
    }
});

// Add an event listener to the room category select element
document.getElementById("room_category").addEventListener("change", function () {
    updateOptions();
});

function updateOptions() {
    var categorySelect = document.getElementById("room_category");
    var typeSelect = document.getElementById("room_type");
    var selectedCategory = categorySelect.value;

    typeSelect.innerHTML = '<option disabled selected>Select type</option>';

    // Add type options based on the selected category
    switch (selectedCategory) {
        case "dog":
            addOption("dog rooms");
            break;
        case "cat":
            addOption("cat rooms");
            break;
        case "rabbit":
            addOption("rabbit rooms");
            break;
        case "cage":
            addOption("cage rooms");
            break;
    }
}

function addOption(type) {
    var typeSelect = document.getElementById("room_type");
    var option = document.createElement("option");
    option.text = type;
    option.value = type;
    typeSelect.add(option);
}