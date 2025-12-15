import { getSitesPageData } from '@/lib/actions/sites'
import { SitesList } from '@/components/sites/sites-list'

export default async function SitesPage() {
    const { sites, username } = await getSitesPageData()

    return <SitesList sites={sites} username={username} />
}
