import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Scraper Tool & AI Outreach CRM",
  description: "Scrape active business listings with dual emails across multi-directories. Handpick selections to send to CRM or GHL tab.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-200 font-sans">
        {children}
      </body>
    </html>
  );
}
