# app/models.py
from app import db
from datetime import datetime

class Users(db.Model):
    __tablename__ = 'users'  # This should match the actual table name
    
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    age = db.Column(db.Integer)
    current_credit_score = db.Column(db.Integer)

    def __repr__(self):
        return f'<User {self.user_id}>'

class CreditCard(db.Model):
    __tablename__ = 'CreditCards'
    card_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True)
    card_number = db.Column(db.String(20))
    credit_limit = db.Column(db.Numeric)
    balance = db.Column(db.Numeric)
    available_credit = db.Column(db.Numeric)

    def __repr__(self):
        return f'<CreditCard {self.card_id}>'
    
class Item(db.Model):
    __tablename__ = 'Item'
    item_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255))
    price = db.Column(db.Integer)

    def __repr__(self):
        return f'Item {self.item_id}>'

class Transaction(db.Model):
    __tablename__ = 'Transactions'  # This should match the actual table name

    transaction_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    card_id = db.Column(db.Integer, db.ForeignKey('CreditCards.card_id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2))
    initial_time = db.Column(db.DateTime, default=datetime.utcnow)
    finalized_time = db.Column(db.DateTime)
    status = db.Column(db.Enum('pending', 'settled', 'clear', 'canceled'))
    tip = db.Column(db.Numeric(10, 2), default=0.00)

    def __repr__(self):
        return f'<Transaction {self.transaction_id}>'
    