import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
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
            await displayLimitedStockMessage(userId);
            console.log("User authenticated. User ID:", userId);
        } else {
            console.log("No user is authenticated.");
        }
    } catch (error) {
        console.error("Error in authentication state change:", error);
    }
});

// async function fetchAndDisplayProducts() {
//     try {
//         const productStocks = await getProductStock();
//         const productContainer = document.getElementById('product-container');
//         productContainer.innerHTML = ''; // Clear existing content

//         productStocks.forEach(productData => {
//             const foodType = productData.type;
//             const productDiv = createProductDiv(productData, foodType);
//             productContainer.appendChild(productDiv);
//         });
//     } catch (error) {
//         console.error("Error displaying products:", error);
//     }
// }

// async function getProductStock() {
//     try {
//         const categories = {
//             cat: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
//             dog: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
//             birds: ['dry food', 'toys', 'essentials', 'treats'],
//             'fish&aquatics': ['dry food', 'essentials'],
//             'hamster&rabbits': ['dry food', 'toys', 'essentials', 'treats']
//         };


//         const productStocks = [];

//         for (const [category, subcategories] of Object.entries(categories)) {
//             for (const subcategory of subcategories) {
//                 const collectionRef = collection(db, 'product', category, subcategory);
//                 const snapshot = await getDocs(collectionRef);

//                 snapshot.forEach(doc => {
//                     const productData = doc.data();
//                     const productId = productData.product_id;
//                     const productImage = productData.product_image;
//                     const productBarcode = productData.product_barcode;
//                     const productName = productData.product_name;
//                     const productStock = productData.product_stock || 0;
//                     const productPrice = productData.product_price || 0;
//                     const type = subcategory;
//                     productStocks.push({ productId, productBarcode, productName, productStock, productImage, productPrice, category, type });
//                 });
//             }
//         }

//         return productStocks;
//     } catch (error) {
//         console.error("Error fetching product stocks from Firestore:", error);
//         return [];
//     }
// }

// async function getProductStock() {
//     try {
//         // Get the selected food type
//         const foodType = document.getElementById('food-type').value;

//         // Get the active food category
//         const activeCategoryElement = document.querySelector('#food-category .nav-link.active');
//         const foodCategory = activeCategoryElement ? activeCategoryElement.getAttribute('value') : null;

//         console.log('Food Category:', foodCategory); // Debugging
//         console.log('Food Type:', foodType); // Debugging

//         if (!foodCategory || !foodType) {
//             throw new Error('Food Category or Food Type is not set.');
//         }

//         // Reference the Firestore collection
//         const categoryCollectionRef = collection(db, 'product', foodCategory, foodType);
//         const querySnapshot = await getDocs(categoryCollectionRef);

//         if (querySnapshot.empty) {
//             console.log('No documents found.');
//             return []; // Return an empty array
//         }

//         // Map documents to product objects
//         let documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//         documents.sort((a, b) => naturalSort(a.product_id, b.product_id));

//         console.log('Fetched Documents:', documents); // Debugging
//         return documents;

//     } catch (error) {
//         console.error('Error fetching documents: ', error);
//         return []; // Return an empty array in case of error
//     }
// }


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


// Function to display products
function displayProducts(products) {
    const productContainer = document.getElementById('product-container');
    productContainer.innerHTML = ''; // Clear previous content

    if (!Array.isArray(products)) {
        console.error("Expected products to be an array, but got:", products);
        return;
    }

    products.forEach(product => {
        console.log('Displaying Product:', product); // Debugging
        const productDiv = createProductDiv(product, document.getElementById('food-type').value, document.querySelector('#food-category .nav-link.active')?.getAttribute('value'));
        productContainer.appendChild(productDiv);
    });
}

function handleFoodTypeSelection() {
    // Fetch and display products based on the selected food type and active category
    getProductStock().then(products => {
        displayProducts(products);
    });
}

document.getElementById('food-type').addEventListener('change', handleFoodTypeSelection);

document.querySelectorAll('#food-category .nav-link').forEach(tab => {
    tab.addEventListener('click', async function (event) {
        event.preventDefault();

        // Get the selected category value
        const selectedCategory = this.getAttribute('value');

        // Remove active class from all tabs and add to the clicked tab
        document.querySelectorAll('#food-category .nav-link').forEach(link => link.classList.remove('active'));
        this.classList.add('active');
        document.getElementById('food-category').value = selectedCategory;

        // Fetch and display products for the selected category
        const products = await getProductStock();
        displayProducts(products);
    });
});

function naturalSort(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function createButton(text, onClickHandler) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClickHandler);
    button.classList.add('btn', 'btn-cart');
    return button;
}

function createProductDiv(product, foodType, foodCategory) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product');

    const imageUrl = `/image/products/${foodCategory}/${foodType}/${product.product_image}`;
    console.log('Image URL:', imageUrl); // Debugging
    const productImage = document.createElement('img');
    productImage.src = imageUrl;
    productImage.alt = 'Product Image';
    productImage.classList.add('product-image', 'clickable');
    productDiv.appendChild(productImage);

    const productBarcode = document.createElement('p');
    productBarcode.textContent = `Product Barcode: ${product.product_barcode}` || 'Barcode not available';
    productBarcode.classList.add('pt-5');
    productBarcode.style.color = 'black';
    productDiv.appendChild(productBarcode);

    const productName = document.createElement('h5');
    productName.textContent = product.product_name;
    productName.classList.add('pt-2');
    productName.style.height = '120px';
    productName.style.fontWeight = 'bold';
    productDiv.appendChild(productName);

    const productStock = document.createElement('p');
    productStock.textContent = `Stock: ${product.product_stock}` || 'Out of Stock';
    productStock.style.color = 'black';
    productDiv.appendChild(productStock);

    const productPrice = document.createElement('h5');
    productPrice.classList.add('pb-4');
    productPrice.textContent = `RM ${product.product_price}`;
    productDiv.appendChild(productPrice);

    const addToCartButton = createButton('ADD TO CART', () => {
        addToCart(product.product_id, product.product_barcode, product.product_name, product.product_price, product.product_stock, imageUrl, foodType, foodCategory);
    });

    addToCartButton.classList.add('btn', 'add-cart');

    // Disable the product div if stock is insufficient
    if (product.product_stock <= 0) {
        productDiv.classList.add('disabled');
        addToCartButton.disabled = true; // Disable the button
        addToCartButton.textContent = 'Out of Stock'; // Change button text
    } else {
        productDiv.classList.remove('disabled');
        addToCartButton.disabled = false; // Ensure the button is enabled
        addToCartButton.textContent = 'ADD TO CART'; // Reset button text
    }

    productDiv.appendChild(addToCartButton);

    return productDiv;
}

// Function to determine the product type based on its ID
function getProductType(productId) {
    if (productId.includes("DF")) {
        return "Dry Food";
    } else if (productId.includes("WF")) {
        return "Wet Food";
    } else if (productId.includes("ES")) {
        return "Essentials";
    } else if (productId.includes("TO")) {
        return "Toys";
    } else if (productId.includes("TR")) {
        return "Treats";
    } else {
        return "Unknown";
    }
}

// async function addToCart(productId, productImage, productName, productPrice, productWeight, quantity, productStock) {
//     try {
//         const userId = getCurrentUserId();
//         if (userId) {
//             let productType = getProductType(productId);

//             const userCartDocRef = doc(collection(db, 'carts'), userId);
//             const userCartDocSnap = await getDoc(userCartDocRef);

//             let existingQuantity = 0;
//             if (userCartDocSnap.exists()) {
//                 const cartItems = userCartDocSnap.data().cart || [];
//                 const existingProduct = cartItems.find(item => item.id === productId);
//                 if (existingProduct) {
//                     existingQuantity = existingProduct.quantity;
//                 }
//             }

//             // Check if adding the new quantity exceeds available stock
//             if (productStock === 0 || existingQuantity + quantity > productStock) {
//                 window.alert(`Insufficient stock for ${productName}.`);
//                 return;
//             }

//             let product = {
//                 id: productId,
//                 image: productImage,
//                 name: productName,
//                 price: productPrice,
//                 type: productType,
//                 weight: productWeight,
//                 quantity: existingQuantity + quantity,
//                 totalPrice: (productPrice * (existingQuantity + quantity)).toFixed(2),
//                 totalWeight: productWeight * (existingQuantity + quantity)
//             };

//             await saveProductToFirestore(product, productName);

//             await updateCartItemCount(userId);

//             window.alert(`${productName} has been added to your cart!`);
//             window.location.href = "/html/cart.html";
//         } else {
//             window.alert('Please login to add products to your cart.');
//             window.location.href = "../html/login.html";
//         }
//     } catch (error) {
//         console.error("Error adding product to cart:", error);
//     }
// }

async function addToCart(productId, productBarcode, productName, productPrice, productStock, imageUrl, foodType, foodCategory) {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            window.alert('Please login to add products to your cart.');
            window.location.href = "../staff/staff-login.html";
            return;
        }

        const userCartDocRef = doc(collection(db, 'carts'), userId);
        const userCartDocSnap = await getDoc(userCartDocRef);

        let existingQuantity = 0;
        let cartItems = [];

        if (userCartDocSnap.exists()) {
            cartItems = userCartDocSnap.data().cart || [];
            const existingProduct = cartItems.find(item => item.id === productId);
            if (existingProduct) {
                existingQuantity = existingProduct.quantity;
            }
        }

        if (productStock === 0 || existingQuantity + 1 > productStock) {
            window.alert(`Insufficient stock for ${productName}.`);
            return;
        }

        // Create or update the product in the cart
        let product = {
            id: productId,
            barcode: productBarcode,
            image: imageUrl,
            name: productName,
            price: productPrice,
            quantity: existingQuantity + 1,
            stock: productStock,
            type: foodType,
            category: foodCategory
        };

        const existingProductIndex = cartItems.findIndex(item => item.id === product.id);
        if (existingProductIndex > -1) {
            cartItems[existingProductIndex].quantity = product.quantity;
        } else {
            cartItems.push(product);
        }

        // Save updated cart to Firestore
        await setDoc(userCartDocRef, { cart: cartItems }, { merge: true });
        await saveProductToFirestore(userId, product);

        window.alert(`${productName} has been added to your cart!`);
        location.reload();
    } catch (error) {
        console.error("Error adding product to cart:", error);
    }
}

async function saveProductToFirestore(userId, product) {
    const userCartDocRef = doc(collection(db, 'carts'), userId);
    const userCartDocSnap = await getDoc(userCartDocRef);

    let cartItems = [];
    if (userCartDocSnap.exists()) {
        cartItems = userCartDocSnap.data().cart || [];
    }

    const existingProductIndex = cartItems.findIndex(item => item.id === product.id);
    if (existingProductIndex > -1) {
        cartItems[existingProductIndex].quantity = product.quantity;
    } else {
        cartItems.push(product);
    }

    await setDoc(userCartDocRef, { cart: cartItems }, { merge: true });
}


// function getProductType(productId) {
//     if (productId.includes("DF")) {
//         return "Dry Food";
//     } else if (productId.includes("WF")) {
//         return "Wet Food";
//     } else if (productId.includes("ES")) {
//         return "Essentials";
//     } else if (productId.includes("TO")) {
//         return "Toys";
//     } else if (productId.includes("TR")) {
//         return "Treats";
//     } else {
//         return "Unknown";
//     }
// }

let allProductStocks = []; // Global variable to store all product stocks

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch and display all products initially
        allProductStocks = await getProductStock();
        console.log("Initial products:", allProductStocks);
        displayProducts(allProductStocks);

        const searchInput = document.getElementById('search-input');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.trim().toLowerCase();
                console.log("Search term:", searchTerm);

                const filteredProducts = allProductStocks.filter(product => {
                    const productName = (product.productName || '').toLowerCase();
                    console.log("Product name:", productName); // Log product name for debugging
                    return productName.includes(searchTerm);
                });

                console.log("Filtered products:", filteredProducts);
                displayProducts(filteredProducts);
            });
        } else {
            console.error("Search input element not found.");
        }
    } catch (error) {
        console.error("Error during DOMContentLoaded event:", error);
    }
});




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

// let isStaff = false; // Flag to determine if the user is staff
// const discountRate = 0.10; // 10% staff discount

// // Function to apply the staff discount
// function applyDiscount() {
//     isStaff = true; // Set to true when discount is applied
//     displayCartItems(); // Refresh cart display with discount applied
// }

// // Function to handle the "Apply Discount" button click
// document.getElementById('apply-discount').addEventListener('click', applyDiscount);

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
                <div class="input-quantity">
                    <p>Price: RM ${item.price}</p>
                    <div class="quantity">
                        <button class="btn btn-sm btn-secondary decrease" data-product-name="${item.name}">-</button>
                        <input type="text" min="1" value="${item.quantity}" class="quantity-input">
                        <button class="btn btn-sm btn-secondary increase" data-product-name="${item.name}">+</button>
                    </div>
                </div>
                <p class="total-price-cell pb-3"></p>
                <button class="btn btn-danger delete" data-product-name="${item.name}">Delete</button>
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
    // const discountedSubtotal = isStaff ? subtotal * (1 - discountRate) : subtotal;
    // const discountAmount = subtotal - discountedSubtotal;
    const salesTax = calculateSalesTax(subtotal, taxRate);
    const totalPrice = subtotal + salesTax;

    // Update the HTML elements
    document.getElementById('Subtotal').textContent = `RM ${subtotal.toFixed(2)}`;
    document.getElementById('salestax').textContent = `RM ${salesTax.toFixed(2)}`;
    document.getElementById('totalprice').textContent = `RM ${totalPrice.toFixed(2)}`;
}

async function displayLimitedStockMessage(userId) {
    try {
        const cartItems = await getCartData(userId);

        if (!cartItems || cartItems.length === 0) {
            console.log("Cart is empty or undefined.");
            return;
        }

        const productStocks = await getProductStock();

        for (const cartItem of cartItems) {
            const productStock = productStocks.find(stock => stock.product_name === cartItem.name);
            const availableStock = productStock ? productStock.product_stock - productStock.userAddedQuantity : 0;

            if (availableStock < cartItem.quantity) {
                if (availableStock === 0) {
                    await deleteItemFromFirestore(userId, cartItem.name);
                    window.alert(`${cartItem.name} removed from cart due to ${availableStock} stock left.`);
                    location.reload();
                } else {
                    await calculateTotalPrice(userId, cartItem.name, availableStock, availableStock);
                    const message = `Stock for ${cartItem.name} for now only ${availableStock} are left.`;
                    window.alert(message);
                    location.reload();
                }
            }
        }
    } catch (error) {
        console.error("Error displaying limited stock message:", error);
    }
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

async function deleteCartItem(event) {
    event.preventDefault();

    const productName = this.getAttribute('data-product-name');
    const userId = getCurrentUserId();

    if (!userId) {
        window.alert('Please login to remove products from your cart.');
        window.location.href = "../html/login.html";
        return;
    }

    try {
        const userCartDocRef = doc(collection(db, 'carts'), userId);
        const userCartDocSnap = await getDoc(userCartDocRef);

        if (userCartDocSnap.exists()) {
            let cartItems = userCartDocSnap.data().cart || [];
            cartItems = cartItems.filter(item => item.name !== productName);

            await setDoc(userCartDocRef, { cart: cartItems }, { merge: true });
            displayCartItems();
        } else {
            console.log("Cart document does not exist.");
        }
    } catch (error) {
        console.error("Error deleting item from cart:", error);
    }
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

async function fetchUsers() {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    verifyMemberId(userList);
}
async function verifyMemberId(memberId, contact) {
    try {
        const usersCollection = collection(db, 'users');
        let querySnapshot;

        // Check if membershipId is provided and query by membershipId
        if (memberId) {
            const queryById = query(usersCollection, where('membershipId', '==', memberId));
            querySnapshot = await getDocs(queryById);
        }
        
        // If no match by membershipId or membershipId not provided, query by contact
        if ((!querySnapshot || querySnapshot.empty) && contact) {
            const queryByContact = query(usersCollection, where('contact', '==', contact));
            querySnapshot = await getDocs(queryByContact);
        }

        // Check if a match was found
        if (querySnapshot && !querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            return {
                valid: true,
                username: userData.name,
                membershipId: userData.membershipId,
                points: userData.points
            };
        }

        // Return false if neither ID nor contact found
        return { valid: false };

    } catch (error) {
        console.error('Error verifying member ID:', error);
        return { valid: false }; // In case of error
    }
}


document.getElementById('verify-form').addEventListener('click', async () => {
    const memberId = document.getElementById('member-id').value;
    const contact = document.getElementById('contact').value;
    
    // Call the verifyMemberId function with the input values
    const { valid, username, membershipId, points } = await verifyMemberId(memberId, contact);

    const resultElement = document.getElementById('result');
    const memberName = document.getElementById('member_name');
    const memberid = document.getElementById('member_id');
    const memberPoints = document.getElementById('member_points');
    
    if (valid) {
        // Update the HTML with the retrieved member information
        memberName.textContent = `Name: ${username}`;
        memberid.textContent = `Membership ID: ${membershipId}`;
        memberPoints.textContent = `Points: ${points}`;
        
        // Hide the modal and disable the form if the member is found
        document.getElementById('member').style.display = "none"; // Disable the button
        sessionStorage.setItem('memberName', username);

        document.getElementById('result').style.display= "none";
        $('#membershipModal').modal('hide');
    } else {
        // Display an error message if the member is not found
        resultElement.textContent = 'Member ID or Contact is invalid.';
        resultElement.style.color = 'red'; 
    }
});


fetchUsers();

displayCartItems();
