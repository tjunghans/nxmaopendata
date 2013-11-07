(function (window, undefined) {
	function Cluster(point) {
		this.points = [];
		this.center = null;
		this.init(point);
	}

	Cluster.prototype = {
		constructor : Cluster,
		init : function (point) {

			this.addPoint(point);
			this.center = this.getCenter();
		},

		/**
		 *
		 * @param {Point} point
		 */
		addPoint : function (point) {
			this.points.push(point);
			this._setCenter();
		},

		_determineCenter : function (points) {
			var pointsCount = points.length;
			var latTotal = 0;
			var lonTotal = 0;

			_.each(points, function (point, index, list) {
				latTotal += point.lat;
				lonTotal += point.lon;
			});

			return new Lab.Point(latTotal / pointsCount, lonTotal / pointsCount);

		},

		_setCenter : function () {
			this.center = this._determineCenter(this.points);
		},

		getCenter : function () {
			return this.center;
		},

		getPoints : function () {
			return this.points;
		}
	};

	window.Lab = window.Lab || {};
	window.Lab.Cluster = Cluster;
}(window));