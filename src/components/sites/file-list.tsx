'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Folder, FolderOpen, Trash2, Loader2, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react'

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

interface TreeNode {
  name: string
  path: string
  isFolder: boolean
  size?: number
  lastModified?: string
  children: TreeNode[]
}

function buildFileTree(files: SiteFile[]): TreeNode[] {
  const root: TreeNode[] = []

  for (const file of files) {
    const parts = file.path.split('/')
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLastPart = i === parts.length - 1
      const currentPath = parts.slice(0, i + 1).join('/')

      let existingNode = currentLevel.find(node => node.name === part)

      if (!existingNode) {
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          isFolder: !isLastPart,
          children: [],
        }

        if (isLastPart) {
          newNode.size = file.size
          newNode.lastModified = file.lastModified
        }

        currentLevel.push(newNode)
        existingNode = newNode
      }

      currentLevel = existingNode.children
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1
      if (!a.isFolder && b.isFolder) return 1
      return a.name.localeCompare(b.name)
    }).map(node => ({
      ...node,
      children: sortNodes(node.children)
    }))
  }

  return sortNodes(root)
}

interface FileTreeNodeProps {
  node: TreeNode
  level: number
  expandedFolders: Set<string>
  toggleFolder: (path: string) => void
  onDelete: (file: SiteFile) => void
  deleting: string | null
  formatFileSize: (bytes: number) => string
}

function FileTreeNode({
  node,
  level,
  expandedFolders,
  toggleFolder,
  onDelete,
  deleting,
  formatFileSize,
}: FileTreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path)
  const paddingLeft = level * 20

  if (node.isFolder) {
    return (
      <div>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 cursor-pointer transition-colors"
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
          onClick={() => toggleFolder(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-amber-500 flex-shrink-0" />
          )}
          <span className="font-medium text-sm">{node.name}</span>
        </div>
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                level={level + 1}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                onDelete={onDelete}
                deleting={deleting}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 transition-colors group"
      style={{ paddingLeft: `${paddingLeft + 32}px` }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm truncate" title={node.name}>{node.name}</span>
        {node.size !== undefined && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatFileSize(node.size)}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete({ name: node.name, path: node.path, size: node.size || 0, lastModified: node.lastModified || '' })}
        disabled={deleting === node.path}
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 hover:bg-red-50 transition-opacity"
      >
        {deleting === node.path ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}

export function FileList({ siteId }: FileListProps) {
  const router = useRouter()
  const [files, setFiles] = useState<SiteFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [fileToDelete, setFileToDelete] = useState<SiteFile | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const fileTree = useMemo(() => buildFileTree(files), [files])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const result = await listSiteFiles(siteId)
      if (result.error) {
        console.error('Load files error:', result.error)
      } else if (result.files) {
        setFiles(result.files)
        const folders = new Set<string>()
        result.files.forEach(file => {
          const parts = file.path.split('/')
          for (let i = 1; i < parts.length; i++) {
            folders.add(parts.slice(0, i).join('/'))
          }
        })
        setExpandedFolders(folders)
      }
    } catch (err) {
      console.error('Load files error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

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

      <div className="border rounded-lg overflow-hidden">
        {fileTree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            onDelete={setFileToDelete}
            deleting={deleting}
            formatFileSize={formatFileSize}
          />
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
