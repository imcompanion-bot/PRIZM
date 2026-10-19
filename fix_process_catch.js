const fs = require('fs');

const file = 'src/components/settings/TimesheetsImport.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('try { // Wrap processCsvData')) {
    content = content.replace(
      "const processCsvData = async (lines: string[][], type: 'harvest' | 'float') => {",
      "const processCsvData = async (lines: string[][], type: 'harvest' | 'float') => {\n    try { // Wrap processCsvData"
    );
    content = content.replace(
      "importEntries.mutate({ entries, fromDate: earliestDate, toDate: latestDate, importType: type });\n  };",
      "importEntries.mutate({ entries, fromDate: earliestDate, toDate: latestDate, importType: type });\n    } catch (e: any) {\n      console.error(\"processCsvData Error:\", e);\n      toast.error(`Error processing CSV: ${e.message}`);\n      updateGlobalImportState(false, null);\n    }\n  };"
    );
    fs.writeFileSync(file, content);
}
