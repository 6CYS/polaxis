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
        const { data } = await supabase.auth.getUser()
        user = data.user
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
