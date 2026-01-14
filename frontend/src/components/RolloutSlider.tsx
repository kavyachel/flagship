import { useState, useEffect } from 'react';

interface RolloutSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function RolloutSlider({ value, onChange, disabled = false }: RolloutSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  // Color based on percentage
  const getColorClass = (pct: number) => {
    if (pct === 0) return 'text-slate-400';
    if (pct < 25) return 'text-blue-500';
    if (pct < 50) return 'text-violet-500';
    if (pct < 75) return 'text-purple-500';
    if (pct < 100) return 'text-fuchsia-500';
    return 'text-emerald-500';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-28">
        <input
          type="range"
          min="0"
          max="100"
          value={localValue}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          className={`
            w-full h-2 rounded-lg appearance-none cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #a855f7 ${localValue}%, #e2e8f0 ${localValue}%, #e2e8f0 100%)`
          }}
        />
      </div>
      <div className={`flex items-center gap-1 min-w-[3.5rem] ${getColorClass(localValue)}`}>
        <span className="text-sm font-semibold tabular-nums">
          {localValue}%
        </span>
        {localValue === 100 && <span className="text-xs">✓</span>}
      </div>
    </div>
  );
}
