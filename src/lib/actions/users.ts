'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'

interface User {
    id: string
    email: string
    created_at: string
    last_sign_in_at: string | null
    email_confirmed_at: string | null
    app_metadata: {
        role?: string
        [key: string]: unknown
    }
    user_metadata: {
        full_name?: string
        [key: string]: unknown
    }
}

// 检查当前用户是否为管理员
async function checkIsAdmin() {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        return { isAdmin: false, error: '请先登录' }
    }
    
    if (user.app_metadata?.role !== 'admin') {
        return { isAdmin: false, error: '无权限执行此操作' }
    }
    
    return { isAdmin: true, userId: user.id }
}

// 获取所有用户列表
export async function getUsers(): Promise<{ users: User[], error?: string }> {
    const { isAdmin, error } = await checkIsAdmin()
    
    if (!isAdmin) {
        return { users: [], error }
    }
    
    const adminClient = createAdminSupabaseClient()
    
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
    
    if (listError) {
        console.error('List users error:', listError)
        return { users: [], error: '获取用户列表失败' }
    }
    
    return {
        users: users.map((user: any) => ({
            id: user.id,
            email: user.email || '',
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            email_confirmed_at: user.email_confirmed_at,
            app_metadata: user.app_metadata || {},
            user_metadata: user.user_metadata || {},
        }))
    }
}

// 创建新用户
export async function createUser(formData: FormData): Promise<{ success?: boolean, error?: string }> {
    const { isAdmin, error } = await checkIsAdmin()
    
    if (!isAdmin) {
        return { error }
    }
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const isAdminUser = formData.get('isAdmin') === 'true'
    
    if (!email || !password) {
        return { error: '邮箱和密码不能为空' }
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { error: '请输入有效的邮箱地址' }
    }
    
    // 验证密码长度
    if (password.length < 6) {
        return { error: '密码长度至少 6 位' }
    }
    
    const adminClient = createAdminSupabaseClient()
    
    const { data, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // 直接确认邮箱
        user_metadata: {
            full_name: fullName || '',
        },
        app_metadata: {
            role: isAdminUser ? 'admin' : 'user',
        },
    })
    
    if (createError) {
        console.error('Create user error:', createError)
        if (createError.message.includes('already been registered')) {
            return { error: '该邮箱已被注册' }
        }
        return { error: createError.message || '创建用户失败' }
    }
    
    revalidatePath('/users')
    return { success: true }
}

// 更新用户信息
export async function updateUser(userId: string, formData: FormData): Promise<{ success?: boolean, error?: string }> {
    const { isAdmin, error, userId: currentUserId } = await checkIsAdmin()
    
    if (!isAdmin) {
        return { error }
    }
    
    const fullName = formData.get('fullName') as string
    const isAdminUser = formData.get('isAdmin') === 'true'
    const newPassword = formData.get('newPassword') as string
    
    const adminClient = createAdminSupabaseClient()
    
    // 构建更新数据
    const updateData: any = {
        user_metadata: {
            full_name: fullName || '',
        },
        app_metadata: {
            role: isAdminUser ? 'admin' : 'user',
        },
    }
    
    // 如果提供了新密码则更新密码
    if (newPassword && newPassword.length > 0) {
        if (newPassword.length < 6) {
            return { error: '密码长度至少 6 位' }
        }
        updateData.password = newPassword
    }
    
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, updateData)
    
    if (updateError) {
        console.error('Update user error:', updateError)
        return { error: updateError.message || '更新用户失败' }
    }
    
    revalidatePath('/users')
    return { success: true }
}

// 删除用户
export async function deleteUser(userId: string): Promise<{ success?: boolean, error?: string }> {
    const { isAdmin, error, userId: currentUserId } = await checkIsAdmin()
    
    if (!isAdmin) {
        return { error }
    }
    
    // 防止删除自己
    if (userId === currentUserId) {
        return { error: '不能删除自己的账号' }
    }
    
    const adminClient = createAdminSupabaseClient()
    
    // 先删除用户的站点数据
    const { error: sitesError } = await adminClient
        .from('po_sites')
        .delete()
        .eq('user_id', userId)
    
    if (sitesError) {
        console.error('Delete user sites error:', sitesError)
        // 继续删除用户，站点删除失败不阻止
    }
    
    // 删除用户的存储文件
    const { data: files } = await adminClient.storage
        .from('sites')
        .list(userId)
    
    if (files && files.length > 0) {
        // 递归删除用户目录下的所有文件
        for (const folder of files) {
            const { data: subFiles } = await adminClient.storage
                .from('sites')
                .list(`${userId}/${folder.name}`)
            
            if (subFiles && subFiles.length > 0) {
                const filePaths = subFiles.map((file: { name: string }) => `${userId}/${folder.name}/${file.name}`)
                await adminClient.storage.from('sites').remove(filePaths)
            }
        }
    }
    
    // 删除用户
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    
    if (deleteError) {
        console.error('Delete user error:', deleteError)
        return { error: deleteError.message || '删除用户失败' }
    }
    
    revalidatePath('/users')
    return { success: true }
}

// 用户自己修改密码
export async function changePassword(formData: FormData): Promise<{ success?: boolean, error?: string }> {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
        return { error: '请先登录' }
    }

    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // 验证输入
    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: '所有字段都必须填写' }
    }

    if (newPassword.length < 6) {
        return { error: '新密码长度至少 6 位' }
    }

    if (newPassword !== confirmPassword) {
        return { error: '两次输入的新密码不一致' }
    }

    // 验证当前密码是否正确（通过重新登录验证）
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email!,
        password: currentPassword,
    })

    if (signInError) {
        return { error: '当前密码错误' }
    }

    // 更新密码
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    })

    if (updateError) {
        console.error('Change password error:', updateError)
        return { error: updateError.message || '修改密码失败' }
    }

    return { success: true }
}

// 批量删除用户
export async function deleteUsers(userIds: string[]): Promise<{ success?: boolean, error?: string, count?: number }> {
    const { isAdmin, error, userId: currentUserId } = await checkIsAdmin()
    
    if (!isAdmin) {
        return { error }
    }
    
    // 过滤掉自己
    const filteredIds = userIds.filter(id => id !== currentUserId)
    
    if (filteredIds.length === 0) {
        return { error: '没有可删除的用户' }
    }
    
    const adminClient = createAdminSupabaseClient()
    let deletedCount = 0
    
    for (const userId of filteredIds) {
        // 删除用户站点
        await adminClient.from('po_sites').delete().eq('user_id', userId)
        
        // 删除存储文件
        const { data: files } = await adminClient.storage.from('sites').list(userId)
        if (files && files.length > 0) {
            for (const folder of files) {
                const { data: subFiles } = await adminClient.storage
                    .from('sites')
                    .list(`${userId}/${folder.name}`)
                
                if (subFiles && subFiles.length > 0) {
                    const filePaths = subFiles.map((file: { name: string }) => `${userId}/${folder.name}/${file.name}`)
                    await adminClient.storage.from('sites').remove(filePaths)
                }
            }
        }
        
        // 删除用户
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
        if (!deleteError) {
            deletedCount++
        }
    }
    
    revalidatePath('/users')
    return { success: true, count: deletedCount }
}
