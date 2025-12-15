"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Globe } from "lucide-react"

import { Site } from "@/lib/database.types"
import { SiteActions } from "@/components/sites/site-actions"

export function createColumns(username: string): ColumnDef<Site>[] {
    return [
        {
            accessorKey: "name",
            header: () => <div className="text-center">站点名称</div>,
            cell: ({ row }) => {
                const site = row.original
                return (
                <Link
                    href={`/sites/${site.id}`}
                    className="flex items-center gap-3 hover:underline"
                >
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{site.name}</span>
                    </Link>
                )
            },
        },
        {
            accessorKey: "slug",
            header: () => <div className="text-center">Slug</div>,
            cell: ({ row }) => {
                return (
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        /{row.getValue("slug")}
                    </code>
                )
            },
        },
        {
            accessorKey: "description",
            header: () => <div className="text-center">描述</div>,
            cell: ({ row }) => {
                const description = row.getValue("description") as string | null
                return (
                    <span className="text-muted-foreground text-sm line-clamp-1 max-w-[200px]">
                        {description || "—"}
                    </span>
                )
            },
        },
        {
            accessorKey: "created_at",
            header: () => <div className="text-center">创建时间</div>,
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
            id: "actions",
            header: () => <div className="text-center">操作</div>,
            cell: ({ row }) => {
                const site = row.original
                return <SiteActions site={site} username={username} />
            },
        },
    ]
}
