
import React from 'react';
import ParameterSlider from '@/components/ParameterSlider';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ParameterSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const ParameterSection: React.FC<ParameterSectionProps> = ({
  title,
  icon,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-app-dark-accent rounded-md p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
        {icon && <div className="text-app-blue">{icon}</div>}
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default ParameterSection;
