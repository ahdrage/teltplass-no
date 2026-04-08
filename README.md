This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment (GitHub + Railway + Convex)

- **Repository:** push `main` to GitHub (this repo).
- **Railway:** the `web` service runs Next.js. A deploy runs on every push to `main` via [`.github/workflows/deploy-railway.yml`](.github/workflows/deploy-railway.yml).
- **One-time GitHub secret:** in the repo → *Settings → Secrets and variables → Actions*, add **`RAILWAY_TOKEN`**. Create a project token under your Railway project → *Settings → Tokens* ([docs](https://docs.railway.com/guides/cli#project-token)).
- **Convex production:** deploy functions with `npx convex deploy -y`. Seed prod data with `NEXT_PUBLIC_CONVEX_URL=<your-prod-url> npx tsx scripts/seed.ts` (see Convex dashboard for the prod deployment URL).
- **Railway variables:** set `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_MAPBOX_TOKEN`, and `NEXT_PUBLIC_SITE_URL` (your public Railway or custom domain) on the `web` service.
