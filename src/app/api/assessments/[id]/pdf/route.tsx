import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { ReadinessReportDocument } from '@/lib/pdf/ReadinessReportDocument';
import type { ReadinessResult } from '@/utils/scoring';
import type { Locale } from '@/lib/i18n/translations';

// @react-pdf/renderer needs Node APIs (fontkit, buffers) that aren't
// available on the Edge runtime.
export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const requestedLocale = request.nextUrl.searchParams.get('locale');
  const locale: Locale = requestedLocale === 'ar' ? 'ar' : 'en';

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('assessments')
    .select('company_name, result, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <ReadinessReportDocument
      result={data.result as ReadinessResult}
      companyName={data.company_name}
      generatedAt={new Date(data.created_at)}
      locale={locale}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="darix-ai-readiness-report-${id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
