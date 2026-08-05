import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const diary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/diary' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

const blogSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  image: z.string().optional(), // サムネイル画像のパス(省略可)
  tags: z.array(z.string()).optional(), // 絞り込みタグ(省略可、自由に増やせる)
});

const techblog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/techblog' }),
  schema: blogSchema,
});

const gameblog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gameblog' }),
  schema: blogSchema,
});

export const collections = { diary, techblog, gameblog };
