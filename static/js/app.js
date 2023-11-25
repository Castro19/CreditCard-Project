window.onload = function() {
    fetch('/reset_database')
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
};

let pending_transactions_dict = {};
let currentDate = new Date('2023-1-1');

let pending_credit= 0; // Submit Payment
let pending_balance = 0; // Submit Receipt

function incrementDate() {
    currentDate.setDate(currentDate.getDate() + 1);
    
    document.getElementById('dateDisplay').innerText = currentDate.toLocaleDateString();


    console.log(currentDate)
    // Get the selected Card_ID
    const dropdown = document.getElementById('creditCardDropdown');
    const card_id = dropdown.value; // This now holds the card_id
    
    // Create a JSON object to hold the data
    let jsonData = {
        user: userId,
        card_id: card_id,
        pending_balance: pending_balance,
        pending_credit: pending_credit,
        current_date: currentDate.toLocaleDateString(),
    }
    pending_balance = 0 
    pending_credit = 0
    // Fetch call to finalize transactions
    fetch('/finalize_transactions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)

    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        updateUIAfterFinalization(data);
    })

    .catch(error => console.error('Error:', error));
}

function updateUIAfterFinalization(data) {
    finalizedTransactions = data['finalized_transactions']

    console.log(finalizedTransactions);
    let pendingTransactions = document.getElementById('pendingTransactions');
    let settledTransactions = document.getElementById('settledTransactions');  // Correct element ID
    document.getElementById('availableCredit').textContent = '$' + data.available_credit;
    pendingTransactions.innerHTML = ''; // Clear the existing list of pending transactions
    document.getElementById('payableBalance').textContent = '$' + data.payable_balance;

    pending_credit= 0; // Submit Payment
    pending_balance = 0; // Submit Receipt

    data = {}
    console.log(pending_credit);
    console.log(`pending BALANCE: ${pending_balance}`);


    finalizedTransactions.forEach(tx => {
        let li = document.createElement('li');
        li.textContent = `Transaction ${tx.id}: $${tx.amount} finalized on date ${tx.finalized_time}`;  // Use the finalized_time
        settledTransactions.appendChild(li);  // Append to the settled transactions list
    });
}

document.getElementById('incrementDateButton').addEventListener('click', incrementDate);

let userId; // Be a Global Variable
function selectUser() {
    // Hide user selection section
    document.querySelector('.user-selection').style.display = 'none';

    // Get the container-Interface
    const container_Interface = document.querySelector('.container-Interface');
    const container_items = document.querySelector('.container-items');
    const receipt_container = document.querySelector('.receipt-container');
    const date_container = document.querySelector('.date-container');

    // Set a slight delay before showing the container-Interface for a smoother transition
    setTimeout(() => {
        date_container.classList.add('visible');
        container_Interface.classList.add('visible');
        receipt_container.classList.add('visible');
        container_items.classList.add('visible');
        console.log("Class 'visible' added:", container_Interface.classList.contains('visible')); // This will check if the class 'visible' is indeed added.
        container_Interface.scrollIntoView({ behavior: 'smooth' });
        container_items.scrollIntoView({ behavior: 'smooth' });
        receipt_container.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Optionally, handle the selected user's data
    console.log("Selected User: " + userId);
}

// Define a global variable to store the credit score
let globalCreditScore = 0;

async function fetchCreditScore() {
    try {
        const response = await fetch(`/get-credit-score/${userId}`);
        const data = await response.json();

        if (data.creditScore) {
            console.log('Credit Score:', data.creditScore);
            globalCreditScore = data.creditScore;
            document.getElementById('CreditScore').textContent = data.creditScore;
            document.getElementById('userImage').src = `static/img/profiles/${userId}.JPG`;
            document.getElementById('userImage').alt = `User ${userId}`;
        } else if (data.error) {
            console.error(data.error);
            document.getElementById('CreditScore').textContent = 'Error';
        }
    } catch (error) {
        console.error('Error fetching credit score:', error);
        document.getElementById('CreditScore').textContent = 'Error';
    }
}

function UpdateCreditCardDetails(cardId) {
    // Assuming `creditCardsData` is an array of card details including card_id
    const selectedCard = creditCardsData.find(card => card.card_id === cardId);

    if (selectedCard) {
        console.log(userId, cardId)
    }
}

// This assumes `creditCardsData` is stored after fetching from the backend
let creditCardsData = [];

// Modify fetchCreditCards to always update UI with the latest data
async function fetchCreditCards(selectedCardId = null) {
    try {
        const response = await fetch(`/get-credit-cards/${userId}`);
        const data = await response.json();

        creditCardsData = data;

        let cardToShow = data[0]; // Default to the first card
        if (selectedCardId !== null) {
            cardToShow = data.find(card => card.card_id === selectedCardId) || cardToShow;
        }
        
        InitCreditLimitDisplay(cardToShow);
    } catch (error) {
        console.error('Error fetching credit card data:', error);
    }
}

function handleCreditCardSelectionChange() {
    const dropdown = document.getElementById('creditCardDropdown');
    const selectedCardId = parseInt(dropdown.value);
    fetchCreditCards(selectedCardId); // Pass the selected card ID
}
function InitCreditLimitDisplay(card) {
    let creditLimit = card.credit_limit;
    let availableCredit = card.available_credit; // Assuming available credit equals credit limit for simplicity
    let payableBalance = card.payable_balance;
    
    // Update the display
    document.getElementById('totalCreditLimit').textContent = `$${creditLimit.toFixed(2)}`;
    document.getElementById('availableCredit').textContent = `$${availableCredit.toFixed(2)}`;
    document.getElementById('payableBalance').textContent = `$${payableBalance.toFixed(2)}`;
}

// function UpdateCreditLimitDisplay(AvailableCredit, payableBalance) {
//         // Update the display
//         console.log(AvailableCredit);
//         console.log(payableBalance)
//         document.getElementById('availableCredit').textContent = `$${AvailableCredit}`;
//         document.getElementById('payableBalance').textContent = `$${payableBalance}`;
// }

function InitCreditCardDropdown(creditCards) {
    const dropdown = document.getElementById('creditCardDropdown');
    dropdown.innerHTML = ''; // Clear existing options

    creditCards.forEach(card => {
        const cardNumberStr = new BigNumber(card.card_number).toFixed(0);
        const lastFourDigits = cardNumberStr.slice(-4);
        const option = document.createElement('option');
        option.value = card.card_id; // Use card_id as the value
        option.textContent = `Card ending in ${lastFourDigits}`;
        dropdown.appendChild(option);
    });

    // Set up the event listener for the dropdown change
    dropdown.addEventListener('change', handleCreditCardSelectionChange);

    // Update details for the first card initially
    if (creditCards.length > 0) {
        UpdateCreditCardDetails(creditCards[0].card_id);
    }
}

async function loadItems() {
    try {
        const response = await fetch('/get-items');
        const items = await response.json();

        const container = document.getElementById('dynamic-items');
        container.innerHTML = '';  // Clear existing content

        items.forEach((item, index) => {
            container.innerHTML += `
                <div class="item" id="item${index + 1}" onclick="selectItem(this)" data-name="${item.name}" data-price="${item.price}">
                    <img src="static/img/items/item${index + 1}.png" alt="Item ${index + 1}">
                    <p>${item.name}</p>
                    <p>Price: $${item.price}</p>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}


async function handleUserSelection(userId_input) {
    userId = userId_input
    selectUser();
    await fetchCreditScore();
    await fetchCreditCards();
    InitCreditCardDropdown(creditCardsData);
    await loadItems();
}


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

function submitReceipt(event) {
    event.preventDefault(); // Prevent the default form submit action & handle submission asynchronously

    // Get The Current Date:
    current_date = document.getElementById('dateDisplay').innerText 

    console.log(current_date)
    console.log(creditCardsData)
    // Get the selected Card_ID
    const dropdown = document.getElementById('creditCardDropdown');
    const card_id = dropdown.value; // This now holds the card_id
    console.log("Selected Card ID:", card_id);

    
    let items = [];
    let total_credit_limit = document.getElementById('totalCreditLimit').textContent.replace('$', '');
    let available_credit = document.getElementById('availableCredit').textContent.replace('$', '');
    let payable_balance = document.getElementById('payableBalance').textContent.replace('$', '');

    // console.log(totalCreditLimit)
    // console.log(available_credit)
    // console.log(payable_balance)

    document.querySelectorAll('input[name="items[]"]').forEach(input => {
        let itemData = input.value.split(', ');
        let item = {
            name: itemData[0].split(': ')[1],
            price: itemData[1].split(': $')[1]
        };
        items.push(item);
    });

    let jsonData = {
        user: userId,
        card_id: card_id,
        pending_balance: pending_balance,
        current_date: current_date,
        items: items,
        available_credit: available_credit,
        total_credit_limit: total_credit_limit,
        payable_balance: payable_balance
    };
    
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        clearReceipt();
        if (data['available_credit'] !== undefined) {
            console.log("YEEEEEEE");
            creditCardsData[card_id]['available_credit'] = data['available_credit'];
            pending_balance = data['pending_balance'];
            console.log(`test: ${pending_balance}`);
        }
        updatePendingTransactionsUI(data);
        
    })    
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to clear the receipt
function clearReceipt() {

    const receiptDiv = document.getElementById("receipt");
    while (receiptDiv.firstChild) {
        receiptDiv.removeChild(receiptDiv.firstChild);
    }
}

function updatePendingTransactionsUI(data) {
    console.log(data)

    let tx = data.pending_transactions; // This is an object, not an array
    let li = document.createElement('li');

    // Append to the existing list of pending transactions
    let pendingTransactions = document.getElementById('pendingTransactions');

    // Payment:
    if (tx.amount < 0) {
        type = 'Payment';
        amount = `-$${Math.abs(tx.amount)}`;
        document.getElementById('payableBalance').textContent = '$' + data.payable_balance;
        pending_credit = data['pending_credit'];
    }
    else {
        type = 'Purchase'
        amount = `$${tx.amount}`
        document.getElementById('availableCredit').textContent = '$' + data.available_credit;
        pending_balance = data['pending_balance'];
    }
    li.textContent = `${type} ${tx.id}: ${amount} @ date: ${tx.time}`;
    pendingTransactions.appendChild(li);
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    console.log(form)
    form.addEventListener('submit', submitReceipt); // Attach the submitReceipt function here
});

document.getElementById('submitPayment').addEventListener('click', submitPayment);

function submitPayment(event) {
    event.preventDefault(); // Prevent the default action
    current_date = document.getElementById('dateDisplay').innerText 

    let paymentAmount = prompt("Enter the payment amount:", "");
    if (paymentAmount === null || paymentAmount.trim() === "") {
        console.log("No payment amount entered.");
        return; // Exit the function if no input is provided
    }

    // Convert the payment amount to a number and perform validations if necessary
    paymentAmount = parseFloat(paymentAmount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        alert("Invalid payment amount.");
        return; // Exit the function if the input is not a valid number
    }
     // Get the selected Card_ID
    const dropdown = document.getElementById('creditCardDropdown');
    const card_id = dropdown.value; // This now holds the card_id
    console.log("Selected Card ID:", card_id);

    let available_credit = document.getElementById('availableCredit').textContent.replace('$', '');
    let payable_balance = document.getElementById('payableBalance').textContent.replace('$', '');

    // Create a JSON object to hold the data
    let jsonData = {
        user: userId,
        card_id: card_id,
        pendining_credit: pending_credit,
        current_date: current_date,
        payment_amount: paymentAmount,
        available_credit: available_credit,
        payable_balance: payable_balance,
    };

    fetch('/submit_payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        updatePendingTransactionsUI(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// function updateUIAfterPayment(data) {
//     document.getElementById('availableCredit').textContent = '$' + data.available_credit.toFixed(2);
//     document.getElementById('payableBalance').textContent = '$' + data.payable_balance.toFixed(2);

//     let tx = data.pending_transactions; // This is an object, not an array
//     let li = document.createElement('li');

//     // Append to the existing list of pending transactions
//     let pendingTransactions = document.getElementById('pendingTransactions');

//     // Assuming tx.time is a string in the format 'YYYY-MM-DD'
//     li.textContent = `Payment ${tx.id}: -$${Math.abs(tx.amount).toFixed(2)} @ date: ${tx.time}`;
//     pendingTransactions.appendChild(li);
// }

