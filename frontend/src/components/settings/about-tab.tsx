"use client";

import Image from "next/image";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "AI Keyboard";
const appIcon = process.env.NEXT_PUBLIC_APP_ICON || "/ai-kb-logo.png";

export function AboutTab() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 flex items-center justify-center">
            <Image
              src={appIcon}
              alt={appName}
              width={96}
              height={96}
              className="w-full h-full object-contain p-2 rounded-2xl"
            />
          </div>
        </div>

        {/* App Info */}
        <div className="space-y-3">
          <h1 className="text-3xl font-serif font-normal text-foreground tracking-tight">
            {appName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Version 2.0.0
          </p>
        </div>

        {/* Description */}
        <p className="text-muted-foreground leading-relaxed font-light">
          Your intelligent writing assistant. Enhance your workflow with AI-powered text transformations, coding interview assistance, and persistent memory.
        </p>

        {/* Divider */}
        <div className="w-16 h-px bg-stone-200 dark:bg-zinc-800 mx-auto" />

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 text-center pt-2">
          <div className="space-y-1">
            <p className="text-2xl font-serif text-foreground">∞</p>
            <p className="text-xs text-muted-foreground">AI Actions</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-serif text-foreground">⌘</p>
            <p className="text-xs text-muted-foreground">Shortcuts</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-serif text-foreground">◎</p>
            <p className="text-xs text-muted-foreground">Memory</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 space-y-2">
          <p className="text-xs text-muted-foreground">
            Built with care for developers and writers
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            © 2026 {appName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
