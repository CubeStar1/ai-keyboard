"use client";

import { cn } from "@/lib/utils";
import { Action } from "@/lib/ai/types";
import { memo, useRef, useEffect } from "react";
import { Kbd } from "@/components/ui/kbd";

interface ActionListProps {
  actions: Action[];
  selectedIndex: number;
  onSelect: (action: Action) => void;
  filter: string;
}

export const ActionList = memo(function ActionList({
  actions,
  selectedIndex,
  onSelect,
  filter,
}: ActionListProps) {
  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(filter.toLowerCase())
  );

  if (filteredActions.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        No actions found
      </div>
    );
  }

  return (
    <div className="flex flex-col py-2">
      {filteredActions.map((action, index) => (
        <ActionItem
          key={action.id}
          action={action}
          isSelected={index === selectedIndex}
          onClick={() => onSelect(action)}
        />
      ))}
    </div>
  );
});

interface ActionItemProps {
  action: Action;
  isSelected: boolean;
  onClick: () => void;
}

function ActionItem({ action, isSelected, onClick }: ActionItemProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isSelected]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 mx-2 px-3 py-3 text-left transition-colors rounded-lg",
        "hover:bg-muted/60",
        isSelected && "bg-muted"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg opacity-80">{action.icon}</span>
        <span className="text-sm font-semibold text-foreground">{action.label}</span>
      </div>
      {action.shortcut && (
        <div className="flex items-center gap-1">
          <Kbd className="text-xs px-1.5 py-0.5">Alt</Kbd>
          <Kbd className="text-xs px-1.5 py-0.5">{action.shortcut}</Kbd>
        </div>
      )}
    </button>
  );
}
