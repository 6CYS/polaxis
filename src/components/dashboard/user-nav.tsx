'use client'

import { Loader2, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'

export function UserNav() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserEmail(user.email || 'User')
            }
        }
        getUser()
    }, [])

    const handleSignOut = async () => {
        setLoading(true)
        await supabase.auth.signOut()
        router.refresh()
        router.replace('/login')
        setLoading(false)
    }

    return (
        <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-56" align="end">
                <div className="flex flex-col space-y-3">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">用户</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {userEmail || 'Loading...'}
                        </p>
                    </div>
                    <Separator />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleSignOut} 
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                        <span>退出登录</span>
                    </Button>
                </div>
            </HoverCardContent>
        </HoverCard>
    )
}
