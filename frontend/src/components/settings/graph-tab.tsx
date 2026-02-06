"use client";

import { useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import type { Node, Relationship, HitTargets } from "@neo4j-nvl/base";
import type { MouseEventCallbacks } from "@neo4j-nvl/react";
import { Brain, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import useUser from "@/hooks/use-user";

const InteractiveNvlWrapper = dynamic(
  () => import("@neo4j-nvl/react").then((mod) => mod.InteractiveNvlWrapper),
  { ssr: false }
);

interface Relation {
  source: string;
  relationship: string;
  target: string;
}

interface MemoriesResponse {
  success: boolean;
  memories: {
    results: unknown[];
    relations?: Relation[];
  };
}

const MEMORY_API_URL = process.env.NEXT_PUBLIC_MEMORY_API_URL || "http://localhost:8000";

async function fetchMemoriesWithRelations(userId: string): Promise<Relation[]> {
  const response = await fetch(`${MEMORY_API_URL}/memory/get_all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  const data: MemoriesResponse = await response.json();
  if (!data.success) throw new Error("Failed to fetch memories");
  return data.memories?.relations || [];
}

function formatLabel(label: string): string {
  return label
    .replace(/^user_id:_/, "")
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const NODE_COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"
];

export function GraphTab() {
  const nvlRef = useRef<any>(null);
  const { data: user } = useUser();
  const userId = user?.id;
  
  const { data: relations = [], isLoading, error, refetch } = useQuery({
    queryKey: ["memory-relations", userId],
    queryFn: () => fetchMemoriesWithRelations(userId!),
    enabled: !!userId,
  });

  const { nodes, rels } = useMemo(() => {
    const nodeSet = new Set<string>();
    relations.forEach((r) => {
      nodeSet.add(r.source);
      nodeSet.add(r.target);
    });

    const nodeArray = Array.from(nodeSet);
    const centerX = 400;
    const centerY = 300;
    const radius = 250;
    
    const nodes: Node[] = nodeArray.map((id, index) => {
      const angle = (2 * Math.PI * index) / nodeArray.length;
      return {
        id,
        size: id.startsWith("user_id:") ? 35 : 25,
        color: NODE_COLORS[index % NODE_COLORS.length],
        caption: formatLabel(id),
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    const rels: Relationship[] = relations.map((r, index) => ({
      id: `rel-${index}`,
      from: r.source,
      to: r.target,
      caption: r.relationship,
    }));

    return { nodes, rels };
  }, [relations]);

  useEffect(() => {
    if (nvlRef.current && nodes.length > 0) {
      const timer = setTimeout(() => {
        try {
          nvlRef.current?.fit();
        } catch (e) {
          console.log("fit error:", e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [nodes.length]);

  const mouseEventCallbacks: MouseEventCallbacks = {
    onHover: (element: Node | Relationship, hitTargets: HitTargets, evt: MouseEvent) => {},
    onNodeClick: (node: Node, hitTargets: HitTargets, evt: MouseEvent) => {
      console.log("Node clicked:", node);
    },
    onNodeDoubleClick: (node: Node, hitTargets: HitTargets, evt: MouseEvent) => {},
    onRelationshipClick: (rel: Relationship, hitTargets: HitTargets, evt: MouseEvent) => {},
    onDrag: (nodes: Node[], evt: MouseEvent) => {},
    onPan: (pan: { x: number; y: number }, evt: MouseEvent) => {},
    onZoom: (zoom: number, evt: MouseEvent) => {},
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading graph...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" />
          Failed to load graph data
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
        <Brain className="w-12 h-12 opacity-30" />
        <p className="text-sm">No graph relationships yet</p>
        <p className="text-xs">Graph relationships will appear as you add memories</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <Brain className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Knowledge Graph</h2>
            <p className="text-xs text-muted-foreground">
              {nodes.length} nodes · {rels.length} relationships
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>
      <div className="flex-1 bg-zinc-950">
        <InteractiveNvlWrapper
          ref={nvlRef}
          nodes={nodes}
          rels={rels}
          mouseEventCallbacks={mouseEventCallbacks}
          nvlOptions={{
            allowDynamicMinZoom: true,
            initialZoom: 1,
            layout: "forceDirected",
          }}
        />
      </div>
    </div>
  );
}
