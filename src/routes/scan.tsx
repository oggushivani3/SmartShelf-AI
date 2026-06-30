import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera,
  CameraOff,
  Check,
  RefreshCw,
  Plus,
  Loader2,
  AlertTriangle,
  PackageSearch,
  ScanLine,
  Trash2,
  X,
  ImagePlus,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { AppShell, PageHeader } from "@/components/app-shell";
import { addItem } from "@/lib/use-items";
import { lookupBarcode, type ProductInfo } from "@/lib/barcode-lookup";
import type { Category } from "@/lib/mock-data";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [{ title: "Scan — SmartShelf AI" }],
  }),
  component: Scan,
});

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "looking-up"; barcode: string }
  | { status: "found"; barcode: string; product: ProductInfo }
  | { status: "not-found"; barcode: string }
  | { status: "error"; message: string };

interface ScannedEntry {
  id: string;
  barcode: string;
  name: string;
  saved: boolean;
}

/** Detect brand name from barcode prefix for common Indian manufacturers */
function detectBrandFromBarcode(barcode: string): string {
  const prefix = barcode.slice(0, 8);
  const map: Record<string, string> = {
    "89010633": "Britannia",
    "89010632": "Britannia",
    "89010631": "Britannia",
    "89011501": "Parle",
    "89011502": "Parle",
    "89040001": "Amul",
    "89040002": "Amul",
    "89045101": "Nestlé India",
    "89002660": "ITC",
    "89002661": "ITC",
    "89000169": "Hindustan Unilever",
    "89000170": "Hindustan Unilever",
    "89002200": "Dabur",
    "89002100": "Godrej",
    "89001500": "Cadbury",
  };
  return map[prefix] || (barcode.startsWith("890") ? "Indian Product" : "");
}

function Scan() {
  const [state, setState] = useState<ScanState>({ status: "idle" });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScannedEntry[]>([]);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<Category>("grocery");
  const [quantity, setQuantity] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileCanvasRef = useRef<HTMLCanvasElement>(null);

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch { /* ignore */ }
      controlsRef.current = null;
    }
  }, []);

  const handleBarcodeFound = useCallback(async (decodedText: string) => {
    stopScanner();
    setState({ status: "looking-up", barcode: decodedText });

    const product = await lookupBarcode(decodedText);
    if (product) {
      setState({ status: "found", barcode: decodedText, product });
      setName(product.name);
      setBrand(product.brand);
      setCategory(product.category);
      setQuantity(product.quantity || "");
      setImageUrl(product.imageUrl);
      setExpiresOn(product.estimatedExpiryDate || "");
    } else {
      setState({ status: "not-found", barcode: decodedText });
      // For Indian barcodes (890 prefix), try to guess brand
      const detectedBrand = detectBrandFromBarcode(decodedText);
      setName("");
      setBrand(detectedBrand);
      setCategory("grocery");
      setQuantity("");
      setImageUrl(undefined);
      setExpiresOn("");
    }
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setState({ status: "scanning" });
    stopScanner();

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      // Get list of video devices
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      // Prefer back camera on mobile
      const deviceId = devices.find(d =>
        d.label.toLowerCase().includes("back") ||
        d.label.toLowerCase().includes("rear") ||
        d.label.toLowerCase().includes("environment")
      )?.deviceId ?? devices[devices.length - 1]?.deviceId ?? undefined;

      if (!videoRef.current) return;

      const controls = await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            handleBarcodeFound(result.getText());
          }
          // NotFoundException is normal when no barcode in frame — ignore it
          if (err && (err as Error).name !== "NotFoundException") {
            console.warn("ZXing decode error:", err);
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not access camera";
      setCameraError(
        msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("notallowed")
          ? "Camera permission denied. Please allow camera access in your browser settings and reload."
          : msg
      );
      setState({ status: "error", message: msg });
    }
  }, [stopScanner, handleBarcodeFound]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    stopScanner();
    setCameraError(null);
    setState({ status: "looking-up", barcode: "scanning photo..." });

    try {
      // Draw image onto canvas, then decode from canvas element
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      const canvas = fileCanvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);

      const reader = new BrowserMultiFormatReader();
      const result = await reader.decodeFromCanvas(canvas);
      await handleBarcodeFound(result.getText());
    } catch {
      setCameraError("No barcode found in this photo. Please try a clearer, closer shot of just the barcode.");
      setState({ status: "error", message: "Barcode not found in image" });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const resetScanner = () => {
    stopScanner();
    setName("");
    setBrand("");
    setCategory("grocery");
    setQuantity("");
    setExpiresOn("");
    setImageUrl(undefined);
    setState({ status: "idle" });
  };

  const saveItem = () => {
    if (!name.trim() || !expiresOn) return;
    const item = addItem({
      name: name.trim(),
      brand: brand.trim(),
      category,
      quantity: quantity.trim(),
      expiresOn,
    });
    const barcode =
      state.status === "found" || state.status === "not-found"
        ? state.barcode
        : "manual";
    setScanHistory((prev) => [
      { id: item.id, barcode, name: name.trim(), saved: true },
      ...prev,
    ]);
    resetScanner();
  };

  const isScanning = state.status === "scanning";
  const hasResult = state.status === "found" || state.status === "not-found";
  const isLookingUp = state.status === "looking-up";

  return (
    <AppShell>
      <PageHeader
        title="Scan & Track"
        subtitle="Point your camera at a barcode or upload a photo."
        action={
          scanHistory.length > 0 ? (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-grocery/10 border border-grocery/20 text-xs font-semibold text-grocery">
              <Check className="size-3.5" /> {scanHistory.length} scanned
            </span>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner viewport */}
        <div className="relative aspect-square rounded-3xl overflow-hidden border border-meds/30 bg-black/60">
          {/* Hidden canvas for photo scanning */}
          <canvas ref={fileCanvasRef} className="hidden" />

          {/* Live video element — always in DOM so ZXing can attach */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover rounded-3xl"
            style={{ display: isScanning ? "block" : "none" }}
            muted
            playsInline
          />

          {/* Overlay when not actively scanning */}
          {!isScanning && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-10">
              {cameraError ? (
                <div className="text-center px-6">
                  <CameraOff className="size-12 mx-auto mb-4 text-danger/70" />
                  <p className="text-sm text-danger font-medium mb-2">Error</p>
                  <p className="text-xs text-muted-foreground max-w-xs">{cameraError}</p>
                </div>
              ) : isLookingUp ? (
                <div className="text-center">
                  <Loader2 className="size-10 mx-auto mb-3 text-meds animate-spin" />
                  <p className="text-sm text-meds font-medium">Looking up product…</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {state.status === "looking-up" && state.barcode}
                  </p>
                </div>
              ) : hasResult ? (
                <div className="text-center px-6">
                  {state.status === "found" ? (
                    <>
                      <div className="size-16 rounded-2xl bg-grocery/20 border border-grocery/30 grid place-items-center mx-auto mb-3">
                        <Check className="size-8 text-grocery" />
                      </div>
                      <p className="text-sm text-grocery font-semibold">Product Found!</p>
                    </>
                  ) : (
                    <>
                      <div className="size-16 rounded-2xl bg-warning/20 border border-warning/30 grid place-items-center mx-auto mb-3">
                        <PackageSearch className="size-8 text-warning" />
                      </div>
                      <p className="text-sm text-warning font-semibold">Not in database</p>
                      <p className="text-xs text-muted-foreground mt-1">Fill in details manually below</p>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    {(state.status === "found" || state.status === "not-found") ? state.barcode : ""}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="size-12 mx-auto mb-4 text-meds/50" />
                  <p className="text-sm text-muted-foreground">Tap "Live Camera" or "Photo" to begin</p>
                </div>
              )}
            </div>
          )}

          {/* Scanning crosshair overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative w-72 h-40">
                  {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((p, i) => (
                    <span
                      key={i}
                      className={`absolute ${p} size-10 border-meds`}
                      style={{
                        borderTopWidth: p.includes("top") ? 3 : 0,
                        borderBottomWidth: p.includes("bottom") ? 3 : 0,
                        borderLeftWidth: p.includes("left") ? 3 : 0,
                        borderRightWidth: p.includes("right") ? 3 : 0,
                      }}
                    />
                  ))}
                  <motion.div
                    animate={{ y: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-meds to-transparent shadow-[0_0_20px_rgba(59,130,246,0.7)]"
                  />
                </div>
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-meds font-mono uppercase tracking-widest">
                <span className="size-2 rounded-full bg-meds animate-pulse" />
                Live Scanner
              </div>
            </div>
          )}

          {/* Bottom controls — always visible */}
          <div className="absolute bottom-4 inset-x-4 flex gap-2 z-20">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
            {isScanning ? (
              <>
                <button
                  onClick={stopScanner}
                  className="flex-1 grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl bg-danger/80 text-white font-semibold text-sm"
                >
                  <X className="size-4" />
                  <span className="text-left">Stop Scanner</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 rounded-2xl glass-card text-foreground font-semibold text-sm flex items-center gap-2"
                >
                  <ImagePlus className="size-4" /> Photo
                </button>
              </>
            ) : !isLookingUp ? (
              <>
                <button
                  onClick={startScanner}
                  className="flex-1 grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl bg-foreground text-background font-semibold text-sm"
                >
                  <ScanLine className="size-4" />
                  <span className="text-left">{hasResult ? "Scan Another" : "Live Camera"}</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 rounded-2xl glass-card text-foreground font-semibold text-sm flex items-center gap-2"
                >
                  <ImagePlus className="size-4" /> Photo
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Result panel */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-bold text-beauty uppercase tracking-widest mb-3">
            {hasResult
              ? state.status === "found"
                ? "Product Detected"
                : "Manual Entry"
              : isLookingUp
                ? "Looking Up…"
                : "Awaiting Scan"}
          </p>

          {imageUrl && (
            <div className="mb-4 flex justify-center">
              <img
                src={imageUrl}
                alt={name}
                className="size-24 rounded-2xl object-cover border border-white/10 bg-white/5"
              />
            </div>
          )}

          <h3 className="font-display font-bold text-2xl mb-1">
            {hasResult ? name || "Unknown Product" : "Nothing yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {hasResult
              ? "Verify and complete the details below."
              : "Scanned product details will appear here."}
          </p>

          <div className="space-y-3">
            <FormField label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
                disabled={!hasResult}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-meds/60 disabled:opacity-40"
              />
            </FormField>
            <FormField label="Brand">
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand name"
                disabled={!hasResult}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-meds/60 disabled:opacity-40"
              />
            </FormField>
            <FormField label="Category">
              <div className="grid grid-cols-3 gap-2">
                {(["grocery", "meds", "beauty"] as Category[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={!hasResult}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 ${
                      category === c
                        ? `bg-${c}/15 text-${c} border-${c}/40`
                        : "bg-white/5 border-white/10 text-muted-foreground"
                    }`}
                  >
                    {c === "grocery" ? "Groceries" : c === "meds" ? "Medicines" : "Cosmetics"}
                  </button>
                ))}
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Quantity">
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500g"
                  disabled={!hasResult}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-meds/60 disabled:opacity-40"
                />
              </FormField>
              <FormField label="Expiry Date">
                <input
                  type="date"
                  value={expiresOn}
                  onChange={(e) => setExpiresOn(e.target.value)}
                  disabled={!hasResult}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-meds/60 disabled:opacity-40"
                />
              </FormField>
            </div>

            {hasResult && !expiresOn && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-warning/10 border border-warning/20 text-xs text-warning">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>Set an expiry date so SmartShelf can remind you before it expires.</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              disabled={!hasResult || !name.trim() || !expiresOn}
              onClick={saveItem}
              className="grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl bg-grocery text-white font-semibold text-sm disabled:opacity-40 hover:scale-[1.02] transition-transform"
            >
              <Check className="size-4" /> <span>Save Item</span>
            </button>
            <button
              onClick={resetScanner}
              disabled={state.status === "idle" || state.status === "scanning"}
              className="grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl glass-card text-foreground font-semibold text-sm disabled:opacity-40"
            >
              <RefreshCw className="size-4" /> <span>Reset</span>
            </button>
          </div>
          <Link
            to="/inventory"
            className="mt-3 w-full grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground font-semibold text-sm hover:bg-white/10"
          >
            <Plus className="size-4" /> <span>Add manually in Inventory</span>
          </Link>
        </div>
      </div>

      {/* Scan history */}
      <AnimatePresence>
        {scanHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Scan History</h2>
              <button
                onClick={() => setScanHistory([])}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Trash2 className="size-3" /> Clear
              </button>
            </div>
            <div className="space-y-2">
              {scanHistory.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
                >
                  <div className="size-10 rounded-xl bg-grocery/15 border border-grocery/30 grid place-items-center text-grocery">
                    <Check className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{entry.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{entry.barcode}</p>
                  </div>
                  <span className="text-xs font-semibold text-grocery bg-grocery/10 px-2.5 py-1 rounded-full">
                    Saved ✓
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
