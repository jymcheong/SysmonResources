
function Integer() {

}
/**
 * Returns the number of zero bits following the lowest-order ("rightmost")
 * one-bit in the two's complement binary representation of the specified
 * {@code int} value.  Returns 32 if the specified value has no
 * one-bits in its two's complement representation, in other words if it is
 * equal to zero.
 *
 * @return the number of zero bits following the lowest-order ("rightmost")
 *     one-bit in the two's complement binary representation of the
 *     specified {@code int} value, or 32 if the value is equal
 *     to zero.
 * @since 1.5
 */
Integer.numberOfTrailingZeros = function (i) {
  // HD, Figure 5-14
  var y;
  if (i == 0) return 32;
  var n = 31;
  y = i <<16; if (y != 0) { n = n -16; i = y; }
  y = i << 8; if (y != 0) { n = n - 8; i = y; }
  y = i << 4; if (y != 0) { n = n - 4; i = y; }
  y = i << 2; if (y != 0) { n = n - 2; i = y; }
  return n - ((i << 1) >>> 31);
}

Integer.numberOfLeadingZeros = function (i) {
  // HD, Figure 5-6
  if (i == 0)
    return 32;
  
  var n = 1;
  if (i >>> 16 == 0) { n += 16; i <<= 16; }
  if (i >>> 24 == 0) { n +=  8; i <<=  8; }
  if (i >>> 28 == 0) { n +=  4; i <<=  4; }
  if (i >>> 30 == 0) { n +=  2; i <<=  2; }
  n -= i >>> 31;

  return n;
}

Integer.bitCount = function (i) {
  // HD, Figure 5-2
  i = i - ((i >>> 1) & 0x55555555);
  i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
  i = (i + (i >>> 4)) & 0x0f0f0f0f;
  i = i + (i >>> 8);
  i = i + (i >>> 16);
  return i & 0x3f;
}

Integer.MIN_VALUE = 0x80000000;

Integer.MAX_VALUE = 0x7fffffff;

Integer.digits = [
  '0' , '1' , '2' , '3' , '4' , '5' ,
  '6' , '7' , '8' , '9' , 'a' , 'b' ,
  'c' , 'd' , 'e' , 'f' , 'g' , 'h' ,
  'i' , 'j' , 'k' , 'l' , 'm' , 'n' ,
  'o' , 'p' , 'q' , 'r' , 's' , 't' ,
  'u' , 'v' , 'w' , 'x' , 'y' , 'z'
]

module.exports = Integer;