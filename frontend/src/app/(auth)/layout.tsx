import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - AI Keyboard",
  description: "Sign in to AI Keyboard Assistant",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br rounded-2xl from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex flex-col">
      <div 
        className="h-8 w-full shrink-0 flex items-center justify-center"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}
