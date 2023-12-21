// User
// Define a global variable to store the credit score
let globalCreditScore = 0;

export function selectUser(userId) {
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
// Fetch User Data and showcase it
export async function fetchCreditScore(userId) {
    try {
        const response = await fetch(`/credit-score/${userId}`);
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


// User Functions: selectUser, fetchCreditScore, handleUserSelection
// Global Vars: globalCreditScore 
