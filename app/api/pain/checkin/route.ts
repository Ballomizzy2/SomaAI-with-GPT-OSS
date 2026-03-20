import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

type PainCheckInPayload = {
  region?: string;
  quality?: string;
  severity?: number;
  days_since_onset?: number | string;
  notes?: string;
  timestamp?: number;
};

type StoredPainCheckIn = {
  id: string;
  region: string;
  quality: string;
  severity: number;
  days_since_onset?: number;
  notes: string;
  timestamp: number;
};

const DATA_DIR = path.join(process.cwd(), '.data');
const CHECKIN_FILE = path.join(DATA_DIR, 'pain-checkins.json');
const MAX_STORED_CHECKINS = 1000;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

async function readCheckins(): Promise<StoredPainCheckIn[]> {
  try {
    const raw = await fs.readFile(CHECKIN_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredPainCheckIn[]) : [];
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function appendCheckin(checkin: StoredPainCheckIn) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const existing = await readCheckins();
  const next = [...existing, checkin];
  const capped = next.length > MAX_STORED_CHECKINS ? next.slice(-MAX_STORED_CHECKINS) : next;
  await fs.writeFile(CHECKIN_FILE, JSON.stringify(capped, null, 2), 'utf8');
}

export async function GET() {
  try {
    const checkins = await readCheckins();
    return NextResponse.json({
      ok: true,
      count: checkins.length,
      checkins: checkins.slice(-50),
    });
  } catch (error) {
    console.error('Error reading pain check-ins:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as PainCheckInPayload;

    const region = typeof body.region === 'string' ? body.region.trim() : '';
    const quality = typeof body.quality === 'string' ? body.quality.trim() : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    const severityRaw =
      typeof body.severity === 'number'
        ? body.severity
        : typeof (body as any).severity === 'string'
          ? Number((body as any).severity)
          : NaN;
    const severity = Number.isFinite(severityRaw) ? clamp(Math.round(severityRaw), 0, 10) : 0;

    const daysRaw =
      typeof body.days_since_onset === 'number'
        ? body.days_since_onset
        : typeof body.days_since_onset === 'string'
          ? Number(body.days_since_onset)
          : NaN;
    const days_since_onset =
      Number.isFinite(daysRaw) && daysRaw >= 0 ? Math.min(3650, Math.floor(daysRaw)) : undefined;

    if (!region) {
      return NextResponse.json({ error: 'region is required' }, { status: 400 });
    }

    const normalized: StoredPainCheckIn = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      region,
      quality,
      severity,
      days_since_onset,
      notes,
      timestamp: typeof body.timestamp === 'number' ? body.timestamp : Date.now(),
    };

    await appendCheckin(normalized);

    return NextResponse.json({ ok: true, checkin: normalized });
  } catch (error) {
    console.error('Error handling pain check-in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

