'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import { SiteInsert } from '@/lib/database.types'

export async function createSite(formData: FormData) {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        return { error: '请先登录' }
    }

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string | null

    // 验证 slug 格式
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
        return { error: 'Slug 只能包含小写字母、数字和连字符' }
    }

    // 检查 slug 是否已存在（同一用户下）
    const { data: existingSite } = await supabase
        .from('po_sites')
        .select('id')
        .eq('user_id', user.id)
        .eq('slug', slug)
        .single()

    if (existingSite) {
        return { error: '此 Slug 已被使用，请换一个' }
    }

    const siteData: SiteInsert = {
        user_id: user.id,
        name,
        slug,
        description: description || null,
    }

    const { data, error } = await supabase
        .from('po_sites')
        .insert(siteData)
        .select()
        .single()

    if (error) {
        console.error('Create site error:', error)
        return { error: '创建站点失败，请稍后重试' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/sites')
    redirect(`/sites/${data.id}`)
}

export async function createSiteWithFile(formData: FormData) {
    const { isAllowedFileType, MAX_FILE_SIZE, MAX_TOTAL_SIZE } = await import('@/lib/mime-types')
    const { getMimeType } = await import('@/lib/mime-types')

    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminSupabaseClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
        return { error: '请先登录' }
    }

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string | null

    // 获取所有文件
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('file-') && value instanceof File && value.size > 0) {
            files.push(value)
        }
    }

    if (files.length === 0) {
        return { error: '请选择至少一个文件' }
    }

    // 验证必须包含至少一个 HTML 文件
    const hasHtmlFile = files.some(file =>
        file.name.endsWith('.html') || file.name.endsWith('.htm')
    )

    if (!hasHtmlFile) {
        return { error: '文件夹中必须包含至少一个 HTML 文件' }
    }

    // 验证每个文件
    let totalSize = 0
    for (const file of files) {
        // 验证文件类型
        if (!isAllowedFileType(file.name)) {
            return { error: `不支持的文件类型: ${file.name}` }
        }

        // 验证单个文件大小
        if (file.size > MAX_FILE_SIZE) {
            return { error: `文件 ${file.name} 超过 5MB 限制` }
        }

        totalSize += file.size
    }

    // 验证总大小
    if (totalSize > MAX_TOTAL_SIZE) {
        return { error: `文件总大小不能超过 50MB（当前: ${Math.round(totalSize / 1024 / 1024)}MB）` }
    }

    // 验证 slug 格式
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(slug)) {
        return { error: 'Slug 只能包含小写字母、数字和连字符' }
    }

    // 检查 slug 是否已存在（同一用户下）
    const { data: existingSite } = await supabase
        .from('po_sites')
        .select('id')
        .eq('user_id', user.id)
        .eq('slug', slug)
        .single()

    if (existingSite) {
        return { error: '此 Slug 已被使用，请换一个' }
    }

    const siteData: SiteInsert = {
        user_id: user.id,
        name,
        slug,
        description: description || null,
    }

    // 创建站点记录
    const { data: site, error: createError } = await supabase
        .from('po_sites')
        .insert(siteData)
        .select()
        .single()

    if (createError || !site) {
        console.error('Create site error:', createError)
        return { error: '创建站点失败，请稍后重试' }
    }

    // 上传所有文件到 Storage
    const uploadResults = []
    for (const file of files) {
        // 获取文件路径（保留目录结构）
        const relativePath = formData.get(`path-${file.name}`) as string || file.name
        const filePath = `${user.id}/${site.id}/${relativePath}`
        const mimeType = getMimeType(file.name)

        console.log('Uploading file:', {
            fileName: file.name,
            relativePath,
            filePath,
            mimeType
        })

        const { error: uploadError } = await adminClient.storage
            .from('sites')
            .upload(filePath, file, {
                contentType: mimeType,
                upsert: true,
            })

        if (uploadError) {
            console.error('Upload file error:', uploadError)
            uploadResults.push({ file: file.name, success: false, error: uploadError.message })
        } else {
            uploadResults.push({ file: file.name, success: true })
        }
    }

    const failedUploads = uploadResults.filter(r => !r.success)
    if (failedUploads.length > 0) {
        // 如果有文件上传失败，删除站点记录
        await supabase.from('po_sites').delete().eq('id', site.id)
        return {
            error: `部分文件上传失败: ${failedUploads.map(r => r.file).join(', ')}`,
            results: uploadResults
        }
    }

    revalidatePath('/dashboard')
    revalidatePath('/sites')

    return { success: true, siteId: site.id }
}

export async function updateSite(siteId: string, formData: FormData) {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        return { error: '请先登录' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string | null

    if (!name) {
        return { error: '站点名称不能为空' }
    }

    // 验证站点所有权
    const { data: existingSite, error: fetchError } = await supabase
        .from('po_sites')
        .select('*')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !existingSite) {
        return { error: '站点不存在或无权限' }
    }

    // 更新站点信息
    const { error: updateError } = await supabase
        .from('po_sites')
        .update({
            name,
            description: description || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', siteId)

    if (updateError) {
        console.error('Update site error:', updateError)
        return { error: '更新站点失败' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/sites')
    revalidatePath(`/sites/${siteId}`)
    
    return { success: true }
}

export async function uploadSiteFile(siteId: string, formData: FormData) {
    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminSupabaseClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
        return { error: '请先登录' }
    }

    const file = formData.get('file') as File

    if (!file || !(file instanceof File) || file.size === 0) {
        return { error: '请选择文件' }
    }

    // 验证文件类型
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        return { error: '只支持 .html 或 .htm 文件' }
    }

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
        return { error: '文件大小不能超过 5MB' }
    }

    // 验证站点所有权
    const { data: existingSite, error: fetchError } = await supabase
        .from('po_sites')
        .select('*')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !existingSite) {
        return { error: '站点不存在或无权限' }
    }

    const filePath = `${user.id}/${siteId}/index.html`
    const { error: uploadError } = await adminClient.storage
        .from('sites')
        .upload(filePath, file, {
            contentType: 'text/html',
            upsert: true,
        })

    if (uploadError) {
        console.error('Upload file error:', uploadError)
        return { error: '文件上传失败' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/sites')
    revalidatePath(`/sites/${siteId}`)

    return { success: true }
}

export async function uploadSiteFiles(siteId: string, formData: FormData) {
    const { isAllowedFileType, MAX_FILE_SIZE, MAX_TOTAL_SIZE } = await import('@/lib/mime-types')
    const { getMimeType } = await import('@/lib/mime-types')

    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminSupabaseClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
        return { error: '请先登录' }
    }

    // 验证站点所有权
    const { data: existingSite, error: fetchError } = await supabase
        .from('po_sites')
        .select('*')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !existingSite) {
        return { error: '站点不存在或无权限' }
    }

    // 获取所有文件
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
        if (key.startsWith('file-') && value instanceof File && value.size > 0) {
            files.push(value)
        }
    }

    if (files.length === 0) {
        return { error: '请选择至少一个文件' }
    }

    // 验证每个文件
    let totalSize = 0
    for (const file of files) {
        // 验证文件类型
        if (!isAllowedFileType(file.name)) {
            return { error: `不支持的文件类型: ${file.name}` }
        }

        // 验证单个文件大小
        if (file.size > MAX_FILE_SIZE) {
            return { error: `文件 ${file.name} 超过 5MB 限制` }
        }

        totalSize += file.size
    }

    // 获取现有文件大小
    const { data: existingFiles } = await adminClient.storage
        .from('sites')
        .list(`${user.id}/${siteId}`)

    let existingSize = 0
    if (existingFiles) {
        existingSize = existingFiles.reduce((sum: number, file: { metadata?: { size?: number } }) => {
            return sum + (file.metadata?.size || 0)
        }, 0)
    }

    // 验证总大小
    if (existingSize + totalSize > MAX_TOTAL_SIZE) {
        return { error: `站点总文件大小不能超过 50MB（当前: ${Math.round(existingSize / 1024 / 1024)}MB）` }
    }

    // 上传所有文件
    const uploadResults = []
    for (const file of files) {
        // 获取文件路径（保留目录结构）
        const relativePath = formData.get(`path-${file.name}`) as string || file.name
        const filePath = `${user.id}/${siteId}/${relativePath}`
        const mimeType = getMimeType(file.name)

        const { error: uploadError } = await adminClient.storage
            .from('sites')
            .upload(filePath, file, {
                contentType: mimeType,
                upsert: true,
            })

        if (uploadError) {
            console.error('Upload file error:', uploadError)
            uploadResults.push({ file: file.name, success: false, error: uploadError.message })
        } else {
            uploadResults.push({ file: file.name, success: true })
        }
    }

    const failedUploads = uploadResults.filter(r => !r.success)
    if (failedUploads.length > 0) {
        return {
            error: `部分文件上传失败: ${failedUploads.map(r => r.file).join(', ')}`,
            results: uploadResults
        }
    }

    revalidatePath('/dashboard')
    revalidatePath('/sites')
    revalidatePath(`/sites/${siteId}`)

    return { success: true, count: files.length, results: uploadResults }
}

export async function deleteSite(siteId: string) {
    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        return { error: '请先登录' }
    }

    // 先获取站点信息确认所有权
    const { data: site, error: fetchError } = await supabase
        .from('po_sites')
        .select('*')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !site) {
        return { error: '站点不存在或无权限' }
    }

    // 删除 Storage 中的文件
    const storagePath = `${user.id}/${siteId}`
    const { data: files } = await adminClient.storage
        .from('sites')
        .list(storagePath)

    if (files && files.length > 0) {
        const filePaths = files.map((file: { name: string }) => `${storagePath}/${file.name}`)
        await adminClient.storage.from('sites').remove(filePaths)
    }

    // 删除数据库记录
    const { error: deleteError } = await supabase
        .from('po_sites')
        .delete()
        .eq('id', siteId)

    if (deleteError) {
        console.error('Delete site error:', deleteError)
        return { error: '删除站点失败' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/sites')
    return { success: true }
}

export async function deleteSites(siteIds: string[]) {
    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        return { error: '请先登录' }
    }

    if (!siteIds || siteIds.length === 0) {
        return { error: '请选择要删除的站点' }
    }

    // 验证所有站点都属于当前用户
    const { data: sites, error: fetchError } = await supabase
        .from('po_sites')
        .select('id')
        .eq('user_id', user.id)
        .in('id', siteIds)

    if (fetchError) {
        return { error: '获取站点信息失败' }
    }

    if (!sites || sites.length !== siteIds.length) {
        return { error: '部分站点不存在或无权限' }
    }

    // 批量删除 Storage 中的文件
    for (const siteId of siteIds) {
        const storagePath = `${user.id}/${siteId}`
        const { data: files } = await adminClient.storage
            .from('sites')
            .list(storagePath)

        if (files && files.length > 0) {
            const filePaths = files.map((file: { name: string }) => `${storagePath}/${file.name}`)
            await adminClient.storage.from('sites').remove(filePaths)
        }
    }

    // 批量删除数据库记录
    const { error: deleteError } = await supabase
        .from('po_sites')
        .delete()
        .in('id', siteIds)

    if (deleteError) {
        console.error('Delete sites error:', deleteError)
        return { error: '删除站点失败' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/sites')
    
    return { success: true, count: siteIds.length }
}

export async function getSites() {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        return []
    }

    const { data: sites, error } = await supabase
        .from('po_sites')
        .select('id,user_id,name,slug,description,created_at,updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Get sites error:', error)
        return []
    }

    return sites
}

export async function getDashboardSitesData() {
    const supabase = await createServerSupabaseClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
        return { totalCount: 0, recentSites: [] }
    }

    const { data: recentSites, count, error } = await supabase
        .from('po_sites')
        .select('id,user_id,name,slug,description,created_at,updated_at', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Get dashboard sites error:', error)
        return { totalCount: 0, recentSites: [] }
    }

    return { totalCount: count ?? 0, recentSites: recentSites ?? [] }
}

export async function getSitesPageData() {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        return { sites: [], username: 'user' }
    }

    const username = user.email ? user.email.split('@')[0] : user.id.substring(0, 8)

    const { data: sites, error } = await supabase
        .from('po_sites')
        .select('id,user_id,name,slug,description,created_at,updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Get sites error:', error)
        return { sites: [], username }
    }

    return { sites, username }
}

export async function getSite(siteId: string) {
    const supabase = await createServerSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        return null
    }

    const { data: site, error } = await supabase
        .from('po_sites')
        .select('*')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single()

    if (error) {
        return null
    }

    return site
}

export async function checkFileExists(siteId: string) {
    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user
    
    if (sessionError || !user) {
        return false
    }

    const { data } = await adminClient.storage
        .from('sites')
        .list(`${user.id}/${siteId}`)

    return data && data.some((file: { name: string }) => file.name === 'index.html')
}

export async function getCurrentUsername() {
    const supabase = await createServerSupabaseClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
        return 'user'
    }

    // 使用邮箱前缀作为用户名，如果没有邮箱则使用 user id 的前8位
    if (user.email) {
        return user.email.split('@')[0]
    }

    return user.id.substring(0, 8)
}

export async function listSiteFiles(siteId: string) {
    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminSupabaseClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
        return { error: '请先登录' }
    }

    // 验证站点所有权
    const { data: existingSite, error: fetchError } = await supabase
        .from('po_sites')
        .select('*')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !existingSite) {
        return { error: '站点不存在或无权限' }
    }

    const userId = user.id

    // 递归列出所有文件
    async function listFilesRecursive(path: string): Promise<any[]> {
        const { data: items, error } = await adminClient.storage
            .from('sites')
            .list(path)

        if (error || !items) {
            return []
        }

        const files = []
        for (const item of items) {
            const fullPath = `${path}/${item.name}`
            if (item.id) {
                // 这是一个文件
                files.push({
                    name: item.name,
                    path: fullPath.replace(`${userId}/${siteId}/`, ''),
                    size: item.metadata?.size || 0,
                    lastModified: item.updated_at || item.created_at,
                })
            } else {
                // 这是一个目录，递归列出
                const subFiles = await listFilesRecursive(fullPath)
                files.push(...subFiles)
            }
        }

        return files
    }

    const files = await listFilesRecursive(`${userId}/${siteId}`)

    return { success: true, files }
}

export async function deleteSiteFile(siteId: string, filePath: string) {
    const supabase = await createServerSupabaseClient()
    const adminClient = createAdminSupabaseClient()

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
        return { error: '请先登录' }
    }

    // 验证站点所有权
    const { data: existingSite, error: fetchError } = await supabase
        .from('po_sites')
        .select('*')
        .eq('id', siteId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !existingSite) {
        return { error: '站点不存在或无权限' }
    }

    // 删除文件
    const storagePath = `${user.id}/${siteId}/${filePath}`
    const { error: deleteError } = await adminClient.storage
        .from('sites')
        .remove([storagePath])

    if (deleteError) {
        console.error('Delete file error:', deleteError)
        return { error: '删除文件失败' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/sites')
    revalidatePath(`/sites/${siteId}`)

    return { success: true }
}
