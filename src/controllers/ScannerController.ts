import { Request, Response } from "express";

export class ScannerController {
    private static isDriverReady = false;

    /**
     * Simulates TWAIN/WIA driver discovery and handshake.
     */
    static async initializeHardware(req: Request, res: Response) {
        console.log("Backend: Hardware Bridge Handshake Initiated");

        // Simulate hardware latency
        await new Promise(resolve => setTimeout(resolve, 2000));

        this.isDriverReady = true;

        res.json({
            status: "READY",
            driver: "Kodak i5000 Series TWAIN",
            version: "v4.1.2.8",
            feederStatus: "OK",
            pagesLoaded: 12,
            message: "Hardware Bridge Established Successfully"
        });
    }

    /**
     * Simulates triggering a scan from the device.
     */
    static async triggerScan(req: Request, res: Response) {
        if (!this.isDriverReady) {
            return res.status(503).json({ message: "Hardware Bridge not initialized. Please connect scanner first." });
        }

        console.log("Backend: Triggering Multipage Batch Scan");

        res.json({
            batchId: `SCAN-BATCH-${Date.now()}`,
            message: "Starting multipage ingestion...",
            expectedPages: 5,
            throughput: "60 PPM"
        });
    }

    /**
     * Returns the current status of the hardware.
     */
    static async getStatus(req: Request, res: Response) {
        res.json({
            isReady: this.isDriverReady,
            feeder: this.isDriverReady ? "LOADED" : "OFFLINE",
            tray: "Tray 1 (Industrial Feed)"
        });
    }
}
