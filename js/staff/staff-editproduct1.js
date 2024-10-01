import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

// Function to get query parameter by name
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to fetch and display product details
async function fetchAndDisplayProductDetails() {
    try {
        const productCategory = getQueryParam('category');
        const productId = getQueryParam('id');
        const productType = decodeURIComponent(getQueryParam('type'));

        if (!productId || !productType || !productCategory) {
            alert('No product category, id or type found in URL');
            return;
        }

        const productDocRef = doc(db, 'product', productCategory, productType, productId);
        const productSnapshot = await getDoc(productDocRef);

        if (productSnapshot.exists()) {
            const productData = productSnapshot.data();
            document.getElementById('product_category').value = productCategory;
            document.getElementById('product_type').value = productType;
            document.getElementById('product_id').value = productId;
            document.getElementById('product_barcode').value = productData.product_barcode || '';
            document.getElementById('product_name').value = productData.product_name || '';
            document.getElementById('product_description').value = productData.product_description || '';
            document.getElementById('product_price').value = productData.product_price || '';
            document.getElementById('product_stock').value = productData.product_stock || '';
            document.getElementById('product_weight').value = productData.product_weight || '';

            // Construct the image URL
            const imageFileName = productData.product_image || ''; // Assuming `product_image` holds the file name
            const imageUrl = `/image/products/${productCategory}/${productType}/${imageFileName}`;

            let productImageElement = document.getElementById('productImage');

            if (!productImageElement) {
                productImageElement = document.createElement('img');
                productImageElement.id = 'productImage';
                productImageElement.style.height = 'auto';
                productImageElement.style.display = 'block';
                document.querySelector('.product-details').appendChild(productImageElement);
            }

            if (imageFileName) {
                productImageElement.src = imageUrl;
                productImageElement.style.display = 'block'; // Ensure the image is displayed
            } else {
                productImageElement.style.display = 'none'; // Hide the image if no file name is present
            }


        } else {
            alert('No such document!');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
    }
}

// Function to handle file input change and preview the image
function handleFileInputChange(event) {
    const file = event.target.files[0];
    const productImageElement = document.getElementById('productImage');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (productImageElement) {
                productImageElement.src = e.target.result;
                productImageElement.style.display = 'block'; // Display the new image
            }
        };
        reader.readAsDataURL(file);
    } else {
        // Hide the image if no file is selected
        if (productImageElement) {
            productImageElement.style.display = 'none';
        }
    }
}

// Function to save edited product details
async function saveProductDetails() {
    try {
        const productCategory = document.getElementById('product_category').value;
        const productId = document.getElementById('product_id').value;
        const productType = document.getElementById('product_type').value;
        const productBarcode = document.getElementById('product_barcode').value;
        const productName = document.getElementById('product_name').value;
        const productDescription = document.getElementById('product_description').value;
        const productPrice = document.getElementById('product_price').value;
        const productStock = parseInt(document.getElementById('product_stock').value);
        const productWeight = document.getElementById('product_weight').value;

        const productDocRef = doc(db, 'product', productCategory, productType, productId);

        const price = /^\d+(\.\d{1,2})?$/;
        const stockAndBarcode = /^\d+$/;

        // Check if required fields are filled
        if (!productName || !productPrice || !productStock || !productWeight || !productBarcode) {
            alert('Please fill out all required fields: name, price, stock, weight.');
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

        // Check if the file input actually has a file
        const imageFile = document.getElementById('product_image').files[0];
        let imageName;

        if (imageFile) {
            imageName = imageFile.name; // Get the file name without uploading
            document.getElementById('product_image').value = ''; // Clear file input
        } else {
            // Fetch the existing data to potentially get the existing image
            const currentSnapshot = await getDoc(productDocRef);
            const currentData = currentSnapshot.exists() ? currentSnapshot.data() : {};
            imageName = currentData.product_image; // Retain the existing image name if no new file is uploaded
        }

        const updatedData = {
            product_image: imageName,
            product_barcode: productBarcode,
            product_name: productName,
            product_description: productDescription,
            product_price: productPrice,
            product_stock: productStock,
            product_weight: productWeight,
        };

        await updateDoc(productDocRef, updatedData);
        alert('Product updated successfully!');

        // Redirect to the appropriate category page
        switch (productCategory) {
            case 'dog':
                window.location.href = encodeURI('../staff/staff-productdog.html');
                break;
            case 'cat':
                window.location.href = encodeURI('../staff/staff-productcat.html');
                break;
            case 'hamster&rabbits':
                window.location.href = encodeURI('../staff/staff-producthamster&rabbits.html');
                break;
            case 'birds':
                window.location.href = encodeURI('../staff/staff-productbirds.html');
                break;
            case 'fish&aquatics':
                window.location.href = encodeURI('../staff/staff-productfish&aquatics.html');
                break;
            default:
                window.location.href = '../staff/staff-home.html';
                break;
        }

    } catch (error) {
        console.error('Error saving product details:', error);
        alert('Error saving product details: ' + error.message);
    }
}

document.getElementById('edit').addEventListener('click', saveProductDetails);
document.getElementById('product_image').addEventListener('change', handleFileInputChange);

document.addEventListener('DOMContentLoaded', fetchAndDisplayProductDetails);
