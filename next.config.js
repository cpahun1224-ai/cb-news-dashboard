/** @type {import('next').NextConfig} */
const nextConfig = {
  // 외부 이미지 도메인 허용
  images: {
    domains: ['www.fsc.go.kr', 'www.fss.or.kr', 'www.bok.or.kr'],
  },
  // RSS 수집 시 외부 API 호출 허용
  experimental: {
    serverComponentsExternalPackages: ['rss-parser', 'nodemailer'],
  },
};

module.exports = nextConfig;
