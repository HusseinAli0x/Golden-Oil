"use client";

import { Minus, Moon, Plus, Repeat, RotateCcw, Sun } from "lucide-react";
import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";

interface ModelToolbarProps {
  t: Dictionary["model3d"];
  autoRotate: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleAuto: () => void;
  night?: boolean;
  onToggleNight?: () => void;
  className?: string;
}

function ToolButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent text-white transition-colors hover:bg-white/10 focus-visible:outline-amber aria-pressed:bg-amber aria-pressed:text-ink"
    >
      {children}
    </button>
  );
}

export function ModelToolbar({ t, autoRotate, onZoomIn, onZoomOut, onReset, onToggleAuto, night, onToggleNight, className = "" }: ModelToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={t.toolsAria}
      className={`flex gap-1.5 rounded-[14px] border border-white/10 bg-dark/90 p-1.5 backdrop-blur-sm ${className}`}
    >
      <ToolButton label={t.zoomIn} onClick={onZoomIn}>
        <Plus size={20} aria-hidden />
      </ToolButton>
      <ToolButton label={t.zoomOut} onClick={onZoomOut}>
        <Minus size={20} aria-hidden />
      </ToolButton>
      <ToolButton label={t.reset} onClick={onReset}>
        <RotateCcw size={20} aria-hidden />
      </ToolButton>
      <ToolButton label={t.auto} pressed={autoRotate} onClick={onToggleAuto}>
        <Repeat size={20} aria-hidden />
      </ToolButton>
      {onToggleNight && (
        <ToolButton label={t.night} pressed={night} onClick={onToggleNight}>
          {night ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
        </ToolButton>
      )}
    </div>
  );
}
