import type { Metadata } from "next";
import "./globals.css";
import "../css/index.css";
import "../css/floatstyle.css";
import Top from "@/components/Top";
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import QuickMenu from "@/components/QuickMenu";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Gunmo Lee",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Jua&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <Top />
          <Header />
          <Nav />
          {children}
          <Footer />
          <Contact />
          <QuickMenu />
        </AuthProvider>
      </body>
    </html>
  );
}
