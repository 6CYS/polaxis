import { redirect } from 'next/navigation'
import { Users, ShieldAlert } from 'lucide-react'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUsers } from '@/lib/actions/users'
import { UsersList } from '@/components/users/users-list'
import { Card, CardContent } from '@/components/ui/card'

export default async function UsersPage() {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        redirect('/login')
    }
    
    // 检查是否为管理员
    const isAdmin = user.app_metadata?.role === 'admin'
    
    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">用户管理</h2>
                    <p className="text-muted-foreground">
                        管理系统中的所有用户
                    </p>
                </div>
                
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <ShieldAlert className="h-12 w-12 text-amber-500 mb-4" />
                        <h4 className="text-lg font-semibold mb-2">权限不足</h4>
                        <p className="text-muted-foreground text-center">
                            您没有权限访问此页面，只有管理员可以管理用户
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    const { users, error } = await getUsers()
    
    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">用户管理</h2>
                    <p className="text-muted-foreground">
                        管理系统中的所有用户
                    </p>
                </div>
                
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-semibold mb-2">获取用户失败</h4>
                        <p className="text-muted-foreground text-center">
                            {error}
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <UsersList users={users} currentUserId={user.id} />
    )
}
