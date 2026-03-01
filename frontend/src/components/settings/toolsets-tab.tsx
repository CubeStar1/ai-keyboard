"use client";

import * as React from "react";
import { Plus, Package, Wrench, Search, CheckCircle2, MoreVertical, Sparkles, Zap, Code, FileText, Globe, Puzzle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingsPage } from "./settings-page";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Mock Data
const MY_TOOLSETS = [
  {
    id: "ts-1",
    name: "Developer Preset",
    description: "My daily driver for coding tasks and debugging.",
    tools: ["Github Integration", "Postgres Connection", "Linear Sync"],
    active: true,
  },
  {
    id: "ts-2",
    name: "Research Assistant",
    description: "Tools for searching papers and summarizing long documents.",
    tools: ["Brave Search", "Notion Workspace", "Google Drive"],
    active: false,
  },
];

const MARKETPLACE_MCPS = [
  {
    id: "mcp-1",
    name: "Github",
    description: "Interact with the Github API to manage issues, read repositories, and create PRs.",
    author: "Model Context Protocol",
    downloads: "124k",
    installed: true,
    icon: <Code className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />,
    tags: ["Development", "Source Control"],
  },
  {
    id: "mcp-2",
    name: "Notion",
    description: "Seamlessly read from and write to your Notion workspace pages and databases.",
    author: "Community",
    downloads: "89k",
    installed: false,
    icon: <FileText className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />,
    tags: ["Productivity", "Knowledge Base"],
  },
  {
    id: "mcp-3",
    name: "PostgreSQL",
    description: "Connect safely to your Postgres databases to run queries and analyze schema.",
    author: "Model Context Protocol",
    downloads: "210k",
    installed: true,
    icon: <Database className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />,
    tags: ["Database", "Backend"],
  },
  {
    id: "mcp-4",
    name: "Linear",
    description: "Manage your Linear issues and projects directly through context.",
    author: "Linear",
    downloads: "45k",
    installed: false,
    icon: <Puzzle className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />,
    tags: ["Planning", "Agile"],
  },
  {
    id: "mcp-5",
    name: "Brave Search",
    description: "Real-time web browsing capabilities via the Brave Search API.",
    author: "Model Context Protocol",
    downloads: "156k",
    installed: false,
    icon: <Globe className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />,
    tags: ["Search", "Web"],
  }
];

export function ToolsetsTab() {
  const [activeTab, setActiveTab] = React.useState("my-toolsets");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredMarketplace = MARKETPLACE_MCPS.filter(mcp => 
    mcp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mcp.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SettingsPage 
      title="Integrations & Toolsets" 
      description="Manage your MCP servers and group them into context presets."
      fullWidth
      noScroll
      className="pb-0"
    >
      <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-[300px] grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <TabsTrigger 
                value="my-toolsets"
                className="rounded-sm text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-zinc-500"
              >
                Presets
              </TabsTrigger>
              <TabsTrigger 
                value="marketplace"
                className="rounded-sm text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all text-zinc-500"
              >
                MCP Servers
              </TabsTrigger>
            </TabsList>

            {activeTab === "my-toolsets" ? (
              <Button size="sm" variant="default" className="text-xs h-8 px-3">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Preset
              </Button>
            ) : (
              <div className="relative w-64 group">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-foreground transition-colors" />
                <Input 
                  placeholder="Search servers..." 
                  className="pl-8 h-8 text-xs bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex-1 mt-4 relative overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <TabsContent value="my-toolsets" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
                <div className="space-y-3 pt-1">
                  {MY_TOOLSETS.map((preset) => (
                    <div 
                      key={preset.id}
                      className={cn(
                        "group relative overflow-hidden rounded-lg border p-4 transition-colors",
                        preset.active 
                          ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-300 dark:border-zinc-700" 
                          : "bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 mt-0.5 rounded-md flex items-center justify-center text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700")}>
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-foreground">{preset.name}</h3>
                              {preset.active && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{preset.description}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-foreground">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="mt-4 pl-11">
                        <div className="flex flex-wrap gap-1.5">
                          {preset.tools.map((tool) => (
                            <div key={tool} className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-default">
                              <Puzzle className="w-3 h-3 text-zinc-400" />
                              {tool}
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] font-medium text-zinc-500 hover:text-foreground">
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Empty state "create card" */}
                  <button className="w-full flex items-center justify-center p-6 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Create new preset</span>
                    </div>
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="marketplace" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
                <div className="flex flex-col gap-px bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden pt-1">
                  {filteredMarketplace.map((mcp, index) => (
                    <div 
                      key={mcp.id}
                      className={cn(
                        "group flex items-center justify-between p-4 bg-white dark:bg-zinc-950 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                        index === 0 ? "rounded-t-lg" : "",
                        index === filteredMarketplace.length - 1 ? "rounded-b-lg" : ""
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                          {mcp.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-foreground">{mcp.name}</h3>
                            <span className="text-[10px] text-zinc-400 tracking-wider">v1.2.0</span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 max-w-lg">{mcp.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] text-zinc-500 font-medium">{mcp.author}</span>
                             <span className="text-zinc-300 dark:text-zinc-700">•</span>
                             <span className="text-[10px] text-zinc-400">{mcp.downloads} installs</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-3">
                        {mcp.installed ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-zinc-400 hover:text-foreground">
                               <MoreVertical className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs font-medium px-3 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                              Configure
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="secondary" className="h-7 text-xs font-medium px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-foreground">
                            Install
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredMarketplace.length === 0 && (
                     <div className="p-8 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-950 rounded-lg">
                       <Search className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                       <h3 className="text-sm font-medium text-foreground">No servers found</h3>
                       <p className="text-xs text-zinc-500 mt-1">We couldn't find any MCP servers matching "{searchQuery}".</p>
                     </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </SettingsPage>
  );
}
