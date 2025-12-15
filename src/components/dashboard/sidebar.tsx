'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Globe, Settings, Users, Shield, LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'

interface RouteItem {
    label: string
    icon: LucideIcon
    href: string
}

type SidebarProps = React.HTMLAttributes<HTMLDivElement>

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        let isActive = true

        const updateFromSession = (sessionUser: { app_metadata: Record<string, unknown> } | null) => {
            if (!isActive) return
            setIsAdmin(sessionUser?.app_metadata?.role === 'admin')
        }

        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            updateFromSession(session?.user ?? null)
        }

        void init()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            updateFromSession(session?.user ?? null)
        })

        return () => {
            isActive = false
            subscription.unsubscribe()
        }
    }, [])

    // 所有用户可见的路由
    const userRoutes: RouteItem[] = [
        {
            label: '仪表盘',
            icon: LayoutDashboard,
            href: '/dashboard',
        },
        {
            label: '我的站点',
            icon: Globe,
            href: '/sites',
        },
    ]

    // 仅管理员可见的路由
    const adminRoutes: RouteItem[] = [
        {
            label: '用户管理',
            icon: Users,
            href: '/users',
        },
        {
            label: '系统设置',
            icon: Settings,
            href: '/settings',
        },
    ]

    const isRouteActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard'
        }
        return pathname.startsWith(href)
    }

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    {/* 用户菜单 */}
                    <div className="space-y-1">
                        {userRoutes.map((route) => (
                            <Button
                                key={route.href}
                                variant={isRouteActive(route.href) ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>

                    {/* 管理员菜单 */}
                    {isAdmin && (
                        <>
                            <div className="my-4">
                                <Separator />
                                <p className="mt-3 mb-2 px-2 text-xs font-medium text-muted-foreground flex items-center">
                                    <Shield className="mr-1.5 h-3 w-3" />
                                    管理员
                                </p>
                            </div>
                            <div className="space-y-1">
                                {adminRoutes.map((route) => (
                                    <Button
                                        key={route.href}
                                        variant={isRouteActive(route.href) ? 'secondary' : 'ghost'}
                                        className="w-full justify-start"
                                        asChild
                                    >
                                        <Link href={route.href}>
                                            <route.icon className="mr-2 h-4 w-4" />
                                            {route.label}
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
