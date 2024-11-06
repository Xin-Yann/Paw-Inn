import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

//Fetch product details
async function fetchAndDisplaySales() {
    const productStocks = [];
    try {
        const categories = {
            cat: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
            dog: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
            birds: ['dry food', 'toys', 'essentials', 'treats'],
            'fish&aquatics': ['dry food', 'essentials'],
            'hamster&rabbits': ['dry food', 'toys', 'essentials', 'treats']
        };

        for (const [category, subcategories] of Object.entries(categories)) {
            for (const subcategory of subcategories) {
                const collectionRef = collection(db, 'product', category, subcategory);
                const snapshot = await getDocs(collectionRef);

                snapshot.forEach(doc => {
                    const productData = doc.data();
                    const productStock = productData.product_stock || 0;
                    productStocks.push({
                        category: category,
                        subcategory: subcategory,
                        stock: productStock,
                        name: productData.product_name
                    });
                });
            }
        }

        console.log('Fetched Products:', productStocks); 
        return productStocks;
    }
    catch (error) {
        console.error('Error fetching documents: ', error);
    }
}

let inventoryChart = null;
let chart = null;

//Product Inventory Report
async function displaysSalesReport() {
    const inventory = await fetchAndDisplaySales();
    console.log('Fetched Inventory Data:', inventory);

    const selectCategory = document.getElementById("selectCategory").value || 'dog';
    const selectSubcategory = document.getElementById("selectSubcategory").value || 'dry food';

    const filteredInventory = inventory.filter(product => {
        const matchesCategory = selectCategory ? product.category === selectCategory : true;
        const matchesSubcategory = selectSubcategory ? product.subcategory === selectSubcategory : true;
        return matchesCategory && matchesSubcategory;
    });
    
    console.log('Filtered Inventory:', filteredInventory);

    const labels = filteredInventory.map(product => `${product.subcategory} - ${product.name}`);
    const dataValues = filteredInventory.map(product => product.stock);

    const barColors = filteredInventory.map((_, index) => `rgba(${(index * 50) % 255}, 99, 132, 0.6)`);

    const legendDiv = document.getElementById('legend');
    legendDiv.innerHTML = ''; 
    filteredInventory.forEach((product, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        const color = barColors[index];
        legendItem.innerHTML = `
            <span class="color-box" style="background-color: ${color};" aria-hidden="true"></span>
        <span class="legend-text">${product.subcategory} - ${product.name}: <span style="color: #127369; font-weight:bold;">${product.stock} in stock</span></span>
        `;
        legendDiv.appendChild(legendItem);
    });

    if (inventoryChart) {
        inventoryChart.destroy();
    }

    inventoryChart = new Chart("inventoryChart", {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Inventory Level",
                backgroundColor: barColors,
                data: dataValues
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Stock Level"
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,

                }
            },
            title: {
                display: true,
                text: "Product Inventory Levels"
            }
        }
    });
}

//Fetch room details
async function fetchAndDisplayRoomInventory() {
    const roomStocks = [];
    try {
        const categories = {
            cat: ['cat rooms'],
            dog: ['dog rooms'],
            cage: ['cage rooms'],
            rabbit: ['rabbit rooms']
        };

        for (const [category, subcategories] of Object.entries(categories)) {
            for (const subcategory of subcategories) {
                const collectionRef = collection(db, 'rooms', category, subcategory);
                const snapshot = await getDocs(collectionRef);

                snapshot.forEach(doc => {
                    const roomData = doc.data();
                    let roomQuantity = 0;
                    if (Array.isArray(roomData.room_quantity)) {

                        roomData.room_quantity.forEach((quantityObj, index) => {
                            Object.entries(quantityObj).forEach(([date, quantity]) => {
                                const parsedQuantity = parseInt(quantity, 10);   roomQuantity += parsedQuantity;
                                if (!isNaN(parsedQuantity)) {
                                    roomQuantity += parsedQuantity;
                                }
                            });

                        });

                        console.log("room_quantity is an object:", roomData.room_quantity);
                    } else {
                        console.warn("room_quantity is not an object:", roomData.room_quantity);
                    }
                    roomStocks.push({
                        category: category,
                        subcategory: subcategory,
                        stock: roomQuantity,
                        name: roomData.room_name
                    });
                });
            }
        }

        console.log('Fetched Rooms:', roomStocks);
        return roomStocks;
    }
    catch (error) {
        console.error('Error fetching documents: ', error);
    }
}

// Room Inventory Report
async function displayRoomInventoryChart() {
    const rooms = await fetchAndDisplayRoomInventory();
    console.log('Fetched Inventory Data:', rooms);

    const selectRoomCategory = document.getElementById("selectRoomCategory").value || 'dog';

    const filteredRooms = rooms.filter(room => room.category === selectRoomCategory);

    const roomNames = filteredRooms.map(room => room.name);
    const roomStocksData = filteredRooms.map(room => room.stock);

    const barColors = filteredRooms.map((_, index) => `rgba(${(index * 50) % 255}, 75, 192, 192, 0.2)`);

    const legendDiv = document.getElementById('roomslegend');
    legendDiv.innerHTML = ''; 
    filteredRooms.forEach((room, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        const color = barColors[index];
        legendItem.innerHTML = `
            <span class="color-box" style="background-color: #4bc0c0;" aria-hidden="true"></span>
            <span class="legend-text">${room.category} - ${room.name}: <span style="color: #127369; font-weight:bold;">${room.stock} in stock</span></span>
        `;
        legendDiv.appendChild(legendItem);
    });

    if (chart) {
        chart.destroy();
    }

    chart = new Chart("roomInventoryChart", {
        type: 'bar',
        data: {
            labels: roomNames,
            datasets: [{
                label: 'Room Stock',
                data: roomStocksData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const selectCategory = document.getElementById("selectCategory");
    const selectSubcategory = document.getElementById("selectSubcategory");

    const selectRoomCategory = document.getElementById("selectRoomCategory");

    const subcategories = {
        cat: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
        dog: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
        birds: ['dry food', 'toys', 'essentials', 'treats'],
        'fish&aquatics': ['dry food', 'essentials'],
        'hamster&rabbits': ['dry food', 'toys', 'essentials', 'treats']
    };

    function updateSubcategoryOptions(category) {
        console.log('Selected category:', category);

        selectSubcategory.innerHTML = '';

        const options = subcategories[category] || [];
        console.log('Subcategories for selected category:', options);

        options.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.toLowerCase();
            optElement.textContent = option;
            selectSubcategory.appendChild(optElement);
        });

        displaysSalesReport();
    }

    if (selectCategory && selectSubcategory) {
        selectCategory.addEventListener("change", function () {
            const selectedCategory = selectCategory.value;
            updateSubcategoryOptions(selectedCategory);
        });

        selectSubcategory.addEventListener("change", displaysSalesReport);

        updateSubcategoryOptions(selectCategory.value);
    } else {
        console.error("Dropdown elements not found!");
    }

    if (selectRoomCategory) {
        selectRoomCategory.addEventListener("change", displayRoomInventoryChart);

        displayRoomInventoryChart();
    } else {
        console.error("Dropdown elements not found!");
    }

    async function filterSalesReport() {
        const filter = document.getElementById('type').value;
        console.log('Filter:', filter);
        const report = document.getElementById('report');

        report.innerHTML = '';

        if (filter === 'product') {
            document.getElementById('filter').style.display = 'flex';
            document.getElementById('roomFilter').style.display = 'none';
            report.innerHTML = `
            <h1 class="title text-center py-5">Product Inventory Report</h1>
            <canvas id="inventoryChart" class="pb-5"></canvas>
            <div id="legend"></div>
        `;
            await displaysSalesReport();

        } else if (filter === 'rooms') {
            document.getElementById('filter').style.display = 'none';
            document.getElementById('roomFilter').style.display = 'flex';
            report.innerHTML = `
            <h1 class="title text-center pb-5">Rooms Inventory Report</h1>
            <canvas id="roomInventoryChart" class="pb-5"></canvas>
            <div id="roomslegend"></div>
            <p id="report-messages" style="display:none; color: red;"></p>
            
            `;
            await displayRoomInventoryChart();
        }
    }

    document.getElementById('type').addEventListener('change', async () => {
        await filterSalesReport();
    });
});
