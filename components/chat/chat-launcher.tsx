'use client'
import dynamic from 'next/dynamic'

type ChatWidgetProps = {}

const ChatWidget = dynamic<ChatWidgetProps>(
    () => import('@/components/chat/chat-widget').then(m => m.ChatWidget),
    { ssr: false, loading: () => null }
)

export default function ChatLauncher() {
    return <ChatWidget />
}
