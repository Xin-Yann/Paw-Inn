import { getFirestore, collection, query, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

const storage = getStorage();
const db = getFirestore();

document.addEventListener('DOMContentLoaded', () => {

    function isPastDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        
        today.setHours(0, 0, 0, 0);
        
        return date < today;
    }

    const currentMonth = new Date().getMonth();
    const selectMonth = document.getElementById('selectedMonth');

    selectMonth.value = currentMonth;
    console.log('Current month:', currentMonth);

    const currentYear = new Date().getFullYear();
    const selectYear = document.getElementById('selectedYear');

    selectYear.value = currentYear;
    console.log('Current year:', currentYear);

    async function fetchAndDisplayBookings() {
        try {
            const statusSelect = document.getElementById('status');
            const status = statusSelect.value || 'Checked-In';

            const paymentCollectionRef = collection(db, 'payments');
            const querySnapshotPayment = await getDocs(paymentCollectionRef);

            const paymentsMap = new Map();

            querySnapshotPayment.docs.forEach(doc => {
                const data = doc.data();
                if (Array.isArray(data.payments)) {
                    data.payments.forEach(payment => {
                        if (payment.status === status) {
                            paymentsMap.set(payment.book_id, payment);
                        }
                    });
                }
            });

            const selectedMonth = document.getElementById('selectedMonth').value;
            const selectedYear = document.getElementById('selectedYear').value; 

            const currentMonth = selectedMonth === '' ? new Date().getMonth() : parseInt(selectedMonth);
            const currentYear = selectedYear === '' ? new Date().getFullYear() : parseInt(selectedYear);


            const filteredPayments = Array.from(paymentsMap.values()).filter(payment => {
                const checkinDate = new Date(payment.payment_date);
                return checkinDate.getMonth() === currentMonth && checkinDate.getFullYear() === currentYear;
            });

            if (filteredPayments.length === 0) {
                const statusContainerElement = document.getElementById('statusContainer');
                statusContainerElement.innerHTML = '<p>No bookings found.</p>';
            } else {

                const sortedPayments = filteredPayments.sort((a, b) => {
                    const idA = parseInt(a.book_id.replace(/^\D+/g, ''), 10); 
                    const idB = parseInt(b.book_id.replace(/^\D+/g, ''), 10); 
                    return idB - idA; 
                });

                filteredPayments.sort((a, b) => {
                    const isDisabledA = isPastDate(a.checkin_date) || isPastDate(a.checkout_date);
                    const isDisabledB = isPastDate(b.checkin_date) || isPastDate(b.checkout_date);
                    return isDisabledA - isDisabledB; 
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

                    const paymentsArray = Array.from(paymentsMap.values());
                    const actionHeader = paymentsArray.some(payment => payment.status !== 'Cancelled' && payment.status !== 'Checked-Out') ? '<th class="text-center">Action</th>' : '';
                    const thead = document.createElement('thead');
                    thead.innerHTML = `
                    <tr>
                        <th class="text-center">Booking ID</th>
                        <th class="text-center">Booking Details</th>
                        <th class="text-center">Status</th>
                        ${actionHeader}
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
                        <div class="book-details ${isPastDate(payment.checkin_date) || isPastDate(payment.checkout_date) ? 'disabled' : ''}">    
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
                            <strong class="${isPastDate(payment.checkin_date) || isPastDate(payment.checkout_date) ? 'disabled' : ''}">Vaccination Image:</strong> <img class="vaccination-image" src="${vaccinationImage}" alt="Vaccination Image" width="150" height="150"><br>
                        </div>
                    `;

                        const isPastCheckinDate = isPastDate(payment.checkin_date);
                        const isPastCheckoutDate = isPastDate(payment.checkout_date);
                        const buttonDisabled = isPastCheckinDate || isPastCheckoutDate;

                        const checkinButtonVisible = bookingStatus === 'Paid';
                        const checkoutButtonVisible = bookingStatus !== 'Checked-Out';
                        const checkoutButtonDisabled = bookingStatus === 'Paid';
                        const buttonsHidden = bookingStatus === 'Cancelled' || bookingStatus === 'Checked-Out';

                        const row = document.createElement('tr');
                        row.className = isPastCheckinDate || isPastCheckoutDate ? 'disabled' : '';

                        row.innerHTML = `
                            <td class="text-center book-id ${isPastDate(payment.checkin_date) || isPastDate(payment.checkout_date) ? 'disabled' : ''}">${bookingId}</td>
                            <td>${bookingDetails}</td>
                            <td class="text-center" style="color: #127369; font-weight: bold; ${isPastDate(payment.checkin_date) || isPastDate(payment.checkout_date) ? 'disabled' : ''}">${bookingStatus}</td> 
                            ${buttonsHidden ? '' :  `
                            <td class="text-center">
                                ${buttonDisabled ? '' : checkinButtonVisible ? `<button class="btn checked-in mb-3 mr-3" id="checkin-${bookingId}" data-toggle="modal" data-target="#checkinModal">Check In</button>` : ''}
                                ${checkoutButtonVisible && !checkoutButtonDisabled && !buttonDisabled ?`<button class="btn checked-out mb-3" id="checkout-${bookingId}" data-toggle="modal" data-target="#checkoutModal">Check Out</button>` : ''}
                            </td>
                            `}
                        `;
                        tbody.appendChild(row);

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
            const paymentCollectionRef = collection(db, 'payments');
            const querySnapshotPayment = await getDocs(paymentCollectionRef);

            const docToUpdate = querySnapshotPayment.docs.find(doc =>
                doc.data().payments.some(payment => payment.book_id === bookingId)
            );

            if (docToUpdate) {
                const paymentRef = docToUpdate.ref;

                console.log('Document Reference:', paymentRef);

                const payments = docToUpdate.data().payments;
                const updatedPayments = payments.map(payment => {
                    if (payment.book_id === bookingId) {
                        return { ...payment, status: 'Checked-In' };
                    }
                    return payment;
                });

                await updateDoc(paymentRef, { payments: updatedPayments });
                window.alert(`Booking ID: ${bookingId} has been checked in.`);

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
            const paymentCollectionRef = collection(db, 'payments');
            const querySnapshotPayment = await getDocs(paymentCollectionRef);

            const docToUpdate = querySnapshotPayment.docs.find(doc =>
                doc.data().payments.some(payment => payment.book_id === bookingId)
            );

            if (docToUpdate) {
                const paymentRef = docToUpdate.ref;

                console.log('Document Reference:', paymentRef);

                const payments = docToUpdate.data().payments;
                const updatedPayments = payments.map(payment => {
                    if (payment.book_id === bookingId) {
                        return { ...payment, status: 'Checked-Out' };
                    }
                    return payment;
                });

                await updateDoc(paymentRef, { payments: updatedPayments });
                window.alert(`Booking ID: ${bookingId} has been checked out.`);

                fetchAndDisplayBookings();
                $('#checkoutModal').modal('hide');
            } else {
                console.error('Booking not found:', bookingId);
            }
        } catch (error) {
            console.error('Error checking in booking:', error);
        }
    }

    document.getElementById('status').addEventListener('change', () => {
        fetchAndDisplayBookings();
    });

    selectMonth.addEventListener('change', () => {
        fetchAndDisplayBookings();
    });

    selectYear.addEventListener('change', () => {
        fetchAndDisplayBookings();
    });

    fetchAndDisplayBookings();
});
