(function($, window, undefined) {

	'use strict';

	namespace('Lab');

	var Lab = window.Lab,
		Point = Lab.Point;

	function OfficeLocation(name, x, y) {
		this.init(name, x, y);
	}

	OfficeLocation.prototype = {
		constructor : OfficeLocation,
		init : function (name, x, y) {
			this.name = name;
			this.point = new Point(x, y);
			this.id = x + ',' + y;
		},
		getName : function () {
			return this.name;
		},
		getPoint : function () {
			return this.point;
		},
		getId : function () {
			return this.id;
		}
	};

	Lab.OfficeLocation = OfficeLocation;

}(jQuery, window));