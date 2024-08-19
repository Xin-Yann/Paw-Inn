import { getFirestore, collection, query, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

// Initialize Firebase Storage
const storage = getStorage();
const db = getFirestore();


document.addEventListener('DOMContentLoaded', () => {

    async function fetchAndDisplayOrder() {
        try {
           
            const transactionQuery = query(collection(db, 'orders'));
            const querySnapshot = await getDocs(transactionQuery);

            const transactionTableBody = document.getElementById('statusContainer');
            transactionTableBody.innerHTML = ''; 

            if (querySnapshot.empty) {
                transactionTableBody.innerHTML = '<p class="pt-3">No orders found.</p>';
            } else {
                const orders = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
    
                // Sort orders by document ID in descending order
                orders.sort((a, b) => b.id.localeCompare(a.id));

                const table = document.createElement('table');
                table.setAttribute('border', '1');
                table.setAttribute('width', '100%');

                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th class="text-center">Transaction ID</th>
                        <th class="text-center">Order Details</th>
                        <th class="text-center">Status</th>
                    </tr>
                `;
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                orders.forEach((order) => {
                    
                    console.log('Order:', order); // Debugging line to ensure data is being retrieved

                    // Retrieve necessary details
                    const transactionId = order.id;
                    const paymentDate = order.paymentDate
                        ? new Date(order.paymentDate).toLocaleString()
                        : 'N/A';
                    const totalPrice = order.totalPrice || 'N/A';
                    const method = order.method || 'N/A';
                    const change = order.change !== undefined ? order.change.toFixed(2) : 'N/A';

                    // Get member details (if available)
                    const memberDetails = order.memberDetails || {};
                    const memberName = memberDetails.name || 'N/A';
                    const membershipId = memberDetails.membershipId || 'N/A';

                    // Get cart items (assuming an array of items)
                    const cartItems = order.cartItems || [];
                    const cartItemsHTML = cartItems.map((item) => `
                        <div>
                            <strong>Product:</strong> ${item.name}<br>
                            <strong>Price:</strong> ${item.price}<br>
                            <strong>Quantity:</strong> ${item.quantity || 1}<br>
                        </div>
                    `).join('');

                    // Build the order details HTML
                    const orderDetails = `
                        <div class="transaction-details">      
                            <strong>Payment Date:</strong> ${paymentDate}<br>
                            <strong>Total Price:</strong> RM ${totalPrice}<br>
                            <strong>Payment Method:</strong> ${method}<br>
                            <strong>Change:</strong> RM ${change}<br>
                            <strong>Member Name:</strong> ${memberName}<br>
                            <strong>Membership ID:</strong> ${membershipId}<br>
                            ${cartItemsHTML}
                        </div>
                    `;

                    // Create the row and append it to the tbody
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="text-center">${transactionId}</td>
                        <td>${orderDetails}</td>
                        <td class="text-center">Completed</td>
                    `;
                    tbody.appendChild(row);
                });

                table.appendChild(tbody);
                transactionTableBody.appendChild(table);
            }

        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    }

    // document.getElementById('status').addEventListener('change', () => {
    //     fetchAndDisplayOrder();
    // });


    fetchAndDisplayOrder();
});
