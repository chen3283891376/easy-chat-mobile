import type { ReactNode } from 'react';
import { UserProvider } from './user-context';
import { RoomProvider } from './room-context';
import { MessageProvider } from './message-context';

export function ChatProvider({ children }: { children: ReactNode }) {
    return (
        <UserProvider>
            <RoomProvider>
                <MessageProvider>{children}</MessageProvider>
            </RoomProvider>
        </UserProvider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export { useChat } from './use-chat';
