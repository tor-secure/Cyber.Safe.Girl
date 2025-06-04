import firebase_admin, json
from firebase_admin import credentials, firestore

SERVICE_ACCOUNT_PATH = './account.json'

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

with open("./relevant_sections.json", "r", encoding = "utf-8") as file:
    data = json.load(file)

for case_id, case_data in data.items():
    db.collection("Relevant Sections").document(case_id).set(case_data)
    print(f"Fired Data for {case_id} !")