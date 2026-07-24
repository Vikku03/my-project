import express from 'express';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { createServer as createViteServer } from 'vite';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Ensure local uploads directory exists for fallback storage
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp4': return 'video/mp4';
    case '.webm': return 'video/webm';
    case '.mov': return 'video/quicktime';
    case '.m4v': return 'video/mp4';
    case '.avi': return 'video/x-msvideo';
    case '.mkv': return 'video/x-matroska';
    case '.3gp': return 'video/3gpp';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    case '.gif': return 'image/gif';
    case '.heic': return 'image/heic';
    case '.avif': return 'image/avif';
    case '.svg': return 'image/svg+xml';
    case '.bmp': return 'image/bmp';
    case '.tiff': return 'image/tiff';
    default: return 'application/octet-stream';
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, '0.0.0.0');
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (!(await isPortAvailable(port))) {
    port += 1;
  }
  return port;
}

async function startServer() {
  const app = express();
  const requestedPort = Number(process.env.PORT) || 3000;
  const PORT = await findAvailablePort(requestedPort);

  // JSON and UrlEncoded body parsers (large limit for video/photo uploads)
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ extended: true, limit: '200mb' }));

  // Serve static files from uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // Helper to get initialized AWS S3 Client
  const getS3Config = () => {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    const bucketName = process.env.AWS_S3_BUCKET_NAME || '';

    const isConfigured = Boolean(
      accessKeyId && accessKeyId !== 'your-aws-access-key-id' &&
      secretAccessKey && secretAccessKey !== 'your-aws-secret-access-key' &&
      bucketName
    );

    return {
      region,
      accessKeyId,
      secretAccessKey,
      bucketName,
      isConfigured
    };
  };

  const getS3Client = () => {
    const config = getS3Config();
    if (!config.isConfigured) return null;

    return new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
  };

  // --- API ROUTES ---

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. AWS S3 Configuration Status
  app.get('/api/s3/status', (req, res) => {
    const config = getS3Config();
    res.json({
      configured: config.isConfigured,
      bucketName: config.bucketName ? `${config.bucketName.substring(0, 4)}***` : 'Not Set',
      region: config.region,
      hasAccessKey: Boolean(config.accessKeyId && config.accessKeyId !== 'your-aws-access-key-id'),
      hasSecretKey: Boolean(config.secretAccessKey && config.secretAccessKey !== 'your-aws-secret-access-key'),
      message: config.isConfigured 
        ? 'AWS S3 Cloud Storage is active and ready for video/photo streaming.' 
        : 'AWS S3 Cloud Storage credentials standby. Videos and photos are stored locally with high-speed HTTP 206 streaming.'
    });
  });

  // 3. Generate Presigned Upload URL for AWS S3
  app.post('/api/s3/upload-url', async (req, res) => {
    try {
      const { fileName, fileType, folder = 'gk-media' } = req.body;
      if (!fileName || !fileType) {
        return res.status(400).json({ error: 'fileName and fileType are required' });
      }

      const config = getS3Config();
      const s3 = getS3Client();

      const fileKey = `${folder}/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      if (s3 && config.isConfigured) {
        try {
          const command = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: fileKey,
            ContentType: fileType,
          });

          const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
          const publicUrl = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`;

          return res.json({
            success: true,
            mode: 's3',
            uploadUrl,
            publicUrl,
            fileKey,
            bucket: config.bucketName
          });
        } catch (s3Err: any) {
          console.warn('S3 Presigned URL error, falling back to local:', s3Err?.message || s3Err);
        }
      }

      return res.json({
        success: true,
        mode: 'local_fallback',
        uploadUrl: '/api/s3/upload-direct',
        publicUrl: '',
        fileKey,
        message: 'S3 standby. Local upload active.'
      });
    } catch (err: any) {
      console.error('S3 Presigned URL Error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate S3 upload URL' });
    }
  });

  // 4. Direct Upload Endpoint (base64 -> AWS S3 OR local disk for streaming)
  app.post('/api/s3/upload-direct', async (req, res) => {
    try {
      const { fileName, fileType, fileData, folder = 'gk-media' } = req.body;
      if (!fileName || !fileData) {
        return res.status(400).json({ error: 'fileName and fileData are required' });
      }

      const config = getS3Config();
      const s3 = getS3Client();
      const sanitizedName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fileKey = `${folder}/${sanitizedName}`;

      // Clean base64 header
      const base64Data = fileData.replace(/^data:(image|video|application)\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      if (s3 && config.isConfigured) {
        try {
          await s3.send(new PutObjectCommand({
            Bucket: config.bucketName,
            Key: fileKey,
            Body: buffer,
            ContentType: fileType || 'image/jpeg'
          }));

          const publicUrl = `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`;

          return res.json({
            success: true,
            mode: 's3',
            publicUrl,
            fileKey
          });
        } catch (s3Err: any) {
          console.warn('AWS S3 PutObject error, gracefully falling back to local disk storage:', s3Err?.message || s3Err);
        }
      }

      // Save file to local disk for HTTP 206 range video streaming
      const localFilePath = path.join(uploadsDir, sanitizedName);
      fs.writeFileSync(localFilePath, buffer);

      const streamUrl = `/api/media/stream/${sanitizedName}`;

      return res.json({
        success: true,
        mode: 'local_fallback',
        publicUrl: streamUrl,
        fileKey: sanitizedName
      });
    } catch (err: any) {
      console.error('S3 Direct Upload Error:', err);
      res.status(500).json({ error: err.message || 'Failed to process file upload' });
    }
  });

  // 5. HTTP 206 Range Request Video & Photo Streaming Route
  app.get('/api/media/stream/:filename', (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(uploadsDir, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const mimeType = getMimeType(filePath);
      const range = req.headers.range;

      if (range && mimeType.startsWith('video/')) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mimeType,
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (err: any) {
      console.error('Stream Error:', err);
      res.status(500).json({ error: 'Failed to stream media' });
    }
  });

  // 6. High-Speed Authenticated AWS S3 Stream Proxy Route (Supports HTTP 206 Range Requests for MP4/MOV)
  app.get('/api/media/s3-proxy', async (req, res) => {
    try {
      const fileKey = req.query.key as string;
      if (!fileKey) {
        return res.status(400).json({ error: 'Missing key parameter' });
      }

      const config = getS3Config();
      const s3 = getS3Client();

      if (s3 && config.isConfigured) {
        try {
          const rangeHeader = req.headers.range;
          const command = new GetObjectCommand({
            Bucket: config.bucketName,
            Key: fileKey,
            Range: rangeHeader
          });

          const response = await s3.send(command);

          if (response.ContentRange) {
            res.setHeader('Content-Range', response.ContentRange);
          }
          if (response.AcceptRanges) {
            res.setHeader('Accept-Ranges', response.AcceptRanges);
          }
          if (response.ContentLength) {
            res.setHeader('Content-Length', response.ContentLength);
          }
          if (response.ContentType) {
            res.setHeader('Content-Type', response.ContentType);
          } else {
            res.setHeader('Content-Type', getMimeType(fileKey));
          }
          res.setHeader('Cache-Control', 'public, max-age=86400');

          const statusCode = response.$metadata.httpStatusCode || (rangeHeader ? 206 : 200);
          res.status(statusCode);

          if (response.Body) {
            (response.Body as any).pipe(res);
          } else {
            res.end();
          }
          return;
        } catch (s3Err: any) {
          console.warn('S3 proxy streaming error, attempting local fallback:', s3Err?.message || s3Err);
        }
      }

      // Fallback if S3 not configured or S3 command failed: check local file
      const localFilename = path.basename(fileKey);
      const localFilePath = path.join(uploadsDir, localFilename);
      if (fs.existsSync(localFilePath)) {
        return res.redirect(`/api/media/stream/${localFilename}`);
      }

      return res.status(404).json({ error: 'S3 object or local media file not found' });
    } catch (err: any) {
      console.error('S3 Proxy Stream Error:', err);
      const fileKey = req.query.key as string;
      if (fileKey) {
        const localFilename = path.basename(fileKey);
        const localFilePath = path.join(uploadsDir, localFilename);
        if (fs.existsSync(localFilePath)) {
          return res.redirect(`/api/media/stream/${localFilename}`);
        }
      }
      res.status(500).json({ error: 'Failed to stream media from AWS S3' });
    }
  });

  // 6. Delete Object from AWS S3 or local storage
  app.post('/api/s3/delete', async (req, res) => {
    try {
      let { fileKey } = req.body;
      if (!fileKey) {
        return res.status(400).json({ error: 'fileKey is required' });
      }

      // Extract raw fileKey if full URL or proxy URL was sent
      if (typeof fileKey === 'string') {
        if (fileKey.includes('/api/media/s3-proxy?key=')) {
          fileKey = decodeURIComponent(fileKey.split('key=')[1].split('&')[0]);
        } else if (fileKey.includes('/api/media/stream/')) {
          fileKey = decodeURIComponent(fileKey.split('/api/media/stream/')[1].split('?')[0]);
        } else if (fileKey.includes('.s3.') && fileKey.includes('amazonaws.com')) {
          try {
            const urlObj = new URL(fileKey);
            const pathKey = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
            fileKey = decodeURIComponent(pathKey);
          } catch (e) {
            // Ignore parse error
          }
        }
      }

      const config = getS3Config();
      const s3 = getS3Client();

      let s3Deleted = false;
      if (s3 && config.isConfigured) {
        try {
          await s3.send(new DeleteObjectCommand({
            Bucket: config.bucketName,
            Key: fileKey
          }));
          s3Deleted = true;
        } catch (s3Err) {
          console.warn('S3 DeleteObjectCommand warning:', s3Err?.message || s3Err);
        }
      }

      // Also clean up local file if present
      const localFilename = path.basename(fileKey);
      const localFilePath = path.join(uploadsDir, localFilename);
      if (fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
        } catch (unlinkErr) {
          console.error('Local file unlink error:', unlinkErr);
        }
      }

      return res.json({ 
        success: true, 
        mode: s3Deleted ? 's3' : 'local_fallback', 
        message: `Deleted ${fileKey} successfully` 
      });
    } catch (err: any) {
      console.error('S3 Delete Error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete S3 object' });
    }
  });

  // 7. List Objects in S3 Bucket or Local Uploads
  app.get('/api/s3/list', async (req, res) => {
    try {
      const folder = (req.query.folder as string) || 'gk-media';
      const config = getS3Config();
      const s3 = getS3Client();

      if (s3 && config.isConfigured) {
        try {
          const response = await s3.send(new ListObjectsV2Command({
            Bucket: config.bucketName,
            Prefix: folder
          }));

          const items = (response.Contents || []).map(obj => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            url: `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${obj.Key}`
          }));

          return res.json({ success: true, items });
        } catch (s3Err: any) {
          console.warn('S3 ListObjectsV2 warning, falling back to local files:', s3Err?.message || s3Err);
        }
      }

      // Return local uploaded files
      const localFiles = fs.readdirSync(uploadsDir).map(file => {
        const stat = fs.statSync(path.join(uploadsDir, file));
        return {
          key: file,
          size: stat.size,
          lastModified: stat.mtime,
          url: `/api/media/stream/${file}`
        };
      });

      return res.json({ success: true, items: localFiles });
    } catch (err: any) {
      console.error('S3 List Error:', err);
      res.status(500).json({ error: err.message || 'Failed to list S3 objects' });
    }
  });

  // Stream reader helper for S3 GetObject
  async function streamToString(stream: any): Promise<string> {
    if (typeof stream?.transformToString === 'function') {
      return await stream.transformToString();
    }
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err: any) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  }

  // 8. Save User Client Accounts & Project Details to AWS S3
  app.post('/api/s3/users/save', async (req, res) => {
    try {
      const { projects } = req.body;
      if (!Array.isArray(projects)) {
        return res.status(400).json({ error: 'projects array is required' });
      }

      const jsonContent = JSON.stringify(projects, null, 2);
      const config = getS3Config();
      const s3 = getS3Client();

      let s3Saved = false;
      if (s3 && config.isConfigured) {
        try {
          // Save master user projects index in AWS S3
          await s3.send(new PutObjectCommand({
            Bucket: config.bucketName,
            Key: 'gk-data/users_projects.json',
            Body: jsonContent,
            ContentType: 'application/json'
          }));

          // Save individual user profile JSON files in AWS S3 (gk-users/client-<id>.json)
          for (const proj of projects) {
            const clientKey = `gk-users/client-${proj.id}.json`;
            await s3.send(new PutObjectCommand({
              Bucket: config.bucketName,
              Key: clientKey,
              Body: JSON.stringify(proj, null, 2),
              ContentType: 'application/json'
            }));
          }
          s3Saved = true;
        } catch (s3Err) {
          console.error('S3 User Save Error:', s3Err);
        }
      }

      // Save local fallback JSON
      const localUsersPath = path.join(uploadsDir, 'users_projects.json');
      if (!s3Saved) {
        const existingContent = fs.existsSync(localUsersPath)
          ? fs.readFileSync(localUsersPath, 'utf8')
          : '';
        if (existingContent !== jsonContent) {
          fs.writeFileSync(localUsersPath, jsonContent, 'utf8');
        }
      }

      return res.json({
        success: true,
        mode: s3Saved ? 's3' : 'local_fallback',
        count: projects.length,
        savedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Save Users API Error:', err);
      res.status(500).json({ error: err.message || 'Failed to save user details to AWS S3' });
    }
  });

  // 9. Load User Client Accounts & Project Details from AWS S3
  app.get('/api/s3/users/load', async (req, res) => {
    try {
      const config = getS3Config();
      const s3 = getS3Client();

      if (s3 && config.isConfigured) {
        try {
          const response = await s3.send(new GetObjectCommand({
            Bucket: config.bucketName,
            Key: 'gk-data/users_projects.json'
          }));

          if (response.Body) {
            const rawStr = await streamToString(response.Body);
            const projects = JSON.parse(rawStr);
            if (Array.isArray(projects)) {
              return res.json({ success: true, projects, source: 's3' });
            }
          }
        } catch (s3Err) {
          console.warn('Could not load users from S3, checking local fallback:', s3Err);
        }
      }

      // Check local fallback
      const localUsersPath = path.join(uploadsDir, 'users_projects.json');
      if (fs.existsSync(localUsersPath)) {
        const content = fs.readFileSync(localUsersPath, 'utf8');
        const projects = JSON.parse(content);
        if (Array.isArray(projects)) {
          return res.json({ success: true, projects, source: 'local' });
        }
      }

      return res.json({ success: true, projects: null, source: 'none' });
    } catch (err: any) {
      console.error('Load Users API Error:', err);
      res.status(500).json({ error: err.message || 'Failed to load user details from AWS S3' });
    }
  });

  // --- VITE / STATIC SERVING MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const hmrPort = await findAvailablePort(PORT + 1);
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: hmrPort } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
