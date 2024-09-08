/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'www.spaceist.co.uk',
      'px.ads.linkedin.com',
      // Add any other specific domains you expect images from
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
      },
    ],
  },
}

module.exports = nextConfig