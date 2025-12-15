'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, FileCode, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { updateSite, deleteSite, uploadSiteFile } from '@/lib/actions/sites'
import { Site } from '@/lib/database.types'

interface EditSiteDialogProps {
    site: Site
    trigger?: React.ReactNode
}

export function EditSiteDialog({ site, trigger }: EditSiteDialogProps) {
    const router = useRouter()
    const [isRefreshing, startTransition] = useTransition()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [shouldCloseOnRefresh, setShouldCloseOnRefresh] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [name, setName] = useState(site.name)
    const [description, setDescription] = useState(site.description || '')
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const toastIdRef = useRef<string | number | undefined>(undefined)

    const isBusy = loading || deleteLoading || isRefreshing

    const resetForm = useCallback(() => {
        setName(site.name)
        setDescription(site.description || '')
        setFile(null)
        setError(null)
        setSuccess(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [site.description, site.name])

    useEffect(() => {
        if (!shouldCloseOnRefresh || isRefreshing) return

        queueMicrotask(() => {
            toast.success('保存成功', { id: toastIdRef.current })
            toastIdRef.current = undefined

            setOpen(false)
            resetForm()
            setLoading(false)
            setShouldCloseOnRefresh(false)
            setSuccess(null)
        })
    }, [isRefreshing, resetForm, shouldCloseOnRefresh])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.html') && !selectedFile.name.endsWith('.htm')) {
                setError('请上传 .html 或 .htm 文件')
                return
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('文件大小不能超过 5MB')
                return
            }
            setFile(selectedFile)
            setError(null)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)
        toastIdRef.current = toast.loading('保存中...')

        // 更新站点信息
        const formData = new FormData()
        formData.set('name', name)
        formData.set('description', description)

        let updateResult: Awaited<ReturnType<typeof updateSite>>
        try {
            updateResult = await updateSite(site.id, formData)
        } catch (e) {
            console.error(e)
            toast.error('保存失败，请稍后重试', { id: toastIdRef.current })
            toastIdRef.current = undefined
            setLoading(false)
            return
        }

        if (updateResult?.error) {
            setError(updateResult.error)
            toast.error(updateResult.error, { id: toastIdRef.current })
            toastIdRef.current = undefined
            setLoading(false)
            return
        }

        // 如果有新文件，上传文件
        if (file) {
            const fileFormData = new FormData()
            fileFormData.set('file', file)
            let uploadResult: Awaited<ReturnType<typeof uploadSiteFile>>
            try {
                uploadResult = await uploadSiteFile(site.id, fileFormData)
            } catch (e) {
                console.error(e)
                toast.error('文件上传失败，请稍后重试', { id: toastIdRef.current })
                toastIdRef.current = undefined
                setLoading(false)
                return
            }

            if (uploadResult?.error) {
                setError(uploadResult.error)
                toast.error(uploadResult.error, { id: toastIdRef.current })
                toastIdRef.current = undefined
                setLoading(false)
                return
            }
        }

        setSuccess('保存成功')
        setFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }

        setShouldCloseOnRefresh(true)
        startTransition(() => {
            router.refresh()
        })
    }

    async function handleDelete() {
        setDeleteLoading(true)
        const toastId = toast.loading('删除中...')
        try {
            const result = await deleteSite(site.id)
            if (result?.error) {
                setError(result.error)
                toast.error(result.error, { id: toastId })
                setDeleteLoading(false)
                return
            }
        } catch (e) {
            console.error(e)
            toast.error('删除失败，请稍后重试', { id: toastId })
            setDeleteLoading(false)
            return
        }

        toast.success('已删除，正在跳转...', { id: toastId })
        setDeleteConfirmOpen(false)
        startTransition(() => {
            router.replace('/sites')
        })
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen && isBusy) return
            setOpen(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm">
                        <Pencil className="mr-1 h-3 w-3" />
                        编辑
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>编辑站点</DialogTitle>
                    <DialogDescription>
                        修改站点信息或重新上传 HTML 文件
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">站点名称</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="我的个人主页"
                            required
                            disabled={isBusy}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>别名 (Slug)</Label>
                        <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md font-mono">
                            /{site.slug}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Slug 创建后不可修改
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-description">描述（可选）</Label>
                        <Input
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="简单描述一下这个站点..."
                            disabled={isBusy}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>重新上传 HTML 文件</Label>
                        <div 
                            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                                file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".html,.htm"
                                onChange={handleFileChange}
                                className="hidden"
                                disabled={isBusy}
                            />
                            {file ? (
                                <div className="flex items-center justify-center gap-2 text-primary">
                                    <FileCode className="h-5 w-5" />
                                    <span className="font-medium">{file.name}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="h-6 w-6" />
                                    <span className="text-sm">点击上传新的 HTML 文件</span>
                                    <span className="text-xs">留空则保留原文件</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm font-medium text-red-500">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-sm font-medium text-green-600">
                            {success}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        <AlertDialog
                            open={deleteConfirmOpen}
                            onOpenChange={(open) => {
                                if (!open && isBusy) return
                                setDeleteConfirmOpen(open)
                            }}
                        >
                            <AlertDialogTrigger asChild>
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm"
                                    disabled={isBusy}
                                >
                                    <Trash2 className="mr-1 h-3 w-3" />
                                    删除站点
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除站点？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        此操作不可撤销。站点 &quot;{site.name}&quot; 及其所有文件将被永久删除。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isBusy}>取消</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDelete}
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                        disabled={isBusy}
                                    >
                                        {deleteLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                删除中...
                                            </>
                                        ) : (
                                            '确认删除'
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <div className="flex gap-3">
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
                                {isBusy ? '保存中...' : '保存更改'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
