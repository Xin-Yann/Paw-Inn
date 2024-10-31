import { getFirestore, doc, collection, query, orderBy, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

function createButton(htmlContent, onClickHandler) {
    const button = document.createElement('button');
    button.innerHTML = htmlContent;
    button.addEventListener('click', onClickHandler);
    button.classList.add('btn', 'btn-primary');
    return button;
}

async function fetchDataAndDisplay() {
    try {
        const roomType = document.getElementById('room-type').value;
        console.log('Selected room type:', roomType);

        const mainRoomType = roomType.split(' ')[0];
        const subcollectionName = roomType;

        if (!subcollectionName) {
            console.error('Unknown room type:', roomType);
            return;
        }

        const roomDocRef = doc(db, 'rooms', mainRoomType);
        const subcollectionRef = collection(roomDocRef, subcollectionName);

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
                    roomImage.src = `/image/${mainRoomType}/${roomData[field]}`;
                    roomImage.alt = 'Room Image';
                    roomImage.style.width = '375px';
                    roomImage.style.height = '201px';
                    roomImage.classList.add('table-image');
                    td.appendChild(roomImage);
                } else if (field === 'room_quantity' && Array.isArray(roomData[field])) {
                    const quantityMap = {};

                    roomData[field].forEach(item => {
                        if (item && typeof item === 'object') {
                            Object.entries(item).forEach(([date, quantity]) => {
                                if (!quantityMap[date]) {
                                    quantityMap[date] = 0;
                                }
                                quantityMap[date] += quantity;
                            });
                        }
                    });

                    const today = new Date();
                    const year = today.getFullYear();
                    const month = today.getMonth() + 1;

                    const currentMonthQuantities = Object.entries(quantityMap).filter(([key]) => {
                        const date = new Date(key);
                        return date >= today && date.getFullYear() === year && date.getMonth() + 1 === month; 
                    });

                    const quantityText = currentMonthQuantities
                        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                        .map(([date, quantity]) => `${date}: ${quantity}`)
                        .join('\n');

                    const p = document.createElement('p');
                    p.textContent = quantityText;
                    p.style.width = '150px';
                    td.appendChild(p);


                } else {
                    td.textContent = roomData[field] || 'N/A';
                }
                tr.appendChild(td);
            });

            const action1 = document.createElement('td');
            const editButton = createButton('Edit', () => {
                editRoom(roomData.id, mainRoomType, roomType);
            });
            editButton.classList.add('btn');
            action1.appendChild(editButton);
            tr.appendChild(action1);

            const action2 = document.createElement('td');
            const deleteButton = createButton('Delete', async () => {
                await deleteRoom(roomData.id, mainRoomType);
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

async function deleteRoom(roomId, mainRoomType) {
    try {
        const roomType = document.getElementById('room-type').value;
        const subcollectionName = roomType;
        if (!subcollectionName) {
            console.error('Unknown room type:', roomType);
            return;
        }

        const roomRef = doc(db, `rooms/${mainRoomType}/${subcollectionName}/${roomId}`);
        await deleteDoc(roomRef);
        alert('Room deleted successfully!');
        fetchDataAndDisplay();
    } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting room.');
    }
}

// Function to edit room page
function editRoom(roomId, mainRoomType, roomType) {
    window.location.href = `/html/staff/staff-editroom.html?category=${mainRoomType}&id=${roomId}&type=${encodeURIComponent(roomType)}`;
}

document.getElementById('room-type').addEventListener('change', fetchDataAndDisplay);

document.addEventListener('DOMContentLoaded', function () {
    fetchDataAndDisplay();
});
