import { useEffect, useRef, useState } from "react";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import Avatar from "./Avatar";
import ThemeSwitch from "./ThemeSwitch";
import { useAuth } from "../context/AuthContext";
import { updateAvatar, updateProfile } from "../api/users";
import { getBlockedUsers, unblockUser } from "../api/friends.js";
import BlocklistModal from "./BlocklistModal";
import { useToast } from "../context/ToastContext";

function SectionLabel({ children }) {
    return (
        <p className="mb-2 text-[12px] font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            {children}
        </p>
    );
}

function getInitials(name = "") {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function CropModal({ file, onCancel, onConfirm, saving }) {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const dragRef = useRef(null);

    useEffect(() => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { imageRef.current = img; draw(); };
        img.src = url;
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const draw = () => {
        const canvas = canvasRef.current;
        const img = imageRef.current;

        if (!canvas || !img) return;

        const size = 320;
        const ctx = canvas.getContext("2d");

        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, size, size);

        const base = Math.max(size / img.width, size / img.height);
        const scale = base * zoom;

        const w = img.width * scale;
        const h = img.height * scale;

        const x = (size - w) / 2 + offset.x;
        const y = (size - h) / 2 + offset.y;

        ctx.drawImage(img, x, y, w, h);
    };

    useEffect(() => { draw(); }, [zoom, offset]);

    const pointerDown = (e) => {
        dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const pointerMove = (e) => {
        if (!dragRef.current) return;
        setOffset({
            x: dragRef.current.ox + e.clientX - dragRef.current.x,
            y: dragRef.current.oy + e.clientY - dragRef.current.y,
        });
    };
    const pointerUp = () => { dragRef.current = null; };

    const confirm = () => {
        const canvas = canvasRef.current;
        canvas.toBlob((blob) => {
            if (blob) onConfirm(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.92);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.48)" }} onClick={!saving ? onCancel : undefined} />
            <div className="relative w-full max-w-[390px] overflow-hidden rounded-3xl" style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
                    <div>
                        <p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Set profile photo</p>
                        <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>Drag to position · zoom to crop</p>
                    </div>
                    <button type="button" onClick={onCancel} disabled={saving} className="grid h-8 w-8 place-items-center rounded-full" style={{ color: "var(--text-muted)" }}><X size={18} /></button>
                </div>
                <div className="flex flex-col items-center px-5 py-6">
                    <canvas
                        ref={canvasRef}
                        className="h-80 w-80 max-w-full cursor-grab touch-none rounded-full active:cursor-grabbing"
                        onPointerDown={pointerDown}
                        onPointerMove={pointerMove}
                        onPointerUp={pointerUp}
                        onPointerCancel={pointerUp}
                        style={{ background: "var(--surface-2)" }}
                    />
                    <div className="mt-5 flex w-full items-center gap-3">
                        <span className="text-xs" style={{ color: "var(--text-faint)" }}>−</span>
                        <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
                        <span className="text-xs" style={{ color: "var(--text-faint)" }}>+</span>
                    </div>
                </div>
                <div className="flex gap-2 border-t px-5 py-4" style={{ borderColor: "var(--border)" }}>
                    <button type="button" onClick={onCancel} disabled={saving} className="flex-1 rounded-2xl px-4 py-3 text-[13px] font-semibold" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>Cancel</button>
                    <button type="button" onClick={confirm} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold" style={{ background: "var(--accent)", color: "var(--accent-text)" }}>
                        {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Check size={15} /> Set photo</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProfileScreen() {
    const { user, logout, updateUser } = useAuth();
    const { showToast } = useToast();
    const [editingName, setEditingName] = useState(false);
    const [editingBio, setEditingBio] = useState(false);
    const [fullname, setFullname] = useState(user?.fullname || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [savingProfile, setSavingProfile] = useState(false);
    const [cropFile, setCropFile] = useState(null);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [blocklistOpen, setBlocklistOpen] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockedLoading, setBlockedLoading] = useState(false);
    const [unblockingId, setUnblockingId] = useState(null);
    const fileInputRef = useRef(null);
    const nameEditRef = useRef(null);

    useEffect(() => {
        setFullname(user?.fullname || "");
        setBio(user?.bio || "");
    }, [user]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (editingName && nameEditRef.current && !nameEditRef.current.contains(event.target)) {
                setEditingName(false);
                setFullname(user?.fullname || "");
            }
        };

        document.addEventListener("pointerdown", handleOutsideClick);
        return () => document.removeEventListener("pointerdown", handleOutsideClick);
    }, [editingName, user?.fullname]);

    const initials = getInitials(user?.fullname || user?.username);

    const saveName = async () => {
        if (!fullname.trim()) return showToast?.("Name cannot be empty", "error");
        setSavingProfile(true);
        try {
            const response = await updateProfile({ fullname: fullname.trim() });
            updateUser(response?.data || { ...user, fullname: fullname.trim() });
            setEditingName(false);
            showToast?.("Name updated", "success");
        } catch (error) {
            showToast?.(error?.response?.data?.message || "Unable to update name", "error");
        } finally { setSavingProfile(false); }
    };

    const saveBio = async () => {
        setSavingProfile(true);
        try {
            const response = await updateProfile({ bio: bio.trim() });
            updateUser(response?.data || { ...user, bio: bio.trim() });
            setEditingBio(false);
            showToast?.("Bio updated", "success");
        } catch (error) {
            showToast?.(error?.response?.data?.message || "Unable to update bio", "error");
        } finally { setSavingProfile(false); }
    };

    const choosePhoto = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) return showToast?.("Please choose an image", "error");
        if (file.size > 10 * 1024 * 1024) return showToast?.("Image must be under 10 MB", "error");
        setCropFile(file);
    };

    const saveAvatar = async (croppedFile) => {
        setSavingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("avatar", croppedFile);
            const response = await updateAvatar(formData);
            updateUser(response?.data || user);
            setCropFile(null);
            showToast?.("Profile photo updated", "success");
        } catch (error) {
            showToast?.(error?.response?.data?.message || "Unable to upload photo", "error");
        } finally { setSavingAvatar(false); }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try { await logout(); }
        catch { showToast?.("Unable to sign out", "error"); setLoggingOut(false); }
    };

    const readBlockedUsers = (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.data?.data)) return response.data.data;
        return [];
    };

    const openBlocklist = async () => {
        setBlocklistOpen(true);
        setBlockedLoading(true);
        try {
            const response = await getBlockedUsers();
            setBlockedUsers(readBlockedUsers(response));
        } catch (error) {
            console.error("Failed to load blocklist:", error);
            setBlockedUsers([]);
            showToast?.("Unable to load blocklist", "error");
        } finally {
            setBlockedLoading(false);
        }
    };

    const handleUnblock = async (userId) => {
        setUnblockingId(userId);
        try {
            await unblockUser(userId);
            setBlockedUsers((previous) => previous.filter((item) => String(item._id || item.id) !== String(userId)));
            window.dispatchEvent(new CustomEvent("talkverse:blocklist-updated", {
                detail: { userId, action: "unblock" },
            }));
            showToast?.("User unblocked successfully", "success");
        } catch (error) {
            console.error("Unblock failed:", error);
            showToast?.(error?.response?.data?.message || "Unable to unblock user", "error");
        } finally {
            setUnblockingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center rounded-3xl px-5 py-6 text-center" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
                <div className="relative">
                    <Avatar name={user?.fullname} initials={initials} src={user?.avatar} color="var(--accent)" size="2xl" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full transition-transform active:scale-90" style={{ background: "var(--accent)", color: "var(--accent-text)", border: "2px solid var(--surface)" }} aria-label="Change photo">
                        <Pencil size={12} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={choosePhoto} />
                </div>

                <div ref={nameEditRef} className="mt-3 flex items-center justify-center gap-1.5">
                    {!editingName ? (
                        <>
                            <p className="ml-7 text-[17px] font-semibold" style={{ color: "var(--text)" }}>
                                {user?.fullname || "Your name"}
                            </p>
                            <button
                                type="button"
                                onClick={() => setEditingName(true)}
                                className="grid h-6 w-6 place-items-center rounded-full transition-transform active:scale-90"
                                style={{ color: "var(--text-faint)" }}
                                aria-label="Edit name"
                            >
                                <Pencil size={13} />
                            </button>
                        </>
                    ) : (
                        <>
                            <input
                                autoFocus
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveName();
                                    if (e.key === "Escape") {
                                        setEditingName(false);
                                        setFullname(user?.fullname || "");
                                    }
                                }}
                                className="w-full max-w-[250px] rounded-xl border px-3 py-2 text-center text-[15px] font-semibold outline-none ml-10"
                                style={{
                                    background: "var(--bg)",
                                    borderColor: "var(--border)",
                                    color: "var(--text)"
                                }}
                            />
                            <button
                                type="button"
                                onClick={saveName}
                                disabled={savingProfile}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform active:scale-90 disabled:opacity-60"
                                style={{ color: "var(--accent)" }}
                                aria-label="Save name"
                            >
                                {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} />}
                            </button>
                        </>
                    )}
                </div>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>@{user?.username || "username"}</p>
            </div>

            <div>
                <SectionLabel>My Bio</SectionLabel>
                {!editingBio ? (
                    <div className="rounded-2xl px-4 py-3.5 cursor-text" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }} onDoubleClick={() => setEditingBio(true)} title="Double-click to edit bio">
                        <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{user?.bio?.trim() || "No bio added yet."}</p>
                    </div>
                ) : (
                    <div className="rounded-2xl px-4 py-3.5" style={{ background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
                        <textarea autoFocus value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={160} className="w-full resize-none rounded-xl border px-3 py-2.5 text-[13px] outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
                        <div className="mt-2 flex justify-end gap-2">
                            <button type="button" onClick={() => { setEditingBio(false); setBio(user?.bio || ""); }} className="rounded-xl px-3 py-2 text-[12px] font-semibold" style={{ color: "var(--text-muted)", background: "var(--surface-2)" }}>Cancel</button>
                            <button type="button" disabled={savingProfile} onClick={saveBio} className="rounded-xl px-3 py-2 text-[12px] font-semibold" style={{ color: "var(--accent-text)", background: "var(--accent)" }}>{savingProfile ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                )}
            </div>

            <ThemeSwitch />

            <div>
                <SectionLabel>Privacy</SectionLabel>
                <button
                    type="button"
                    onClick={openBlocklist}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-colors"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                    <span className="text-[13.5px] font-medium" style={{ color: "var(--text)" }}>Blocklist</span>
                </button>
            </div>

            <BlocklistModal
                open={blocklistOpen}
                users={blockedUsers}
                loading={blockedLoading}
                unblockingId={unblockingId}
                onClose={() => setBlocklistOpen(false)}
                onUnblock={handleUnblock}
            />

            <div>
                <SectionLabel>My Account</SectionLabel>
                <button type="button" disabled={loggingOut} onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold transition-all active:scale-[0.99] disabled:opacity-60" style={{ color: "var(--danger)", background: "var(--surface)", border: "1px solid var(--border)" }}>
                    {loggingOut ? <><Loader2 size={15} className="animate-spin" /> Signing out...</> : "Log Out"}
                </button>
            </div>

            <div className="mt-2 border-t pt-4 text-center" style={{ borderColor: "var(--border)" }}>
                <p className="text-[11px] font-medium tracking-wide" style={{ color: "var(--text-faint)" }}>Developed with ❤️ by Pranav</p>
            </div>

            {cropFile && <CropModal file={cropFile} onCancel={() => !savingAvatar && setCropFile(null)} onConfirm={saveAvatar} saving={savingAvatar} />}
        </div>
    );
}