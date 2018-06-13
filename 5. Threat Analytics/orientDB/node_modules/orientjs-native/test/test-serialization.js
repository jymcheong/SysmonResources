var native = require('bindings')('deserializer');
var RecordID = require('orientjs').RecordID;
var Bag = require('orientjs').RIDBag;
var should = require('should');
var fs = require('fs');

describe("Serialization Native ", function () {


  describe('Simple Document', function () {
    var doc = {
      "@class": "Person",
      "name": "Jack",
      "empty": "",
      "age": 30,
      "active": true
    }
    it('should Serialize a simple document', function () {
      this.serialized = native.serialize(doc);
      should.exist(this.serialized);
    });

    it('should Deserialize a simple document', function () {

      this.record = native.deserialize(this.serialized, RecordID, Bag,function(){

      }, true);
      this.record['@class'].should.equal(doc['@class']);
      this.record.name.should.equal(doc.name);
      this.record.empty.should.equal("");

      this.record.age.should.equal(doc.age);
      this.record.active.should.equal(doc.active);
    });
  })
  describe('Complex Document', function () {


    var doc = {
      "@class": "Person",
      "tags": ['blue','red'],
      "link" : new RecordID("#5:0"),
      //"binary" : new Buffer([ 8, 6, 7, 5, 3, 0, 9]),
      "embedded" : {
        "@class" : "Person",
        "name" : "Frank"
      }
    }
    it('should Serialize a simple document', function () {
      this.serialized = native.serialize(doc);
      should.exist(this.serialized);
    });

    it('should Deserialize a simple document', function () {
      this.record = native.deserialize(this.serialized, RecordID, Bag,function(){}, true);

      this.record.tags.should.be.instanceof(Array)
      this.record.tags.should.containDeep(doc.tags);
      doc.tags.should.containDeep(this.record.tags);
      this.record.link.should.be.instanceOf(RecordID);
      this.record.link.cluster.should.equal(5);
      this.record.link.position.should.equal(0);
      //this.record.binary.toString().should.equal(doc.binary.toString());
      this.record.embedded.should.be.instanceOf(Object);
      this.record.embedded["@class"].should.equal(doc.embedded["@class"]);
      this.record.embedded["name"].should.equal(doc.embedded["name"]);
    });
  })
describe("Deserialize from disk", function () {

    it('should Deserialize from disk content', function (done) {
      fs.readFile("./test/record.bin", function (err, data) {

        if (!err) {

          var input = new Buffer(data, "binary");
          this.record = native.deserialize(input, RecordID, Bag,function(){

          }, true);

          
          done();
        }
      })
    })
  })
});
