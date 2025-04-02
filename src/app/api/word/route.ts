import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const { word, email } = await req.json();

    if (!word || !email) {
      return NextResponse.json({ error: 'Missing word or email' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if collection exists
    const collections = await db.listCollections({ name: 'search_history' }).toArray();
    const collectionExists = collections.length > 0;

    if (!collectionExists) {
      // Force create collection with dummy, then delete it
      await db.collection('search_history').insertOne({
        email: '__init__',
        words: ['placeholder']
      });
      await db.collection('search_history').deleteOne({ email: '__init__' });
      console.log('✅ Collection created manually via init insert');
    }

    await db.collection('search_history').updateOne(
      { email },
      { $addToSet: { words: word } },
      { upsert: true }
    );

    return NextResponse.json({ message: 'Word saved to history ✅' });
  } catch (err) {
    console.error('❌ MongoDB Save Error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const doc = await db.collection('search_history').findOne({ email });

    return NextResponse.json({ words: doc?.words || [] });
  } catch (err) {
    console.error('❌ MongoDB Fetch Error:', err);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}
