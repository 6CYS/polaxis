"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Globe, ExternalLink } from "lucide-react"

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
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{displayName}</span>
                    </div>
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
            accessorKey: "slug",
            header: "别名 (Slug)",
            cell: ({ row }) => {
                return (
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        /{row.getValue("slug")}
                    </code>
                )
            },
        },
        {
            id: "url",
            header: "访问地址",
            cell: ({ row }) => {
                const site = row.original
                const url = `/s/${username}/${site.slug}`
                return (
                    <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {url}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => window.open(url, '_blank')}
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
