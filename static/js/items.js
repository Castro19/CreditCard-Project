// items
function selectItem(itemElement) {
    // Retrieve item details from data attributes
    const itemName = itemElement.getAttribute('data-name');
    const itemPrice = itemElement.getAttribute('data-price');

    // Create a new div element for the item
    let itemDiv = document.createElement("div");
    itemDiv.textContent = `${itemName} - $${itemPrice}`;

    // Create a hidden input element to include this item in the form submission
    let inputElement = document.createElement("input");
    inputElement.type = "hidden";
    inputElement.name = "items[]";
    inputElement.value = `Item: ${itemName}, Price: $${itemPrice}`;

    // Append the item and the hidden input to the receipt div
    const receiptDiv = document.getElementById("receipt");
    receiptDiv.appendChild(itemDiv);
    receiptDiv.appendChild(inputElement);
}

export async function loadItems() {
    try {
        const response = await fetch('/items');
        const items = await response.json();

        const container = document.getElementById('dynamic-items');
        container.innerHTML = '';  // Clear existing content

        items.forEach((item, index) => {
            // Create item element
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.id = `item${index + 1}`;
            itemElement.setAttribute('data-name', item.name);
            itemElement.setAttribute('data-price', item.price);
            itemElement.innerHTML = `
                <img src="static/img/items/item${index + 1}.png" alt="Item ${index + 1}">
                <p>${item.name}</p>
                <p>Price: $${item.price}</p>
            `;
            container.appendChild(itemElement);

            // Attach event listener
            itemElement.addEventListener('click', () => selectItem(itemElement));
        });
    } catch (error) {
        console.error('Error:', error);
    }
}
// items functions: loadItems, selectItem