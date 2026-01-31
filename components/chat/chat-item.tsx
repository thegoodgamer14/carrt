"use client"

import { Member, MemberRole, Profile } from "@prisma/client"
import { UserAvatar } from "../user-avatar"
import { ActionTooltip } from "../action-tooltip"
import { FileIcon, Pencil, ShieldAlert, ShieldCheck, Trash } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import qs from "query-string"
import axios from "axios"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useRouter, useParams } from "next/navigation"
import { useModal } from "@/hooks/use-modal-store"

interface ChatItemProps {
    id: string
    content: string
    member: Member & {
        profile: Profile
    }
    timestamp: string
    fileUrl: string | null
    deleted: boolean
    currentMember: Member
    isUpdated: boolean
    socketUrl: string
    socketQuery: Record<string, string>
}

const roleIconMap = {
    "GUEST": null,
    "MODERATOR": <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
    "ADMIN": <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
}

const formSchema = z.object({
    content: z.string().min(1),
})

export const ChatItem = ({
    id,
    content,
    member,
    timestamp,
    fileUrl,
    deleted,
    currentMember,
    isUpdated,
    socketUrl,
    socketQuery
}: ChatItemProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()
    const { onOpen } = useModal()
    const params = useParams()

    const onMemberClick = () => {
        if (member.id === currentMember.id) {
            return
        }
        router.push(`/servers/${params?.serverId}/conversations/${member.id}`)
    }

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsEditing(false)
            }
        }
        window.addEventListener("keydown", handleEsc)
        return () => {
            window.removeEventListener("keydown", handleEsc)
        }
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: content,
        }
    })

    useEffect(() => {
        form.reset({
            content: content,
        })
    }, [content, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const url = qs.stringifyUrl({
                url: `${socketUrl}/${id}`,
                query: socketQuery,
            })
            await axios.patch(url, values)
            form.reset()
            setIsEditing(false)
            router.refresh()
        } catch (error) {
            console.log(error)
        }
    }

    const isLoading = form.formState.isSubmitting

    const fileType = fileUrl?.split(".").pop()
    const isAdmin = currentMember.role === MemberRole.ADMIN
    const isModerator = currentMember.role === MemberRole.MODERATOR
    const isOwner = currentMember.id === member.id
    const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner)
    const canEditMessage = !deleted && isOwner && !fileUrl
    const isPDF = fileType === "pdf" && fileUrl
    const isImage = fileUrl && !isPDF

    return (
        <div className="relative group flex items-center hover:bg-black/5 p-4 transition w-full">
            <div className="group flex gap-x-2 items-start w-full">
                <div onClick={onMemberClick} className="cursor-pointer hover:drop-shadow-md transition">
                    <UserAvatar src={member.profile.imageUrl} />
                </div>
                <div className="flex flex-col w-full">
                    <div className="flex items-center gap-x-2">
                        <div className="flex items-center">
                            <p onClick={onMemberClick} className="font-semibold text-sm hover:underline cursor-pointer">{member.profile.name}</p>
                            <ActionTooltip label={member.role}>
                                {roleIconMap[member.role]}
                            </ActionTooltip>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {timestamp}
                        </span>
                    </div>
                    {isImage && (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="relative aspect-square border flex items-center mt-2 rounded-md bg-secondary h-48 w-48">
                            <Image src={fileUrl} alt={content} className="object-cover" fill />
                        </a>
                    )}
                    {isPDF && (
                        <div className="relative flex items-center p-2 mt-2 rounded-md bg-background/10">
                            <FileIcon
                                className="h-10 w-10 fill-indigo-200 stroke-indigo-400"
                            />
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-sm text-indigo-500 dark:text-indigo-400 hover:underline">
                                PDF File
                            </a>
                        </div>
                    )}
                    {!fileUrl && !isEditing && !deleted && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            {content}
                            {isUpdated && (
                                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                                    (edited)
                                </span>
                            )}
                        </p>
                    )}
                    {deleted && (
                        <p className="italic text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                            This message has been deleted.
                        </p>
                    )}
                    {!fileUrl && isEditing && (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-2 w-full mt-2">
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <div className="flex items-center gap-x-2 w-full">
                                                    <Input
                                                        disabled={isLoading}
                                                        className="flex-1 p-2 bg-zinc-200/70 dark:bg-zinc-700/70 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
                                                        placeholder="Edited message..."
                                                        {...field}
                                                    />
                                                    <Button
                                                        disabled={isLoading}
                                                        variant="primary"
                                                        size="sm"
                                                    >
                                                        Save
                                                    </Button>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <span className="text-[10px] text-zinc-400 mt-1">
                                    Press escape to cancel, enter to save
                                </span>
                            </form>
                        </Form>
                    )}
                </div>
            </div>
            {canDeleteMessage && (
                <div className="hidden group-hover:flex items-center gap-x-2 absolute p-1 -top-2 right-5 bg-white dark:bg-zinc-800 border rounded-sm">
                    {canEditMessage && (
                        <ActionTooltip label="Edit">
                            <button onClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 p-1 rounded-sm transition">
                                <Pencil className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            </button>
                        </ActionTooltip>
                    )}
                    {canDeleteMessage && (
                        <ActionTooltip label="Delete">
                            <button
                                onClick={() => onOpen("deleteMessage", {
                                    apiUrl: `${socketUrl}/${id}`,
                                    query: socketQuery,
                                })}
                                className="cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 p-1 rounded-sm transition"
                            >
                                <Trash className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            </button>
                        </ActionTooltip>
                    )}
                </div>
            )}
        </div>
    )
}