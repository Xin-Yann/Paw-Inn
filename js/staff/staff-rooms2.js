import { getFirestore, doc, collection, query, orderBy, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

function createButton(htmlContent, onClickHandler) {
    const button = document.createElement('button');
    button.innerHTML = htmlContent;
    button.addEventListener('click', onClickHandler);
    button.classList.add('btn', 'btn-primary');
    return button;
}

// Map room types to their respective subcollection names
const subcollectionMap = {
    cage: 'cage rooms',
    dog: 'dog rooms',
    cat: 'cat rooms',
    rabbit: 'rabbit rooms'
    // Add other room types and their subcollections here
};

// Function to fetch data and display it in the webpage based on room type
async function fetchDataAndDisplay() {
    try {
        const roomType = document.getElementById('room-type').value;
        console.log('Selected room type:', roomType);

        const subcollectionName = subcollectionMap[roomType];
        if (!subcollectionName) {
            console.error('Unknown room type:', roomType);
            return;
        }

        const catDocRef = doc(db, 'rooms', roomType);
        const subcollectionRef = collection(catDocRef, subcollectionName);

        const q = query(subcollectionRef, orderBy("room_id", "asc"));
        const querySnapshot = await getDocs(q);
        console.log('Fetched documents:', querySnapshot.docs);

        let documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Mapped documents:', documents);

        documents.sort((a, b) => {
            return naturalSort(a.room_id, b.room_id);
        });

        const roomContainer = document.getElementById('room-container');
        roomContainer.innerHTML = '';

        const table = document.createElement('table');
        table.classList.add('table', 'table-bordered', 'table-hover', 'table-style');
        table.style.backgroundColor = 'white';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Id', 'Image', 'Name', 'Description', 'Price (RM)', 'Quantity', 'Size', 'Edit', 'Delete'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        documents.forEach(roomData => {
            const tr = document.createElement('tr');

            ['room_id', 'room_image', 'room_name', 'room_description', 'room_price', 'room_quantity', 'room_size'].forEach(field => {
                const td = document.createElement('td');
                if (field === 'room_image' && roomData[field]) {
                    const roomImage = document.createElement('img');
                    roomImage.src = `/image/${roomType}/${roomData[field]}`;
                    roomImage.alt = 'Room Image';
                    roomImage.style.width = '375px';   
                    roomImage.style.height = '201px';
                    roomImage.classList.add('table-image');
                    td.appendChild(roomImage);
                } else {
                    td.textContent = roomData[field] || 'N/A';
                }
                tr.appendChild(td);
            });

            // Edit button
            const action1 = document.createElement('td');
            const editButton = createButton('Edit', () => {
                editRoom(roomData.id, roomType);
            });
            editButton.classList.add('btn');
            action1.appendChild(editButton);
            tr.appendChild(action1);

            // Delete button
            const action2 = document.createElement('td');
            const deleteButton = createButton('Delete', async () => {
                await deleteRoom(roomData.id, roomType);
            });
            deleteButton.classList.add('btn', 'btn-danger');
            action2.appendChild(deleteButton);
            tr.appendChild(action2);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        roomContainer.appendChild(table);
    } catch (error) {
        console.error('Error fetching documents:', error);
    }
}

function naturalSort(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Function to delete room
async function deleteRoom(roomId, roomType) {
    try {
        const subcollectionName = subcollectionMap[roomType];
        if (!subcollectionName) {
            console.error('Unknown room type:', roomType);
            return;
        }

        const roomRef = doc(db, `rooms/${roomType}/${subcollectionName}/${roomId}`);
        await deleteDoc(roomRef);
        alert('Room deleted successfully!');
        fetchDataAndDisplay();
    } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting room.');
    }
}

// Function to edit room page
function editRoom(roomId, roomType) {
    window.location.href = `/html/staff/staff-editroom.html?category=room&id=${roomId}&type=${encodeURIComponent(roomType)}`;
}

document.getElementById('room-type').addEventListener('change', fetchDataAndDisplay);

document.addEventListener('DOMContentLoaded', function() {
    fetchDataAndDisplay();
});
