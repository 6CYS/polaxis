import { getSites, getCurrentUsername } from '@/lib/actions/sites'
import { SitesList } from '@/components/sites/sites-list'

export default async function SitesPage() {
    const [sites, username] = await Promise.all([
        getSites(),
        getCurrentUsername()
    ])

    return <SitesList sites={sites} username={username} />
}
