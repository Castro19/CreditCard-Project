# app/routes.py
from app import app, db
from flask import render_template, request, jsonify
from .models import Users, CreditCard, Item, Transaction
import requests
from sqlalchemy import inspect
import decimal
from datetime import datetime
# from app.helpers.pomelo import summarize


@app.route('/')
def home():
    return render_template('index.html')

# Get the Users from the DataBase
@app.route('/users', methods=['GET'])
def get_users():
    users = Users.query.all()
    users_data = []

    for user in users:
        users_data.append({
            'user_id': user.user_id,
            'name': user.name,
            'age': user.age
        })
    
    return jsonify(users_data)

# Get the Credit Score from the User
@app.route('/credit-score/<int:user_id>', methods=['GET'])
def get_credit_score(user_id):
    print(f"Fetching credit score for user ID: {user_id}")
    user = Users.query.filter_by(user_id=user_id).first()
    if user:
        print(f"Found user: {user}, Credit Score: {user.current_credit_score}")
        return jsonify({'creditScore': user.current_credit_score})
    else:
        print("User not found")
        return jsonify({'error': 'User not found'}), 404


@app.route('/credit-cards/<int:user_id>', methods=['GET'])
def get_credit_cards(user_id):
    credit_cards = CreditCard.query.filter_by(user_id=user_id).all()
    credit_card_data = [
        {
            "card_id": card.card_id,
            "card_number": str(card.card_number),  # Converted to string for JSON serialization
            "credit_limit": float(card.credit_limit),  # Converted to float for JSON serialization
            "available_credit": float(card.available_credit),  # Converted to float for JSON serialization
            "payable_balance": float(card.balance)
        }
        for card in credit_cards
    ]
    print(credit_card_data)
    return jsonify(credit_card_data)

@app.route('/items', methods=['GET'])
def get_items():
    print(f"Fetching Items")
    items = Item.query.all()
    items_list = []
    
    for item in items:
        items_list.append({
            'name': item.name,
            'price': item.price
        })
    print(items_list)
    return jsonify(items_list)
    
@app.route('/transactions/authorize', methods=['POST'])
def transactions_authorize():
    print("Submit route was called.")
    data = request.json
    user_id = data.get('user', 0)
    card_id = data.get('card_id', 0)
    current_date_str = data.get('current_date', '')
    # Convert the string to a datetime object
    current_date_obj = datetime.strptime(current_date_str, '%m/%d/%Y')

    # Format to a date-only string (YYYY-MM-DD format)
    date_only_str = current_date_obj.strftime('%Y-%m-%d')

    items = data.get('items', [])
    
    total = sum(decimal.Decimal(item['price']) for item in items)
    print(f"Total Transaction Amount: {total}")

    # Update the credit card records in the database
    try:
        credit_card = CreditCard.query.filter_by(card_id=card_id, user_id=user_id).first()
        if credit_card:
            credit_card.available_credit -= total  # Update the available credit
            db.session.commit()
        else:
            return jsonify({"error": "Credit card not found"}), 404
    except Exception as e:
        db.session.rollback()
        print("An error occurred:", str(e))
        return jsonify({"error": str(e)}), 500

    # Create a new Pending Transaction for Authorization
    try:
        new_transaction = Transaction(
            card_id=card_id,
            amount=decimal.Decimal(total),
            initial_time=current_date_obj,  # Use the datetime object here
            status='pending'
            )
        db.session.add(new_transaction)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("An error occurred while inserting transactions:", str(e))
        return jsonify({"error": str(e)}), 500

    # Retrieve updated pending transactions
    pending_transactions = {
        "id": new_transaction.transaction_id, 
        "amount": new_transaction.amount, 
        "time": date_only_str
    }

    updated_info = {
        "card_id": card_id,
        "available_credit": credit_card.available_credit,
        "pending_transactions": pending_transactions
    }

    print("HERE:", str(updated_info))
    return jsonify(updated_info)

@app.route('/payments', methods=['POST'])
def submit_payment():
    data = request.json
    user_id = data.get('user', 0)
    card_id = data.get('card_id', 0)
    current_date_str = data.get('current_date', '')
    # Convert the string to a datetime object
    current_date_obj = datetime.strptime(current_date_str, '%m/%d/%Y')
    date_only_str = current_date_obj.strftime('%Y-%m-%d')

    print(date_only_str)
    payment_amount = float(data.get('payment_amount', 0)) * -1 # Negative Num

    # Update the credit card records in the database
    try:
        credit_card = CreditCard.query.filter_by(card_id=card_id, user_id=user_id).first()
        if credit_card:
            credit_card.balance += decimal.Decimal(payment_amount) # Update the paybale balance, but the available credit takes time to load.
            db.session.commit()
        else:
            return jsonify({"error": "Credit card not found"}), 404
    except Exception as e:
        db.session.rollback()
        print("An error occurred:", str(e))
        return jsonify({"error": str(e)}), 500       
    
    # Pending transactions data
    try:
        new_transaction = Transaction(
            card_id=card_id,
            amount=decimal.Decimal(payment_amount),
            initial_time=date_only_str,  # Use the datetime object here
            status='pending'
            )
        db.session.add(new_transaction)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("An error occurred while inserting transactions:", str(e))
        return jsonify({"error": str(e)}), 500

    formatted_transactions = {
        "id": new_transaction.transaction_id,
        "amount": new_transaction.amount, 
        "time": date_only_str
    }
    
    updated_info = {
        "card_id": card_id,
        "payable_balance": credit_card.balance,
        "pending_transactions": formatted_transactions
    }
    
    print("HERE:", str(updated_info))

    return jsonify(updated_info)

@app.route('/transactions-settle', methods=['POST'])
def finalize_transactions():
    data = request.json
    user_id = data.get('user', 0)
    pending_transactions = data.get('pendingTransactions')

    print(f"PENDING: {pending_transactions}")

    try:
        for pending_transaction in pending_transactions:
            transaction_id = pending_transaction['id']
            
            # Find the transaction in the database
            transaction = Transaction.query.filter_by(transaction_id=transaction_id, status='pending').first()
            # Check the transaction exists
            if transaction:
                # Retrieve the card_id from the transaction
                card_id = transaction.card_id

                # Get the Date:
                current_date_str = data.get('current_date', '')
                current_date_obj = datetime.strptime(current_date_str, '%m/%d/%Y')
                date_only_str = current_date_obj.strftime('%Y-%m-%d')

                # Find the associated credit card
                credit_card = CreditCard.query.filter_by(card_id=card_id, user_id=user_id).first()
                if credit_card:
                    transaction.status = 'settled'  # Update transaction status
                    transaction.finalized_time = date_only_str  # Set finalized time
                    if transaction.amount > 0:
                        # Increase the balance of the credit card
                        credit_card.balance += transaction.amount
                    else:
                        credit_card.available_credit -= transaction.amount
                else:
                    print(f"Credit card with ID {card_id} not found.")
                    continue
            else:
                print(f"Transaction ID {transaction_id} not found or not in pending state.")
                continue

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print("An error occurred:", str(e))
        return jsonify({"error": str(e)}), 500     

    # Prepare the response
    updated_info = {
        "finalized_transactions": [
            {"id": txn.transaction_id,
             "amount": txn.amount, 
             "initial_time": txn.initial_time.strftime('%Y-%m-%d'),
             "finalized_time": txn.finalized_time.strftime('%Y-%m-%d')
             }
            for txn in Transaction.query.filter_by(status='settled').all()
        ],
        "payable_balances": [
            {"card_id": cc.card_id, "balance": cc.balance}
            for cc in CreditCard.query.filter_by(user_id=user_id).all()
        ]
    }
    print(f"UPDATED INFO: {updated_info}")
    return jsonify(updated_info)

@app.route('/cancel-payment', methods=['POST'])
def cancel_payment():
    data = request.json
    user_id = data.get('user', 0)
    payments = data.get('cancel_payments')
    
    try:
        for payment in payments:
            transaction_id = payment['id']
            # Find the transaction in the database
            transaction = Transaction.query.filter_by(transaction_id=transaction_id, status='pending').first()

            if transaction:
                # Get the Date of Cancellation:
                current_date_str = data.get('current_date', '')
                current_date_obj = datetime.strptime(current_date_str, '%m/%d/%Y')
                date_only_str = current_date_obj.strftime('%Y-%m-%d')
                print(f"CANCELED DATE: {current_date_str}")

                # Find the associated credit card
                card_id = transaction.card_id
                credit_card = CreditCard.query.filter_by(card_id=card_id, user_id=user_id).first()
                if credit_card:
                    transaction.status = 'canceled'
                    transaction.finalized_time = date_only_str  # Set finalized time
                    credit_card.balance -= transaction.amount
                else:
                    print(f"Credit card with ID {card_id} not found.")
                    continue
            else:
                print(f"Transaction ID {transaction_id} not found or not in pending state.")
                continue

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print("An error occurred during cancel payment", str(e))
        return jsonify({"error": str(e)}), 500

    # Prepare the Response:
    updated_info = {
        "payable_balances": [
            {"card_id": cc.card_id, "balance": cc.balance}
            for cc in CreditCard.query.filter_by(user_id=user_id).all()
        ]
    }
    print(f"CANCEL WORKING!!! {updated_info}")

    return updated_info


@app.route('/clear', methods=['POST'])
def clear_auth():
    data = request.json
    user_id = data.get('user', 0)
    transactions = data.get('clear_transactions')
    
    print(f"CLEAR DATA: {data}")
    try:
        for transaction in transactions:
            transaction_id = transaction['id']
            # Find the transaction in the database
            transaction = Transaction.query.filter_by(transaction_id=transaction_id, status='pending').first()

            if transaction:
                # Get the Date of Cancellation:
                current_date_str = data.get('current_date', '')
                current_date_obj = datetime.strptime(current_date_str, '%m/%d/%Y')
                date_only_str = current_date_obj.strftime('%Y-%m-%d')
                print(f"CANCELED DATE: {current_date_str}")

                # Find the associated credit card
                card_id = transaction.card_id
                credit_card = CreditCard.query.filter_by(card_id=card_id, user_id=user_id).first()
                if credit_card:
                    transaction.status = 'cleared'
                    transaction.finalized_time = date_only_str  # Set finalized time
                    credit_card.available_credit += transaction.amount
                else:
                    print(f"Credit card with ID {card_id} not found.")
                    continue
            else:
                print(f"Transaction ID {transaction_id} not found or not in pending state.")
                continue

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print("An error occurred during Transaction Clear", str(e))
        return jsonify({"error": str(e)}), 500

    # Prepare the Response:
    updated_info = {
        "payable_balances": [
            {"card_id": cc.card_id, "balance": cc.balance}
            for cc in CreditCard.query.filter_by(user_id=user_id).all()
        ]
    }

    print(f"CLEAR WORKING!!! {updated_info}")

    return updated_info