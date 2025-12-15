'use client'

import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditSiteDialog } from '@/components/sites/edit-site-dialog'
import { Site } from '@/lib/database.types'

interface SiteActionsProps {
    site: Site
    username: string
}

export function SiteActions({ site }: SiteActionsProps) {
    return (
        <div className="flex items-center justify-center">
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
