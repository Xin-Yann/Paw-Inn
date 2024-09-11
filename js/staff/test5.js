import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

// 

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

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart("myChart2", {
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

displaysRoomSalesReport();