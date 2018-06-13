var Integer = require('./Integer');

// shifts a up to len left n bits assumes no leading zeros, 0<=n<32
// int[] a, int len, int n
exports.primitiveLeftShift =  function (a, len, n) {
  if (len == 0 || n == 0)
    return;
  var n2 = 32 - n;
  for (var i=0, c=a[i], m=i+len-1; i<m; i++) {
    var b = c;
    c = a[i+1];
    a[i] = (b << n) | (c >>> n2);
  }
  a[len-1] <<= n;
}

var bitLengthForInt = exports.bitLengthForInt = function (i) {
  return 32 - Integer.numberOfLeadingZeros(i);
}

/**
 * Calculate bitlength of contents of the first len elements an int array,
 * assuming there are no leading zero ints.
 */ 
exports.bitLength = function (val, len) {
  if (len == 0)
    return 0;
  return ((len - 1) << 5) + bitLengthForInt(val[0]);
}
