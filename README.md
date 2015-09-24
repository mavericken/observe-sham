# observe-sham
Basic object/array change detection in ES5

observe() takes an object or array passed as first argument and returns an observable version of this object,
notifying changes on this object through the handler function passed as second argument.

Two types of changes are notified:
* `set (signature, value)` when a property is reassigned
* `splice (signature, start, nbRemoved, nbAdded)` when an array is mutated through a method like push/splice...

Internally use ES5 getter/setters, no polling nor useless checks

### Example

```
var observable = observe({ x: 21, array: [1,2,3] }, function(){ console.log(arguments) })

observable.x = 42;  //logs: ['set', 'x', 42]
observable.x++;     //logs: ['set', 'x', 43]

observable.array.push(4,5,6); // logs:  ['splice', 'array', 3, 0, 3]
observable.array.pop();       // logs:  ['splice', 'array', 5, 1, 0]
```

### Limitations

* Changes are not detected on new properties added after observe() call
* Changes are not detected on arrays extended by reassigning the length property or assigning an index over the current length. Use push or splice instead
