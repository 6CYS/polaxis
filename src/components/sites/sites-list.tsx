'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
    Globe, 
    LayoutGrid, 
    List, 
    PlusCircle,
    Calendar,
    FileText,
    ExternalLink
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { columns } from '@/components/sites/columns'
import { CreateSiteDialog } from '@/components/sites/create-site-dialog'
import { Site } from '@/lib/database.types'

interface SitesListProps {
    sites: Site[]
}

type ViewMode = 'list' | 'card'

export function SitesList({ sites }: SitesListProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('list')

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
                    {sites.map((site) => (
                        <Card key={site.id} className="group hover:shadow-md transition-all hover:border-primary/20">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Globe className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">
                                                <Link 
                                                    href={`/dashboard/sites/${site.id}`}
                                                    className="hover:underline"
                                                >
                                                    {site.name}
                                                </Link>
                                            </CardTitle>
                                            <CardDescription className="font-mono text-xs">
                                                /{site.slug}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        asChild
                                    >
                                        <Link href={`/dashboard/sites/${site.id}`}>
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                    {site.description || '暂无描述'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(site.created_at).toLocaleDateString('zh-CN')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        index.html
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
