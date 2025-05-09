
import React from 'react';
import { VideoPresetSettings } from '@/types/preset';
import ParameterSlider from '@/components/ParameterSlider';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ParameterSection from './ParameterSection';
import { 
  Video, 
  Volume, 
  Sliders, 
  Gauge, 
  Contrast, 
  Sun, 
  CircleDashed, 
  Zap, 
  RotateCw, 
  FlipHorizontal, 
  Crop, 
  Star, 
  Image as ImageIcon,
  Scissors,
  FastForward,
  ZoomIn,
  AudioWaveform,
  Grid3X3
} from 'lucide-react';

interface VideoProcessingPanelProps {
  settings: VideoPresetSettings;
  updateSettingParam: (param: keyof VideoPresetSettings, subParam: string, value: any) => void;
  updateWatermarkParam: (param: string, value: any) => void;
}

const VideoProcessingPanel: React.FC<VideoProcessingPanelProps> = ({
  settings,
  updateSettingParam,
  updateWatermarkParam
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Video Quality Section */}
      <ParameterSection title="Video Quality" icon={<Video className="h-5 w-5" />}>
        <ParameterSlider
          title="Video Bitrate"
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
          title="Audio Bitrate"
          min={64}
          max={320}
          step={8}
          minValue={settings.audioBitrate.min}
          maxValue={settings.audioBitrate.max}
          enabled={settings.audioBitrate.enabled}
          onMinChange={(value) => updateSettingParam('audioBitrate', 'min', value)}
          onMaxChange={(value) => updateSettingParam('audioBitrate', 'max', value)}
          onToggle={(checked) => updateSettingParam('audioBitrate', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Framerate"
          min={24}
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
        
        <ParameterSlider
          title="Gamma"
          min={0.7}
          max={1.3}
          step={0.05}
          minValue={settings.gamma.min}
          maxValue={settings.gamma.max}
          enabled={settings.gamma.enabled}
          onMinChange={(value) => updateSettingParam('gamma', 'min', value)}
          onMaxChange={(value) => updateSettingParam('gamma', 'max', value)}
          onToggle={(checked) => updateSettingParam('gamma', 'enabled', checked)}
        />
      </ParameterSection>

      {/* Effects Section */}
      <ParameterSection title="Visual Effects" icon={<Gauge className="h-5 w-5" />}>
        <ParameterSlider
          title="Vignette"
          min={0}
          max={0.8}
          step={0.05}
          minValue={settings.vignette.min}
          maxValue={settings.vignette.max}
          enabled={settings.vignette.enabled}
          onMinChange={(value) => updateSettingParam('vignette', 'min', value)}
          onMaxChange={(value) => updateSettingParam('vignette', 'max', value)}
          onToggle={(checked) => updateSettingParam('vignette', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Noise"
          min={0}
          max={0.1}
          step={0.01}
          minValue={settings.noise.min}
          maxValue={settings.noise.max}
          enabled={settings.noise.enabled}
          onMinChange={(value) => updateSettingParam('noise', 'min', value)}
          onMaxChange={(value) => updateSettingParam('noise', 'max', value)}
          onToggle={(checked) => updateSettingParam('noise', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Waveform Shift"
          min={0}
          max={5}
          step={0.5}
          minValue={settings.waveformShift.min}
          maxValue={settings.waveformShift.max}
          enabled={settings.waveformShift.enabled}
          onMinChange={(value) => updateSettingParam('waveformShift', 'min', value)}
          onMaxChange={(value) => updateSettingParam('waveformShift', 'max', value)}
          onToggle={(checked) => updateSettingParam('waveformShift', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Pixel Shift"
          min={0}
          max={5}
          step={0.5}
          minValue={settings.pixelShift.min}
          maxValue={settings.pixelShift.max}
          enabled={settings.pixelShift.enabled}
          onMinChange={(value) => updateSettingParam('pixelShift', 'min', value)}
          onMaxChange={(value) => updateSettingParam('pixelShift', 'max', value)}
          onToggle={(checked) => updateSettingParam('pixelShift', 'enabled', checked)}
        />
      </ParameterSection>
      
      {/* Transformations */}
      <ParameterSection title="Speed & Zoom" icon={<FastForward className="h-5 w-5" />}>
        <ParameterSlider
          title="Speed"
          min={0.5}
          max={2.0}
          step={0.05}
          minValue={settings.speed.min}
          maxValue={settings.speed.max}
          enabled={settings.speed.enabled}
          onMinChange={(value) => updateSettingParam('speed', 'min', value)}
          onMaxChange={(value) => updateSettingParam('speed', 'max', value)}
          onToggle={(checked) => updateSettingParam('speed', 'enabled', checked)}
        />
        
        <ParameterSlider
          title="Zoom"
          min={0.9}
          max={1.2}
          step={0.05}
          minValue={settings.zoom.min}
          maxValue={settings.zoom.max}
          enabled={settings.zoom.enabled}
          onMinChange={(value) => updateSettingParam('zoom', 'min', value)}
          onMaxChange={(value) => updateSettingParam('zoom', 'max', value)}
          onToggle={(checked) => updateSettingParam('zoom', 'enabled', checked)}
        />
      </ParameterSection>
      
      {/* Audio */}
      <ParameterSection title="Audio Settings" icon={<Volume className="h-5 w-5" />}>
        <ParameterSlider
          title="Volume"
          min={0.5}
          max={1.5}
          step={0.05}
          minValue={settings.volume.min}
          maxValue={settings.volume.max}
          enabled={settings.volume.enabled}
          onMinChange={(value) => updateSettingParam('volume', 'min', value)}
          onMaxChange={(value) => updateSettingParam('volume', 'max', value)}
          onToggle={(checked) => updateSettingParam('volume', 'enabled', checked)}
        />
      </ParameterSection>
      
      {/* Rotation & Flip */}
      <ParameterSection title="Rotation & Flip" icon={<RotateCw className="h-5 w-5" />}>
        <ParameterSlider
          title="Rotation"
          min={-10}
          max={10}
          step={0.5}
          minValue={settings.rotation.min}
          maxValue={settings.rotation.max}
          enabled={settings.rotation.enabled}
          onMinChange={(value) => updateSettingParam('rotation', 'min', value)}
          onMaxChange={(value) => updateSettingParam('rotation', 'max', value)}
          onToggle={(checked) => updateSettingParam('rotation', 'enabled', checked)}
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
      
      {/* Size & Trim */}
      <ParameterSection title="Size & Trim" icon={<Crop className="h-5 w-5" />}>
        <div className="space-y-2">
          <Label htmlFor="pixel-size">Pixel Size (e.g. 1280x720)</Label>
          <Input 
            id="pixel-size"
            value={settings.pixelSize} 
            onChange={(e) => updateSettingParam('pixelSize', '', e.target.value)}
            placeholder="width x height"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="random-pixel-size" 
            checked={settings.randomPixelSize} 
            onCheckedChange={(checked) => updateSettingParam('randomPixelSize', '', !!checked)}
          />
          <Label htmlFor="random-pixel-size">Random Pixel Size (9:16 only)</Label>
        </div>
        
        <ParameterSlider
          title="Trim Start (seconds)"
          min={0}
          max={10}
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
          max={10}
          step={0.5}
          minValue={settings.trimEnd.min}
          maxValue={settings.trimEnd.max}
          enabled={settings.trimEnd.enabled}
          onMinChange={(value) => updateSettingParam('trimEnd', 'min', value)}
          onMaxChange={(value) => updateSettingParam('trimEnd', 'max', value)}
          onToggle={(checked) => updateSettingParam('trimEnd', 'enabled', checked)}
        />
      </ParameterSection>
      
      {/* Special Features */}
      <ParameterSection title="Special Features" icon={<Star className="h-5 w-5" />}>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="us-metadata" 
            checked={settings.usMetadata} 
            onCheckedChange={(checked) => updateSettingParam('usMetadata', '', !!checked)}
          />
          <Label htmlFor="us-metadata">US Metadata</Label>
        </div>
        
        <ParameterSlider
          title="Blurred Border"
          min={0}
          max={100}
          step={5}
          minValue={settings.blurredBorder.min}
          maxValue={settings.blurredBorder.max}
          enabled={settings.blurredBorder.enabled}
          onMinChange={(value) => updateSettingParam('blurredBorder', 'min', value)}
          onMaxChange={(value) => updateSettingParam('blurredBorder', 'max', value)}
          onToggle={(checked) => updateSettingParam('blurredBorder', 'enabled', checked)}
        />
      </ParameterSection>
      
      {/* Watermark */}
      <ParameterSection title="Watermark" icon={<ImageIcon className="h-5 w-5" />}>
        <div className="flex items-center space-x-2 mb-3">
          <Checkbox 
            id="watermark-enabled" 
            checked={settings.watermark.enabled} 
            onCheckedChange={(checked) => updateWatermarkParam('enabled', !!checked)}
          />
          <Label htmlFor="watermark-enabled">Apply Watermark</Label>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="watermark-size">Size (pixels)</Label>
            <Input 
              id="watermark-size"
              type="number" 
              value={settings.watermark.size} 
              onChange={(e) => updateWatermarkParam('size', parseInt(e.target.value) || 0)}
              disabled={!settings.watermark.enabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="watermark-opacity">Opacity (0-1)</Label>
            <Input 
              id="watermark-opacity"
              type="number" 
              min="0" 
              max="1" 
              step="0.1"
              value={settings.watermark.opacity} 
              onChange={(e) => updateWatermarkParam('opacity', parseFloat(e.target.value) || 0)}
              disabled={!settings.watermark.enabled}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="watermark-x">X Position (0-1)</Label>
              <Input 
                id="watermark-x"
                type="number" 
                min="0" 
                max="1" 
                step="0.1"
                value={settings.watermark.x} 
                onChange={(e) => updateWatermarkParam('x', parseFloat(e.target.value) || 0)}
                disabled={!settings.watermark.enabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="watermark-y">Y Position (0-1)</Label>
              <Input 
                id="watermark-y"
                type="number" 
                min="0" 
                max="1" 
                step="0.1"
                value={settings.watermark.y} 
                onChange={(e) => updateWatermarkParam('y', parseFloat(e.target.value) || 0)}
                disabled={!settings.watermark.enabled}
              />
            </div>
          </div>
        </div>
      </ParameterSection>
    </div>
  );
};

export default VideoProcessingPanel;
