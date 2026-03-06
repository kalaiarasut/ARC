import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Slider,
  CircularProgress,
  Paper,
  Portal,
  Fade,
} from '@mui/material';
import {
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';

/**
 * ImageZoom Component
 * Provides a click-to-zoom lightbox effect for images.
 */
export const ImageZoom: React.FC<{ src: string; alt?: string }> = ({ src, alt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((s) => Math.min(s + 0.5, 5));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale((s) => Math.max(s - 0.5, 1));
  };

  const resetState = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleOpen = () => {
    if (isOpen) resetState();
    setIsOpen(!isOpen);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale === 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <>
      <Box
        onClick={toggleOpen}
        sx={{
          cursor: 'zoom-in',
          width: '100%',
          height: 150,
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'transform 0.2s',
          '&:hover': { transform: 'scale(1.02)' },
        }}
      >
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Box>

      {isOpen && (
        <Portal>
          <Fade in={isOpen}>
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                bgcolor: 'rgba(0,0,0,0.9)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
              onClick={toggleOpen}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Controls */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  display: 'flex',
                  gap: 1,
                  zIndex: 10001,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <IconButton onClick={handleZoomIn} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                  <ZoomInIcon />
                </IconButton>
                <IconButton onClick={handleZoomOut} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                  <ZoomOutIcon />
                </IconButton>
                <IconButton
                  href={src}
                  download
                  target="_blank"
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton onClick={toggleOpen} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <Box
                component="img"
                src={src}
                alt={alt}
                sx={{
                  maxHeight: '90vh',
                  maxWidth: '90vw',
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.2s',
                  userSelect: 'none',
                  pointerEvents: 'none', // Allow dragging on parent
                }}
              />
            </Box>
          </Fade>
        </Portal>
      )}
    </>
  );
};

/**
 * AudioWaveform Component
 * Decodes audio and draws a waveform on canvas.
 */
export const AudioWaveform: React.FC<{ src: string }> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [waveform, setWaveform] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Decode audio for waveform
  useEffect(() => {
    const loadWaveform = async () => {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        const rawData = audioBuffer.getChannelData(0);
        const samples = 120; // Number of bars
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];
        
        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum = sum + Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }
        
        const multiplier = Math.pow(Math.max(...filteredData), -1);
        setWaveform(filteredData.map(n => n * multiplier));
        setLoading(false);
      } catch (err) {
        console.error('Failed to load waveform:', err);
        setLoading(false);
      }
    };

    loadWaveform();
  }, [src]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || waveform.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveform.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, width, height);
    
    waveform.forEach((val, i) => {
      const x = i * barWidth;
      const h = val * height * 0.8;
      const barX = x + 1;
      const barW = barWidth - 2;
      const barY = (height - h) / 2;

      // Color based on play progress
      const color = (i / waveform.length) <= progress ? '#2196f3' : '#e0e0e0';
      ctx.fillStyle = color;
      
      // Rounded rect-ish
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, h, 2);
      ctx.fill();
    });
  }, [waveform, currentTime, duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (_: any, newValue: number | number[]) => {
    if (audioRef.current) {
      const time = newValue as number;
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      
      <Box display="flex" alignItems="center" gap={2}>
        <IconButton
          onClick={togglePlay}
          disabled={loading}
          sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>

        <Box flexGrow={1} position="relative" height={40}>
          {loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <CircularProgress size={20} />
            </Box>
          ) : (
            <canvas
              ref={canvasRef}
              width={400}
              height={40}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          )}
        </Box>

        <Typography variant="caption" fontFamily="monospace" sx={{ minWidth: 80, textAlign: 'right' }}>
          {new Date(currentTime * 1000).toISOString().substr(14, 5)} / 
          {new Date(duration * 1000).toISOString().substr(14, 5)}
        </Typography>
      </Box>

      {!loading && (
        <Slider
          size="small"
          value={currentTime}
          max={duration || 100}
          onChange={handleSeek}
          sx={{ mt: 1 }}
        />
      )}
    </Paper>
  );
};

/**
 * VideoPreview Component
 * Styled video player with fullscreen capability.
 */
export const VideoPreview: React.FC<{ src: string }> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <Box position="relative">
      <Box
        component="video"
        ref={videoRef}
        src={src}
        controls
        sx={{
          width: '100%',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'black',
        }}
      />
      <IconButton
        onClick={handleFullscreen}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          bgcolor: 'rgba(0,0,0,0.5)',
          color: 'white',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
        }}
      >
        <FullscreenIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
