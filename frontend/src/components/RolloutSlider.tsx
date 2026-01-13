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

  return (
    <div className="flex items-center space-x-3">
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
          w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
          accent-indigo-600
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      <span className="text-sm font-medium text-gray-700 w-12 text-right">
        {localValue}%
      </span>
    </div>
  );
}
