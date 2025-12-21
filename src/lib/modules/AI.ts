export type PolicyCheckResult = {
  is_safe: boolean;
  reason?: string;
  confidence?: number;
};

import Database from './Database';
import { getI18n } from './i18nInstance';

export async function checkPolicy(
  text: string,
  guildId?: string,
): Promise<PolicyCheckResult> {
  const baseURL = 'https://api.voids.top/v1';
  const model = 'gpt-5-chat-latest';
  let lang = 'ja';
  if (guildId) {
    try {
      const db = new Database();
      await db.init();
      const l = await db.getGuildLang(guildId);
      if (l) lang = l;
    } catch {}
  }
  const i18n = getI18n();
  let systemPrompt = i18n.t('ai.system_prompt');
  const compactText = String(text).replace(/\s+/g, ' ').trim().slice(0, 1000);
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: compactText },
    ],
  };

  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    let raw: string | undefined;
    if (
      json &&
      Array.isArray(json.choices) &&
      json.choices[0]?.message?.content
    ) {
      raw = json.choices[0].message.content;
    } else if (typeof json === 'string') {
      raw = json;
    }
    if (raw && raw.trim() !== '') {
      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const candidate = raw.slice(firstBrace, lastBrace + 1);
        try {
          const parsed = JSON.parse(candidate);
          const rawConfidence = Number(parsed.confidence || 0);
          let confidence = Number.isFinite(rawConfidence)
            ? rawConfidence <= 1
              ? rawConfidence * 100
              : rawConfidence
            : 0;
          confidence = Math.max(0, Math.min(100, confidence));
          const isSafe = Boolean(parsed.is_safe);
          if (isSafe) {
            return { is_safe: true };
          }
          return {
            is_safe: false,
            reason: String(parsed.reason || ''),
            confidence,
          };
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('[checkPolicy] API call/parsing error:', e);
  }

  console.error('[checkPolicy] AI check failed or returned invalid response');
  return { is_safe: true, reason: 'ai-unavailable', confidence: 0 };
}