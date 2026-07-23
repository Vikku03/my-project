/**
 * Utility functions for handling photo and video formats, embeds, and detection
 */

export function detectFormat(filenameOrUrl: string, isVideo: boolean = false): string {
  if (!filenameOrUrl) return isVideo ? 'MP4' : 'JPEG';
  const clean = filenameOrUrl.trim().toLowerCase();

  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'YOUTUBE';
  if (clean.includes('vimeo.com')) return 'VIMEO';
  if (clean.includes('drive.google.com')) return 'GDRIVE';

  const ext = clean.split('.').pop()?.split('?')[0]?.toUpperCase();
  
  if (isVideo) {
    if (['MP4', 'MOV', 'WEBM', 'M4V', 'AVI', 'MKV', 'FLV', '3GP'].includes(ext || '')) {
      return ext!;
    }
    return 'MP4';
  } else {
    if (['JPEG', 'JPG', 'PNG', 'WEBP', 'HEIC', 'RAW', 'CR2', 'NEF', 'ARW', 'TIFF', 'GIF', 'SVG'].includes(ext || '')) {
      return ext === 'JPG' ? 'JPEG' : ext!;
    }
    return 'JPEG';
  }
}

export function getEmbedVideoUrl(url: string): { isDirectVideo: boolean; url: string } {
  if (!url) return { isDirectVideo: false, url: '' };
  const cleanUrl = url.trim();

  // 1. YouTube URLs
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let videoId = '';
    if (cleanUrl.includes('watch?v=')) {
      videoId = cleanUrl.split('watch?v=')[1]?.split('&')[0];
    } else if (cleanUrl.includes('embed/')) {
      videoId = cleanUrl.split('embed/')[1]?.split('?')[0];
    } else if (cleanUrl.includes('youtu.be/')) {
      videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0];
    }
    if (videoId) {
      return { isDirectVideo: false, url: `https://www.youtube.com/embed/${videoId}` };
    }
  }

  // 2. Vimeo URLs
  if (cleanUrl.includes('vimeo.com')) {
    const parts = cleanUrl.split('vimeo.com/');
    const vimeoId = parts[1]?.split('?')[0]?.replace('video/', '');
    if (vimeoId && !isNaN(Number(vimeoId))) {
      return { isDirectVideo: false, url: `https://player.vimeo.com/video/${vimeoId}` };
    }
  }

  // 3. Google Drive URLs
  if (cleanUrl.includes('drive.google.com')) {
    if (cleanUrl.includes('/file/d/')) {
      const fileId = cleanUrl.split('/file/d/')[1]?.split('/')[0];
      if (fileId) {
        return { isDirectVideo: false, url: `https://drive.google.com/file/d/${fileId}/preview` };
      }
    }
  }

  // 4. Amazon S3 Direct URLs - Route through authenticated S3 Proxy Streamer for guaranteed video playback & HTTP 206 range support
  if (cleanUrl.includes('.s3.') && cleanUrl.includes('amazonaws.com')) {
    try {
      const urlObj = new URL(cleanUrl);
      const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
      if (key) {
        return { isDirectVideo: true, url: `/api/media/s3-proxy?key=${encodeURIComponent(key)}` };
      }
    } catch (e) {
      // Ignore URL parse error and fall back
    }
  }

  // 5. All other direct video streams (local stream, blob:, data:, mp4/mov/webm file URLs)
  return { isDirectVideo: true, url: cleanUrl };
}

/**
 * Resolves any image URL (AWS S3, local stream, Google Drive, blob, base64, Unsplash)
 * to a browser-accessible, authenticated image stream route if stored in AWS S3.
 */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  const cleanUrl = url.trim();

  // 1. Amazon S3 Direct URLs -> Route through authenticated S3 Proxy Streamer so private S3 photos load seamlessly without 403 / CORS
  if (cleanUrl.includes('.s3.') && cleanUrl.includes('amazonaws.com')) {
    try {
      const urlObj = new URL(cleanUrl);
      const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
      if (key) {
        return `/api/media/s3-proxy?key=${encodeURIComponent(key)}`;
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  // 2. Google Drive image direct view
  if (cleanUrl.includes('drive.google.com/file/d/')) {
    const fileId = cleanUrl.split('/file/d/')[1]?.split('/')[0];
    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return cleanUrl;
}

export function generateVideoThumbnail(srcUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!srcUrl) return resolve('');
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    video.onloadeddata = () => {
      video.currentTime = 0.5;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          cleanup();
          return resolve(dataUrl);
        }
      } catch (e) {
        console.warn('Error generating video thumbnail:', e);
      }
      cleanup();
      resolve('');
    };

    video.onerror = () => {
      cleanup();
      resolve('');
    };

    video.src = srcUrl;

    setTimeout(() => {
      cleanup();
      resolve('');
    }, 2500);
  });
}

