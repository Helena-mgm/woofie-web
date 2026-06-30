import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { Event } from '@/shared/types/event';

const DATA_PATH = path.resolve(process.cwd(), 'data', 'events.json');

export async function POST(req: Request) {
  try {
    const { eventId, userId } = await req.json() as { eventId: number; userId: number };
    const raw = await readFile(DATA_PATH, 'utf-8');
    const events = JSON.parse(raw) as Event[];
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const list = (events[idx].attendeesList ?? []).filter((id) => id !== userId);
    events[idx].attendeesList = list;
    events[idx].attendees = list.length;
    await writeFile(DATA_PATH, JSON.stringify(events, null, 2), 'utf-8');
    return NextResponse.json(events[idx]);
  } catch {
    return NextResponse.json({ error: 'Cannot leave' }, { status: 500 });
  }
}
