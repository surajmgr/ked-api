import type { Context } from 'hono';
import { type UploadType, userUploads } from '@/db/schema';
import type { AppBindings } from '../types/init';
import { ApiError } from './error';

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  bytes: number;
  format: string;
  // biome-ignore lint/suspicious/noExplicitAny: the types are deep so I will use any for ease
  [key: string]: any;
}

const UPLOAD_PRESETS: Record<UploadType, string> = {
  PROFILE_PICTURE: 'ked_profiles',
  CONTENT: 'ked_content',
  MESSAGE: 'ked_messages',
  OTHER: 'ked_general',
  BOOK_COVER: 'ked_book_covers',
};

async function generateSignature(params: Record<string, string>, apiSecret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys.map((key) => `${key}=${params[key]}`).join('&') + apiSecret;

  const msgBuffer = new TextEncoder().encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function universalUpload(
  file: File,
  type: UploadType,
  c: Context<AppBindings>,
  userId: string,
  userCp: number = 0,
  isTrusted: boolean = false,
): Promise<{ url: string; publicId: string; limits?: { remaining: number; total: number } }> {
  const env = c.var.provider.env;
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError('Cloudinary configuration missing', 500);
  }

  let limit = 0;
  let remaining = 0;
  const rateLimitKey = `rate_limit:upload:${userId}`;

  if (!isTrusted) {
    // Base limit 10 + 1 per 50 CP
    limit = 10 + Math.floor(userCp / 50);

    const currentCount = await c.var.provider.redis.incr(rateLimitKey);

    // If this is the first hit in the window, set TTL (1 hour)
    if (currentCount === 1) {
      await c.var.provider.redis.expire(rateLimitKey, 3600);
    }

    if (currentCount > limit) {
      throw new ApiError(`Upload rate limit exceeded. Your limit is ${limit} uploads per hour.`, 429);
    }

    remaining = limit - currentCount;
  }

  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = `ked/${UPLOAD_PRESETS[type] || 'ked_general'}`;

  const params: Record<string, string> = {
    timestamp,
    folder,
    // Transformations for optimization
    transformation: 'q_auto,f_auto',
  };

  const signature = await generateSignature(params, apiSecret);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cloudinary upload failed:', errorText);
    if (!isTrusted) {
      await c.var.provider.redis.decr(rateLimitKey);
    }
    throw new Error('Image upload failed');
  }

  const data = (await response.json()) as CloudinaryResponse;

  try {
    const db = await c.var.provider.db.getClient();
    await db.insert(userUploads).values({
      userId,
      fileSize: data.bytes,
      mimeType: `${data.resource_type}/${data.format}`,
      uploadType: type,
      providerPublicId: data.public_id,
      url: data.secure_url,
    });
  } catch (error) {
    // Log error but don't fail the request since upload succeeded
    c.var.provider.logger.error('Failed to save upload record to DB', { error, userId, publicId: data.public_id });

    // Delete the upload from Cloudinary
    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/destroy`, {
      method: 'POST',
      body: JSON.stringify({
        public_id: data.public_id,
        api_key: apiKey,
        timestamp,
        signature,
      }),
    });
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    limits: !isTrusted ? { remaining, total: limit } : undefined,
  };
}
