import { NavigationSidebar } from "@/components/navigation/navigation-sidebar"

const MainLayout = async ({
    children
}: {
    children: React.ReactNode
}) => {
    return (
        <div className="h-full">
            <div className="flex h-full w-[72px] z-30 flex-col fixed inset-y-0 invisible md:visible">
                <NavigationSidebar />
            </div>
            <main className="h-full pl-0 md:pl-[72px]">
                {children}
            </main>
        </div>
    )
}

export default MainLayout