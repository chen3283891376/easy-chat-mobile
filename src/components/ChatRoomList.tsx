import React, { useState } from 'react';
import { DeleteIcon, MoreHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { useChat } from '../context/ChatContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';

type RoomItem = {
    id: string;
    name: string;
};

export function ChatRoomList() {
    const { roomList, currentRoom, switchToRoom, setRoomList } = useChat();
    // 控制底部操作弹窗、当前选中操作房间
    const [actionSheetOpen, setActionSheetOpen] = useState(false);
    const [targetRoom, setTargetRoom] = useState<RoomItem | null>(null);

    // 打开房间操作弹窗
    const openRoomActionSheet = (room: RoomItem, e: React.MouseEvent) => {
        e.stopPropagation(); // 阻止触发切换房间
        setTargetRoom(room);
        setActionSheetOpen(true);
    };

    // 删除房间
    const handleDeleteRoom = () => {
        if (!targetRoom) return;
        setRoomList(roomList.filter(r => r.id !== targetRoom.id)).then(() => {
            setActionSheetOpen(false);
            setTargetRoom(null);
        });
    };

    return (
        <>
            {/* 房间列表滚动区域，移动端高度自适应 */}
            <ScrollArea className="h-[45vh] md:h-[65vh] px-1 border rounded-lg">
                <div className="space-y-2">
                    {roomList.map(room => (
                        <div key={room.id} className="flex items-center gap-1 w-full">
                            {/* 房间切换按钮 */}
                            <Button
                                variant={room.id === currentRoom.id ? 'default' : 'ghost'}
                                className="flex-1 justify-start text-sm"
                                onClick={() => switchToRoom(room)}
                            >
                                # {room.name}
                            </Button>

                            {/* 移动端更多操作按钮，唤起底部Sheet */}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 shrink-0"
                                onClick={e => openRoomActionSheet(room, e)}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* 移动端底部弹出操作面板 Sheet */}
            <Sheet open={actionSheetOpen} onOpenChange={setActionSheetOpen}>
                {/* side="bottom" 底部弹窗，移动端标准交互 */}
                <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
                    <SheetHeader className="py-2">
                        <SheetTitle>房间操作 - {targetRoom?.name}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-3">
                        <Button variant="destructive" className="w-full h-11 text-base" onClick={handleDeleteRoom}>
                            <DeleteIcon className="mr-2 h-4 w-4" />
                            删除此房间
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full h-11 text-base"
                            onClick={() => setActionSheetOpen(false)}
                        >
                            取消
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
