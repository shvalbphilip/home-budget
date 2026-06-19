import { Room, PlanItem, StyleProfile } from './types';
import { getPlanSummary, getRoomStats, fmt, itemTotal } from './geometry';

// ── "יועץ הדירה" — the in-app apartment advisor ──────────────────────────────
// MVP uses local, deterministic logic that computes genuinely useful insights
// from the plan. The same interface (askAdvisor) is ready to delegate to a real
// LLM (OpenAI / Claude) the moment an API key is configured — see callRemoteLLM.

export interface AdvisorContext {
  rooms: Room[];
  items: PlanItem[];
  style: StyleProfile;
}

export const SUGGESTED_QUESTIONS: string[] = [
  'מה הסגנון שלכם?',
  'מה התקציב הכולל?',
  'מה הכי חשוב לכם במטבח?',
  'מה כבר קניתם?',
  'מה אפשר לוותר עליו?',
  'איך תיראה הדירה?',
  'במה כדאי להתחיל?',
  'האם אנחנו בתקציב?',
];

const STYLE_TIPS: Record<string, string> = {
  'מודרני': 'קווים נקיים, גוונים ניטרליים, מעט עומס. השקיעו בתאורה נסתרת ובמשטחים חלקים.',
  'סקנדינבי': 'עץ בהיר, לבן, טקסטיל רך והרבה אור טבעי. פחות זה יותר.',
  'כפרי': 'עץ טבעי, גוונים חמים, אריגים וקרמיקה. נוחות לפני הכול.',
  'תעשייתי': 'מתכת, בטון, גוונים כהים ותאורת אדיסון. השאירו אלמנטים חשופים.',
  'בוהו': 'שכבות טקסטיל, צמחים, גוונים עפר וטבע. תנו לחדר אישיות.',
};

function startsWithAny(text: string, words: string[]) {
  return words.some((w) => text.includes(w));
}

/** Local deterministic advisor. Returns Hebrew advice grounded in the plan. */
export function mockAdvisor(message: string, ctx: AdvisorContext): string {
  const t = message.trim();
  const { rooms, items, style } = ctx;
  const summary = getPlanSummary(rooms, items, style.budget);

  // Budget questions
  if (startsWithAny(t, ['תקציב', 'כסף', 'עלות', 'יקר', 'בתקציב', 'כמה'])) {
    if (style.budget <= 0) {
      return 'עדיין לא הגדרתם תקציב כולל. כשתגדירו אותו בלשונית "סקירה" אוכל לעקוב אחרי החריגות ולהציע לכם איפה לחסוך. מה התקציב שאתם חושבים עליו?';
    }
    const lines = [
      `התקציב שהגדרתם: ${fmt(style.budget)}.`,
      `כרגע מתוכננת הוצאה של ${fmt(summary.totalEstimated)} (ללא פריטים שסומנו "לא צריך").`,
    ];
    if (summary.remaining < 0) {
      lines.push(`⚠️ אתם חורגים ב-${fmt(Math.abs(summary.remaining))}. הייתי ממליץ לעבור על פריטי "נחמד שיהיה" (${summary.byPriority['נחמד שיהיה'].count} פריטים, ${fmt(summary.byPriority['נחמד שיהיה'].cost)}) ולדחות חלק מהם.`);
    } else {
      lines.push(`✅ נשארו לכם ${fmt(summary.remaining)} בתקציב. יש מרחב נשימה, אבל שמרו רזרבה של ~10% להפתעות.`);
    }
    lines.push(`מתוך זה כבר נרכש: ${fmt(summary.totalSpent)}, ועוד ${fmt(summary.totalMissingCost)} בפריטים שמסומנים כחסרים.`);
    return lines.join('\n');
  }

  // Style questions
  if (startsWithAny(t, ['סגנון', 'עיצוב', 'נראה', 'תיראה', 'איך תיראה', 'אווירה'])) {
    if (!style.style) {
      return 'עוד לא בחרתם סגנון. כמה כיוונים נפוצים: מודרני, סקנדינבי, כפרי, תעשייתי, בוהו. איזה מהם הכי מדבר אליכם? ברגע שתבחרו אוכל להתאים לכם המלצות לכל חדר.';
    }
    const tip = STYLE_TIPS[style.style] ?? 'שמרו על קו אחיד בין החדרים — חומרים וגוונים חוזרים יוצרים תחושת רצף.';
    return `בחרתם סגנון ${style.style}. ${tip}\nתכננתם ${summary.totalRooms} חדרים בשטח כולל של ${summary.totalAreaM2} מ״ר. אם תרצו, אגיד לכם חדר-חדר במה להתמקד.`;
  }

  // "What did we already buy"
  if (startsWithAny(t, ['קנינו', 'כבר קניתי', 'כבר קנינו', 'יש לנו', 'מה קנינו'])) {
    const owned = items.filter((i) => i.status === 'יש לנו' || i.bought);
    if (owned.length === 0) {
      return 'עדיין לא סימנתם פריטים כ"יש לנו". כשתתחילו לסמן, אעזור לכם להבין מה כבר מכוסה ומה עוד חסר.';
    }
    const top = owned.slice(0, 8).map((i) => `• ${i.emoji} ${i.name}`).join('\n');
    return `כבר יש לכם ${owned.length} פריטים, בשווי ${fmt(owned.reduce((s, i) => s + itemTotal(i), 0))}:\n${top}${owned.length > 8 ? '\n…ועוד' : ''}\nכל הכבוד, זו התחלה טובה! רוצים שאבדוק מה החובה שעוד חסר?`;
  }

  // "What can we give up"
  if (startsWithAny(t, ['לוותר', 'מיותר', 'לחסוך', 'לא צריך', 'אפשר בלי'])) {
    const nice = items.filter((i) => i.status !== 'לא צריך' && i.priority === 'נחמד שיהיה');
    const maybe = items.filter((i) => i.status === 'אולי');
    if (nice.length === 0 && maybe.length === 0) {
      return 'יפה — כרגע אין הרבה פריטי מותרות. הכול נראה ממוקד בצרכים. אם התקציב לחוץ, נתמקד בלדחות רכישות ולא לבטל אותן.';
    }
    const lines = ['כדי לחסוך, אלה המועמדים הראשונים לדחייה / ויתור:'];
    if (nice.length) {
      lines.push(`\nפריטי "נחמד שיהיה" (${fmt(nice.reduce((s, i) => s + itemTotal(i), 0))}):`);
      nice.slice(0, 6).forEach((i) => lines.push(`• ${i.emoji} ${i.name} — ${fmt(itemTotal(i))}`));
    }
    if (maybe.length) {
      lines.push(`\nפריטים שסימנתם "אולי" (${maybe.length}): שווה להחליט עליהם לפני שקונים אחרים.`);
    }
    lines.push('\nהטיפ שלי: אל תבטלו — דחו. קנו קודם את החובה, וחזרו למותרות אחרי שתתמקמו.');
    return lines.join('\n');
  }

  // Kitchen / specific room focus
  if (startsWithAny(t, ['מטבח'])) {
    const kitchen = rooms.find((r) => r.name.includes('מטבח'));
    if (!kitchen) return 'עוד לא הוספתם מטבח לתוכנית. במטבח הייתי ממליץ להתחיל מהדברים הגדולים: מקרר, תנור/כיריים, מדיח, ופינת אוכל. רוצים שאוסיף חדר מטבח?';
    const ks = getRoomStats(kitchen, items);
    return `במטבח (${ks.area} מ״ר) יש כרגע ${ks.total} פריטים: ${ks.have} יש לכם, ${ks.missing} חסרים. עלות מתוכננת ${fmt(ks.estimatedCost)}.\nסדר עדיפויות שאני ממליץ: 1) מקרר 2) תנור/כיריים 3) מדיח 4) כלי בישול בסיסיים 5) שדרוגים. מה מתוך אלה כבר יש לכם?`;
  }

  // "Where to start"
  if (startsWithAny(t, ['להתחיל', 'מאיפה', 'במה כדאי', 'ראשון', 'קודם'])) {
    const mustMissing = items.filter((i) => i.status === 'חסר' && i.priority === 'חובה');
    if (mustMissing.length === 0) {
      return 'כל פריטי החובה כבר מכוסים — מצוין! עכשיו אפשר לעבור ל"חשוב" ואז ל"נחמד שיהיה". רוצים שאעבור חדר-חדר?';
    }
    const grouped: Record<string, PlanItem[]> = {};
    mustMissing.forEach((i) => {
      const r = rooms.find((rm) => rm.id === i.roomId);
      const key = r ? `${r.emoji} ${r.name}` : 'כללי';
      (grouped[key] ??= []).push(i);
    });
    const lines = [`יש ${mustMissing.length} פריטי חובה חסרים, בעלות ${fmt(mustMissing.reduce((s, i) => s + itemTotal(i), 0))}. הייתי מתחיל מהם, לפי חדר:`];
    Object.entries(grouped).forEach(([room, its]) => {
      lines.push(`\n${room}: ${its.map((i) => i.name).join(', ')}`);
    });
    return lines.join('\n');
  }

  // Generic readiness / status
  if (startsWithAny(t, ['מצב', 'מוכן', 'איפה אנחנו', 'סטטוס', 'התקדמות'])) {
    return `נכון לעכשיו: ${summary.totalRooms} חדרים, ${summary.totalItems} פריטים, מוכנות כללית ${summary.readiness}%.\nחובה: ${summary.byPriority['חובה'].count} · חשוב: ${summary.byPriority['חשוב'].count} · נחמד שיהיה: ${summary.byPriority['נחמד שיהיה'].count}.\nרוצים שאמליץ במה להתמקד קודם?`;
  }

  // Fallback — guide the conversation
  return [
    'אני יועץ הדירה שלכם 🏠 אני יכול לעזור לכם להחליט מה באמת צריך, לשמור על התקציב ולתכנן חדר-חדר.',
    'נסו לשאול אותי דברים כמו: "האם אנחנו בתקציב?", "מה אפשר לוותר עליו?", "במה כדאי להתחיל?", או "מה הכי חשוב במטבח?".',
    style.style ? `אגב, הסגנון שבחרתם (${style.style}) ילווה את ההמלצות שלי.` : 'טיפ: בחרו סגנון בלשונית "סקירה" כדי שאתאים לכם המלצות מדויקות יותר.',
  ].join('\n');
}

interface AdvisorOptions {
  apiKey?: string;
}

/** Placeholder for future real-LLM integration (OpenAI / Claude). */
async function callRemoteLLM(_message: string, _ctx: AdvisorContext, _opts: AdvisorOptions): Promise<string> {
  // Intentionally not implemented in the MVP. When wired:
  //   - build a system prompt describing the plan (rooms/items/style/budget)
  //   - POST to the provider with the user message
  //   - return the assistant text
  throw new Error('remote-not-configured');
}

/** Public entry point used by the UI. Falls back to the local advisor. */
export async function askAdvisor(message: string, ctx: AdvisorContext): Promise<string> {
  const apiKey =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
      : undefined;

  if (apiKey) {
    try {
      return await callRemoteLLM(message, ctx, { apiKey });
    } catch {
      // graceful fallback to local advisor
    }
  }
  // tiny delay so the UI can show a typing indicator
  await new Promise((r) => setTimeout(r, 280));
  return mockAdvisor(message, ctx);
}
