'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface ScrapedFile {
  url: string;
  fileName: string;
}

interface Job {
  id: string;
  urls: string[];
  bot: string;
  date: string;
  scrapedFiles?: ScrapedFile[];
}

type SortOption = 'latest' | 'oldest' | 'mostUrls' | 'leastUrls';

export default function Hub() {
  const { theme, setTheme } = useTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('latest');

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(sortJobs(data.jobs, 'latest'));
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  }

  function sortJobs(jobsToSort: Job[], option: SortOption): Job[] {
    switch (option) {
      case 'latest':
        return [...jobsToSort].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'oldest':
        return [...jobsToSort].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'mostUrls':
        return [...jobsToSort].sort((a, b) => (b.scrapedFiles?.length || 0) - (a.scrapedFiles?.length || 0));
      case 'leastUrls':
        return [...jobsToSort].sort((a, b) => (a.scrapedFiles?.length || 0) - (b.scrapedFiles?.length || 0));
      default:
        return jobsToSort;
    }
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSortOption = e.target.value as SortOption;
    setSortOption(newSortOption);
    setJobs(sortJobs(jobs, newSortOption));
  }

  async function deleteJob(id: string) {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setJobs(jobs.filter(job => job.id !== id));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete job:', errorData.error);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Completed Jobs Hub</h1>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Home
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="sortOption" className="mr-2 text-gray-700 dark:text-gray-300">Sort by:</label>
          <select
            id="sortOption"
            value={sortOption}
            onChange={handleSortChange}
            className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="mostUrls">Most URLs</option>
            <option value="leastUrls">Least URLs</option>
          </select>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.map((job) => (
              <li key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center">
                <Link href={`/job/${job.id}`} className="flex-grow">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    Job {job.id} ({job.scrapedFiles?.length || job.urls?.length || 0} URLs)
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-4">{new Date(job.date).toLocaleString()}</span>
                </Link>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}