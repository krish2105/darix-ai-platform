import { resources, localizeResource } from '@/data/resources';
import { industries } from '@/data/industries';
import { caseStudies } from '@/data/caseStudies';
import { translate, locales, type Locale } from '@/lib/i18n/translations';

export interface KnowledgeSourceItem {
  chunkKey: string;
  sourceType: 'article' | 'faq' | 'industry' | 'level' | 'case-study';
  sourceId: string;
  locale: Locale;
  title: string;
  content: string;
}

const READINESS_LEVEL_IDS = ['explorer', 'starter', 'builder', 'scaler', 'leader'] as const;

// One case study id per src/data/caseStudies.ts, in the same order — kept
// as a plain array rather than importing FAQ_COUNT-style constants since
// this is the only place chunk generation needs to know "how many."
const FAQ_QUESTION_NUMBERS = [1, 2, 3, 4, 5, 6, 7];

// Assembles the entire Mode A (public FAQ bot) knowledge base as flat,
// pre-chunked items ready to embed — one chunk per FAQ pair, per article
// *section* (not whole article), per industry, per readiness level, per
// case study. Chunking follows the content's own natural boundaries
// rather than fixed-size splitting, since every source here is already
// small and structured (see docs/PHASE_15_MASTER_PLAN.md-era research:
// the whole corpus is on the order of a few thousand words).
//
// Consumed by scripts/ingest-knowledge-base.ts (embeds + upserts every
// item) — never imported by a request-handling route, since assembling
// this list is cheap but embedding it is not.
export function getKnowledgeSourceItems(): KnowledgeSourceItem[] {
  const items: KnowledgeSourceItem[] = [];

  for (const locale of locales) {
    for (const article of resources) {
      const localized = localizeResource(article, locale);
      // Only emit a chunk for locales the article actually has content in
      // — localizeResource silently falls back to English for 'ar' when
      // no translation exists (e.g. the ROI article), which would
      // otherwise produce duplicate English chunks under both locales.
      if (locale === 'ar' && !article.sectionsAr) continue;

      localized.sections.forEach((section, index) => {
        items.push({
          chunkKey: `article:${article.slug}#${index}:${locale}`,
          sourceType: 'article',
          sourceId: article.slug,
          locale,
          title: `${localized.title} — ${section.heading}`,
          content: section.body.join('\n\n'),
        });
      });
    }

    for (const qNum of FAQ_QUESTION_NUMBERS) {
      const question = translate(locale, `faq.q${qNum}`);
      const answer = translate(locale, `faq.a${qNum}`);
      items.push({
        chunkKey: `faq:q${qNum}:${locale}`,
        sourceType: 'faq',
        sourceId: `q${qNum}`,
        locale,
        title: question,
        content: `Q: ${question}\nA: ${answer}`,
      });
    }

    for (const industry of industries) {
      const name = translate(locale, `industry.${industry.id}.name`);
      const problem = translate(locale, `industry.${industry.id}.problem`);
      const aiSolution = translate(locale, `industry.${industry.id}.aiSolution`);
      const impact = translate(locale, `industry.${industry.id}.impact`);
      const firstPilot = translate(locale, `industry.${industry.id}.firstPilot`);
      items.push({
        chunkKey: `industry:${industry.id}:${locale}`,
        sourceType: 'industry',
        sourceId: industry.id,
        locale,
        title: name,
        content: `${name}: ${problem} Darix AI's typical AI solution: ${aiSolution} Typical impact: ${impact} Recommended first pilot: ${firstPilot}`,
      });
    }

    for (const levelId of READINESS_LEVEL_IDS) {
      const name = translate(locale, `level.${levelId}.name`);
      const desc = translate(locale, `level.${levelId}.desc`);
      items.push({
        chunkKey: `level:${levelId}:${locale}`,
        sourceType: 'level',
        sourceId: levelId,
        locale,
        title: name,
        content: `${name}: ${desc}`,
      });
    }

    // Case studies are illustrative composites, not real customers (see
    // docs/GO_LIVE_CHECKLIST.md §5) — the disclaimer is appended here, in
    // the one place every case-study chunk is created, so it's
    // structurally impossible for a downstream prompt to drop it.
    for (const study of caseStudies) {
      items.push({
        chunkKey: `case-study:${study.id}:${locale}`,
        sourceType: 'case-study',
        sourceId: study.id,
        locale,
        title: study.title,
        content:
          `${study.title} (illustrative composite, not an actual client): ` +
          `Challenge: ${study.challenge} Readiness gap: ${study.readinessGap} ` +
          `AI solution: ${study.aiSolution} Business value: ${study.businessValue} ` +
          `Timeline: ${study.timeline} Result: ${study.result}`,
      });
    }
  }

  return items;
}
