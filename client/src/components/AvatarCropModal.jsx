import { useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw, Upload, X } from "lucide-react";

const OUTPUT_SIZE = 512;

export default function AvatarCropModal({ file, onClose, onConfirm, uploading = false }) {
    const [src, setSrc] = useState("");
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragRef = useRef(null);
    const imgRef = useRef(null);
    const cropBoxRef = useRef(null);
    const [baseScale, setBaseScale] = useState(1);

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setSrc(url);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setBaseScale(1);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const imageStyle = useMemo(() => {
        if (!imgRef.current || !cropBoxRef.current) return {};
        const boxSize = cropBoxRef.current.clientWidth || 320;
        const scale = Math.max(boxSize / (imgRef.current.naturalWidth || boxSize), boxSize / (imgRef.current.naturalHeight || boxSize));
        return {
            width: `${(imgRef.current.naturalWidth || boxSize) * scale}px`,
            height: `${(imgRef.current.naturalHeight || boxSize) * scale}px`,
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
        };
    }, [position, zoom, baseScale]);

    if (!file || !src) return null;

    const startDrag = (event) => {
        if (uploading) return;
        event.preventDefault();
        const point = event.touches?.[0] || event;
        dragRef.current = {
            startX: point.clientX,
            startY: point.clientY,
            x: position.x,
            y: position.y,
        };
        setDragging(true);
    };

    const moveDrag = (event) => {
        if (!dragRef.current) return;
        const point = event.touches?.[0] || event;
        setPosition({
            x: dragRef.current.x + point.clientX - dragRef.current.startX,
            y: dragRef.current.y + point.clientY - dragRef.current.startY,
        });
    };

    const endDrag = () => {
        dragRef.current = null;
        setDragging(false);
    };

    const createCroppedFile = async () => {
        const img = imgRef.current;
        if (!img?.naturalWidth || !img?.naturalHeight) return null;

        const box = cropBoxRef.current;
        const boxSize = box.clientWidth;
        const naturalScale = Math.max(boxSize / img.naturalWidth, boxSize / img.naturalHeight);
        const displayScale = naturalScale * zoom;
        const displayedWidth = img.naturalWidth * displayScale;
        const displayedHeight = img.naturalHeight * displayScale;
        const left = boxSize / 2 + position.x - displayedWidth / 2;
        const top = boxSize / 2 + position.y - displayedHeight / 2;

        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
            img,
            (0 - left) / displayScale,
            (0 - top) / displayScale,
            boxSize / displayScale,
            boxSize / displayScale,
            0,
            0,
            OUTPUT_SIZE,
            OUTPUT_SIZE
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) return resolve(null);
                resolve(new File([blob], "avatar.jpg", { type: "image/jpeg", lastModified: Date.now() }));
            }, "image/jpeg", 0.92);
        });
    };

    const confirm = async () => {
        const cropped = await createCroppedFile();
        if (cropped) onConfirm(cropped);
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
                <div className="flex items-center justify-between px-5 py-4">
                    <div>
                        <p className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Set profile photo</p>
                        <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>Drag to position · use the slider to zoom</p>
                    </div>
                    <button onClick={onClose} disabled={uploading} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                        <X size={17} />
                    </button>
                </div>

                <div
                    ref={cropBoxRef}
                    className={`relative mx-5 aspect-square overflow-hidden rounded-2xl ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                    style={{ background: "var(--bg)" }}
                    onMouseDown={startDrag}
                    onMouseMove={moveDrag}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchStart={startDrag}
                    onTouchMove={moveDrag}
                    onTouchEnd={endDrag}
                >
                    <img
                        ref={imgRef}
                        src={src}
                        alt="Crop preview"
                        draggable="false"
                        onLoad={() => {
                            setPosition({ x: 0, y: 0 });
                            setBaseScale((value) => value + 0.0001);
                        }}
                        className="absolute left-1/2 top-1/2 max-w-none select-none"
                        style={imageStyle}
                    />
                    <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ boxShadow: "0 0 0 999px rgba(0,0,0,.38)" }} />
                    <div className="pointer-events-none absolute inset-5 rounded-full border-2 border-white/90" />
                </div>

                <div className="px-5 pt-5">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>−</span>
                        <input
                            aria-label="Zoom"
                            type="range"
                            min="1"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-[var(--accent)]"
                            disabled={uploading}
                        />
                        <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>+</span>
                    </div>
                </div>

                <div className="flex gap-2 px-5 py-5">
                    <button onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }} disabled={uploading} className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                        <RotateCcw size={15} /> Reset
                    </button>
                    <button onClick={confirm} disabled={uploading} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold" style={{ background: "var(--accent)", color: "var(--accent-text)" }}>
                        {uploading ? <><Upload size={15} className="animate-pulse" /> Uploading...</> : <><Check size={16} /> Set photo</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
