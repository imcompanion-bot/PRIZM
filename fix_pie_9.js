// If cx and cy passed to `label` are percentages, we need to cast them or Recharts already parsed them into numbers (Recharts USUALLY resolves them to numbers before calling `label`).
// BUT, wait! Recharts DOES resolve them to numbers before calling `label` usually.
// Let's just fix it by ensuring we use numbers, or we can just use Recharts' built in `label` which is much easier!
// Recharts has `<RechartsPrimitive.Pie label={renderCustomizedLabel}>`
// We can ALSO use the built in `labelLine=true` and just use our custom component for the text.
// Wait! If I just log it? I can't easily.
// I will wrap `cx`, `cy`, `innerRadius`, `outerRadius` in `Number()` just in case they are strings, but usually they are resolved.
// Maybe `props.value` is undefined? No, `value` is what we pass.
// Let's wrap `cx`, `cy`, `innerRadius`, `outerRadius` in a safe conversion.
// If they are undefined, we can fallback.
