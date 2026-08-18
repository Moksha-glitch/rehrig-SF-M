import React from 'react';
import Icon from './Icon.jsx';
import { THEME_OPTIONS } from '../utils/theme.js';

export default function ThemeToggle({
  value,
  onChange,
  compact = false,
  className = '',
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className={`inline-flex rounded-control border border-line bg-elevated p-0.5 ${className}`}
    >
      {THEME_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[0.3rem] font-medium interactive ${
              compact ? 'h-8 min-w-8 px-2' : 'h-8 px-2.5 text-xs'
            } ${selected ? 'bg-surface text-ink shadow-raise' : 'text-ink-muted hover:text-ink'}`}
          >
            <Icon name={option.icon} size={14} />
            {!compact && option.label}
            {compact && <span className="sr-only">{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
