// One other possibility: Recharts calculates `outerRadius` properly but `innerRadius` string fails?
// Let's just make sure innerRadius and outerRadius are actually passed down as numbers.
// Also, the screenshot still had NOTHING showing - not even the inner labels!
// This strongly points to `label` function throwing a silent error during render (crashing the `<Pie>` render silently).
// Or Recharts hiding labels when animating.
// We added `isAnimationActive={false}`. Let's see if that fixes it.
