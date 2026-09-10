function formatCurrencyCompact(amount, currencyOrOffice = "UK") {
  const currencyMap = {
    GBP: { locale: "en-GB", currency: "GBP" },
    USD: { locale: "en-US", currency: "USD" },
    EUR: { locale: "en-IE", currency: "EUR" },
    UK: { locale: "en-GB", currency: "GBP" },
    US: { locale: "en-US", currency: "USD" },
  };
  const cfg = currencyMap[currencyOrOffice.toUpperCase()] ?? currencyMap.GBP;
  
  const absAmount = Math.abs(amount);
  if (absAmount >= 100000) {
    const formatter = new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: cfg.currency,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return formatter.format(amount / 1000000) + "m";
  } else if (absAmount >= 1000) {
    const formatter = new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: cfg.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(amount / 1000) + "k";
  } else {
    return new Intl.NumberFormat(cfg.locale, {
      style: "currency",
      currency: cfg.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
console.log(formatCurrencyCompact(3333157, 'USD'));
