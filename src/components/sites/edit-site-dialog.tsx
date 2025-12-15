'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, FileCode, Trash2, Pencil } from 'lucide-react'

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
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [name, setName] = useState(site.name)
    const [description, setDescription] = useState(site.description || '')
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const resetForm = () => {
        setName(site.name)
        setDescription(site.description || '')
        setFile(null)
        setError(null)
        setSuccess(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        // 更新站点信息
        const formData = new FormData()
        formData.set('name', name)
        formData.set('description', description)

        const updateResult = await updateSite(site.id, formData)

        if (updateResult?.error) {
            setError(updateResult.error)
            setLoading(false)
            return
        }

        // 如果有新文件，上传文件
        if (file) {
            const fileFormData = new FormData()
            fileFormData.set('file', file)
            const uploadResult = await uploadSiteFile(site.id, fileFormData)

            if (uploadResult?.error) {
                setError(uploadResult.error)
                setLoading(false)
                return
            }
        }

        setSuccess('保存成功')
        setLoading(false)
        setFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        router.refresh()
    }

    async function handleDelete() {
        setDeleteLoading(true)
        const result = await deleteSite(site.id)
        if (result?.error) {
            setError(result.error)
            setDeleteLoading(false)
        }
        // deleteSite 会自动 redirect
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
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
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>URL Slug</Label>
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
                            disabled={loading}
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
                                disabled={loading}
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
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm"
                                    disabled={loading || deleteLoading}
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
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                                disabled={loading}
                            >
                                取消
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? '保存中...' : '保存更改'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
