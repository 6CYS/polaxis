export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">仪表盘</h3>
                <p className="text-muted-foreground">
                    欢迎回来！这里是您的站点概览。
                </p>
            </div>
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                暂无站点，点击 <span className="font-semibold text-foreground">创建站点</span> 开始您的第一个项目。
            </div>
        </div>
    )
}
