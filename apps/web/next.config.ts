import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Content-Security-Policy",
						value: "connect-src 'self' https://sandpack-bundler.codesandbox.io wss://sandpack-bundler.codesandbox.io"
					}
				]
			}
		];
	}
};

export default nextConfig;
