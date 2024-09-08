import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JOBS_FILE = path.join(process.cwd(), 'data', 'jobs.json');

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const jobsData = await fs.readFile(JOBS_FILE, 'utf-8');
    let jobs = JSON.parse(jobsData);

    const jobIndex = jobs.findIndex((job: any) => job.id === params.id);
    if (jobIndex === -1) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const deletedJob = jobs.splice(jobIndex, 1)[0];

    // Delete all associated content files
    if (deletedJob.scrapedFiles) {
      for (const file of deletedJob.scrapedFiles) {
        const contentFilePath = path.join(process.cwd(), 'public', 'scraped_content', file.fileName);
        try {
          await fs.unlink(contentFilePath);
        } catch (error) {
          console.error(`Failed to delete file ${file.fileName}:`, error);
          // Continue with deletion even if a file fails to delete
        }
      }
    }

    await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const jobsData = await fs.readFile(JOBS_FILE, 'utf-8');
    const jobs = JSON.parse(jobsData);
    const job = jobs.find((j: any) => j.id === params.id);

    if (job) {
      return NextResponse.json({ job });
    } else {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error reading job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}