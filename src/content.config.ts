import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Services: one Markdown file per service in src/content/services/.
// The file name becomes the page address, e.g. term-loans.md -> /services/term-loans/
const item = z.object({ label: z.string().optional(), name: z.string().optional(), title: z.string().optional(), text: z.string().optional() });
const faq = z.object({ question: z.string(), answer: z.string() });

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    order: z.number().default(99),
    group: z.enum(['run', 'grow', 'build', 'reduce']).default('grow'),
    title: z.string(),
    code: z.string().optional(),
    summary: z.string(),
    heroTitle: z.string(),
    heroHighlight: z.string().optional(),
    heroText: z.string(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    forms: z.array(item).default([]),
    suits: z.array(z.string()).default([]),
    assess: z.array(item).default([]),
    help: z.array(item).default([]),
    mistakes: z.array(z.string()).default([]),
    documents: z.array(z.string()).default([]),
    faqs: z.array(faq).default([]),
    related: z.array(z.string()).default([]),
    note: z.string().optional(),
    hidden: z.boolean().default(false),
  }),
});

// Insights / blog articles: one Markdown file per article in src/content/insights/.
const insights = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/insights' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string().default('Insights'),
    summary: z.string(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    relatedService: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { services, insights };
