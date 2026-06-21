import React, { useCallback, useMemo, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '@/context/ChatContext';
import { formatTime } from '@/lib/time.ts';
import { cn } from '@/lib/utils';
import { verifyMessage } from '@/lib/ed25519';
import { storage } from '@/lib/storage';
import { genRoomId } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { DownloadIcon, MessageCircleIcon, QuoteIcon, UndoIcon } from 'lucide-react';
import type { ChatMessage } from '@/types/message';
import type { IFile } from '@/hooks/useFileUpload';
import { FileDisplay } from './FileDisplay';

type MessageActionBarProps = {
    showActionBar: boolean;
    isRecalled: boolean;
    isCurrentUser: boolean;
    hasPrivateChatEntry: boolean;
    hasDownload: boolean;
    onPrivateChat: () => void;
    onDownload: () => void;
    onQuote: () => void;
    onRecall: () => void;
    onClose: () => void;
};

const MessageActionBar = ({
    showActionBar,
    isRecalled,
    isCurrentUser,
    hasPrivateChatEntry,
    hasDownload,
    onPrivateChat,
    onDownload,
    onQuote,
    onRecall,
    onClose,
}: MessageActionBarProps) => {
    if (!showActionBar || isRecalled) return null;
    return (
        <div className="flex flex-wrap gap-2 mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            {hasPrivateChatEntry && (
                <Button size="sm" variant="outline" onClick={onPrivateChat}>
                    <MessageCircleIcon className="w-4 h-4 mr-1" />
                    私聊
                </Button>
            )}
            {hasDownload && (
                <Button size="sm" variant="outline" onClick={onDownload}>
                    <DownloadIcon className="w-4 h-4 mr-1" />
                    下载
                </Button>
            )}
            <Button size="sm" variant="outline" onClick={onQuote}>
                <QuoteIcon className="w-4 h-4 mr-1" />
                引用
            </Button>
            {isCurrentUser && (
                <Button size="sm" variant="destructive" onClick={onRecall}>
                    <UndoIcon className="w-4 h-4 mr-1" />
                    撤回
                </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
                关闭
            </Button>
        </div>
    );
};

type MessageBubbleProps = {
    message: ChatMessage;
    currentUsername: string;
};

export const MessageBubble = ({ message, currentUsername }: MessageBubbleProps) => {
    const {
        setQuoteMsgId,
        recallMessage,
        messages,
        publicKeyMap,
        avatarKeyMap,
        user,
        privateKey,
        joinRoomById,
        roomList,
        currentRoom,
        switchToRoom,
    } = useChat();

    // 长按面板状态
    const [showActionBar, setShowActionBar] = useState(false);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 长按触发
    const handleTouchStart = () => {
        longPressTimerRef.current = setTimeout(() => {
            setShowActionBar(true);
        }, 500);
    };
    const handleTouchEnd = () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
    const hideActionBar = () => setShowActionBar(false);

    const resolveDisplayName = useCallback(async () => {
        if (!message.sig) return message.username;
        try {
            for (const [uname, pub] of Object.entries(publicKeyMap || {})) {
                try {
                    const ok = await verifyMessage(
                        message.msg,
                        message.username,
                        message.time,
                        message.sig || '',
                        pub,
                        message.nonce || '',
                    );
                    if (ok) return uname;
                } catch {
                    /* empty */
                }
            }
        } catch {
            /* empty */
        }
        return message.username;
    }, [message.msg, message.nonce, message.sig, message.time, message.username, publicKeyMap]);

    const [displayName, setDisplayName] = useState<string>(message.username);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            const name = await resolveDisplayName();
            if (mounted) setDisplayName(name);
        })();
        return () => {
            mounted = false;
        };
    }, [resolveDisplayName]);

    const isCurrentUser = displayName === currentUsername;
    const quoteMessage = message.quoteId ? messages.find(m => m.id === message.quoteId) : null;
    const [quoteDisplayName, setQuoteDisplayName] = useState<string | undefined>(quoteMessage?.username);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            if (!quoteMessage || !quoteMessage.sig) return;
            try {
                for (const [uname, pub] of Object.entries(publicKeyMap || {})) {
                    try {
                        const ok = await verifyMessage(
                            quoteMessage.msg,
                            quoteMessage.username,
                            quoteMessage.time,
                            quoteMessage.sig || '',
                            pub,
                            quoteMessage.nonce || '',
                        );
                        if (ok && mounted) {
                            setQuoteDisplayName(uname);
                            return;
                        }
                    } catch {
                        /* empty */
                    }
                }
            } catch {
                /* empty */
            }
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quoteMessage?.id, JSON.stringify(publicKeyMap)]);

    const onClickInvite = async () => {
        hideActionBar();
        if (!displayName || displayName === currentUsername) return;
        if (!user || !privateKey) {
            toast.error('请先登录以发送私聊请求');
            return;
        }

        const existRoom = roomList.find(r => r.name === `私聊: ${displayName}`);
        if (existRoom) {
            await switchToRoom(existRoom);
            return;
        }

        const roomId = genRoomId();
        const payload = JSON.stringify({
            roomId,
            name: `私聊: ${displayName}`,
        });
        try {
            await storage.sendInvite(user.username, displayName, payload, {
                username: user.username,
                privateKey,
            });
            toast.success('私聊请求已发送，等待对方审批');
            await joinRoomById(roomId, `私聊: ${displayName}`);
        } catch (err) {
            toast.error((err as Error).message || '发送邀请失败');
        }
    };

    const handleQuote = () => {
        setQuoteMsgId(message.id);
        hideActionBar();
    };

    const handleRecall = () => {
        recallMessage(message.id).then(() => {
            hideActionBar();
        });
    };

    const handleDownload = () => {
        if (downloadUrl !== '') {
            const newWindow = window.open(downloadUrl, '_blank');
            if (!newWindow) {
                toast.error('弹窗被拦截，请允许浏览器弹窗后重试');
            }
        }
        hideActionBar();
    };

    const { fileData, isMedia } = useMemo(() => {
        if (message.type === 'share') {
            try {
                const parsedData = JSON.parse(message.msg);
                if (parsedData && typeof parsedData === 'object' && 'name' in parsedData) {
                    const data = parsedData as IFile;
                    const mediaExtensions = [
                        'jpg',
                        'jpeg',
                        'png',
                        'gif',
                        'webp',
                        'svg',
                        'bmp',
                        'mp4',
                        'webm',
                        'mov',
                        'avi',
                    ];
                    const ext = data.name.split('.').pop();
                    const media = ext !== undefined && mediaExtensions.includes(ext.toLowerCase());
                    return { fileData: data, isMedia: media };
                }
            } catch {
                /* empty */
            }
        }
        return { fileData: null, isMedia: false };
    }, [message.type, message.msg]);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const downloadUrl = useMemo(() => {
        if (!fileData?.link) return '';
        const link = fileData.link;
        if (!link.includes('python_assets/')) return '';
        const fileName = fileData.name;
        const suffix = link.split('python_assets/')[1];
        return `https://livefile.xesimg.com/programme/python_assets/844958913c304c040803a9d7f79f898e.html?name=${encodeURIComponent(fileName)}&file=${suffix}`;
    }, [fileData?.link, fileData?.name]);

    return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`} onClick={hideActionBar}>
            <div
                className={`max-w-[85%] sm:max-w-[70%] flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
            >
                <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={avatarKeyMap[displayName]} alt={displayName} />
                    <AvatarFallback>
                        {displayName ? displayName[0] : message.username ? message.username[0] : '?'}
                    </AvatarFallback>
                </Avatar>
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`flex flex-col max-w-full min-w-25 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        <div className={`flex gap-1 min-w-12 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            <span className="text-xs truncate">{displayName}</span>
                            <span className="text-xs text-slate-500">{formatTime(message.time)}</span>
                        </div>

                        <div
                            className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div
                                className={
                                    !message.recalled
                                        ? cn(
                                              'rounded-2xl shadow-sm select-none',
                                              isMedia
                                                  ? 'bg-transparent p-0 rounded-none shadow-none'
                                                  : isCurrentUser
                                                    ? 'bg-primary text-background rounded-br-none px-4 py-2'
                                                    : 'bg-surface border border-border text-text-primary rounded-bl-none px-4 py-2',
                                          )
                                        : ''
                                }
                            >
                                {message.quoteId && (
                                    <div
                                        className={cn(
                                            'text-xs p-2 mb-2 rounded border-l-4 overflow-hidden',
                                            isCurrentUser
                                                ? 'bg-indigo-900/30 border-indigo-400 text-indigo-100'
                                                : 'bg-slate-50 border-slate-400 text-slate-800',
                                        )}
                                    >
                                        <p className="font-bold mb-0.5">
                                            @{quoteDisplayName || quoteMessage?.username}
                                        </p>
                                        <div
                                            className={cn(
                                                'prose prose-sm max-w-none wrap-break-word overflow-wrap-anywhere prose-p:my-0 prose-headings:my-1 prose-ul:my-0 prose-ol:my-0 prose-li:my-0 prose-pre:my-1',
                                                quoteMessage?.recalled && 'text-secondary italic',
                                            )}
                                        >
                                            {quoteMessage?.recalled ? (
                                                '消息已撤回'
                                            ) : quoteMessage?.type !== 'share' ? (
                                                quoteMessage?.msg
                                            ) : (
                                                <FileDisplay
                                                    fileData={JSON.parse(quoteMessage.msg) as IFile}
                                                    isCurrentUser={isCurrentUser}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="max-w-[80vw]">
                                    {message.type !== 'share' ? (
                                        <p className="text-sm whitespace-pre-wrap wrap-break-word overflow-wrap-anywhere">
                                            {message.recalled ? '消息已撤回' : message.msg}
                                        </p>
                                    ) : (
                                        fileData &&
                                        !message.recalled && (
                                            <FileDisplay fileData={fileData} isCurrentUser={isCurrentUser} />
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        <MessageActionBar
                            showActionBar={showActionBar}
                            isRecalled={!!message.recalled}
                            isCurrentUser={isCurrentUser}
                            hasPrivateChatEntry={!isCurrentUser && currentRoom?.name !== `私聊: ${displayName}`}
                            hasDownload={message.type === 'share' && downloadUrl !== ''}
                            onPrivateChat={onClickInvite}
                            onDownload={handleDownload}
                            onQuote={handleQuote}
                            onRecall={handleRecall}
                            onClose={hideActionBar}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
