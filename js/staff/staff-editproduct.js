import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

//Function to fetch product detials
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

            const imageFileName = productData.product_image || ''; 
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
                productImageElement.style.display = 'block';
            } else {
                productImageElement.style.display = 'none'; 
            }


        } else {
            alert('No such document!');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
    }
}

function handleFileInputChange(event) {
    const file = event.target.files[0];
    const productImageElement = document.getElementById('productImage');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            if (productImageElement) {
                productImageElement.src = e.target.result;
                productImageElement.style.display = 'block'; 
            }
        };
        reader.readAsDataURL(file);
    } else {
        if (productImageElement) {
            productImageElement.style.display = 'none';
        }
    }
}

async function saveProductDetails() {
    try {
        const productCategory = document.getElementById('product_category').value;
        const productId = document.getElementById('product_id').value;
        const productType = document.getElementById('product_type').value;
        const productBarcode = document.getElementById('product_barcode').value;
        const productName = document.getElementById('product_name').value;
        const productDescription = document.getElementById('product_description').value;
        const productPrice = document.getElementById('product_price').value;
        const productStock = document.getElementById('product_stock').value;
        const productWeight = document.getElementById('product_weight').value;

        const productDocRef = doc(db, 'product', productCategory, productType, productId);

        //Check price, stock, barcode and weight format 
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

        const imageFile = document.getElementById('product_image').files[0];
        let imageName;

        if (imageFile) {
            imageName = imageFile.name;
            document.getElementById('product_image').value = '';
        } else {
            const currentSnapshot = await getDoc(productDocRef);
            const currentData = currentSnapshot.exists() ? currentSnapshot.data() : {};
            imageName = currentData.product_image;
        }

        const productBarcodeInt = parseInt(productBarcode);
        const productPriceFloat = parseFloat(productPrice);
        const productStockInt = parseInt(productStock);
        const productWeightInt = parseInt(productWeight);

        const updatedData = {
            product_image: imageName,
            product_barcode: productBarcodeInt,
            product_name: productName,
            product_description: productDescription,
            product_price: productPriceFloat,
            product_stock: productStockInt,
            product_weight: productWeightInt,
        };

        await updateDoc(productDocRef, updatedData);
        alert('Product updated successfully!');

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
