'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { uploadSiteFiles } from '@/lib/actions/sites'
import { isAllowedFileType, MAX_FILE_SIZE } from '@/lib/mime-types'

interface MultiFileUploadProps {
  siteId: string
}

interface FileWithPath {
  file: File
  path: string
}

export function MultiFileUpload({ siteId }: MultiFileUploadProps) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = (items: DataTransferItemList | FileList) => {
    const files: FileWithPath[] = []

    const processItem = async (item: DataTransferItem | File, path = '') => {
      if ('webkitGetAsEntry' in item && item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          await processEntry(entry, path)
        }
      } else if (item instanceof File) {
        files.push({ file: item, path: item.name })
      }
    }

    const processEntry = async (entry: any, path = '') => {
      if (entry.isFile) {
        const file = await new Promise<File>((resolve) => {
          entry.file((f: File) => resolve(f))
        })
        const relativePath = path ? `${path}/${file.name}` : file.name
        files.push({ file, path: relativePath })
      } else if (entry.isDirectory) {
        const reader = entry.createReader()
        const entries = await new Promise<any[]>((resolve) => {
          reader.readEntries((e: any[]) => resolve(e))
        })
        for (const subEntry of entries) {
          await processEntry(subEntry, path ? `${path}/${entry.name}` : entry.name)
        }
      }
    }

    return files
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const items = e.dataTransfer.items
    const newFiles: FileWithPath[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          await processEntryRecursive(entry, '', newFiles)
        }
      }
    }

    setSelectedFiles((prev) => [...prev, ...newFiles])
  }, [])

  const processEntryRecursive = async (
    entry: any,
    path: string,
    files: FileWithPath[]
  ) => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve) => {
        entry.file((f: File) => resolve(f))
      })
      const relativePath = path ? `${path}/${file.name}` : file.name
      files.push({ file, path: relativePath })
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = await new Promise<any[]>((resolve) => {
        reader.readEntries((e: any[]) => resolve(e))
      })
      for (const subEntry of entries) {
        await processEntryRecursive(
          subEntry,
          path ? `${path}/${entry.name}` : entry.name,
          files
        )
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles: FileWithPath[] = Array.from(files).map((file) => ({
        file,
        path: file.name,
      }))
      setSelectedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('请选择至少一个文件')
      setUploadStatus('error')
      return
    }

    // 验证文件
    for (const { file, path } of selectedFiles) {
      if (!isAllowedFileType(file.name)) {
        setErrorMessage(`不支持的文件类型: ${file.name}`)
        setUploadStatus('error')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`文件 ${file.name} 超过 5MB 限制`)
        setUploadStatus('error')
        return
      }
    }

    setUploading(true)
    setUploadStatus('idle')
    setErrorMessage(null)

    try {
      const formData = new FormData()

      selectedFiles.forEach(({ file, path }, index) => {
        formData.append(`file-${index}`, file)
        formData.append(`path-${file.name}`, path)
      })

      const result = await uploadSiteFiles(siteId, formData)

      if (result.error) {
        throw new Error(result.error)
      }

      setUploadStatus('success')
      setSelectedFiles([])
      router.refresh()
    } catch (err: any) {
      console.error('Upload error:', err)
      setErrorMessage(err.message || '上传失败，请稍后重试')
      setUploadStatus('error')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const totalSize = selectedFiles.reduce((sum, { file }) => sum + file.size, 0)

  return (
    <div className="space-y-4">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          transition-colors cursor-pointer
          ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('multi-file-input')?.click()}
      >
        <input
          id="multi-file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">拖拽文件或文件夹到这里，或点击选择文件</p>
          <p className="text-sm text-muted-foreground">
            支持 HTML, CSS, JS, 图片等文件，单个文件最大 5MB
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              已选择 {selectedFiles.length} 个文件（总大小: {formatFileSize(totalSize)}）
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
            >
              清空
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
            {selectedFiles.map(({ file, path }, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-2 hover:bg-muted rounded"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate" title={path}>
                    {path}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  disabled={uploading}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              `上传 ${selectedFiles.length} 个文件`
            )}
          </Button>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg p-3">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">文件上传成功！</span>
        </div>
      )}

      {uploadStatus === 'error' && errorMessage && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
