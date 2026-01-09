"use client";

import { cn } from "@/lib/utils";
import { Action } from "@/lib/ai/types";
import { memo, forwardRef } from "react";

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
    <div className="flex flex-col py-1">
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

const ActionItem = forwardRef<HTMLButtonElement, ActionItemProps>(
  function ActionItem({ action, isSelected, onClick }, ref) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent"
        )}
      >
        <span className="text-lg">{action.icon}</span>
        <span className="text-sm font-medium">{action.label}</span>
      </button>
    );
  }
);
