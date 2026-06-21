import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useChat } from '../context/ChatContext';
import { FileUpIcon, SendIcon, XIcon } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from './ui/sheet';
import UploadFile from './UploadFile';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useState } from 'react';
import { Progress } from './ui/progress';
import { FileDisplay } from './FileDisplay';

export function ChatInput({ className }: { className?: string }) {
    const { input, setInput, handleSend, quoteMsgId, setQuoteMsgId, messages, sendFile } = useChat();
    const quoteMessage = quoteMsgId ? messages.find(m => m.id === quoteMsgId) : null;
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { upload, isUploading, uploadProgress } = useFileUpload();
    const [open, setOpen] = useState(false);

    const handleUpload = async () => {
        if (selectedFile === null) return;
        try {
            const data = await upload(selectedFile);
            sendFile(data);
            setOpen(false);
        } catch {
            // 忽略异常
        } finally {
            setSelectedFile(null);
            setOpen(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) setSelectedFile(null);
    };

    return (
        <div className={`p-3 flex flex-col bg-white border-t shrink-0 max-h-52 overflow-y-auto ${className}`}>
            {quoteMsgId && (
                <div className="relative text-xs p-2 mb-2 rounded border-l-4 bg-slate-50 border-slate-400 text-slate-800">
                    <p className="font-bold mb-0.5">@{quoteMessage?.username}</p>
                    <div className="prose prose-sm max-w-none max-h-20 overflow-y-auto prose-p:my-0 prose-headings:my-1 prose-ul:my-0 prose-ol:my-0 prose-li:my-0 prose-pre:my-1">
                        {quoteMessage?.type !== 'share' ? (
                            quoteMessage?.msg
                        ) : (
                            <FileDisplay fileData={JSON.parse(quoteMessage.msg)} isCurrentUser={false} />
                        )}
                    </div>
                    <Button
                        size="icon-xs"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setQuoteMsgId(null)}
                    >
                        <XIcon className="h-3 w-3" />
                    </Button>
                </div>
            )}

            <div className="flex gap-2 items-center shrink-0">
                <Sheet open={open} onOpenChange={handleOpenChange}>
                    <SheetTrigger asChild>
                        <Button size="icon" className="h-10 w-10 shrink-0">
                            <FileUpIcon className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom">
                        <SheetHeader className="py-2">
                            <SheetTitle>分享文件</SheetTitle>
                        </SheetHeader>
                        <div className="p-4 flex flex-col gap-3">
                            <UploadFile setSelectedFile={setSelectedFile} disabled={isUploading} />
                            {isUploading && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Progress value={uploadProgress} className="flex-1 h-2" />
                                    <span className="text-sm font-medium min-w-10 text-right">{uploadProgress}%</span>
                                </div>
                            )}
                        </div>
                        <SheetFooter className="flex flex-row gap-2 mt-2">
                            <SheetClose asChild>
                                <Button variant="secondary" className="flex-1 h-11" disabled={isUploading}>
                                    取消
                                </Button>
                            </SheetClose>
                            <Button
                                disabled={selectedFile === null || isUploading}
                                onClick={handleUpload}
                                className="flex-1 h-11"
                            >
                                {isUploading ? '上传中' : '分享'}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="输入消息..."
                    className="flex-1 h-10"
                />
                <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleSend}>
                    <SendIcon className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
