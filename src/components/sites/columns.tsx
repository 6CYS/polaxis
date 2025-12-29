"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Site } from "@/lib/database.types"
import { SiteActions } from "@/components/sites/site-actions"

export function createColumns(username: string): ColumnDef<Site>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="全选"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="选择行"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: "站点名称",
            cell: ({ row }) => {
                const site = row.original
                const displayName = site.name.length > 12 ? `${site.name.slice(0, 12)}...` : site.name

                const content = (
                    <Link
                        href={`/sites/${site.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold text-sm flex-shrink-0">
                            {site.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium hover:underline">{displayName}</span>
                    </Link>
                )

                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {content}
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p className="font-medium">{site.name}</p>
                                {site.description && (
                                    <p className="text-muted-foreground text-sm mt-1">{site.description}</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            },
        },
        {
            id: "url",
            header: "访问地址",
            cell: ({ row }) => {
                const site = row.original
                const path = `/s/${username}/${site.slug}`
                const handleCopy = () => {
                    const fullUrl = `${window.location.origin}${path}`
                    navigator.clipboard.writeText(fullUrl).then(() => {
                        toast.success('已复制到剪贴板')
                    }).catch(() => {
                        toast.error('复制失败')
                    })
                }
                return (
                    <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {path}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleCopy}
                            title="复制地址"
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(path, '_blank')}
                            title="在新窗口打开"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )
            },
        },
        {
            accessorKey: "created_at",
            header: "创建时间",
            cell: ({ row }) => {
                const date = new Date(row.getValue("created_at"))
                return (
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                        {date.toLocaleDateString("zh-CN")}
                    </span>
                )
            },
        },
        {
            accessorKey: "updated_at",
            header: "更新时间",
            cell: ({ row }) => {
                const date = new Date(row.getValue("updated_at"))
                return (
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                        {date.toLocaleDateString("zh-CN")}
                    </span>
                )
            },
        },
        {
            id: "actions",
            header: () => <div className="text-center">操作</div>,
            size: 1,
            cell: ({ row }) => {
                const site = row.original
                return <SiteActions site={site} username={username} />
            },
        },
    ]
}
