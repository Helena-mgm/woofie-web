import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import type { Event } from '@/shared/types/event';

const DATA_PATH = path.resolve(process.cwd(), 'data', 'events.json');

export async function GET() {
  const raw = await readFile(DATA_PATH, 'utf-8');
  return NextResponse.json(JSON.parse(raw));
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const raw = await readFile(DATA_PATH, 'utf-8');
    const events = JSON.parse(raw) as Event[];
    const nextId = Math.max(0, ...events.map((e) => e.id)) + 1;
    const newEvent = { ...payload, id: nextId, attendees: 0, attendeesList: [] };
    events.unshift(newEvent);
    await import('fs/promises').then(({ writeFile }) => writeFile(DATA_PATH, JSON.stringify(events, null, 2), 'utf-8'));
    return NextResponse.json(newEvent, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not create event' }, { status: 500 });
  }
}
