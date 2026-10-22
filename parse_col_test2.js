for (let i = 210; i <= 230; i++) {
  console.log(i, 'is column', String.fromCharCode(65 + Math.floor(i/26) - 1) + String.fromCharCode(65 + i%26));
}
