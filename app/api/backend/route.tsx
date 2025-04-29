import { NextResponse } from 'next/server';
import { adminDb } from "@/lib/firebaseAdmin";
// import { orderBy } from 'firebase/firestore';

export async function GET() {
  try {
    // const snapshot = await adminDb.collection("Quiz-DB/CH-003/question-set").get();
    const snapshot = await adminDb.collection("Quiz-DB/CH-003/answer-key").get();

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch data from Firestore", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}