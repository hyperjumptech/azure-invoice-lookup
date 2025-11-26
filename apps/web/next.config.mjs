/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/auth"],
  cacheComponents: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/invoice",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
