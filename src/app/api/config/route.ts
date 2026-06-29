import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const KV_CONFIG_KEY = 'birthday_config';

const defaultConfig = {
  eventName: "🎉 누구의 생일 펀딩 🎉",
  giftName: "선물을 입력해주세요",
  targetAmount: 100000,
  bankName: "은행명",
  accountNumber: "계좌번호",
  accountHolder: "예금주: 이름",
  imagePath: "/assets/gift.jpg",
  currentAmount: 0,
  fundingHistory: []
};

// Create a redis client if REDIS_URL is present
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

export async function GET() {
  try {
    if (!redis) {
      console.warn("Redis is not configured. Falling back to default config.");
      return NextResponse.json(defaultConfig);
    }

    const dataString = await redis.get(KV_CONFIG_KEY);
    if (!dataString) {
      return NextResponse.json(defaultConfig);
    }

    return NextResponse.json(JSON.parse(dataString));
  } catch (error) {
    console.error("Failed to read from Redis:", error);
    return NextResponse.json(defaultConfig);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!redis) {
      console.warn("Redis is not configured. Cannot save config.");
      return NextResponse.json({ success: false, error: 'Database is not configured. (Missing REDIS_URL)' }, { status: 500 });
    }

    let existingData: any = {};
    try {
      const dataString = await redis.get(KV_CONFIG_KEY);
      if (dataString) existingData = JSON.parse(dataString);
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

    await redis.set(KV_CONFIG_KEY, JSON.stringify(newData));
    return NextResponse.json({ success: true, data: newData });
  } catch (error) {
    console.error("Failed to write to Redis:", error);
    return NextResponse.json({ success: false, error: 'Failed to save config' }, { status: 500 });
  }
}
