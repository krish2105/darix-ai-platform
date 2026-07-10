import { describe, expect, it } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReadinessReportDocument } from './ReadinessReportDocument';
import { calculateReadiness } from '@/utils/scoring';
import { dimensions } from '@/data/questions';

const allQuestionIds = dimensions.flatMap((d) => d.questions.map((q) => q.id));
const answers = Object.fromEntries(allQuestionIds.map((id, i) => [id, i % 6]));
const result = calculateReadiness(answers);

// Real render, not a snapshot: confirms the PDF pipeline (including the
// Arabic font registration in src/lib/pdf/fonts.ts) doesn't throw and
// produces non-trivial output, for both locales.
describe('ReadinessReportDocument', () => {
  it('renders an English PDF', async () => {
    const buffer = await renderToBuffer(
      <ReadinessReportDocument result={result} companyName="Acme Corp" generatedAt={new Date('2026-07-10')} locale="en" />
    );
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('renders an Arabic PDF with the Arabic font registered', async () => {
    const buffer = await renderToBuffer(
      <ReadinessReportDocument result={result} companyName="شركة أكمي" generatedAt={new Date('2026-07-10')} locale="ar" />
    );
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('falls back to the stored English strings for legacy results without levelId', async () => {
    const legacyResult = { ...result };
    delete (legacyResult as { levelId?: string }).levelId;
    delete (legacyResult as { strengthDimensionIds?: string[] }).strengthDimensionIds;
    delete (legacyResult as { gapDimensionIds?: string[] }).gapDimensionIds;

    const buffer = await renderToBuffer(
      <ReadinessReportDocument result={legacyResult} companyName="Acme Corp" generatedAt={new Date('2026-07-10')} locale="ar" />
    );
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
