import { getFirestore, collection, setDoc, doc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

document.getElementById("add").addEventListener("click", async () => {
    try {
        const category = document.getElementById('product_category').value;
        const type = document.getElementById('product_type').value;
        const productId = document.getElementById('product_id').value;
        const productBarcode = parseInt(document.getElementById('product_barcode').value);
        const productName = document.getElementById('product_name').value;
        const productDescription = document.getElementById('product_description').value;
        const productPrice = parseFloat(document.getElementById('product_price').value);
        const productStock = parseInt(document.getElementById('product_stock').value);
        const productWeight = parseInt(document.getElementById('product_weight').value);

        const price = /^\d+(\.\d{1,2})?$/;
        const stockAndBarcode = /^\d+$/;

         // Check if required fields are filled
        if (!productId || !productName || !productPrice || !productStock || !productWeight || !productBarcode) {
            alert('Please fill out all required fields: category, type, ID, name, price, stock, weight, barcode.');
            return;
        }

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

        if (category === "Select category") {
            alert('Please select a category.');
            return;
        }

        if (type === "Select type") {
            alert('Please select a type.');
            return;
        }

        const productRef = doc(collection(db, 'product', category, type), productId);
        const productSnapshot = await getDoc(productRef);

        //check product id is exists
        if (productSnapshot.exists()) {
            alert('Product ID already exists. Please choose a different ID.');
            return;
        }

        const productsQuery = query(collection(db, 'product', category, type), where("product_name", "==", productName));
        const querySnapshot = await getDocs(productsQuery);

        //check product name is exists
        if (!querySnapshot.empty) {
            alert('Product name already exists. Please choose a different name.');
            return;
        }

        const imagePath = document.getElementById('product_image').value;
        const imageName = imagePath.split('\\').pop().split('/').pop();

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

document.getElementById("product_category").addEventListener("change", function () {
    updateOptions();
});

function updateOptions() {
    var categorySelect = document.getElementById("product_category");
    var typeSelect = document.getElementById("product_type");
    var selectedCategory = categorySelect.value;

    typeSelect.innerHTML = '<option disabled selected>Select type</option>';

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