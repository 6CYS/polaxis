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
    const [slug, setSlug] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSlugChange = (value: string) => {
        const formatted = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
        setSlug(formatted)
    }

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
        setSlug('')
        setFile(null)
        setError(null)
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
            if (result.siteId) {
                router.push(`/dashboard/sites/${result.siteId}`)
            }
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
                        填写站点信息并上传 HTML 文件
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">站点名称</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="我的个人主页"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug</Label>
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

                    <div className="space-y-2">
                        <Label>HTML 文件 <span className="text-red-500">*</span></Label>
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
                                    <Upload className="h-8 w-8" />
                                    <span className="text-sm">点击上传 HTML 文件</span>
                                    <span className="text-xs">支持 .html 和 .htm，最大 5MB</span>
                                </div>
                            )}
                        </div>
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

