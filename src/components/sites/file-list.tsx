'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Trash2, Loader2, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { listSiteFiles, deleteSiteFile } from '@/lib/actions/sites'
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

interface FileListProps {
  siteId: string
}

interface SiteFile {
  name: string
  path: string
  size: number
  lastModified: string
}

export function FileList({ siteId }: FileListProps) {
  const router = useRouter()
  const [files, setFiles] = useState<SiteFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<SiteFile | null>(null)

  const loadFiles = async () => {
    setLoading(true)
    try {
      const result = await listSiteFiles(siteId)
      if (result.error) {
        console.error('Load files error:', result.error)
      } else if (result.files) {
        setFiles(result.files)
      }
    } catch (err) {
      console.error('Load files error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [siteId])

  const handleDelete = async (file: SiteFile) => {
    setDeleting(file.path)
    try {
      const result = await deleteSiteFile(siteId, file.path)
      if (result.error) {
        console.error('Delete file error:', result.error)
      } else {
        await loadFiles()
        router.refresh()
      }
    } catch (err) {
      console.error('Delete file error:', err)
    } finally {
      setDeleting(null)
      setFileToDelete(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>暂无文件</p>
      </div>
    )
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {files.length} 个文件，总大小 {formatFileSize(totalSize)}
        </p>
        <Button variant="outline" size="sm" onClick={loadFiles}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <div className="border rounded-lg divide-y">
        {files.map((file) => (
          <div
            key={file.path}
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" title={file.path}>
                  {file.path}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)} · {formatDate(file.lastModified)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFileToDelete(file)}
              disabled={deleting === file.path}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleting === file.path ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog open={!!fileToDelete} onOpenChange={() => setFileToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除文件</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除文件 <span className="font-medium">{fileToDelete?.path}</span> 吗？
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleDelete(fileToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
