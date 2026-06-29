import React, { useState } from 'react';
import { DeleteIcon, EditIcon, MoreHorizontal } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../components/ui/sheet';
import { Field } from './ui/field';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useRoom } from '@/context/room-context';

type RoomItem = {
    id: string;
    name: string;
};

export function ChatRoomList() {
    const {
        roomList,
        currentRoom,
        switchToRoom,
        setRoomList,
        editingRoomName,
        setEditingRoomName,
        setEditingRoom,
        editRoomName,
    } = useRoom();

    // 房间操作底部弹窗
    const [actionSheetOpen, setActionSheetOpen] = useState(false);
    // 编辑房间底部弹窗
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [targetRoom, setTargetRoom] = useState<RoomItem | null>(null);

    // 打开操作面板
    const openRoomActionSheet = (room: RoomItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setTargetRoom(room);
        setActionSheetOpen(true);
    };

    // 打开编辑弹窗
    const openEditSheet = () => {
        if (!targetRoom) return;
        setEditingRoom(targetRoom);
        setEditingRoomName(targetRoom.name);
        setActionSheetOpen(false);
        setEditSheetOpen(true);
    };

    // 删除房间
    const handleDeleteRoom = () => {
        if (!targetRoom) return;
        setRoomList(roomList.filter(r => r.id !== targetRoom.id)).then(() => {
            setActionSheetOpen(false);
            setTargetRoom(null);
        });
    };

    // 保存房间名称修改
    const saveRoomName = async () => {
        await editRoomName();
        setEditSheetOpen(false);
    };

    return (
        <>
            {/* 房间列表滚动区域 */}
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

                            {/* 更多操作按钮 */}
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

            {/* 房间操作底部Sheet */}
            <Sheet open={actionSheetOpen} onOpenChange={setActionSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
                    <SheetHeader className="py-2">
                        <SheetTitle>房间操作 - {targetRoom?.name}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-3">
                        <Button variant="secondary" className="w-full h-11 text-base" onClick={openEditSheet}>
                            <EditIcon className="mr-2 h-4 w-4" />
                            编辑房间名称
                        </Button>
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

            <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
                    <SheetHeader className="py-2">
                        <SheetTitle>编辑房间名</SheetTitle>
                    </SheetHeader>
                    <div className="py-4">
                        <Field>
                            <Label>房间名</Label>
                            <Input value={editingRoomName} onChange={e => setEditingRoomName(e.target.value)} />
                        </Field>
                    </div>
                    <SheetFooter className="flex flex-row gap-2 mt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setEditSheetOpen(false)}>
                            取消
                        </Button>
                        <Button className="flex-1" onClick={saveRoomName}>
                            保存
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
