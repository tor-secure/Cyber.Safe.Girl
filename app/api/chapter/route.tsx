import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from "@/lib/firebaseAdmin";
// import { orderBy } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("id");
console.log( key);
  
    // const snapshot = await adminDb.collection("Quiz-DB/CH-003/question-set").get();
    const snapshot = await adminDb.collection(`Quiz-DB/CH-00${key}/answer-key`).get();

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch data from Firestore", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// app/api/route.ts


// export async function GET() {
  
//   return NextResponse.json({
//     message: `Received query: name = ${name}, id = ${id}`
//   });
// }