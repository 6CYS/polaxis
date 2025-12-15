import Link from 'next/link'
import { Globe, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { getSites } from '@/lib/actions/sites'
import { CreateSiteDialog } from '@/components/sites/create-site-dialog'

export default async function DashboardPage() {
    const sites = await getSites()
    const recentSites = sites.slice(0, 5)

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">仪表盘</h3>
                <p className="text-muted-foreground">
                    欢迎回来！这里是您的站点概览。
                </p>
            </div>

            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            站点总数
                        </CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sites.length}</div>
                        <p className="text-xs text-muted-foreground">
                            个站点已创建
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 最近站点 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>最近站点</CardTitle>
                        <CardDescription>
                            您最近创建的站点
                        </CardDescription>
                    </div>
                    {sites.length > 0 && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/sites">
                                查看全部
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {sites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                            <h4 className="text-lg font-semibold mb-2">暂无站点</h4>
                            <p className="text-muted-foreground mb-4">
                                点击下方按钮开始创建您的第一个站点
                            </p>
                            <CreateSiteDialog />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentSites.map((site) => (
                                <div
                                    key={site.id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="space-y-1">
                                        <Link
                                            href={`/sites/${site.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {site.name}
                                        </Link>
                                        <p className="text-sm text-muted-foreground font-mono">
                                            /{site.slug}
                                        </p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(site.created_at).toLocaleDateString('zh-CN')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
