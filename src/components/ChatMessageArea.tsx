import { ScrollArea } from '../components/ui/scroll-area';
import { MessageBubble } from '../components/MessageBubble';
import { useChat } from '../context/ChatContext';

export function ChatMessageArea({ className }: { className?: string }) {
    const { messages, user } = useChat();
    return (
        <ScrollArea className={className || 'flex-1 min-h-0 p-4'}>
            {messages.map((m, i) =>
                m.type === 'recall' ? (
                    <span className="text-sm italic p-[15vw]">~有人撤回了一条消息~</span>
                ) : (
                    <MessageBubble key={i} message={m} currentUsername={user?.username || ''} />
                ),
            )}
        </ScrollArea>
    );
}
