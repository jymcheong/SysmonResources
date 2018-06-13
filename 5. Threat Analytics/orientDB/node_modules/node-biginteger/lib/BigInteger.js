/**
 * Immutable arbitrary-precision integers.  All operations behave as if
 * BigIntegers were represented in two's-complement notation (like Java's
 * primitive integer types).  BigInteger provides analogues to all of Java's
 * primitive integer operators, and all relevant methods from java.lang.Math.
 * Additionally, BigInteger provides operations for modular arithmetic, GCD
 * calculation, primality testing, prime generation, bit manipulation,
 * and a few other miscellaneous operations.
 *
 * <p>Semantics of arithmetic operations exactly mimic those of Java's integer
 * arithmetic operators, as defined in <i>The Java Language Specification</i>.
 * For example, division by zero throws an {@code ArithmeticException}, and
 * division of a negative by a positive yields a negative (or zero) remainder.
 * All of the details in the Spec concerning overflow are ignored, as
 * BigIntegers are made as large as necessary to accommodate the results of an
 * operation.
 *
 * <p>Semantics of shift operations extend those of Java's shift operators
 * to allow for negative shift distances.  A right-shift with a negative
 * shift distance results in a left shift, and vice-versa.  The unsigned
 * right shift operator ({@code >>>}) is omitted, as this operation makes
 * little sense in combination with the "infinite word size" abstraction
 * provided by this class.
 *
 * <p>Semantics of bitwise logical operations exactly mimic those of Java's
 * bitwise integer operators.  The binary operators ({@code and},
 * {@code or}, {@code xor}) implicitly perform sign extension on the shorter
 * of the two operands prior to performing the operation.
 *
 * <p>Comparison operations perform signed integer comparisons, analogous to
 * those performed by Java's relational and equality operators.
 *
 * <p>Modular arithmetic operations are provided to compute residues, perform
 * exponentiation, and compute multiplicative inverses.  These methods always
 * return a non-negative result, between {@code 0} and {@code (modulus - 1)},
 * inclusive.
 *
 * <p>Bit operations operate on a single bit of the two's-complement
 * representation of their operand.  If necessary, the operand is sign-
 * extended so that it contains the designated bit.  None of the single-bit
 * operations can produce a BigInteger with a different sign from the
 * BigInteger being operated on, as they affect only a single bit, and the
 * "infinite word size" abstraction provided by this class ensures that there
 * are infinitely many "virtual sign bits" preceding each BigInteger.
 *
 * <p>For the sake of brevity and clarity, pseudo-code is used throughout the
 * descriptions of BigInteger methods.  The pseudo-code expression
 * {@code (i + j)} is shorthand for "a BigInteger whose value is
 * that of the BigInteger {@code i} plus that of the BigInteger {@code j}."
 * The pseudo-code expression {@code (i == j)} is shorthand for
 * "{@code true} if and only if the BigInteger {@code i} represents the same
 * value as the BigInteger {@code j}."  Other pseudo-code expressions are
 * interpreted similarly.
 *
 * <p>All methods and constructors in this class throw
 * {@code NullPointerException} when passed
 * a null object reference for any input parameter.
 *
 * @see     BigDecimal
 * @author  Josh Bloch
 * @author  Michael McCloskey
 * @since JDK1.1
 */
var Long = require('long');
var Integer = require('./Integer');
var Common = require('./common');
var MutableBigInteger = require('./MutableBigInteger');
var BigIntegerLib = require('./BigIntegerLib');
var clone = require('clone');

var MIN_RADIX = 2;
var MAX_RADIX = 36;

var bitsPerDigit = [ 0, 0,
  1024, 1624, 2048, 2378, 2648, 2875, 3072, 3247, 3402, 3543, 3672,
  3790, 3899, 4001, 4096, 4186, 4271, 4350, 4426, 4498, 4567, 4633,
  4696, 4756, 4814, 4870, 4923, 4975, 5025, 5074, 5120, 5166, 5210,
  5253, 5295
];

var digitsPerInt = [0, 0, 30, 19, 15, 13, 11,
  11, 10, 9, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5
];
var digitsPerLong = [0, 0,
  62, 39, 31, 27, 24, 22, 20, 19, 18, 18, 17, 17, 16, 16, 15, 15, 15, 14,
  14, 14, 14, 13, 13, 13, 13, 13, 13, 12, 12, 12, 12, 12, 12, 12, 12];

var intRadix = [0, 0,
  0x40000000, 0x4546b3db, 0x40000000, 0x48c27395, 0x159fd800,
  0x75db9c97, 0x40000000, 0x17179149, 0x3b9aca00, 0xcc6db61,
  0x19a10000, 0x309f1021, 0x57f6c100, 0xa2f1b6f,  0x10000000,
  0x18754571, 0x247dbc80, 0x3547667b, 0x4c4b4000, 0x6b5a6e1d,
  0x6c20a40,  0x8d2d931,  0xb640000,  0xe8d4a51,  0x1269ae40,
  0x17179149, 0x1cb91000, 0x23744899, 0x2b73a840, 0x34e63b41,
  0x40000000, 0x4cfa3cc1, 0x5c13d840, 0x6d91b519, 0x39aa400
];

var LONG_MASK = 0xffffffff;
var MAX_CONSTANT = 16;

var longRadix = [null, null,
  Long.fromString('4000000000000000',16), Long.fromString('383d9170b85ff80b',16),
  Long.fromString('4000000000000000',16), Long.fromString('6765c793fa10079d',16),
  Long.fromString('41c21cb8e1000000',16), Long.fromString('3642798750226111',16),
  Long.fromString('1000000000000000',16), Long.fromString('12bf307ae81ffd59',16),
  Long.fromString( 'de0b6b3a7640000',16), Long.fromString('4d28cb56c33fa539',16),
  Long.fromString('1eca170c00000000',16), Long.fromString('780c7372621bd74d',16),
  Long.fromString('1e39a5057d810000',16), Long.fromString('5b27ac993df97701',16),
  Long.fromString('1000000000000000',16), Long.fromString('27b95e997e21d9f1',16),
  Long.fromString('5da0e1e53c5c8000',16), Long.fromString( 'b16a458ef403f19',16),
  Long.fromString('16bcc41e90000000',16), Long.fromString('2d04b7fdd9c0ef49',16),
  Long.fromString('5658597bcaa24000',16), Long.fromString( '6feb266931a75b7',16),
  Long.fromString( 'c29e98000000000',16), Long.fromString('14adf4b7320334b9',16),
  Long.fromString('226ed36478bfa000',16), Long.fromString('383d9170b85ff80b',16),
  Long.fromString('5a3c23e39c000000',16), Long.fromString( '4e900abb53e6b71',16),
  Long.fromString( '7600ec618141000',16), Long.fromString( 'aee5720ee830681',16),
  Long.fromString('1000000000000000',16), Long.fromString('172588ad4f5f0981',16),
  Long.fromString('211e44f7d02c1000',16), Long.fromString('2ee56725f06e5c71',16),
  Long.fromString('41c21cb8e1000000',16)
];

/* zero[i] is a string of i consecutive zeros. */
var zeros = Common.intArray(64);
zeros[63] = "000000000000000000000000000000000000000000000000000000000000000";
for (var i = 0; i < 63; i++)
  zeros[i] = zeros[63].substring(0, i);


function BigInteger() {
  this.signum;
  this.mag;
  this._bitLength = 0;
  this.bitCount = 0;
  this.firstNonzeroIntNum = 0;
  this.lowestSetBit = 0;
}

/**
 * Translates a byte array containing the two's-complement binary
 * representation of a BigInteger into a BigInteger.  The input array is
 * assumed to be in <i>big-endian</i> byte-order: the most significant
 * byte is in the zeroth element.
 *
 * @param  val big-endian two's-complement binary representation of
 *         BigInteger.
 * @throws NumberFormatException {@code val} is zero bytes long.
 */
BigInteger.fromBuffer = function (signum, magnitude) {
  var _bigInteger = new BigInteger();
  _bigInteger.mag = _bigInteger._stripLeadingZeroBytes(magnitude);

  if (signum < -1 || signum > 1)
    throw new Error("Invalid signum value");

  if (_bigInteger.mag.length==0) {
    _bigInteger.signum = 0;
  } else {
    if (signum == 0)
      throw new Error("signum-magnitude mismatch");
    _bigInteger.signum = signum;
  }
  return _bigInteger;
};

BigInteger.fromLong = function (val) {
  var _bigInteger = new BigInteger();
  if (val.compare(Long.ZERO) < 0) {
    val = val.negate();
    _bigInteger.signum = -1;
  } else {
    _bigInteger.signum = 1;
  }

  if (val.high === 0) {
    _bigInteger.mag = Common.intArray(1);
    _bigInteger.mag[0] = val.low;
  } else {
    _bigInteger.mag = Common.intArray(2);
    _bigInteger.mag[0] = val.high;
    _bigInteger.mag[1] = val.low;
  }
  return _bigInteger;
};

/**
 * Translates the String representation of a BigInteger in the
 * specified radix into a BigInteger.  The String representation
 * consists of an optional minus or plus sign followed by a
 * sequence of one or more digits in the specified radix.  The
 * character-to-digit mapping is provided by {@code
 * Character.digit}.  The String may not contain any extraneous
 * characters (whitespace, for example).
 *
 * @param val String representation of BigInteger.
 * @param radix radix to be used in interpreting {@code val}.
 * @throws NumberFormatException {@code val} is not a valid representation
 *         of a BigInteger in the specified radix, or {@code radix} is
 *         outside the range from {@link Character#MIN_RADIX} to
 *         {@link Character#MAX_RADIX}, inclusive.
 * @see    Character#digit
 */
BigInteger.fromString = function (val, radix) {
  radix = radix || 10;
  var cursor = 0;
  var numDigits;
  var len = val.length;
  if (radix < MIN_RADIX || radix > MAX_RADIX) {
    throw new Error('Radix out of range');
  }
  if (len === 0) {
    throw new Error("Zero length BigInteger");
  }
  var sign = 1;
  var index1 = val.lastIndexOf('-');
  var index2 = val.lastIndexOf('+');
  if ((index1 + index2) <= -1) {
    if (index1 === 0 || index2 === 0) {
      cursor = 1;
      if (len === 1) {
        throw new Error("Zero length BigInteger");
      }
    }
    if (index1 === 0) {
      sign = -1;
    }
  } else {
    throw new Error("Illegal embedded sign character");
  }
  var _bigInteger = new BigInteger();
  /*跳过前导的0，如果全部是0，直接储存ZERO.mag*/
  // Skip leading zeros and compute number of digits in magnitude
  while (cursor < len && parseInt(val.substring(cursor + 1, 1), radix) === 0) {
    cursor++;
  }
  if (cursor === len) {
    // _bigInteger.signum = 0;
    // _bigInteger.mag = new Buffer([0]);
    return ZERO;
  }
  numDigits = len - cursor;
  _bigInteger.signum = sign;
  // Pre-allocate array of expected size. May be too large but can
  // never be too small. Typically exact.
  var numBits = parseInt(((numDigits * bitsPerDigit[radix]) >>> 10) + 1, 10);
  var numWords = (numBits + 31) >>> 5;
  // 存储转换后的数字
  var magnitude = Common.intArray(numWords);
  // for (var i = 0; i < numWords; i++)
    // magnitude[i] = 0;

  var firstGroupLen = numDigits % digitsPerInt[radix];
  if (firstGroupLen === 0)
    firstGroupLen = digitsPerInt[radix];

  var group = val.substring(cursor, cursor += firstGroupLen);
  
  magnitude[numWords - 1] = parseInt(group, radix);
  if (magnitude[numWords - 1] < 0)
    throw new Error("Illegal digit");

  // Process remaining digit groups
  var superRadix = intRadix[radix];
  var groupVal = 0;
  while (cursor < len) {
      group = val.substring(cursor, cursor += digitsPerInt[radix]);
      groupVal = parseInt(group, radix);

      if (groupVal < 0)
          throw new Error("Illegal digit");
      _bigInteger._destructiveMulAdd(magnitude, superRadix, groupVal);
  }
  
  _bigInteger.mag = trustedStripLeadingZeroInts(magnitude);
  return _bigInteger;
};

/**
 * Returns a copy of the input array stripped of any leading zero bytes.
 */
BigInteger.prototype._stripLeadingZeroBytes = function (a) {
  var byteLength = a.length;
  var keep;

  // Find first nonzero byte
  for (keep = 0; keep < byteLength && a[keep] === 0; keep++)
      ;

  // Allocate new array and copy relevant part of input array
  var intLength = ((byteLength - keep) + 3) >>> 2;
  var result = Common.intArray(intLength);
  var b = byteLength - 1;
  for (var i = intLength-1; i >= 0; i--) {
    result[i] = a[b--] & 0xff;
    var bytesRemaining = b - keep + 1;
    var bytesToTransfer = Math.min(3, bytesRemaining);
    for (var j=8; j <= (bytesToTransfer << 3); j += 8)
      result[i] |= ((a[b--] & 0xff) << j);
  }
  return result;
}

// Multiply x array times word y in place, and add word z
BigInteger.prototype._destructiveMulAdd = function (x, y, z) {
  // Perform the multiplication word by word
  var ylong = Long.fromNumber(y >>> 32);
  var zlong = z >>> 32;
  var len = x.length;
  var product = Long.ZERO;
  var carry = 0;
  for (var i = len-1; i >= 0; i--) {
    
    product = ylong.multiply( Long.fromNumber(x[i] >>> 32) ).add(Long.fromInt(carry));
    x[i] = product.low;
    carry = product.high;
  }
  // Perform the addition
  var sum = (x[len - 1] >>> 32) + zlong;
  sum = Long.fromNumber(sum);
  x[len-1] = sum.low;
  carry = sum.high;
  for (var i = len - 2 ; i >= 0; i--) {
    sum = Long.fromNumber((x[i] >>> 32) + carry);
    x[i] = sum.low;
    carry = sum.high;
  }

};

function trustedStripLeadingZeroInts(val) {
  var vlen = val.length;
  var keep;
  // Find first nonzero byte
  for (keep = 0; keep < vlen && val[keep] == 0; keep++)
      ;
  return keep == 0 ? val : Common.copyOfRange(val, keep, vlen);
};

/**
 * Returns the number of bits in the minimal two's-complement
 * representation of this BigInteger, <i>excluding</i> a sign bit.
 * For positive BigIntegers, this is equivalent to the number of bits in
 * the ordinary binary representation.  (Computes
 * {@code (ceil(log2(this < 0 ? -this : this+1)))}.)
 *
 * @return number of bits in the minimal two's-complement
 *         representation of this BigInteger, <i>excluding</i> a sign bit.
 */
BigInteger.prototype.bitLength = function () {
  var n = this._bitLength - 1;
  if (n == -1) { // bitLength not initialized yet
    var m = this.mag;
    var len = m.length;
    if (len == 0) {
      n = 0; // offset by one to initialize
    }  else {
      // Calculate the bit length of the magnitude
      var magBitLength = ((len - 1) << 5) + BigIntegerLib.bitLengthForInt(this.mag[0]);
       if (this.signum < 0) {
           // Check if magnitude is a power of two
           var pow2 = (Integer.bitCount(this.mag[0]) == 1);
           for(var i=1; i< len && pow2; i++)
               pow2 = (this.mag[i] == 0);

           n = (pow2 ? magBitLength -1 : magBitLength);
       } else {
           n = magBitLength;
       }
    }
    this._bitLength = n + 1;
  }
  return n;
}

/**
 * Returns a byte array containing the two's-complement
 * representation of this BigInteger.  The byte array will be in
 * <i>big-endian</i> byte-order: the most significant byte is in
 * the zeroth element.  The array will contain the minimum number
 * of bytes required to represent this BigInteger, including at
 * least one sign bit, which is {@code (ceil((this.bitLength() +
 * 1)/8))}.  (This representation is compatible with the
 * {@link #BigInteger(byte[]) (byte[])} constructor.)
 *
 * @return a byte array containing the two's-complement representation of
 *         this BigInteger.
 * @see    #BigInteger(byte[])
 */
BigInteger.prototype.toBuffer = function () {
  var byteLen = parseInt(this.bitLength() / 8, 10) + 1;
  var byteArray = new Buffer(byteLen);
  byteArray.fill(0xff);

  for (var i = byteLen - 1, bytesCopied = 4, nextInt = 0, intIndex = 0; i >= 0; i--) {
    if (bytesCopied == 4) {
        nextInt = this._getInt(intIndex++);
        bytesCopied = 1;
    } else {
        nextInt >>>= 8;
        bytesCopied++;
    }
    byteArray[i] = nextInt;
  }
  return byteArray;
}

/**
 * Returns a BigInteger whose value is the absolute value of this
 * BigInteger.
 *
 * @return {@code abs(this)}
 */
BigInteger.prototype.abs = function () {
  return this.signum >= 0 ? this : this.negate();
};

/**
 * Returns a BigInteger whose value is {@code (-this)}.
 *
 * @return {@code -this}
 */
BigInteger.prototype.negate = function () {
  return BigInteger.fromMag(this.mag, -this.signum);
};

/**
* Returns a copy of the input array stripped of any leading zero bytes.
*/
function stripLeadingZeroInts(val) {
  var vlen = val.length;
  var keep;
  // Find first nonzero byte
  for (keep = 0; keep < vlen && val[keep] == 0; keep++)
      ;
  return Common.copyOfRange(val, keep, vlen);
}

function _fromMag(signum, magnitude) {
  var _bigInteger = new BigInteger();
  _bigInteger.mag = stripLeadingZeroInts(magnitude);

  if (signum < -1 || signum > 1)
      throw(new Error("Invalid signum value"));

  if (_bigInteger.mag.length==0) {
      _bigInteger.signum = 0;
  } else {
      if (signum == 0)
          throw(new Error("signum-magnitude mismatch"));
      _bigInteger.signum = signum;
  }
  return _bigInteger;
};

BigInteger.fromMag = function (magnitude, signum) {
  
  var _bigInteger = new BigInteger();

  if (typeof signum === 'undefined') {
    // @see BigInteger(int[] val) 
    if (magnitude.length == 0)
      throw new Error("Zero length BigInteger");

    if (magnitude[0] < 0) {
      _bigInteger.mag = makePositive(magnitude);
      _bigInteger.signum = -1;
    } else {
      _bigInteger.mag = trustedStripLeadingZeroInts(magnitude);
      _bigInteger.signum = _bigInteger.length === 0 ? 0 : 1
    }

  } else {
    // @see BigInteger(int[] magnitude, int signum)    
    _bigInteger.signum = (magnitude.length === 0 ? 0 : signum);
    _bigInteger.mag = magnitude;
    
  }

  return _bigInteger;  
  
};

/* Returns an int of sign bits */
BigInteger.prototype._signInt = function () {
  return this.signum < 0 ? -1 : 0;
}

/**
 * Returns the index of the int that contains the first nonzero int in the
 * little-endian binary representation of the magnitude (int 0 is the
 * least significant). If the magnitude is zero, return value is undefined.
 */
BigInteger.prototype._firstNonzeroIntNum = function () {
 var fn = this.firstNonzeroIntNum - 2;
 if (fn == -2) { // firstNonzeroIntNum not initialized yet
   fn = 0;

   // Search for the first nonzero int
   var i;
   var mlen = this.mag.length;
   for (i = mlen - 1; i >= 0 && this.mag[i] == 0; i--)
       ;
   fn = mlen - i - 1;
   this.firstNonzeroIntNum = fn + 2; // offset by two to initialize
 }
 return fn;
}

/**
 * Returns the specified int of the little-endian two's complement
 * representation (int 0 is the least significant).  The int number can
 * be arbitrarily high (values are logically preceded by infinitely many
 * sign ints).
 */
BigInteger.prototype._getInt = function (n) {
  if (n < 0)
    return 0;
  if (n >= this.mag.length)
    return this._signInt();

  var magInt = this.mag[this.mag.length - n - 1];

  return (this.signum >= 0 ? magInt : (n <= this._firstNonzeroIntNum() ? -magInt : ~magInt));
}

/**
 * Right shift this MutableBigInteger n bits, where n is
 * less than 32.
 * Assumes that intLen > 0, n > 0 for speed
 */
function primitiveRightShift(n) {
  // int[]
  var val = this.value;
  var n2 = 32 - n;
  for (var i = offset + intLen - 1, c = val[i]; i > offset; i--) {
    var b = c;
    c = val[i - 1];
    val[i] = (c << n2) | (b >>> n);
  }
  val[offset] >>>= n;
}

/**
 * Converts this BigInteger to a {@code long}.  This
 * conversion is analogous to a
 * <i>narrowing primitive conversion</i> from {@code long} to
 * {@code int} as defined in section 5.1.3 of
 * <cite>The Java&trade; Language Specification</cite>:
 * if this BigInteger is too big to fit in a
 * {@code long}, only the low-order 64 bits are returned.
 * Note that this conversion can lose information about the
 * overall magnitude of the BigInteger value as well as return a
 * result with the opposite sign.
 *
 * @return this BigInteger converted to a {@code long}.
 */
BigInteger.prototype.longValue = function () {
  var result = Long.ZERO;
  for (var i = 1; i >= 0; i--) {
    result = result.shiftLeft(32).add(Long.fromNumber(this._getInt(i) >>> 32));
  }
  return result;
  // return new Long(this._getInt(0), this._getInt(1), false); 
}

BigInteger.fromMutableBigInteger = function (mb, sign) {
  if (mb.intLen === 0 || sign === 0) {
    return ZERO;
  }
  return BigInteger.fromMag(mb.getMagnitudeArray(), sign);
}

BigInteger.prototype.toString = function (radix) {
  if (!radix) {
    radix = 10;
  }

  if (this.signum == 0)
    return "0";
  if (radix < MIN_RADIX || radix > MAX_RADIX)
    radix = 10;

  // Compute upper bound on number of digit groups and allocate space
  var maxNumDigitGroups = parseInt((4 * this.mag.length + 6) / 7);
  // String
  var digitGroup = Common.intArray(maxNumDigitGroups);
  // var MutableBigInteger = require('./MutableBigInteger');
  // Translate number to string, a digit group at a time
  var tmp = this.abs();
  var numGroups = 0;
  while (tmp.signum != 0) {
    var d = BigInteger.fromLong(longRadix[radix]);
    var q = new MutableBigInteger();
    var a = new MutableBigInteger(tmp.mag);
    var b = new MutableBigInteger(d.mag);
    var r = a.divide(b, q);
    var q2 = BigInteger.fromMutableBigInteger(q, tmp.signum * d.signum);
    var r2 = BigInteger.fromMutableBigInteger(r, tmp.signum * d.signum);
    digitGroup[numGroups++] = Common.longString(r2.longValue(), radix);
    tmp = q2;
  }

  // Put sign (if any) and first digit group into result buffer
  // var buf = new StringBuilder(numGroups*digitsPerLong[radix]+1);
  var buf = [];
  if (this.signum < 0)
    buf.push('-');
  buf.push(digitGroup[numGroups-1]);

  // Append remaining digit groups padded with leading zeros
  for (var i = numGroups - 2; i >= 0; i--) {
    // Prepend (any) leading zeros for this digit group
    var numLeadingZeros = digitsPerLong[radix]-digitGroup[i].length;
    if (numLeadingZeros != 0)
        buf.push(zeros[numLeadingZeros]);
    buf.push(digitGroup[i]);
  }
  
  return buf.join('');
}

/**
 * Adds the contents of the int arrays x and y. This method allocates
 * a new int array to hold the answer and returns a reference to that
 * array.
 */
function add(x, y) {
  // If x is shorter, swap the two arrays
  if (x.length < y.length) {
    var tmp = x;
    x = y;
    y = tmp;
  }

  var xIndex = x.length;
  var yIndex = y.length;
  var result = Common.intArray(xIndex);
  // long
  var sum = Long.ZERO;

  // Add common parts of both numbers
  while(yIndex > 0) {
    // sum = (x[--xIndex] & LONG_MASK) + (y[--yIndex] & LONG_MASK) + (sum >>> 32);
    sum = Long.fromNumber(x[--xIndex] >>> 32).add(Long.fromNumber(y[--yIndex] >>> 32)).add(sum.shiftRight(32));
    // result[xIndex] = (int)sum;
    result[xIndex] = sum.low;
  }

  // Copy remainder of longer number while carry propagation is required
  var carry = (sum.shiftRight(32).toNumber() != 0);
  while (xIndex > 0 && carry)
    carry = ((result[--xIndex] = x[xIndex] + 1) == 0);

  // Copy remainder of longer number
  while (xIndex > 0)
    result[--xIndex] = x[xIndex];

  // Grow result if necessary
  if (carry) {
    var bigger = Common.intArray(result.length + 1);
    Common.arraycopy(result, 0, bigger, 1, result.length);
    bigger[0] = 0x01;
    return bigger;
  }
  return result;
}

/**  
 * Subtracts the contents of the second int arrays (little) from the
 * first (big).  The first int array (big) must represent a larger number
 * than the second.  This method allocates the space necessary to hold the
 * answer.
 */
function subtract(big, little) {
  var bigIndex = big.length;
  var result = Common.intArray(bigIndex);
  var littleIndex = little.length;
  // long
  var difference = Long.ZERO;

  // Subtract common parts of both numbers
  while(littleIndex > 0) {
    difference = Long.fromNumber(big[--bigIndex] >>> 32).subtract(Long.fromNumber(little[--littleIndex] >>> 32)).add(difference.shiftRight(32));
    result[bigIndex] = difference.low;
  }

  // Subtract remainder of longer number while borrow propagates
  var borrow = (difference.shiftRight(32).toNumber() != 0);
  while (bigIndex > 0 && borrow)
    borrow = ((result[--bigIndex] = big[bigIndex] - 1) == -1);

  // Copy remainder of longer number
  while (bigIndex > 0)
    result[--bigIndex] = big[bigIndex];

  return result;
}

/**
 * Returns a BigInteger whose value is {@code (this + val)}.
 *
 * @param  val value to be added to this BigInteger.
 * @return {@code this + val}
 */
BigInteger.prototype.add = function (val) {
  if (val.signum === 0)
    return this;
  if (this.signum === 0)
    return val;
  if (val.signum === this.signum)
    return BigInteger.fromMag(add(this.mag, val.mag), this.signum);

  var cmp = this.compareMagnitude(val);
  if (cmp == 0)
    return ZERO;
  var resultMag = (cmp > 0 ? subtract(this.mag, val.mag) : subtract(val.mag, this.mag));
  resultMag = trustedStripLeadingZeroInts(resultMag);

  return BigInteger.fromMag(resultMag, cmp === this.signum ? 1 : -1);
}


/**
 * Returns a BigInteger whose value is {@code (this - val)}.
 *
 * @param  val value to be subtracted from this BigInteger.
 * @return {@code this - val}
 */
BigInteger.prototype.subtract = function (val) {
  if (val.signum == 0)
    return this;
  if (this.signum == 0)
    return val.negate();
  if (val.signum != this.signum)
    return BigInteger.fromMag(add(this.mag, val.mag), this.signum);

  var cmp = this.compareMagnitude(val);
  if (cmp == 0)
    return ZERO;
  var resultMag = (cmp > 0 ? subtract(this.mag, val.mag) : subtract(val.mag, this.mag));
  resultMag = trustedStripLeadingZeroInts(resultMag);
  return BigInteger.fromMag(resultMag, cmp == this.signum ? 1 : -1);
}

/**
 * Compares the magnitude array of this BigInteger with the specified
 * BigInteger's. This is the version of compareTo ignoring sign.
 *
 * @param val BigInteger whose magnitude array to be compared.
 * @return -1, 0 or 1 as this magnitude array is less than, equal to or
 *         greater than the magnitude aray for the specified BigInteger's.
 */
BigInteger.prototype.compareMagnitude = function (val) {
  var m1 = this.mag;
  var len1 = m1.length;
  var m2 = val.mag;
  var len2 = m2.length;
  if (len1 < len2)
    return -1;
  if (len1 > len2)
    return 1;
  for (var i = 0; i < len1; i++) {
    var a = m1[i];
    var b = m2[i];
    if (a != b)
      return ((a >>> 32) < (b >>> 32)) ? -1 : 1;
  }
  return 0;
}

/**
 * Multiplies int arrays x and y to the specified lengths and places
 * the result into z. There will be no leading zeros in the resultant array.
 */
function multiplyToLen(x, xlen, y, ylen, z) {
  var xstart = xlen - 1;
  var ystart = ylen - 1;

  if (z == null || z.length < (xlen+ ylen))
    z = Common.intArray(xlen+ylen);

  var carry = Long.ZERO;
  for (var j = ystart, k = ystart + 1 + xstart; j >= 0; j--, k--) {
    var product = Long.fromNumber(y[j] >>> 32).multiply(Long.fromNumber(x[xstart] >>> 32)).add(carry);
    z[k] = product.low;
    carry = product.shiftRightUnsigned(32);
  }
  z[xstart] = carry.low;

  for (var i = xstart-1; i >= 0; i--) {
    carry = Long.ZERO;
    for (var j = ystart, k = ystart + 1 + i; j >= 0; j--, k--) {
        var product = Long.fromNumber(y[j] >>> 32).multiply(Long.fromNumber(x[i] >>> 32)).add(Long.fromNumber(z[k] >>> 32)).add(carry);
        z[k] = product.low;
        carry = product.shiftRightUnsigned(32);
    }
    z[i] = carry.low;
  }
  return z;
}

/**
 * Returns a BigInteger whose value is {@code (this * val)}.
 *
 * @param  val value to be multiplied by this BigInteger.
 * @return {@code this * val}
 */
BigInteger.prototype.multiply = function (val) {
  if (val.signum == 0 || this.signum == 0)
    return ZERO;
  var result = multiplyToLen(this.mag, this.mag.length, val.mag, val.mag.length, null);
  result = trustedStripLeadingZeroInts(result);
  var x = BigInteger.fromMag(result, this.signum == val.signum ? 1 : -1);
  return x;
}

/**
 * Returns the length of the two's complement representation in ints,
 * including space for at least one sign bit.
 */
BigInteger.prototype.intLength = function () {
  return (this.bitLength() >>> 5) + 1;
}

/**
 * Returns a BigInteger with the given two's complement representation.
 * Assumes that the input array will not be modified (the returned
 * BigInteger will reference the input array if feasible).
 */
function valueOf(val) {
  return (val[0] > 0 ? BigInteger.fromMag(val, 1) : BigInteger.fromMag(val));
}

// long val
BigInteger.valueOf = function (val) {
  // If -MAX_CONSTANT < val < MAX_CONSTANT, return stashed constant
  if (val.toNumber() === 0)
    return ZERO;
  if (val.toNumber() > 0 && val.toNumber() <= MAX_CONSTANT)
      return posConst[val.low];
  else if (val.toNumber() < 0 && val.toNumber() >= -MAX_CONSTANT)
      return negConst[val.negate().low];

  return BigInteger.fromLong(val);
}

/**
 * Takes an array a representing a negative 2's-complement number and
 * returns the minimal (no leading zero ints) unsigned whose value is -a.
 * @param {int[]} a
 */
function makePositive(a) {
    var keep, j;

    // Find first non-sign (0xffffffff) int of input
    for (keep = 0; keep < a.length && a[keep] === -1; keep++)
        ;

    /* Allocate output array.  If all non-sign ints are 0x00, we must
     * allocate space for one extra output int. */
    for (j = keep; j < a.length && a[j] === 0; j++)
        ;
    var extraInt = (j === a.length ? 1 : 0);
    var result = Common.intArray(a.length - keep + extraInt);

    /* Copy one's complement of input into output, leaving extra
     * int (if it exists) == 0x00 */
    for (var i = keep; i < a.length; i++)
        result[i - keep + extraInt] = ~a[i];

    // Add one to one's complement to generate two's complement
    for (var i = result.length - 1; ++result[i] === 0; i--)
        ;

    return result;
}

/**
 * Returns a BigInteger whose value is {@code (this & val)}.  (This
 * method returns a negative BigInteger if and only if this and val are
 * both negative.)
 *
 * @param val value to be AND'ed with this BigInteger.
 * @return {@code this & val}
 */
BigInteger.prototype.and = function (val) {
  var result = Common.intArray(Math.max(this.intLength(), val.intLength()));
  for (var i = 0; i < result.length; i++)
    result[i] = (this._getInt(result.length-i-1) & val._getInt(result.length-i-1));
  return valueOf(result);
}

/**
* Squares the contents of the int array x. The result is placed into the
* int array z.  The contents of x are not changed.
*/
var squareToLen = BigInteger.squareToLen = function (x, len, z) {
  /*
   * The algorithm used here is adapted from Colin Plumb's C library.
   * Technique: Consider the partial products in the multiplication
   * of "abcde" by itself:
   *
   *               a  b  c  d  e
   *            *  a  b  c  d  e
   *          ==================
   *              ae be ce de ee
   *           ad bd cd dd de
   *        ac bc cc cd ce
   *     ab bb bc bd be
   *  aa ab ac ad ae
   *
   * Note that everything above the main diagonal:
   *              ae be ce de = (abcd) * e
   *           ad bd cd       = (abc) * d
   *        ac bc             = (ab) * c
   *     ab                   = (a) * b
   *
   * is a copy of everything below the main diagonal:
   *                       de
   *                 cd ce
   *           bc bd be
   *     ab ac ad ae
   *
   * Thus, the sum is 2 * (off the diagonal) + diagonal.
   *
   * This is accumulated beginning with the diagonal (which
   * consist of the squares of the digits of the input), which is then
   * divided by two, the off-diagonal added, and multiplied by two
   * again.  The low bit is simply a copy of the low bit of the
   * input, so it doesn't need special care.
   */
  var zlen = len << 1;
  if (z == null || z.length < zlen)
    z = Common.intArray(zlen);

  // Store the squares, right shifted one bit (i.e., divided by 2)
  var lastProductLowWord = 0;
  for (var j=0, i=0; j<len; j++) {
    var piece = Long.fromNumber(x[j] >>> 32);
    var product = piece.multiply(piece);
    z[i++] = (lastProductLowWord << 31) | product.shiftRightUnsigned(33).low;
    z[i++] = product.shiftRightUnsigned(1).low;
    lastProductLowWord = product.low;
  }

  // Add in off-diagonal sums
  for (var i = len, offset = 1; i > 0; i--, offset += 2) {
    var t = x[i-1];
    t = mulAdd(z, x, offset, i-1, t);
    addOne(z, offset-1, i, t);
  }

  // Shift back up and set low bit
  primitiveLeftShift(z, zlen, 1);
  z[zlen-1] |= x[len-1] & 1;

  return z;
}

/**
 * Multiply an array by one word k and add to result, return the carry
 * int[] out, int[] in, int offset, int len, int k
 */
function mulAdd(out, _in, offset, len, k) {
  var kLong = Long.fromNumber(k >>> 32);
  var carry = Long.fromNumber(0);

  offset = out.length - offset - 1;
  for (var j = len - 1; j >= 0; j--) {
    var product = Long.fromNumber(_in[j] >>> 32).multiply(kLong).add(Long.fromNumber(out[offset] >>> 32)).add(carry);
    out[offset--] = product.low;
    carry = product.shiftRightUnsigned(32);
  }
  return carry.low;
}

/**
 * Add one word to the number a mlen words into a. Return the resulting
 * carry.
 * int[] a, int offset, int mlen, int carry
 */
function addOne(a, offset, mlen, carry) {
  offset = a.length - 1 - mlen - offset;
  var t = Long.fromNumber(a[offset] >>> 32).add(Long.fromNumber(carry >>> 32));

  a[offset] = t.low;
  if (t.shiftRightUnsigned(32).toNumber() === 0)
    return 0;
  while (--mlen >= 0) {
    if (--offset < 0) { // Carry out of number
      return 1;
    } else {
      a[offset]++;
      if (a[offset] != 0)
        return 0;
    }
  }
  return 1;
}

// shifts a up to len left n bits assumes no leading zeros, 0<=n<32
function primitiveLeftShift(a, len, n) {
  if (len === 0 || n === 0)
    return;
  var n2 = 32 - n;
  for (var i=0, c=a[i], m=i+len-1; i<m; i++) {
      var b = c;
      c = a[i+1];
      a[i] = (b << n) | (c >>> n2);
  }
  a[len-1] <<= n;
}


/**
 * Returns a BigInteger whose value is <tt>(this<sup>exponent</sup>)</tt>.
 * Note that {@code exponent} is an integer rather than a BigInteger.
 *
 * @param  exponent exponent to which this BigInteger is to be raised.
 * @return <tt>this<sup>exponent</sup></tt>
 * @throws ArithmeticException {@code exponent} is negative.  (This would
 *         cause the operation to yield a non-integer value.)
 */
BigInteger.prototype.pow = function (exponent) {
  if (exponent < 0)
    throw new Error("Negative exponent");
  if (this.signum === 0)
    return (exponent === 0 ? ONE : this);

  // Perform exponentiation using repeated squaring trick
  var newSign = (this.signum < 0 && (exponent & 1) === 1 ? -1 : 1);
  var baseToPow2 = this.mag;
  var result = [1];

  while (exponent != 0) {
    if ((exponent & 1)==1) {
      result = multiplyToLen(result, result.length, baseToPow2, baseToPow2.length, null);
      result = trustedStripLeadingZeroInts(result);
    }
    if ((exponent >>>= 1) != 0) {
      baseToPow2 = squareToLen(baseToPow2, baseToPow2.length, null);
      baseToPow2 = trustedStripLeadingZeroInts(baseToPow2);
    }
  }
  return BigInteger.fromMag(result, newSign);
}

/**
 * Returns a BigInteger whose value is {@code (this | val)}.  (This method
 * returns a negative BigInteger if and only if either this or val is
 * negative.)
 *
 * @param val value to be OR'ed with this BigInteger.
 * @return {@code this | val}
 */
BigInteger.prototype.or = function (val) {
  var result = Common.intArray(Math.max(this.intLength(), val.intLength()));
  for (var i = 0; i < result.length; i++)
    result[i] = (this._getInt(result.length-i-1) | val._getInt(result.length-i-1));

  return valueOf(result);
}


/**
 * Returns a BigInteger whose value is {@code (this ^ val)}.  (This method
 * returns a negative BigInteger if and only if exactly one of this and
 * val are negative.)
 *
 * @param val value to be XOR'ed with this BigInteger.
 * @return {@code this ^ val}
 */
BigInteger.prototype.xor = function (val) {
    var result = Common.intArray(Math.max(this.intLength(), val.intLength()));
    for (var i=0; i<result.length; i++)
      result[i] = (this._getInt(result.length-i-1) ^ val._getInt(result.length-i-1));

    return valueOf(result);
}

/**
 * Returns a BigInteger whose value is {@code (this & ~val)}.  This
 * method, which is equivalent to {@code and(val.not())}, is provided as
 * a convenience for masking operations.  (This method returns a negative
 * BigInteger if and only if {@code this} is negative and {@code val} is
 * positive.)
 *
 * @param val value to be complemented and AND'ed with this BigInteger.
 * @return {@code this & ~val}
 */
BigInteger.prototype.andNot = function (val) {
  var result = Common.intArray(Math.max(this.intLength(), val.intLength()));
  for (var i=0; i<result.length; i++)
    result[i] = (this._getInt(result.length-i-1) & ~val._getInt(result.length-i-1));

  return valueOf(result);
}

/**
 * Returns a BigInteger whose value is {@code (~this)}.  (This method
 * returns a negative value if and only if this BigInteger is
 * non-negative.)
 *
 * @return {@code ~this}
 */
BigInteger.prototype.not = function () {
  var result = Common.intArray(this.intLength());
  for (var i=0; i<result.length; i++)
    result[i] = ~this._getInt(result.length-i-1);

  return valueOf(result);
}

/**
 * Returns the number of bits in the two's complement representation
 * of this BigInteger that differ from its sign bit.  This method is
 * useful when implementing bit-vector style sets atop BigIntegers.
 *
 * @return number of bits in the two's complement representation
 *         of this BigInteger that differ from its sign bit.
 */ 
BigInteger.prototype.bitCount = function () {
  var bc = this.bitCount - 1;
  if (bc === -1) {  // bitCount not initialized yet
    bc = 0;      // offset by one to initialize
    // Count the bits in the magnitude
    for (var i = 0; i< this.mag.length; i++)
      bc += Integer.bitCount(this.mag[i]);
    if (this.signum < 0) {
      // Count the trailing zeros in the magnitude
      var magTrailingZeroCount = 0, j;
      for (j = this.mag.length-1; this.mag[j]==0; j--)
          magTrailingZeroCount += 32;
      magTrailingZeroCount += Integer.numberOfTrailingZeros(this.mag[j]);
      bc += magTrailingZeroCount - 1;
    }
    this.bitCount = bc + 1;
  }
  return bc;
}

/**
 * Returns a BigInteger whose value is equivalent to this BigInteger
 * with the designated bit cleared.
 * (Computes {@code (this & ~(1<<n))}.)
 *
 * @param  n index of bit to clear.
 * @return {@code this & ~(1<<n)}
 * @throws ArithmeticException {@code n} is negative.
 */
BigInteger.prototype.clearBit = function (n) {
  if (n<0)
    throw new Error("Negative bit address");

  var intNum = n >>> 5;
  var result = Common.intArray(Math.max(this.intLength(), ((n + 1) >>> 5) + 1));

  for (var i = 0; i < result.length; i++)
    result[result.length-i-1] = this._getInt(i);

  result[result.length-intNum-1] &= ~(1 << (n & 31));

  return valueOf(result);
}

/**
 * Returns a BigInteger whose value is {@code (this << n)}.
 * The shift distance, {@code n}, may be negative, in which case
 * this method performs a right shift.
 * (Computes <tt>floor(this * 2<sup>n</sup>)</tt>.)
 *
 * @param  n shift distance, in bits.
 * @return {@code this << n}
 * @throws ArithmeticException if the shift distance is {@code
 *         Integer.MIN_VALUE}.
 * @see #shiftRight
 */
BigInteger.prototype.shiftLeft = function (n) {
  if (this.signum == 0)
    return ZERO;
  if (n==0)
    return this;
  if (n<0) {
    if (n == Integer.MIN_VALUE) {
        throw new Error("Shift distance of Integer.MIN_VALUE not supported.");
    } else {
        return this.shiftRight(-n);
    }
  }

  var nInts = n >>> 5;
  var nBits = n & 0x1f;
  var magLen = this.mag.length;
  var newMag = null;

  if (nBits == 0) {
    newMag = Common.intArray(magLen + nInts);
    for (var i=0; i<magLen; i++)
      newMag[i] = this.mag[i];
  } else {
      var i = 0;
      var nBits2 = 32 - nBits;
      var highBits = this.mag[0] >>> nBits2;
      if (highBits != 0) {
          newMag = Common.intArray(magLen + nInts + 1);
          newMag[i++] = highBits;
      } else {
          newMag = Common.intArray(magLen + nInts);
      }
      var j=0;
      while (j < magLen-1)
          newMag[i++] = this.mag[j++] << nBits | this.mag[j] >>> nBits2;
      newMag[i] = this.mag[j] << nBits;
  }

  return BigInteger.fromMag(newMag, this.signum);
}

/**
 * Returns a BigInteger whose value is {@code (this >> n)}.  Sign
 * extension is performed.  The shift distance, {@code n}, may be
 * negative, in which case this method performs a left shift.
 * (Computes <tt>floor(this / 2<sup>n</sup>)</tt>.)
 *
 * @param  n shift distance, in bits.
 * @return {@code this >> n}
 * @throws ArithmeticException if the shift distance is {@code
 *         Integer.MIN_VALUE}.
 * @see #shiftLeft
 */
BigInteger.prototype.shiftRight = function (n) {
    if (n==0)
      return this;
    if (n<0) {
      if (n == Integer.MIN_VALUE) {
          throw new Error("Shift distance of Integer.MIN_VALUE not supported.");
      } else {
          return this.shiftLeft(-n);
      }
    }

    var nInts = n >>> 5;
    var nBits = n & 0x1f;
    var magLen = this.mag.length;
    var newMag = null;

    // Special case: entire contents shifted off the end
    if (nInts >= magLen)
        return (this.signum >= 0 ? ZERO : negConst[1]);

    if (nBits == 0) {
        var newMagLen = magLen - nInts;
        newMag = Common.intArray(newMagLen);
        for (var i=0; i<newMagLen; i++)
            newMag[i] = this.mag[i];
    } else {
        var i = 0;
        var highBits = this.mag[0] >>> nBits;
        if (highBits != 0) {
            newMag = Common.intArray(magLen - nInts);
            newMag[i++] = highBits;
        } else {
            newMag = Common.intArray(magLen - nInts -1);
        }

        var nBits2 = 32 - nBits;
        var j=0;
        while (j < magLen - nInts - 1)
            newMag[i++] = (this.mag[j++] << nBits2) | (this.mag[j] >>> nBits);
    }

    if (this.signum < 0) {
        // Find out whether any one-bits were shifted off the end.
        var onesLost = false;
        for (var i=magLen-1, j=magLen-nInts; i>=j && !onesLost; i--)
            onesLost = (this.mag[i] != 0);
        if (!onesLost && nBits != 0)
            onesLost = (this.mag[magLen - nInts - 1] << (32 - nBits) != 0);

        if (onesLost)
            newMag = javaIncrement(newMag);
    }

    return BigInteger.fromMag(newMag, this.signum);
}

function javaIncrement(val) {
  var lastSum = 0;
  for (var i=val.length-1;  i >= 0 && lastSum == 0; i--)
      lastSum = (val[i] += 1);
  if (lastSum == 0) {
      val = Common.intArray(val.length+1);
      val[0] = 1;
  }
  return val;
}

/**
 * Compares this BigInteger with the specified BigInteger.  This
 * method is provided in preference to individual methods for each
 * of the six boolean comparison operators ({@literal <}, ==,
 * {@literal >}, {@literal >=}, !=, {@literal <=}).  The suggested
 * idiom for performing these comparisons is: {@code
 * (x.compareTo(y)} &lt;<i>op</i>&gt; {@code 0)}, where
 * &lt;<i>op</i>&gt; is one of the six comparison operators.
 *
 * @param  val BigInteger to which this BigInteger is to be compared.
 * @return -1, 0 or 1 as this BigInteger is numerically less than, equal
 *         to, or greater than {@code val}.
 */
BigInteger.prototype.compareTo = function (val) {
  if (this.signum == val.signum) {
    switch (this.signum) {
    case 1:
      return this.compareMagnitude(val);
    case -1:
      return val.compareMagnitude(this);
    default:
      return 0;
    }
  }
  return this.signum > val.signum ? 1 : -1;
}

/**
 * Compares this BigInteger with the specified Object for equality.
 *
 * @param  x Object to which this BigInteger is to be compared.
 * @return {@code true} if and only if the specified Object is a
 *         BigInteger whose value is numerically equal to this BigInteger.
 */
BigInteger.prototype.equals = function (x) {
  // This test is just an optimization, which may or may not help
  // if (x === this)
  //   return true;

  if (x.constructor.name !== 'BigInteger')
    return false;

  var xInt = x;
  if (xInt.signum != this.signum)
      return false;

  var m = this.mag;
  var len = m.length;
  var xm = xInt.mag;
  if (len != xm.length)
    return false;

  for (var i = 0; i < len; i++){
    if (xm[i] != m[i]) {
      return false;
    }
  }

  return true;
}

/**
  * Returns a BigInteger whose value is {@code (this / val)}.
  *
  * @param  val value by which this BigIntegerTest is to be divided.
  * @return {@code this / val}
  * @throws ArithmeticException if {@code val} is zero.
  */
BigInteger.prototype.divide = function (val) {
  var q = new MutableBigInteger();
  var a = new MutableBigInteger(this.mag);
  var b = new MutableBigInteger(val.mag);
  a.divide(b, q);
  return BigInteger.fromMutableBigInteger(q, this.signum === val.signum ? 1 : -1);
}

/**
 * Returns a BigInteger whose value is {@code (this % val)}.
 *
 * @param  val value by which this BigInteger is to be divided, and the
 *         remainder computed.
 * @return {@code this % val}
 * @throws ArithmeticException if {@code val} is zero.
 */
BigInteger.prototype.remainder = function (val) {
  var q = new MutableBigInteger();
  var a = new MutableBigInteger(this.mag);
  var b = new MutableBigInteger(val.mag);
  var x = a.divide(b, q);
  return BigInteger.fromMutableBigInteger(x, this.signum);
}

/**
 * Returns a BigInteger whose value is {@code (this mod m}).  This method
 * differs from {@code remainder} in that it always returns a
 * <i>non-negative</i> BigInteger.
 *
 * @param  m the modulus.
 * @return {@code this mod m}
 * @throws ArithmeticException {@code m} &le; 0
 * @see    #remainder
 */
BigInteger.prototype.mod = function (m) {
  if (m.signum <= 0)
    throw new Error("BigInteger: modulus not positive");

  var result = this.remainder(m);
  return (result.signum >= 0 ? result : result.add(m));
}

/**
 * Returns {@code true} if and only if the designated bit is set.
 * (Computes {@code ((this & (1<<n)) != 0)}.)
 *
 * @param  n index of bit to test.
 * @return {@code true} if and only if the designated bit is set.
 * @throws ArithmeticException {@code n} is negative.
 */
BigInteger.prototype.testBit = function (n) {
  if (n<0)
    throw new Error("Negative bit address");
  return (this._getInt(n >>> 5) & (1 << (n & 31))) != 0;
}

BigInteger.prototype.clone = function () {
  var _bigInteger = new BigInteger();
  _bigInteger.signum = this.signum;
  _bigInteger.mag = Common.copyOfRange(this.mag, 0, this.mag.length);
  return _bigInteger;
};

/*
 * Returns -1, 0 or +1 as big-endian unsigned int array arg1 is less than,
 * equal to, or greater than arg2 up to length len.
 */
function intArrayCmpToLen(arg1, arg2, len) {
  for (var i = 0; i < len; i++) {
    var b1 = Long.fromNumber(arg1[i] >>> 32);
    var b2 = Long.fromNumber(arg2[i] >>> 32);
    if (b1.compare(b2) < 0)
      return -1;
    if (b1.compare(b2) > 0)
      return 1;
  }
  return 0;
}

/**
 * Subtracts two numbers of same length, returning borrow.
 */
function subN(a, b, len) {
  var sum = Long.ZERO;

  while(--len >= 0) {
    sum = Long.fromNumber(a[len] >>> 32).subtract(Long.fromNumber(b[len] >>> 32)).add(sum.shiftRight(32));
    a[len] = sum.low;
  }

  return sum.shiftRight(32).low;
}

/**
 * Montgomery reduce n, modulo mod.  This reduces modulo mod and divides
 * by 2^(32*mlen). Adapted from Colin Plumb's C library.
 * int[] n, int[] mod, int mlen, int inv
 */
var montReduce = BigInteger.montReduce = function (n, mod, mlen, inv) {
  var c = 0;
  var len = mlen;
  var offset = 0;

  do {
    var nEnd = n[n.length - 1 - offset];
    var carry = mulAdd(n, mod, offset, mlen, Long.fromNumber(inv).multiply(Long.fromNumber(nEnd)).low);
    
    c += addOne(n, offset, mlen, carry);
    offset++;
  } while(--len > 0);

  while(c>0)
      c += subN(n, mod, mlen);

  while (intArrayCmpToLen(n, mod, mlen) >= 0)
      subN(n, mod, mlen);

  return n;
}

/**
 * Left shift int array a up to len by n bits. Returns the array that
 * results from the shift since space may have to be reallocated.
 */
function leftShift(a, len, n) {
    var nInts = n >>> 5;
    var nBits = n & 0x1F;
    var bitsInHighWord = BigIntegerLib.bitLengthForInt(a[0]);

    // If shift can be done without recopy, do so
    if (n <= (32-bitsInHighWord)) {
      primitiveLeftShift(a, len, nBits);
      return a;
    } else { // Array must be resized
      if (nBits <= (32-bitsInHighWord)) {
        var result = Common.intArray(nInts+len);
        for (var i=0; i<len; i++)
          result[i] = a[i];
        primitiveLeftShift(result, result.length, nBits);
        return result;
      } else {
        var result = Common.intArray(nInts + len + 1);
        for (var i=0; i<len; i++)
          result[i] = a[i];
        primitiveRightShift(result, result.length, 32 - nBits);
        return result;
      }
    }
}

/**
 * Returns a BigInteger whose value is x to the power of y mod z.
 * Assumes: z is odd && x < z.
 */
BigInteger.prototype.oddModPow = function (y, z) {
/*
 * The algorithm is adapted from Colin Plumb's C library.
 *
 * The window algorithm:
 * The idea is to keep a running product of b1 = n^(high-order bits of exp)
 * and then keep appending exponent bits to it.  The following patterns
 * apply to a 3-bit window (k = 3):
 * To append   0: square
 * To append   1: square, multiply by n^1
 * To append  10: square, multiply by n^1, square
 * To append  11: square, square, multiply by n^3
 * To append 100: square, multiply by n^1, square, square
 * To append 101: square, square, square, multiply by n^5
 * To append 110: square, square, multiply by n^3, square
 * To append 111: square, square, square, multiply by n^7
 *
 * Since each pattern involves only one multiply, the longer the pattern
 * the better, except that a 0 (no multiplies) can be appended directly.
 * We precompute a table of odd powers of n, up to 2^k, and can then
 * multiply k bits of exponent at a time.  Actually, assuming random
 * exponents, there is on average one zero bit between needs to
 * multiply (1/2 of the time there's none, 1/4 of the time there's 1,
 * 1/8 of the time, there's 2, 1/32 of the time, there's 3, etc.), so
 * you have to do one multiply per k+1 bits of exponent.
 *
 * The loop walks down the exponent, squaring the result buffer as
 * it goes.  There is a wbits+1 bit lookahead buffer, buf, that is
 * filled with the upcoming exponent bits.  (What is read after the
 * end of the exponent is unimportant, but it is filled with zero here.)
 * When the most-significant bit of this buffer becomes set, i.e.
 * (buf & tblmask) != 0, we have to decide what pattern to multiply
 * by, and when to do it.  We decide, remember to do it in future
 * after a suitable number of squarings have passed (e.g. a pattern
 * of "100" in the buffer requires that we multiply by n^1 immediately;
 * a pattern of "110" calls for multiplying by n^3 after one more
 * squaring), clear the buffer, and continue.
 *
 * When we start, there is one more optimization: the result buffer
 * is implcitly one, so squaring it or multiplying by it can be
 * optimized away.  Further, if we start with a pattern like "100"
 * in the lookahead window, rather than placing n into the buffer
 * and then starting to square it, we have already computed n^2
 * to compute the odd-powers table, so we can place that into
 * the buffer and save a squaring.
 *
 * This means that if you have a k-bit window, to compute n^z,
 * where z is the high k bits of the exponent, 1/2 of the time
 * it requires no squarings.  1/4 of the time, it requires 1
 * squaring, ... 1/2^(k-1) of the time, it reqires k-2 squarings.
 * And the remaining 1/2^(k-1) of the time, the top k bits are a
 * 1 followed by k-1 0 bits, so it again only requires k-2
 * squarings, not k-1.  The average of these is 1.  Add that
 * to the one squaring we have to do to compute the table,
 * and you'll see that a k-bit window saves k-2 squarings
 * as well as reducing the multiplies.  (It actually doesn't
 * hurt in the case k = 1, either.)
 */
  // Special case for exponent of one
  if (y.equals(ONE))
    return this;

  // Special case for base of zero
  if (this.signum==0)
      return ZERO;

  var base = Common.copyOfRange(this.mag, 0, this.mag.length);
  var exp = y.mag;
  var mod = z.mag;
  var modLen = mod.length;

  // Select an appropriate window size
  var wbits = 0;
  var ebits = BigIntegerLib.bitLength(exp, exp.length);
  // if exponent is 65537 (0x10001), use minimum window size
  if ((ebits != 17) || (exp[0] != 65537)) {
    while (ebits > bnExpModThreshTable[wbits]) {
      wbits++;
    }
  }

  // Calculate appropriate table size
  var tblmask = 1 << wbits;

  // Allocate table for precomputed odd powers of base in Montgomery form
  var table = new Array(tblmask);
  for (var i = 0; i < tblmask; i++) {
    table[i] = Common.intArray(modLen);
  }

  // Compute the modular inverse
  var inv = -MutableBigInteger.inverseMod32(mod[modLen-1]);
  
  // Convert base to Montgomery form
  var a = leftShift(base, base.length, modLen << 5);

  var q = new MutableBigInteger();
  var a2 = new MutableBigInteger(a);
  var b2 = new MutableBigInteger(mod);

  var r = a2.divide(b2, q);

  table[0] = r.toIntArray();
  // Pad table[0] with leading zeros so its length is at least modLen
  if (table[0].length < modLen) {
     var offset = modLen - table[0].length;
     var t2 = Common.intArray(modLen);
     for (var i=0; i < table[0].length; i++)
         t2[i+offset] = table[0][i];
     table[0] = t2;
  }

  // Set b to the square of the base
  var b = squareToLen(table[0], modLen, null);

  b = montReduce(b, mod, modLen, inv);

  // Set t to high half of b
  var t = Common.intArray(modLen);
  for(var i = 0; i < modLen; i++)
    t[i] = b[i];

  // Fill in the table with odd powers of the base
  for (var i=1; i < tblmask; i++) {
    var prod = multiplyToLen(t, modLen, table[i-1], modLen, null);
    table[i] = montReduce(prod, mod, modLen, inv);
  }

  // Pre load the window that slides over the exponent
  var bitpos = 1 << ((ebits-1) & (32-1));

  var buf = 0;
  var elen = exp.length;
  var eIndex = 0;
  for (var i = 0; i <= wbits; i++) {
    buf = (buf << 1) | (((exp[eIndex] & bitpos) != 0) ? 1 : 0);
    bitpos >>>= 1;
    if (bitpos == 0) {
      eIndex++;
      bitpos = 1 << (32-1);
      elen--;
    }
  }

  var multpos = ebits;

  // The first iteration, which is hoisted out of the main loop
  ebits--;
  var isone = true;

  multpos = ebits - wbits;

  while ((buf & 1) === 0) {
    buf >>>= 1;
    multpos++;
  }

  var mult = table[buf >>> 1];

  buf = 0;
  if (multpos == ebits)
      isone = false;

  // The main loop
  while(true) {
      ebits--;
      // Advance the window
      buf <<= 1;

      if (elen != 0) {
          buf |= ((exp[eIndex] & bitpos) != 0) ? 1 : 0;
          bitpos >>>= 1;
          if (bitpos == 0) {
              eIndex++;
              bitpos = 1 << (32-1);
              elen--;
          }
      }

      // Examine the window for pending multiplies
      if ((buf & tblmask) != 0) {
        multpos = ebits - wbits;
        while ((buf & 1) == 0) {
          buf >>>= 1;
          multpos++;
        }
        mult = table[buf >>> 1];
        buf = 0;
      }

      // Perform multiply
      if (ebits == multpos) {
          if (isone) {
              b = clone(mult);
              isone = false;
          } else {
              t = b;
              a = multiplyToLen(t, modLen, mult, modLen, a);
              a = montReduce(a, mod, modLen, inv);
              t = a; a = b; b = t;
          }
      }

      // Check if done
      if (ebits == 0)
          break;

      // Square the input
      if (!isone) {
          t = b;
          a = squareToLen(t, modLen, a);
          a = montReduce(a, mod, modLen, inv);
          t = a; a = b; b = t;
      }
  }

  // Convert result out of Montgomery form and return
  var t2 = Common.intArray(2 * modLen);
  for(var i = 0; i < modLen; i++)
      t2[i + modLen] = b[i];
    
  b = montReduce(t2, mod, modLen, inv);
  
  t2 = Common.intArray(modLen);
  for(var i=0; i<modLen; i++)
    t2[i] = b[i];

  return BigInteger.fromMag(t2, 1);
}

/**
 * Returns the index of the rightmost (lowest-order) one bit in this
 * BigInteger (the number of zero bits to the right of the rightmost
 * one bit).  Returns -1 if this BigInteger contains no one bits.
 * (Computes {@code (this==0? -1 : log2(this & -this))}.)
 *
 * @return index of the rightmost one bit in this BigInteger.
 */
BigInteger.prototype.getLowestSetBit = function () {
  var lsb = this.lowestSetBit - 2;
  if (lsb == -2) {  // lowestSetBit not initialized yet
    lsb = 0;
    if (this.signum == 0) {
        lsb -= 1;
    } else {
        // Search for lowest order nonzero int
        var i,b;
        for (i=0; (b = this._getInt(i))==0; i++)
            ;
        lsb += (i << 5) + Integer.numberOfTrailingZeros(b);
    }
    this.lowestSetBit = lsb + 2;
  }
  return lsb;
}

/**
 * Returns a BigInteger whose value is {@code (this}<sup>-1</sup> {@code mod m)}.
 *
 * @param  m the modulus.
 * @return {@code this}<sup>-1</sup> {@code mod m}.
 * @throws ArithmeticException {@code  m} &le; 0, or this BigInteger
 *         has no multiplicative inverse mod m (that is, this BigInteger
 *         is not <i>relatively prime</i> to m).
 */
BigInteger.prototype.modInverse = function (m) {
  if (m.signum != 1)
      throw new Error("BigInteger: modulus not positive");

  if (m.equals(ONE))
    return ZERO;

  // Calculate (this mod m)
  var modVal = this;
  if (this.signum < 0 || (this.compareMagnitude(m) >= 0))
      modVal = this.mod(m);

  if (modVal.equals(ONE))
      return ONE;

  var a = new MutableBigInteger(modVal);
  var b = new MutableBigInteger(m);

  var result = a.mutableModInverse(b);

  return BigInteger.fromMutableBigInteger(result, 1);
}

/**
 * Returns a BigInteger whose value is (this ** exponent) mod (2**p)
 */
BigInteger.prototype.modPow2 = function (exponent, p) {
  /*
   * Perform exponentiation using repeated squaring trick, chopping off
   * high order bits as indicated by modulus.
   */
  var result = BigInteger.valueOf(Long.fromNumber(1));
  var baseToPow2 = this.mod2(p);
  var expOffset = 0;

  var limit = exponent.bitLength();

  if (this.testBit(0))
     limit = (p-1) < limit ? (p-1) : limit;

  while (expOffset < limit) {
    if (exponent.testBit(expOffset))
      result = result.multiply(baseToPow2).mod2(p);
    expOffset++;
    if (expOffset < limit)
      baseToPow2 = baseToPow2.square().mod2(p);
  }

  return result;
}

/**
 * Returns a BigInteger whose value is {@code (this<sup>2</sup>)}.
 *
 * @return {@code this<sup>2</sup>}
 */
BigInteger.prototype.square = function () {
  if (this.signum == 0)
    return ZERO;
  var z = squareToLen(this.mag, this.mag.length, null);
  return BigInteger.fromMag(trustedStripLeadingZeroInts(z), 1);
}

/**
 * Returns a BigInteger whose value is this mod(2**p).
 * Assumes that this {@code BigInteger >= 0} and {@code p > 0}.
 */
BigInteger.prototype.mod2 = function (p) {
    if (this.bitLength() <= p)
      return this;
    // Copy remaining ints of mag
    var numInts = (p + 31) >>> 5;
    var mag = Common.intArray(numInts);
    for (var i=0; i<numInts; i++)
        mag[i] = this.mag[i + (this.mag.length - numInts)];

    // Mask out any excess bits
    var excessBits = (numInts << 5) - p;
    mag[0] &= Long.fromInt(1).shiftLeft(32-excessBits).low - 1;

    return (mag[0]==0 ? _fromMag(1, mag) : BigInteger.fromMag(mag, 1));
}

/**
 * Returns a BigInteger whose value is
 * <tt>(this<sup>exponent</sup> mod m)</tt>.  (Unlike {@code pow}, this
 * method permits negative exponents.)
 *
 * @param  exponent the exponent.
 * @param  m the modulus.
 * @return <tt>this<sup>exponent</sup> mod m</tt>
 * @throws ArithmeticException {@code m} &le; 0 or the exponent is
 *         negative and this BigInteger is not <i>relatively
 *         prime</i> to {@code m}.
 * @see    #modInverse
 */
BigInteger.prototype.modPow = function (exponent, m) {
  if (m.signum <= 0)
    throw new Error("BigInteger: modulus not positive");

  // Trivial cases
  if (exponent.signum == 0)
    return (m.equals(ONE) ? ZERO : ONE);

  if (this.equals(ONE))
    return (m.equals(ONE) ? ZERO : ONE);

  if (this.equals(ZERO) && exponent.signum >= 0)
    return ZERO;

  if (this.equals(negConst[1]) && (!exponent.testBit(0)))
    return (m.equals(ONE) ? ZERO : ONE);

  var invertResult;
  if ((invertResult = (exponent.signum < 0)))
    exponent = exponent.negate();

  var base = ((this.signum < 0 || this.compareTo(m) >= 0) ? this.mod(m) : this);
  var result;
  if (m.testBit(0)) { // odd modulus
    result = base.oddModPow(exponent, m);
  } else {
    /*
     * Even modulus.  Tear it into an "odd part" (m1) and power of two
     * (m2), exponentiate mod m1, manually exponentiate mod m2, and
     * use Chinese Remainder Theorem to combine results.
     */

    // Tear m apart into odd part (m1) and power of 2 (m2)
    var p = m.getLowestSetBit();   // Max pow of 2 that divides m

    var m1 = m.shiftRight(p);  // m/2**p
    var m2 = ONE.shiftLeft(p); // 2**p

    // Calculate new base from m1
    var base2 = (this.signum < 0 || this.compareTo(m1) >= 0 ? this.mod(m1) : this);
    // Caculate (base ** exponent) mod m1.
    var a1 = (m1.equals(ONE) ? ZERO : base2.oddModPow(exponent, m1));
    
    // Calculate (this ** exponent) mod m2
    var a2 = base.modPow2(exponent, p);
    
    a2.mag = [];
    a2.signum = 0;
    a2.bitLen = 1;

    // Combine results using Chinese Remainder Theorem
    var y1 = m2.modInverse(m1);
    var y2 = m1.modInverse(m2);

    result = a1.multiply(m2).multiply(y1).add(a2.multiply(m1).multiply(y2)).mod(m);
  }
  return (invertResult ? result.modInverse(m) : result);
}

/**
 * Converts this BigInteger to an {@code int}.  This
 * conversion is analogous to a
 * <i>narrowing primitive conversion</i> from {@code long} to
 * {@code int} as defined in section 5.1.3 of
 * <cite>The Java&trade; Language Specification</cite>:
 * if this BigInteger is too big to fit in an
 * {@code int}, only the low-order 32 bits are returned.
 * Note that this conversion can lose information about the
 * overall magnitude of the BigInteger value as well as return a
 * result with the opposite sign.
 *
 * @return this BigInteger converted to an {@code int}.
 */
BigInteger.prototype.intValue = function () {
  var result = this._getInt(0);;
  return result;
}

/**
 * Initialize static constant array when class is loaded.
 */
var MAX_CONSTANT = 16;
var posConst = new Array(MAX_CONSTANT + 1);
var negConst = new Array(MAX_CONSTANT + 1);

for (var i = 1; i <= MAX_CONSTANT; i++) {
  var magnitude = Common.intArray(1);
  magnitude[0] = i;
  posConst[i] = BigInteger.fromMag(magnitude,  1);
  negConst[i] = BigInteger.fromMag(magnitude, -1);
}

var bnExpModThreshTable = [7, 25, 81, 241, 673, 1793, Integer.MAX_VALUE];

var ZERO = BigInteger.fromMag([], 0);
var ONE = BigInteger.fromMag([1], 1);

BigInteger.ZERO = ZERO;
BigInteger.ONE = ONE;

module.exports = BigInteger;

