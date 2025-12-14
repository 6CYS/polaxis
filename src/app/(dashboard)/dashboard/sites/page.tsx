import Link from 'next/link'
import { PlusCircle, Globe, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { getSites } from '@/lib/actions/sites'

export default async function SitesPage() {
    const sites = await getSites()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">我的站点</h3>
                    <p className="text-muted-foreground">
                        管理您所有的静态页面托管站点
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        创建站点
                    </Link>
                </Button>
            </div>

            {sites.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                        <h4 className="text-lg font-semibold mb-2">暂无站点</h4>
                        <p className="text-muted-foreground text-center mb-4">
                            您还没有创建任何站点，点击下方按钮开始创建
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                创建第一个站点
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sites.map((site) => (
                        <Card key={site.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg">
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
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/dashboard/sites/${site.id}`}>
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {site.description || '暂无描述'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-3">
                                    创建于 {new Date(site.created_at).toLocaleDateString('zh-CN')}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

