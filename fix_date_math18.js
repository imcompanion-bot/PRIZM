const monthRate = 1.27; // using the generic rate if it falls back
// Wait! US conversions. The user's widget converts US projects if viewing in GBP.
// `effectiveCurrency === "GBP" && o === "US"` -> `displayAmount /= monthRate;`
// Dove US Pilot has office="United Kingdom" in the projects DB! So it WON'T get converted!
// BUT if Dove US Pilot is actually USD in the spreadsheet, and it's NOT getting converted by the widget because its office is United Kingdom, it will just show the USD number as GBP!

