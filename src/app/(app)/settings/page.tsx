import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function SettingsPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
        redirect('/login')
    }

    const isAdmin = user.app_metadata?.role === 'admin'

    if (!isAdmin) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>权限不足</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    只有管理员可以访问系统设置。
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold tracking-tight">系统设置</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">建设中</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    该页面用于后续放置系统级配置项。
                </CardContent>
            </Card>
        </div>
    )
}

