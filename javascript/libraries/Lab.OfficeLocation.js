(function($, window, undefined) {
	"use strict";

	var Lab = window.Lab;

	function OfficeLocation(name, x, y) {
		this.init(name, x, y);
	}

	OfficeLocation.prototype = {
		constructor : OfficeLocation,
		init : function (name, x, y) {
			this.name = name;
			this.point = new Lab.Point(x, y);
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