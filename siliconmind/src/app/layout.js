import "./globals.css";

export const metadata = {
  title: "SiliconMind — AI Hardware Engineering Copilot",
  description: "Your AI-powered VLSI and embedded systems knowledge platform. Upload datasheets, analyze schematics, and design circuits with intelligent assistance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
