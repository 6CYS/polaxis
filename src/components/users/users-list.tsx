'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
    Users, 
    Trash2,
    Pencil,
    Shield,
    Mail,
    Calendar,
    MoreHorizontal,
    UserCheck,
    UserX
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { CreateUserDialog } from '@/components/users/create-user-dialog'
import { EditUserDialog } from '@/components/users/edit-user-dialog'
import { deleteUser, deleteUsers } from '@/lib/actions/users'

interface User {
    id: string
    email: string
    created_at: string
    last_sign_in_at: string | null
    email_confirmed_at: string | null
    app_metadata: {
        role?: string
        [key: string]: unknown
    }
    user_metadata: {
        full_name?: string
        [key: string]: unknown
    }
}

interface UsersListProps {
    users: User[]
    currentUserId?: string
}

export function UsersList({ users, currentUserId }: UsersListProps) {
    const router = useRouter()
    const [isRefreshing, startTransition] = useTransition()
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)
    const [pendingCloseDialog, setPendingCloseDialog] = useState<'single' | 'batch' | null>(null)
    const toastIdRef = useRef<string | undefined>(undefined)

    const isBusy = isDeleting || isRefreshing

    useEffect(() => {
        if (!pendingCloseDialog || isRefreshing) return

        queueMicrotask(() => {
            if (pendingCloseDialog === 'single') {
                setDeleteDialogOpen(false)
                setUserToDelete(null)
            } else {
                setBatchDeleteDialogOpen(false)
                setSelectedIds([])
            }

            setIsDeleting(false)
            setPendingCloseDialog(null)
        })
    }, [isRefreshing, pendingCloseDialog])

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // 选择所有非当前用户
            setSelectedIds(users.filter(u => u.id !== currentUserId).map(u => u.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (userId: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, userId])
        } else {
            setSelectedIds(selectedIds.filter(id => id !== userId))
        }
    }

    const handleDeleteSingle = async () => {
        if (!userToDelete) return
        
        setIsDeleting(true)
        toastIdRef.current = `user-delete-${userToDelete.id}`
        toast.loading('删除中...', { id: toastIdRef.current })
        try {
            const result = await deleteUser(userToDelete.id)
            if (result.error) {
                toast.error(result.error, { id: toastIdRef.current })
                toastIdRef.current = undefined
                setIsDeleting(false)
                return
            }
        } catch (error) {
            console.error(error)
            toast.error('删除失败，请稍后重试', { id: toastIdRef.current })
            toastIdRef.current = undefined
            setIsDeleting(false)
            return
        }

        toast.success('删除成功，正在刷新...', { id: toastIdRef.current })
        setPendingCloseDialog('single')
        startTransition(() => {
            router.refresh()
        })
    }

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0) return
        
        setIsDeleting(true)
        toastIdRef.current = 'users-batch-delete'
        toast.loading('删除中...', { id: toastIdRef.current })
        try {
            const result = await deleteUsers(selectedIds)
            if (result.error) {
                toast.error(result.error, { id: toastIdRef.current })
                toastIdRef.current = undefined
                setIsDeleting(false)
                return
            }
        } catch (error) {
            console.error(error)
            toast.error('删除失败，请稍后重试', { id: toastIdRef.current })
            toastIdRef.current = undefined
            setIsDeleting(false)
            return
        }

        toast.success('删除成功，正在刷新...', { id: toastIdRef.current })
        setPendingCloseDialog('batch')
        startTransition(() => {
            router.refresh()
        })
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (users.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">暂无用户</h4>
                    <p className="text-muted-foreground text-center mb-4">
                        还没有任何用户，点击下方按钮添加第一个用户
                    </p>
                    <CreateUserDialog />
                </CardContent>
            </Card>
        )
    }

    const selectableCount = users.filter(u => u.id !== currentUserId).length
    const allSelected = selectedIds.length === selectableCount && selectableCount > 0

    return (
        <div className="space-y-4">
            {/* 工具栏 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CreateUserDialog />
                    {selectedIds.length > 0 && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setBatchDeleteDialogOpen(true)}
                            disabled={isDeleting}
                        >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            删除 ({selectedIds.length})
                        </Button>
                    )}
                </div>
                <div className="text-sm text-muted-foreground">
                    共 {users.length} 个用户
                </div>
            </div>

            {/* 用户列表 */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={(checked) => handleSelectAll(checked === true)}
                                />
                            </TableHead>
                            <TableHead>用户</TableHead>
                            <TableHead>角色</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead>最后登录</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => {
                            const isCurrentUser = user.id === currentUserId
                            const isAdmin = user.app_metadata?.role === 'admin'
                            
                            return (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(user.id)}
                                            onCheckedChange={(checked) => handleSelectOne(user.id, checked === true)}
                                            disabled={isCurrentUser}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                                                isAdmin ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'
                                            }`}>
                                                {isAdmin ? (
                                                    <Shield className="h-4 w-4" />
                                                ) : (
                                                    <Mail className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {user.user_metadata?.full_name || user.email.split('@')[0]}
                                                    {isCurrentUser && (
                                                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                                            当前用户
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {isAdmin ? (
                                            <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-1 rounded-full text-xs font-medium">
                                                <Shield className="h-3 w-3" />
                                                管理员
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2 py-1 rounded-full text-xs font-medium">
                                                普通用户
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {formatDate(user.created_at)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            {user.last_sign_in_at ? (
                                                <>
                                                    <UserCheck className="h-3.5 w-3.5 text-green-500" />
                                                    {formatDate(user.last_sign_in_at)}
                                                </>
                                            ) : (
                                                <>
                                                    <UserX className="h-3.5 w-3.5" />
                                                    从未登录
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <EditUserDialog 
                                                    user={user}
                                                    trigger={
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            编辑
                                                        </DropdownMenuItem>
                                                    }
                                                />
                                                {!isCurrentUser && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive focus:text-destructive"
                                                            onSelect={() => {
                                                                setUserToDelete(user)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            删除
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* 单个删除确认对话框 */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open && isBusy) return
                    setDeleteDialogOpen(open)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除用户</AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除用户 <span className="font-medium text-foreground">{userToDelete?.email}</span> 吗？
                            此操作不可撤销，该用户的所有站点数据也将被一并删除。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBusy}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSingle}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={isBusy}
                        >
                            {isBusy ? '删除中...' : '确认删除'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 批量删除确认对话框 */}
            <AlertDialog
                open={batchDeleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open && isBusy) return
                    setBatchDeleteDialogOpen(open)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认批量删除</AlertDialogTitle>
                        <AlertDialogDescription>
                            您确定要删除选中的 {selectedIds.length} 个用户吗？
                            此操作不可撤销，这些用户的所有站点数据也将被一并删除。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isBusy}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBatchDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                            disabled={isBusy}
                        >
                            {isBusy ? '删除中...' : '确认删除'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
