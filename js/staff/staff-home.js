import { getFirestore, collection, getDocs, getDoc, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

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

                document.getElementById('name').textContent = staffData.name || '';
                document.getElementById('email').textContent = staffData.email || '';
                document.getElementById('staff-id').textContent = staffData.staffId || '';

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
        window.location.href = "../staff/staff-login.html";
    }
});

let arrow = document.querySelectorAll(".arrow");
for (var i = 0; i < arrow.length; i++) {
    arrow[i].addEventListener("click", (e) => {
        let arrowParent = e.target.parentElement.parentElement;
        arrowParent.classList.toggle("showMenu");
    });
}
let sidebar = document.querySelector(".sidebar");
let sidebarBtn = document.querySelector(".bx-menu");
console.log(sidebarBtn);
sidebarBtn.addEventListener("click", () => {
    sidebar.classList.toggle("close");
});