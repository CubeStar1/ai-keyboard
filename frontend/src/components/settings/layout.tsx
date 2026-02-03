"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralTab } from "./general-tab";
import { ActionsTab } from "./actions-tab";
import { AboutTab } from "./about-tab";
import { MemoryTab } from "./memory-tab";
import { GraphTab } from "./graph-tab";
import { AccountTab } from "./account-tab";
import { ShortcutsTab } from "./shortcuts-tab";

export function SettingsLayout() {
  return (
    <div className="h-screen bg-white dark:bg-zinc-950 text-foreground flex flex-col overflow-hidden selection:bg-violet-100 dark:selection:bg-violet-900/30">
      <Tabs defaultValue="actions" className="flex flex-col h-full gap-0">
        <div className="flex-none pt-3 px-6 pb-3 border-b bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-10 shrink-0 select-none drag-region flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-foreground whitespace-nowrap">AI Keyboard Settings</div>
          <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 h-auto rounded-lg flex-none border border-zinc-200 dark:border-zinc-800">
            <TabsTrigger 
              value="general" 
              className="px-4 py-1.5 rounded-md text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all"
            >
              General
            </TabsTrigger>
            <TabsTrigger 
              value="actions" 
              className="px-4 py-1.5 rounded-md text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all"
            >
              Actions
            </TabsTrigger>
            <TabsTrigger 
              value="memory" 
              className="px-4 py-1.5 rounded-md text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all"
            >
              Memory
            </TabsTrigger>
            <TabsTrigger 
              value="graph" 
              className="px-4 py-1.5 rounded-md text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all"
            >
              Graph
            </TabsTrigger>
            <TabsTrigger 
              value="account" 
              className="px-4 py-1.5 rounded-md text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all"
            >
              Account
            </TabsTrigger>
            <TabsTrigger 
              value="shortcuts" 
              className="px-4 py-1.5 rounded-md text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all"
            >
              Shortcuts
            </TabsTrigger>
            <TabsTrigger 
              value="about" 
              className="px-4 py-1.5 rounded-md text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all"
            >
              About
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-900/30 relative">
          <TabsContent value="general" className="h-full mt-0 border-0 outline-none data-[state=inactive]:hidden text-sm">
            <GeneralTab />
          </TabsContent>
          <TabsContent value="actions" className="h-full mt-0 border-0 outline-none data-[state=inactive]:hidden">
            <ActionsTab />
          </TabsContent>
          <TabsContent value="memory" className="h-full mt-0 border-0 outline-none data-[state=inactive]:hidden">
            <MemoryTab />
          </TabsContent>
          <TabsContent value="graph" className="h-full mt-0 border-0 outline-none data-[state=inactive]:hidden">
            <GraphTab />
          </TabsContent>
          <TabsContent value="account" className="h-full mt-0 border-0 outline-none data-[state=inactive]:hidden">
            <AccountTab />
          </TabsContent>
          <TabsContent value="shortcuts" className="h-full mt-0 border-0 outline-none data-[state=inactive]:hidden">
            <ShortcutsTab />
          </TabsContent>
          <TabsContent value="about" className="h-full mt-0 border-0 outline-none data-[state=inactive]:hidden">
            <AboutTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

