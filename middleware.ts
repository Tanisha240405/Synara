export { default } from 'next-auth/middleware';
export const config = { matcher: ['/dashboard/:path*', '/segments/:path*', '/campaigns/:path*', '/analytics/:path*', '/import/:path*'] };
