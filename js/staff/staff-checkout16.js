import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

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
            await displayCartItems();
            console.log("User authenticated. User ID:", userId);
        } else {
            console.log("No user is authenticated.");
        }
    } catch (error) {
        console.error("Error in authentication state change:", error);
    }
});

async function getProductStock() {
    try {
        // Get the selected food type
        const foodType = document.getElementById('food-type').value;

        // Get the active food category
        const activeCategoryElement = document.querySelector('#food-category .nav-link.active');
        const foodCategory = activeCategoryElement ? activeCategoryElement.getAttribute('value') : null;

        // Debugging logs
        console.log('Food Category:', foodCategory);
        console.log('Food Type:', foodType);

        if (!foodCategory || !foodType) {
            // Return all product stocks if no specific category/type is selected
            const categories = {
                cat: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
                dog: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
                birds: ['dry food', 'toys', 'essentials', 'treats'],
                'fish&aquatics': ['dry food', 'essentials'],
                'hamster&rabbits': ['dry food', 'toys', 'essentials', 'treats']
            };

            const productStocks = [];

            for (const [category, subcategories] of Object.entries(categories)) {
                for (const subcategory of subcategories) {
                    const collectionRef = collection(db, 'product', category, subcategory);
                    const snapshot = await getDocs(collectionRef);

                    snapshot.forEach(doc => {
                        const productData = doc.data();
                        const productId = productData.product_id;
                        const productImage = productData.product_image;
                        const productBarcode = productData.product_barcode;
                        const productName = productData.product_name;
                        const productStock = productData.product_stock || 0;
                        const productPrice = productData.product_price || 0;
                        const type = subcategory;
                        productStocks.push({ productId, productBarcode, productName, productStock, productImage, productPrice, category, type });
                    });
                }
            }

            return productStocks;

        } else {
            // Reference the Firestore collection for the selected category and type
            const categoryCollectionRef = collection(db, 'product', foodCategory, foodType);
            const querySnapshot = await getDocs(categoryCollectionRef);

            if (querySnapshot.empty) {
                console.log('No documents found.');
                return []; // Return an empty array
            }

            // Map documents to product objects
            let documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            documents.sort((a, b) => naturalSort(a.product_id, b.product_id));

            console.log('Fetched Documents:', documents); // Debugging
            return documents;
        }

    } catch (error) {
        console.error('Error fetching documents: ', error);
        return []; // Return an empty array in case of error
    }
}

async function getCartData(user) {
    try {
        if (user) {
            const userId = getCurrentUserId();
            if (!userId) {
                console.error("Invalid userId:", userId);
                return [];
            }

            const cartRef = doc(collection(db, 'carts'), userId);
            const cartDoc = await getDoc(cartRef);
            if (cartDoc.exists()) {
                return cartDoc.data().cart || [];
            } else {
                console.log("Cart document does not exist for the current user.");

            } return [];
        }
    } catch (error) {
        console.error("Error fetching cart data from Firestore:", error);
        return [];
    }
}

const cartContainer = document.getElementById('cartItems');

let isStaff = false; // Flag to determine if the user is staff
const discountRate = 0.10; // 10% staff discount

// Function to apply the staff discount
function applyDiscount() {
    isStaff = true; // Set to true when discount is applied
    displayCartItems(); // Refresh cart display with discount applied
}

// Function to handle the "Apply Discount" button click
document.getElementById('apply-discount').addEventListener('click', applyDiscount);

// const memberName = sessionStorage.getItem('memberName');

// document.getElementById('member-info').textContent = memberName;


const username = sessionStorage.getItem('memberName');

// Check if the user is a member
if (username) {
    console.log("User is a member. ");

    // Display the username in the checkout section
    const memberInfoDiv = document.getElementById('member-info');
    memberInfoDiv.innerHTML = `
            <p> Username: ${username}</p>
        `;

    // Apply membership benefits, such as discounts
} else {
    console.log("User is not a member.");
    memberInfoDiv.style.display = 'none';
}

async function displayCartItems() {
    const userId = getCurrentUserId();
    console.log("User ID:", userId);

    let cartItems = await getCartData(userId);
    console.log("Cart Items:", cartItems);

    if (!cartItems) {
        cartItems = [];
    }

    cartContainer.innerHTML = '';

    let subtotal = 0;

    for (let index = 0; index < cartItems.length; index++) {
        const item = cartItems[index];

        const cartItemDiv = document.createElement('div');
        cartItemDiv.classList.add('cart-item');

        cartItemDiv.innerHTML = `
            <div class="cart-item-info">
                <p>${index + 1}</p>
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                    <h5>${item.name}</h5>
                </div>
                <p>Barcode: ${item.barcode}</p>
                <p>Type: ${item.type}</p>
                <p>Price: RM ${item.price}</p>
                <p>Quantity: ${item.quantity}</p>
                <p class="total-price-cell"></p>
            </div>
        `;

        cartContainer.appendChild(cartItemDiv);

        const totalPriceCell = cartItemDiv.querySelector('.total-price-cell');
        calculateTotalPrice(item).then(itemTotalPrice => {
            totalPriceCell.textContent = `RM ${itemTotalPrice.toFixed(2)}`;

            subtotal += itemTotalPrice;

            // Example tax rate: 7%
            const taxRate = 0.10;

            // Update totals with or without discount
            updateTotals(subtotal, taxRate);
        });
    }

    // Event listeners for cart interactions
    const quantityInputs = document.querySelectorAll('.quantity');
    quantityInputs.forEach(input => {
        input.addEventListener('change', updateCartItemQuantity);
    });

    const increaseButtons = document.querySelectorAll('.increase');
    increaseButtons.forEach(button => {
        button.addEventListener('click', incrementQuantity);
    });

    const decreaseButtons = document.querySelectorAll('.decrease');
    decreaseButtons.forEach(button => {
        button.addEventListener('click', decrementQuantity);
    });

    const deleteButtons = document.querySelectorAll('.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', deleteCartItem);
    });
}

async function calculateTotalPrice(item) {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return price * quantity;
}

// Function to calculate sales tax
function calculateSalesTax(subtotal, taxRate) {
    return subtotal * taxRate;
}

// Function to update the display of the subtotal, tax, and total price with discount
async function updateTotals(subtotal, taxRate) {
    const discountedSubtotal = isStaff ? subtotal * (1 - discountRate) : subtotal;
    const discountAmount = subtotal - discountedSubtotal;
    const salesTax = calculateSalesTax(discountedSubtotal, taxRate);
    const totalPrice = discountedSubtotal + salesTax;

    // Update the HTML elements
    document.getElementById('Subtotal').textContent = `RM ${discountedSubtotal.toFixed(2)}`;
    document.getElementById('salestax').textContent = `RM ${salesTax.toFixed(2)}`;
    document.getElementById('discount').textContent = `RM ${discountAmount.toFixed(2)}`;
    document.getElementById('totalprice').textContent = `RM ${totalPrice.toFixed(2)}`;
}

async function incrementQuantity(event) {
    event.preventDefault();

    const productName = this.getAttribute('data-product-name');
    const input = this.parentElement.querySelector('.quantity-input');
    let currentQuantity = parseInt(input.value, 10);
    let newQuantity = currentQuantity + 1;

    const productStocks = await getProductStock();
    const productStock = productStocks.find(stock => stock.product_name === productName);

    if (!productStock) {
        console.error(`Product stock not found for ${productName}.`);
        return;
    }

    const availableStock = productStock.product_stock;
    if (newQuantity > availableStock) {
        window.alert(`Cannot increase quantity. Only ${availableStock} left in stock.`);
        return;
    }

    input.value = newQuantity;

    // Update cart in Firestore
    await updateCartItemQuantity(productName, newQuantity);
    displayCartItems();
}

async function decrementQuantity(event) {
    event.preventDefault();

    const productName = this.getAttribute('data-product-name');
    const input = this.parentElement.querySelector('.quantity-input');
    let currentQuantity = parseInt(input.value, 10);

    if (currentQuantity <= 1) {
        window.alert('Quantity cannot be less than 1.');
        return;
    }

    let newQuantity = currentQuantity - 1;
    input.value = newQuantity;

    // Update cart in Firestore
    await updateCartItemQuantity(productName, newQuantity);
    displayCartItems();
}

async function updateCartItemQuantity(productName, newQuantity) {
    const userId = getCurrentUserId();
    const userCartDocRef = doc(collection(db, 'carts'), userId);

    try {
        const userCartDocSnap = await getDoc(userCartDocRef);
        let cartItems = userCartDocSnap.exists() ? userCartDocSnap.data().cart || [] : [];

        const productIndex = cartItems.findIndex(item => item.name === productName);
        if (productIndex > -1) {
            cartItems[productIndex].quantity = newQuantity;
            await setDoc(userCartDocRef, { cart: cartItems }, { merge: true });
        } else {
            console.error("Product not found in cart.");
        }
    } catch (error) {
        console.error("Error updating cart item quantity:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to denomination buttons
    const denominationButtons = document.querySelectorAll('#denomination-buttons button');

    denominationButtons.forEach(button => {
        button.addEventListener('click', () => {
            const amount = button.getAttribute('data-amount');
            const cashPaidInput = document.getElementById('cash-paid-input');
            cashPaidInput.value = amount; // Set the value of the cash input field
        });
    });

    // Handle cash payment processing
    document.getElementById('cash-payment').addEventListener('click', handleCashPayment);
});

async function handleCashPayment() {
    const totalPriceElement = document.getElementById('totalprice');
    const totalPrice = parseFloat(totalPriceElement.textContent.replace('RM ', ''));
    const cashPaidInput = document.getElementById('cash-paid-input');
    let cashPaid = parseFloat(cashPaidInput.value);

    if (!isNaN(cashPaid)) {
        const change = cashPaid - totalPrice;

        if (change < 0) {
            document.getElementById('change-message').textContent = `Insufficient cash. You need RM ${Math.abs(change).toFixed(2)} more.`;
            return;
        }

        // document.getElementById('cash-paid-input').textContent = cashPaid.toFixed(2);
        document.getElementById('change-amount').textContent = change.toFixed(2);
        document.getElementById('change-message').textContent = '0.00';
    } else {
        document.getElementById('change-message').textContent = 'Please enter a valid cash amount.';
    }
}

// Add event listener for the cash paid input to update change in real-time
document.getElementById('cash-paid-input').addEventListener('input', handleCashPayment);

// Add event listener for the "Process Cash Payment" button
document.getElementById('cash-payment').addEventListener('click', handleCashPayment);

displayCartItems();
