// Column FC is 158. B=1, C=2... so A=0, B=1. B5:ZZ.
// If range is B5:ZZ, row[0] is col B.
// Col A = 0
// Col B = 1
// Col C = 2
// ...
// Col FC = 158. Since row starts at B (1), FC is 158 - 1 = 157.
// Col FD = 159. Since row starts at B (1), FD is 159 - 1 = 158.
// Col HE = 212. Since row starts at B (1), HE is 212 - 1 = 211.
console.log('FC', 158-1);
console.log('FD', 159-1);
console.log('HE', 212-1);
