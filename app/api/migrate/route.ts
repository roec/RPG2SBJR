import { runMigration } from '@/lib/pipeline';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rpgSource?: string };
    if (!body.rpgSource?.trim()) {
      return NextResponse.json({ error: 'RPG source is required.' }, { status: 400 });
    }
    const result = await runMigration(body.rpgSource);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Migration failed.', details: String(error) }, { status: 500 });
  }
}
