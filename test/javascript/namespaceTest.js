(function (window) {
	'use strict';


	module("namespace", {
		setup: function() {
		}, teardown: function() {
		}
	});

	test("namespace", function() {
		var baz = window.namespace('foo.bar.baz');

		strictEqual(typeof(window.foo.bar.baz) === 'object', true);
		deepEqual(baz, {});

	});


}(window));