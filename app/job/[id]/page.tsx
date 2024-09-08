'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';

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

export default function JobDetails() {
  const { theme, setTheme } = useTheme();
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [selectedFile, setSelectedFile] = useState<ScrapedFile | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobDetails() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        const data = await response.json();
        setJob(data.job);
        if (data.job && data.job.scrapedFiles && data.job.scrapedFiles.length > 0) {
          setSelectedFile(data.job.scrapedFiles[0]);
        }
      } catch (err) {
        setError('Error fetching job details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobDetails();
  }, [jobId]);

  useEffect(() => {
    async function fetchContent() {
      if (selectedFile) {
        try {
          setIsLoading(true);
          const contentResponse = await fetch(`/scraped_content/${selectedFile.fileName}`);
          if (!contentResponse.ok) {
            throw new Error('Failed to fetch content');
          }
          const text = await contentResponse.text();
          setContent(text);
        } catch (err) {
          setError('Error fetching content');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchContent();
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fileName = e.target.value;
    const newSelectedFile = job?.scrapedFiles?.find(f => f.fileName === fileName) || null;
    setSelectedFile(newSelectedFile);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !job) {
    return <div>Error: {error || 'Job not found'}</div>;
  }

  const MarkdownComponents: object = {
    img: ({ node, src, alt, ...props }: any) => (
      <span className="block my-4">
        <img
          src={src}
          alt={alt}
          className="max-w-full h-auto rounded-md"
          {...props}
        />
      </span>
    ),
    p: ({ node, ...props }: any) => (
      <p className="my-2" {...props} />
    ),
    h1: ({ node, ...props }: any) => (
      <h1 className="text-3xl font-bold my-4" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 className="text-2xl font-bold my-3" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className="text-xl font-bold my-2" {...props} />
    ),
    ul: ({ node, ordered, ...props }: any) => (
      <ul className="list-disc list-inside my-2" {...props} />
    ),
    ol: ({ node, ordered, ...props }: any) => (
      <ol className="list-decimal list-inside my-2" {...props} />
    ),
    li: ({ node, ordered, ...props }: any) => (
      <li className="my-1" {...props} />
    ),
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white truncate max-w-2xl">
            {selectedFile ? selectedFile.url : 'Select a URL'}
          </h1>
          <div className="flex items-center space-x-4">
            <Link href="/hub" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Back to Hub
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">Bot: {job.bot}</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">Date: {new Date(job.date).toLocaleString()}</p>
          {job.scrapedFiles && job.scrapedFiles.length > 0 ? (
            <div className="mb-4">
              <label htmlFor="fileSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Scraped URL:
              </label>
              <select
                id="fileSelect"
                value={selectedFile?.fileName || ''}
                onChange={handleFileChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {job.scrapedFiles.map((file) => (
                  <option key={file.fileName} value={file.fileName}>
                    {file.url}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300 mb-4">No scraped files available for this job.</p>
          )}
          {selectedFile && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Scraped Content:</h2>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-x-auto prose dark:prose-invert max-w-none">
                <ReactMarkdown 
                  components={MarkdownComponents}
                  rehypePlugins={[rehypeRaw as any]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}