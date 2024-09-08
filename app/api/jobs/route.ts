import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JOBS_FILE = path.join(process.cwd(), 'data', 'jobs.json');

export async function GET() {
  try {
    const jobsData = await fs.readFile(JOBS_FILE, 'utf-8');
    const jobs = JSON.parse(jobsData);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error reading jobs:', error);
    return NextResponse.json({ jobs: [] });
  }
}