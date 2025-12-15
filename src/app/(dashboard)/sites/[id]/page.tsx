import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Globe, FileText, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { getSite, checkFileExists } from '@/lib/actions/sites'
import { FileUpload } from '@/components/sites/file-upload'
import { DeleteSiteButton } from '@/components/sites/delete-site-button'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface SiteDetailPageProps {
    params: Promise<{ id: string }>
}

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
    const { id } = await params
    const site = await getSite(id)

    if (!site) {
        notFound()
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const hasFile = await checkFileExists(id)

    // 获取用户的 email 前缀作为 username（简化处理）
    const username = user?.email?.split('@')[0] || user?.id?.slice(0, 8)
    const siteUrl = `/s/${username}/${site.slug}`

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/sites">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">{site.name}</h3>
                        <p className="text-muted-foreground font-mono text-sm">
                            /{site.slug}
                        </p>
                    </div>
                </div>
                <DeleteSiteButton siteId={site.id} siteName={site.name} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* 站点信息卡片 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            站点信息
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">描述</p>
                            <p className="mt-1">{site.description || '暂无描述'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">访问地址</p>
                            <div className="mt-1 flex items-center gap-2">
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                    {siteUrl}
                                </code>
                                {hasFile && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={siteUrl} target="_blank">
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    创建时间
                                </p>
                                <p className="mt-1 text-sm">
                                    {new Date(site.created_at).toLocaleString('zh-CN')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    文件状态
                                </p>
                                <p className="mt-1 text-sm">
                                    {hasFile ? (
                                        <span className="text-green-600">已上传</span>
                                    ) : (
                                        <span className="text-amber-600">未上传</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 文件上传卡片 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            文件管理
                        </CardTitle>
                        <CardDescription>
                            上传 HTML 文件以发布您的站点
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FileUpload
                            siteId={site.id}
                            userId={site.user_id}
                            hasExistingFile={hasFile}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* 预览提示 */}
            {!hasFile && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-semibold mb-2">站点尚未发布</h4>
                        <p className="text-muted-foreground text-center max-w-md">
                            请上传您的 index.html 文件，上传后即可通过访问地址查看您的站点
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}


