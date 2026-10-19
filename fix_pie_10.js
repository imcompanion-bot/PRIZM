// If I changed the code in the file, and deployed it to live, they might still be looking at an old cached version. 
// However, the issue earlier was clearly a math exception!
// `(value / displayData.totalValue) >= 0.02` was the check, but then I did:
// `cx = Number(cx) || 150`
// `cy = Number(cy) || 150`
// This fix is in the live deployment now. I will let them know.
