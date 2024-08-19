import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

(function () {
    emailjs.init("w5NmY3KN7iiOu69jP"); // Replace with your EmailJS user ID
})();

document.addEventListener('DOMContentLoaded', () => {
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
                const salestax = 0.10;

                // Update totals with or without discount
                updateTotals(subtotal, salestax);
            });
        }

        // Event listeners for cart interactions
        const quantityInputs = document.querySelectorAll('.quantity');
        quantityInputs.forEach(input => {
            input.addEventListener('change', updateCartItemQuantity);
        });

        // const increaseButtons = document.querySelectorAll('.increase');
        // increaseButtons.forEach(button => {
        //     button.addEventListener('click', incrementQuantity);
        // });

        // const decreaseButtons = document.querySelectorAll('.decrease');
        // decreaseButtons.forEach(button => {
        //     button.addEventListener('click', decrementQuantity);
        // });

        // const deleteButtons = document.querySelectorAll('.delete');
        // deleteButtons.forEach(button => {
        //     button.addEventListener('click', deleteCartItem);
        // });
    }

    async function calculateTotalPrice(item) {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return price * quantity;
    }

    // Function to calculate sales tax
    function calculateSalesTax(subtotal, salestax) {
        return subtotal * salestax;
    }

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

    // Function to update the display of the subtotal, tax, and total price with discount
    async function updateTotals(subtotal, salestax) {

        const pointDiscountElement = document.getElementById('pointDiscount');
        const pointsText = pointDiscountElement.textContent; // Get the text content
        const pointsValue = parseFloat(pointsText.replace(/[^0-9.-]+/g, "")); // Remove non-numeric characters and convert to a number

        const discountedStaff = isStaff ? subtotal * (1 - discountRate) : subtotal;
        const discount = subtotal - discountedStaff;
        const salesTax = calculateSalesTax(subtotal, salestax);
        const totalPrice = discountedStaff + salesTax - pointsValue;


        // Update the HTML elements
        document.getElementById('Subtotal').textContent = `RM ${subtotal.toFixed(2)}`;
        document.getElementById('salestax').textContent = `RM ${salesTax.toFixed(2)}`;
        document.getElementById('discount').textContent = `- RM ${discount.toFixed(2)}`;
        document.getElementById('totalprice').textContent = `RM ${totalPrice.toFixed(2)}`;
    }

    // async function incrementQuantity(event) {
    //     event.preventDefault();

    //     const productName = this.getAttribute('data-product-name');
    //     const input = this.parentElement.querySelector('.quantity-input');
    //     let currentQuantity = parseInt(input.value, 10);
    //     let newQuantity = currentQuantity + 1;

    //     const productStocks = await getProductStock();
    //     const productStock = productStocks.find(stock => stock.product_name === productName);

    //     if (!productStock) {
    //         console.error(`Product stock not found for ${productName}.`);
    //         return;
    //     }

    //     const availableStock = productStock.product_stock;
    //     if (newQuantity > availableStock) {
    //         window.alert(`Cannot increase quantity. Only ${availableStock} left in stock.`);
    //         return;
    //     }

    //     input.value = newQuantity;

    //     // Update cart in Firestore
    //     await updateCartItemQuantity(productName, newQuantity);
    //     displayCartItems();
    // }

    // async function decrementQuantity(event) {
    //     event.preventDefault();

    //     const productName = this.getAttribute('data-product-name');
    //     const input = this.parentElement.querySelector('.quantity-input');
    //     let currentQuantity = parseInt(input.value, 10);

    //     if (currentQuantity <= 1) {
    //         window.alert('Quantity cannot be less than 1.');
    //         return;
    //     }

    //     let newQuantity = currentQuantity - 1;
    //     input.value = newQuantity;

    //     // Update cart in Firestore
    //     await updateCartItemQuantity(productName, newQuantity);
    //     displayCartItems();
    // }

    // async function updateCartItemQuantity(productName, newQuantity) {
    //     const userId = getCurrentUserId();
    //     const userCartDocRef = doc(collection(db, 'carts'), userId);

    //     try {
    //         const userCartDocSnap = await getDoc(userCartDocRef);
    //         let cartItems = userCartDocSnap.exists() ? userCartDocSnap.data().cart || [] : [];

    //         const productIndex = cartItems.findIndex(item => item.name === productName);
    //         if (productIndex > -1) {
    //             cartItems[productIndex].quantity = newQuantity;
    //             await setDoc(userCartDocRef, { cart: cartItems }, { merge: true });
    //         } else {
    //             console.error("Product not found in cart.");
    //         }
    //     } catch (error) {
    //         console.error("Error updating cart item quantity:", error);
    //     }
    // }

    async function generateTransactionID() {
        const transactionCounterDocRef = doc(db, 'metadata', 'transactionCounter');
        try {
            const transactionCounterDoc = await getDoc(transactionCounterDocRef);
            let newTransactionID = 1;
            if (transactionCounterDoc.exists()) {
                newTransactionID = transactionCounterDoc.data().lastTransactionID + 1;
            }
            await setDoc(transactionCounterDocRef, { lastTransactionID: newTransactionID });
            return `T${newTransactionID.toString().padStart(2, '0')}`; // Example format: P01
        } catch (e) {
            console.error('Failed to generate transaction ID: ', e);
            throw new Error('Failed to generate transaction ID');
        }
    }


    // Function to save payment details
    // Function to handle cash payment and save payment details
    async function handleCashPayment() {
        const totalPriceElement = document.getElementById('totalprice');
        const totalPrice = parseFloat(totalPriceElement.textContent.replace('RM ', ''));

        const cashPaidInput = document.getElementById('cash-paid-input');
        let cashPaid = parseFloat(cashPaidInput.value);

        if (!isNaN(cashPaid)) {
            const change = cashPaid - totalPrice;

            if (change < 0) {
                document.getElementById('change-message').textContent = `Insufficient cash. You need RM ${Math.abs(change).toFixed(2)} more.`;
            } else {
                document.getElementById('change-amount').textContent = change.toFixed(2);
                document.getElementById('change-message').textContent = '0.00';
            }
        } else {
            document.getElementById('change-message').textContent = 'Please enter a valid cash amount.';
        }
    }

    // Add event listener for real-time cash amount update
    document.getElementById('cash-paid-input').addEventListener('input', handleCashPayment);

    // Function to save payment details
    async function savePaymentDetails(transactionId, cartItems, cashPaid, subtotal, salesTax, discount, pointDiscount, totalPrice, changes, memberDetails) {
        try {
            const discountElement = document.getElementById('discount');
            let discountText = discountElement.textContent.replace('RM ', '');
            discountText = discountText.replace('-', '').trim();
            discount = parseFloat(discountText);
            discount = isNaN(discount) ? 0 : discount;

            // Format the pointDiscount similarly if needed
            const pointDiscountElement = document.getElementById('pointDiscount');
            let pointDiscountText = pointDiscountElement.textContent.replace('RM ', '');
            pointDiscountText = pointDiscountText.replace('-', '').trim();
            pointDiscount = parseFloat(pointDiscountText);
            pointDiscount = isNaN(pointDiscount) ? 0 : pointDiscount;

            // Reference to the Firestore document with ID as transactionId
            const paymentRef = doc(collection(db, 'orders'), transactionId);

            // Create the payment data object
            const paymentData = {
                transactionId: transactionId,
                cartItems: cartItems,
                paymentDate: new Date().toISOString(),
                method: 'cash',
                amountPaid: cashPaid,
                subtotal: subtotal,
                discount: discount, // Original subtotal
                salesTax: salesTax, // Calculated sales tax
                pointDiscount: pointDiscount,
                totalPrice: totalPrice,
                change: changes, // Change to be returned
                memberDetails: memberDetails ? {
                    AddedPoints: memberDetails.AddedPoints || 0,
                    RedeemedPoints: memberDetails.RedeemedPoints || 0,
                    email: memberDetails.email || '',
                    membershipId: memberDetails.membershipId || '',
                    name: memberDetails.name || '',
                    points: memberDetails.points || 0
                } : null
            };
            console.log("Payment Data to be saved:", paymentData);
            // Set the document data
            await setDoc(paymentRef, paymentData);
            // await sendEmailNotificationOnSuccess(paymentData);
            console.log("Payment details saved successfully.");
        } catch (error) {
            console.error("Error saving payment details:", error);
        }
    }

    // async function collectTransactionDetails() {
    //     try {
    //         const user = auth.currentUser;
    //         const userId = user ? user.uid : null;

    //         const cartItems = await getCartData(userId);

    //         // Extract values with fallback defaults
    //         const cashPaid = parseFloat(document.getElementById('cash-paid-input').textContent.replace(/[^0-9.]/g, "")) || 0;
    //         const subtotal = parseFloat(document.getElementById('Subtotal').textContent.replace(/[^0-9.]/g, "")) || 0;
    //         const salesTax = parseFloat(document.getElementById('salestax').textContent.replace(/[^0-9.]/g, "")) || 0;
    //         const change = parseFloat(document.getElementById('change-amount').textContent.replace(/[^0-9.]/g, "")) || 0;
    //         const discount = parseFloat(document.getElementById('discount').textContent.replace(/[^0-9.]/g, "")) || 0;
    //         const totalPrice = parseFloat(document.getElementById('totalprice').textContent.replace(/[^0-9.]/g, "")) || 0;
    //         const pointDiscount = parseFloat(document.getElementById('pointDiscount').textContent.replace(/[^0-9.]/g, "")) || 0;

    //         // Placeholder functions for additional details
    //         const transactionID = await generateTransactionID();

    //         // Get member details (assuming a function getMemberDetails exists)
    //         const membershipInfo = await checkMembership();
    //         const memberDetails = membershipInfo.valid ? membershipInfo.memberDetails : {};

    //         return {
    //             transactionID,
    //             cartItems,
    //             paymentDate: new Date().toISOString(),
    //             method: 'cash', // Payment method
    //             memberDetails, // Member details
    //             amountPaid: cashPaid, // Amount paid in cash
    //             subtotal, // Original subtotal
    //             discount,
    //             pointDiscount, // Applied discount
    //             salesTax, // Calculated sales tax
    //             totalPrice,
    //             change, // Change to be returned
    //             transactionTotal: totalPrice, // Assuming totalPrice includes all necessary amounts
    //             transactionDate: new Date().toISOString(),
    //         };
    //     } catch (error) {
    //         console.error("Error collecting transaction details:", error);
    //         throw error; // Re-throw error to handle it in calling code
    //     }
    // }


    // Add event listener for the "Process Cash Payment" button
    document.getElementById('cash-payment').addEventListener('click', async () => {
        try {
            // Collect all the necessary elements and parse values
            const changeElement = document.getElementById('change-amount');
            const changes = parseFloat(changeElement.textContent.replace('RM ', ''));

            const pointsToRedeemInput = document.getElementById('points-to-redeem');
            let pointsToRedeem = parseFloat(pointsToRedeemInput.value) || 0;

            const pointDiscountElement = document.getElementById('pointDiscount');
            const pointDiscount = parseFloat(pointDiscountElement.textContent.replace('RM ', ''));

            const totalPriceElement = document.getElementById('totalprice');
            const totalPrice = parseFloat(totalPriceElement.textContent.replace('RM ', ''));

            const subtotalElement = document.getElementById('Subtotal');
            const subtotal = parseFloat(subtotalElement.textContent.replace('RM ', ''));

            const salesTaxElement = document.getElementById('salestax');
            const salesTax = parseFloat(salesTaxElement.textContent.replace('RM ', ''));

            const discountElement = document.getElementById('discount');
            const discount = parseFloat(discountElement.textContent.replace('RM ', ''));

            const cashPaidInput = document.getElementById('cash-paid-input');
            let cashPaid = parseFloat(cashPaidInput.value);
            const change = cashPaid - totalPrice;

            if (!isNaN(cashPaid) && change >= 0) {
                // Check membership
                const membershipInfo = await checkMembership();
                const memberDetails = membershipInfo.memberDetails; // Extract member details

                // Membership is valid, proceed with payment
                const userId = getCurrentUserId();

                if (userId) {
                    // Get current cart items
                    const cartItems = await getCartData(userId);

                    // Generate a unique transaction ID
                    const transactionId = await generateTransactionID();

                    // Save payment details
                    await savePaymentDetails(
                        transactionId,
                        cartItems,
                        cashPaid,
                        subtotal,
                        salesTax,
                        discount,
                        pointDiscount,
                        totalPrice,
                        changes,
                        membershipInfo.valid ? memberDetails : null // Pass member details if valid
                    );

                    if (membershipInfo.valid) {
                        // Make sure memberDetails exists
                        if (!memberDetails) {
                            console.error('Member details are not available.');
                            return;
                        }

                        // Calculate points to add
                        const pointsToAdd = await calculatePoints(totalPrice);
                        console.log(`Points to Add before update: ${pointsToAdd}`);

                        await updateMemberPoints(memberDetails.membershipId, pointsToAdd);

                        // Redeem points if applicable
                        if (!isNaN(pointsToRedeem) && pointsToRedeem > 0) {
                            const redemptionResult = await redeemPoints(memberDetails.membershipId, pointsToRedeem);
                            console.log(`Points Redeemed Result: ${JSON.stringify(redemptionResult)}`);
                        } else {
                            console.log(`No points to redeem or invalid value.`);
                        }

                        memberDetails.AddedPoints = pointsToAdd;
                        memberDetails.RedeemedPoints = pointsToRedeem;

                        console.log('Updated Member Details:', memberDetails);
                    } else {
                        console.error('Membership is not valid.');
                    }



                    // Deduct stock for each product
                    for (let item of cartItems) {
                        await updateProductStock(item.id, item.quantity, item.category, item.type);
                    }

                    // Optionally clear the cart after payment
                    await clearCart(userId);
                } else {
                    document.getElementById('change-message').textContent = 'You need to be a member to earn points.';
                }
            } else {
                document.getElementById('change-message').textContent = 'Please enter a valid cash amount.';
            }
        } catch (error) {
            console.error("Error processing cash payment:", error);
        }
    });


    // Function to clear the cart after payment
    async function clearCart(userId) {
        try {
            const cartRef = doc(collection(db, 'carts'), userId);
            await setDoc(cartRef, { cart: [] }); // Set the cart to an empty array
            console.log("Cart cleared successfully.");
        } catch (error) {
            console.error("Error clearing cart:", error);
        }
    }

    async function updateProductStock(id, quantity, category, type) {
        try {
            // Debugging logs
            console.log('Product ID:', id);
            console.log('Category:', category);
            console.log('Subcategory:', type);

            if (!id || !category || !type) {
                throw new Error('Invalid product details');
            }

            // Reference the Firestore document for the product
            const productRef = doc(db, 'product', category, type, id);

            // Get the current stock
            const productDoc = await getDoc(productRef);
            if (!productDoc.exists()) {
                console.error('Product not found:', id);
                return;
            }

            const productData = productDoc.data();
            const currentStock = productData.product_stock || 0;

            // Calculate the new stock
            const newStock = currentStock - quantity;
            if (newStock < 0) {
                console.error('Insufficient stock for product:', id);
                return;
            }

            // Update the product stock
            await updateDoc(productRef, { product_stock: newStock });
            console.log('Stock updated for product:', id);

        } catch (error) {
            console.error('Error updating product stock:', error);
        }
    }

    // DOMContentLoaded to set up event listeners

    // Add event listeners to denomination buttons
    const denominationButtons = document.querySelectorAll('#denomination-buttons button');

    denominationButtons.forEach(button => {
        button.addEventListener('click', () => {
            const amount = button.getAttribute('data-amount');
            const cashPaidInput = document.getElementById('cash-paid-input');
            cashPaidInput.value = amount; // Set the value of the cash input field
        });
    });

    // Add event listener for the "Process Cash Payment" button
    async function fetchUsers() {
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        verifyMember(userList);
    }

    async function verifyMember(name) {
        try {
            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, where('name', '==', name));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return { valid: false }; // ID not found
            } else {
                const userData = querySnapshot.docs[0].data();
                return { valid: true, username: userData.name }; // ID found, return username
            }
        } catch (error) {
            console.error('Error verifying member name:', error);
            return { valid: false }; // In case of error
        }
    }

    // Function to check membership and update member details
    async function checkMembership() {
        const memberInfoDiv = document.getElementById('member-info');
        const username = sessionStorage.getItem('memberName');
        let memberDetails = null;

        if (username) {
            console.log("User is a member.");
            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, where('name', '==', username));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
            } else {
                const userData = querySnapshot.docs[0].data();
                const currentPoints = userData.points || 0;
                let newPoints = currentPoints;

                memberDetails = {
                    membershipId: userData.membershipId,
                    name: userData.name,
                    email: userData.email,
                    points: newPoints,

                };

                if (memberInfoDiv) {
                    memberInfoDiv.innerHTML = ''; // Clear existing content

                    const memberId = document.createElement('p');
                    memberId.textContent = `Member Id: ${userData.membershipId}`;
                    memberInfoDiv.appendChild(memberId);

                    const memberName = document.createElement('p');
                    memberName.textContent = `Name: ${userData.name}`;
                    memberInfoDiv.appendChild(memberName);

                    const memberEmail = document.createElement('p');
                    memberEmail.textContent = `Email: ${userData.email}`;
                    memberInfoDiv.appendChild(memberEmail);

                    const memberPoints = document.createElement('p');
                    memberPoints.textContent = `Points: ${currentPoints}`;
                    memberInfoDiv.appendChild(memberPoints);

                }

                return { valid: true, memberDetails: memberDetails };
            }
        } else {
            console.log("User is not a member.");
            if (memberInfoDiv) {
                memberInfoDiv.style.display = 'none';
            }
            return { valid: false };
        }
    }


    async function updateMemberPoints(membershipId, pointsToAdd) {
        try {
            pointsToAdd = Number(pointsToAdd);
            if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
                console.error('Invalid pointsToAdd value:', pointsToAdd);
                return;
            }

            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, where('membershipId', '==', membershipId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                const currentPoints = Number(userData.points) || 0;
                const newPoints = currentPoints + pointsToAdd;

                const userRef = doc(db, 'users', userDoc.id);
                await updateDoc(userRef, { points: newPoints });

                const updatedData = {
                    points: newPoints,
                    AddedPoints: pointsToAdd,
                    // Ensure other fields are handled properly
                };

                const memberInfoDiv = document.getElementById('member-info');
                if (memberInfoDiv) {
                    memberInfoDiv.innerHTML = ''; // Clear existing content

                    const pointsAdded = document.createElement('p');
                    pointsAdded.textContent = `Points Added: ${pointsToAdd}`;
                    memberInfoDiv.appendChild(pointsAdded);

                    const pointsAddedElement = document.getElementById('pointsAdded');
                    if (pointsAddedElement) {
                        pointsAddedElement.textContent = `Points Added: ${pointsToAdd}`;
                    }

                    const balancePoints = document.createElement('p');
                    balancePoints.textContent = `Updated Points Balance: ${newPoints}`;
                    memberInfoDiv.appendChild(balancePoints);

                    console.log(`Points updated for membershipId ${membershipId}: newPoints ${newPoints}`);
                    console.log(`Updated Points Info: ${JSON.stringify(updatedData)}`);
                    return updatedData;
                } else {
                    console.warn('Member info element not found in the DOM.');
                }
            } else {
                console.warn("User not found with membershipId:", membershipId);
            }
        } catch (error) {
            console.error("Error updating member points:", error);
        }
    }

    // Initialize the modal control
    document.getElementById('redeem-points-btn').addEventListener('click', () => {
        document.getElementById('modal-message').textContent = ''; // Clear previous messages
        checkMembership();
    });

    // Function to redeem points and save redeemed points
    async function redeemPoints(membershipId, pointsToRedeem) {
        try {
            pointsToRedeem = Number(pointsToRedeem);
            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, where('membershipId', '==', membershipId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                const currentPoints = userData.points || 0;

                const redemptionRate = 1000; // 1000 points = RM 1
                const pointsDiscount = pointsToRedeem / redemptionRate;

                if (pointsToRedeem > currentPoints) {
                    console.error("Insufficient points.");
                    document.getElementById('modal-message').textContent = "Insufficient points.";
                    document.getElementById('modal-message').style.color = "red";
                    return;
                }

                // Update user's points
                const newDeductedPoints = currentPoints - pointsToRedeem;
                const userRef = doc(db, 'users', userDoc.id);
                await updateDoc(userRef, { points: newDeductedPoints });

                document.getElementById('modal-message').textContent = "Points redeemed successfully.";
                document.getElementById('pointDiscount').textContent = `- RM ${pointsDiscount.toFixed(2)}`;
                document.getElementById('points-to-redeem').textContent = `${pointsToRedeem}`;

                const memberInfoDiv = document.getElementById('member-info');
                if (memberInfoDiv) {
                    memberInfoDiv.innerHTML = ''; // Clear existing content

                    const pointsRedeemed = document.createElement('p');
                    pointsRedeemed.textContent = `Points Redeemed: ${pointsToRedeem}`;
                    memberInfoDiv.appendChild(pointsRedeemed);

                    const balancePoints = document.createElement('p');
                    balancePoints.textContent = `Updated Points Balance: ${newDeductedPoints}`;
                    memberInfoDiv.appendChild(balancePoints);
                }

                // Save the updated member info
                checkMembership();

                console.log("Points redeemed and discount applied successfully.");
            } else {
                console.error("User document not found.");
                document.getElementById('modal-message').textContent = "User document not found.";
                document.getElementById('modal-message').style.color = "red";
            }
        } catch (error) {
            console.error("Error redeeming points:", error);
            document.getElementById('modal-message').textContent = "Error redeeming points. Please try again.";
            document.getElementById('modal-message').style.color = "red";
        }
    }

    // Event listener for the "Redeem Points" button inside the modal
    document.getElementById('redeem-points').addEventListener('click', async () => {
        const pointsInput = document.getElementById('points-to-redeem');
        const pointsToRedeem = parseInt(pointsInput.value, 10) || 0;

        if (pointsToRedeem > 0) {
            const membershipInfo = await checkMembership();

            if (membershipInfo.valid) {
                const { membershipId } = membershipInfo.memberDetails;
                await redeemPoints(membershipId, pointsToRedeem);
                $('#redeemModal').modal('hide');
            } else {
                console.error("Membership is invalid or not found.");
                document.getElementById('modal-message').textContent = "Invalid membership or no membership info available.";
                document.getElementById('modal-message').style.color = "red";
            }
        } else {
            console.error("Invalid points amount.");
            document.getElementById('modal-message').textContent = "Please enter a valid number of points.";
            document.getElementById('modal-message').style.color = "red";
        }
    });


    // Function to check if user is a member
    async function calculatePoints(totalPrice) {
        const pointsPerRM = 1; // Define how many points per RM
        return Math.floor(totalPrice * pointsPerRM);
    }


    document.getElementById('send-receipt').addEventListener('click', async (event) => {
        // Retrieve necessary data or perform any required actions before calling this function
        const paymentData = await savePaymentDetails(); // Replace with your method to get payment data

        try {
            await sendEmailNotificationOnSuccess(paymentData);
            console.log('Receipt email sent successfully.');
        } catch (error) {
            console.error('Error sending receipt email:', error);
        }
    });

    // async function sendEmailNotificationOnSuccess(paymentData) {
    //     try {
    //         const date = new Date().toISOString();

    //         // Generate invoice and get the URL
    //         const receiptResponse = await fetch('/generate-receipt', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({ paymentData })
    //         });

    //         if (!receiptResponse.ok) throw new Error('Failed to generate receipt');

    //         const { receiptUrl } = await receiptResponse.json();
    //         console.log('Generated Receipt URL:', receiptUrl);

    //         const emailResponse = await emailjs.send('service_wzr9j6h', 'template_hs5h78k', {
    //             to_email: paymentData.memberDetails.email,
    //             subject: 'Payment Detials',
    //             date: date,
    //             name: paymentData.memberDetails.name,
    //             receipt_url: receiptUrl,
    //         });

    //         console.log('Email sent successfully to:', paymentData.memberDetails.email);
    //         console.log('Response status:', emailResponse.status);
    //         console.log('Response text:', emailResponse.text);
    //     } catch (error) {
    //         console.error('Error sending email:', error);
    //     }
    // }

    fetchUsers();
    // Call the function with a username argument
    checkMembership();
    // Initial cart display
    displayCartItems();

});


