'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { createSite } from '@/lib/actions/sites'

export default function NewSitePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [slug, setSlug] = useState('')

    const handleSlugChange = (value: string) => {
        // 自动转换为合法的 slug 格式
        const formatted = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
        setSlug(formatted)
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        // 使用处理后的 slug
        formData.set('slug', slug)

        const result = await createSite(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
        // 成功后 createSite 会自动 redirect
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/sites">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">创建新站点</h3>
                    <p className="text-muted-foreground">
                        填写信息创建您的静态页面托管站点
                    </p>
                </div>
            </div>

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>站点信息</CardTitle>
                    <CardDescription>
                        Slug 将成为您站点访问地址的一部分
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">站点名称</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="我的个人主页"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">URL Slug</Label>
                            <Input
                                id="slug"
                                name="slug"
                                placeholder="my-site"
                                value={slug}
                                onChange={(e) => handleSlugChange(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                访问地址预览: /s/你的用户名/<span className="font-mono text-foreground">{slug || 'your-slug'}</span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">描述（可选）</Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="简单描述一下这个站点..."
                            />
                        </div>

                        {error && (
                            <div className="text-sm font-medium text-red-500">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? '创建中...' : '创建站点'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/dashboard/sites">取消</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

