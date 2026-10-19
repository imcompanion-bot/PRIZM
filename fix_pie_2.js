// Wait! I noticed `overflow="visible"` as a prop instead of a style for ResponsiveContainer often helps.
// More importantly, `isAnimationActive={false}` in Pie. Recharts sometimes skips custom labels entirely if there's an animation glitch!
// Let's add `isAnimationActive={false}` to Pie.
