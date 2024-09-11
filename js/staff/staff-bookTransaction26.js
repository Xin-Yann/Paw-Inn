import { getFirestore, collection, query, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

// Initialize Firebase Storage
const storage = getStorage();
const db = getFirestore();

document.addEventListener('DOMContentLoaded', () => {

    function isPastDate(dateString) {
        const date = new Date(dateString); ``
        return date < new Date();
    }

    async function fetchAndDisplayBookings() {
        try {
            const statusSelect = document.getElementById('status');
            const status = statusSelect.value || 'Checked-In'; // Default to 'Checked-In'

            const paymentCollectionRef = collection(db, 'payments');
            const querySnapshotPayment = await getDocs(paymentCollectionRef);

            // Group payments by book_id
            const paymentsMap = new Map();

            querySnapshotPayment.docs.forEach(doc => {
                const data = doc.data();
                if (Array.isArray(data.payments)) {
                    data.payments.forEach(payment => {
                        // Only add payments to the map if the status matches
                        if (payment.status === status) {
                            paymentsMap.set(payment.book_id, payment);
                        }
                    });
                }
            });

            // Convert the Map values to an array and sort them
            const sortedPayments = Array.from(paymentsMap.values()).sort((a, b) => {
                const idA = parseInt(a.book_id.replace(/^\D+/g, ''), 10); // Extract number part and parse to integer
                const idB = parseInt(b.book_id.replace(/^\D+/g, ''), 10); // Extract number part and parse to integer
                return idB - idA; // For numeric comparison
            });


            const statusContainer = document.getElementById('statusContainer');
            if (!statusContainer) {
                console.error('Status container element not found.');
                return;
            }

            statusContainer.innerHTML = '';

            if (paymentsMap.size > 0) {
                const table = document.createElement('table');
                table.setAttribute('border', '1');
                table.setAttribute('width', '100%');
                table.setAttribute('id', 'paymentTable');

                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th class="text-center">Booking ID</th>
                        <th class="text-center">Booking Details</th>
                        <th class="text-center">Status</th>
                        <th class="text-center">Actions</th>
                    </tr>
                `;
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                table.appendChild(tbody);

                sortedPayments.forEach(async payment => {
                    console.log('Processing payment:', payment);

                    const bookingId = payment.book_id || 'N/A';
                    const bookingDate = payment.payment_date ? new Date(payment.payment_date).toLocaleString() : 'N/A';
                    const checkinDate = payment.checkin_date || 'N/A';
                    const checkoutDate = payment.checkout_date || 'N/A';
                    const nights = payment.nights || 'N/A';
                    const roomName = payment.room_name || 'N/A';
                    const ownerName = payment.owner_name || 'N/A';
                    const petName = payment.pet_name || 'N/A';
                    const totalPrice = payment.totalPrice || 'N/A';
                    const bookingStatus = payment.status || 'Pending';
                    const vaccinationImage = payment.vaccination_image || '';
                    const contact = payment.contact || 'N/A';
                    const email = payment.email || 'N/A';

                    const bookingDetails = `
                        <div class="book-details">    
                            <strong>Payment Date:</strong> ${bookingDate}<br>
                            <strong>Check-in Date:</strong> ${checkinDate}<br>
                            <strong>Check-out Date:</strong> ${checkoutDate}<br>
                            <strong>Nights:</strong> ${nights}<br>
                            <strong>Room:</strong> ${roomName}<br>
                            <strong>Contact:</strong> ${contact}<br>
                            <strong>Email:</strong> ${email}<br>                           
                            <strong>Owner Name:</strong> ${ownerName}<br>
                            <strong>Pet Name:</strong> ${petName}<br>
                            <strong>Total Price:</strong> ${totalPrice}<br>
                            <strong>Vaccination Image:</strong> <img class="vaccination-image" src="${vaccinationImage}" alt="Vaccination Image" width="150" height="150"><br>
                        </div>
                    `;

                    const isPastCheckinDate = isPastDate(payment.checkin_date);
                    const isPastCheckoutDate = isPastDate(payment.checkout_date);
                    // const buttonDisabled = isPastCheckinDate || isPastCheckoutDate;
                    const checkinButtonVisible = bookingStatus !== 'Checked-In';
                    const checkoutButtonVisible = bookingStatus !== 'Checked-Out';
                    const checkoutButtonDisabled = bookingStatus === 'Paid';

                    if (isPastDate(checkoutDate) && status !== 'Checked-Out') {
                        // Find the document snapshot for this payment and pass it to autoCheckoutBooking
                        const docSnapshot = querySnapshotPayment.docs.find(doc => {
                            const data = doc.data();
                            return data.payments.some(p => p.book_id === bookingId);
                        });
                
                        if (docSnapshot) {
                            autoCheckoutBooking(docSnapshot, payment.book_id);
                        } else {
                            console.error(`Document for booking ID ${bookingId} not found.`);
                        }
                    }
                    const row = document.createElement('tr');
                    row.className = isPastCheckinDate || isPastCheckoutDate ? 'disabled' : '';
                    row.innerHTML = `
                        <td class="text-center book-id ${isPastDate(payment.checkin_date) || isPastDate(payment.checkout_date) ? 'disabled' : ''}">${bookingId}</td>
                        <td>${bookingDetails}</td>
                        <td class="text-center" style="color: #127369; font-weight: bold;">${bookingStatus}</td> 
                        <td class="text-center">
                            ${checkinButtonVisible ? `<button class="btn checked-in mb-3 mr-3" id="checkin-${bookingId}" data-toggle="modal" data-target="#checkinModal">Check In</button>` : ''}
                             ${ checkoutButtonDisabled ? '' : checkoutButtonVisible ? `<button class="btn checked-out mb-3" id="checkout-${bookingId}" data-toggle="modal" data-target="#checkoutModal">Check Out</button>` : ''}
                        </td>
                    `;
                    tbody.appendChild(row);

                    // Handle image URL from Firebase Storage
                    if (vaccinationImage) {
                        const imgElement = row.querySelector('.vaccination-image');
                        if (imgElement) {
                            try {
                                const storageRef = ref(storage, vaccinationImage);
                                const imageUrl = await getDownloadURL(storageRef);
                                imgElement.src = imageUrl;
                                imgElement.style.display = 'block';
                            } catch (error) {
                                console.error('Error getting vaccination image URL:', error);
                            }
                        }
                    }

                    const checkinButton = row.querySelector(`#checkin-${bookingId}`);
                    if (checkinButton) {
                        checkinButton.addEventListener('click', () => openCheckinModal(bookingId, bookingDetails));
                    }

                    const checkoutButton = row.querySelector(`#checkout-${bookingId}`);
                    if (checkoutButton) {
                        checkoutButton.addEventListener('click', () => openCheckoutModal(bookingId, bookingDetails));
                    }
                });

                statusContainer.appendChild(table);
            } else {
                statusContainer.innerHTML = '<p>No bookings found.</p>';
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    }


    function openCheckinModal(bookingId, bookingDetails) {
        document.getElementById('checkinBookingDetails').innerHTML = bookingDetails;
        document.getElementById('confirmCheckinButton').onclick = () => checkinBooking(bookingId);
        $('#checkinModal').modal('show');
    }

    function openCheckoutModal(bookingId, bookingDetails) {
        document.getElementById('checkoutBookingDetails').innerHTML = bookingDetails;
        document.getElementById('confirmCheckoutButton').onclick = () => checkoutBooking(bookingId);
        $('#checkoutModal').modal('show');
    }

    async function checkinBooking(bookingId) {
        try {
            // Reference to the payments collection
            const paymentCollectionRef = collection(db, 'payments');
            const querySnapshotPayment = await getDocs(paymentCollectionRef);

            // Find the document containing the booking ID
            const docToUpdate = querySnapshotPayment.docs.find(doc =>
                doc.data().payments.some(payment => payment.book_id === bookingId)
            );

            if (docToUpdate) {
                // Update the booking status in the document
                const paymentRef = docToUpdate.ref;

                // Ensure paymentRef is a valid reference
                console.log('Document Reference:', paymentRef);

                // Get the payments array and update it
                const payments = docToUpdate.data().payments;
                const updatedPayments = payments.map(payment => {
                    if (payment.book_id === bookingId) {
                        return { ...payment, status: 'Checked-In' };
                    }
                    return payment;
                });

                // Use updateDoc from Firestore
                await updateDoc(paymentRef, { payments: updatedPayments });
                console.log('Booking status updated successfully.');

                // Refresh the bookings and close the modal
                fetchAndDisplayBookings();
                $('#checkinModal').modal('hide');
            } else {
                console.error('Booking not found:', bookingId);
            }
        } catch (error) {
            console.error('Error checking in booking:', error);
        }
    }

    async function checkoutBooking(bookingId) {
        try {
            // Reference to the payments collection
            const paymentCollectionRef = collection(db, 'payments');
            const querySnapshotPayment = await getDocs(paymentCollectionRef);

            // Find the document containing the booking ID
            const docToUpdate = querySnapshotPayment.docs.find(doc =>
                doc.data().payments.some(payment => payment.book_id === bookingId)
            );

            if (docToUpdate) {
                // Update the booking status in the document
                const paymentRef = docToUpdate.ref;

                // Ensure paymentRef is a valid reference
                console.log('Document Reference:', paymentRef);

                // Get the payments array and update it
                const payments = docToUpdate.data().payments;
                const updatedPayments = payments.map(payment => {
                    if (payment.book_id === bookingId) {
                        return { ...payment, status: 'Checked-Out' };
                    }
                    return payment;
                });

                // Use updateDoc from Firestore
                await updateDoc(paymentRef, { payments: updatedPayments });
                console.log('Booking status updated successfully.');

                // Refresh the bookings and close the modal
                fetchAndDisplayBookings();
                $('#checkoutModal').modal('hide');
            } else {
                console.error('Booking not found:', bookingId);
            }
        } catch (error) {
            console.error('Error checking in booking:', error);
        }
    }

    async function autoCheckoutBooking(docSnapshot, bookingId) {
        try {
            if (!docSnapshot.exists()) {
                throw new Error("Document does not exist");
            }
    
            const paymentRef = docSnapshot.ref;
            const payments = docSnapshot.data().payments; // Access the payments array from the document data
    
            const updatedPayments = payments.map(payment => {
                if (payment.book_id === bookingId) {
                    return { ...payment, status: 'Checked-Out' };
                }
                return payment;
            });
    
            await updateDoc(paymentRef, { payments: updatedPayments });
            window.alert(`Booking ${bookingId} automatically checked out.`);
            location.reload();
        } catch (error) {
            console.error('Error auto-checking out booking:', error);
        }
    }
    

    document.getElementById('status').addEventListener('change', () => {
        fetchAndDisplayBookings();
    });


    fetchAndDisplayBookings();
});
