
import React from 'react';
import { VideoPresetSettings } from '@/types/preset';
import ParameterSlider from '@/components/ParameterSlider';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ParameterSection from './ParameterSection';
import { 
  Video, 
  Volume, 
  Sliders, 
  FlipHorizontal, 
  Scissors,
  FastForward
} from 'lucide-react';

interface VideoProcessingPanelProps {
  settings: VideoPresetSettings;
  updateSettingParam: (param: keyof VideoPresetSettings, subParam: string, value: any) => void;
  updateWatermarkParam: (param: string, value: any) => void; // Kept for compatibility but not used
}

const VideoProcessingPanel: React.FC<VideoProcessingPanelProps> = ({
  settings,
  updateSettingParam,
  updateWatermarkParam
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Video Quality Section */}
      <ParameterSection title="Video Quality" icon={<Video className="h-5 w-5" />}>
        <ParameterSlider
          title="Video Bitrate (kbps)"
          min={1000}
          max={15000}
          step={500}
          minValue={settings.videoBitrate.min}
          maxValue={settings.videoBitrate.max}
          enabled={settings.videoBitrate.enabled}
          onMinChange={(value) => updateSettingParam('videoBitrate', 'min', value)}
          onMaxChange={(value) => updateSettingParam('videoBitrate', 'max', value)}
          onToggle={(checked) => updateSettingParam('videoBitrate', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Framerate (fps)"
          min={20}
          max={60}
          step={1}
          minValue={settings.frameRate.min}
          maxValue={settings.frameRate.max}
          enabled={settings.frameRate.enabled}
          onMinChange={(value) => updateSettingParam('frameRate', 'min', value)}
          onMaxChange={(value) => updateSettingParam('frameRate', 'max', value)}
          onToggle={(checked) => updateSettingParam('frameRate', 'enabled', checked)}
        />
      </ParameterSection>

      {/* Color Adjustments Section */}
      <ParameterSection title="Color Adjustments" icon={<Sliders className="h-5 w-5" />}>
        <ParameterSlider
          title="Saturation"
          min={0.5}
          max={1.5}
          step={0.05}
          minValue={settings.saturation.min}
          maxValue={settings.saturation.max}
          enabled={settings.saturation.enabled}
          onMinChange={(value) => updateSettingParam('saturation', 'min', value)}
          onMaxChange={(value) => updateSettingParam('saturation', 'max', value)}
          onToggle={(checked) => updateSettingParam('saturation', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Contrast"
          min={0.5}
          max={1.5}
          step={0.05}
          minValue={settings.contrast.min}
          maxValue={settings.contrast.max}
          enabled={settings.contrast.enabled}
          onMinChange={(value) => updateSettingParam('contrast', 'min', value)}
          onMaxChange={(value) => updateSettingParam('contrast', 'max', value)}
          onToggle={(checked) => updateSettingParam('contrast', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Brightness"
          min={-0.3}
          max={0.3}
          step={0.05}
          minValue={settings.brightness.min}
          maxValue={settings.brightness.max}
          enabled={settings.brightness.enabled}
          onMinChange={(value) => updateSettingParam('brightness', 'min', value)}
          onMaxChange={(value) => updateSettingParam('brightness', 'max', value)}
          onToggle={(checked) => updateSettingParam('brightness', 'enabled', checked)}
        />
      </ParameterSection>
      
      {/* Speed & Transformations */}
      <ParameterSection title="Speed & Transformations" icon={<FastForward className="h-5 w-5" />}>
        <ParameterSlider
          title="Speed"
          min={0.8}
          max={1.2}
          step={0.05}
          minValue={settings.speed.min}
          maxValue={settings.speed.max}
          enabled={settings.speed.enabled}
          onMinChange={(value) => updateSettingParam('speed', 'min', value)}
          onMaxChange={(value) => updateSettingParam('speed', 'max', value)}
          onToggle={(checked) => updateSettingParam('speed', 'enabled', checked)}
        />
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="flip-horizontal" 
            checked={settings.flipHorizontal} 
            onCheckedChange={(checked) => updateSettingParam('flipHorizontal', '', !!checked)}
          />
          <Label htmlFor="flip-horizontal">Flip Horizontally</Label>
        </div>
      </ParameterSection>
      
      {/* Audio Settings */}
      <ParameterSection title="Audio" icon={<Volume className="h-5 w-5" />}>
        <ParameterSlider
          title="Volume"
          min={0.8}
          max={1.2}
          step={0.05}
          minValue={settings.volume.min}
          maxValue={settings.volume.max}
          enabled={settings.volume.enabled}
          onMinChange={(value) => updateSettingParam('volume', 'min', value)}
          onMaxChange={(value) => updateSettingParam('volume', 'max', value)}
          onToggle={(checked) => updateSettingParam('volume', 'enabled', checked)}
        />
      </ParameterSection>
      
      {/* Trim Settings */}
      <ParameterSection title="Trim Video" icon={<Scissors className="h-5 w-5" />}>
        <ParameterSlider
          title="Trim Start (seconds)"
          min={0}
          max={5}
          step={0.5}
          minValue={settings.trimStart.min}
          maxValue={settings.trimStart.max}
          enabled={settings.trimStart.enabled}
          onMinChange={(value) => updateSettingParam('trimStart', 'min', value)}
          onMaxChange={(value) => updateSettingParam('trimStart', 'max', value)}
          onToggle={(checked) => updateSettingParam('trimStart', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Trim End (seconds)"
          min={0}
          max={5}
          step={0.5}
          minValue={settings.trimEnd.min}
          maxValue={settings.trimEnd.max}
          enabled={settings.trimEnd.enabled}
          onMinChange={(value) => updateSettingParam('trimEnd', 'min', value)}
          onMaxChange={(value) => updateSettingParam('trimEnd', 'max', value)}
          onToggle={(checked) => updateSettingParam('trimEnd', 'enabled', checked)}
        />
      </ParameterSection>
    </div>
  );
};

export default VideoProcessingPanel;
