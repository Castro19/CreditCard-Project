# CreditCard-Project
 Full Stack Project with MySQL that explains the functionalities of a credit card
# Interactive Credit Card Simulator

## Introduction
**Welcome to the Interactive Credit Card Simulator**
Web application, created with Python Flask, MySQL, JavaScript, HTML, and CSS, offers a unique, real-time experience in managing credit card transactions. This simulator is designed to demonstrate the intricacies of credit card operations, providing users with a hands-on understanding of various transaction types and their impact on credit card balances.

## How It Works
### User Selection
Upon launching the application, users are prompted to select a profile from a MySQL database. This profile selection sets the stage for personalized interaction with the credit card interface.
![User Interface](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWxvMWthenBlY2x4MmJid2pzanhvMXMwOHAzNnliZXU0OTZtbzVuOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hM7iT47zksq0xRDxSQ/giphy.gif)

### Credit Card Interface
Once a profile is chosen, the Credit Card Interface appears. This interface is where the credit card information is placed. It accurately represents real-life credit card functionalities.
![Credit Interface](https://media.giphy.com/media/s7qxKOIjDuEAaZIiuD/giphy.gif)

### Shopping Experience
Alongside the credit card interface, users are shown items pulled from our items database. This feature simulates a shopping experience, allowing users to make purchases and see the direct effect on their virtual credit card.
![Interactive Shopping](https://media.giphy.com/media/EYELJdDvsQHH5WEyuK/giphy.gif)

### Receipt Panel
The receipt panel provides users with a view of their transactions.

## Credit Card Functionalities

### Transaction Authorization (TXN_AUTHED)

Authorize a new Transaction. This decreases the Available Credit but does not change the payable balance.

1. **Send Request:** From the client to the server using 'POST' with input as (userID, cardId, current date).
2. **Authenticate & Authorize:** Verify user's identity and authorization to perform a transaction.
   - Note: Implementation of Token-Based Authentication is pending.
3. **Validate Input:** Ensure input is valid and within acceptable limits.
4. **Record Creation:** Create a new transaction record in the database with a unique transaction ID in a Pending State.
5. **Currency Conversion:** If needed, convert local currency at a specific exchange rate.
6. **Adjust Credit:** Adjust the Available Credit by the Transaction Amount.
7. **Return Response:** Provide a response of Pending Transactions and Available Credit.

### Transaction Settlement (TXN_SETTLED)

Finalize a Transaction, increase Payable Balance, and decrease Available Credit if the settled amount differs from the authorization amount.

1. **Send Request:** From the client to the server using 'POST' with input as (userId, pending transactions).
2. **Validate Transaction:** Check transactionID exists and is in a state that can be settled.
3. **Transaction Details:** Find Initial Amount & CardID for the specific transaction.
4. **Verify Funds:** Check if sufficient credit is available.
   - Note: Implementation of a warning for low credit is pending.
5. **Adjust Credit:** Update Available Credit if initial amount differs from settled amount.
6. **Increase Balance:** Increase Payable Balance by the settled amount.
7. **Update Status:** Change the Transaction status to 'settled'.
8. **Return Response:** Provide updated Available Credit, Payable Balance, and Finalized Transactions.

### Transaction Clear (TXN_AUTH_CLEARED)

Clears an Authorized Transaction, releasing a hold on funds and increasing the Available Credit back to its previous state.

1. **Send Request:** From the client to the server using 'POST' with input as (userID, transactions being cleared).
2. **Validate Transaction:** Check transactionID exists and is in a state that can be cleared.
3. **Transaction Details:** Find amount & cardID of the specific transaction.
4. **Restore Credit:** Increase Available Credit by the Transaction amount.
5. **Update Status:** Change the Transaction Status to 'cleared'.
6. **Return Response:** Provide updated Cards' Available Credits.


### Payment Initiation (PAYMENT_INITIATED)

Represents the initiation of a payment towards the card's balance, decreasing the payable balance but not immediately affecting the available credit.

1. **Send Request:** From the client to the server using 'POST' with input as (userID, cardId, current date).
2. **Authenticate & Authorize:** Verify user's identity and authorization.
3. **Validate Input:** Ensure input is valid and within acceptable limits.
4. **Record Creation:** Create a new payment record in the database with a unique ID in a Pending State.
5. **Currency Conversion:** If needed, convert local currency at a specific exchange rate.
6. **Decrease Balance:** Decrease the Payable Balance by the Payment Amount.
7. **Return Response:** Provide a response of Pending Payments and Available Credit.

### Payment Posting (PAYMENT_POSTED)

Finalizes a payment and increases the available credit. This occurs one day after the payment is sent as pending.

1. **Send Request:** From the client to the server using 'POST' with input as (userId, pending payments).
2. **Validate Payment:** Check ID exists and is in a state that can be posted.
3. **Payment Details:** Find Payment Amount & CardID of the specific Payment.
4. **Increase Credit:** Increase Available Credit by the initial amount of Payment.
5. **Update Status:** Change the Payment status to 'posted'.
6. **Return Response:** Provide updated Available Credit, and Finalized Payments.

### Payment Cancel

Cancel a Payment before it posts, restoring the Payable Balance to its previous state.

1. **Send Request:** From the client to the server using 'POST' with input as (userID, payments being canceled).
2. **Validate Payment:** Check ID exists and is in a state that can be canceled.
3. **Payment Details:** Find amount & cardID of the specific transaction.
4. **Restore Balance:** Decrease Payable Balance by the Payment amount.
5. **Update Status:** Change the Payment Status to 'canceled'.
6. **Return Response:** Provide updated Cards' Payable Balances.



## Installation & Setup

### Prerequisites
Before you begin, ensure you have the following installed:
- Python (3.x or later)
- MySQL Server
- pip (Python package manager)

### Installing Dependencies
1. Clone the repository to your local machine.
git clone https://github.com/Castro19/CreditCard-Project.git

2. Install the required Python packages.
pip install -r requirements.txt

### Setting Up the Database
1. Start your MySQL server.
2. Create a new database for the application called `credit_card_simulator`
3. Import the initial schema located in SQL/DDL
4. Input the Values located in SQL/DDL
5. Create config.py in the root directory, as:
class Config:
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://[username]:[password]@localhost/credit_card_simulator'


### Features I will implement
1. More Credit Card Functionalities:
    AUTH Cleared
    Refunds
    Payment Cancelled
    ...
2. API Integration to Summarize how each transaction might affect the credit score

3. A more normalized structure for my database system including relational tables Receipts & ReceiptItems for extra practice
(Look at SQL/NormalizedDB.png)

