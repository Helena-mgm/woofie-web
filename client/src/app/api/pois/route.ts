import { NextRequest, NextResponse } from 'next/server';

const buildBackendCandidates = (): string[] => {
  const candidates = [
    process.env.INTERNAL_API_BASE,
    process.env.NEXT_PUBLIC_API_BASE,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.API_BASE,
    'http://localhost:8000',
    'http://nginx',
  ].filter((value): value is string => Boolean(value));

  // Remove duplicates while preserving order
  return Array.from(new Set(candidates));
};

export async function GET(request: NextRequest) {
  const candidates = buildBackendCandidates();
  const url = new URL(request.url);
  const search = url.searchParams.toString();
  const pathAndQuery = `/api/pois${search ? `?${search}` : ''}`;

  let lastError: unknown = null;

  for (const candidate of candidates) {
    const target = `${candidate.replace(/\/+$/, '')}${pathAndQuery}`;

    try {
      const backendResponse = await fetch(target, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        // Always bypass caching for live POI data
        cache: 'no-store',
      });

      if (!backendResponse.ok) {
        const body = await backendResponse.text();
        return new NextResponse(body, {
          status: backendResponse.status,
          headers: {
            'Cache-Control': 'no-store',
          },
        });
      }

      const payload = await backendResponse.json();
      return NextResponse.json(payload, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      lastError = error;
      // Try the next backend candidate
    }
  }

  console.error('Failed to proxy POIs', lastError);
  return NextResponse.json(
    { error: 'Unable to fetch points of interest from backend' },
    {
      status: 502,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

