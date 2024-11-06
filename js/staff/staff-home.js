import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

function getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
}

//Fetch staff detials 
async function fetchAndDisplayPersonalDetails(email) {
    try {
        console.log(`Fetching details for email: ${email}`);

        const q = query(collection(db, 'staff'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const staffData = doc.data();
                console.log('User data fetched:', staffData);

                const nameElement = document.getElementById('Name');
                const emailElement = document.getElementById('Email');
                const staffIdElement = document.getElementById('staff-id');

                if (nameElement) {
                    nameElement.textContent = staffData.name || '';
                } else {
                    console.error("Element with ID 'name' not found");
                }

                if (emailElement) {
                    emailElement.textContent = staffData.email || '';
                } else {
                    console.error("Element with ID 'email' not found");
                }

                if (staffIdElement) {
                    staffIdElement.textContent = staffData.staffId || '';
                } else {
                    console.error("Element with ID 'staff-id' not found");
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
        const staffEmail = sessionStorage.getItem('staffEmail');
        if (staffEmail) {
            fetchAndDisplayPersonalDetails(staffEmail);
        } else {
            console.log('No staff email found in session storage.');
        }

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