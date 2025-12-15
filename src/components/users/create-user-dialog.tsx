'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react'
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
import { createUser } from '@/lib/actions/users'

interface CreateUserDialogProps {
    trigger?: React.ReactNode
}

export function CreateUserDialog({ trigger }: CreateUserDialogProps) {
    const router = useRouter()
    const [isRefreshing, startTransition] = useTransition()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [shouldCloseOnRefresh, setShouldCloseOnRefresh] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const toastIdRef = useRef<string | number | undefined>(undefined)
    
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)

    const isBusy = loading || isRefreshing

    function resetForm() {
        setEmail('')
        setPassword('')
        setFullName('')
        setIsAdmin(false)
        setError(null)
        setShowPassword(false)
    }

    useEffect(() => {
        if (!shouldCloseOnRefresh || isRefreshing) return

        queueMicrotask(() => {
            toast.success('创建成功', { id: toastIdRef.current })
            toastIdRef.current = undefined

            setOpen(false)
            resetForm()
            setLoading(false)
            setShouldCloseOnRefresh(false)
        })
    }, [isRefreshing, shouldCloseOnRefresh])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.set('email', email)
        formData.set('password', password)
        formData.set('fullName', fullName)
        formData.set('isAdmin', isAdmin ? 'true' : 'false')

        toastIdRef.current = toast.loading('创建中...')
        let result: Awaited<ReturnType<typeof createUser>>
        try {
            result = await createUser(formData)
        } catch (error) {
            console.error(error)
            toast.error('创建失败，请稍后重试', { id: toastIdRef.current })
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
                {trigger || (
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        添加用户
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>添加新用户</DialogTitle>
                    <DialogDescription>
                        创建一个新用户账号，用户将可以使用此账号登录系统
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">邮箱 <span className="text-red-500">*</span></Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isBusy}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">密码 <span className="text-red-500">*</span></Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="至少 6 位"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
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
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">姓名（可选）</Label>
                        <Input
                            id="fullName"
                            type="text"
                            placeholder="张三"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={isBusy}
                        />
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
                            {isBusy ? '创建中...' : '创建用户'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
