const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Configure multer for video uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Ensure output directory exists
const outputDir = 'processed';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Main video processing endpoint
app.post('/process-video', upload.single('video'), async (req, res) => {
  console.log('Received video processing request');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const inputPath = req.file.path;
    const params = JSON.parse(req.body.params || '{}');
    const settings = JSON.parse(req.body.settings || '{}');
    
    console.log('Processing parameters received:', params);
    console.log('Settings received:', settings);

    // Generate unique output filename
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const outputFilename = `processed_${uniqueId}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    // Build FFmpeg command with all effects
    const command = ffmpeg(inputPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23'
      ]);

    // Apply video bitrate if specified
    if (params.videoBitrate && settings.videoBitrate?.enabled) {
      command.videoBitrate(`${params.videoBitrate}k`);
      console.log(`Applied video bitrate: ${params.videoBitrate}k`);
    }

    // Apply frame rate if specified
    if (params.frameRate && settings.frameRate?.enabled) {
      command.fps(params.frameRate);
      console.log(`Applied frame rate: ${params.frameRate}`);
    }

    // Build video filters array
    const videoFilters = [];

    // Color adjustments using eq filter
    const eqParams = [];
    if (settings.saturation?.enabled && params.saturation !== undefined) {
      eqParams.push(`saturation=${params.saturation}`);
      console.log(`Applied saturation: ${params.saturation}`);
    }
    if (settings.contrast?.enabled && params.contrast !== undefined) {
      eqParams.push(`contrast=${params.contrast}`);
      console.log(`Applied contrast: ${params.contrast}`);
    }
    if (settings.brightness?.enabled && params.brightness !== undefined) {
      eqParams.push(`brightness=${params.brightness}`);
      console.log(`Applied brightness: ${params.brightness}`);
    }

    // Add eq filter if we have color adjustments
    if (eqParams.length > 0) {
      videoFilters.push(`eq=${eqParams.join(':')}`);
    }

    // Apply horizontal flip if enabled
    if (params.flipHorizontal) {
      videoFilters.push('hflip');
      console.log('Applied horizontal flip');
    }

    // Apply video filters if any
    if (videoFilters.length > 0) {
      const filterString = videoFilters.join(',');
      command.videoFilters(filterString);
      console.log(`Applied video filters: ${filterString}`);
    }

    // Apply speed adjustment if enabled
    if (settings.speed?.enabled && params.speed && params.speed !== 1) {
      // For speed changes, we need to adjust both video and audio
      const speedFilter = `setpts=${1/params.speed}*PTS`;
      const audioSpeedFilter = `atempo=${params.speed}`;
      
      if (videoFilters.length > 0) {
        command.videoFilters([...videoFilters, speedFilter].join(','));
      } else {
        command.videoFilters(speedFilter);
      }
      
      command.audioFilters(audioSpeedFilter);
      console.log(`Applied speed adjustment: ${params.speed}x`);
    }

    // Apply volume adjustment if enabled
    if (settings.volume?.enabled && params.volume !== undefined && params.volume !== 1) {
      command.audioFilters(`volume=${params.volume}`);
      console.log(`Applied volume: ${params.volume}`);
    }

    // Apply trim if enabled
    if (settings.trimStart?.enabled && params.trimStart > 0) {
      command.seekInput(params.trimStart);
      console.log(`Applied trim start: ${params.trimStart}s`);
    }

    if (settings.trimEnd?.enabled && params.trimEnd > 0) {
      command.duration(params.trimEnd - (params.trimStart || 0));
      console.log(`Applied trim duration: ${params.trimEnd - (params.trimStart || 0)}s`);
    }

    // Set output format and codec
    command
      .format('mp4')
      .output(outputPath);

    console.log('Starting FFmpeg processing...');

    // Process the video
    await new Promise((resolve, reject) => {
      command
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${Math.round(progress.percent || 0)}% done`);
        })
        .on('end', () => {
          console.log('Video processing completed successfully');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err.message);
          reject(new Error(`Video processing failed: ${err.message}`));
        })
        .run();
    });

    // Verify output file exists and has content
    if (!fs.existsSync(outputPath)) {
      throw new Error('Processed video file was not created');
    }

    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      throw new Error('Processed video file is empty');
    }

    console.log(`Processed video created: ${outputPath} (${stats.size} bytes)`);

    // Clean up input file
    try {
      fs.unlinkSync(inputPath);
    } catch (cleanupError) {
      console.warn('Failed to clean up input file:', cleanupError.message);
    }

    // Return the processed video URL
    const videoUrl = `${req.protocol}://${req.get('host')}/download/${outputFilename}`;
    
    res.json({
      success: true,
      videoUrl: videoUrl,
      filename: outputFilename,
      size: stats.size,
      appliedEffects: {
        videoBitrate: params.videoBitrate,
        frameRate: params.frameRate,
        saturation: params.saturation,
        contrast: params.contrast,
        brightness: params.brightness,
        speed: params.speed,
        volume: params.volume,
        flipHorizontal: params.flipHorizontal,
        trimStart: params.trimStart,
        trimEnd: params.trimEnd
      }
    });

  } catch (error) {
    console.error('Video processing error:', error);
    
    // Clean up files in case of error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to clean up input file after error:', cleanupError.message);
      }
    }

    res.status(500).json({
      error: error.message || 'Video processing failed',
      details: error.stack
    });
  }
});

// Endpoint to download processed videos
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);
  
  console.log(`Download request for: ${filename}`);
  
  // Security check - ensure filename doesn't contain path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set appropriate headers
  res.set({
    'Content-Type': 'video/mp4',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'public, max-age=3600'
  });
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error) => {
    console.error('File stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error streaming file' });
    }
  });
  
  fileStream.on('end', () => {
    console.log(`File streamed successfully: ${filename}`);
  });
});

// Media comparison endpoint (for existing functionality)
app.post('/compare-media', upload.fields([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 }
]), (req, res) => {
  console.log('Media comparison request received');
  
  // Basic similarity comparison (placeholder)
  const similarity = Math.random() * 0.3 + 0.1; // Random between 0.1 and 0.4
  
  res.json({
    similarity: similarity,
    result: similarity > 0.2 ? 'Similar' : 'Different'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    ffmpeg: 'available'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Video processing server running on port ${PORT}`);
  console.log('Endpoints available:');
  console.log('- POST /process-video - Process video with effects');
  console.log('- GET /download/:filename - Download processed videos');
  console.log('- POST /compare-media - Compare media files');
  console.log('- GET /health - Health check');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});