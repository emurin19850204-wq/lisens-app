import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify向け: 静的HTMLとしてエクスポート
  output: "export",
  // 画像最適化はサーバーが必要なので無効化
  images: {
    unoptimized: true,
  },
  // 末尾スラッシュ付きでエクスポート（Netlifyの静的ホスティングに最適）
  trailingSlash: true,
};

export default nextConfig;
