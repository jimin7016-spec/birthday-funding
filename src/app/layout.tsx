import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "지민이의 생일 펀딩!",
  description: "지민이의 생일 펀딩에 참여해주세요!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
