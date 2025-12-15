'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
    Globe, 
    LayoutGrid, 
    List, 
    PlusCircle,
    Calendar,
    Clock,
    ExternalLink,
    Pencil
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { createColumns } from '@/components/sites/columns'
import { CreateSiteDialog } from '@/components/sites/create-site-dialog'
import { EditSiteDialog } from '@/components/sites/edit-site-dialog'
import { Site } from '@/lib/database.types'

interface SitesListProps {
    sites: Site[]
    username: string
}

type ViewMode = 'list' | 'card'

export function SitesList({ sites, username }: SitesListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const columns = createColumns(username)

    if (sites.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">暂无站点</h4>
                    <p className="text-muted-foreground text-center mb-4">
                        您还没有创建任何站点，点击下方按钮开始创建
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
            {/* 工具栏：创建按钮 + 视图切换 */}
            <div className="flex items-center justify-between">
                <CreateSiteDialog />
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
                <DataTable columns={columns} data={sites} />
            )}

            {/* 卡片视图 */}
            {viewMode === 'card' && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sites.map((site) => {
                        const siteUrl = `/s/${username}/${site.slug}`
                        return (
                            <Card key={site.id} className="group hover:shadow-md transition-all hover:border-primary/20">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Globe className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="space-y-1 min-w-0">
                                                <CardTitle className="text-base truncate">
                                                    <Link 
                                                        href={`/sites/${site.id}`}
                                                        className="hover:underline"
                                                    >
                                                        {site.name}
                                                    </Link>
                                                </CardTitle>
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
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
                                    <div className="flex items-center gap-2">
                                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate flex-1">
                                            {siteUrl}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0"
                                            onClick={() => window.open(siteUrl, '_blank')}
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>

                                    {/* 描述 */}
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                        {site.description || '暂无描述'}
                                    </p>

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
