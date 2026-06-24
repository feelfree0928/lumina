import { ReligiousTradition } from '@/types/profile';
import { claude, CLAUDE_MODEL } from '@/lib/claude';

const TRADITION_DESCRIPTIONS: Record<ReligiousTradition, string> = {
  christianity:
    'Christian scripture (Bible — Old and New Testament). Reference book, chapter, and verse.',
  islam: 'Islamic scripture (Quran) and Hadith. Reference Surah and Ayah.',
  judaism: 'Jewish scripture (Torah, Talmud, Proverbs). Reference book and verse.',
  hinduism: 'Hindu scripture (Bhagavad Gita, Upanishads, Vedas). Reference chapter and verse.',
  buddhism: 'Buddhist teachings (Dhammapada, Pali Canon, Zen wisdom). Reference text and section.',
  sikhism: 'Sikh scripture (Guru Granth Sahib). Reference page (Ang).',
  spiritual_nonreligious:
    'Universal spiritual wisdom — Stoic philosophy, Rumi, Joseph Campbell, Thich Nhat Hanh, etc.',
  agnostic:
    'Non-religious philosophical wisdom — Marcus Aurelius, Viktor Frankl, Carl Jung, etc.',
  other: 'Universal wisdom tradition appropriate to the user.',
};

interface ScriptureContextArgs {
  religion: ReligiousTradition;
  mood: string;
  affirmations: string[];
}

interface ScriptureResult {
  passage: string;
  source: string;
  reflection: string;
}

export async function getScriptureContext({
  religion,
  mood,
}: ScriptureContextArgs): Promise<ScriptureResult> {
  const traditionDesc = TRADITION_DESCRIPTIONS[religion];

  const prompt = `A person is feeling: ${mood}.
Their spiritual tradition is: ${traditionDesc}

Select one single, highly relevant passage or teaching from this tradition that:
1. Speaks directly to the emotional state of feeling ${mood}
2. Offers comfort, grounding, or a path forward
3. Is brief (under 60 words)

Respond ONLY with a JSON object in this exact format (no markdown, no preamble):
{
  "passage": "The actual text of the passage or teaching",
  "source": "Book Chapter:Verse or equivalent reference",
  "reflection": "One sentence connecting this passage to the user's current feeling (under 25 words)"
}`;

  try {
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    const text = block && block.type === 'text' ? block.text : '';
    const parsed = JSON.parse(text.trim());

    return {
      passage: parsed.passage || '',
      source: parsed.source || 'Scripture',
      reflection: parsed.reflection || '',
    };
  } catch (err) {
    console.error('Scripture retrieval error:', err);
    return {
      passage: 'Be still, and know.',
      source: 'Universal wisdom',
      reflection: 'In stillness, answers arise naturally.',
    };
  }
}
