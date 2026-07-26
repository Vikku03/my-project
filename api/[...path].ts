import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type VercelRequest = {
  method?: string;
  url?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (value: unknown) => void;
  setHeader: (name: string, value: string | number) => void;
  statusCode: number;
  end: (data?: unknown) => void;
};

type S3Config = {
  region: string;
  bucketName: string;
  configured: boolean;
  client: S3Client | null;
};

function getS3Config(): S3Config {
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucketName = process.env.AWS_S3_BUCKET_NAME || '';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
  const configured = Boolean(bucketName && accessKeyId && secretAccessKey);

  return {
    region,
    bucketName,
    configured,
    client: configured
      ? new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
      : null,
  };
}

function getPath(req: VercelRequest): string {
  return (req.url || '').split('?')[0].replace(/^\/api\/?/, '').replace(/\/$/, '');
}

function getQueryValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function getBody(req: VercelRequest): Record<string, any> {
  if (req.body && typeof req.body === 'object') return req.body as Record<string, any>;
  if (typeof req.body === 'string' && req.body) return JSON.parse(req.body);
  return {};
}

function mediaUrl(fileKey: string): string {
  return `/api/media/s3-proxy?key=${encodeURIComponent(fileKey)}`;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

async function streamToString(stream: any): Promise<string> {
  if (typeof stream?.transformToString === 'function') return stream.transformToString();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const config = getS3Config();
  const path = getPath(req);
  const method = req.method || 'GET';

  console.log("req.url =", req.url);
  console.log("req.query =", req.query);

  try {
    if (path === 'health' && method === 'GET') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (path === 's3/status' && method === 'GET') {
      return res.json({
        configured: config.configured,
        bucketName: config.bucketName ? `${config.bucketName.substring(0, 4)}***` : 'Not Set',
        region: config.region,
        hasAccessKey: Boolean(process.env.AWS_ACCESS_KEY_ID),
        hasSecretKey: Boolean(process.env.AWS_SECRET_ACCESS_KEY),
        message: config.configured
          ? 'AWS S3 Cloud Storage is active and ready for video/photo streaming.'
          : 'AWS S3 credentials are not configured.',
      });
    }

    if (path === 's3/upload-url' && method === 'POST') {
      const { fileName, fileType = 'application/octet-stream', folder = 'gk-media' } = getBody(req);
      if (!fileName) return res.status(400).json({ error: 'fileName is required' });
      if (!config.client) return res.status(503).json({ error: 'AWS S3 is not configured' });

      const fileKey = `${folder}/${Date.now()}-${sanitizeFileName(fileName)}`;
      const uploadUrl = await getSignedUrl(
        config.client,
        new PutObjectCommand({ Bucket: config.bucketName, Key: fileKey, ContentType: fileType }),
        { expiresIn: 900 },
      );

      return res.json({ success: true, mode: 's3', uploadUrl, publicUrl: mediaUrl(fileKey), fileKey });
    }

    if (path === 's3/delete' && method === 'POST') {
      const { fileKey } = getBody(req);
      if (!fileKey) return res.status(400).json({ error: 'fileKey is required' });
      if (!config.client) return res.status(503).json({ error: 'AWS S3 is not configured' });

      await config.client.send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: fileKey }));
      return res.json({ success: true, mode: 's3', message: `Deleted ${fileKey} successfully` });
    }

    if (path === 's3/list' && method === 'GET') {
      if (!config.client) return res.json({ success: true, items: [] });
      const folder = getQueryValue(req.query.folder) || 'gk-media';
      const response = await config.client.send(new ListObjectsV2Command({ Bucket: config.bucketName, Prefix: folder }));
      const items = (response.Contents || []).map((object) => ({
        key: object.Key,
        size: object.Size,
        lastModified: object.LastModified,
        url: object.Key ? mediaUrl(object.Key) : '',
      }));
      return res.json({ success: true, items });
    }

    if (path === 'media/s3-proxy' && method === 'GET') {
      const fileKey = getQueryValue(req.query.key);
      if (!fileKey) return res.status(400).json({ error: 'Missing key parameter' });
      if (!config.client) return res.status(503).json({ error: 'AWS S3 is not configured' });

      const range = typeof req.headers.range === 'string' ? req.headers.range : undefined;
      const response = await config.client.send(new GetObjectCommand({
        Bucket: config.bucketName,
        Key: fileKey,
        Range: range,
      }));

      if (response.ContentRange) res.setHeader('Content-Range', response.ContentRange);
      if (response.AcceptRanges) res.setHeader('Accept-Ranges', response.AcceptRanges);
      if (response.ContentLength !== undefined) res.setHeader('Content-Length', response.ContentLength);
      res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'private, max-age=86400');
      res.statusCode = response.ContentRange ? 206 : 200;

      if (response.Body) {
        const body = response.Body as any;
        if (typeof body.pipe === 'function') {
          body.pipe(res as any);
        } else {
          res.end(Buffer.from(await body.transformToByteArray()));
        }
      } else {
        res.end();
      }
      return;
    }

    if (path === 's3/users/save' && method === 'POST') {
      const { projects } = getBody(req);
      if (!Array.isArray(projects)) return res.status(400).json({ error: 'projects array is required' });
      if (!config.client) return res.status(503).json({ error: 'AWS S3 is not configured' });

      await config.client.send(new PutObjectCommand({
        Bucket: config.bucketName,
        Key: 'gk-data/users_projects.json',
        Body: JSON.stringify(projects, null, 2),
        ContentType: 'application/json',
      }));

      return res.json({ success: true, mode: 's3', count: projects.length, savedAt: new Date().toISOString() });
    }

    if (path === 's3/users/load' && method === 'GET') {
      if (!config.client) return res.json({ success: true, projects: null, source: 'none' });
      try {
        const response = await config.client.send(new GetObjectCommand({
          Bucket: config.bucketName,
          Key: 'gk-data/users_projects.json',
        }));
        const projects = response.Body ? JSON.parse(await streamToString(response.Body)) : null;
        return res.json({ success: true, projects, source: 's3' });
      } catch (error: any) {
        if (error?.name === 'NoSuchKey') return res.json({ success: true, projects: null, source: 'none' });
        throw error;
      }
    }

    return res.status(404).json({ error: 'API route not found' });
  } catch (error: any) {
    console.error(`API error in ${method} /api/${path}:`, error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
