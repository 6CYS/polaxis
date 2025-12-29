import Link from 'next/link'
import { ExternalLink, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditSiteDialog } from '@/components/sites/edit-site-dialog'
import { MultiFileUpload } from '@/components/sites/multi-file-upload'
import { FileList } from '@/components/sites/file-list'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface SitePageProps {
    params: Promise<{ siteId: string }>
}

export default async function SitePage({ params }: SitePageProps) {
    const { siteId } = await params
    const supabase = await createServerSupabaseClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>需要登录</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/login">去登录</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const { data: site } = await supabase
        .from('po_sites')
        .select('id,user_id,name,slug,description,created_at,updated_at')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single()

    if (!site) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>站点不存在或无权限</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" asChild>
                        <Link href="/sites">返回站点列表</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const username = user.email ? user.email.split('@')[0] : user.id.substring(0, 8)
    const publicUrl = `/s/${username}/${site.slug}`

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    <Button variant="ghost" size="icon" asChild className="h-9 w-9 flex-shrink-0">
                        <Link href="/sites">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight truncate">{site.name}</h2>
                    <code className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">{publicUrl}</code>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href={publicUrl} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            打开站点
                        </Link>
                    </Button>
                    <EditSiteDialog site={site} />
                </div>
            </div>

            <Card className="py-4 gap-3">
                <CardHeader className="px-4 py-0">
                    <CardTitle className="text-base">站点信息</CardTitle>
                </CardHeader>
                <CardContent className="px-4 text-sm">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">Slug：</span>
                            <span className="font-mono">/{site.slug}</span>
                        </div>
                        {site.description && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground">描述：</span>
                                <span>{site.description}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">创建时间：</span>
                            <span>{new Date(site.created_at).toLocaleString('zh-CN')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">更新时间：</span>
                            <span>{new Date(site.updated_at).toLocaleString('zh-CN')}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="py-4 gap-3">
                <CardHeader className="px-4 py-0">
                    <CardTitle className="text-base">文件上传</CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                    <MultiFileUpload siteId={site.id} />
                </CardContent>
            </Card>

            <Card className="py-4 gap-3">
                <CardHeader className="px-4 py-0">
                    <CardTitle className="text-base">文件列表</CardTitle>
                </CardHeader>
                <CardContent className="px-4">
                    <FileList siteId={site.id} />
                </CardContent>
            </Card>
        </div>
    )
}
