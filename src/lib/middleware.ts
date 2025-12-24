import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 尝试获取用户信息，添加错误处理
    let user = null
    try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
            // 处理 refresh token 无效等认证错误
            if (error.code === 'refresh_token_not_found' || error.code === 'session_not_found') {
                // 清除无效的 auth cookies
                const authCookies = request.cookies.getAll().filter(
                    cookie => cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
                )
                authCookies.forEach(cookie => {
                    supabaseResponse.cookies.delete(cookie.name)
                })
                // user 保持为 null，让后续逻辑处理未登录状态
            }
        } else {
            user = data.user
        }
    } catch (error) {
        // 在 Edge Runtime 中可能会遇到网络问题，优雅降级
        console.warn('Middleware: Failed to get user session, continuing without auth check')
        // 检查是否有 session cookie 作为备用判断
        const hasSessionCookie = request.cookies.getAll().some(
            cookie => cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
        )
        if (hasSessionCookie) {
            // 有 cookie 但获取失败，让请求继续，由页面级别处理
            return supabaseResponse
        }
    }

    // ROUTE PROTECTION LOGIC

    // 1. If user is NOT logged in and tries to access dashboard, redirect to login
    if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. If user IS logged in and tries to access login/auth pages, redirect to dashboard
    if (user && request.nextUrl.pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
