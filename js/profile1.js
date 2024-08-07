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

            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    console.log('User data fetched:', userData);

                    document.getElementById('Name').value = userData.name || '';
                    document.getElementById('Email').value = userData.email || '';
                    document.getElementById('Contact').value = userData.contact || '';

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

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = getCurrentUserId();
            const userEmail = sessionStorage.getItem('userEmail');
            if (userEmail) {
                fetchAndDisplayPersonalDetails(userEmail);
            } else {
                console.log('No user email found in session storage.');
            }
            // updateCartItemCount(userId);

        } else {
            console.log('No user is authenticated. Redirecting to login page.');
            window.location.href = "/html/login.html";
        }
    });

    const cart = document.getElementById('cart');
    if (cart) {
        cart.addEventListener('click', handleCartClick);
    }

    // function handleCartClick() {
    //     if (auth.currentUser) {
    //         window.location.href = "../html/cart.html";
    //     } else {
    //         window.alert('Please Login to view your cart.');
    //         window.location.href = "../html/login.html";
    //     }
    // }

    // // Function to update the cart item count in the UI
    // async function updateCartItemCount(userId) {
    //     try {
    //         if (userId) {
    //             const userCartDocRef = doc(collection(db, 'carts'), userId);
    //             const userCartDocSnap = await getDoc(userCartDocRef);

    //             if (userCartDocSnap.exists()) {
    //                 const cartItems = userCartDocSnap.data().cart || [];
    //                 const cartItemCount = document.getElementById('cartItemCount');
    //                 let totalCount = 0;
    //                 cartItems.forEach(item => {
    //                     totalCount += item.quantity;
    //                 });
    //                 cartItemCount.textContent = totalCount;
    //             }
    //         }
    //     } catch (error) {
    //         console.error("Error updating cart item count:", error);
    //     }
    // }

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
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (docSnapshot) => {
                    const docRef = doc(db, 'users', docSnapshot.id);

                    const updatedData = {
                        name: document.getElementById('Name').value,
                        email: document.getElementById('Email').value,
                        contact: document.getElementById('Contact').value
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
    
    function generateMemberBarcode(membershipId) {
        JsBarcode("#barcode", membershipId, {
            format: "CODE128",
            displayValue: true,
            fontSize: 20
        });
    }
});