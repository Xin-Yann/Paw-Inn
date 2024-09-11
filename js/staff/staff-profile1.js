import { getFirestore, collection, getDocs, getDoc, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {

    const db = getFirestore();
    const auth = getAuth();

    function getCurrentUserId() {
        const user = auth.currentUser;
        return user ? user.uid : null;
    }

    // Function to fetch and display personal details
    async function fetchAndDisplayPersonalDetails(email) {
        try {
            console.log(`Fetching details for email: ${email}`);

            const q = query(collection(db, 'staff'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const staffData = doc.data();
                    console.log('User data fetched:', staffData);

                    document.getElementById('Name').value = staffData.name || '';
                    document.getElementById('Email').value = staffData.email || '';
                    document.getElementById('Contact').value = staffData.contact || '';
                    document.getElementById('staff-id').value = staffData.staffId || '';

                });
            } else {
                console.log('User details document does not exist.');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = getCurrentUserId();
            const staffEmail = sessionStorage.getItem('staffEmail');
            if (staffEmail) {
                fetchAndDisplayPersonalDetails(staffEmail);
            } else {
                console.log('No staff email found in session storage.');
            }
            // updateCartItemCount(userId);

        } else {
            console.log('No user is authenticated. Redirecting to login page.');
            window.location.href = "/staff/staff-login.html";
        }
    });

    function validateProfileDetails() {
        const name = document.getElementById('Name').value;
        const email = document.getElementById('Email').value;
        const contact = document.getElementById('Contact').value;

        const namePattern = /^[A-Za-z\s]+$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const contactPattern = /^\d{10,11}$/;

        if (!name || !email || !contact) {
            alert('Please fill out all required fields: name, email and contact.');
            return false;
        }

        if (!namePattern.test(name)) {
            alert('Name should contain only letters and spaces.');
            return false;
        }

        if (!emailPattern.test(email)) {
            alert('Please enter a valid email address.');
            return false;
        }

        if (!contactPattern.test(contact)) {
            alert('Please enter a valid 10 or 11-digit contact number.');
            return false;
        }

        return true;
    }

    async function saveEditedDetails(email) {
        if (!validateProfileDetails()) {
            return;
        }

        try {
            const q = query(collection(db, 'staff'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (docSnapshot) => {
                    const docRef = doc(db, 'users', docSnapshot.id);

                    const updatedData = {
                        staffId: document.getElementById('staff-id').value,
                        name: document.getElementById('Name').value,
                        email: document.getElementById('Email').value,
                        contact: document.getElementById('Contact').value
                    };

                    await updateDoc(docRef, updatedData);
                    alert('Staff details updated successfully.');
                });
            } else {
                alert('Staff details document does not exist.');
            }
        } catch (error) {
            console.error('Error updating staff details:', error);
        }
    }

    const saveBtn = document.getElementById('save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const staffEmail = sessionStorage.getItem('staffEmail');
            if (staffEmail) {
                saveEditedDetails(staffEmail);
            } else {
                console.log('No staff email found in session storage.');
            }
        });
    }
    
});