
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ParameterSliderProps {
  title: string;
  min: number;
  max: number;
  step?: number;
  minValue: number;
  maxValue: number;
  enabled?: boolean;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  onToggle?: (checked: boolean) => void;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  title,
  min,
  max,
  step = 0.1,
  minValue,
  maxValue,
  enabled = true,
  onMinChange,
  onMaxChange,
  onToggle
}) => {
  return (
    <div className="parameter-card">
      <div className="flex items-center justify-between mb-2">
        {onToggle ? (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`${title}-toggle`} 
              checked={enabled} 
              onCheckedChange={onToggle}
            />
            <Label htmlFor={`${title}-toggle`} className="text-sm font-medium">
              {title}
            </Label>
          </div>
        ) : (
          <Label className="text-sm font-medium">{title}</Label>
        )}
      </div>
      
      <div className={`space-y-3 ${!enabled && onToggle ? 'opacity-50' : ''}`}>
        <div className="flex items-center space-x-4">
          <span className="text-xs w-8">Min:</span>
          <Slider
            disabled={!enabled && onToggle !== undefined}
            value={[minValue]}
            min={min}
            max={max}
            step={step}
            onValueChange={(value) => onMinChange(value[0])}
            className="flex-1"
          />
          <input
            type="number"
            value={minValue}
            min={min}
            max={max}
            step={step}
            disabled={!enabled && onToggle !== undefined}
            onChange={(e) => onMinChange(parseFloat(e.target.value) || min)}
            className="parameter-input"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-xs w-8">Max:</span>
          <Slider
            disabled={!enabled && onToggle !== undefined}
            value={[maxValue]}
            min={min}
            max={max}
            step={step}
            onValueChange={(value) => onMaxChange(value[0])}
            className="flex-1"
          />
          <input
            type="number"
            value={maxValue}
            min={min}
            max={max}
            step={step}
            disabled={!enabled && onToggle !== undefined}
            onChange={(e) => onMaxChange(parseFloat(e.target.value) || max)}
            className="parameter-input"
          />
        </div>
      </div>
    </div>
  );
};

export default ParameterSlider;
