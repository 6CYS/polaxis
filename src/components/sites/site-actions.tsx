'use client'

import { ExternalLink, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditSiteDialog } from '@/components/sites/edit-site-dialog'
import { Site } from '@/lib/database.types'

interface SiteActionsProps {
    site: Site
    username: string
}

export function SiteActions({ site, username }: SiteActionsProps) {
    const siteUrl = `/s/${username}/${site.slug}`

    const handleView = () => {
        window.open(siteUrl, '_blank')
    }

    return (
        <div className="flex items-center justify-center gap-1">
            <Button 
                variant="ghost" 
                size="sm"
                onClick={handleView}
            >
                <ExternalLink className="mr-1 h-3 w-3" />
                查看
            </Button>
            <EditSiteDialog 
                site={site}
                trigger={
                    <Button variant="ghost" size="sm">
                        <Pencil className="mr-1 h-3 w-3" />
                        编辑
                    </Button>
                }
            />
        </div>
    )
}
