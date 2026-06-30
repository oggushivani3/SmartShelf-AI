import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  SwitchCamera,
  X,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
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

function Scan() {
  const navigate = useNavigate();
  const [state, setState] = useState<ScanState>({ status: "idle" });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScannedEntry[]>([]);

  // Form fields for the detected product
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<Category>("grocery");
  const [quantity, setQuantity] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  // Scanner refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "smartshelf-scanner";
  const isRunningRef = useRef(false);
  const [useFrontCamera, setUseFrontCamera] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore – may already be stopped
      }
      isRunningRef.current = false;
    }
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setState({ status: "scanning" });

    // Cleanup any existing instance
    await stopScanner();

    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: useFrontCamera ? "user" : "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          // Barcode detected!
          await stopScanner();
          setState({ status: "looking-up", barcode: decodedText });

          // Look up the product
          const product = await lookupBarcode(decodedText);
          if (product) {
            setState({ status: "found", barcode: decodedText, product });
            setName(product.name);
            setBrand(product.brand);
            setCategory(product.category);
            setQuantity(product.quantity || "");
            setImageUrl(product.imageUrl);
            setExpiresOn("");
          } else {
            setState({ status: "not-found", barcode: decodedText });
            setName("");
            setBrand("");
            setCategory("grocery");
            setQuantity("");
            setImageUrl(undefined);
            setExpiresOn("");
          }
        },
        () => {
          // QR error callback (nothing found yet) — intentionally silent
        },
      );
      isRunningRef.current = true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not access camera";
      if (
        msg.toLowerCase().includes("permission") ||
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("notallowed")
      ) {
        setCameraError(
          "Camera permission denied. Please allow camera access in your browser settings and reload.",
        );
      } else {
        setCameraError(msg);
      }
      setState({ status: "error", message: msg });
    }
  }, [stopScanner, useFrontCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // ignore
        }
      }
    };
  }, [stopScanner]);

  const resetScanner = () => {
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

  const toggleCamera = async () => {
    await stopScanner();
    setUseFrontCamera((prev) => !prev);
  };

  // Auto-restart scanner when camera direction changes while scanning
  useEffect(() => {
    if (state.status === "scanning" && !isRunningRef.current) {
      startScanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useFrontCamera]);

  const isScanning = state.status === "scanning";
  const hasResult =
    state.status === "found" || state.status === "not-found";
  const isLookingUp = state.status === "looking-up";

  return (
    <AppShell>
      <PageHeader
        title="Scan & Track"
        subtitle="Point your camera at any barcode or QR code."
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
          {/* Camera feed renders inside this div */}
          <div
            id={scannerContainerId}
            className="absolute inset-0 [&_video]:object-cover [&_video]:w-full [&_video]:h-full [&_video]:rounded-3xl"
          />

          {/* Overlay when not scanning */}
          {!isScanning && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-10">
              {cameraError ? (
                <div className="text-center px-6">
                  <CameraOff className="size-12 mx-auto mb-4 text-danger/70" />
                  <p className="text-sm text-danger font-medium mb-2">
                    Camera Error
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {cameraError}
                  </p>
                </div>
              ) : isLookingUp ? (
                <div className="text-center">
                  <Loader2 className="size-10 mx-auto mb-3 text-meds animate-spin" />
                  <p className="text-sm text-meds font-medium">
                    Looking up product…
                  </p>
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
                      <p className="text-sm text-grocery font-semibold">
                        Product Found!
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="size-16 rounded-2xl bg-warning/20 border border-warning/30 grid place-items-center mx-auto mb-3">
                        <PackageSearch className="size-8 text-warning" />
                      </div>
                      <p className="text-sm text-warning font-semibold">
                        Product not in database
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fill in the details manually below
                      </p>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    Barcode: {state.status === "found" || state.status === "not-found" ? state.barcode : ""}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="size-12 mx-auto mb-4 text-meds/50" />
                  <p className="text-sm text-muted-foreground">
                    Tap "Start Scanner" to begin
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Scanning overlay with animated frame */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute inset-0 grid place-items-center">
                <div className="relative size-56 sm:size-64">
                  {[
                    "top-0 left-0",
                    "top-0 right-0",
                    "bottom-0 left-0",
                    "bottom-0 right-0",
                  ].map((p, i) => (
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
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
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

          {/* Bottom controls */}
          <div className="absolute bottom-4 inset-x-4 flex gap-2 z-20">
            {!isScanning && !isLookingUp ? (
              <>
                <button
                  onClick={startScanner}
                  className="flex-1 grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl bg-foreground text-background font-semibold text-sm"
                >
                  <ScanLine className="size-4" />
                  <span className="text-left">
                    {hasResult ? "Scan Another" : "Start Scanner"}
                  </span>
                </button>
                <button
                  onClick={toggleCamera}
                  className="px-4 py-3 rounded-2xl glass-card text-foreground font-semibold text-sm"
                  title="Switch camera"
                >
                  <SwitchCamera className="size-4" />
                </button>
              </>
            ) : isScanning ? (
              <button
                onClick={stopScanner}
                className="flex-1 grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl bg-danger/80 text-white font-semibold text-sm"
              >
                <X className="size-4" />
                <span className="text-left">Stop Scanner</span>
              </button>
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

          {/* Product image if available */}
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

          {/* Editable form fields */}
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
                    {c === "grocery"
                      ? "Groceries"
                      : c === "meds"
                        ? "Medicines"
                        : "Cosmetics"}
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

            {/* Warning if no expiry set */}
            {hasResult && !expiresOn && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-warning/10 border border-warning/20 text-xs text-warning">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>
                  Set an expiry date so SmartShelf can remind you before it
                  expires.
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
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
              <h2 className="font-display font-semibold text-lg">
                Scan History
              </h2>
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
                    <p className="text-sm font-semibold truncate">
                      {entry.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {entry.barcode}
                    </p>
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

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
