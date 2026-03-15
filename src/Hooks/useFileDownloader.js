import { useState } from "react";
import { downloadFile } from "../Utils/Utils";

export function useFileDownloader() {
    const [downloadingType, setDownloadingType] = useState(null); // 'xlsx' | 'pdf' | null

    const handleDownload = async (endpoint, type, params) => {
        try {
            setDownloadingType(type);
            await downloadFile(endpoint, type, params);
        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setDownloadingType(null);
        }
    };

    return {
        downloadingType,
        handleDownload,
    };
}
