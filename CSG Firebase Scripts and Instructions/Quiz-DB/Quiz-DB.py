import firebase_admin, json
from firebase_admin import credentials, firestore

# Path to your service account key
SERVICE_ACCOUNT_PATH = './account.json'

# Initialize Firebase app
if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client()

# Chapter Information
# chapter_no = "CH-" + "070" (Must be continued, if only new chapters are added)
chapter_no = "FINAL" # For the final chapter, use "FINAL"

# JSON data
with open("./questions.json", 'r', encoding = "utf-8") as file:
    questions_data = json.load(file)
with open("./answers.json", 'r', encoding = "utf-8") as file:
    answers_data = json.load(file)

# Reference to the collection
questions_ref = db.collection("Quiz-DB").document(chapter_no).collection("question-set").document("questions")
answers_ref = db.collection("Quiz-DB").document(chapter_no).collection("answer-key").document("answers")

# Upload data to Firestore
questions_ref.set(questions_data)
answers_ref.set(answers_data)

# Print success message
print(f"Fired Data for {chapter_no} !")

with open("./questions.json", 'w') as file: pass # This clears the file after uploading, so that it can be reused to copy and paste new questions. Optionally, you can comment this line if you want to keep the questions for future reference.

with open("./answers.json", 'w') as file: pass # This clears the file after uploading, so that it can be reused to copy and paste new answers. Optionally, you can comment this line if you want to keep the answers for future reference.
