import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc,doc, getDocs, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();
const auth = getAuth();

function getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
}
// Initialize EmailJS with your service ID
emailjs.init("9R5K8FyRub386RIu8");

// Function to send OTP via EmailJS
function sendOTP(email, otp) {
    var params = {
        from_name: "Paws Inn",
        email_id: email,
        title: "OTP Verification",
        message: `Your OTP for verification is: ${otp}`
    };

    emailjs.send('service_7e6jx2j', 'template_l3gma7d', params).then(function (res) {
        console.log("OTP Email sent!", res.status);
    }).catch(function (error) {
        console.error("Error sending OTP:", error);
        // Handle error scenario
    });
}

const userId = getCurrentUserId();
if (userId) {
    // Call functions that require the userId, such as fetching user data or sending OTP
    fetchAndSendOTP(userId);
} else {
    // Handle case where no user is authenticated
    console.log("No user authenticated.");
}

// Function to fetch user data and send OTP
async function fetchAndSendOTP(userId) {
    try {
        const usersCollectionRef = collection(db, 'users');
        const querySnapshot = await getDocs(query(usersCollectionRef, where('userId', '==', userId)));

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            const email = userData.email;
            const otp = Math.floor(100000 + Math.random() * 900000); // Generate OTP
            sendOTP(email, otp); // Send OTP via EmailJS
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        // Handle error scenario
    }
}

// Function to handle form submission
document.getElementById('otp-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    // Add your OTP verification logic here if needed
    const enteredOTP = document.getElementById('otp').value;
    const expectedOTP = localStorage.getItem('otp'); // Retrieve OTP from local storage

    if (enteredOTP === expectedOTP) {
        alert('OTP verified successfully!');
        // Optionally, redirect or perform other actions after OTP verification
    } else {
        alert('Invalid OTP. Please try again.');
    }
});

// Function to populate form with user details and send OTP on page load
async function initPage(userId) {
    await fetchAndSendOTP(userId); // Fetch user data and send OTP
    // You can optionally populate form fields here without displaying OTP
}

initPage;