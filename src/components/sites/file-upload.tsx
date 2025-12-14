'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

interface FileUploadProps {
    siteId: string
    userId: string
    hasExistingFile: boolean
}

export function FileUpload({ siteId, userId, hasExistingFile }: FileUploadProps) {
    const router = useRouter()
    const [isDragging, setIsDragging] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const uploadFile = async (file: File) => {
        // 验证文件类型
        if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
            setErrorMessage('请上传 HTML 文件（.html 或 .htm）')
            setUploadStatus('error')
            return
        }

        // 验证文件大小（最大 5MB）
        if (file.size > 5 * 1024 * 1024) {
            setErrorMessage('文件大小不能超过 5MB')
            setUploadStatus('error')
            return
        }

        setUploading(true)
        setUploadStatus('idle')
        setErrorMessage(null)

        try {
            const filePath = `${userId}/${siteId}/index.html`

            const { error } = await supabase.storage
                .from('sites')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true, // 覆盖已存在的文件
                })

            if (error) {
                throw error
            }

            setUploadStatus('success')
            router.refresh()
        } catch (err: any) {
            console.error('Upload error:', err)
            setErrorMessage(err.message || '上传失败，请稍后重试')
            setUploadStatus('error')
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            uploadFile(file)
        }
    }, [siteId, userId])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            uploadFile(file)
        }
    }

    return (
        <div className="space-y-4">
            <div
                className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center
                    transition-colors cursor-pointer
                    ${isDragging 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }
                    ${uploading ? 'pointer-events-none opacity-60' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".html,.htm"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">上传中...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="font-medium">
                            拖拽 HTML 文件到这里，或点击选择文件
                        </p>
                        <p className="text-sm text-muted-foreground">
                            支持 .html 和 .htm 文件，最大 5MB
                        </p>
                    </div>
                )}
            </div>

            {uploadStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                        {hasExistingFile ? '文件更新成功！' : '文件上传成功！'}
                    </span>
                </div>
            )}

            {uploadStatus === 'error' && errorMessage && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                </div>
            )}

            {hasExistingFile && (
                <div className="flex items-center gap-2 text-muted-foreground bg-muted rounded-lg p-3">
                    <FileText className="h-5 w-5" />
                    <span className="text-sm">
                        已有 index.html 文件，重新上传将覆盖原有文件
                    </span>
                </div>
            )}
        </div>
    )
}


