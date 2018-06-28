/**
 *
 * EXPORT command does not save server functions out
 * Here's a basic javascript example. 
 * Need to turn 'on' javascript language since it is disabled by default due to security
 * Paste the whole thing into Function Management script editor & so on to 'install' 
 */

var db = orient.getDatabase();

// positional parameters for queries eg. when function has inputs, always use parameterized query!
var r = db.query('select from ProcessAccess where ToBeProcessed = true Order By EventTime LIMIT ?', 100);

// this prints to the console where DB was started
print(r.length)

// for each record processing example loop
for(var i = 0; i < r.length; i++) {
    print(r[i].getProperty('@rid')) //accessing a property/field
}

// besides returning results to caller, one can see the contents within below
return r 