import type { AppRouteHandler } from '@/lib/types/helper';
import type { Upload } from './upload.route';
import { getCurrentSession } from '@/lib/utils/auth';
import { HttpStatusCodes } from '@/lib/utils/status.codes';
import { ApiError, getErrorMessage } from '@/lib/utils/error';
import { universalUpload } from '@/lib/utils/upload';
import { eq } from 'drizzle-orm';
import { type UploadType, userProfiles } from '@/db/schema';

export const upload: AppRouteHandler<Upload> = async (c) => {
  const body = c.req.valid('form');
  const file = body.file;
  const type = (body.type as UploadType) || 'other';

  const { user } = await getCurrentSession(c, true);
  const userId = user.id;

  const db = await c.var.provider.db.getClient();
  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
    columns: {
      contributionPoints: true,
      trustedStatus: true,
    },
  });

  const cp = userProfile?.contributionPoints || 0;
  const isTrusted = userProfile?.trustedStatus || false;

  try {
    const result = await universalUpload(file, type, c, userId, cp, isTrusted);
    return c.json(
      {
        success: true,
        data: result,
      },
      HttpStatusCodes.OK,
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes('Rate limit exceeded')) {
      throw new ApiError(errorMessage, HttpStatusCodes.TOO_MANY_REQUESTS);
    }
    c.var.provider.logger.error('Upload error', { error });
    throw new ApiError(errorMessage, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};
