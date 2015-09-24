QUnit.test("test globals", function(assert){
	function detectGlobals(callback){

		function getIFrame(url, callback) {
			var elIframe = document.createElement('iframe')
			elIframe.style.display = 'none';
			document.body.appendChild(elIframe);
			elIframe.src = url || 'about:blank';
			elIframe.onload = function(){
				callback(elIframe.contentWindow || elIframe.contentDocument);
			}
		}

		getIFrame("iframe-empty.html", function(ref){
			getIFrame("iframe-lib.html", function(frame){
				var differences = {},
					exceptions = ''.split(','),
					i;

				for (i in frame) {
					if(i in ref === false){
						differences[i] = {
							'type': typeof window[i],
							'val': window[i]
						}
					}
				}

				i = exceptions.length;
				while (--i) {
					delete differences[exceptions[i]]
				}

				callback(differences);
			})
		})

	}

	var done = assert.async();
	detectGlobals(function(newGlobals){
		assert.ok("observe" in newGlobals);
		assert.ok(Object.keys(newGlobals).length === 1);
		assert.ok(newGlobals.observe.type === "function");
		done();
	});

})

var dummyNotifier = function(){}

QUnit.test('should return similar object', function(assert) {
	var o = { x: 42 };
	var O = observe(o,dummyNotifier);
	assert.ok(typeof O === "object")
	assert.ok(O.x === 42)
	assert.ok(Object.keys(O).length === 1)

	o.nested = { property: true };
	O = observe(o);
	assert.ok(O.nested.property === true)
	assert.ok(O.nested.property === true)
})


QUnit.test('should return similar array', function(assert) {
	var a = [1,2,3]
	var A = observe(a,dummyNotifier);
	assert.equal(typeof A, "object")
	assert.ok(a instanceof Array)
	assert.ok(Array.isArray(a))
	assert.equal(A.length, 3)
	assert.equal(A.join(','), '1,2,3')

	var o = { nested: { property: [4,5,6,7] } };
	var O = observe(o,dummyNotifier);
	assert.equal(O.nested.property.length, 4)
	assert.equal(O.nested.property.join(','), '4,5,6,7')
})

QUnit.test('observe set objects', function(assert){

	var notifs=[];

	var o = { x: 42 };
	var O = observe(o, function(){ notifs.push([].slice.call(arguments)) })
	o.x++;
	O.x++;


	assert.equal(o.x, 44)
	assert.equal(O.x, 44)
	assert.equal(notifs.length, 1)
	assert.equal(notifs[0].join(' '), 'set x 44')

	o.nested = { property: "h" };
	O = observe(o, function(){ notifs.push([].slice.call(arguments)) })
	notifs=[];

	o.nested.property+="el";
	O.nested.property+="lo";
	assert.equal(o.nested.property, "hello")
	assert.equal(O.nested.property, "hello")
	assert.equal(notifs.length, 2)
	assert.equal(notifs[0].join(' '), 'set nested.property hel')
	assert.equal(notifs[1].join(' '), 'set nested.property hello')

	o.a = [1,2,3];
	O = observe(o, function(){ notifs.push([].slice.call(arguments)) })
	notifs=[];

	o.a = [4,5,6];
	O.a = [7,8,9];

	assert.equal(o.a.join(','), "7,8,9")
	assert.equal(notifs.length, 1)
	assert.equal(notifs[0].join(' '), 'set a 7,8,9')

	O = observe(o, function(){ notifs.push([].slice.call(arguments)) })
	notifs = [];

	o.a[1] = 4;
	O.a[2] = 7;

	assert.equal(o.a.join(','), "7,4,7")
	assert.equal(notifs.length, 2)
	assert.equal(notifs[0].join(' '), 'set a.1 4')
	assert.equal(notifs[1].join(' '), 'set a.2 7')


})

QUnit.test('observe splice arrays', function(assert){

	var notifs=[];
	var a = [];
	var A = observe(a, function(){ notifs.push([].slice.call(arguments)) });
	A.push(1,2,null);
	A.splice(2,1,3,4);
	A.reverse();
	A.shift()
	A.unshift(5,4);
	A.sort(function(a,b){ return a-b })
	A.pop()

	assert.equal(A.join(','), "1,2,3,4")
	assert.equal(A.length, 4)
	assert.equal(notifs.length, 7)
	assert.equal(notifs[0].join(' '), 'splice  0 0 3')
	assert.equal(notifs[1].join(' '), 'splice  2 1 2')
	assert.equal(notifs[2].join(' '), 'splice  0 4 4')
	assert.equal(notifs[3].join(' '), 'splice  0 1 0')
	assert.equal(notifs[4].join(' '), 'splice  0 0 2')
	assert.equal(notifs[5].join(' '), 'splice  0 5 5')
	assert.equal(notifs[6].join(' '), 'splice  4 1 0')

	notifs=[];
	o = { a: [] };
	O = observe(o, function(){ notifs.push([].slice.call(arguments)) });
	o.a.push(1,2,null);
	O.a.splice(2,1,3,4);
	o.a.reverse();
	O.a.shift()
	o.a.unshift(5,4);
	O.a.sort(function(a,b){ return a-b })
	o.a.pop()

	assert.equal(o.a.join(','), "1,2,3,4")
	assert.equal(O.a.join(','), "1,2,3,4")
	assert.equal(o.a.length, 4)
	assert.equal(O.a.length, 4)
	assert.equal(notifs.length, 7)
	assert.equal(notifs[0].join(' '), 'splice a 0 0 3')
	assert.equal(notifs[1].join(' '), 'splice a 2 1 2')
	assert.equal(notifs[2].join(' '), 'splice a 0 4 4')
	assert.equal(notifs[3].join(' '), 'splice a 0 1 0')
	assert.equal(notifs[4].join(' '), 'splice a 0 0 2')
	assert.equal(notifs[5].join(' '), 'splice a 0 5 5')
	assert.equal(notifs[6].join(' '), 'splice a 4 1 0')

})

QUnit.test("observe new array indexes after mutation", function(assert){

	var notifs=[];
	var a = [1,null,3];
	var A = observe(a, function(){ notifs.push([].slice.call(arguments)) });
	A[1] = 2;
	A.push(4,5,null)
	A[5] = 6;

	assert.equal(A.length, 6)
	assert.equal(A.join(','), "1,2,3,4,5,6")
	assert.equal(notifs.length, 3)
	assert.equal(notifs[0].join(' '), 'set 1 2')
	assert.equal(notifs[1].join(' '), 'splice  3 0 3')
	assert.equal(notifs[2].join(' '), 'set 5 6')
})