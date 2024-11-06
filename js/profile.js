import { getFirestore, collection, getDocs, getDoc, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import Typebot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3/dist/web.js'

Typebot.initBubble({
    typebot: "customer-support-92olq2c",
    theme: {
        button: { backgroundColor: "#0d9488" },
        chatWindow: { backgroundColor: "#fff" },
    },
});

document.addEventListener('DOMContentLoaded', () => {

    const db = getFirestore();
    const auth = getAuth();

    function getCurrentUserId() {
        const user = auth.currentUser;
        return user ? user.uid : null;
    }

    // Function to fetch and display user details
    async function fetchAndDisplayPersonalDetails(userId) {
        try {
            console.log(`Fetching details for email: ${userId}`);

            const usersCollectionRef = collection(db, 'users');
            const querySnapshot = await getDocs(query(usersCollectionRef, where('userId', '==', userId)));

            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    console.log('User data fetched:', userData);

                    document.getElementById('Name').value = userData.name || '';
                    document.getElementById('Email').value = userData.email || '';
                    document.getElementById('Contact').value = userData.contact || '';
                    document.getElementById('Points').value = userData.points || '';

                    if (userData.membershipId) {
                        generateMemberBarcode(userData.membershipId);
                    }

                });
            } else {
                console.log('User details document does not exist.');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    }

    auth.onAuthStateChanged(async (user) => {
        try {
            if (user) {
                const userId = getCurrentUserId();
                if (!userId) {
                    console.error("Invalid userId:", userId);
                    return;
                }
                fetchAndDisplayPersonalDetails(userId);
                console.log("User authenticated. User ID:", userId);
            } else {
                console.log("User is not authenticated.");
            }
        } catch (error) {
            console.error("Error in authentication state change:", error);
        }
    });

    function validateProfileDetails() {
        const name = document.getElementById('Name').value;
        const email = document.getElementById('Email').value;
        const contact = document.getElementById('Contact').value;

        const namePattern = /^[A-Za-z\s]+$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const contactPattern = /^(\d{3}[- ]\d{3,4}[- ]\d{4})$/;

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
            alert('Invalid format. the contact number should be like 123-456 7890.');
            return false;
        }

        return true;
    }

    async function saveEditedDetails(email) {
        if (!validateProfileDetails()) {
            return;
        }

        try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (docSnapshot) => {
                    const docRef = doc(db, 'users', docSnapshot.id);

                    const updatedData = {
                        name: document.getElementById('Name').value,
                        email: document.getElementById('Email').value,
                        contact: document.getElementById('Contact').value,
                        points: document.getElementById('Points').value
                    };

                    await updateDoc(docRef, updatedData);
                    alert('User details updated successfully.');
                });
            } else {
                alert('User details document does not exist.');
            }
        } catch (error) {
            console.error('Error updating user details:', error);
        }
    }

    const saveBtn = document.getElementById('save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const userEmail = sessionStorage.getItem('userEmail');
            if (userEmail) {
                saveEditedDetails(userEmail);
            } else {
                console.log('No user email found in session storage.');
            }
        });
    }
    
    // function generateMemberBarcode(membershipId) {
    //     JsBarcode("#barcode", membershipId, {
    //         format: "CODE128",
    //         displayValue: true,
    //         fontSize: 20
    //     });
    // }
});