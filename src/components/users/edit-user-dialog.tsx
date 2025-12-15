'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { updateUser } from '@/lib/actions/users'

interface User {
    id: string
    email: string
    app_metadata: {
        role?: string
        [key: string]: unknown
    }
    user_metadata: {
        full_name?: string
        [key: string]: unknown
    }
}

interface EditUserDialogProps {
    user: User
    trigger?: React.ReactNode
}

export function EditUserDialog({ user, trigger }: EditUserDialogProps) {
    const router = useRouter()
    const [isRefreshing, startTransition] = useTransition()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [shouldCloseOnRefresh, setShouldCloseOnRefresh] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const toastIdRef = useRef<string | number | undefined>(undefined)
    
    const [fullName, setFullName] = useState(user.user_metadata?.full_name || '')
    const [newPassword, setNewPassword] = useState('')
    const [isAdmin, setIsAdmin] = useState(user.app_metadata?.role === 'admin')

    const isBusy = loading || isRefreshing

    const resetForm = useCallback(() => {
        setFullName(user.user_metadata?.full_name || '')
        setNewPassword('')
        setIsAdmin(user.app_metadata?.role === 'admin')
        setError(null)
        setShowPassword(false)
    }, [user.app_metadata?.role, user.user_metadata?.full_name])

    useEffect(() => {
        if (!shouldCloseOnRefresh || isRefreshing) return

        queueMicrotask(() => {
            toast.success('保存成功', { id: toastIdRef.current })
            toastIdRef.current = undefined

            setOpen(false)
            resetForm()
            setLoading(false)
            setShouldCloseOnRefresh(false)
        })
    }, [isRefreshing, resetForm, shouldCloseOnRefresh])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.set('fullName', fullName)
        formData.set('newPassword', newPassword)
        formData.set('isAdmin', isAdmin ? 'true' : 'false')

        toastIdRef.current = toast.loading('保存中...')
        let result: Awaited<ReturnType<typeof updateUser>>
        try {
            result = await updateUser(user.id, formData)
        } catch (error) {
            console.error(error)
            toast.error('保存失败，请稍后重试', { id: toastIdRef.current })
            toastIdRef.current = undefined
            setLoading(false)
            return
        }

        if (result?.error) {
            setError(result.error)
            toast.error(result.error, { id: toastIdRef.current })
            toastIdRef.current = undefined
            setLoading(false)
        } else if (result?.success) {
            setShouldCloseOnRefresh(true)
            startTransition(() => {
                router.refresh()
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen && isBusy) return
            setOpen(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>编辑用户</DialogTitle>
                    <DialogDescription>
                        修改用户 {user.email} 的信息
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>邮箱</Label>
                        <Input
                            value={user.email}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">邮箱不可修改</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">姓名</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="张三"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={isBusy}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="newPassword">新密码（留空则不修改）</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="输入新密码"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                                disabled={isBusy}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isBusy}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">如需修改密码请输入新密码，至少 6 位</p>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isAdmin"
                            checked={isAdmin}
                            onCheckedChange={(checked) => setIsAdmin(checked === true)}
                            disabled={isBusy}
                        />
                        <Label 
                            htmlFor="isAdmin" 
                            className="text-sm font-normal cursor-pointer"
                        >
                            设为管理员
                        </Label>
                    </div>

                    {error && (
                        <div className="text-sm font-medium text-red-500">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setOpen(false)}
                            disabled={isBusy}
                        >
                            取消
                        </Button>
                        <Button type="submit" disabled={isBusy}>
                            {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isBusy ? '保存中...' : '保存修改'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
