# app/routes.py
from app import app, db
from flask import render_template, request, jsonify
from .models import Users, CreditCard, Item, Transaction
import requests
from openai import OpenAI
from sqlalchemy import inspect
import decimal
from datetime import datetime
# from app.helpers.pomelo import summarize


@app.route('/')
def home():
    return render_template('index.html')
    
@app.route('/get-users')
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

@app.route('/get-credit-score/<int:user_id>')
def get_credit_score(user_id):
    print(f"Fetching credit score for user ID: {user_id}")
    user = Users.query.filter_by(user_id=user_id).first()
    if user:
        print(f"Found user: {user}, Credit Score: {user.current_credit_score}")
        return jsonify({'creditScore': user.current_credit_score})
    else:
        print("User not found")
        return jsonify({'error': 'User not found'}), 404
    
@app.route('/get-credit-cards/<int:user_id>')
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

@app.route('/get-items')
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
    

@app.route('/submit', methods=['POST'])
def submit():
    print("Submit route was called.")
    data = request.json
    user_id = data.get('user', 0)
    card_id = data.get('card_id', 0)
    current_date_str = data.get('current_date', '')
    # Convert the string to a datetime object
    # Convert the string to a datetime object
    current_date_obj = datetime.strptime(current_date_str, '%m/%d/%Y')

    # Format to a date-only string (YYYY-MM-DD format)
    date_only_str = current_date_obj.strftime('%Y-%m-%d')

    pending_balance = decimal.Decimal(data.get('pending_balance', 0))

    items = data.get('items', [])
    
    total = sum(decimal.Decimal(item['price']) for item in items)
    print(f"Total Transaction Amount: {total}")

    # Update the credit card records in the database
    try:
        credit_card = CreditCard.query.filter_by(card_id=card_id, user_id=user_id).first()
        if credit_card:
            credit_card.available_credit -= total  # Update the available credit
            pending_balance += total

            db.session.commit()
        else:
            return jsonify({"error": "Credit card not found"}), 404
    except Exception as e:
        db.session.rollback()
        print("An error occurred:", str(e))
        return jsonify({"error": str(e)}), 500

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
        "pending_balance": pending_balance,
        "pending_transactions": pending_transactions
    }

    print("HERE:", str(updated_info))
    return jsonify(updated_info)

@app.route('/submit_payment', methods=['POST'])
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
    pending_credit = float(data.get('pending_credit', 0))

    payable_balance = float(data.get('payable_balance', 0))

    payable_balance += payment_amount
    pending_credit += payment_amount

    # Update the credit card records in the database
    try:
        credit_card = CreditCard.query.filter_by(card_id=card_id, user_id=user_id).first()
        if credit_card:
            credit_card.balance = payable_balance  # Update the paybale balance, but the available credit takes time to load.
            db.session.commit()
        else:
            return jsonify({"error": "Credit card not found"}), 404
    except Exception as e:
        db.session.rollback()
        print("An error occurred:", str(e))
        return jsonify({"error": str(e)}), 500       
    # Process the payment logic here
    # For example, updating available credit and payable balance

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
        "pending_credit": pending_credit,
        "payable_balance": payable_balance,
        "pending_transactions": formatted_transactions
    }
    
    print("HERE:", str(updated_info))

    return jsonify(updated_info)

from flask import jsonify

@app.route('/finalize_transactions', methods=['POST'])
def finalize_transactions():
    data = request.json
    user_id = data.get('user', 0)
    card_id = data.get('card_id', 0)
    # Finalaize the Pending Balance in Credit Card:
    pending_balance = decimal.Decimal(data.get('pending_balance', 0))
    pending_credit = decimal.Decimal(data.get('pending_credit', 0))

     # Update the credit card records in the database
    try:
        credit_card = CreditCard.query.filter_by(card_id=card_id, user_id=user_id).first()
        if credit_card:
            credit_card.balance += pending_balance  # Update the paybale balance
            credit_card.available_credit -= pending_credit
            db.session.commit()
        else:
            return jsonify({"error": "Credit card not found"}), 404
        
    except Exception as e:
        db.session.rollback()
        print("An error occurred:", str(e))
        return jsonify({"error": str(e)}), 500     
    
    current_date_str = data.get('current_date', '')
    # Convert the string to a datetime object
    current_date_obj = datetime.strptime(current_date_str, '%m/%d/%Y')
    date_only_str = current_date_obj.strftime('%Y-%m-%d')

    # Assuming you have a way to finalize transactions in your database
    try:
        pending_transactions = Transaction.query.filter_by(status='pending').all()
        for txn in pending_transactions:
            txn.status = 'settled'
            txn.finalized_time = date_only_str
            # Set finalized_time or any other necessary fields here

        db.session.commit()

        payable_balance = credit_card.balance
        available_credit = credit_card.available_credit

        # Format the finalized transactions for response
        finalized_transactions = [
            {"id": txn.transaction_id,
              "amount": txn.amount, 
              "initial_time": txn.initial_time.strftime('%Y-%m-%d'),
              "finalized_time": date_only_str

              }
            for txn in pending_transactions
        ]   
        print(finalized_transactions)
        updated_info = {
            "finalized_transactions": finalized_transactions,
            "payable_balance": payable_balance,
            "available_credit": available_credit
        }
        return jsonify(updated_info)
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# @app.route('/process-data', methods=['POST'])
# def process_data():
#     inputJSON = request.data
#     summary = summarize(inputJSON)
#     return jsonify(summary)

