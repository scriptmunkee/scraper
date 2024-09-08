import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import TurndownService from 'turndown';

const JOBS_FILE = path.join(process.cwd(), 'data', 'jobs.json');

function customTurndownRules(turndownService: TurndownService) {
  turndownService.addRule('headings', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement: function (content, node) {
      const hLevel = Number(node.nodeName.charAt(1));
      return '\n\n' + '#'.repeat(hLevel) + ' ' + content + '\n\n';
    }
  });
}

function preprocessHtml($: cheerio.CheerioAPI, scrapeImages: boolean) {
  $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
    const $elem = $(elem);
    const level = Number(elem.tagName.charAt(1));
    $elem.before(`\n\n${'#'.repeat(level)} ${$elem.text()}\n\n`);
    $elem.remove();
  });

  // Always preserve image links, but only include them in the content if scrapeImages is true
  $('img').each((_, elem) => {
    const $elem = $(elem);
    const src = $elem.attr('src');
    const alt = $elem.attr('alt') || '';
    if (src) {
      const imageMarkdown = `\n\n![${alt}](${src})\n\n`;
      if (scrapeImages) {
        $elem.parent().before(imageMarkdown);
      } else {
        // Add a comment to indicate that an image was here but not included
        $elem.parent().before(`\n\n<!-- Image: ${imageMarkdown.trim()} -->\n\n`);
      }
      $elem.remove();
    }
  });
}

function cleanMarkdown(markdown: string): string {
  // Remove backslashes before markdown symbols
  markdown = markdown.replace(/\\([#*_`])/g, '$1');
  
  // Fix escaped image syntax
  markdown = markdown.replace(/!\\\[(.*?)\\\]\((.*?)\)/g, '![$1]($2)');
  
  return markdown;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const bot = formData.get('bot') as string;
    const urlsJson = formData.get('urls') as string;
    const csvFile = formData.get('csvFile') as File | null;
    const scrapeImages = formData.get('scrapeImages') === 'true';

    let urls: string[] = JSON.parse(urlsJson);

    if (csvFile) {
      const csvContent = await csvFile.text();
      const records = parse(csvContent, { columns: true, skip_empty_lines: true });
      const csvUrls = records.map((record: any) => record.url).filter((url: string) => url);
      urls = [...urls, ...csvUrls];
    }

    console.log(`Attempting to scrape ${urls.length} URLs with bot: ${bot}`);

    const scrapedFiles = [];
    const timestamp = new Date().toISOString();
    const jobId = Date.now().toString();

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    customTurndownRules(turndownService);

    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          headers: { 'User-Agent': bot },
        });

        console.log(`Successfully fetched URL: ${url}`);

        const $ = cheerio.load(response.data);
        
        // Remove unwanted elements
        $('script, style, nav, header, footer, iframe, .navigation, .menu, .sidebar, .footer, .header').remove();

        // Preprocess HTML to handle headings and images
        preprocessHtml($, scrapeImages);

        // Try to find the main content
        let content = $('main').html() || 
                      $('article').html() || 
                      $('#content').html() ||
                      $('.content').html() ||
                      $('body').html();
        
        if (!content) {
          throw new Error('No content found');
        }

        // Convert HTML to Markdown
        let markdown = turndownService.turndown(content);

        // Clean the markdown
        markdown = cleanMarkdown(markdown);

        // Trim whitespace and remove extra line breaks
        markdown = markdown.trim().replace(/\n{3,}/g, '\n\n');

        console.log(`Extracted markdown length: ${markdown.length}`);

        const fileName: string = `content_${jobId}_${scrapedFiles.length + 1}.md`;

        await fs.mkdir(path.join(process.cwd(), 'public', 'scraped_content'), { recursive: true });
        await fs.writeFile(path.join(process.cwd(), 'public', 'scraped_content', fileName), markdown);

        console.log(`Saved scraped content to file: ${fileName}`);

        scrapedFiles.push({ url, fileName });
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }

    const newJob = {
      id: jobId,
      urls: urls,
      bot,
      date: timestamp,
      scrapedFiles,
    };

    let existingJobs = [];
    try {
      const jobsData = await fs.readFile(JOBS_FILE, 'utf-8');
      existingJobs = JSON.parse(jobsData);
    } catch (error) {
      console.log('No existing jobs file, starting with empty array');
    }

    existingJobs.push(newJob);
    await fs.writeFile(JOBS_FILE, JSON.stringify(existingJobs, null, 2));

    console.log(`Added new job with ${scrapedFiles.length} scraped files. Total jobs: ${existingJobs.length}`);

    return NextResponse.json({ success: true, jobId, scrapedCount: scrapedFiles.length });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message || 'Scraping failed' }, { status: 500 });
  }
}