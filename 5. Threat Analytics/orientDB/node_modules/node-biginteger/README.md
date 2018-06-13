node-biginteger
======

This library is based on [java.math.BigInteger](http://docs.oracle.com/javase/7/docs/api/java/math/BigInteger.html)
Dependency [Long](https://github.com/dcodeIO/Long.js.git)

example
======

```
  $ npm install node-biginteger

  var BigInteger = require('node-biginteger');
  var n = BigInteger.fromString('abc', 16);
  n.toString(16);
  
```

Class Method: BigInteger.fromLong(val)
------
- val Long
- Return: BigInteger

Class Method: BigInteger.fromString(val, [radix])
------
- val String
- radix int,Optional, Default: 10
- Return: BigInteger

Class Method: BigInteger.fromBuffer(signum, magnitude)
------
- signum int, 1,0,-1
- magnitude Array
- Return: BigInteger

n.toBuffer()
------
- Return: Buffer

n.toString()
------
- Return: String

n.abs()
------
- Return: BigInteger

n.negate()
------
- Return: BigInteger

n.longValue()
------
- Return: Long

n.add(val)
------
- val BigInteger
- Return: BigInteger

n.subtract(val)
------
- val BigInteger
- Return: BigInteger

n.multiply(val)
------
- val BigInteger
- Return: BigInteger

n.and(val)
------
- val BigInteger
- Return: BigInteger

n.andNot(val)
------
- val BigInteger
- Return: BigInteger

n.not()
------
- Return: BigInteger

n.pow(exponent)
------
- exponent int
- Return: BigInteger

```
  var n = BigInteger.fromString('2', 10);
  var n1 = n.pow(2);
  console.log(n1.toString());
  // 4
```

n.divide(val)
------
- val BigInteger
- Return: BigInteger 

n.remainder(val)
- val BigInteger
- Return: BigInteger

Benchmark
------
```
$ node beanchmark.js

  BigInteger#multiply x 68,912 ops/sec ±0.50% (100 runs sampled)
  bignum#mul x 40,709 ops/sec ±1.30% (90 runs sampled)
  BigInteger#modPow(long) x 79.62 ops/sec ±0.98% (71 runs sampled)
  bignum#powm(long) x 22,901 ops/sec ±2.43% (92 runs sampled)
  BigInteger#modPow(short) x 134,965 ops/sec ±1.19% (97 runs sampled)
  bignum#powm(short) x 55,922 ops/sec ±2.84% (91 runs sampled)
```

## License
MIT




