import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export interface NowData {
  updated: string;
  sections: any[];
}

const DATA_DIR = path.resolve('src/data');

export function loadNow(): NowData {
  const raw = fs.readFileSync(path.join(DATA_DIR, 'now.yaml'), 'utf-8');
  return yaml.load(raw) as NowData;
}

export function listArchives(): { date: string; data: NowData }[] {
  const dir = path.join(DATA_DIR, 'archive');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map((f) => ({
      date: f.replace(/\.ya?ml$/, ''),
      data: yaml.load(fs.readFileSync(path.join(dir, f), 'utf-8')) as NowData,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
