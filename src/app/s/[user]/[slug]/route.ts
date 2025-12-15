import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ user: string; slug: string }> }
) {
    const { user, slug } = await params
    const adminClient = createAdminSupabaseClient()

    // 根据用户名查找用户 ID
    // 首先尝试通过邮箱前缀匹配用户
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
    
    if (usersError) {
        console.error('List users error:', usersError)
        return new NextResponse('服务器错误', { status: 500 })
    }

    // 查找匹配的用户（通过邮箱前缀或 ID 前8位）
    const matchedUser = users.users.find(u => {
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

    // 从 Storage 获取 HTML 文件
    const filePath = `${matchedUser.id}/${site.id}/index.html`
    const { data: fileData, error: fileError } = await adminClient.storage
        .from('sites')
        .download(filePath)

    if (fileError || !fileData) {
        console.error('Download file error:', fileError)
        return new NextResponse('文件不存在，请先上传 HTML 文件', { status: 404 })
    }

    // 读取文件内容
    const htmlContent = await fileData.text()

    // 返回 HTML 内容
    return new NextResponse(htmlContent, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600', // 缓存1小时
        },
    })
}

