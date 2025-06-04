import firebase_admin, json
from firebase_admin import credentials, firestore

SERVICE_ACCOUNT_PATH = './account.json'

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

with open("./chapter_data.json", "r", encoding = "utf-8") as file:
    data = json.load(file)

for chapter_id, chapter_data in data.items():
    db.collection("Chapter Data").document(chapter_id).set(chapter_data)
    print(f"Fired Data for {chapter_id} !")