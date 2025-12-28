'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, FileCode, Trash2, Pencil, FolderOpen } from 'lucide-react'
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
import { updateSite, deleteSite, uploadSiteFiles } from '@/lib/actions/sites'
import { Site } from '@/lib/database.types'

interface EditSiteDialogProps {
    site: Site
    trigger?: React.ReactNode
}

interface FileWithPath {
    file: File
    path: string
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
    const [files, setFiles] = useState<FileWithPath[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const toastId = `site-edit-${site.id}`

    const isBusy = loading || deleteLoading || isRefreshing

    const resetForm = useCallback(() => {
        setName(site.name)
        setDescription(site.description || '')
        setFiles([])
        setError(null)
        setSuccess(null)
        setIsDragging(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [site.description, site.name])

    useEffect(() => {
        if (!shouldCloseOnRefresh || isRefreshing) return

        queueMicrotask(() => {
            setOpen(false)
            resetForm()
            setLoading(false)
            setShouldCloseOnRefresh(false)
            setSuccess(null)
        })
    }, [isRefreshing, resetForm, shouldCloseOnRefresh])

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const processEntryRecursive = async (
        entry: any,
        path: string,
        filesList: FileWithPath[]
    ) => {
        if (entry.isFile) {
            const file = await new Promise<File>((resolve) => {
                entry.file((f: File) => resolve(f))
            })
            const relativePath = path ? `${path}/${file.name}` : file.name
            filesList.push({ file, path: relativePath })
        } else if (entry.isDirectory) {
            const reader = entry.createReader()
            const entries = await new Promise<any[]>((resolve) => {
                reader.readEntries((e: any[]) => resolve(e))
            })
            for (const subEntry of entries) {
                await processEntryRecursive(
                    subEntry,
                    path ? `${path}/${entry.name}` : entry.name,
                    filesList
                )
            }
        }
    }

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const items = e.dataTransfer.items
        const filesList: FileWithPath[] = []

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry()
                if (entry) {
                    if (entry.isDirectory) {
                        // 递归处理目录内容，但不包含顶层文件夹名称
                        const reader = entry.createReader()
                        const entries = await new Promise<any[]>((resolve) => {
                            reader.readEntries((e: any[]) => resolve(e))
                        })
                        for (const subEntry of entries) {
                            await processEntryRecursive(subEntry, '', filesList)
                        }
                    } else {
                        // 单个文件
                        const file = item.getAsFile()
                        if (file) {
                            filesList.push({ file, path: file.name })
                        }
                    }
                }
            }
        }

        // 验证必须包含 HTML 文件
        const hasHtmlFile = filesList.some(({ file }) =>
            file.name.endsWith('.html') || file.name.endsWith('.htm')
        )

        if (!hasHtmlFile) {
            setError('文件夹中必须包含至少一个 HTML 文件')
            return
        }

        setFiles(filesList)
        setError(null)
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files
        if (selectedFiles && selectedFiles.length > 0) {
            const filesList: FileWithPath[] = []

            // 处理通过 input 选择的文件
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i]
                // 从 webkitRelativePath 获取相对路径
                const fullPath = (file as any).webkitRelativePath || file.name

                // 去掉顶层文件夹名称，只保留相对路径
                const pathParts = fullPath.split('/')
                if (pathParts.length > 1) {
                    // 去掉第一部分（文件夹名），保留剩余路径
                    const relativePath = pathParts.slice(1).join('/')
                    filesList.push({ file, path: relativePath })
                } else {
                    // 单个文件，没有文件夹结构
                    filesList.push({ file, path: file.name })
                }
            }

            // 验证必须包含 HTML 文件
            const hasHtmlFile = filesList.some(({ file }) =>
                file.name.endsWith('.html') || file.name.endsWith('.htm')
            )

            if (!hasHtmlFile) {
                setError('文件夹中必须包含至少一个 HTML 文件')
                return
            }

            setFiles(filesList)
            setError(null)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }

    const totalSize = files.reduce((sum, { file }) => sum + file.size, 0)
    const htmlFileCount = files.filter(({ file }) =>
        file.name.endsWith('.html') || file.name.endsWith('.htm')
    ).length

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)
        toast.loading('保存中...', { id: toastId })

        // 更新站点信息
        const formData = new FormData()
        formData.set('name', name)
        formData.set('description', description)

        let updateResult: Awaited<ReturnType<typeof updateSite>>
        try {
            updateResult = await updateSite(site.id, formData)
        } catch (e) {
            console.error(e)
            toast.error('保存失败，请稍后重试', { id: toastId })
            setLoading(false)
            return
        }

        if (updateResult?.error) {
            setError(updateResult.error)
            toast.error(updateResult.error, { id: toastId })
            setLoading(false)
            return
        }

        // 如果有新文件，上传文件
        if (files.length > 0) {
            const fileFormData = new FormData()
            files.forEach(({ file, path }, index) => {
                fileFormData.append(`file-${index}`, file)
                fileFormData.append(`path-${file.name}`, path)
            })

            let uploadResult: Awaited<ReturnType<typeof uploadSiteFiles>>
            try {
                uploadResult = await uploadSiteFiles(site.id, fileFormData)
            } catch (e) {
                console.error(e)
                toast.error('文件上传失败，请稍后重试', { id: toastId })
                setLoading(false)
                return
            }

            if (uploadResult?.error) {
                setError(uploadResult.error)
                toast.error(uploadResult.error, { id: toastId })
                setLoading(false)
                return
            }
        }

        setSuccess('保存成功')
        setFiles([])
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }

        toast.success('保存成功，正在刷新...', { id: toastId })
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
            <DialogContent className="!max-w-5xl">
                <DialogHeader>
                    <DialogTitle>编辑站点</DialogTitle>
                    <DialogDescription>
                        修改站点信息或重新上传文件夹覆盖原有内容
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1px 400px' }}>
                        {/* 左侧：文件上传区域 */}
                        <div className="space-y-4">
                            {/* 拖拽上传区域 */}
                            <div className="space-y-2">
                                <Label>重新上传文件夹（可选）</Label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                        isDragging
                                            ? 'border-primary bg-primary/10'
                                            : files.length > 0
                                                ? 'border-primary bg-primary/5'
                                                : 'border-muted-foreground/25 hover:border-primary/50'
                                    }`}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        // @ts-ignore
                                        webkitdirectory=""
                                        directory=""
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                        disabled={isBusy}
                                    />
                                    {files.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-center gap-2 text-primary">
                                                <FolderOpen className="h-6 w-6" />
                                                <span className="font-medium text-lg">
                                                    {files.length} 个文件 ({formatFileSize(totalSize)})
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                包含 {htmlFileCount} 个 HTML 文件
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <Upload className={`h-12 w-12 ${isDragging ? 'text-primary' : ''}`} />
                                            <div className="space-y-1">
                                                <p className="text-base font-medium">
                                                    {isDragging ? '松开鼠标上传文件夹' : '拖拽文件夹到此处，或点击选择'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    上传新文件夹将覆盖原有所有文件
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 使用说明 */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-muted">
                                <div className="flex items-start gap-2">
                                    <FileCode className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <h4 className="font-semibold text-sm">推荐的文件夹结构</h4>
                                        <div className="bg-background/80 rounded-md p-3 font-mono text-xs space-y-0.5">
                                            <div className="text-muted-foreground">my-website/</div>
                                            <div className="text-muted-foreground pl-4">├── index.html <span className="text-primary">← 必需</span></div>
                                            <div className="text-muted-foreground pl-4">├── css/</div>
                                            <div className="text-muted-foreground pl-8">│   └── styles.css</div>
                                            <div className="text-muted-foreground pl-4">├── js/</div>
                                            <div className="text-muted-foreground pl-8">│   └── script.js</div>
                                            <div className="text-muted-foreground pl-4">└── images/</div>
                                            <div className="text-muted-foreground pl-8">    └── logo.png</div>
                                        </div>
                                        <div className="space-y-1.5 text-xs text-muted-foreground">
                                            <p>• 必须包含至少一个 <code className="px-1.5 py-0.5 bg-background rounded text-foreground">.html</code> 文件</p>
                                            <p>• 单个文件不超过 5MB，总大小不超过 50MB</p>
                                            <p>• 上传新文件夹将完全覆盖原有文件</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 中间分割线 */}
                        <div className="bg-border"></div>

                        {/* 右侧：站点信息 */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">站点名称 <span className="text-red-500">*</span></Label>
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

                            {error && (
                                <div className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="text-sm font-medium text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                                    {success}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4">
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
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
