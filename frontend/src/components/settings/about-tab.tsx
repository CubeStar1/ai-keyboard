"use client";

export function AboutTab() {
  return (
    <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
        <span className="text-3xl font-bold text-white">AI</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">AI Keyboard</h2>
        <p className="text-muted-foreground font-medium">Version 2.0.0</p>
      </div>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
        Your intelligent writing assistant. Enhance your workflow with AI-powered text transformations and generation.
      </p>
      
      <div className="pt-12 text-xs text-slate-400 dark:text-slate-600">
        © 2026 AI Keyboard Team. All rights reserved.
      </div>
    </div>
  );
}
