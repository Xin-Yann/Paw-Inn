import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

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

        console.log('Fetched Products:', productStocks); // Debugging
        return productStocks;
    }
    catch (error) {
        console.error('Error fetching documents: ', error);
    }
}

let inventoryChart = null;
let chart = null;

async function displaysSalesReport() {
    const inventory = await fetchAndDisplaySales();
    console.log('Fetched Inventory Data:', inventory); // Debugging

    const selectCategory = document.getElementById("selectCategory").value || 'dog';
    const selectSubcategory = document.getElementById("selectSubcategory").value || 'dry food';

    // Filter inventory based on selected category and subcategory
    const filteredInventory = inventory.filter(product => {
        const matchesCategory = selectCategory ? product.category === selectCategory : true;
        const matchesSubcategory = selectSubcategory ? product.subcategory === selectSubcategory : true;
        return matchesCategory && matchesSubcategory;
    });

    console.log('Filtered Inventory:', filteredInventory); // Debugging

    const labels = filteredInventory.map(product => `${product.subcategory} - ${product.name}`);
    const dataValues = filteredInventory.map(product => product.stock);

    // Use a unique color for each product
    const barColors = filteredInventory.map((_, index) => `rgba(${(index * 50) % 255}, 99, 132, 0.6)`);

    // Destroy the previous chart if it exists
    if (inventoryChart) {
        inventoryChart.destroy();
    }

    // Create the bar chart
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
                    display: false
                }
            },
            title: {
                display: true,
                text: "Product Inventory Levels"
            }
        }
    });
}

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
                                const parsedQuantity = parseInt(quantity, 10);
                                console.log("Date:", date, "Quantity:", parsedQuantity);
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

        console.log('Fetched Rooms:', roomStocks); // Debugging
        return roomStocks;
    }
    catch (error) {
        console.error('Error fetching documents: ', error);
    }
}

async function displayRoomInventoryChart() {
    const rooms = await fetchAndDisplayRoomInventory();
    console.log('Fetched Inventory Data:', rooms);

    const selectRoomCategory = document.getElementById("selectRoomCategory").value || 'dog';

    // Filter rooms based on the selected category
    const filteredRooms = rooms.filter(room => room.category === selectRoomCategory);

    // Extract data for chart
    const roomNames = filteredRooms.map(room => room.name); // Room names
    const roomStocksData = filteredRooms.map(room => room.stock); // Room stock quantities

    // Get the canvas element
    const ctx = document.getElementById('roomInventoryChart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    // Create the bar chart
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: roomNames,  // X-axis labels
            datasets: [{
                label: 'Room Stock',
                data: roomStocksData,  // Data to display in chart
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true  // Y-axis starts at 0
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

    // Function to update subcategories based on the selected category
    function updateSubcategoryOptions(category) {
        console.log('Selected category:', category); // Check category value

        // Clear existing options
        selectSubcategory.innerHTML = '';

        // Get the subcategory options for the selected category
        const options = subcategories[category] || [];
        console.log('Subcategories for selected category:', options); // Check options

        // Populate the selectSubcategory with new options
        options.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.toLowerCase();
            optElement.textContent = option;
            selectSubcategory.appendChild(optElement);
        });

        // Trigger displaysSalesReport when options are updated
        displaysSalesReport();
    }

    // Ensure elements exist before adding event listeners
    if (selectCategory && selectSubcategory) {
        // Event listener to update subcategories and trigger the sales report
        selectCategory.addEventListener("change", function () {
            const selectedCategory = selectCategory.value;
            updateSubcategoryOptions(selectedCategory);
        });

        // Event listener to trigger report when subcategory changes
        selectSubcategory.addEventListener("change", displaysSalesReport);

        // Initial population of subcategories based on the default category
        updateSubcategoryOptions(selectCategory.value);
    } else {
        console.error("Dropdown elements not found!");
    }

    if (selectRoomCategory) {
        selectRoomCategory.addEventListener("change", displayRoomInventoryChart);

        // Call displaysSalesReport to display data with default values
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
            document.getElementById('subcategoryFilter').style.display = 'block';
            document.getElementById('categoryFilter').style.display = 'block';
            document.getElementById('roomCategoryFilter').style.display = 'none';
            report.innerHTML = `
            <h1 class="title text-center py-5">Product Inventory Report</h1>
            <canvas id="inventoryChart" class="pb-5"></canvas>
        `;
            await displaysSalesReport();

        } else if (filter === 'rooms') {
            document.getElementById('subcategoryFilter').style.display = 'none';
            document.getElementById('categoryFilter').style.display = 'none';
            document.getElementById('roomCategoryFilter').style.display = 'block';
            report.innerHTML = `
            <h1 class="title text-center pb-5">Rooms Sales Report</h1>
            <canvas id="roomInventoryChart" class="pb-5"></canvas>
            `;
            await displayRoomInventoryChart();
        }
    }

    document.getElementById('type').addEventListener('change', async () => {
        await filterSalesReport();
    });
});
