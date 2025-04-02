// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const client = await clientPromise;
  const db = client.db();
  const existingUser = await db.collection('users').findOne({ email });

  if (existingUser) {
    return NextResponse.json({ message: 'User already exists' }, { status: 400 });
  }

  await db.collection('users').insertOne({ email, password });
  return NextResponse.json({ message: 'User created' });
}
