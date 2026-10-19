// Hmm... `innerRadius="40%"` was a string.
// `AnalysisTab.tsx` uses:
// `<Pie ... innerRadius={60} outerRadius={80} ...>`
// They use NUMBERS!
// If `ClientFinancialsWidget.tsx` passes `"40%"` to `innerRadius`, Recharts computes the pixel radius and passes that to the label function.
// Or maybe it passes `"40%"` string down to the label function??
// If it passes `"40%"` string down to the label function, `innerRadius + (outerRadius - innerRadius) * 0.7` will crash!
// "40%" - "65%" -> NaN.
// Then `xInside` -> NaN.
// Then `<text x={NaN} y={NaN}>` crashes React!
// And the entire label is stripped out!
// Let's change innerRadius to numeric just to be completely safe, or calculate it.
// Wait! `cx` and `cy` are ALSO strings! `"50%"`
// `<Pie cx="50%" cy="50%" ...>`
// If `cx` and `cy` are `"50%"`, then `cx + outerRadius` = `"50%" + NaN` -> NaN.
// Let's check `AnalysisTab.tsx`. Does it use `"50%"`?
