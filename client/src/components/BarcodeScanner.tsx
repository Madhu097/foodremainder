import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerDivRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        startScanner();
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        try {
            setError(null);
            setIsScanning(true);

            // Create scanner instance
            const scanner = new Html5Qrcode("barcode-reader");
            scannerRef.current = scanner;

            // Start scanning
            await scanner.start(
                { facingMode: "environment" }, // Use back camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    // Success callback
                    onScan(decodedText);
                    stopScanner();
                },
                (errorMessage) => {
                    // Error callback (can be ignored for continuous scanning)
                    // console.log("Scan error:", errorMessage);
                }
            );
        } catch (err) {
            console.error("Error starting scanner:", err);
            setError("Failed to access camera. Please ensure camera permissions are granted.");
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                scannerRef.current = null;
            } catch (err) {
                console.error("Error stopping scanner:", err);
            }
        }
        setIsScanning(false);
    };

    const handleClose = async () => {
        await stopScanner();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            {/* Header */}
            <div className="bg-background/95 backdrop-blur border-b p-4 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Scan Barcode</h2>
                    <p className="text-sm text-muted-foreground">
                        Position the barcode within the frame
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="rounded-full"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="relative max-w-md w-full">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div
                        id="barcode-reader"
                        ref={scannerDivRef}
                        className="rounded-lg overflow-hidden shadow-2xl"
                    />

                    {isScanning && (
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Scanning overlay */}
                            <div className="absolute inset-0 border-2 border-primary/50 rounded-lg">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-background/95 backdrop-blur border-t p-4">
                <div className="max-w-md mx-auto space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Camera className="h-4 w-4 text-primary" />
                        <span>Hold your device steady and align the barcode</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                        <span>The scanner will automatically detect the barcode</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
