# CreditCard-Project
 Full Stack Project with MySQL that explains the functionalities of a credit card
# Interactive Credit Card Simulator

## Introduction
**Welcome to the Interactive Credit Card Simulator**
Web application, created with Python Flask, MySQL, JavaScript, HTML, and CSS, offers a unique, real-time experience in managing credit card transactions. This simulator is designed to demonstrate the intricacies of credit card operations, providing users with a hands-on understanding of various transaction types and their impact on credit card balances.

## How It Works
### User Selection
Upon launching the application, users are prompted to select a profile from a MySQL database. This profile selection sets the stage for personalized interaction with the credit card interface.
![User Interface](https://media.giphy.com/media/s7qxKOIjDuEAaZIiuD/giphy.gif)

### Credit Card Interface
Once a profile is chosen, the Credit Card Interface appears. This interface is where the credit card information is placed. It accurately represents real-life credit card functionalities.
![Credit Interface](https://media.giphy.com/media/s7qxKOIjDuEAaZIiuD/giphy.gif)

### Shopping Experience
Alongside the credit card interface, users are shown items pulled from our items database. This feature simulates a shopping experience, allowing users to make purchases and see the direct effect on their virtual credit card.
![Interactive Shopping](https://media.giphy.com/media/EYELJdDvsQHH5WEyuK/giphy.gif)

### Receipt Panel
[The receipt panel provides users with a view of their transactions.]

## Credit Card Functionalities
### Transaction Authorization (TXN_AUTHED)
[Transforms an authorized transaction into a settled one, finalizing the amount and updating both the balance and available credit.
This occurs one day after the transaction is sent as pending]

### Transaction Settlement (TXN_SETTLED)
[Represents the initiation of a payment towards the card's balance. This decreases the payable balance but doesn't immediately affect the available credit.]

### Payment Initiation (PAYMENT_INITIATED)
[Represents the initiation of a payment towards the card's balance. This decreases the payable balance but doesn't immediately affect the available credit.]

### Payment Posting (PAYMENT_POSTED)
[Finalizes a payment, reflecting the decrease in the card's balance and the increase in available credit.
This occurs one day after the Payment  is sent as pending]

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


