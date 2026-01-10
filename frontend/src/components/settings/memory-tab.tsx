"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Trash2, RefreshCw, Search, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Memory {
  id: string;
  memory: string;
  hash: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  user_id: string;
}

interface GetAllMemoriesResponse {
  success: boolean;
  memories: {
    results: Memory[];
  };
}

interface SearchMemoriesResponse {
  success: boolean;
  results: {
    results: Memory[];
  };
}

const MEMORY_API_URL = "http://localhost:8000";
const USER_ID = "user-1";

async function fetchAllMemories(): Promise<Memory[]> {
  const response = await fetch(`${MEMORY_API_URL}/memory/get_all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: USER_ID }),
  });
  const data: GetAllMemoriesResponse = await response.json();
  if (!data.success) throw new Error("Failed to fetch memories");
  return data.memories?.results || [];
}

async function searchMemories(query: string): Promise<Memory[]> {
  const response = await fetch(`${MEMORY_API_URL}/memory/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, user_id: USER_ID, limit: 20 }),
  });
  const data: SearchMemoriesResponse = await response.json();
  if (!data.success) throw new Error("Failed to search memories");
  return data.results?.results || [];
}

async function deleteMemory(memoryId: string): Promise<void> {
  const response = await fetch(`${MEMORY_API_URL}/memory/${memoryId}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!data.success) throw new Error("Failed to delete memory");
}

async function deleteAllMemories(): Promise<void> {
  const response = await fetch(`${MEMORY_API_URL}/memory/user/${USER_ID}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!data.success) throw new Error("Failed to delete all memories");
}

async function addMemory(content: string): Promise<void> {
  const response = await fetch(`${MEMORY_API_URL}/memory/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content }],
      user_id: USER_ID,
    }),
  });
  const data = await response.json();
  if (!data.success) throw new Error("Failed to add memory");
}

export function MemoryTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [newMemory, setNewMemory] = useState("");
  const queryClient = useQueryClient();

  const {
    data: memories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["memories", USER_ID],
    queryFn: fetchAllMemories,
  });

  const searchMutation = useMutation({
    mutationFn: searchMemories,
    onSuccess: (results) => {
      queryClient.setQueryData(["memories", USER_ID], results);
      setIsSearching(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: (_, memoryId) => {
      queryClient.setQueryData(["memories", USER_ID], (old: Memory[] = []) =>
        old.filter((m) => m.id !== memoryId)
      );
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllMemories,
    onSuccess: () => {
      queryClient.setQueryData(["memories", USER_ID], []);
    },
  });

  const addMutation = useMutation({
    mutationFn: addMemory,
    onSuccess: () => {
      setNewMemory("");
      refetch();
    },
  });

  const handleAddMemory = () => {
    if (!newMemory.trim()) return;
    addMutation.mutate(newMemory.trim());
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      refetch();
      return;
    }
    searchMutation.mutate(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    refetch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loading = isLoading || searchMutation.isPending;

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
            <Brain className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Memory Store</h2>
            <p className="text-xs text-muted-foreground">
              {memories.length} memories stored for {USER_ID}
              {isSearching && " (filtered)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              handleClearSearch();
            }}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                disabled={memories.length === 0 || deleteAllMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all memories?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {memories.length} memories. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAllMutation.mutate()}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          />
        </div>
        <Button onClick={handleSearch} variant="secondary" size="default">
          Search
        </Button>
        {isSearching && (
          <Button onClick={handleClearSearch} variant="outline" size="default">
            Clear
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a new memory... (e.g., 'My favorite color is blue')"
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddMemory()}
          className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        />
        <Button 
          onClick={handleAddMemory} 
          disabled={!newMemory.trim() || addMutation.isPending}
          className="gap-1.5"
        >
          {addMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Failed to fetch memories. Make sure the backend is running.
        </div>
      )}

      <ScrollArea className="flex-1 -mx-2 px-2 h-[calc(100%-9rem)]">
        {loading && memories.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading memories...
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
            <Brain className="w-10 h-10 opacity-30" />
            <p className="text-sm">
              {isSearching ? "No memories match your search" : "No memories stored yet"}
            </p>
            <p className="text-xs">
              {isSearching
                ? "Try a different search term"
                : "Memories will appear here as you interact with the AI"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="group p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">
                      {memory.memory}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {formatDate(memory.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => deleteMutation.mutate(memory.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending && deleteMutation.variables === memory.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
