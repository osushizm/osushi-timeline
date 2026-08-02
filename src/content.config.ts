import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const diary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/diary' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

const completed = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/completed' }),
  schema: z.object({
    title: z.string(),
    category: z.string(), // game / book / movie など。自由に増やせる
    date: z.coerce.date(), // クリア・読了・鑑賞した日
    image: z.string().optional(), // サムネイル画像のパス(省略可)。例: /completed/xxx.jpg
  }),
});

export const collections = { diary, completed };
