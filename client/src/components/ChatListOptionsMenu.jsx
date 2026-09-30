import { Ban, Bell, BellOff, Eraser, UserMinus, LogOut } from "lucide-react";
import ActionMenu from "./ActionMenu";

export default function ChatListOptionsMenu({
    point,
    contact,
    onClose,
    onClearChat,
    onToggleBlock,
    onToggleMute,
    onUnfriend,
    onNotify,
    onRequestConfirm,
}) {
    const isBlocked = Boolean(contact.blocked);
    const isGroup = Boolean(contact.isGroup);
    const isMuted = Boolean(contact.muted);


    const items = [
        {
            key: "mute",
            label: isMuted
                ? "Unmute notifications"
                : "Mute notifications",
            icon: isMuted ? Bell : BellOff,
            onClick: async () => {
                const changed = await onToggleMute?.(contact.id);

                if (changed !== false) {
                    onNotify?.(
                        isMuted
                            ? "Notifications unmuted"
                            : "Notifications muted"
                    );
                }
            },
        },
        {
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
                    action: () => onToggleBlock(contact.id),
                }),
        },
        {
            key: isGroup ? "leave" : "unfriend",
            label: isGroup ? "Leave group" : "Unfriend",
            icon: isGroup ? LogOut : UserMinus,
            danger: true,
            onClick: () => onRequestConfirm?.({
                title: isGroup ? "Leave group?" : "Unfriend contact?",
                message: isGroup
                    ? `You'll leave ${contact.name} and lose access to this conversation.`
                    : `${contact.name} will be removed from your contacts and chat list.`,
                confirmLabel: isGroup ? "Leave group" : "Unfriend",
                action: () => onUnfriend(contact.id),
            }),
        },
    ];

    return (
        <ActionMenu
            point={point}
            items={items}
            width={210}
            onClose={onClose}
            placement="auto"
        />
    );
}
