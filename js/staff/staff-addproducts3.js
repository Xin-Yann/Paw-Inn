import { getFirestore, collection, setDoc, doc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

document.getElementById("add").addEventListener("click", async () => {
    try {
        const category = document.getElementById('product_category').value;
        const type = document.getElementById('product_type').value;
        const productId = document.getElementById('product_id').value;
        const productBarcode = document.getElementById('product_barcode').value;
        const productName = document.getElementById('product_name').value;
        const productDescription = document.getElementById('product_description').value;
        const productPrice = document.getElementById('product_price').value;
        const productStock = document.getElementById('product_stock').value;
        const productWeight = document.getElementById('product_weight').value;

        const price = /^\d+(\.\d{1,2})?$/;
        const stockAndBarcode = /^\d+$/;

        if (!price.test(productPrice)) {
            alert('Invalid Price. Please enter a valid number with up to two decimal places.');
            return;
        } 

        if (!stockAndBarcode.test(productStock)) {
            alert('Invalid Stock. Please enter a valid number.');
            return;
        }

        if (!stockAndBarcode.test(productBarcode)) {
            alert('Invalid Barcode. Please enter a valid number.');
            return;
        }

        if (!stockAndBarcode.test(productWeight)) {
            alert('Invalid Weight. Please enter a valid number.');
            return;
        }

        if (!productId || !productName || !productPrice || !productStock || !productWeight || !productBarcode) {
            alert('Please fill out all required fields: category, type, ID, name, price, stock, weight, barcode.');
            return;
        }

        if (category === "Select category") {
            alert('Please select a category.');
            return;
        }

        if (type === "Select type") {
            alert('Please select a type.');
            return;
        }

        // Check if the product ID already exists
        const productRef = doc(collection(db, 'product', category, type), productId);
        const productSnapshot = await getDoc(productRef);

        if (productSnapshot.exists()) {
            alert('Product ID already exists. Please choose a different ID.');
            return;
        }

        // Check if the product name already exists
        const productsQuery = query(collection(db, 'product', category, type), where("product_name", "==", productName));
        const querySnapshot = await getDocs(productsQuery);

        if (!querySnapshot.empty) {
            alert('Product name already exists. Please choose a different name.');
            return;
        }

        // Get the full path of the image
        const imagePath = document.getElementById('product_image').value;
        // Extract only the file name
        const imageName = imagePath.split('\\').pop().split('/').pop();

        // Set the document in Firestore
        await setDoc(productRef, {
            product_id: productId,
            product_image: imageName,
            product_barcode: productBarcode,
            product_name: productName,
            product_description: productDescription,
            product_price: productPrice,
            product_stock: productStock,
            product_weight: productWeight,
        });

        alert('Product added successfully!');
        window.location.reload();

        console.log('Document written with ID: ', productId);
    } catch (e) {
        console.error('Error adding document: ', e);
        alert('Error adding document: ' + e.message);
    }
});

// Add an event listener to the product category select element
document.getElementById("product_category").addEventListener("change", function () {
    updateOptions();
});

function updateOptions() {
    var categorySelect = document.getElementById("product_category");
    var typeSelect = document.getElementById("product_type");
    var selectedCategory = categorySelect.value;

    typeSelect.innerHTML = '<option disabled selected>Select type</option>';

    // Add type options based on the selected category
    switch (selectedCategory) {
        case "dog":
            addOption("dry food");
            addOption("wet food");
            addOption("essentials");
            addOption("toys");
            addOption("treats");
            break;
        case "cat":
            addOption("dry food");
            addOption("wet food");
            addOption("essentials");
            addOption("toys");
            addOption("treats");
            break;
        case "hamster&rabbits":
            addOption("dry food");
            addOption("essentials");
            addOption("toys");
            addOption("treats");
            break;
        case "birds":
            addOption("dry food");
            addOption("essentials");
            addOption("toys");
            addOption("treats");
            break;
        case "fish&aquatics":
            addOption("dry food");
            addOption("essentials");
            addOption("treats");
            break;
    }
}

function addOption(type) {
    var typeSelect = document.getElementById("product_type");
    var option = document.createElement("option");
    option.text = type;
    option.value = type;
    typeSelect.add(option);
}