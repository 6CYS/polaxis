'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RowSelectionState } from '@tanstack/react-table'
import {
    Globe,
    LayoutGrid,
    List,
    PlusCircle,
    Calendar,
    Clock,
    ExternalLink,
    Copy,
    Pencil,
    Trash2
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { DataTable } from '@/components/ui/data-table'
import { createColumns } from '@/components/sites/columns'
import { CreateSiteDialog } from '@/components/sites/create-site-dialog'
import { EditSiteDialog } from '@/components/sites/edit-site-dialog'
import { deleteSites } from '@/lib/actions/sites'
import { Site } from '@/lib/database.types'

interface SitesListProps {
    sites: Site[]
    username: string
}

type ViewMode = 'list' | 'card'

export function SitesList({ sites, username }: SitesListProps) {
    const router = useRouter()
    const [isRefreshing, startTransition] = useTransition()
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [isDeleting, setIsDeleting] = useState(false)
    const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)
    const [shouldCloseOnRefresh, setShouldCloseOnRefresh] = useState(false)
    const toastId = 'sites-batch-delete'
    const columns = createColumns(username)

    const isBusy = isDeleting || isRefreshing

    // 获取选中的站点 ID
    const selectedSiteIds = Object.keys(rowSelection)
        .filter(key => rowSelection[key])
        .map(index => sites[parseInt(index)]?.id)
        .filter(Boolean) as string[]

    const selectedCount = selectedSiteIds.length

    useEffect(() => {
        if (!shouldCloseOnRefresh || isRefreshing) return

        queueMicrotask(() => {
            setRowSelection({})
            setIsDeleting(false)
            setBatchDeleteDialogOpen(false)
            setShouldCloseOnRefresh(false)
        })
    }, [isRefreshing, shouldCloseOnRefresh])

    const handleBatchDelete = async () => {
        if (selectedSiteIds.length === 0) return

        setIsDeleting(true)
        toast.loading('删除中...', { id: toastId })
        try {
            const result = await deleteSites(selectedSiteIds)
            if (result.error) {
                console.error('Delete sites error:', result.error)
                toast.error(result.error, { id: toastId })
                setIsDeleting(false)
                return
            }
        } catch (error) {
            console.error('Delete sites error:', error)
            toast.error('删除失败，请稍后重试', { id: toastId })
            setIsDeleting(false)
            return
        }

        toast.success('删除成功，正在刷新...', { id: toastId })
        setShouldCloseOnRefresh(true)
        startTransition(() => {
            router.refresh()
        })
    }

    if (sites.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">暂无站点</h4>
                    <p className="text-muted-foreground text-center mb-4 max-w-md">
                        拖拽文件夹即可创建站点，支持 HTML、CSS、JS、图片等多种文件
                    </p>
                    <CreateSiteDialog
                        trigger={
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                创建第一个站点
                            </Button>
                        }
                    />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* 工具栏：创建按钮 + 批量操作 + 视图切换 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CreateSiteDialog />
                    {selectedCount > 0 && (
                        <AlertDialog
                            open={batchDeleteDialogOpen}
                            onOpenChange={(open) => {
                                if (!open && isBusy) return
                                setBatchDeleteDialogOpen(open)
                            }}
                        >
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isDeleting}>
                                    <Trash2 className="h-4 w-4 mr-1.5" />
                                    删除 ({selectedCount})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        您确定要删除选中的 {selectedCount} 个站点吗？此操作不可撤销，站点的所有数据和文件都将被永久删除。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isBusy}>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleBatchDelete}
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                        disabled={isBusy}
                                    >
                                        {isBusy ? '删除中...' : '确认删除'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
                <div className="inline-flex items-center rounded-lg border p-1 bg-muted/50">
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4 mr-1.5" />
                        列表
                    </Button>
                    <Button
                        variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => setViewMode('card')}
                    >
                        <LayoutGrid className="h-4 w-4 mr-1.5" />
                        卡片
                    </Button>
                </div>
            </div>

            {/* 列表视图 - 使用 DataTable */}
            {viewMode === 'list' && (
                <DataTable
                    columns={columns}
                    data={sites}
                    rowSelection={rowSelection}
                    onRowSelectionChange={setRowSelection}
                />
            )}

            {/* 卡片视图 */}
            {viewMode === 'card' && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sites.map((site) => {
                        const siteUrl = `/s/${username}/${site.slug}`
                        return (
                            <Card key={site.id} className="group hover:shadow-md transition-all hover:border-primary/20">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold text-base flex-shrink-0">
                                                {site.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-1 min-w-0 flex-1">
                                                {site.name.length > 12 ? (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <CardTitle className="text-base cursor-default">
                                                                    {site.name.slice(0, 12)}...
                                                                </CardTitle>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{site.name}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ) : (
                                                    <CardTitle className="text-base cursor-default">
                                                        {site.name}
                                                    </CardTitle>
                                                )}
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono block truncate">
                                                    /{site.slug}
                                                </code>
                                            </div>
                                        </div>
                                        <EditSiteDialog
                                            site={site}
                                            trigger={
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* 访问地址 */}
                                    <div className="flex items-center gap-1">
                                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate flex-1">
                                            {siteUrl}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0"
                                            onClick={() => {
                                                const fullUrl = `${window.location.origin}${siteUrl}`
                                                navigator.clipboard.writeText(fullUrl).then(() => {
                                                    toast.success('已复制到剪贴板')
                                                }).catch(() => {
                                                    toast.error('复制失败')
                                                })
                                            }}
                                            title="复制地址"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0"
                                            onClick={() => window.open(siteUrl, '_blank')}
                                            title="在新窗口打开"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    {/* 描述 */}
                                    {site.description && site.description.length > 30 ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p className="text-sm text-muted-foreground cursor-default min-h-[2.5rem]">
                                                        {site.description.slice(0, 30)}...
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <p>{site.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <p className="text-sm text-muted-foreground min-h-[2.5rem]">
                                            {site.description || '暂无描述'}
                                        </p>
                                    )}

                                    {/* 时间信息 */}
                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            创建: {new Date(site.created_at).toLocaleDateString('zh-CN')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            更新: {new Date(site.updated_at).toLocaleDateString('zh-CN')}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
