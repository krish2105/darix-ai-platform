import { describe, expect, it } from 'vitest';
import { getKnowledgeSourceItems } from './knowledge-source';

describe('getKnowledgeSourceItems', () => {
  const items = getKnowledgeSourceItems();

  it('produces unique chunk keys', () => {
    const keys = items.map((i) => i.chunkKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('produces both locales for content-agnostic sources (FAQ, industries, levels)', () => {
    const faqEn = items.filter((i) => i.sourceType === 'faq' && i.locale === 'en');
    const faqAr = items.filter((i) => i.sourceType === 'faq' && i.locale === 'ar');
    expect(faqEn).toHaveLength(7);
    expect(faqAr).toHaveLength(7);

    const industryEn = items.filter((i) => i.sourceType === 'industry' && i.locale === 'en');
    const industryAr = items.filter((i) => i.sourceType === 'industry' && i.locale === 'ar');
    expect(industryEn).toHaveLength(6);
    expect(industryAr).toHaveLength(6);

    const levelEn = items.filter((i) => i.sourceType === 'level' && i.locale === 'en');
    expect(levelEn).toHaveLength(5);
  });

  it('never emits an Arabic chunk for an article with no Arabic translation', () => {
    const roiArticleAr = items.filter(
      (i) => i.sourceType === 'article' && i.sourceId === 'calculating-real-roi-on-ai-initiatives' && i.locale === 'ar'
    );
    expect(roiArticleAr).toHaveLength(0);

    const roiArticleEn = items.filter(
      (i) => i.sourceType === 'article' && i.sourceId === 'calculating-real-roi-on-ai-initiatives' && i.locale === 'en'
    );
    expect(roiArticleEn.length).toBeGreaterThan(0);
  });

  it('marks every case-study chunk as an illustrative composite, not a real client', () => {
    const caseStudyChunks = items.filter((i) => i.sourceType === 'case-study');
    expect(caseStudyChunks.length).toBeGreaterThan(0);
    caseStudyChunks.forEach((chunk) => {
      expect(chunk.content).toMatch(/illustrative composite, not an actual client/i);
    });
  });

  it('chunks an article by section, not as one giant blob', () => {
    const checklistSections = items.filter(
      (i) => i.sourceType === 'article' && i.sourceId === 'ai-readiness-checklist-uae' && i.locale === 'en'
    );
    expect(checklistSections.length).toBeGreaterThan(1);
  });
});
