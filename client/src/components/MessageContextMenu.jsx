import {
    Copy,
    CornerUpLeft,
    Forward,
    Trash2,
    CheckSquare,
    Pencil,
} from "lucide-react";
import ActionMenu from "./ActionMenu";

export default function MessageContextMenu({
    x,
    y,
    onClose,
    onReply,
    onCopy,
    onForward,
    onDelete,
    onSelect,
    canDelete = false,
    canEdit = false,
    canCopy = false,
    onEdit,
}) {
    const items = [
        {
            key: "reply",
            label: "Reply",
            icon: CornerUpLeft,
            onClick: onReply,
        },

        ...(canCopy
            ? [
                {
                    key: "copy",
                    label: "Copy text",
                    icon: Copy,
                    onClick: onCopy,
                },
            ]
            : []),

        {
            key: "forward",
            label: "Forward",
            icon: Forward,
            onClick: onForward,
        },

        {
            key: "select",
            label: "Select",
            icon: CheckSquare,
            onClick: onSelect,
        },

        ...(canEdit
            ? [
                {
                    key: "edit",
                    label: "Edit",
                    icon: Pencil,
                    onClick: onEdit,
                },
            ]
            : []),

        ...(canDelete
            ? [
                {
                    separator: true,
                    key: "divider",
                },
                {
                    key: "delete",
                    label: "Delete",
                    icon: Trash2,
                    danger: true,
                    onClick: onDelete,
                },
            ]
            : []),
    ];

    return (
        <ActionMenu
            point={{ x, y }}
            items={items}
            width={205}
            onClose={onClose}
        />
    );
}