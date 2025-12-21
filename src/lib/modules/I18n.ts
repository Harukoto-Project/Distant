import fs from 'fs';
import path from 'path';

export default class I18n {
  private messages: Record<string, any> = {};
  constructor(private locale = 'ja') {
    this.messages = this.load(locale);
  }

  private load(locale: string): Record<string, any> {
    const candidates = [
      path.join(process.cwd(), 'dist', 'locales', `${locale}.json`),
    ];

    for (const p of candidates) {
      try {
        console.log('[I18n] checking path:', p);
        if (fs.existsSync(p)) {
          console.log('[I18n] found:', p);
          const raw = fs.readFileSync(p, 'utf8');
          try {
            const parsed = JSON.parse(raw);
            console.log('[I18n] parsed:', Object.keys(parsed));
            return parsed;
          } catch (jsonErr) {
            console.log('[I18n] JSON parse error:', jsonErr);
          }
        } else {
          console.log('[I18n] not found:', p);
        }
      } catch (e) {
        console.log('[I18n] read error:', e);
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
