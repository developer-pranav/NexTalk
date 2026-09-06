import { Ban, Bell, BellOff, Eraser, Flag, LogOut, UserMinus } from "lucide-react";
import ActionMenu from "./ActionMenu";

export default function ChatOptionsMenu({
    anchorRect,
    contact,
    onClose,
    onNotify,
    onClearChat,
    onToggleMute,
    onToggleBlock,
    onUnfriend,
    onRequestConfirm,
}) {
    const isBlocked = Boolean(contact.blocked);
    const isMuted = Boolean(contact.muted);


    const items = [
        // {
        //     key: "mute",
        //     label: isMuted ? "Unmute notifications" : "Mute notifications",
        //     icon: isMuted ? Bell : BellOff,
        //     onClick: () => {
        //         onToggleMute(contact.id);
        //         onNotify?.(isMuted ? "Notifications unmuted" : "Notifications muted");
        //     },
        // },
        {
            key: "clear",
            label: "Clear chat",
            icon: Eraser,
            onClick: () => onRequestConfirm?.({
                title: "Clear chat?",
                message: `All messages with ${contact.name} will be permanently removed.`,
                confirmLabel: "Clear chat",
                action: () => { onClearChat(contact.id); onNotify?.("Chat cleared"); },
            }),
        },
        contact.isGroup
            ? {
                key: "exit",
                label: "Exit group",
                icon: LogOut,
                danger: true,
                onClick: () => onRequestConfirm?.({
                    title: "Leave group?",
                    message: `You'll leave ${contact.name} and lose access to this conversation.`,
                    confirmLabel: "Leave group",
                    action: () => { onDeleteChat(contact.id); onNotify?.("You left the group"); },
                }),
            }
            : {
                key: "block",
                label: isBlocked ? "Unblock contact" : "Block contact",
                icon: Ban,
                danger: !isBlocked,
                onClick: () => isBlocked
                    ? onToggleBlock(contact.id)
                    : onRequestConfirm?.({
                        title: "Block contact?",
                        message: `${contact.name} won't be able to message you until you unblock them.`,
                        confirmLabel: "Block",
                        action: () => { onToggleBlock(contact.id); onNotify?.(`Blocked ${contact.name}`); },
                    }),
            },
        { separator: true, key: "divider" },
        {
            key: "unfriend",
            label: "Unfriend",
            icon: UserMinus,
            danger: true,
            onClick: () => onRequestConfirm?.({
                title: "Unfriend contact?",
                message: `You and ${contact.name} will no longer be friends. This won't delete your chat history.`,
                confirmLabel: "Unfriend",
                action: () => { onUnfriend(contact.id); onNotify?.(`Unfriended ${contact.name}`); },
            }),
        },
    ];

    return (
        <ActionMenu
            anchorRect={anchorRect}
            items={items}
            width={235}
            onClose={onClose}
            placement="auto"
        />
    );
}
