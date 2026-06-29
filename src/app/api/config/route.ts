import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KV_CONFIG_KEY = 'birthday_config';

const defaultConfig = {
  eventName: "🎉 누구의 생일 펀딩 🎉",
  giftName: "선물을 입력해주세요",
  targetAmount: 100000,
  bankName: "은행명",
  accountNumber: "계좌번호",
  accountHolder: "예금주: 이름",
  imagePath: "/assets/gift.png",
  currentAmount: 0,
  fundingHistory: []
};

export async function GET() {
  try {
    // If KV environment variables are not set, return default config immediately
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("Vercel KV is not configured. Falling back to default config.");
      return NextResponse.json(defaultConfig);
    }

    const data = await kv.get(KV_CONFIG_KEY);
    if (!data) {
      return NextResponse.json(defaultConfig);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to read from KV:", error);
    return NextResponse.json(defaultConfig);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("Vercel KV is not configured. Cannot save config.");
      return NextResponse.json({ success: false, error: 'KV is not configured. Go to Vercel dashboard to enable KV Storage.' }, { status: 500 });
    }

    let existingData: any = {};
    try {
      const data = await kv.get(KV_CONFIG_KEY);
      if (data) existingData = data;
      else {
        existingData = {
          currentAmount: 0,
          fundingHistory: []
        };
      }
    } catch (e) {
      existingData = {
        currentAmount: 0,
        fundingHistory: []
      };
    }

    const newData = {
      ...existingData,
      ...body
    };

    await kv.set(KV_CONFIG_KEY, newData);
    return NextResponse.json({ success: true, data: newData });
  } catch (error) {
    console.error("Failed to write to KV:", error);
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 });
  }
}
