import React, { useState, useEffect } from "react";

const FileViewer = ({ filePath }) => {
    const data = [
        {
            "relation": [
                "delegate_permission/common.handle_all_urls"
            ],
            "target": {
                "namespace": "android_app",
                "package_name": "com.mihnea.busifyandroid",
                "sha256_cert_fingerprints": [
                    "BC:C9:91:89:CC:75:A1:CF:39:66:1A:B6:24:7B:53:46:E9:34:77:27:37:CE:7B:A4:72:F2:03:3E:BE:33:95:15"
                ]
            }
        }
    ]

    return (
        <div>
            {JSON.stringify(data, null, 2)}
        </div>
    );
};

export default FileViewer;
