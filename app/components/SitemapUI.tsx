'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SitemapUI() {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [multipleUrls, setMultipleUrls] = useState('');
  const [bot, setBot] = useState('DefaultBot/1.0');
  const [error, setError] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [scrapeImages, setScrapeImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const urls = multipleUrls.split('\n').filter(url => url.trim() !== '');
      const urlsToScrape = sitemapUrl ? [sitemapUrl, ...urls] : urls;

      if (urlsToScrape.length === 0 && !csvFile) {
        setError('Please provide at least one URL or upload a CSV file');
        return;
      }

      const formData = new FormData();
      formData.append('bot', bot);
      formData.append('urls', JSON.stringify(urlsToScrape));
      formData.append('scrapeImages', scrapeImages.toString());
      if (csvFile) {
        formData.append('csvFile', csvFile);
      }

      const response = await fetch('/api/scrape', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        router.push('/hub');
      } else {
        setError(data.error || 'Scraping failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sitemap UI</h1>
          <div className="flex items-center space-x-4">
            <Link href="/hub" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Hub
            </Link>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="sitemapUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Single URL to Scrape:
            </label>
            <input
              type="url"
              id="sitemapUrl"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label htmlFor="multipleUrls" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Multiple URLs (one per line):
            </label>
            <textarea
              id="multipleUrls"
              value={multipleUrls}
              onChange={(e) => setMultipleUrls(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={4}
              placeholder="https://example1.com&#10;https://example2.com"
            />
          </div>
          <div>
            <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload CSV File:
            </label>
            <input
              type="file"
              id="csvFile"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                dark:file:bg-indigo-900 dark:file:text-indigo-300
                dark:hover:file:bg-indigo-800"
            />
          </div>
          <div>
            <label htmlFor="bot" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bot User Agent:
            </label>
            <input
              type="text"
              id="bot"
              value={bot}
              onChange={(e) => setBot(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="scrapeImages"
              checked={scrapeImages}
              onChange={(e) => setScrapeImages(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="scrapeImages" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Scrape Images
            </label>
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start Scraping
          </button>
        </form>
      </div>
    </div>
  );
}