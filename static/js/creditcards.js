// Credit
import { userId } from './main.js';

export let creditCardsData = [];

export function InitCreditCardDropdown(creditCards) {
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

// Load in all CreditCards from our DataBase
// Use when a transaction/payment is Made
export async function fetchCreditCards(selectedCardId = null, userId) {
    // Fetch the CreditCards based on the selected User from Backend
    console.log(userId)
    try {
        const response = await fetch(`/credit-cards/${userId}`);
        const data = await response.json();
        
        creditCardsData = data;

        let cardToShow = data[0]; // Default to the first card
        if (selectedCardId !== null) {
            cardToShow = data.find(card => card.card_id === selectedCardId) || cardToShow;
        }
        // Show the 1st card or the input card
        InitCreditLimitDisplay(cardToShow);

    } catch (error) {
        console.error('Error fetching credit card data:', error);
    }
}

// Helper Function for fetchCreditCards
function InitCreditLimitDisplay(card) {
    let creditLimit = card.credit_limit;
    let availableCredit = card.available_credit; // Assuming available credit equals credit limit for simplicity
    let payableBalance = card.payable_balance;
    
    // Update the display
    document.getElementById('totalCreditLimit').textContent = `$${creditLimit.toFixed(2)}`;
    document.getElementById('availableCredit').textContent = `$${availableCredit.toFixed(2)}`;
    document.getElementById('payableBalance').textContent = `$${payableBalance.toFixed(2)}`;
}

function UpdateCreditCardDetails(cardId) {
    const selectedCard = creditCardsData.find(card => card.card_id === cardId);

    if (selectedCard) {
        InitCreditLimitDisplay(selectedCard);
    }
}

export function handleCreditCardSelectionChange() {
    const dropdown = document.getElementById('creditCardDropdown');
    const selectedCardId = parseInt(dropdown.value);
    fetchCreditCards(selectedCardId, userId); // Pass the selected card ID
}

// creditcards functions: UpdateCreditCardDetails, fetchCreditCards, handleCreditCardSelectionChange, InitCreditLimitDisplay, InitCreditCardDropdown
// Global vars: pending_credit, pending_balance, creditCardsData