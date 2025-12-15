'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, PlusCircle, Upload, FileCode } from 'lucide-react'

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

export function CreateSiteDialog({ trigger }: CreateSiteDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSlugChange = (value: string) => {
        const formatted = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-/, '') // 只去掉开头的短横线，保留结尾的以便继续输入
        setSlug(formatted)
    }

    // 从文件名生成站点名称和 slug
    const generateNameFromFile = (fileName: string) => {
        // 去掉 .html 或 .htm 后缀
        const nameWithoutExt = fileName.replace(/\.(html|htm)$/i, '')
        return nameWithoutExt
    }

    const generateSlugFromName = (siteName: string) => {
        return siteName
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '-') // 保留中文、字母、数字和连字符
            .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文字符（slug 只能是英文）
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
    }

    const processFile = (selectedFile: File) => {
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

        // 自动填充站点名称和 slug
        const siteName = generateNameFromFile(selectedFile.name)
        setName(siteName)
        
        const siteSlug = generateSlugFromName(siteName)
        if (siteSlug) {
            setSlug(siteSlug)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            processFile(selectedFile)
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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const droppedFile = e.dataTransfer.files?.[0]
        if (droppedFile) {
            processFile(droppedFile)
        }
    }

    const resetForm = () => {
        setName('')
        setSlug('')
        setFile(null)
        setError(null)
        setIsDragging(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    async function handleSubmit(formData: FormData) {
        if (!file) {
            setError('请上传 HTML 文件')
            return
        }

        setLoading(true)
        setError(null)

        formData.set('name', name)
        formData.set('slug', slug)
        formData.set('file', file)

        const result = await createSiteWithFile(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else if (result?.success) {
            setOpen(false)
            resetForm()
            setLoading(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>创建新站点</DialogTitle>
                    <DialogDescription>
                        拖拽 HTML 文件到下方区域，或点击选择文件
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    {/* 拖拽上传区域 */}
                    <div className="space-y-2">
                        <Label>HTML 文件 <span className="text-red-500">*</span></Label>
                        <div 
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                                isDragging 
                                    ? 'border-primary bg-primary/10' 
                                    : file 
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
                                    <Upload className={`h-10 w-10 ${isDragging ? 'text-primary' : ''}`} />
                                    <span className="text-sm font-medium">
                                        {isDragging ? '松开鼠标上传文件' : '拖拽文件到此处，或点击选择'}
                                    </span>
                                    <span className="text-xs">支持 .html 和 .htm，最大 5MB</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">站点名称</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="我的个人主页"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">别名 (Slug)</Label>
                        <Input
                            id="slug"
                            name="slug"
                            placeholder="my-site"
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            required
                            disabled={loading}
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
                            disabled={loading}
                        />
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
                            disabled={loading}
                        >
                            取消
                        </Button>
                        <Button type="submit" disabled={loading || !file}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? '创建中...' : '创建站点'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
