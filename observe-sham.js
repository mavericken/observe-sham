(function (globals, factory) {
	if (typeof define === 'function' && define.amd) define(factory); // AMD
	else if (typeof exports === 'object') module.exports = factory(); // Node
	else globals['observe'] = factory(); // globals
}(this, function () {

	var ARRAY_MUTATOR_METHODS = ["pop", "push", "reverse", "shift", "sort", "splice", "unshift"];

	return function observe(o, notify, signature) {

		var observable,
			isArray = Array.isArray(o) || o instanceof Array;

		if(isArray){
			observable = o.slice()
		} else if (typeof o === 'function' || typeof o === 'object' && !!o){
			observable = Object.create(Object.getPrototypeOf(o))
		} else {
			return o // supposed not observable
		}

		//TODO: use ES6 Proxy if available
		function observeKey(key){
			var keySignature = signature ? signature + "." + key : key,
				propertyDescriptor = Object.getOwnPropertyDescriptor(o, key);
			o[key] = observe(o[key], notify, keySignature);
			if(propertyDescriptor && propertyDescriptor.configurable){
				propertyDescriptor.get = function () { return o[key]; };
				propertyDescriptor.set = function (val) {
					o[key] = val;
					notify("set", keySignature, val)
				};
				delete propertyDescriptor.value;
				delete propertyDescriptor.writable;
				Object.defineProperty(observable, key, propertyDescriptor)
			}
		}

		if (isArray) {
			ARRAY_MUTATOR_METHODS.forEach(function (method) {
				Object.defineProperty(observable, method, { configurable: true, value: function () {
					var start, nbToAdd, nbToRemove, returnValue, i;
					switch(method){
						case "pop": start = o.length-1; nbToRemove=1; nbToAdd=0; break;
						case "push": start = o.length; nbToRemove=0; nbToAdd=arguments.length; break;
						case "reverse": case "sort": start=0; nbToRemove=o.length; nbToAdd=o.length; break;
						case "shift": start=0; nbToRemove=1; nbToAdd=0; break;
						case "unshift": start=0; nbToRemove=0; nbToAdd=arguments.length; break;
						case "splice": start=arguments[0]; nbToRemove=arguments[1]; nbToAdd=arguments.length-2; break;
					}
					returnValue = o[method].apply(o, arguments);
					observable.length = o.length; // to fix holes if array has been shortened
					for(i=0; i<nbToAdd; i++){
						observeKey(start+i, notify, (signature||'')+'['+(start+i)+']')
					}
					notify("splice", signature, start, nbToRemove, nbToAdd);
					return returnValue
				}});
			});
		}

		Object.getOwnPropertyNames(o).forEach(observeKey);

		return observable
	}
}));