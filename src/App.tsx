import { useState } from 'react';
import { ChatProvider } from './context/ChatContext';
import { ChatRoomList } from './components/ChatRoomList';
import { ChatMessageArea } from './components/ChatMessageArea';
import { ChatInput } from './components/ChatInput';
import { AuthModal } from './components/AuthModal';
import { useChat } from './context/ChatContext';
import { Separator } from './components/ui/separator';
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from './components/ui/sheet';
import { Button } from './components/ui/button';
import { Invites } from './components/Invites';
import { Input } from './components/ui/input';
import { toast } from 'sonner';
import { CheckIcon, EditIcon, LogOutIcon, XIcon, MessageSquare, Users, User } from 'lucide-react';

// 页面枚举
type MobilePage = 'rooms' | 'chat' | 'invite';

function ChatApp() {
    const { user, currentRoom, createRoom, joinRoomById, setUser, logout, changeUsername } = useChat();
    const [newRoomName, setNewRoomName] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [joinRoomName, setJoinRoomName] = useState('');
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [editNameInput, setEditNameInput] = useState(user?.username || '');
    // 移动端当前页面
    const [currentPage, setCurrentPage] = useState<MobilePage>('rooms');
    // 个人信息弹窗
    const [openUserSheet, setOpenUserSheet] = useState(false);

    const onUsernameSave = async (newName: string) => {
        if (!newName) return toast.info('用户名不能为空');
        if (newName.includes('|')) return toast.error('用户名不能包含 | 字符');
        try {
            await changeUsername(newName);
            toast.success('用户名修改成功');
            setIsEditingUsername(false);
        } catch (err) {
            toast.error((err as Error).message || '修改用户名失败');
        }
    };

    const handleCreateRoom = async () => {
        if (!newRoomName) return toast.info('房间名不能为空');
        await createRoom(newRoomName);
        setNewRoomName('');
    };

    const handleJoinRoom = async () => {
        if (!joinRoomId) return toast.info('请输入房间ID');
        if (!joinRoomName) return toast.info('请输入房间显示名');
        await joinRoomById(joinRoomId, joinRoomName);
    };

    if (!user) return <AuthModal onLoginSuccess={setUser} />;

    // 房间列表页面
    const renderRoomPage = () => (
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
            <h3 className="text-xl font-semibold">聊天室</h3>
            <Separator />

            <div className="text-sm font-medium bg-white p-3 rounded-lg shadow-sm">
                <div>当前：{currentRoom.name}</div>
                <div className="text-xs text-gray-500 mt-1">房间ID: {currentRoom.id}</div>
            </div>

            <ChatRoomList />

            <div className="flex flex-row gap-3 mt-2">
                {/* 创建房间弹窗 */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button className="flex-1 h-11">创建房间</Button>
                    </SheetTrigger>
                    <SheetContent side="bottom">
                        <SheetHeader className="py-2">
                            <SheetTitle>创建房间</SheetTitle>
                        </SheetHeader>
                        <div className="p-4">
                            <Input
                                value={newRoomName}
                                onChange={e => setNewRoomName(e.target.value)}
                                placeholder="房间显示名"
                            />
                        </div>
                        <SheetFooter className="flex flex-row gap-2">
                            <SheetClose asChild>
                                <Button variant="ghost" className="flex-1 h-11">
                                    取消
                                </Button>
                            </SheetClose>
                            <SheetClose asChild>
                                <Button onClick={handleCreateRoom} className="flex-1 h-11">
                                    创建
                                </Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                {/* 加入房间弹窗 */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button className="flex-1 h-11" variant="outline">
                            加入房间
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom">
                        <SheetHeader className="py-2">
                            <SheetTitle>加入房间</SheetTitle>
                        </SheetHeader>
                        <div className="p-4 flex flex-col gap-3">
                            <Input
                                value={joinRoomId}
                                onChange={e => setJoinRoomId(e.target.value)}
                                placeholder="房间唯一ID"
                            />
                            <Input
                                value={joinRoomName}
                                onChange={e => setJoinRoomName(e.target.value)}
                                placeholder="房间显示名"
                            />
                        </div>
                        <SheetFooter className="flex flex-row gap-2">
                            <SheetClose asChild>
                                <Button variant="ghost" className="flex-1 h-11">
                                    取消
                                </Button>
                            </SheetClose>
                            <SheetClose asChild>
                                <Button onClick={handleJoinRoom} className="flex-1 h-11">
                                    加入
                                </Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );

    // 聊天页面（独立房间聊天页）
    const renderChatPage = () => (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="border-b px-4 py-3 bg-slate-50 shrink-0">
                <div className="text-lg text-slate-500">{currentRoom.name}</div>
                <div className="text-xs text-slate-400">ID: {currentRoom.id}</div>
            </div>
            <ChatMessageArea className="flex-1 overflow-y-auto h-full" />
            <ChatInput className="shrink-0" />
        </div>
    );

    // 邀请页面
    const renderInvitePage = () => (
        <div className="flex flex-col gap-4 h-full overflow-y-auto p-1 pb-24">
            <h3 className="text-xl font-semibold">好友邀请</h3>
            <Separator />
            <Invites />
        </div>
    );

    // 渲染当前激活页面
    const renderCurrentPage = () => {
        switch (currentPage) {
            case 'rooms':
                return renderRoomPage();
            case 'chat':
                return renderChatPage();
            case 'invite':
                return renderInvitePage();
            default:
                return renderRoomPage();
        }
    };

    return (
        <div className="w-full h-screen bg-slate-100 flex flex-col overflow-hidden">
            {/* 主内容区域 */}
            <div className="flex-1 p-4 overflow-hidden h-[90%]">{renderCurrentPage()}</div>

            {/* 底部Tab导航栏 */}
            <div className="h-16 bg-white border-t flex items-center justify-around shrink-0">
                <Button
                    variant="ghost"
                    className="flex-1 h-full flex-col gap-1 rounded-none"
                    onClick={() => setCurrentPage('rooms')}
                >
                    <Users size={20} />
                    <span className="text-xs">房间</span>
                </Button>
                <Button
                    variant="ghost"
                    className="flex-1 h-full flex-col gap-1 rounded-none"
                    onClick={() => setCurrentPage('chat')}
                >
                    <MessageSquare size={20} />
                    <span className="text-xs">聊天</span>
                </Button>
                <Button
                    variant="ghost"
                    className="flex-1 h-full flex-col gap-1 rounded-none"
                    onClick={() => setOpenUserSheet(true)}
                >
                    <User size={20} />
                    <span className="text-xs">我的</span>
                </Button>
            </div>

            {/* 个人信息弹窗（用户名修改+登出+邀请入口） */}
            <Sheet open={openUserSheet} onOpenChange={setOpenUserSheet}>
                <SheetContent side="bottom" className="h-[70vh]">
                    <SheetHeader>
                        <SheetTitle>个人信息</SheetTitle>
                    </SheetHeader>
                    <div className="px-4 pb-3 space-y-6">
                        {/* 用户名修改 */}
                        <div>
                            <div className="text-sm text-muted-foreground">当前用户名</div>
                            {!isEditingUsername ? (
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-lg">{user.username}</span>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsEditingUsername(true);
                                            setEditNameInput(user.username);
                                        }}
                                    >
                                        <EditIcon size={18} />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={editNameInput}
                                        onChange={e => setEditNameInput(e.target.value)}
                                        placeholder="用户名"
                                        className="flex-1"
                                    />
                                    <Button size="icon" onClick={() => onUsernameSave(editNameInput)}>
                                        <CheckIcon size={18} />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => setIsEditingUsername(false)}>
                                        <XIcon size={18} />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Separator className={'mb-3'} />

                        {/* 邀请快捷入口 */}
                        <Button
                            variant="secondary"
                            className="w-full h-11 mb-2"
                            onClick={() => {
                                setOpenUserSheet(false);
                                setCurrentPage('invite');
                            }}
                        >
                            查看邀请列表
                        </Button>

                        {/* 登出按钮 */}
                        <Button
                            variant="destructive"
                            className="w-full h-11"
                            onClick={() => {
                                logout();
                                setOpenUserSheet(false);
                            }}
                        >
                            <LogOutIcon size={18} />
                            退出登录
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default function App() {
    return (
        <ChatProvider>
            <ChatApp />
        </ChatProvider>
    );
}
