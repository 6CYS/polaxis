'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Globe, Settings, PlusCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname()

    const routes = [
        {
            label: '仪表盘',
            icon: LayoutDashboard,
            href: '/dashboard',
            active: pathname === '/dashboard',
        },
        {
            label: '我的站点',
            icon: Globe,
            href: '/dashboard/sites',
            active: pathname.startsWith('/dashboard/sites'),
        },
        {
            label: '创建站点',
            icon: PlusCircle,
            href: '/dashboard/new',
            active: pathname === '/dashboard/new',
        },
        {
            label: '设置',
            icon: Settings,
            href: '/dashboard/settings',
            active: pathname === '/dashboard/settings',
        },
    ]

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">

                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? 'secondary' : 'ghost'}
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
                </div>
            </div>
        </div>
    )
}
