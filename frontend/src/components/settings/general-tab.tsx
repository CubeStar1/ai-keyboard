"use client";

import { Check, Hand, Keyboard, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function GeneralTab() {
  return (
    <div className="p-8 w-full max-w-none space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1">
              <Hand className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Accessibility Permissions</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Permissions granted. AI Keyboard can now access text in other applications.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <Check className="w-4 h-4" />
            Enabled
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1">
              <Keyboard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">AI Keyboard Shortcut</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Set a global shortcut to quickly open the AI Keyboard Menu from anywhere.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-md border text-sm font-medium">
            <span className="text-muted-foreground">⌥</span>
            <span>D</span>
          </div>
        </div>
      </section>

      <div className="h-px bg-border" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="mt-1">
              <Power className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Launch at login</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, TypoTab will start automatically when you log in.
              </p>
            </div>
          </div>
          <Switch defaultChecked />
        </div>
      </section>
    </div>
  );
}
