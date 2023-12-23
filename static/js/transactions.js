// import { current_date } from './global.js';
import { userId } from './main.js';
import { handleCreditCardSelectionChange } from './creditcards.js';
let pending_transactions = [];
let current_date = new Date('2023-1-1');

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

function updatePendingTransactionsUI(data) {
    console.log(data);
    let transactions = data.pending_transactions; // Can be an object or an array
    let pendingTransactionsElement = document.getElementById('pendingTransactions');

    // Function to create and append a transaction item
    function appendTransaction(tx) {
        let type = parseFloat(tx.amount) < 0 ? 'Payment' : 'Purchase';
        let amount = parseFloat(tx.amount) < 0 ? `-$${Math.abs(parseFloat(tx.amount))}` : `$${tx.amount}`;

        let li = document.createElement('li');
        li.id = `transaction-${tx.id}`; // Assign unique ID based on transaction ID
        li.textContent = `${type} ${tx.id}: ${amount} @ date: ${tx.time}`;
        pendingTransactionsElement.appendChild(li);
    }

    // If transactions is a single object, convert it to an array
    if (!Array.isArray(transactions)) {
        transactions = [transactions];
    }

    // Append each transaction to the UI
    transactions.forEach(appendTransaction);

    handleCreditCardSelectionChange();
}

export async function incrementDate() {
    current_date.setDate(current_date.getDate() + 1);
    
    document.getElementById('dateDisplay').innerText = current_date.toLocaleDateString();

    // console.log(pending_transactions);

    let jsonData = {
        user: userId,
        pendingTransactions: pending_transactions, 
        current_date: current_date.toLocaleDateString(), 
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

function updateUIAfterFinalization(data) {
    const finalizedTransactions = data['finalized_transactions'];
    console.log(pending_transactions);
    console.log(finalizedTransactions);

    let pendingTransactions = document.getElementById('pendingTransactions');
    let settledTransactions = document.getElementById('settledTransactions'); 

    pendingTransactions.innerHTML = ''; // Clear the existing list
    settledTransactions.innerHTML = ''; // Clear the existing list

    handleCreditCardSelectionChange();
    console.log(finalizedTransactions)
    // Loop through and set all finalized transactions in correct format
    finalizedTransactions.forEach(tx => {
        let li = document.createElement('li');
        if (tx.amount >= 0) {
            var type = "Transaction";
        } else {
            var type = "Payment";
        }
        li.textContent = `${type} ${tx.id}: $${tx.amount} finalized on date ${tx.finalized_time}`;
        settledTransactions.appendChild(li); // Append to the settled transactions list
    });
}

// Function to clear the receipt
function clearReceipt() {
    const receiptDiv = document.getElementById("receipt");
    while (receiptDiv.firstChild) {
        receiptDiv.removeChild(receiptDiv.firstChild);
    }
}

export async function submitPayment(event) {
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
        current_date: dateString,
        payment_amount: paymentAmount,
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
}

export async function cancelPayment(event) {
    console.log(pending_transactions);

    const payments = pending_transactions.filter(item => parseFloat(item.amount) < 0);

    console.log(payments);
    CancelPaymentPopups(payments, async function(cancel_payments) {
        console.log(cancel_payments);
        if (cancel_payments.length > 0) {
            await cancelPaymentsAPI(cancel_payments);
            // Remove selected payments from pending_transactions
            removeSelectedPayments(cancel_payments);
        }
        
    });

    function CancelPaymentPopups(data, callback) {
        var buttonsContainer = document.getElementById('buttonsContainer');
        buttonsContainer.innerHTML = ''; // Clear existing content
        var cancel_payments = [];
    
        // Creating the Pending Payment Buttons
        data.forEach(item => {
            var button = document.createElement('button');
            button.textContent = `ID: ${item.id}, Amount: ${item.amount}`;
            button.onclick = function() {
                console.log(`Button for ID ${item.id} clicked`);
                this.classList.add('clicked-style'); // Add the class on click
                if (!cancel_payments.includes(item)) {
                    cancel_payments.push(item);
                }
            };
            buttonsContainer.appendChild(button);
        });
    
        // Creating the Confirm Button
        var confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';
        confirmButton.onclick = function() {
            popupWindow.style.display = 'none';
            callback(cancel_payments);
        };
        buttonsContainer.appendChild(confirmButton);
    
        var popupWindow = document.getElementById('popupWindow');
    
        // Open the popup
        popupWindow.style.display = 'block';
    
        // Close button event handler
        var closeBtn = document.getElementsByClassName('close-btn')[0];
        closeBtn.onclick = function() {
            popupWindow.style.display = 'none';
        };
    
        // Click outside to close
        window.onclick = function(event) {
            if (event.target === popupWindow) {
                popupWindow.style.display = 'none';
            }
        };
    }
}

// Function to remove selected payments from pending_transactions
function removeSelectedPayments(selectedPayments) {
    const pendingTransactionsElement = document.getElementById('pendingTransactions');

    selectedPayments.forEach(payment => {
        const index = pending_transactions.findIndex(p => p.id === payment.id);
        if (index !== -1) {
            // Remove from pending_transactions array
            pending_transactions.splice(index, 1);

            // Remove from UI
            const elementToRemove = document.getElementById(`transaction-${payment.id}`);
            if (elementToRemove) {
                pendingTransactionsElement.removeChild(elementToRemove);
            }
        }
    });
    console.log('Updated pending_transactions:', pending_transactions);
    handleCreditCardSelectionChange();

}


async function cancelPaymentsAPI(cancel_payments) {
    current_date.getDate()
    console.log(current_date);
    let jsonData = {
        user: userId,
        cancel_payments: cancel_payments,
        current_date: current_date.toLocaleDateString()
    };
    
    try {
        const response = await fetch('/cancel-payment', {
            method: 'POST',
            headers :{'Content-Type': 'application/json' },
            body: JSON.stringify(jsonData)
        });
        const data = await response.json();
        console.log(data)
    } catch (error) {
        console.error('Cancel Payment Error:', error);
    }
}
// transactions Functions: incrementDate, updateUIAfterFinalization, submitReceipt, clearReceipt, updatePendingTransactionsUI, submitPayment
// Global Vars: pending_transactions