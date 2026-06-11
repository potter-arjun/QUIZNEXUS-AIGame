import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quiz Nexus | AI-Powered Multiplayer Quiz Arena",
  description: "Real-time multiplayer quiz battle arena. AI-generated questions, 5 game modes, team battles, puzzle challenges, and global leaderboards. Compete, level up, dominate.",
  keywords: ["Multiplayer Quiz", "AI Quiz Game", "Brain Battle", "Quiz Arena", "Real-time Quiz", "Mind Game", "Puzzle Quiz"],
  authors: [{ name: "Quiz Nexus Team" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col text-zinc-100 selection:bg-purple-600/30 selection:text-purple-300">
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

