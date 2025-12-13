import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { Sidebar } from '@/components/dashboard/sidebar'
import { UserNav } from '@/components/dashboard/user-nav'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center px-4">
                    <div className="mr-4 hidden md:flex">
                        <a className="mr-6 flex items-center space-x-2" href="/">
                            <span className="hidden font-bold sm:inline-block">
                                Polaxis
                            </span>
                        </a>
                    </div>

                    <MobileNav />

                    <div className="flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end">
                        <div className="w-full flex-1 md:w-auto md:flex-none">
                            {/* Search or other header items */}
                        </div>
                        <UserNav />
                    </div>
                </div>
            </header>

            <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
                    <Sidebar />
                </aside>
                <main className="flex w-full flex-col overflow-hidden p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
