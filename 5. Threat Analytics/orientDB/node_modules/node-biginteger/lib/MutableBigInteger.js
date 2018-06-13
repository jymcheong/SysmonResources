
var Integer = require('./Integer');
var BigIntegerLib = require('./BigIntegerLib');
var Long = require('long');
var Common = require('./common');
var util = require('util');

function MutableBigInteger(val) {
  if (typeof val === 'undefined') {
    // @see MutableBigInteger()
    this.value = [0];
    this.intLen = 0;

  } else if (Array.isArray(val)) {
    // @see MutableBigInteger(int[] val)
    this.value = val;
    this.intLen = val.length;

  } else if (val.constructor.name === 'MutableBigInteger') {
    // @see  MutableBigInteger(MutableBigInteger val)
    this.intLen = val.intLen;
    this.value = Common.copyOfRange(val.value, val.offset, val.offset + this.intLen);

  } else if (val.constructor.name === 'BigInteger') {
    // @see public static int[] copyOf(int[] original, int newLength)
    this.intLen = val.mag.length;
    this.value = Common.copyOf(val.mag, this.intLen);

  } else if (typeof val === 'number') {
    // @see MutableBigInteger(int val)
    this.value = [0];
    this.intLen = 1;
    this.value[0] = val;
  } else {
    // @see MutableBigInteger()
    this.value = [0];
    this.intLen = 0;

  }
   this.offset = 0;
}

/**
 * Calculates the quotient of this div b and places the quotient in the
 * provided MutableBigInteger objects and the remainder object is returned.
 *
 * Uses Algorithm D in Knuth section 4.3.1.
 * Many optimizations to that algorithm have been adapted from the Colin
 * Plumb C library.
 * It special cases one word divisors for speed. The content of b is not
 * changed.
 *
 */
MutableBigInteger.prototype.divide = function (b, quotient) {
  if (b.intLen === 0) {
    throw new Error("BigIntegerTest divide by zero");
  }
  // Dividend is zero
  if (this.intLen == 0) {
    quotient.intLen = quotient.offset;
    return new MutableBigInteger();
  }

  var cmp = this.compare(b);
  // Dividend less than divisor
  if (cmp < 0) {
    quotient.intLen = quotient.offset = 0;
    return new MutableBigInteger(this);
  }
  // Dividend equal to divisor
  if (cmp === 0) {
    quotient.value[0] = quotient.intLen = 1;
    quotient.offset = 0;
    return new MutableBigInteger();
  }

  quotient.clear();
  // Special case one word divisor
  if (b.intLen === 1) {
    var r = this.divideOneWord(b.value[b.offset], quotient);
    if (r === 0)
      return new MutableBigInteger();
    return new MutableBigInteger([r]);
  }

  // Copy divisor value to protect divisor
  var div = Common.copyOfRange(b.value, b.offset, b.offset + b.intLen);
  return this.divideMagnitude(div, quotient);
}

/**
 * Divide this MutableBigInteger by the divisor represented by its magnitude
 * array. The quotient will be placed into the provided quotient object &
 * the remainder object is returned.
 */
MutableBigInteger.prototype.divideMagnitude = function (divisor, quotient) {
  // Remainder starts as dividend with space for a leading zero
  var rem = new MutableBigInteger(Common.intArray(this.intLen + 1));
  Common.arraycopy(this.value, this.offset, rem.value, 1, this.intLen);
  rem.intLen = this.intLen;
  rem.offset = 1;

  var nlen = rem.intLen;

  // Set the quotient size
  var dlen = divisor.length;
  var limit = nlen - dlen + 1;
  if (quotient.value.length < limit) {
    quotient.value =  Common.intArray(limit);
    quotient.offset = 0;
  }
  quotient.intLen = limit;
  // int[]
  var q = quotient.value;

  // D1 normalize the divisor
  var shift = Integer.numberOfLeadingZeros(divisor[0]);
  if (shift > 0) {
      // First shift will not grow array
      BigIntegerLib.primitiveLeftShift(divisor, dlen, shift);
      // But this one might
      rem.leftShift(shift);
  }

  // Must insert leading 0 in rem if its length did not change
  if (rem.intLen == nlen) {
    rem.offset = 0;
    rem.value[0] = 0;
    rem.intLen++;
  }

  var dh = divisor[0];
  var dhLong = Long.fromNumber(dh >>> 32);
  var dl = divisor[1];
  var qWord = [0, 0];

  // D2 Initialize j
  for(var j = 0; j < limit; j++) {
    // D3 Calculate qhat
    // estimate qhat
    var qhat = 0;
    var qrem = 0;
    var skipCorrection = false;
    var nh = rem.value[j + rem.offset];
    var nh2 = Long.fromNumber(nh).add(Long.fromNumber(0x80000000)).low;
    var nm = rem.value[j + 1 + rem.offset];

    if (nh === dh) {
      qhat = ~0;
      qrem = nh + nm;
      skipCorrection = Long.fromNumber(qrem).add(Long.fromNumber(0x80000000)).low < nh2;
    } else {
      var nChunk = Long.fromNumber(nh).shiftLeft(32).or(Long.fromNumber(nm >>> 32));
      if (nChunk >= 0) {
        qhat = nChunk.div(dhLong).low;
        qrem = nChunk.subtract(Long.fromNumber(qhat).multiply(dhLong)).low;
      } else {
        this.divWord(qWord, nChunk, dh);
        qhat = qWord[0];
        qrem = qWord[1];
      }
    }

    if (qhat == 0)
      continue;

    if (!skipCorrection) { // Correct qhat
      var nl = Long.fromNumber(rem.value[j + 2 + rem.offset] >>> 32);
      var rs = Long.fromNumber(qrem >>> 32).shiftLeft(32).or(nl);
      var estProduct = Long.fromNumber(dl >>> 32).multiply(Long.fromNumber(qhat >>> 32));

      if (this.unsignedLongCompare(estProduct, rs)) {
        qhat--;
        var qrem = Long.fromNumber(qrem >>> 32).add(dhLong).low;
        if (Long.fromNumber(qrem >>> 32).compare(dhLong) >= 0) {
          estProduct = estProduct.subtract(Long.fromNumber(dl >>> 32));
          rs = Long.fromNumber(qrem >>> 32).shiftLeft(32).or(nl);
          if (this.unsignedLongCompare(estProduct, rs)) {
            qhat--;
          }
        }

      }
    }

    // D4 Multiply and subtract
    rem.value[j + rem.offset] = 0;

    var borrow = this.mulsub(rem.value, divisor, qhat, dlen, j + rem.offset);

    // D5 Test remainder
    if (Long.fromNumber(borrow).add(Long.fromNumber(0x80000000)).low > nh2) {
      // D6 Add back
      this.divadd(divisor, rem.value, j+1+rem.offset);
      qhat--;
    }

    // // Store the quotient digit
    q[j] = qhat;
  } // D7 loop on j

  // D8 Unnormalize
  if (shift > 0)
    rem.rightShift(shift);

  quotient.normalize();
  rem.normalize();
  return rem;
}

/**
* A primitive used for division. This method adds in one multiple of the
* divisor a back to the dividend result at a specified offset. It is used
* when qhat was estimated too large, and must be adjusted.
* int[] a, int[] result, int offset
*/
MutableBigInteger.prototype.divadd = function (a, result, offset) {
  var carry = Long.fromInt(0);
  for (var j = a.length-1; j >= 0; j--) {
    var sum = Long.fromNumber(a[j] >>> 32).add(Long.fromNumber(result[j + offset] >>> 32)).add(carry);
    result[j+offset] = sum.low;
    carry = sum.shiftRightUnsigned(32);
  }
  return carry.low;
}

/**
 * Ensure that the MutableBigInteger is in normal form, specifically
 * making sure that there are no leading zeros, and that if the
 * magnitude is zero, then intLen is zero.
 */
MutableBigInteger.prototype.normalize = function () {
  if (this.intLen === 0) {
    this.offset = 0;
    return;
  }

  var index = this.offset;
  if (this.value[index] != 0)
    return;

  var indexBound = index + this.intLen;
  do {
    index++;
  } while((index < indexBound) && (this.value[index] === 0));
  var numZeros = index - this.offset;
  this.intLen -= numZeros;
  this.offset = (this.intLen === 0 ?  0 : this.offset + numZeros);
}

/**
 * This method is used for division. It multiplies an n word input a by one
 * word input x, and subtracts the n word product from q. This is needed
 * when subtracting qhat*divisor from dividend.
 * int[] q, int[] a, int x, int len, int offset
 */
MutableBigInteger.prototype.mulsub = function (q, a, x, len, offset) {
  var xLong = Long.fromNumber(x >>> 32);
  var carry = Long.fromNumber(0);
  offset += len;
  for (var j = len - 1; j >= 0; j--) {
    var product = Long.fromNumber(a[j] >>> 32).multiply(xLong).add(carry);
    var difference = Long.fromNumber(q[offset]).subtract(product);
    q[offset--] = difference.low;
    carry = product.shiftRightUnsigned(32).add(
      Long.fromNumber(difference.low >>>32).compare(Long.fromNumber(~product.low >>> 32)) > 0 ? Long.fromInt(1) : Long.fromInt(0)
    );
  }

  return carry.low;
}

/**
 * Compare two longs as if they were unsigned.
 * Returns true iff one is bigger than two.
 */
MutableBigInteger.prototype.unsignedLongCompare = function (one, two) {
  return one.add(Long.MIN_VALUE).compare(two.add(Long.MIN_VALUE)) > 0;
}

/**
 * [divWord description]
 * @param  {int[] } result [description]
 * @param  {long} n             [description]
 * @param  {int}     d             [description]
 * @return {[type]}        [description]
 */
MutableBigInteger.prototype.divWord = function (result, n, d) {
  // if (typeof n === 'number') {
  //   n = Long.fromNumber(n);
  // }
  // long
  var dLong = Long.fromNumber(d >>> 32);

  if (dLong.toNumber() === 1) {
    result[0] = n.low;
    result[1] = 0;
    return;
  }

  // Approximate the quotient and remainder
  // var q = (n >>> 1) / (dLong >>> 1);
  var q = n.shiftRightUnsigned(1).div(dLong.shiftRightUnsigned(1));

  // var r = n - q * dLong;
  var r = n.subtract(q.multiply(dLong));
  var zero = Long.fromInt(0);
  // Correct the approximation
  while (r.compare(zero) < 0) {
    // r += dLong;
    r = r.add(dLong);
    // q--;
    q = q.subtract(Long.fromInt(1));
  }
  while (r.compare(dLong) >= 0) {
    // r -= dLong;
    // q++;
    r = r.subtract(dLong);
    q = q.add(1);
  }

  result[0] = q.low;
  result[1] = r.low;
}

/**
 * [primitiveLeftShift description]
 * @param  {int[]}  a             [description]
 * @param  {int}  len           [description]
 * @param  {int}  n             [description]
 * @return {[type]}       [description]
 */
MutableBigInteger.prototype.primitiveLeftShift = function (n) {
  var val = this.value;
  var n2 = 32 - n;
  for (var i = this.offset, c = val[i], m = i + this.intLen - 1; i < m; i++) {
    var b = c;
    c = val[i + 1];
    val[i] = (b << n) | (c >>> n2);
  }
  val[this.offset + this.intLen - 1] <<= n;
}

/**
 * Right shift this MutableBigInteger n bits, where n is
 * less than 32.
 * Assumes that intLen > 0, n > 0 for speed
 */
MutableBigInteger.prototype.primitiveRightShift = function (n) {
  var val = this.value;
  var n2 = 32 - n;
  for (var i = this.offset + this.intLen - 1, c = val[i]; i > this.offset; i--) {
    var b = c;
    c = val[i-1];
    val[i] = (c << n2) | (b >>> n);
  }
  val[this.offset] >>>= n;
}

/**
 * Left shift this MutableBigInteger n bits.
 * int
 */
MutableBigInteger.prototype.leftShift = function (n) {
  /*
   * If there is enough storage space in this MutableBigInteger already
   * the available space will be used. Space to the right of the used
   * ints in the value array is faster to utilize, so the extra space
   * will be taken from the right if possible.
   */
  if (this.intLen == 0)
     return;
  var nInts = n >>> 5;
  var nBits = n & 0x1F;
  var bitsInHighWord = BigIntegerLib.bitLengthForInt(this.value[this.offset]);

  // If shift can be done without moving words, do so
  if (n <= (32 - bitsInHighWord)) {
    this.primitiveLeftShift(nBits);
    return;
  }

  var newLen = this.intLen + nInts +1;
  if (nBits <= (32 - bitsInHighWord))
    newLen--;
  if (this.value.length < newLen) {
    // The array must grow
    var result =  Common.intArray(newLen);
    for (var i = 0; i < this.intLen; i++)
      result[i] = this.value[this.offset+i];
    this.setValue(result, newLen);
  } else if (this.value.length - this.offset >= newLen) {
    // Use space on right
    for(var i = 0; i < newLen - this.intLen; i++)
      this.value[this.offset + this.intLen + i] = 0;
  } else {
    // Must use space on left
    for (var i = 0; i < this.intLen; i++)
      this.value[i] = this.value[this.offset+i];
    for (var i = this.intLen; i < newLen; i++)
      this.value[i] = 0;
    this.offset = 0;
  }
  this.intLen = newLen;
  if (nBits == 0)
    return;
  if (nBits <= (32 - bitsInHighWord))
    this.primitiveLeftShift(nBits);
  else
    this.primitiveRightShift(32 - nBits);
}

/**
 * Right shift this MutableBigInteger n bits. The MutableBigInteger is left
 * in normal form.
 */
MutableBigInteger.prototype.rightShift = function (n) {
  if (this.intLen === 0)
    return;
  var nInts = n >>> 5;
  var nBits = n & 0x1F;
  this.intLen -= nInts;
  if (nBits == 0)
    return;
  var bitsInHighWord = BigIntegerLib.bitLengthForInt(this.value[this.offset]);
  if (nBits >= bitsInHighWord) {
    this.primitiveLeftShift(32 - nBits);
    this.intLen--;
  } else {
    this.primitiveRightShift(nBits);
  }
}

/**
 * Sets this MutableBigInteger's value array to the specified array.
 * The intLen is set to the specified length.
 * int[]
 */
MutableBigInteger.prototype.setValue = function (val, length) {
  this.value = val;
  this.intLen = length;
  this.offset = 0;
}

/**
 * This method is used for division of an n word dividend by a one word
 * divisor. The quotient is placed into quotient. The one word divisor is
 * specified by divisor.
 *
 * @return the remainder of the division is returned.
 *
 */
MutableBigInteger.prototype.divideOneWord = function (divisor, quotient) {
  var divisorLong = Long.fromNumber(divisor >>> 32);
  // Special case of one word dividend
  if (this.intLen === 1) {
    var dividendValue = Long.fromNumber(this.value[this.offset] >>> 32);
    var q = dividendValue.div(divisorLong).low;
    var r = dividendValue.subtract(Long.fromInt(q).multiply(divisorLong)).low;
    quotient.value[0] = q;
    quotient.intLen = (q == 0) ? 0 : 1;
    quotient.offset = 0;
    return r;
  }

  if (quotient.value.length < this.intLen){
    quotient.value = Common.intArray(this.intLen);
  }
  quotient.offset = 0;
  quotient.intLen = this.intLen;

  // Normalize the divisor
  var shift = Integer.numberOfLeadingZeros(divisor);

  var rem = this.value[this.offset];
  var remLong = Long.fromNumber(rem >>> 32);
  if (remLong.compare(divisorLong) < 0) {
    quotient.value[0] = 0;
  } else {
    quotient.value[0] = remLong.div(divisorLong).low;
    rem = remLong.subtract(Long.fromInt(quotient.value[0]).multiply(divisorLong)).low;
    remLong = Long.fromNumber(rem >>> 32);
  }

  var xlen = this.intLen;
  var qWord = Common.intArray(2);
  while (--xlen > 0) {
      var dividendEstimate = (remLong.shiftLeft(32)).or(
          Long.fromNumber(this.value[this.offset + this.intLen - xlen] >>> 32)
        );
      if (dividendEstimate.toNumber() >= 0) {
          qWord[0] = dividendEstimate.div(divisorLong).low;
          qWord[1] = dividendEstimate.subtract(Long.fromInt(qWord[0]).multiply(divisorLong)).low;
      } else {
          this.divWord(qWord, dividendEstimate, divisor);
      }
      quotient.value[this.intLen - xlen] = qWord[0];
      rem = qWord[1];
      remLong = Long.fromNumber(rem >>> 32);
  }

  quotient.normalize();
  // Unnormalize
  if (shift > 0)
    return rem % divisor;
  else
    return rem;
}

/**
 * Compare the magnitude of two MutableBigIntegers. Returns -1, 0 or 1
 * as this MutableBigInteger is numerically less than, equal to, or
 * greater than <tt>b</tt>.
 */
MutableBigInteger.prototype.compare = function (b) {
  var blen = b.intLen;
  if (this.intLen < blen)
    return -1;
  if (this.intLen > blen)
   return 1;

  // Add Integer.MIN_VALUE to make the comparison act as unsigned integer
  // comparison.
  var _x8 = Long.fromNumber(0x80000000);
  var bval = b.value;
  for (var i = this.offset, j = b.offset; i < this.intLen + this.offset; i++, j++) {
    var b1 = Long.fromNumber(this.value[i]).add(_x8).low;
    var b2 = Long.fromNumber(bval[j]).add(_x8).low;
    if (b1 < b2)
      return -1;
    if (b1 > b2)
      return 1;
  }
  return 0;
}

/**
 * Clear out a MutableBigInteger for reuse.
 */
MutableBigInteger.prototype.clear = function () {
  this.offset = this.intLen = 0;
  for (var index = 0, n = this.value.length; index < n; index++)
    this.value[index] = 0;
}

MutableBigInteger.prototype.clone = function () {
  var val = Common.intArray(this.intLen);
  for (var i = 0; i < this.intLen; i++) {
    val[i] = this.value[i];
  }
  return new MutableBigInteger(val);
}

MutableBigInteger.prototype.getMagnitudeArray = function () {
  if (this.offset > 0 || this.value.length != this.intLen) {
    return Common.copyOfRange(this.value, this.offset, this.offset + this.intLen);
  }
  return this.value;
};

// @see BigInteger.fromMutableBigInteger(mb, sign);
// MutableBigInteger.prototype.toBigInteger = function (sign) {
//   if (this.intLen == 0 || sign == 0) {
//     return BigInteger.fromMag([0], 0);
//   }
//   return BigInteger.fromMag(this.getMagnitudeArray(), sign);
// }


/*
 * Returns the multiplicative inverse of val mod 2^32.  Assumes val is odd.
 */
MutableBigInteger.inverseMod32 = function (val) {
    // Newton's iteration!
    val  = Long.fromInt(val);
    var t = Long.fromInt(val);
    var two = Long.fromInt(2);

    t = Long.fromNumber(t.multiply(two.subtract(val.multiply(t))).low);
    t = Long.fromNumber(t.multiply(two.subtract(val.multiply(t))).low);
    t = Long.fromNumber(t.multiply(two.subtract(val.multiply(t))).low);
    t = t.multiply(two.subtract(val.multiply(t))).low;

    return t;
}

/**
 * Convert this MutableBigInteger into an int array with no leading
 * zeros, of a length that is equal to this MutableBigInteger's intLen.
 */
MutableBigInteger.prototype.toIntArray = function () {
  var result = Common.intArray(this.intLen);
  for(var i = 0; i < this.intLen; i++)
    result[i] = this.value[this.offset + i];
  return result;
}

/**
 * Returns true iff this MutableBigInteger has a value of zero.
 */
MutableBigInteger.prototype.isZero = function () {
    return (this.intLen === 0);
}

MutableBigInteger.prototype.isOdd = function () {
  return this.isZero() ? false : ((this.value[this.offset + this.intLen - 1] & 1) === 1);
}

/**
 * Returns true iff this MutableBigInteger has a value of one.
 */
MutableBigInteger.prototype.isOne = function () {
  return (this.intLen == 1) && (this.value[this.offset] == 1);
}

/**
 * Returns true iff this MutableBigInteger is even.
 */
MutableBigInteger.prototype.isEven = function () {
  return (this.intLen == 0) || ((this.value[this.offset + this.intLen - 1] & 1) == 0);
}

/**
* Return the index of the lowest set bit in this MutableBigInteger. If the
* magnitude of this MutableBigInteger is zero, -1 is returned.
*/
MutableBigInteger.prototype.getLowestSetBit = function () {
  if (this.intLen == 0)
      return -1;
  var j, b;
  for (j = this.intLen-1; (j>0) && (this.value[j+this.offset]==0); j--)
      ;
  b = this.value[j+this.offset];
  if (b==0)
      return -1;
  return ((this.intLen-1-j)<<5) + Integer.numberOfTrailingZeros(b);
}


/**
 * Calculate the multiplicative inverse of this mod mod, where mod is odd.
 * This and mod are not changed by the calculation.
 *
 * This method implements an algorithm due to Richard Schroeppel, that uses
 * the same intermediate representation as Montgomery Reduction
 * ("Montgomery Form").  The algorithm is described in an unpublished
 * manuscript entitled "Fast Modular Reciprocals."
 */
MutableBigInteger.prototype.modInverse = function (mod) {
    var p = new MutableBigInteger(mod);
    var f = new MutableBigInteger(this);
    var g = new MutableBigInteger(p);
    var c = new SignedMutableBigInteger(1);
    var d = new SignedMutableBigInteger();
    var temp = null;
    var sTemp = null;

    var k = 0;
    // Right shift f k times until odd, left shift d k times
    if (f.isEven()) {
        var trailingZeros = f.getLowestSetBit();
        f.rightShift(trailingZeros);
        d.leftShift(trailingZeros);
        k = trailingZeros;
    }
    // The Almost Inverse Algorithm
    while(!f.isOne()) {
        // If gcd(f, g) != 1, number is not invertible modulo mod
        if (f.isZero())
            throw new Error("BigInteger not invertible.");

        // If f < g exchange f, g and c, d
        if (f.compare(g) < 0) {
            temp = f; f = g; g = temp;
            sTemp = d; d = c; c = sTemp;
        }

        // If f == g (mod 4)
        if (((f.value[f.offset + f.intLen - 1] ^
             g.value[g.offset + g.intLen - 1]) & 3) == 0) {
            f.subtract(g);
            c.signedSubtract(d);
        } else { // If f != g (mod 4)
            f.add(g);
            c.signedAdd(d);
        }
        // Right shift f k times until odd, left shift d k times
        var trailingZeros = f.getLowestSetBit();
        f.rightShift(trailingZeros);
        d.leftShift(trailingZeros);
        k += trailingZeros;
    }

    while (c.sign < 0) {
      c.signedAdd(p);
    }
    return fixup(c, p, k);
}
/*
 * The Fixup Algorithm
 * Calculates X such that X = C * 2^(-k) (mod P)
 * Assumes C<P and P is odd.
 */
function fixup(c, p, k) {
  var temp = new MutableBigInteger();
  // Set r to the multiplicative inverse of p mod 2^32
  var r = -MutableBigInteger.inverseMod32(p.value[p.offset+p.intLen-1]);
  for(var i=0, numWords = k >> 5; i<numWords; i++) {
      // V = R * c (mod 2^j)
      var v = Long.fromNumber(r).multiply(Long.fromNumber(c.value[c.offset + c.intLen - 1])).low;
      // var v = r * c.value[c.offset + c.intLen - 1];
      // c = c + (v * p)
      p.mul(v, temp);
      c.add(temp);
      // c = c / 2^j
      c.intLen--;
  }
  var numBits = k & 0x1f;
  if (numBits != 0) {
      var v = Long.fromNumber(r).multiply(Long.fromNumber(c.value[c.offset + c.intLen - 1])).low;
      // var v = r * c.value[c.offset + c.intLen - 1];
      v &= ((1 << numBits) - 1);
      // c = c + (v * p)
      p.mul(v, temp);
      c.add(temp);
      // c = c / 2^j
      c.rightShift(numBits);
  }
  // In theory, c may be greater than p at this point (Very rare!)
  while (c.compare(p) >= 0)
    c.subtract(p);
  return c;
}

MutableBigInteger.prototype.reset = function () {
  this.offset = this.intLen = 0;
};

/**
 * Subtracts the smaller of this and b from the larger and places the
 * result into this MutableBigInteger.
 */
MutableBigInteger.prototype.subtract = function (b) {
    var a = this;

    var result = this.value;
    var sign = a.compare(b);

    if (sign == 0) {
        this.reset();
        return 0;
    }
    if (sign < 0) {
        var tmp = a;
        a = b;
        b = tmp;
    }

    var resultLen = a.intLen;
    if (result.length < resultLen)
        result = Common.intArray(resultLen);

    var diff = Long.fromInt(0);
    var x = a.intLen;
    var y = b.intLen;
    var rstart = result.length - 1;

    // Subtract common parts of both numbers
    while (y>0) {
        x--; y--;

        diff = Long.fromNumber(a.value[x+a.offset] >>> 32).subtract(
            Long.fromNumber((b.value[y+b.offset] >>> 32))
        ).subtract(
           Long.fromNumber(diff.shiftRight(32).negate().low)
        );

        result[rstart--] = diff.low;
    }
    // Subtract remainder of longer number
    while (x>0) {
        x--;
        diff = Long.fromNumber(a.value[x+a.offset] >>> 32).subtract(
           Long.fromNumber(diff.shiftRight(32).negate().low)
        );
        result[rstart--] = diff.low;
    }

    this.value = result;
    this.intLen = resultLen;
    this.offset = this.value.length - resultLen;
    this.normalize();
    return sign;
}

MutableBigInteger.prototype.reset = function () {
  this.offset = this.intLen = 0;
}

/**
 * Sets this MutableBigInteger's value array to a copy of the specified
 * array. The intLen is set to the length of the new array.
 */
MutableBigInteger.prototype.copyValue = function (src) {
  if (src.constructor.name === 'MutableBigInteger') {
    var len = src.intLen;
    if (this.value.length < len)
      this.value = Common.intArray(len);
    Common.arraycopy(src.value, src.offset, this.value, 0, len);
    this.intLen = len;
    this.offset = 0;
  } else if (Array.isArray(src)) {
    var val = src;
    var len = val.length;
    if (this.value.length < len)
        this.value = Common.intArray(len);
    Common.arraycopy(val, 0, this.value, 0, len);
    this.intLen = len;
    this.offset = 0;
  }

}

/**
 * Multiply the contents of this MutableBigInteger by the word y. The
 * result is placed into z.
 */
MutableBigInteger.prototype.mul = function (y, z) {
  if (y == 1) {
      z.copyValue(this);
      return;
  }

  if (y == 0) {
      z.clear();
      return;
  }

  // Perform the multiplication word by word
  var ylong = Long.fromNumber(y >>> 32);
  var zval = (z.value.length < this.intLen+1 ? Common.intArray(this.intLen + 1) : z.value);
  var carry = Long.fromInt(0);
  for (var i = this.intLen-1; i >= 0; i--) {
      var product = ylong.multiply(Long.fromNumber(this.value[i+this.offset] >>> 32)).add(carry);
      zval[i+1] = product.low;
      carry = product.shiftRightUnsigned(32);
  }

  if (carry.toNumber() === 0) {
      z.offset = 1;
      z.intLen = this.intLen;
  } else {
      z.offset = 0;
      z.intLen = this.intLen + 1;
      zval[0] = carry.low;
  }
  z.value = zval;
}

/**
 * Multiply the contents of two MutableBigInteger objects. The result is
 * placed into MutableBigInteger z. The contents of y are not changed.
 */
MutableBigInteger.prototype.multiply = function (y, z) {
    var xLen = this.intLen;
    var yLen = y.intLen;
    var newLen = xLen + yLen;

    // Put z into an appropriate state to receive product
    if (z.value.length < newLen)
        z.value = Common.intArray(newLen);
    z.offset = 0;
    z.intLen = newLen;

    // The first iteration is hoisted out of the loop to avoid extra add
    var carry = Long.fromInt(0);
    for (var j=yLen-1, k=yLen+xLen-1; j >= 0; j--, k--) {
        var product = Long.fromNumber(y.value[j+y.offset] >>> 32).multiply(
            Long.fromNumber(this.value[xLen - 1 + this.offset] >>> 32)
        ).add(carry);
        z.value[k] = product.low;
        carry = product.shiftRightUnsigned(32);
    }
    z.value[xLen-1] = carry.low;

    // Perform the multiplication word by word
    for (var i = xLen-2; i >= 0; i--) {
        carry = Long.fromInt(0);
        for (var j=yLen-1, k=yLen+i; j >= 0; j--, k--) {
            var product = Long.fromNumber(y.value[j+y.offset] >>> 32).multiply(
                Long.fromNumber(this.value[i + this.offset] >>> 32)
            ).add(
                Long.fromNumber(z.value[k] >>> 32)
            ).add(carry);
            z.value[k] = product.low;
            carry = product.shiftRightUnsigned(32);
        }
        z.value[i] = carry.low;
    }

    // Remove leading zeros from product
    z.normalize();
}


/**
 * Adds the contents of two MutableBigInteger objects.The result
 * is placed within this MutableBigInteger.
 * The contents of the addend are not changed.
 */
MutableBigInteger.prototype.add = function (addend) {
    var x = this.intLen;
    var y = addend.intLen;
    var resultLen = (this.intLen > addend.intLen ? this.intLen : addend.intLen);
    var result = (this.value.length < resultLen ? Common.intArray(resultLen) : this.value);

    var rstart = result.length-1;
    var sum;
    var carry = Long.fromInt(0);

    // Add common parts of both numbers
    while(x>0 && y>0) {
        x--; y--;
        sum = Long.fromNumber(this.value[x+this.offset] >>> 32).add(
            Long.fromNumber(addend.value[y+addend.offset] >>> 32)
        ).add(carry);

        result[rstart--] = sum.low;
        carry = sum.shiftRightUnsigned(32);
    }

    // Add remainder of the longer number
    while(x>0) {
        x--;
        if (carry == 0 && result == this.value && rstart == (x + this.offset))
            return;
        sum = Long.fromNumber(this.value[x+this.offset] >>> 32).add(carry);
        result[rstart--] = sum.low;
        carry = sum.shiftRightUnsigned(32);
    }
    while(y>0) {
        y--;
        sum = Long.fromNumber(addend.value[y+addend.offset] >>> 32).add(carry);
        result[rstart--] = sum.low;
        carry = sum.shiftRightUnsigned(32);
    }

    if (carry.toNumber() > 0) { // Result must grow in length
        resultLen++;
        if (result.length < resultLen) {
            var temp = Common.intArray(resultLen);
            // Result one word longer from carry-out; copy low-order
            // bits into new result.
            Common.arraycopy(result, 0, temp, 1, result.length);
            temp[0] = 1;
            result = temp;
        } else {
            result[rstart--] = 1;
        }
    }

    this.value = result;
    this.intLen = resultLen;
    this.offset = result.length - resultLen;
}


/*
 * Calculate the multiplicative inverse of this mod 2^k.
 */
MutableBigInteger.prototype.modInverseMP2 = function (k) {
    if (this.isEven())
        throw new Error("Non-invertible. (GCD != 1)");

    if (k > 64)
        return this.euclidModInverse(k);

    var t = MutableBigInteger.inverseMod32(this.value[this.offset + this.intLen - 1]);

    if (k < 33) {
        t = (k == 32 ? t : t & ((1 << k) - 1));
        return new MutableBigInteger(t);
    }

    var pLong = Long.fromNumber(this.value[this.offset+this.intLen-1] >>> 32);
    if (this.intLen > 1)
        pLong =  pLong.or(Long.fromInt(this.value[this.offset+this.intLen-2] << 32));
    var tLong = Long.fromNumber(t >>> 32);
    tLong = tLong.multiply(Long.fromInt(2).subtract(pLong.multiply(tLong)));  // 1 more Newton iter step
    tLong = (k == 64 ? tLong : tLong.and(
            Long.fromInt(1).shiftLeft(k).subtract(
                Long.fromInt(1)
            )
        )
    );

    var result = new MutableBigInteger(Common.intArray(2));
    result.value[0] = tLong.shiftRightUnsigned(32).low;
    result.value[1] = tLong.low;
    result.intLen = 2;
    result.normalize();
    return result;
}

/**
 * Uses the extended Euclidean algorithm to compute the modInverse of base
 * mod a modulus that is a power of 2. The modulus is 2^k.
 */
MutableBigInteger.prototype.euclidModInverse = function (k) {
    var b = new MutableBigInteger(1);
    b.leftShift(k);
    var mod = new MutableBigInteger(b);

    var a = new MutableBigInteger(this);
    var q = new MutableBigInteger();
    var r = b.divide(a, q);

    var swapper = b;
    // swap b & r
    b = r;
    r = swapper;

    var t1 = new MutableBigInteger(q);
    var t0 = new MutableBigInteger(1);
    var temp = new MutableBigInteger();

    while (!b.isOne()) {
        r = a.divide(b, q);

        if (r.intLen == 0)
            throw new Error("BigIntegerTest not invertible.");

        swapper = r;
        a = swapper;

        if (q.intLen == 1)
            t1.mul(q.value[q.offset], temp);
        else
            q.multiply(t1, temp);
        swapper = q;
        q = temp;
        temp = swapper;
        t0.add(q);

        if (a.isOne())
            return t0;

        r = b.divide(a, q);

        if (r.intLen == 0)
            throw new Error("BigIntegerTest not invertible.");

        swapper = b;
        b =  r;

        if (q.intLen == 1)
            t0.mul(q.value[q.offset], temp);
        else
            q.multiply(t0, temp);
        swapper = q; q = temp; temp = swapper;

        t1.add(q);
    }
    mod.subtract(t1);
    return mod;
}

/**
* Returns the modInverse of this mod p. This and p are not affected by
* the operation.
*/
MutableBigInteger.prototype.mutableModInverse = function (p) {
  // Modulus is odd, use Schroeppel's algorithm
  if (p.isOdd()) {
    return this.modInverse(p);
  }

  // Base and modulus are even, throw exception
  if (this.isEven())
      throw new Error("BigInteger not invertible.");

  // Get even part of modulus expressed as a power of 2
  var powersOf2 = p.getLowestSetBit();

  // // Construct odd part of modulus
  var oddMod = new MutableBigInteger(p);
  oddMod.rightShift(powersOf2);

  if (oddMod.isOne())
    return this.modInverseMP2(powersOf2);

  // Calculate 1/a mod oddMod
  var oddPart = this.modInverse(oddMod);

  // Calculate 1/a mod evenMod
  var evenPart = this.modInverseMP2(powersOf2);

  // Combine the results using Chinese Remainder Theorem
  var y1 = this.modInverseBP2(oddMod, powersOf2);
  var y2 = oddMod.modInverseMP2(powersOf2);

  var temp1 = new MutableBigInteger();
  var temp2 = new MutableBigInteger();
  var result = new MutableBigInteger();

  oddPart.leftShift(powersOf2);
  oddPart.multiply(y1, result);

  evenPart.multiply(oddMod, temp1);
  temp1.multiply(y2, temp2);

  result.add(temp2);
  return result.divide(p, temp1);
}

// MutableBigIntegerTest mod, int k
MutableBigInteger.prototype.modInverseBP2 = function (mod, k) {
  return fixup(new MutableBigInteger(1), new MutableBigInteger(mod), k);
};

////

function SignedMutableBigInteger(val) {
  if (typeof val === 'undefined') {
    this.value = [0];
    this.intLen = 0;
  } else if (typeof val === 'number') {
    this.value = [0];
    this.intLen = 1;
    this.value[0] = val;
  }
  this.sign = 1;
  this.offset = 0;
}

util.inherits(SignedMutableBigInteger, MutableBigInteger);

/**
 * Signed addition built upon unsigned add and subtract.
 */
SignedMutableBigInteger.prototype.signedAdd = function (addend) {
  if (addend.constructor.name === 'SignedMutableBigInteger') {
    if (this.sign == addend.sign)
      this.add(addend);
    else
      this.sign = this.sign * this.subtract(addend);
  } else if (addend.constructor.name === 'MutableBigInteger') {
    if (this.sign == 1)
      this.add(addend);
    else
      this.sign = this.sign * this.subtract(addend);
  }
}


SignedMutableBigInteger.prototype.signedSubtract = function(addend) {
  if (addend.constructor.name === 'SignedMutableBigInteger') {
    if (this.sign == addend.sign)
      this.sign = this.sign * this.subtract(addend);
    else
    this.add(addend);
  } else if (addend.constructor.name === 'MutableBigInteger') {
    if (this.sign == 1)
      this.sign = this.sign * this.subtract(addend);
    else
      this.add(addend);
    if (this.intLen == 0)
      this.sign = 1;
  }
}

module.exports = MutableBigInteger;
