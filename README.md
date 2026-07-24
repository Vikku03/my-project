<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/41cb8a6d-b091-46ad-ab24-95ccd94aaa7b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

The `api/[...path].ts` function provides the `/api` routes in Vercel. Uploads use a presigned S3 URL, so files are sent directly from the browser to S3 without Base64 encoding or local filesystem storage.

1. Add `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET_NAME` as Vercel environment variables for the deployed environment.
2. Configure the S3 bucket CORS rules using [s3-cors.json](s3-cors.json), replacing `https://your-vercel-domain.vercel.app` with the deployed site URL.
3. Deploy with the existing build command: `npm run build`.

The AWS credentials need permission for `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucket` on the configured bucket.

### Troubleshooting uploads

Open `https://your-vercel-domain.vercel.app/api/s3/status` after deployment:

- `configured: false` or `503` from `/api/s3/upload-url`: add the four AWS variables in Vercel under the correct environment (`Production` or `Preview`), then redeploy. `AWS_REGION` must be the bucket's actual region, and `AWS_S3_BUCKET_NAME` must contain only the bucket name.
- `/api/s3/upload-url` returns `500`: check the Vercel function runtime logs and the AWS credentials or region.
- The presigned S3 `PUT` returns `403` or the browser reports a CORS error: update the bucket CORS configuration with the exact deployed origin, including `https://` and without a trailing slash. The signed request's `Content-Type` must be allowed.
- The presigned S3 `PUT` returns `200` but the item is not visible in the expected folder: check the S3 key under `gk-media/...`; the app intentionally stores media using the project folder supplied by the browser.

After changing Vercel environment variables or S3 CORS, create a new deployment and hard-refresh the site.
