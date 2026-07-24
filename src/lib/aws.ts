export interface S3Status {
  configured: boolean;
  bucketName: string;
  region: string;
  hasAccessKey: boolean;
  hasSecretKey: boolean;
  message: string;
}

export interface UploadResult {
  success: boolean;
  url: string;
  fileKey?: string;
  mode: 's3' | 'local_fallback';
  error?: string;
}

// Fetch S3 configuration status
export async function checkS3Status(): Promise<S3Status> {
  try {
    const res = await fetch('/api/s3/status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch (err) {
    return {
      configured: false,
      bucketName: 'Not Set',
      region: 'us-east-1',
      hasAccessKey: false,
      hasSecretKey: false,
      message: 'AWS S3 status unreachable.'
    };
  }
}

// Upload file directly to AWS S3 or fallback
export async function uploadFileToAWS(
  file: File, 
  folder: string = 'gk-media/client-uploads',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  try {
    if (onProgress) onProgress(10);

    const urlResponse = await fetch('/api/s3/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder
      })
    });
    const urlData = await urlResponse.json();
    if (!urlResponse.ok || !urlData.success || !urlData.uploadUrl) {
      throw new Error(urlData.error || 'Failed to prepare upload');
    }

    if (onProgress) onProgress(30);

    const uploadResponse = await fetch(urlData.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file
    });

    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text();
      throw new Error(
        `S3 upload failed with status ${uploadResponse.status}${responseText ? `: ${responseText.slice(0, 200)}` : ''}`
      );
    }

    if (onProgress) onProgress(100);

    return {
      success: true,
      url: urlData.publicUrl,
      fileKey: urlData.fileKey,
      mode: 's3'
    };
  } catch (err: any) {
    console.error('AWS Upload Error:', err);
    return {
      success: false,
      url: '',
      mode: 'local_fallback',
      error: err.message || 'File upload failed'
    };
  }
}

export function extractFileKeyFromUrl(url: string): string {
  if (!url) return '';
  const cleanUrl = url.trim();

  // 1. Proxy URL format: /api/media/s3-proxy?key=...
  if (cleanUrl.includes('/api/media/s3-proxy?key=')) {
    const query = cleanUrl.split('key=')[1];
    if (query) {
      return decodeURIComponent(query.split('&')[0]);
    }
  }

  // 2. Local stream format: /api/media/stream/...
  if (cleanUrl.includes('/api/media/stream/')) {
    const filename = cleanUrl.split('/api/media/stream/')[1];
    if (filename) {
      return decodeURIComponent(filename.split('?')[0]);
    }
  }

  // 3. Direct AWS S3 URL: https://bucket.s3.region.amazonaws.com/key
  if (cleanUrl.includes('.s3.') && cleanUrl.includes('amazonaws.com')) {
    try {
      const urlObj = new URL(cleanUrl);
      const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
      if (key) return decodeURIComponent(key);
    } catch (e) {
      // Ignore parse error
    }
  }

  return cleanUrl;
}

// Delete file from AWS S3 or local storage
export async function deleteFileFromAWS(fileKeyOrUrl: string): Promise<boolean> {
  if (!fileKeyOrUrl) return false;
  const fileKey = extractFileKeyFromUrl(fileKeyOrUrl);
  if (!fileKey || fileKey.startsWith('data:') || fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
    // If it's an external YouTube/Vimeo/Unsplash link, skip S3 delete
    if (fileKey.includes('youtube.com') || fileKey.includes('vimeo.com') || fileKey.includes('unsplash.com')) {
      return true;
    }
  }

  try {
    const res = await fetch('/api/s3/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey })
    });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('Failed to delete file from AWS S3:', err);
    return false;
  }
}

// Save User Client Accounts & Project Details to AWS S3 Cloud Storage
export async function saveUsersToAWS(projects: any[]): Promise<{ success: boolean; mode?: string }> {
  try {
    const res = await fetch('/api/s3/users/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects })
    });
    const data = await res.json();
    return { success: !!data.success, mode: data.mode };
  } catch (err) {
    console.error('Failed to save users data to AWS S3:', err);
    return { success: false };
  }
}

// Load User Client Accounts & Project Details from AWS S3 Cloud Storage
export async function loadUsersFromAWS(): Promise<any[] | null> {
  try {
    const res = await fetch('/api/s3/users/load');
    const data = await res.json();
    if (data.success && Array.isArray(data.projects)) {
      return data.projects;
    }
    return null;
  } catch (err) {
    console.error('Failed to load users data from AWS S3:', err);
    return null;
  }
}

