import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>加载中...</span>
            </div>
        </div>
    )
}

