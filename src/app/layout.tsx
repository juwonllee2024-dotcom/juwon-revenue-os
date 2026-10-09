import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Juwon Revenue OS',
  description: '미용·웰니스 매장을 위한 제작·납품 자동화 운영체제',
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
