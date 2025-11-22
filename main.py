import flask
import hashlib
from flask import Flask, request, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI']='sqlite:///db.sqlite3'
db = SQLAlchemy(app)

# with app.app_context():
#    db.create_all()

@app.route("/")
def main():
    return render_template('index.html')

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(255))
    role = db.Column(db.String(10), default="User")
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    email = db.Column(db.String(255), nullable=True, unique=True)
    password_hash = db.Column(db.String(255), nullable=True)
    slack_id = db.Column(db.String(255), nullable=True, unique=True)

@app.route("/signin", methods=['GET', 'POST'])
def signin():
    return render_template('signin.html')
    #if request.method=='POST': 
    #    name=request.get_data()

if __name__ == "__main__":
    app.run(port=4000, debug=True)