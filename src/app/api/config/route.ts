import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import { promises as fs } from 'fs';
import path from 'path';

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
      console.warn("Redis is not configured. Falling back to local data.json.");
      try {
        const filePath = path.join(process.cwd(), 'data.json');
        const fileData = await fs.readFile(filePath, 'utf8');
        return NextResponse.json(JSON.parse(fileData));
      } catch (err) {
        return NextResponse.json(defaultConfig);
      }
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
      console.warn("Redis is not configured. Saving to local data.json.");
      try {
        const filePath = path.join(process.cwd(), 'data.json');
        let existingData: any = {};
        try {
          const fileData = await fs.readFile(filePath, 'utf8');
          existingData = JSON.parse(fileData);
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

        await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');
        return NextResponse.json({ success: true, data: newData });
      } catch (err) {
        console.error("Failed to write to data.json:", err);
        return NextResponse.json({ success: false, error: 'Failed to write to local data.json' }, { status: 500 });
      }
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

