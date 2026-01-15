"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import useUser from "@/hooks/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Mail, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountTab() {
  const { data: user, isFetching, refetch } = useUser();
  const [isSigningOut, startSignOut] = useTransition();
  const router = useRouter();

  const handleSignOut = () => {
    startSignOut(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      await refetch();
      router.push("/signin");
    });
  };

  const imageUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0];
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString() : null;

  if (isFetching) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar className="h-20 w-20 border-2 border-zinc-200 dark:border-zinc-700">
          {imageUrl ? (
            <AvatarImage src={imageUrl} alt={displayName || "User"} />
          ) : (
            <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} alt="avatar" />
          )}
          <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            {displayName?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{displayName}</h2>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {user?.email}
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account Info</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                User ID
              </span>
              <span className="font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
            </div>
            
            {createdAt && (
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member since
                </span>
                <span>{createdAt}</span>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="destructive"
          className={cn(
            "w-full h-11 rounded-xl flex items-center justify-center gap-2",
            isSigningOut && "opacity-70"
          )}
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className={cn("h-4 w-4", isSigningOut && "animate-spin")} />
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}
