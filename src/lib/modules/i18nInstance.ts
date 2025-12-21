import I18n from './I18n';
import fs from 'fs';
import path from 'path';

let instance: I18n | null = null;

function detectLocales(): string[] {
  const localesDir = path.join(process.cwd(), 'src', 'locales');
  return fs
    .readdirSync(localesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

export function getI18n(): I18n {
  if (!instance) {
    const available = detectLocales();
    let locale = available[0];
    instance = new I18n(locale);
  }
  return instance;
}

export default getI18n();
