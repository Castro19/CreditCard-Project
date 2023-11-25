from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect
from config import Config
import os
from dotenv import load_dotenv
from sqlalchemy.sql import text


load_dotenv()  # This loads the .env file

app = Flask(__name__, static_folder="../static", template_folder="../templates")
app.config.from_object(Config)
db = SQLAlchemy(app)

# Reset the Table DataBase 
@app.route('/reset_database')
def reset_database():
    # Call the function that executes your MySQL script
    try:
        run_mysql_script()
        print("SUCCESS")
        return "Database reset successfully!"
    except Exception as e:
        print("FAIL")
        return f"An error occurred: {e}"

# Add new Credit Cards with Reset values
def run_mysql_script():
    with db.engine.connect() as connection:
        trans = connection.begin()
        try:
            # Deleting all values from specified tables

            connection.execute(text("DELETE FROM Transactions;"))
            connection.execute(text("ALTER TABLE Transactions AUTO_INCREMENT = 1;"))

            connection.execute(text("DELETE FROM CreditCards;"))


            # Resetting the auto-increment for the CreditCards table
            connection.execute(text("ALTER TABLE CreditCards AUTO_INCREMENT = 1;"))

            # Inserting new values into the CreditCards table
            credit_cards_inserts = [
                "INSERT INTO CreditCards (card_id, user_id, card_number, credit_limit, balance, available_credit) VALUES (1, 3, RAND()*10000000000000000, 50000, 0, 50000);",
                "INSERT INTO CreditCards (card_id, user_id, card_number, credit_limit, balance, available_credit) VALUES (2, 3, RAND()*10000000000000000, 15000, 0, 15000);",
                "INSERT INTO CreditCards (card_id, user_id, card_number, credit_limit, balance, available_credit) VALUES (3, 3, RAND()*10000000000000000, 5000, 0, 5000);",
                "INSERT INTO CreditCards (card_id, user_id, card_number, credit_limit, balance, available_credit) VALUES (1, 2, RAND()*10000000000000000, 50000, 0, 50000);",
                "INSERT INTO CreditCards (card_id, user_id, card_number, credit_limit, balance, available_credit) VALUES (2, 2, RAND()*10000000000000000, 15000, 0, 15000);",
                "INSERT INTO CreditCards (card_id, user_id, card_number, credit_limit, balance, available_credit) VALUES (1, 4, RAND()*10000000000000000, 15000, 0, 15000);",
                "INSERT INTO CreditCards (card_id, user_id, card_number, credit_limit, balance, available_credit) VALUES (2, 4, RAND()*10000000000000000, 5000, 0, 5000);",
                "INSERT INTO CreditCards (card_id, user_id, card_number, credit_limit, balance, available_credit) VALUES (1, 1, RAND()*10000000000000000, 1000, 0, 1000);"
            ]

            for sql in credit_cards_inserts:
                connection.execute(text(sql))

            trans.commit()
        except Exception as e:
            print("Exception occurred:", str(e))  # Print the exception details
            trans.rollback()
            raise e


from app import routes

