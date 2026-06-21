import React, { useCallback, useMemo } from 'react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { useMessage } from '@/context/message-context';
import { useUser } from '@/context/user-context';
import { useRoom } from '@/context/room-context';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

export function Invites() {
    const { user, privateKey } = useUser();
    const { joinRoomById } = useRoom();
    const { handleSend, setInput } = useMessage();
    const [open, setOpen] = React.useState(false);
    const [invites, setInvites] = React.useState<{ from: string; payload: string; time: number }[]>([]);
    const auth = useMemo(
        () => (user && privateKey ? { username: user.username, privateKey } : undefined),
        [privateKey, user],
    );

    const load = useCallback(async () => {
        if (!user || !auth) return;
        try {
            const d = await storage.getInvites(user.username, auth);
            setInvites(Array.isArray(d) ? d : []);
        } catch {
            setInvites([]);
        }
    }, [user, auth]);

    React.useEffect(() => {
        if (open) {
            queueMicrotask(load);
        }
    }, [load, open, user]);

    const handleRespond = async (inv: { from: string; payload: string }, resp: 'accept' | 'decline') => {
        if (!user || !auth) return;
        try {
            let roomId: string | undefined = undefined;
            let roomName: string | undefined = undefined;
            try {
                const p = JSON.parse(inv.payload);
                roomId = p.roomId;
                roomName = `私聊: ${inv.from}`;
            } catch {
                /* empty */
            }

            await storage.respondInvite(user.username, inv.from, resp, roomId, auth);
            toast.success(resp === 'accept' ? '已接受' : '已拒绝');

            if (resp === 'accept' && roomId) {
                try {
                    await joinRoomById(roomId, roomName || `私聊: ${inv.from}`);
                    setOpen(false);
                    queueMicrotask(() => {
                        setInput('我们已成功添加为好友，现在可以开始聊天啦~');
                        handleSend();
                    });
                } catch {
                    /* ignore */
                }
            }
            await load();
        } catch (err) {
            toast.error((err as Error).message || '操作失败');
        }
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="w-full">
                    邀请管理
                </Button>
            </SheetTrigger>

            <SheetContent side="bottom">
                <SheetHeader className="py-2">
                    <SheetTitle>我的邀请</SheetTitle>
                </SheetHeader>

                <div className="py-3 space-y-3">
                    {invites.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-8">暂无邀请</div>
                    )}
                    {invites.map((inv, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                            <div className="text-base">来自：{inv.from}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                时间：{new Date(inv.time * 1000).toLocaleString()}
                            </div>
                            {/* 窄屏按钮自动换行，触摸加高 */}
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                    className="flex-1 min-w-25 h-10"
                                    onClick={() => void handleRespond(inv, 'accept')}
                                >
                                    接受
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="flex-1 min-w-25 h-10"
                                    onClick={() => void handleRespond(inv, 'decline')}
                                >
                                    拒绝
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <SheetFooter className="mt-2">
                    <SheetClose asChild>
                        <Button className="w-full h-10">关闭</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
