import fs from 'fs';
import path from 'path';

export default class I18n {
  private messages: Record<string, any> = {};
  constructor(private locale = 'ja') {
    this.messages = this.load(locale);
  }

  private load(locale: string): Record<string, any> {
    const candidates = [
      path.join(__dirname, '../../locales', `${locale}.json`), // when running from src with ts-node
      path.join(process.cwd(), 'src', 'locales', `${locale}.json`), // dev
      path.join(process.cwd(), 'locales', `${locale}.json`), // project root locales
      path.join(process.cwd(), 'dist', 'locales', `${locale}.json`), // built output
    ];

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf8');
          return JSON.parse(raw);
        }
      } catch (e) {
        // try next
      }
    }

    return {};
  }

  t(key: string, vars?: Record<string, string | number>): string {
    const parts = key.split('.');
    let cur: any = this.messages;
    for (const p of parts) {
      cur = cur?.[p];
      if (cur === undefined) return key;
    }
    let str = String(cur);
    if (vars) {
      for (const k of Object.keys(vars)) {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(vars[k]));
      }
    }
    return str;
  }
}
