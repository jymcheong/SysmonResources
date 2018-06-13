"use strict"


var serializer = require('bindings')('deserializer')


exports.deserialize = serializer.deserialize;
exports.serialize = serializer.serialize;
