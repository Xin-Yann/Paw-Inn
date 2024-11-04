import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDocs, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import Typebot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3/dist/web.js'

const db = getFirestore();
const auth = getAuth();

Typebot.initBubble({
    typebot: "customer-support-92olq2c",
    theme: {
        button: { backgroundColor: "#0d9488" },
        chatWindow: { backgroundColor: "#fff" },
    },
});

(function () {
    emailjs.init("86kjxi3kBUTZUUwYJ"); 
})();


function getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
}

auth.onAuthStateChanged(async (user) => {
    try {
        if (user) {
            const userId = getCurrentUserId();
            if (!userId) {
                console.error("Invalid userId:", userId);
                return;
            }
            fetchUserDataFromFirestore(userId);
            console.log("User authenticated. User ID:", userId);
        } else {
            console.log("User is not authenticated.");
        }
    } catch (error) {
        console.error("Error in authentication state change:", error);
    }
});

async function fetchUserDataFromFirestore(userId) {
    try {
        if (userId) {
            const usersCollectionRef = collection(db, 'users');
            const querySnapshot = await getDocs(query(usersCollectionRef, where('userId', '==', userId)));

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                document.getElementById('from_name').value = userData.name || '';
                document.getElementById('email_id').value = userData.email || '';
            });
        }
    } catch (e) {
        console.error('Error fetching user data: ', e);
    }
}

function SendMail() {
    var params = {
        from_name: document.getElementById("from_name").value,
        email_id: document.getElementById("email_id").value,
        title: document.getElementById("title").value,
        message: document.getElementById("message").value
    };
    emailjs.send('service_wio03zw', 'template_vbpmxdq', params).then(function (res) {
        alert("Success!", res.status);
        location.reload();
    });
}

document.getElementById('Submit').addEventListener('click', async (event) => {
    event.preventDefault();
    try {
        const name = document.getElementById('from_name').value;
        const email = document.getElementById('email_id').value;
        const title = document.getElementById('title').value;
        const message = document.getElementById('message').value;

        document.getElementById('title_error').textContent = '';
        document.getElementById('message_error').textContent = '';

        const docRef = await addDoc(collection(db, 'contact'), {
            name: name,
            email: email,
            title: title,
            message: message
        });

        let isValid = true;

        if (!title) {
            document.getElementById('title_error').textContent = 'Please fill in title.';
            isValid = false;
        }
        if (!message) {
            document.getElementById('message_error').textContent = 'Please fill in message.';
            isValid = false;
        }

        
        if (!name || !email || !title || !message) {
            window.alert('All field must be filled out.');
            return;
        }

        SendMail();

        console.log('Document written with ID: ', docRef.id);
    } catch (e) {
        console.error('Error adding document: ', e);
    }
});





