import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

let selectYear;

//Function to fetch orders details
async function fetchAndDisplaySales() {
    const sales = {};
    const selectedCategory = document.getElementById('selectProductCategory').value;
    try {
        const orderCollectionRef = collection(db, 'orders');
        const querySnapshot = await getDocs(orderCollectionRef)

        if (querySnapshot.empty) {
            console.log("No orders found.");
        } else {


            querySnapshot.forEach((doc) => {
                const order = doc.data();

                const cartItems = order.cartItems || [];
                const paymentDateObj = order.paymentDate ? new Date(order.paymentDate) : null;
                const paymentDate = paymentDateObj ? paymentDateObj.toLocaleString() : 'N/A';

                if (paymentDateObj) {
                    const year = paymentDateObj.getFullYear();
                    const month = paymentDateObj.getMonth() + 1;

                    if (!sales[year]) {
                        sales[year] = {}; 
                    }

                    if (!sales[year][month]) {
                        sales[year][month] = {}; 
                    }

                    cartItems.forEach((item) => {
                        const price = parseFloat(item.price) || 0; 
                        const type = item.type || '';
                        const category = item.category || '';
                        if (selectedCategory === 'all' || selectedCategory === category) {
                            if (!sales[year][month][type]) {
                                sales[year][month][type] = 0;
                            }

                            sales[year][month][type] += price;
                        } 
                    });
                }
            });
        }
    }
    catch (error) {
        console.error('Error fetching documents: ', error);
    }
    console.log(sales);
    return sales;

}

let myChart = null;
let myChart2 = null;

// Product Sales Report
async function displaysSalesReport() {
    const selectedCategory = document.getElementById("selectProductCategory").value;
    document.getElementById('salesReport').style.display = 'none';
    document.getElementById('report').style.display = 'block';
    const sales = await fetchAndDisplaySales(selectedCategory);
    console.log('Fetched Sales Data:', sales);

    const year = Object.keys(sales)[0] ? selectYear.value : new Date().getFullYear();
    const totalSales = sales[year] || {};
    console.log('Year passed :', year);
    console.log('Sales Data for the Year:', totalSales);

    const xValues = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const types = new Set();
    const barColors = ["#2a9d8f", "#ffbdbd", "#f4a300", "#87ceeb", "#4a7f6f", "#6a5acd", "#6b8e23", "#4682b4", "#ff4500", "#ff6f61", "#dcbdff", "#e6ffbd"];
    const roomColorMap = {};

    Object.values(totalSales).forEach((monthlyData) => {
        Object.keys(monthlyData).forEach(type => {
            console.log(`Found type: ${type}`);
            types.add(type);
        });
    });

    console.log('Types:', Array.from(types));

    const yValues = Array.from(types).map((type, index) => {
        const color = barColors[index % barColors.length];
        roomColorMap[type] = color;

        return {
            label: type,
            backgroundColor: color,
            data: xValues.map((_, monthIndex) => {
                const month = monthIndex + 1;
                return totalSales[month] && totalSales[month][type] ? totalSales[month][type] : 0;
            }),
            stack: 'Stack 0'
        };
    });


    console.log('Data:', yValues);

    const selectProductCategory = document.getElementById('selectProductCategory').value;
    const capitalProductCategory = selectProductCategory.charAt(0).toUpperCase() + selectProductCategory.slice(1);

    const legendDiv = document.getElementById('productLegend');
    legendDiv.innerHTML = '';

    const titleElement = document.createElement('h4');
    titleElement.classList.add('legendTitle');
    titleElement.textContent = `${capitalProductCategory} Product Sales by Month`;
    legendDiv.appendChild(titleElement);

    const legendContainer = document.createElement('div');
    legendContainer.classList.add('productLegend', 'pt-5');

    Object.keys(totalSales).forEach((month) => {
        const monthNumber = parseInt(month);
        const monthName = xValues[monthNumber - 1];

        const monthSection = document.createElement('div');
        monthSection.innerHTML = `<h5>${monthName} Sales</h5>`;

        Array.from(types).forEach((type) => {
            const total = totalSales[monthNumber] && totalSales[monthNumber][type] ? totalSales[monthNumber][type] : 0;
            const decimalTotal = total.toFixed(2);

            if (total > 0) {

                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item';

                const color = roomColorMap[type];

                legendItem.innerHTML = `
                <span class="color-box" style="background-color: ${color};" aria-hidden="true"></span>
                <span class="legend-text">${type}: <span style="color: #127369; font-weight:bold;">RM ${decimalTotal}</span></span>
            `;
                monthSection.appendChild(legendItem);
            }
        });

        if (monthSection.childNodes.length > 1) {
            legendContainer.appendChild(monthSection);
        }
    });

    legendDiv.appendChild(legendContainer);

    if (myChart) {
        myChart.destroy();
    }

    if (Object.keys(totalSales).length === 0) {
        document.getElementById('report-messages').textContent = 'No report found for the selected filters.';
        document.getElementById('report-messages').style.display = 'block';
        document.getElementById('productLegend').style.display = 'none';
        const chartElement = document.getElementById('myChart');
        if (chartElement) {
            chartElement.style.display = 'none';
        }
        return;
    } else {
        document.getElementById('report-messages').style.display = 'none';
        document.getElementById('productLegend').style.display = 'block';
        const chartElement = document.getElementById('myChart');
        if (chartElement) {
            chartElement.style.display = 'block';
        }
    }

    myChart = new Chart("myChart", {
        type: "bar",
        data: {
            labels: xValues,
            datasets: yValues
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    },
                    stacked: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Sales (RM)'
                    },
                    beginAtZero: true,
                    stacked: true
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                }
            },
            title: {
                display: true,
                text: "Monthly Sales Report"
            }
        }
    });
}

//Function to fetch room's booking details
async function fetchAndDisplayRoomSales() {
    const sales = {};
    const selectedCategory = document.getElementById('selectRoomCategory').value;
    try {
        const paymentsCollectionRef = collection(db, 'payments');
        const querySnapshot = await getDocs(paymentsCollectionRef);

        querySnapshot.forEach(docSnap => {
            const paymentData = docSnap.data();
            const paymentsArray = paymentData.payments || [];

            paymentsArray.forEach(payment => {
                const paymentDateObj = payment.payment_date ? new Date(payment.payment_date) : null;

                if (paymentDateObj) {
                    const year = paymentDateObj.getFullYear();
                    const month = paymentDateObj.getMonth() + 1;
                    const roomCategory = payment.category;

                    if (selectedCategory !== "All" && roomCategory !== selectedCategory) {
                        return;
                    }

                    if (!sales[year]) {
                        sales[year] = {};
                    }

                    if (!sales[year][month]) {
                        sales[year][month] = {};
                    }

                    const price = parseFloat(payment.price) || 0;
                    const room = payment.room_name || '';
                    if (!sales[year][month][room]) {
                        sales[year][month][room] = 0;
                    }
                    sales[year][month][room] += price; 
                }
            });
        });

        return sales;

    } catch (error) {
        console.error('Error fetching delivery status:', error);
    }
}

// Room sales report
async function displaysRoomSalesReport() {
    document.getElementById('salesReport').style.display = 'block';
    document.getElementById('report').style.display = 'none';

    const sales = await fetchAndDisplayRoomSales();
    console.log('Fetched Sales Data:', sales);

    const year = selectYear.value || new Date().getFullYear();
    const totalSales = sales[year] || {};
    console.log('Year passed:', year);
    console.log('Sales Data for the Year:', totalSales);

    const xValues = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const rooms = new Set();
    const barColors = ["#2a9d8f", "#ffbdbd", "#f4a300", "#87ceeb", "#4a7f6f", "#6a5acd", "#6b8e23", "#4682b4", "#ff4500", "#ff6f61", "#dcbdff", "#e6ffbd"];
    const roomColorMap = {};

    Object.values(totalSales).forEach((monthlyData) => {
        Object.keys(monthlyData).forEach(room => {
            rooms.add(room);
        });
    });

    const yValues = Array.from(rooms).map((room, index) => {
        const color = barColors[index % barColors.length];
        roomColorMap[room] = color;

        return {
            label: room,
            backgroundColor: color,
            data: xValues.map((_, monthIndex) => {
                const month = monthIndex + 1;
                return totalSales[month] && totalSales[month][room] ? totalSales[month][room] : 0;
            }),
            stack: 'Stack 0'
        };
    });

    const selectRoomCategory = document.getElementById('selectRoomCategory').value;
    const capitalRoomCategory = selectRoomCategory.charAt(0).toUpperCase() + selectRoomCategory.slice(1);

    const legendDiv = document.getElementById('legend');
    legendDiv.innerHTML = '';


    const titleElement = document.createElement('h4');
    titleElement.classList.add('legendTitle');
    titleElement.textContent = `${capitalRoomCategory} Room Sales by Month`;
    legendDiv.appendChild(titleElement);

    const legendContainer = document.createElement('div');
    legendContainer.classList.add('productLegend', 'pt-5');

    legendDiv.appendChild(legendContainer);

    const roomArray = Array.from(rooms).sort();

    Object.keys(totalSales).forEach((month) => {
        const monthNumber = parseInt(month); 

        if (Object.keys(totalSales[monthNumber]).length > 0) {
            const monthName = xValues[monthNumber - 1]; 

            const monthSection = document.createElement('div');
            monthSection.innerHTML = `<h5>${monthName} Sales</h5>`;

            roomArray.forEach((room) => {
                const stock = totalSales[monthNumber] && totalSales[monthNumber][room] ? totalSales[monthNumber][room] : 0;

                if (stock > 0) {
                    const legendItem = document.createElement('div');
                    legendItem.className = 'legend-item';

                    const color = roomColorMap[room];

                    legendItem.innerHTML = `
                    <span class="color-box" style="background-color: ${color};" aria-hidden="true"></span>
                    <span class="legend-text">${room}: <span style="color: #127369; font-weight:bold;">RM ${stock}</span></span>
                `;
                    monthSection.appendChild(legendItem);
                }
            });

            if (monthSection.childElementCount > 1) { 
                legendContainer.appendChild(monthSection);
            }
        }
    });

    if (myChart2) {
        myChart2.destroy();
    }

    if (Object.keys(totalSales).length === 0) {
        document.getElementById('report-message').textContent = 'No report found for the selected filters.';
        document.getElementById('report-message').style.display = 'block';
        document.getElementById('legend').style.display = 'none';
        const chartElement = document.getElementById('myChart2');
        if (chartElement) {
            chartElement.style.display = 'none';
        }
        return;
    } else {
        document.getElementById('report-message').style.display = 'none';
        document.getElementById('legend').style.display = 'block';
        const chartElement = document.getElementById('myChart2');
        if (chartElement) {
            chartElement.style.display = 'block';
        }
    }

    myChart2 = new Chart("myChart2", {
        type: "bar",
        data: {
            labels: xValues,
            datasets: yValues
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    },
                    stacked: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Sales (RM)'
                    },
                    beginAtZero: true,
                    stacked: true
                }
            },
            title: {
                display: true,
                text: "Monthly Sales Report"
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    selectYear = document.getElementById('year');
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 5; i++) {
        const option = document.createElement('option');
        option.value = currentYear + i;
        option.text = currentYear + i;
        selectYear.appendChild(option);
    }

    selectYear.value = currentYear;

    document.getElementById('type').value = 'products';

    await filterSalesReport();
});

async function filterSalesReport() {
    const filter = document.getElementById('type').value;
    console.log('Filter:', filter);


    if (filter === 'products') {
        document.getElementById("categoryFilter").style.display = 'block';
        document.getElementById("roomsCategoryFilter").style.display = 'none';
        const SalesReport = document.getElementById('salesReport');
        SalesReport.style.display = 'none';
        const report = document.getElementById('report');

        report.innerHTML = `
                <h1 class="title text-center py-5">Product Sales Report</h1>
                <canvas id="myChart" class="pb-5"></canvas>
                <div id="productLegend"></div>
                <p id="report-messages" style="display:none; color: red;"></p>
            `;

        selectYear.addEventListener('change', async () => {
            console.log('Year selected:', selectYear.value);
            await displaysSalesReport();
        });

        const selectProductCategory = document.getElementById("selectProductCategory");

        if (selectProductCategory) {
            selectProductCategory.addEventListener("change", displaysSalesReport);
        }

        await displaysSalesReport();

    } else if (filter === 'rooms') {
        document.getElementById("categoryFilter").style.display = 'none';
        document.getElementById("roomsCategoryFilter").style.display = 'block';
        const SalesReport = document.getElementById('salesReport');
        SalesReport.innerHTML = `
                <h1 class="title text-center py-5">Rooms Sales Report</h1>
                <canvas id="myChart2" class="pb-5"></canvas>
                <div id="legend"></div>
                <div id="report-message" style="display:none; color: red;"></div>
            `;

        selectYear.addEventListener('change', async () => {
            console.log('Year selected:', selectYear.value);
            await displaysRoomSalesReport();
        });

        const selectRoomCategory = document.getElementById("selectRoomCategory");

        if (selectRoomCategory) {
            selectRoomCategory.addEventListener("change", displaysRoomSalesReport);
            displaysRoomSalesReport();
        } else {
            console.error("Dropdown elements not found!");
        }

        await displaysRoomSalesReport();
    }
}

document.getElementById('type').addEventListener('change', async () => {
    await filterSalesReport(); 
});



