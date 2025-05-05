
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  label, 
  showPercentage = true 
}) => {
  return (
    <div className="w-full space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-400">{label}</span>}
          {showPercentage && <span className="text-sm font-medium">{Math.round(value)}%</span>}
        </div>
      )}
      <Progress value={value} className="w-full h-2" />
    </div>
  );
};

export default ProgressBar;
