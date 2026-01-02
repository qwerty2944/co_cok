'use server';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: '검색어가 필요합니다' }, { status: 400 });
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'API 설정이 필요합니다' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    );

    if (!response.ok) {
      throw new Error('네이버 API 호출 실패');
    }

    const data = await response.json();

    // 필요한 데이터만 추출
    const places = data.items.map((item: any) => ({
      name: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
      address: item.roadAddress || item.address,
      category: item.category,
      mapx: item.mapx,
      mapy: item.mapy,
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Place search error:', error);
    return NextResponse.json({ error: '검색에 실패했습니다' }, { status: 500 });
  }
}
