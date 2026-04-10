const fetch = global.fetch || require('node_fetch');

async function verifyExport() {
    try {
        // 1. Get total count
        console.log("Fetching total count...");
        const countRes = await fetch('http://127.0.0.1:3000/api/admin/students?limit=1');
        if (!countRes.ok) {
            const text = await countRes.text();
            throw new Error(`Count fetch failed: ${countRes.status} ${countRes.statusText} - ${text}`);
        }
        const countData = await countRes.json();
        const totalCount = countData.pagination?.total;
        console.log(`Total students: ${totalCount}`);

        if (!totalCount) {
            console.log("No students found to verify export against.");
            return;
        }

        // 2. Fetch export data
        console.log("Fetching export data...");
        const exportRes = await fetch('http://127.0.0.1:3000/api/admin/students?export=true');
        if (!exportRes.ok) {
            const text = await exportRes.text();
            throw new Error(`Export fetch failed: ${exportRes.status} ${exportRes.statusText} - ${text}`);
        }
        const exportData = await exportRes.json();
        // API returns object with data array
        const exportCount = exportData.data ? exportData.data.length : 0;
        console.log(`Exported students: ${exportCount}`);

        // 3. Verify
        if (exportCount === totalCount) {
            console.log("SUCCESS: Export count matches total count.");
        } else {
            console.error(`FAILURE: Export count (${exportCount}) does not match total count (${totalCount}).`);
            process.exit(1);
        }

    } catch (error) {
        console.error("Verification error:", error);
        process.exit(1);
    }
}

verifyExport();
