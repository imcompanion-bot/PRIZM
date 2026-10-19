const projSums = {
  'Dove UK - Hair Execution': 8591.145776,
  "Hellmann's Production Shoot (Nov. 2025)": 951.09019609,
  'Unilever Foods Global RFP': -625.8299999999999, 
  "Unilever - Hellmann's Ranch Launch [Execution]": 149.94063999,
  'Dove US Pilot - Dauphine & Diptique Awareness 2025': 1856.798994,
  "Unilever - Hellmann's Sandwich & BBQ 2025": 5796.3953489,
  'Rexona: Football Partnerships': 75.68530608,
  'Unilever Food Global Toolkit': -28.976865671,
  "Hellmann's Workshop": -1068.8610460999998, 
  "Unilever - Hellmann's Big Simon Content": 200,
  'Dove UK - Skincare': 8489.922355,
  "Hellmann's Sweet Sandwich Time - Summer 2026": 1530.339623,
  'Unilever - Marmite Pride 2025': 189.8,
  'Dove Jarvis Pulse [Creative Development only]': -9
};

const monthRate = 1.28;
let finalSum = 0;
for (const [name, amount] of Object.entries(projSums)) {
   let display = amount;
   // In the widget, for effectiveCurrency="GBP", US projects are divided by monthRate
   // Dove US Pilot is office="United Kingdom" in my dump! Oh. Wait.
   // Wait, if Dove US Pilot is office="United Kingdom", it doesn't get converted!
   // So it stays as GBP.
   finalSum += display;
}
console.log(finalSum);
