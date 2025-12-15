import Link from 'next/link'
import { Globe, ArrowRight, Eye, TrendingUp, Zap, Sparkles, BarChart3, Activity } from 'lucide-react'

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

    // 模拟统计数据（后续可替换为真实数据）
    const stats = {
        totalVisits: 12847,
        monthlyVisits: 3256,
        activeSites: Math.max(sites.length, 3),
        avgLoadTime: '0.8s',
    }

    return (
        <div className="space-y-5">
            {/* Hero 平台介绍区域 */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-violet-50 via-indigo-50/50 to-blue-50 dark:from-violet-950/30 dark:via-indigo-950/20 dark:to-blue-950/30 p-5 md:p-6">
                {/* 背景装饰 */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet-200/30 dark:bg-violet-800/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-medium mb-3">
                        <Sparkles className="h-3 w-3" />
                        <span>静态站点托管平台</span>
                    </div>
                    
                    <h1 className="text-lg md:text-xl font-bold tracking-tight mb-1.5 text-foreground">
                        欢迎使用 Polaxis
                    </h1>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-xl">
                        一站式静态站点托管解决方案。轻松上传您的 HTML 页面，获得即时可分享的链接。
                        无需配置服务器，无需复杂部署流程，专注于创作优质内容。
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                        <CreateSiteDialog 
                            trigger={
                                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white font-medium">
                                    <Zap className="mr-1.5 h-3.5 w-3.5" />
                                    创建新站点
                                </Button>
                            }
                        />
                        <Button size="sm" variant="outline" asChild>
                            <Link href="/sites">
                                管理我的站点
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* 统计指标卡片 */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-2 pb-0.5">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                            站点总数
                        </CardTitle>
                        <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-900/30">
                            <Globe className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 pt-0 pb-2">
                        <div className="text-2xl font-bold">{sites.length}</div>
                        <p className="text-xs text-muted-foreground">个站点已创建</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-2 pb-0.5">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                            总访问量
                        </CardTitle>
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                            <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 pt-0 pb-2">
                        <div className="text-2xl font-bold">{stats.totalVisits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-600 dark:text-emerald-400">↑ 12%</span> 较上月
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-2 pb-0.5">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                            本月访问
                        </CardTitle>
                        <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                            <BarChart3 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 pt-0 pb-2">
                        <div className="text-2xl font-bold">{stats.monthlyVisits.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-600 dark:text-emerald-400">↑ 8%</span> 持续增长
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-2 pb-0.5">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                            平均加载
                        </CardTitle>
                        <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
                            <Activity className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-3 pt-0 pb-2">
                        <div className="text-2xl font-bold">{stats.avgLoadTime}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-600 dark:text-emerald-400">极速</span> 响应时间
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 最近站点 */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between p-4 pb-3">
                    <div>
                        <CardTitle className="flex items-center gap-1.5 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            最近站点
                        </CardTitle>
                        <CardDescription className="text-xs">
                            您最近创建的站点一览
                        </CardDescription>
                    </div>
                    {sites.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                            <Link href="/sites">
                                查看全部
                                <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    {sites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="p-3 rounded-full bg-muted mb-3">
                                <Globe className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-sm font-semibold mb-1">暂无站点</h4>
                            <p className="text-xs text-muted-foreground mb-4 max-w-sm">
                                开始创建您的第一个站点，只需上传 HTML 文件即可获得可分享的链接
                            </p>
                            <CreateSiteDialog />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentSites.map((site) => (
                                <div
                                    key={site.id}
                                    className="flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold text-xs">
                                            {site.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <Link
                                                href={`/sites/${site.id}`}
                                                className="text-sm font-medium hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                                            >
                                                {site.name}
                                            </Link>
                                            <p className="text-xs text-muted-foreground font-mono">
                                                /{site.slug}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs font-medium">
                                                {Math.floor(Math.random() * 500 + 100)} 次访问
                                            </div>
                                            <div className="text-xs text-muted-foreground">本月</div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(site.created_at).toLocaleDateString('zh-CN')}
                                        </div>
                                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
