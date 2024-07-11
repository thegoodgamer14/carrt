import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { intialProfile } from "@/lib/intial-profile"

const SetupPage = async () => {
    const profile = await intialProfile()

    const server = await db.server.findFirst({
        where: {
            members: {
                some: {
                    profileId: profile.id
                }
            }
        }
    })

    if (server) {
        return redirect(`/servers/${server.id}`)
    }

    return <div>Create a Server</div>
}

export default SetupPage