import { getSites } from '@/lib/actions/sites'
import { SitesList } from '@/components/sites/sites-list'

export default async function SitesPage() {
    const sites = await getSites()

    return <SitesList sites={sites} />
}
