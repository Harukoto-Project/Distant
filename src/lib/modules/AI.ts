export type PolicyCheckResult = {
  is_safe: boolean;
  reason?: string;
  confidence?: number;
};

export async function checkPolicy(text: string): Promise<PolicyCheckResult> {
  const baseURL = 'https://api.voids.top/v1';
  const model = 'gpt-5-chat-latest';
  const systemPrompt = '安全性チェック。JSONのみで返してください。reasonは例のように簡潔に。フィールド: is_safe, reason, confidence(0-100)。例: {"is_safe":false,"reason":"性的コンテンツの可能性","confidence":90}';
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
    if (json && Array.isArray(json.choices) && json.choices[0]?.message?.content) {
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
          let confidence = Number.isFinite(rawConfidence) ? (rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence) : 0;
          confidence = Math.max(0, Math.min(100, confidence));
          const result = {
            is_safe: Boolean(parsed.is_safe),
            reason: String(parsed.reason || ''),
            confidence,
          };
          return result;
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('[checkPolicy] API call/parsing error:', e);
  }

  console.error('[checkPolicy] AI check failed or returned invalid response');
  return { is_safe: true, reason: 'ai-unavailable', confidence: 0 };
}
