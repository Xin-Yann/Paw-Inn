import { getFirestore, collection, getDocs, doc, getDoc, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();
const categories = {
    cat: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
    dog: ['dry food', 'wet food', 'toys', 'essentials', 'treats'],
    birds: ['dry food', 'toys', 'essentials', 'treats'],
    'fish&aquatics': ['dry food', 'essentials'],
    'hamster&rabbits': ['dry food', 'toys', 'essentials', 'treats']
};

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

//Fetch all product details
async function getAllProductStock(selectedFoodType = null) {
    try {
        const productStocks = [];

        for (const [category, subcategories] of Object.entries(categories)) {
            for (const subcategory of subcategories) {
                const collectionRef = collection(db, 'product', category, subcategory);
                const snapshot = await getDocs(collectionRef);

                snapshot.forEach(doc => {
                    const productData = doc.data();
                    const productId = productData.product_id;
                    const productBarcode = productData.product_barcode;
                    const productName = productData.product_name;
                    const productStock = productData.product_stock || 0;
                    const productPrice = productData.product_price || 0;

                    const productImage = `/image/products/${category}/${subcategory}/${productData.product_image}`;

                    if (selectedFoodType && subcategory !== selectedFoodType) {
                        return; 
                    }
                
                    productStocks.push({
                        productId,
                        productBarcode,
                        productName,
                        productStock,
                        productImage,
                        productPrice,
                        category,
                        type: subcategory 
                    });
                });
            }
        }

        return productStocks;
    } catch (error) {
        console.error("Error fetching product stocks from Firestore:", error);
        return [];
    }
}

let allProductStocks = []; 

document.addEventListener('DOMContentLoaded', async () => {
    try {
        allProductStocks = await getAllProductStock();
        console.log("Initial products:", allProductStocks);
        createCategoryTabs(); 
        displayProducts(allProductStocks, Object.keys(categories)[0]); 

         // Food type dropdown
         const foodTypeSelect = document.getElementById('food-type');
         foodTypeSelect.addEventListener('change', (event) => {
             const selectedFoodType = event.target.value;
             console.log("Food type selected:", selectedFoodType);
             displayProducts(allProductStocks, null, selectedFoodType);
         });

        const searchInput = document.getElementById('search-input');
        // Search Funtion
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.trim().toLowerCase();
                console.log("Search term:", searchTerm);

                const filteredProducts = allProductStocks.filter(product => {
                    const productName = (product.productName || '').toLowerCase();
                    const productBarcode = product.productBarcode ? product.productBarcode.toString() : '';
                    return productName.includes(searchTerm) || productBarcode.includes(searchTerm);
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

function createCategoryTabs() {
    const tabList = document.getElementById('tab-list');
    tabList.innerHTML = ''; 

    let firstCategory = null;

    for (const category of Object.keys(categories)) {
        const tabItem = document.createElement('li');
        tabItem.classList.add('nav-item');
        tabItem.innerHTML = `
            <a class="nav-link" data-category="${category}" href="#">${category.charAt(0).toUpperCase() + category.slice(1)}</a>
        `;
        tabList.appendChild(tabItem);

        if (!firstCategory) {
            firstCategory = category; 
        }

        tabItem.addEventListener('click', (event) => {
            event.preventDefault();
            const selectedCategory = event.target.getAttribute('data-category');
            displayProducts(allProductStocks, selectedCategory);
            setActiveTab(selectedCategory);
        });
    }

    if (firstCategory) {
        setActiveTab(firstCategory);
        displayProducts(allProductStocks, firstCategory);
    }
}

function setActiveTab(selectedCategory) {
    const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-category') === selectedCategory) {
            tab.classList.add('active');
        }
    });
}

function createButton(text, onClickHandler) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClickHandler);
    button.classList.add('btn', 'btn-cart');
    return button;
}

function displayProducts(products, selectedCategory = null, selectedFoodType = null) {
    const productList = document.getElementById('product-container');
    productList.innerHTML = ''; 

    let filteredProducts = products;

    if (selectedCategory) {
        filteredProducts = products.filter(product => product.category === selectedCategory);
    }

    if (selectedFoodType) {
        console.log("Filtering by food type:", selectedFoodType);
        filteredProducts = filteredProducts.filter(product => product.type === selectedFoodType);

        console.log("Filtered products after food type:", filteredProducts);
    }

    if (filteredProducts.length === 0) {
        productList.innerHTML = '<p>No products found.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product');

        productCard.innerHTML = `
            <img src="${product.productImage}" alt="${product.productName}" class="product-image">
            <p class="pt-5" style="color: black;">Product Barcode: ${product.productBarcode}</p>
            <h5 class="pt-2" style="height: 120px; font-weight: bold;">${product.productName}</h5>
            <p style="color: black;">Stock: ${product.productStock}</p>
            <h5 class="pb-4">RM ${product.productPrice}</h5>
        `;

        //Add to cart button
        const addToCartButton = createButton('ADD TO CART', () => {
            addToCart(
                product.productId,
                product.productBarcode,
                product.productName,
                product.productPrice,
                product.productStock,
                product.productImage,
                product.type,
                product.category
            );
        });

        addToCartButton.classList.add('btn', 'add-cart');

        if (product.productStock <= 0) {
            productCard.classList.add('disabled');
            addToCartButton.disabled = true;
            addToCartButton.textContent = 'Out of Stock';
        } else {
            productCard.classList.remove('disabled');
            addToCartButton.disabled = false;
            addToCartButton.textContent = 'ADD TO CART';
        }

        productCard.appendChild(addToCartButton);
        productList.appendChild(productCard);
    });
}

//Fucntion to add product to cart
async function addToCart(productId, productBarcode, productName, productPrice, productStock, productImage, type, category) {
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

        let product = {
            id: productId,
            barcode: productBarcode,
            image: productImage,
            name: productName,
            price: productPrice,
            quantity: existingQuantity + 1,
            stock: productStock,
            type: type,
            category: category
        };

        const existingProductIndex = cartItems.findIndex(item => item.id === product.id);
        if (existingProductIndex > -1) {
            cartItems[existingProductIndex].quantity = product.quantity;
        } else {
            cartItems.push(product);
        }

        await setDoc(userCartDocRef, { cart: cartItems }, { merge: true });
        await saveProductToFirestore(userId, product);

        window.alert(`${productName} has been added to your cart!`);
        await displayCartItems();
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
                <div class="input-quantity">
                    <p>Price: RM ${item.price}</p>
                    <div class="quantity">
                        <button class="btn btn-sm btn-secondary decrease" data-product-name="${item.name}">-</button>
                        <input type="text" min="1" value="${item.quantity}" class="quantity-input">
                        <button class="btn btn-sm btn-secondary increase" data-product-name="${item.name}">+</button>
                    </div>
                </div>
                <p class="total-price-cell pb-3"></p>
                <button class="btn-danger delete" data-product-name="${item.name}" style="border-radius: 5px;">Delete</button>
            </div>
        `;

        cartContainer.appendChild(cartItemDiv);

        const totalPriceCell = cartItemDiv.querySelector('.total-price-cell');
        calculateTotalPrice(item).then(itemTotalPrice => {
            totalPriceCell.textContent = `RM ${itemTotalPrice.toFixed(2)}`;
            subtotal += itemTotalPrice;
            const taxRate = 0.10;
            updateTotals(subtotal, taxRate);
        });
    }

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

function calculateSalesTax(subtotal, taxRate) {
    return subtotal * taxRate;
}

async function updateTotals(subtotal, taxRate) {
    const salesTax = calculateSalesTax(subtotal, taxRate);
    const totalPrice = subtotal + salesTax;

    document.getElementById('Subtotal').textContent = `RM ${subtotal.toFixed(2)}`;
    document.getElementById('salestax').textContent = `RM ${salesTax.toFixed(2)}`;
    document.getElementById('totalprice').textContent = `RM ${totalPrice.toFixed(2)}`;
}

async function incrementQuantity(event) {
    event.preventDefault();

    const productName = this.getAttribute('data-product-name');
    const input = this.parentElement.querySelector('.quantity-input');
    let currentQuantity = parseInt(input.value, 10);
    let newQuantity = currentQuantity + 1;

    const productStocks = await getAllProductStock();
    const productStock = productStocks.find(stock => stock.productName === productName);

    if (!productStock) {
        console.error(`Product stock not found for ${productName}.`);
        return;
    }

    const availableStock = productStock.productStock;
    if (newQuantity > availableStock) {
        window.alert(`Cannot increase quantity. Only ${availableStock} left in stock.`);
        return;
    }

    input.value = newQuantity;

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

    await updateCartItemQuantity(productName, newQuantity);
    displayCartItems();
}

//Function to remove item from cart
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
            window.alert(`${productName} has been removed from your cart.`);
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

        if (memberId && typeof memberId === 'string' && memberId.length <= 1500) {
            const queryById = query(usersCollection, where('membershipId', '==', memberId));
            querySnapshot = await getDocs(queryById);
        } else {
            console.log('Invalid or No membershipId provided:', memberId);
        }

        if (querySnapshot && !querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            return {
                valid: true,
                username: userData.name,
                membershipId: userData.membershipId,
                points: userData.points
            };
        }

        return { valid: false };

    } catch (error) {
        console.error('Error verifying member ID:', error);
        return { valid: false }; 
    }
}

document.getElementById('verify-form').addEventListener('click', async () => {
    const memberId = document.getElementById('member-id').value;

    const { valid, username, membershipId, points } = await verifyMemberId(memberId);

    const resultElement = document.getElementById('result');
    const memberName = document.getElementById('member_name');
    const memberid = document.getElementById('member_id');
    const memberPoints = document.getElementById('member_points');
    
    if (valid) {
        memberName.textContent = `Name: ${username}`;
        memberid.textContent = `Membership ID: ${membershipId}`;
        memberPoints.textContent = `Points: ${points}`;
        
        document.getElementById('member').style.display = "none"; 
        document.getElementById('delete-member-detail').style.display = "block"; 
        sessionStorage.setItem('memberName', username);
        sessionStorage.setItem('membershipId', membershipId);

        document.getElementById('result').style.display= "none";
        $('#membershipModal').modal('hide');
    } else {
        resultElement.textContent = 'Member ID is invalid. Please try again.';
        resultElement.style.color = 'red'; 
    }
});

document.getElementById('delete-member-detail').addEventListener('click', () => {
    document.getElementById('member_id').textContent = '';
    document.getElementById('member_name').textContent = '';
    document.getElementById('member_points').textContent = '';
    document.getElementById('result').textContent = '';

    sessionStorage.removeItem('memberName');
    sessionStorage.removeItem('membershipId');

    document.getElementById('member').style.display = "inline-block";
    document.getElementById('delete-member-detail').style.display = "none"; 
});

async function loadMemberDetails() {
    const memberId = sessionStorage.getItem('membershipId');

    if (memberId) {
        const { valid, username, membershipId, points } = await verifyMemberId(memberId);

        if (valid) {
            document.getElementById('member_name').textContent = `Name: ${username}`;
            document.getElementById('member_id').textContent = `Membership ID: ${membershipId}`;
            document.getElementById('member_points').textContent = `Points: ${points}`;

            document.getElementById('member').style.display = "none"; 
            document.getElementById('delete-member-detail').style.display = "block";
        } else {
            console.log('Member not found in auto-check.');
        }
    }
}

window.onload = loadMemberDetails;

fetchUsers();

displayCartItems();
