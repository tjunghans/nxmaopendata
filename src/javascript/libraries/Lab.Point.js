(function (window, undefined) {
	'use strict';

	namespace('Lab');

	var Lab = window.Lab;

	/**
	 *
	 * @param {number} lat
	 * @param {number} lon
	 * @constructor
	 */
	function Point(lat, lon) {
		this.init(lat, lon);
	}

	Point.prototype = {
		constructor : Point,
		init : function (lat, lon) {
			this.lat = lat;
			this.lon = lon;
		},
		toString : function () {
			return this.lat + ',' + this.lon;
		}
	};

	Lab.Point = Point;
}(window));