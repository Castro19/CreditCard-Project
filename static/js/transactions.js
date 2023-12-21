// import { current_date } from './global.js';
import { userId } from './main.js';
import { creditCardsData, handleCreditCardSelectionChange } from './creditcards.js';
export let pending_transactions = [];
export let current_date = new Date('2023-1-1');

// by assigning each card an id alongside its value that I can quickl
export async function submitReceipt(event) {
    event.preventDefault(); // Prevent the default form submit action

    // Retrieve current date and other necessary information
    const dateString = current_date.toLocaleDateString();
    const dropdown = document.getElementById('creditCardDropdown');
    const card_id = dropdown.value;
    const items = Array.from(document.querySelectorAll('input[name="items[]"]')).map(input => {
        const [itemName, itemPrice] = input.value.split(', ').map(part => part.split(': $')[1]);
        return { name: itemName, price: itemPrice };
    });

    // Construct JSON data to send
    let jsonData = {
        user: userId,
        card_id: card_id,
        current_date: dateString,
        items: items,
    };

    try {
        const response = await fetch('/transactions/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonData)
        });
        const data = await response.json();

        // Handle the response
        clearReceipt();
        if (data['available_credit'] !== undefined) {
            // creditCardsData[card_id]['available_credit'] = data['available_credit'];
            pending_transactions.push(data['pending_transactions']);
        }
        updatePendingTransactionsUI(data);
    } catch (error) {
        console.error('Error:', error);
    }
}

export function updatePendingTransactionsUI(data) {
    console.log(data);
    let tx = data.pending_transactions; // This is an object, not an array

    let pendingTransactions = document.getElementById('pendingTransactions');

    // Check and format transaction
    let type, amount;
    if (tx.amount < 0) {
        type = 'Payment';
        amount = `-$${Math.abs(tx.amount)}`;
    } else {
        type = 'Purchase';
        amount = `$${tx.amount}`;
    }
    handleCreditCardSelectionChange();
    let li = document.createElement('li');
    li.textContent = `${type} ${tx.id}: ${amount} @ date: ${tx.time}`;
    pendingTransactions.appendChild(li);
}

export async function incrementDate() {
    current_date.setDate(current_date.getDate() + 1);
    
    document.getElementById('dateDisplay').innerText = current_date.toLocaleDateString();

    console.log(pending_transactions);
    const dropdown = document.getElementById('creditCardDropdown');
    const card_id = parseInt(dropdown.value); // This now holds the card_id
    
    let jsonData = {
        user: userId,
        card_id: card_id,
        pendingTransactions: pending_transactions, 
        current_date: current_date.toLocaleDateString(), // FIX to have web date
    };

    try {
        const response = await fetch('/transactions-settle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData)
        });
        const data = await response.json();
        console.log(data);
        pending_transactions = [];
        updateUIAfterFinalization(data);
    } catch (error) {
        console.error('Error finalizing transactions:', error);
    }
}

export function updateUIAfterFinalization(data) {
    const finalizedTransactions = data['finalized_transactions'];
    console.log(pending_transactions);
    console.log(finalizedTransactions);

    let pendingTransactions = document.getElementById('pendingTransactions');
    let settledTransactions = document.getElementById('settledTransactions'); 

    pendingTransactions.innerHTML = ''; // Clear the existing list
    settledTransactions.innerHTML = ''; // Clear the existing list

    handleCreditCardSelectionChange();

    // Loop through and set all finalized transactions in correct format
    finalizedTransactions.forEach(tx => {
        let li = document.createElement('li');
        li.textContent = `Transaction ${tx.id}: $${tx.amount} finalized on date ${tx.finalized_time}`;
        settledTransactions.appendChild(li); // Append to the settled transactions list
    });
}

// Function to clear the receipt
export function clearReceipt() {
    const receiptDiv = document.getElementById("receipt");
    while (receiptDiv.firstChild) {
        receiptDiv.removeChild(receiptDiv.firstChild);
    }
}

export async function submitPayment(event) {
    // LEARN: What does this do?
    event.preventDefault(); // Prevent the default action
    let dateString = current_date.toLocaleDateString();
    // Prompt the user with the payment amount
    let paymentAmount = prompt("Enter the payment amount:", "");
    if (paymentAmount === null || paymentAmount.trim() === "") {
        console.log("No payment amount entered.");
        return; // Exit the function if no input is provided
    }
    
    // Convert the payment amount to a number and perform validations
    paymentAmount = parseFloat(paymentAmount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        alert("Invalid payment amount.");
        return; // Exit the function if the input is not a valid number
    }

    // Get the dropdown that holds the selected Card_ID
    const dropdown = document.getElementById('creditCardDropdown');
    // Get the card_id from the dropdown
    const card_id = dropdown.value; // This now holds the card_id
    console.log("Selected Card ID:", card_id);
    
    // Create a JSON object to hold the data
    let jsonData = {
        user: userId,
        card_id: card_id,
        // pendining_credit: pending_credit,
        current_date: dateString,
        payment_amount: paymentAmount,
        // available_credit: available_credit,
    };

    try {
        const response = await fetch('/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonData)
        });
        const data = await response.json();
        if (data['payable_balance'] != undefined) {
            pending_transactions.push(data['pending_transactions']);
        }
        updatePendingTransactionsUI(data);
    } catch (error) {
        console.error('Submit Payment Error:', error);
    }
    // fetch('/payments', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(jsonData)
    // })
    // .then(response => response.json())
    // .then(data => {
    //     console.log(data);
    //     updatePendingTransactionsUI(data);
    // })
    // .catch(error => {
    //     console.error('Error:', error);
    // });
}

// transactions Functions: incrementDate, updateUIAfterFinalization, submitReceipt, clearReceipt, updatePendingTransactionsUI, submitPayment
// Global Vars: pending_transactions