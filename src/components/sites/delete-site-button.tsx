'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { deleteSite } from '@/lib/actions/sites'

interface DeleteSiteButtonProps {
    siteId: string
    siteName: string
}

export function DeleteSiteButton({ siteId, siteName }: DeleteSiteButtonProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [confirmText, setConfirmText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const canDelete = confirmText === siteName

    async function handleDelete() {
        if (!canDelete) return

        setLoading(true)
        setError(null)

        const toastId = toast.loading('删除中...')
        try {
            const result = await deleteSite(siteId)
            if (result?.error) {
                setError(result.error)
                toast.error(result.error, { id: toastId })
                setLoading(false)
                return
            }
        } catch (e) {
            console.error(e)
            toast.error('删除失败，请稍后重试', { id: toastId })
            setLoading(false)
            return
        }

        toast.success('删除成功', { id: toastId })
        router.replace('/sites')
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && loading) return
                setOpen(nextOpen)
            }}
        >
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除站点
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>确认删除站点</DialogTitle>
                    <DialogDescription>
                        此操作不可逆，将永久删除站点 <strong>{siteName}</strong> 及其所有文件。
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        请输入站点名称 <strong className="text-foreground">{siteName}</strong> 以确认删除：
                    </p>
                    <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={siteName}
                    />

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        取消
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!canDelete || loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? '删除中...' : '确认删除'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
