'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

const formSchema = z.object({
    email: z.string().email({
        message: "请输入有效的邮箱地址",
    }),
    password: z.string().min(6, {
        message: "密码长度至少 6 位",
    }),
})

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        console.log('Login form submitted', values.email)
        setLoading(true)
        setError(null)

        try {
            console.log('Calling signInWithPassword...')
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            })
            console.log('Supabase response:', { data, error })

            if (error) {
                console.error('Login error:', error)
                throw error
            }

            console.log('Login successful, redirecting...')
            router.push('/dashboard')
            router.refresh()
        } catch (err: any) {
            console.error('Catch block error:', err)
            setError(err.message === 'Invalid login credentials' ? '账号或密码错误' : err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">登录 Polaxis</CardTitle>
                    <CardDescription className="text-center">
                        输入您的账号密码以进入控制台
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>邮箱</FormLabel>
                                        <FormControl>
                                            <Input placeholder="name@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>密码</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {error && (
                                <div className="text-sm font-medium text-destructive text-red-500 text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? '登录中...' : '立即登录'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-sm text-gray-500">
                        还没有账号？{' '}
                        <Link href="/signup" className="text-blue-600 hover:underline">
                            去注册
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
