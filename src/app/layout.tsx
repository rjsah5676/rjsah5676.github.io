import type { Metadata } from "next";
import "./globals.css";
import "../css/index.css";
import "../css/header.css";
import "../css/footer.css";
import "../css/nav.css";
import "../css/top.css";
import "../css/floatstyle.css";
import Top from "@/components/Top";
import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import QuickMenu from "@/components/QuickMenu";

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
          href="https://fonts.googleapis.com/css2?family=Yomogi&display=swap"
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
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Top />
        <Header />
        <Nav />
        {children}
        <Footer />
        <Contact />
        <QuickMenu />
      </body>
    </html>
  );
}
