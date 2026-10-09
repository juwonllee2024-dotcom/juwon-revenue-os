import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  turbopack: {root: process.cwd()},
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
