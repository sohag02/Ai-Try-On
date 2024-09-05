/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['yisol-idm-vton.hf.space'],
    },
    // Configure API routes
    api: {
      // Increase the body parser size limit to allow larger file uploads
      bodyParser: {
        sizeLimit: '10mb',
      },
      // Optionally, you can adjust the response size limit if needed
      responseLimit: '10mb',
    },
  
    // Configure headers for specific routes
    async headers() {
      return [
        {
          // This will apply these headers to any files served from the /tmp directory
          source: '/tmp/:path*',
          headers: [
            // Allow cross-origin requests to the tmp directory
            { key: 'Access-Control-Allow-Origin', value: '*' },
            // Optionally, you can add more headers here as needed
            { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Accept' },
          ],
        },
      ];
    },
  
    // Configure webpack to handle .mjs files (if you're using ES modules)
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
        };
      }
      return config;
    },
  };
  
  export default nextConfig;