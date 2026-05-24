import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "HọcLiệu - Nền tảng tài liệu trực tuyến",
  description: "Nền tảng đăng tải và chia sẻ tài liệu học tập trực tuyến.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        {children}
      </body>
      <img src="https://www.google.com/imgres?q=%E1%BA%A3nh&imgurl=https%3A%2F%2Fmaunailxinh.com%2Fwp-content%2Fuploads%2F2025%2F05%2Fhinh-anh-hello-kitty-de-thuong.jpg&imgrefurl=https%3A%2F%2Fmaunailxinh.com%2Fhinh-anh-hello-kitty-cute%2F&docid=hxhLCtOH-N7mSM&tbnid=_Cdg7c-fLJF-xM&vet=12ahUKEwiuvb-1pNKUAxWYR2wGHdumFPwQnPAOegQIGxAB..i&w=800&h=746&hcb=2&ved=2ahUKEwiuvb-1pNKUAxWYR2wGHdumFPwQnPAOegQIGxAB" alt="" />
    </html>
  );
}
