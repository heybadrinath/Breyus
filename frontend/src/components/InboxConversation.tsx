import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Reply, Send, Smile, X } from "lucide-react";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import { InboxConversationProps, Message, MessageReaction } from "../types/inboxTypes";

const InboxConversation: React.FC<InboxConversationProps> = ({
    name,
    productName,
    messages,
    currentCompanyId,
    onSendMessage,
    onReactMessage,
    onEditMessage,
    isTyping,
    onTyping,
}) => {
    const [message, setMessage] = useState<string>("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [reactionPickerMessageId, setReactionPickerMessageId] = useState<string | null>(null);
    const [reactionInfoMessageId, setReactionInfoMessageId] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [replyTarget, setReplyTarget] = useState<Message | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);
    const emojiPopoverRef = useRef<HTMLDivElement>(null);
    const reactionPickerRef = useRef<HTMLDivElement>(null);
    const reactionInfoRef = useRef<HTMLDivElement>(null);
    const [reactionPickerPlacement, setReactionPickerPlacement] = useState<"top" | "bottom">("bottom");
    const [reactionInfoPlacement, setReactionInfoPlacement] = useState<"top" | "bottom">("bottom");
    const [emojiPickerPlacement, setEmojiPickerPlacement] = useState<"top" | "bottom">("bottom");
    const [emojiPickerMaxHeight, setEmojiPickerMaxHeight] = useState(360);
    const [reactionPickerMaxHeight, setReactionPickerMaxHeight] = useState(360);
    const [reactionInfoMaxHeight, setReactionInfoMaxHeight] = useState(220);
    const [reactionPickerAnchor, setReactionPickerAnchor] = useState<HTMLElement | null>(null);
    const [reactionInfoAnchor, setReactionInfoAnchor] = useState<HTMLElement | null>(null);

    const firstUnreadIndex = useMemo(() => {
        if (!currentCompanyId) return -1;
        return messages.findIndex(
            (msg) => !msg.isSender && !(msg.readBy || []).includes(currentCompanyId),
        );
    }, [messages, currentCompanyId]);

    const formatTime = (value?: string) => {
        if (!value) return "";
        return new Date(value).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const formatDate = (value?: string) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const isSameDay = (a?: string, b?: string) => {
        if (!a || !b) return true;
        const dateA = new Date(a);
        const dateB = new Date(b);
        return (
            dateA.getFullYear() === dateB.getFullYear() &&
            dateA.getMonth() === dateB.getMonth() &&
            dateA.getDate() === dateB.getDate()
        );
    };

    const getUserId = (val: any) => (typeof val === "string" ? val : val?._id);
    const getUserName = (val: any) =>
        typeof val === "string" ? "" : val?.companyName || "";

    const groupReactions = (reactions: MessageReaction[] = []) => {
        const grouped = new Map<string, { emoji: string; count: number; users: MessageReaction[] }>();
        reactions.forEach((reaction) => {
            const group = grouped.get(reaction.emoji);
            if (group) {
                group.count += 1;
                group.users.push(reaction);
            } else {
                grouped.set(reaction.emoji, { emoji: reaction.emoji, count: 1, users: [reaction] });
            }
        });
        return Array.from(grouped.values());
    };

    const emojiPickerStyle = {
        "--epr-emoji-size": "22px",
        "--epr-emoji-padding": "3px",
        "--epr-category-navigation-button-size": "24px",
        "--epr-header-padding": "6px 8px",
        "--epr-category-label-height": "22px",
        "--epr-category-padding": "0 8px",
        "--epr-category-label-padding": "0 8px",
        "--epr-preview-height": "0px",
    } as React.CSSProperties;

    const getPopoverMetrics = (
        anchor: HTMLElement | null,
        popoverHeight: number,
        container?: HTMLElement | null,
    ) => {
        if (!anchor) {
            return { placement: "bottom" as const, maxHeight: popoverHeight };
        }
        const anchorRect = anchor.getBoundingClientRect();
        const containerRect = container?.getBoundingClientRect();
        const topBoundary = containerRect ? containerRect.top : 0;
        const bottomBoundary = containerRect ? containerRect.bottom : window.innerHeight;
        const spaceAbove = anchorRect.top - topBoundary;
        const spaceBelow = bottomBoundary - anchorRect.bottom;
        const padding = 12;
        const minHeight = 200;
        const availableAbove = Math.max(minHeight, spaceAbove - padding);
        const availableBelow = Math.max(minHeight, spaceBelow - padding);
        if (spaceBelow >= popoverHeight + padding || spaceBelow >= spaceAbove) {
            return {
                placement: "bottom" as const,
                maxHeight: Math.min(popoverHeight, availableBelow),
            };
        }
        return {
            placement: "top" as const,
            maxHeight: Math.min(popoverHeight, availableAbove),
        };
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        setReplyTarget(null);
        setEditingMessageId(null);
        setMessage("");
    }, [name, productName]);

    const triggerTyping = () => {
        if (!onTyping) return;
        onTyping(true);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
        triggerTyping();
    };

    const handleSendMessage = () => {
        const trimmed = message.trim();
        if (!trimmed) return;
        if (editingMessageId) {
            onEditMessage(editingMessageId, trimmed);
            setEditingMessageId(null);
            setMessage("");
            onTyping?.(false);
            return;
        }
        const isReplyIdValid =
            replyTarget?._id && /^[0-9a-fA-F]{24}$/.test(replyTarget._id);
        const replyToId = isReplyIdValid ? replyTarget?._id : null;
        onSendMessage(trimmed, replyToId);
        setMessage("");
        setReplyTarget(null);
        onTyping?.(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        setMessage((prev) => `${prev}${emoji}`);
        triggerTyping();
    };

    const handleReactionSelect = (emoji: string) => {
        if (!reactionPickerMessageId) return;
        onReactMessage(reactionPickerMessageId, emoji);
        setReactionPickerMessageId(null);
        setReactionPickerAnchor(null);
    };

    const handleEditStart = (msg: Message) => {
        setEditingMessageId(msg._id);
        setMessage(msg.text);
        setReplyTarget(null);
        setReactionInfoMessageId(null);
        setReactionPickerMessageId(null);
        setReactionPickerAnchor(null);
        setReactionInfoAnchor(null);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    const handleEditCancel = () => {
        setEditingMessageId(null);
        setMessage("");
    };

    const handleReplyStart = (msg: Message) => {
        setReplyTarget(msg);
        setEditingMessageId(null);
        setReactionInfoMessageId(null);
        setReactionPickerMessageId(null);
        setReactionPickerAnchor(null);
        setReactionInfoAnchor(null);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    const handleReplyCancel = () => {
        setReplyTarget(null);
    };

    const handleToggleReactionPicker = (
        event: React.MouseEvent<HTMLButtonElement>,
        messageId: string,
    ) => {
        if (reactionPickerMessageId === messageId) {
            setReactionPickerMessageId(null);
            setReactionPickerAnchor(null);
            return;
        }
        const metrics = getPopoverMetrics(event.currentTarget, 360, messagesContainerRef.current);
        setReactionPickerAnchor(event.currentTarget);
        setReactionPickerPlacement(metrics.placement);
        setReactionPickerMaxHeight(metrics.maxHeight);
        setReactionPickerMessageId(messageId);
    };

    const handleToggleReactionInfo = (
        event: React.MouseEvent<HTMLButtonElement>,
        messageId: string,
    ) => {
        if (reactionInfoMessageId === messageId) {
            setReactionInfoMessageId(null);
            setReactionInfoAnchor(null);
            return;
        }
        const metrics = getPopoverMetrics(event.currentTarget, 220, messagesContainerRef.current);
        setReactionInfoAnchor(event.currentTarget);
        setReactionInfoPlacement(metrics.placement);
        setReactionInfoMaxHeight(metrics.maxHeight);
        setReactionInfoMessageId(messageId);
    };

    const handleToggleEmojiPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
        setShowEmojiPicker((prev) => {
            if (!prev) {
                const metrics = getPopoverMetrics(
                    event.currentTarget,
                    360,
                );
                setEmojiPickerPlacement(metrics.placement);
                setEmojiPickerMaxHeight(metrics.maxHeight);
            }
            return !prev;
        });
    };

    useEffect(() => {
        if (!reactionPickerMessageId || !reactionPickerAnchor) return;
        const metrics = getPopoverMetrics(reactionPickerAnchor, 360, messagesContainerRef.current);
        setReactionPickerPlacement(metrics.placement);
        setReactionPickerMaxHeight(metrics.maxHeight);
    }, [reactionPickerMessageId, reactionPickerAnchor]);

    useEffect(() => {
        if (!reactionInfoMessageId || !reactionInfoAnchor) return;
        const metrics = getPopoverMetrics(reactionInfoAnchor, 220, messagesContainerRef.current);
        setReactionInfoPlacement(metrics.placement);
        setReactionInfoMaxHeight(metrics.maxHeight);
    }, [reactionInfoMessageId, reactionInfoAnchor]);

    useEffect(() => {
        if (!showEmojiPicker || !emojiButtonRef.current) return;
        const metrics = getPopoverMetrics(emojiButtonRef.current, 360);
        setEmojiPickerPlacement(metrics.placement);
        setEmojiPickerMaxHeight(metrics.maxHeight);
    }, [showEmojiPicker]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
                setReactionPickerMessageId(null);
                setReactionPickerAnchor(null);
            }
            if (reactionInfoRef.current && !reactionInfoRef.current.contains(event.target as Node)) {
                setReactionInfoMessageId(null);
                setReactionInfoAnchor(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                    {name.charAt(0)}
                </div>
                <div>
                    <h3 className="m-0 text-lg font-semibold text-gray-900">{name}</h3>
                    <p className="m-0 text-xs text-[#867C5B]">Product: {productName}</p>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-5 bg-gray-50"
                style={{
                    backgroundImage:
                        "radial-gradient(rgba(148,163,184,0.25) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                }}
            >
                {messages.map((msg, index) => {
                    const previous = messages[index - 1];
                    const showDateDivider = index === 0 || !isSameDay(previous?.createdAt, msg.createdAt);
                    const showUnreadDivider = firstUnreadIndex !== -1 && index === firstUnreadIndex;
                    const groupedReactions = groupReactions(msg.reactions || []);
                    const timestamp = formatTime(msg.createdAt);
                    const editedLabel = msg.editedAt ? " (edited)" : "";
                    const replySenderId = msg.replyTo ? getUserId(msg.replyTo.sender) : null;
                    const replySenderName = msg.replyTo
                        ? replySenderId === currentCompanyId
                            ? "You"
                            : getUserName(msg.replyTo.sender) || "User"
                        : "";

                    return (
                        <React.Fragment key={msg._id}>
                            {showDateDivider && (
                                <div className="flex justify-center my-4">
                                    <span className="px-3 py-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-full">
                                        {formatDate(msg.createdAt)}
                                    </span>
                                </div>
                            )}
                            {showUnreadDivider && (
                                <div className="flex items-center gap-3 my-4">
                                    <div className="h-px bg-gray-200 flex-1" />
                                    <span className="text-xs text-gray-500 font-semibold">Unread</span>
                                    <div className="h-px bg-gray-200 flex-1" />
                                </div>
                            )}
                            <div className={`flex mb-4 ${msg.isSender ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`group relative flex items-end gap-2 ${
                                        msg.isSender ? "flex-row-reverse" : "flex-row"
                                    }`}
                                >
                                    <div
                                        className={`relative min-w-[140px] max-w-[70%] p-3.5 rounded-2xl shadow-sm ${
                                            msg.isSender ? "bg-gray-600 text-white" : "bg-white text-gray-900"
                                        }`}
                                    >
                                        {msg.replyTo && (
                                            <div
                                                className={`mb-2 rounded-lg border-l-4 px-2 py-1 ${
                                                    msg.isSender
                                                        ? "border-white/60 bg-white/10 text-white/80"
                                                        : "border-gray-200 bg-gray-50 text-gray-700"
                                                }`}
                                            >
                                                <div
                                                    className={`text-xs font-semibold ${
                                                        msg.isSender ? "text-white/80" : "text-gray-700"
                                                    }`}
                                                >
                                                    {replySenderName}
                                                </div>
                                                <div
                                                    className={`text-xs ${
                                                        msg.isSender ? "text-white/70" : "text-gray-600"
                                                    } truncate`}
                                                >
                                                    {msg.replyTo.text || "Message"}
                                                </div>
                                            </div>
                                        )}
                                        <div className="text-base leading-tight break-words">{msg.text}</div>
                                        <div className="text-xs opacity-70 mt-1 text-right">
                                            {timestamp}
                                            {editedLabel}
                                        </div>
                                        {groupedReactions.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {groupedReactions.map((reaction) => (
                                                    <button
                                                        key={reaction.emoji}
                                                        onClick={(event) => handleToggleReactionInfo(event, msg._id)}
                                                        className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-100"
                                                    >
                                                        <span>{reaction.emoji}</span>
                                                        <span>{reaction.count}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {reactionInfoMessageId === msg._id && groupedReactions.length > 0 && (
                                            <div
                                                ref={reactionInfoRef}
                                                className={`absolute ${
                                                    msg.isSender ? "right-0" : "left-0"
                                                } ${
                                                    reactionInfoPlacement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
                                                } w-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg z-10`}
                                                style={{ maxHeight: reactionInfoMaxHeight }}
                                            >
                                                <div className="text-xs font-semibold text-gray-600 mb-2">Reactions</div>
                                                <div className="space-y-1.5">
                                                    {groupedReactions.flatMap((group) =>
                                                        group.users.map((reaction) => {
                                                            const userId = getUserId(reaction.user);
                                                            const isCurrentUser = userId === currentCompanyId;
                                                            const userName = isCurrentUser
                                                                ? "You"
                                                                : getUserName(reaction.user) || "User";
                                                            return (
                                                                <button
                                                                    key={`${msg._id}-${group.emoji}-${userId}`}
                                                                    onClick={() => {
                                                                        if (isCurrentUser) {
                                                                            onReactMessage(msg._id, group.emoji);
                                                                            setReactionInfoMessageId(null);
                                                                            setReactionInfoAnchor(null);
                                                                        }
                                                                    }}
                                                                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs ${
                                                                        isCurrentUser
                                                                            ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                                                            : "text-gray-600"
                                                                    }`}
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        <span>{group.emoji}</span>
                                                                        <span>{userName}</span>
                                                                    </span>
                                                                    {isCurrentUser && (
                                                                        <span className="text-gray-500">Remove</span>
                                                                    )}
                                                                </button>
                                                            );
                                                        }),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                        <div className="flex items-center gap-1 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150">
                                            <button
                                                onClick={() => handleReplyStart(msg)}
                                                className="group/tooltip relative rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                                                type="button"
                                                aria-label="Reply"
                                            >
                                                <Reply className="w-4 h-4" />
                                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-600 shadow-sm opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
                                                    Reply
                                                </span>
                                            </button>
                                            <button
                                                onClick={(event) => handleToggleReactionPicker(event, msg._id)}
                                                className="group/tooltip relative rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                                                type="button"
                                                aria-label="React"
                                            >
                                                <Smile className="w-4 h-4" />
                                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-600 shadow-sm opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
                                                    React
                                                </span>
                                            </button>
                                            {msg.isSender && (
                                                <button
                                                    onClick={() => handleEditStart(msg)}
                                                    className="group/tooltip relative rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
                                                    type="button"
                                                    aria-label="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-600 shadow-sm opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
                                                        Edit
                                                    </span>
                                                </button>
                                            )}
                                    </div>
                                    {reactionPickerMessageId === msg._id && (
                                        <div
                                            ref={reactionPickerRef}
                                            className={`absolute ${
                                                msg.isSender ? "right-0" : "left-0"
                                            } ${
                                                reactionPickerPlacement === "bottom" ? "top-full mt-3" : "bottom-full mb-3"
                                            } z-20`}
                                        >
                                            <div
                                                className="rounded-2xl border border-gray-200 bg-white shadow-xl p-3"
                                                style={emojiPickerStyle}
                                            >
                                                <EmojiPicker
                                                    onEmojiClick={(emojiData: EmojiClickData) =>
                                                        handleReactionSelect(emojiData.emoji)
                                                    }
                                                    emojiStyle={EmojiStyle.NATIVE}
                                                    width={320}
                                                    height={reactionPickerMaxHeight}
                                                    searchDisabled={true}
                                                    skinTonesDisabled={true}
                                                    previewConfig={{ showPreview: false }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex mb-4 justify-start">
                        <div className="bg-white text-gray-600 px-4 py-2 rounded-2xl shadow-sm flex items-center gap-1">
                            <span className="animate-bounce">.</span>
                            <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
                                .
                            </span>
                            <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                                .
                            </span>
                            <span className="ml-2 text-sm text-gray-500">{name} is typing</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
                {(replyTarget || editingMessageId) && (
                    <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <div className="min-w-0">
                            {replyTarget && (
                                <>
                                    <div className="font-semibold text-gray-700">
                                        Replying to{" "}
                                        {getUserId(replyTarget.sender) === currentCompanyId
                                            ? "You"
                                            : getUserName(replyTarget.sender) || "User"}
                                    </div>
                                    <div className="text-gray-500 truncate max-w-[220px]">
                                        {replyTarget.text}
                                    </div>
                                </>
                            )}
                            {editingMessageId && !replyTarget && (
                                <div className="font-semibold text-gray-700">Editing message</div>
                            )}
                        </div>
                        <button
                            onClick={editingMessageId ? handleEditCancel : handleReplyCancel}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100"
                            type="button"
                        >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                        </button>
                    </div>
                )}
                <div className="flex items-end gap-3">
                    <div className="relative" ref={emojiPickerRef}>
                        <button
                            className="group/tooltip relative bg-transparent border-none cursor-pointer p-2 text-gray-600 hover:bg-gray-100 rounded-full"
                            onClick={handleToggleEmojiPicker}
                            type="button"
                            ref={emojiButtonRef}
                            aria-label="Add emoji"
                        >
                            <Smile size={20} />
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-600 shadow-sm opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
                                Add emoji
                            </span>
                        </button>
                        {showEmojiPicker && (
                            <div
                                ref={emojiPopoverRef}
                                className={`absolute left-0 z-20 ${
                                    emojiPickerPlacement === "bottom" ? "top-full mt-3" : "bottom-full mb-3"
                                }`}
                            >
                                <div
                                    className="rounded-2xl border border-gray-200 bg-white shadow-xl p-3"
                                    style={emojiPickerStyle}
                                >
                                    <EmojiPicker
                                        onEmojiClick={(emojiData: EmojiClickData) => handleEmojiSelect(emojiData.emoji)}
                                        emojiStyle={EmojiStyle.NATIVE}
                                        width={320}
                                        height={emojiPickerMaxHeight}
                                        searchDisabled={true}
                                        skinTonesDisabled={true}
                                        previewConfig={{ showPreview: false }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
                            className="w-full py-2.5 pl-4 pr-10 border border-gray-300 rounded-full text-base outline-none resize-none max-h-32 min-h-[44px]"
                            value={message}
                            onChange={handleMessageChange}
                            onKeyDown={handleKeyPress}
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        className="bg-gray-600 text-white border-none rounded-full w-11 h-11 cursor-pointer flex items-center justify-center transition-colors hover:bg-gray-700 disabled:bg-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                        disabled={!message.trim()}
                    >
                        {editingMessageId ? <Check size={18} /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InboxConversation;
