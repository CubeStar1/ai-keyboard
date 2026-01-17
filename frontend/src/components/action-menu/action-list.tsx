"use client";

import { cn } from "@/lib/utils";
import { Action } from "@/lib/ai/types";
import { memo, useRef, useEffect, useMemo } from "react";

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

  const { agents, actionsGroup } = useMemo(() => {
    const agents = filteredActions.filter((a) => a.group === "agent");
    const actionsGroup = filteredActions.filter((a) => a.group !== "agent");
    return { agents, actionsGroup };
  }, [filteredActions]);

  if (filteredActions.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground/60">
        No actions found
      </div>
    );
  }

  const agentCount = agents.length;

  return (
    <div className="flex flex-col">
      {agents.length > 0 && (
        <>
          <div className="px-4 py-2">
            <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              AI Agents
            </span>
          </div>
          <div className="flex flex-col px-2">
            {agents.map((action, index) => (
              <ActionItem
                key={action.id}
                action={action}
                isSelected={index === selectedIndex}
                onClick={() => onSelect(action)}
              />
            ))}
          </div>
        </>
      )}

      {actionsGroup.length > 0 && (
        <>
          <div className="px-4 py-2">
            <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              AI Actions
            </span>
          </div>
          <div className="flex flex-col px-2">
            {actionsGroup.map((action, index) => (
              <ActionItem
                key={action.id}
                action={action}
                isSelected={index + agentCount === selectedIndex}
                onClick={() => onSelect(action)}
              />
            ))}
          </div>
        </>
      )}
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
      tabIndex={-1}
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors rounded-md",
        "hover:bg-white/[0.05] dark:hover:bg-white/[0.05]",
        isSelected && "bg-white/[0.08] dark:bg-white/[0.08]"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-base w-5 text-center">{action.icon}</span>
        <span className="text-[13px] font-medium text-foreground">{action.label}</span>
      </div>
      {action.shortcut && (
        <div className="flex items-center gap-0.5 text-muted-foreground/40">
          <span className="text-[11px]">Alt</span>
          <span className="text-[11px] ml-1 font-medium">{action.shortcut}</span>
        </div>
      )}
    </button>
  );
}
