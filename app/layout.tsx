import type { Metadata } from "next";
import "./globals.css";
import "./monitor.css";

export const metadata: Metadata = {
  title: "ClausePilot | Living commercial assurance",
  description: "Checkpoint-bounded commercial obligation monitoring on GenLayer.",
  icons: { icon: "/clausepilot-logo.jpg", apple: "/clausepilot-logo.jpg" },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
