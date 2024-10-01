import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

let selectYear;

async function fetchAndDisplaySales() {

    const sales = {};
    try {
        const orderCollectionRef = collection(db, 'orders');
        const querySnapshot = await getDocs(orderCollectionRef)

        if (querySnapshot.empty) {
            console.log("No orders found.");
        } else {


            querySnapshot.forEach((doc) => {
                const order = doc.data();
                console.log('Order data:', order);

                const cartItems = order.cartItems || [];
                const paymentDateObj = order.paymentDate ? new Date(order.paymentDate) : null;
                const paymentDate = paymentDateObj ? paymentDateObj.toLocaleString() : 'N/A';

                if (paymentDateObj) {
                    const year = paymentDateObj.getFullYear();
                    const month = paymentDateObj.getMonth() + 1;

                    if (!sales[year]) {
                        sales[year] = {}; // Initialize the year object
                    }

                    if (!sales[year][month]) {
                        sales[year][month] = {}; // Initialize the sales for the month
                    }

                    cartItems.forEach((item) => {
                        const price = parseFloat(item.price) || 0; // Ensure price is defined
                        const type = item.type || '';
                        if (!sales[year][month][type]) {
                            sales[year][month][type] = 0; // Initialize the sales for the month
                        }
                        console.log(`Adding price ${price} to month ${month} `);
                        sales[year][month][type] += price; // Accumulate the sales for the month
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

async function fetchAndDisplayRoomSales() {
    const sales = {};
    try {
        const paymentsCollectionRef = collection(db, 'payments');
        const querySnapshot = await getDocs(paymentsCollectionRef);

        querySnapshot.forEach(docSnap => {
            const paymentData = docSnap.data();
            const paymentsArray = paymentData.payments || [];

            console.log('Payment data:', paymentData);

            paymentsArray.forEach(payment => {
                const paymentDateObj = payment.payment_date ? new Date(payment.payment_date) : null;
                const paymentDate = paymentDateObj ? paymentDateObj.toLocaleString() : 'N/A';
                if (paymentDateObj) {
                    const year = paymentDateObj.getFullYear();
                    const month = paymentDateObj.getMonth() + 1;

                    if (!sales[year]) {
                        sales[year] = {}; // Initialize the year object
                    }

                    if (!sales[year][month]) {
                        sales[year][month] = {}; // Initialize the sales for the month
                    }

                    const price = parseFloat(payment.price) || 0; // Ensure price is defined
                    const room = payment.room_name || '';
                    if (!sales[year][month][room]) {
                        sales[year][month][room] = 0; // Initialize the sales for the month
                    }
                    console.log(`Adding price ${price} to month ${month}`);
                    sales[year][month][room] += price; // Accumulate the sales for the month
                }
            });
        });

        return sales;

    } catch (error) {
        console.error('Error fetching delivery status:', error);
    }
}

let myChart = null;
let myChart2 = null;

async function displaysSalesReport() {
    const sales = await fetchAndDisplaySales();
    console.log('Fetched Sales Data:', sales); // Debugging

    const year = Object.keys(sales)[0] ? selectYear.value : new Date().getFullYear();;
    const totalSales = sales[year] || {}; // Get the sales for that year
    console.log('Year passed :', year);
    console.log('Sales Data for the Year:', totalSales);

    // Define month names

    const xValues = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const types = new Set();
    const barColors = ["#2a9d8f", "#ffbdbd", "#f4a300", "#87ceeb", "#4a7f6f", "#6a5acd", "#6b8e23", "#4682b4", "#ff4500", "#ff6f61", "#dcbdff", "#e6ffbd"];


    Object.values(totalSales).forEach((monthlyData) => {
        Object.keys(monthlyData).forEach(type => {
            console.log(`Found type: ${type}`);
            types.add(type);
        });
    });


    console.log('Types:', Array.from(types));



    // const yValues = xValues.map((_, index) => {
    //     const month = index + 1; // Convert to 1-based month index (e.g., 8 for August)

    //     // Check if sales data exists for this month
    //     if (totalSales && totalSales[month]) {
    //         const value = totalSales[month] || 0; // Get the sales value for the month
    //         console.log(`Month: ${xValues[index]}, Sales Value: ${value}`); // Log month and sales value
    //         return Math.round(value * 10) / 10; // Round to one decimal place
    //     } else {
    //         console.log(`No data for ${xValues[index]}, returning 0`); // No data for this month
    //         return 0;
    //     }
    // });

    const yValues = Array.from(types).map((type, index) => ({
        label: type,
        backgroundColor: barColors[index % barColors.length], // Ensure a color for each type
        data: xValues.map((_, monthIndex) => {
            const month = monthIndex + 1; // Convert to 1-based month index
            return totalSales[month] && totalSales[month][type] ? totalSales[month][type] : 0;
        }),
        stack: 'Stack 0' // Use stack property to stack bars
    }));

    console.log('Data:', yValues);

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart("myChart", {
        type: "bar",
        data: {
            labels: xValues,
            // backgroundColor: barColors,
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
            }, plugins: {
                legend: {
                    display: true,
                    position: 'right'
                    // labels: {
                    //     generateLabels: function (chart) {
                    //         const data = chart.data;
                    //         return data.labels.map((label, index) => ({
                    //             text: label,
                    //             fillStyle: barColors[index]
                    //         }));
                    //     }
                    // }
                }
            },

            title: {
                display: true,
                text: "Monthly Sales Report"
            }
        }
    });
}


async function displaysRoomSalesReport() {
    const sales = await fetchAndDisplayRoomSales();
    console.log('Fetched Sales Data:', sales); // Debugging

    const year = Object.keys(sales)[0] ? selectYear.value : new Date().getFullYear();;
    const totalSales = sales[year] || {}; // Get the sales for that year
    console.log('Year passed :', year);
    console.log('Sales Data for the Year:', totalSales);

    // Define month names

    const xValues = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const rooms = new Set();
    const barColors = ["#2a9d8f", "#ffbdbd", "#f4a300", "#87ceeb", "#4a7f6f", "#6a5acd", "#6b8e23", "#4682b4", "#ff4500", "#ff6f61", "#dcbdff", "#e6ffbd"];


    Object.values(totalSales).forEach((monthlyData) => {
        Object.keys(monthlyData).forEach(room => {
            console.log(`Found type: ${room}`);
            rooms.add(room);
        });
    });


    console.log('Types:', Array.from(rooms));



    // const yValues = xValues.map((_, index) => {
    //     const month = index + 1; // Convert to 1-based month index (e.g., 8 for August)

    //     // Check if sales data exists for this month
    //     if (totalSales && totalSales[month]) {
    //         const value = totalSales[month] || 0; // Get the sales value for the month
    //         console.log(`Month: ${xValues[index]}, Sales Value: ${value}`); // Log month and sales value
    //         return Math.round(value * 10) / 10; // Round to one decimal place
    //     } else {
    //         console.log(`No data for ${xValues[index]}, returning 0`); // No data for this month
    //         return 0;
    //     }
    // });

    const yValues = Array.from(rooms).map((room, index) => ({
        label: room,
        backgroundColor: barColors[index % barColors.length], // Ensure a color for each type
        data: xValues.map((_, monthIndex) => {
            const month = monthIndex + 1; // Convert to 1-based month index
            return totalSales[month] && totalSales[month][room] ? totalSales[month][room] : 0;
        }),
        stack: 'Stack 0' // Use stack property to stack bars
    }));

    console.log('Data:', yValues);

    if (myChart2) {
        myChart2.destroy();
    }

    myChart2 = new Chart("myChart2", {
        type: "bar",
        data: {
            labels: xValues,
            // backgroundColor: barColors,
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
            }, plugins: {
                legend: {
                    display: true,
                    position: 'right'
                    // labels: {
                    //     generateLabels: function (chart) {
                    //         const data = chart.data;
                    //         return data.labels.map((label, index) => ({
                    //             text: label,
                    //             fillStyle: barColors[index]
                    //         }));
                    //     }
                    // }
                }
            },

            title: {
                display: true,
                text: "Monthly Sales Report"
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    selectYear = document.getElementById('year');

    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
        const option = document.createElement('option');
        option.value = currentYear + i;
        option.text = currentYear + i;
        selectYear.appendChild(option);
    }

    selectYear.value = currentYear;

    selectYear.addEventListener('change', async () => {
        console.log('Year selected:', selectYear.value);
        await displaysSalesReport();
        await displaysRoomSalesReport();
    });


    async function filterSalesReport() {
        const filter = document.getElementById('type').value;
        console.log('Filter:', filter);
        const report = document.getElementById('report');

        report.innerHTML = '';

        if (filter === 'product') {
            report.innerHTML = `
            <h1 class="title text-center py-5">Product Sales Report</h1>
            <canvas id="myChart" class="pb-5"></canvas>
        `;
            await displaysSalesReport();

        } else if (filter === 'rooms') {
            report.innerHTML = `
            <h1 class="title text-center py-5">Rooms Sales Report</h1>
            <canvas id="myChart2" class="pb-5"></canvas>
            `;
            await displaysRoomSalesReport();
        }
    }

    document.getElementById('type').addEventListener('change', async () => {
        await filterSalesReport();
    });

    displaysSalesReport();

});