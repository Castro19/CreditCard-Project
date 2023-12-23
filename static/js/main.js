// import { userId } from './global.js';
import { selectUser, fetchCreditScore } from './user.js';
import { fetchCreditCards, InitCreditCardDropdown, creditCardsData } from './creditcards.js';
import { loadItems } from './items.js';
import { incrementDate, submitReceipt, submitPayment, cancelItem } from './transactions.js';
export let userId;

// When the Page Reloads, Reset the DataBase to gain new values
window.onload = function() {
    fetch('/reset_database')
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.profile').forEach(profile => {
        profile.addEventListener('click', (event) => {
            let selectedUserId = profile.getAttribute('data-user-id');
            userId = selectedUserId; // Update the global userId
            console.log(userId);
            handleUserSelection(selectedUserId);
        });
    });
});

async function handleUserSelection(userId) {
    console.log(userId)
    try {
        selectUser(userId);
        await fetchCreditScore(userId); 
        await fetchCreditCards(null, userId); 
        InitCreditCardDropdown(creditCardsData); 
        await loadItems(); 
    } catch (error) {
        console.error('Error in handleUserSelection:', error);
    }
}

document.getElementById('incrementDateButton').addEventListener('click', incrementDate);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', submitReceipt);
    }
});

document.getElementById('submitPayment').addEventListener('click', submitPayment);

document.getElementById('cancelPayment').addEventListener('click', cancelItem);

document.getElementById('clearAuth').addEventListener('click', cancelItem);



// The incrementDate, submitReceipt, and submitPayment functions will now be imported from the respective modules.

// <button id="cancelPayment" type="cancel">Cancel Payment</button>
