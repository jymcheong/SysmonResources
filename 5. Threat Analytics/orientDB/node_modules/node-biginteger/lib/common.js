var Long = require('long');
var Integer = require('./Integer');

exports.copyOfRange = function (original, from, to) {
  var newLength = to - from;
  if (newLength < 0)
      throw new Error(from + " > " + to);
  var copy = new Array(newLength);
  arraycopy(original, from, copy, 0, Math.min(original.length - from, newLength));
  return copy;
}

var arraycopy = exports.arraycopy = function (src, srcPos, dest, destPos, length) {
  for (var i = srcPos; i < (srcPos + length); i++) {
    dest[destPos++] = src[i];
  }
};

var intArray = exports.intArray = function (length) {
  var array = new Array(length);
  for (var i = 0; i < length; i++) {
    array[i] = 0;
  }
  return array;
};

exports.copyOf = function (original, newLength) {
  var copy = intArray(newLength);
  arraycopy(original, 0, copy, 0, Math.min(original.length, newLength));
  return copy;
}

exports.longString = function (i, radix) {
  if (radix < 2 || radix > 36)
    radix = 10;
  if (radix === 10)
    return i.toString();
  var buf = new Array(65);
  var charPos = 64;
  var negative = i.compare(Long.ZERO) < 0;

  if (!negative) {
    i = i.negate();
  }
  radix = Long.fromInt(radix);
  var _radix = radix.negate();
  while (i.compare(_radix) <= 0) {
    var rem = i.subtract(i.div(radix).multiply(radix));
    buf[charPos--] = Integer.digits[rem.negate().low];
    i = i.div(radix);
  }
  buf[charPos] = Integer.digits[i.negate().low];

  if (negative) {
    buf[--charPos] = '-';
  }
  return exports.copyOfRange(buf, charPos, 65).join('');
};

exports.debug = function (a,b,c,d,e,f) {
  console.log(a,
    JSON.stringify(b),
    JSON.stringify(c),
    JSON.stringify(d),
    JSON.stringify(e),
    JSON.stringify(f)
  );
}