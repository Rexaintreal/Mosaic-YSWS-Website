import flask
from flask import Flask, request, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI']='sqlite:///db.sqlite3'
db = SQLAlchemy(app)

# with app.app_context():
#    db.create_all()

@app.route("/")
def main():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)