import 'dotenv/config';
import type { NextConfig } from 'next';

console.log(
  'BUILD-TIME CHECK - Clarity ID:',
  process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID
);

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_GITHUB_USERNAME: process.env.NEXT_PUBLIC_GITHUB_USERNAME,
    NEXT_PUBLIC_CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  },
};

export default nextConfig;
