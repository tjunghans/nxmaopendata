(function (window, undefined) {

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
		}
	};

	window.Lab = window.Lab || {};
	window.Lab.Point = Point;
}(window));