import { getFirestore, collection, setDoc, doc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

document.getElementById("add").addEventListener("click", async () => {
    try {
        const category = document.getElementById('room_category').value;
        const type = document.getElementById('room_type').value;
        const roomId = document.getElementById('room_id').value;

        const roomName = document.getElementById('room_name').value;
        const roomDescription = document.getElementById('room_description').value;
        const roomPrice = parseFloat(document.getElementById('room_price').value);
        const roomQuantity = parseInt(document.getElementById('room_quantity').value, 10);
        const roomSize = parseInt(document.getElementById('room_size').value);
        const imagePath = document.getElementById('room_image').value;

        const price = /^\d+(\.\d{1,2})?$/;
        const quantityAndSize = /^\d+$/;

        if (!roomId || !roomName || !roomPrice || !roomQuantity || !roomSize || !imagePath) {
            alert('Please fill out all required fields: category, type, ID, name, price, quantity, size and image.');
            return;
        }
        
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

        if (category === "Select category") {
            alert('Please select a category.');
            return;
        }

        if (type === "Select type") {
            alert('Please select a type.');
            return;
        }

        const roomRef = doc(collection(db, 'rooms', category, type), roomId);
        const roomSnapshot = await getDoc(roomRef);

        if (roomSnapshot.exists()) {
            alert('Room ID already exists. Please choose a different ID.');
            return;
        }

        const roomsQuery = query(collection(db, 'rooms', category, type), where("room_name", "==", roomName));
        const querySnapshot = await getDocs(roomsQuery);

        if (!querySnapshot.empty) {
            alert('Room name already exists. Please choose a different name.');
            return;
        }

        const imageName = imagePath.split('\\').pop().split('/').pop();

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

        console.log(roomQuantitybyMonth);
        
        await setDoc(roomRef, {
            room_id: roomId,
            room_image: imageName,
            room_name: roomName,
            room_description: roomDescription,
            room_price: roomPrice,
            room_quantity: roomQuantitybyMonth,
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
    option.selected = true;
    typeSelect.add(option);
}

function formattedDate(date) {
    return date.toISOString().split('T')[0];
}

function generateDate(startDate, endDate) {
    const dateArray = [];
    let currentDate = new Date(startDate); // Start from startDate;
    while (currentDate <= endDate) {
        dateArray.push(formattedDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
}
