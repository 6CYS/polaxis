import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { getMimeType } from '@/lib/mime-types'
import type { User } from '@supabase/supabase-js'

/**
 * 清理和验证文件路径，防止路径遍历攻击
 */
function sanitizePath(pathSegments: string[] | undefined): string {
  if (!pathSegments || pathSegments.length === 0) {
    return 'index.html'
  }

  // 过滤掉危险的路径片段
  const cleanSegments = pathSegments.filter((segment) => {
    // 移除空字符串、. 和 ..
    return segment && segment !== '.' && segment !== '..'
  })

  if (cleanSegments.length === 0) {
    return 'index.html'
  }

  return cleanSegments.join('/')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user: string; slug: string; path?: string[] }> }
) {
  const { user, slug, path } = await params
  const adminClient = createAdminSupabaseClient()

  // 清理路径
  const filePath = sanitizePath(path)

  // 根据用户名查找用户 ID
  // 首先尝试通过邮箱前缀匹配用户
  const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()

  if (usersError) {
    console.error('List users error:', usersError)
    return new NextResponse('服务器错误', { status: 500 })
  }

  // 查找匹配的用户（通过邮箱前缀或 ID 前8位）
  const matchedUser = users.users.find((u: User) => {
    if (u.email) {
      const emailPrefix = u.email.split('@')[0]
      return emailPrefix === user
    }
    return u.id.substring(0, 8) === user
  })

  if (!matchedUser) {
    return new NextResponse('用户不存在', { status: 404 })
  }

  // 根据用户 ID 和 slug 查找站点
  const { data: site, error: siteError } = await adminClient
    .from('po_sites')
    .select('*')
    .eq('user_id', matchedUser.id)
    .eq('slug', slug)
    .single()

  if (siteError || !site) {
    return new NextResponse('站点不存在', { status: 404 })
  }

  // 从 Storage 获取文件
  const storagePath = `${matchedUser.id}/${site.id}/${filePath}`

  console.log('Attempting to download file:', {
    userId: matchedUser.id,
    siteId: site.id,
    filePath,
    storagePath
  })

  const { data: fileData, error: fileError } = await adminClient.storage
    .from('sites')
    .download(storagePath)

  if (fileError || !fileData) {
    console.error('Download file error:', fileError)
    return new NextResponse('文件不存在', { status: 404 })
  }

  // 根据文件扩展名确定 MIME 类型
  const mimeType = getMimeType(filePath)

  // 读取文件内容
  const fileBuffer = await fileData.arrayBuffer()

  // 如果是 HTML 文件，注入 <base> 标签以修复相对路径
  if (mimeType === 'text/html') {
    const htmlContent = new TextDecoder().decode(fileBuffer)
    const baseUrl = `/s/${user}/${slug}/`

    // 在 <head> 标签后注入 <base> 标签
    const modifiedHtml = htmlContent.replace(
      /(<head[^>]*>)/i,
      `$1\n    <base href="${baseUrl}">`
    )

    return new NextResponse(modifiedHtml, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
      },
    })
  }

  // 返回文件内容
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600', // 缓存1小时
    },
  })
}
