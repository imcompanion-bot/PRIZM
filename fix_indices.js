const fs = require('fs');
let code = fs.readFileSync('functions/src/syncCentralData.ts', 'utf8');

// I will just replace the exact block to be 100% sure.
const newBlock = `
        gp_fy20_21: parseNumber(row[150]),
        gp_fy21_22: parseNumber(row[151]),
        gp_fy22_23: parseNumber(row[152]),
        gp_fy23_24: parseNumber(row[178]),
        gp_fy24_25: parseNumber(row[201]),
        gp_fy25_26: parseNumber(row[251]),
        gp_fy26_27: parseNumber(row[260]),
        gp_q1_20_21: parseNumber(row[189]),
        gp_q2_20_21: parseNumber(row[190]),
        gp_q3_20_21: parseNumber(row[191]),
        gp_q4_20_21: parseNumber(row[192]),
        gp_q1_21_22: parseNumber(row[183]),
        gp_q2_21_22: parseNumber(row[184]),
        gp_q3_21_22: parseNumber(row[185]),
        gp_q4_21_22: parseNumber(row[186]),
        gp_q1_22_23: parseNumber(row[153]),
        gp_q2_22_23: parseNumber(row[154]),
        gp_q3_22_23: parseNumber(row[155]),
        gp_q4_22_23: parseNumber(row[156]),
        gp_q1_23_24: parseNumber(row[195]),
        gp_q2_23_24: parseNumber(row[196]),
        gp_q3_23_24: parseNumber(row[197]),
        gp_q4_23_24: parseNumber(row[198]),
        gp_q1_24_25: parseNumber(row[229]),
        gp_q2_24_25: parseNumber(row[230]),
        gp_q3_24_25: parseNumber(row[231]),
        gp_q4_24_25: parseNumber(row[232]),
        gp_q1_25_26: parseNumber(row[252]),
        gp_q2_25_26: parseNumber(row[253]),
        gp_q3_25_26: parseNumber(row[254]),
        gp_q4_25_26: parseNumber(row[255]),
        gp_q1_26_27: parseNumber(row[256]),
        gp_q2_26_27: parseNumber(row[257]),
        gp_q3_26_27: parseNumber(row[258]),
        gp_q4_26_27: parseNumber(row[259])
`;

const regex = /gp_fy20_21:\s*parseNumber\(row\[\d+\]\),[\s\S]*?gp_q4_26_27:\s*parseNumber\(row\[\d+\]\),*,/g;
if (code.match(regex)) {
  code = code.replace(regex, newBlock.trim());
  fs.writeFileSync('functions/src/syncCentralData.ts', code);
  console.log('Replaced successfully!');
} else {
  console.log('Regex did not match!');
}
