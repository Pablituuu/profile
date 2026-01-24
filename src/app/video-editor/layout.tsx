import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Editor AI | Pablituuu",
  description:
    "A powerful browser-based video editor with AI capabilities. Edit, crop, and generate content with Gemini AI.",
};

export default function VideoEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
