'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, PlusCircle, Upload, FolderOpen, FileCode } from 'lucide-react'
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
import { createSiteWithFile } from '@/lib/actions/sites'

interface CreateSiteDialogProps {
    trigger?: React.ReactNode
}

interface FileWithPath {
    file: File
    path: string
}

export function CreateSiteDialog({ trigger }: CreateSiteDialogProps) {
    const router = useRouter()
    const [isRefreshing, startTransition] = useTransition()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [shouldCloseOnRefresh, setShouldCloseOnRefresh] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [files, setFiles] = useState<FileWithPath[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const toastId = 'site-create'

    const isBusy = loading || isRefreshing

    function resetForm() {
        setName('')
        setSlug('')
        setFiles([])
        setError(null)
        setIsDragging(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSlugChange = (value: string) => {
        // 只保留字母、数字和短横线，其他字符直接过滤掉
        const formatted = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '')
        setSlug(formatted)
    }

    // 从文件夹名称生成站点名称和 slug
    const generateNameFromFolder = (folderName: string) => {
        return folderName
    }

    const generateSlugFromName = (siteName: string) => {
        return siteName
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '-') // 保留中文、字母、数字和连字符
            .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文字符（slug 只能是英文）
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
    }

    // 递归处理文件夹
    const processEntryRecursive = async (
        entry: FileSystemEntry,
        path: string,
        filesList: FileWithPath[]
    ) => {
        if (entry.isFile) {
            const fileEntry = entry as FileSystemFileEntry
            const file = await new Promise<File>((resolve) => {
                fileEntry.file((f: File) => resolve(f))
            })
            const relativePath = path ? `${path}/${file.name}` : file.name
            filesList.push({ file, path: relativePath })
        } else if (entry.isDirectory) {
            const dirEntry = entry as FileSystemDirectoryEntry
            const reader = dirEntry.createReader()
            const entries = await new Promise<FileSystemEntry[]>((resolve) => {
                reader.readEntries((e) => resolve(e))
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

    const processFiles = async (items: DataTransferItemList) => {
        const filesList: FileWithPath[] = []
        let folderName = ''

        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry()
                if (entry) {
                    if (entry.isDirectory) {
                        folderName = entry.name
                        // 递归处理目录内容，但不包含顶层文件夹名称
                        const dirEntry = entry as FileSystemDirectoryEntry
                        const reader = dirEntry.createReader()
                        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
                            reader.readEntries((e) => resolve(e))
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

        // 自动填充站点名称和 slug
        if (folderName) {
            const siteName = generateNameFromFolder(folderName)
            setName(siteName)

            const siteSlug = generateSlugFromName(siteName)
            if (siteSlug) {
                setSlug(siteSlug)
            }
        }
    }

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

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        await processFiles(e.dataTransfer.items)
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files
        if (selectedFiles && selectedFiles.length > 0) {
            const filesList: FileWithPath[] = []
            let folderName = ''

            // 处理通过 input 选择的文件
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i]
                // 从 webkitRelativePath 获取相对路径
                const fullPath = (file as any).webkitRelativePath || file.name

                // 去掉顶层文件夹名称，只保留相对路径
                // 例如：landing-page/css/styles.css -> css/styles.css
                // 例如：landing-page/index.html -> index.html
                const pathParts = fullPath.split('/')
                if (pathParts.length > 1) {
                    // 第一次遇到时，记录文件夹名称
                    if (!folderName) {
                        folderName = pathParts[0]
                    }
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

            // 使用提取的文件夹名称
            if (folderName) {
                const siteName = generateNameFromFolder(folderName)
                setName(siteName)

                const siteSlug = generateSlugFromName(siteName)
                if (siteSlug) {
                    setSlug(siteSlug)
                }
            }
        }
    }

    useEffect(() => {
        if (!shouldCloseOnRefresh || isRefreshing) return

        queueMicrotask(() => {
            setOpen(false)
            resetForm()
            setLoading(false)
            setShouldCloseOnRefresh(false)
        })
    }, [isRefreshing, shouldCloseOnRefresh])

    async function handleSubmit(formData: FormData) {
        if (files.length === 0) {
            setError('请选择文件夹')
            return
        }

        setLoading(true)
        setError(null)

        formData.set('name', name)
        formData.set('slug', slug)

        // 添加所有文件到 formData
        files.forEach(({ file, path }, index) => {
            formData.append(`file-${index}`, file)
            formData.append(`path-${file.name}`, path)
        })

        toast.loading('创建站点中...', { id: toastId })
        let result: Awaited<ReturnType<typeof createSiteWithFile>>
        try {
            result = await createSiteWithFile(formData)
        } catch (e) {
            console.error(e)
            toast.error('创建失败，请稍后重试', { id: toastId })
            setLoading(false)
            return
        }

        if (result?.error) {
            setError(result.error)
            toast.error(result.error, { id: toastId })
            setLoading(false)
        } else if (result?.success) {
            toast.success('创建成功，正在刷新...', { id: toastId })
            setShouldCloseOnRefresh(true)
            startTransition(() => {
                router.refresh()
            })
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

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen && isBusy) return
            setOpen(isOpen)
            if (!isOpen) resetForm()
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        创建站点
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="!max-w-5xl">
                <DialogHeader>
                    <DialogTitle>创建新站点</DialogTitle>
                    <DialogDescription>
                        上传您的静态网站文件夹，快速部署到 Polaxis
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1px 400px' }}>
                        {/* 左侧：文件上传区域 */}
                        <div className="space-y-4">
                            {/* 拖拽上传区域 */}
                            <div className="space-y-2">
                                <Label>上传文件夹 <span className="text-red-500">*</span></Label>
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
                                                    支持 HTML, CSS, JS, 图片等静态文件
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
                                            <p>• 支持相对路径引用 CSS、JS 和图片资源</p>
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
                                <Label htmlFor="name">站点名称 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="我的个人主页"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    disabled={isBusy}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">别名 (Slug) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    placeholder="my-site"
                                    value={slug}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                    required
                                    disabled={isBusy}
                                />
                                <p className="text-xs text-muted-foreground">
                                    访问地址: /s/用户名/<span className="font-mono text-foreground">{slug || 'your-slug'}</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">描述（可选）</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder="简单描述一下这个站点..."
                                    disabled={isBusy}
                                />
                            </div>

                            {error && (
                                <div className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={isBusy}
                                >
                                    取消
                                </Button>
                                <Button type="submit" disabled={isBusy || files.length === 0}>
                                    {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isBusy ? '创建中...' : '创建站点'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
