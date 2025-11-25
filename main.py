import flask
import hashlib
import random
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, render_template, redirect, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin
import requests

app = Flask(__name__)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "db.sqlite3")
HACKATIME_API_KEY = os.getenv("HACKATIME_API_KEY")
HACKATIME_BASE_URL = "https://hackatime.com/api/v1"


app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
db = SQLAlchemy(app)
app.secret_key = os.getenv("SECRET_KEY")

@app.route("/")
def main():
    return render_template('index.html')

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key = True)
    name = db.Column(db.String(255))
    role = db.Column(db.String(10), default="User")
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    email = db.Column(db.String(255), nullable=True, unique=True)
    slack_id = db.Column(db.String(255), nullable=True, unique=True)
    verification_code = db.Column(db.Integer)
    is_verified = db.Column(db.Boolean, default=False)
    hackatime_username = db.Column(db.String(255), nullable=True)
with app.app_context():
    db.create_all()

def autoconnectHackatime():
    headers = {
        "Authorization": f"Bearers {HACKATIME_API_KEY}"
    }
@app.route("/signin", methods=['GET', 'POST'])
def signin():
    if request.method == "POST" and "code" in request.form:
        code = int(request.form['code'])
        pending_email = session.get('pending_email')
        if not pending_email:
            return render_template('signin.html', message = "No pending verification", show_verify = False)
        user = User.query.filter_by(email = pending_email).first()
        if user and user.verification_code == code:
            user.is_verified = True
            hackatime_user = lookup_hackatime(user.email)
            if hackatime_user:
                user.hackatime_username = hackatime_user
                print(f"User successfully connected to Hackatime")
            db.session.commit()
            session['user_id'] = user.id
            return redirect('/dashboard')
        return render_template("signin.html", message = "Incorrect Code", show_verify = True)
    if request.method == "POST":
        name = request.form['name']
        email = request.form['email']
        
        if not name or not email:
            return render_template("signin.html", message="Missing name/email, go back to the previous page and reenter please!")
        
        exsisting_user = User.query.filter_by(email=email).first()

        if exsisting_user and exsisting_user.is_verified:
            return redirect("/dashboard")
        code = random.randint(10000, 99999)

        if exsisting_user:
            exsisting_user.verification_code = code
            db.session.commit()
            send_verfication_email(exsisting_user.email, exsisting_user.name, code)
            session['pending_email'] = exsisting_user.email
            return render_template('signin.html', message = "Code Sent!", show_verify=True)
        
        new_user = User(
            name = name,
            email = email,
            verification_code = code,
            is_verified = False
        )
        db.session.add(new_user)
        db.session.commit()

        send_verfication_email(email, name, code)
        session['pending_email'] = email
        return render_template('signin.html', message = "Code Sent!", show_verify = True)
    
    return render_template('signin.html')        
def send_verfication_email(to_email, user_name, code):
    EMAIL = os.getenv("EMAIL_ADDRESS")
    PW= os.getenv("EMAIL_PASSWORD")

    msg = MIMEMultipart()
    msg['From'] = EMAIL
    msg['To'] = to_email
    msg['Subject'] = "Mosaic Verification Code"

    body = f"Hi {user_name}, \n\n Your vericiation code is {code}\nEnter it on the verification form to complete sign up! \n\n Thanks"
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL, PW)
        server.sendmail(EMAIL, to_email, msg.as_string())
        server.quit()
    except Exception as e:
        print(f"Failed to send email {e}")

@app.route('/dashboard')
def dashboard():
    user_id = session.get('user_id')
    if not user_id:
        return redirect("/signin")
    user = User.query.get(user_id)
    projects = []
    auto_connected = False

    if user.hackatime_username:
        try:
            url = f"{HACKATIME_BASE_URL}/users/{user.hackatime_username}/projects"
            headers = {f"Authorization": f"Bearers {HACKATIME_API_KEY}"}
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                projects = response.json()
                auto_connected = True
        except Exception as e:
            print(f"Auto-connect failed as {e}")
    return render_template('dashboard.html', user=user, projects=projects, auto_connected=auto_connected)

@app.route("/api/project-hours", methods=['GET'])  
def get_project_hours():
    user_id = session.get('user_id')
    project_name = request.args.get('project-name')
    if not user_id or not project_name:
        return flask.jsonify({'error': "Missing user or project name"}), 400
    user = User.query.get(user_id)
    if not user or not user.hackatime_username:
        return flask.jsonify({'error' : "Hackatime not connected"}), 404
    
    encode_name = requests.utils.quote(project_name, safe="")
    url = f"{HACKATIME_BASE_URL}/users/{user.hackatime_username}/projects/{encode_name}"
    headers = {f"Authorization": f"Bearers {HACKATIME_API_KEY}" }

    try: 
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            total_seconds = data.get('total_seconds', 0)
            hours = round(total_seconds/3600, 2) if total_seconds else 0
            return flask.jsonify({'hours': hours})
        else:
            return flask.jsonify({'error': f"Hackatime API Failed to fetch projects"}), 500
    except requests.exceptions.RequestException:
        return flask.jsonify({'error': "Failed to connect to Hakcatime API"}), 500
    
        

    

def lookup_hackatime(email):
    url = f"{HACKATIME_BASE_URL}/users/lookup-email/{email}"
    headers = {
        "Authorization": f"Bearer {HACKATIME_API_KEY}"
    }
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            return response.json().get('username')
        return None
    except requests.exceptions.RequestException as e:
        print(f"Hackatimed lookup failed with connection error: {e}")
        return None



if __name__ == "__main__":
    app.run(port=4000, debug=True)