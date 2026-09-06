import { Copy, CornerUpLeft, Forward, Trash2, CheckSquare, MoreHorizontal, Pencil } from "lucide-react";
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
    onMore,
    canDelete = false,
    canEdit = false,
    onEdit,
}) {
    const items = [
        { key: "reply", label: "Reply", icon: CornerUpLeft, onClick: onReply },
        { key: "copy", label: "Copy text", icon: Copy, onClick: onCopy },
        { key: "forward", label: "Forward", icon: Forward, onClick: onForward },
        { key: "select", label: "Select", icon: CheckSquare, onClick: onSelect },
        ...(canEdit ? [{ key: "edit", label: "Edit", icon: Pencil, onClick: onEdit }] : []),
        ...(canDelete ? [{ separator: true, key: "divider" }] : []),
        ...(canDelete ? [{ key: "delete", label: "Delete", icon: Trash2, danger: true, onClick: onDelete }] : []),
    ];

    return <ActionMenu point={{ x, y }} items={items} width={205} onClose={onClose} />;
}
