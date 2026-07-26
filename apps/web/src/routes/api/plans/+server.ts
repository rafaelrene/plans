import { createUploadHandler } from '#lib/server/upload';
import type { RequestHandler } from './$types';

const upload = createUploadHandler();

export const POST: RequestHandler = ({ request }) => upload(request);
