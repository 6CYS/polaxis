/**
 * MIME 类型映射工具
 * 根据文件扩展名返回对应的 MIME 类型
 */

const MIME_TYPES: Record<string, string> = {
  // HTML
  html: 'text/html',
  htm: 'text/html',

  // CSS
  css: 'text/css',

  // JavaScript
  js: 'application/javascript',
  mjs: 'application/javascript',
  cjs: 'application/javascript',

  // JSON
  json: 'application/json',

  // 图片
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ico: 'image/x-icon',

  // 字体
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',

  // 其他
  txt: 'text/plain',
  xml: 'application/xml',
  pdf: 'application/pdf',
}

/**
 * 根据文件名获取 MIME 类型
 * @param filename 文件名
 * @returns MIME 类型字符串
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  return MIME_TYPES[ext || ''] || 'application/octet-stream'
}

/**
 * 允许上传的文件扩展名列表
 */
export const ALLOWED_EXTENSIONS = [
  'html',
  'htm',
  'css',
  'js',
  'mjs',
  'cjs',
  'json',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'txt',
]

/**
 * 检查文件扩展名是否允许上传
 * @param filename 文件名
 * @returns 是否允许上传
 */
export function isAllowedFileType(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext ? ALLOWED_EXTENSIONS.includes(ext) : false
}

/**
 * 单个文件大小限制（5MB）
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * 单个站点总文件大小限制（50MB）
 */
export const MAX_TOTAL_SIZE = 50 * 1024 * 1024
