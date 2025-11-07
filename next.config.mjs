/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude source maps from chrome-aws-lambda
    config.module.rules.push({
      test: /\.map$/,
      use: 'ignore-loader'
    });
    
    // Exclude chrome-aws-lambda source maps from being parsed
    config.module.rules.push({
      test: /node_modules[\\/]chrome-aws-lambda[\\/].*\.js\.map$/,
      loader: 'ignore-loader'
    });

    return config;
  },
}

export default nextConfig
