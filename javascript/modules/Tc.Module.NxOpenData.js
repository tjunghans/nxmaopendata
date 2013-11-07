(function($, window) {
	"use strict";

	/**
	 * Default module implementation.
	 *
	 * @author Thomas Junghans
	 * @namespace Tc.Module
	 * @class NxOpenData
	 * @extends Tc.Module
	 */
	Tc.Module.NxOpenData = Tc.Module.extend({

		/**
		 * Distance in km
		 *
		 * @type number
		 */
		clusterDistance : 10,

		/**
		 *
		 * @type Cluster
		 */
		clusters : [],

		/**
		 * Hook function to do all of your module stuff.
		 *
		 * @method on
		 * @param {Function} callback function
		 * @return void
		 */
		on: function(callback) {
			var mod = this,
				$ctx = mod.$ctx;

			var url = '/resources/nxopendata.json';
			var tmplfullDataTable = doT.template($('#tmpl-FullDataTable').html());
			var tmplByCompetence = doT.template($('#tmpl-ByCompetence').html());


			$ctx.on('dataavailable', function (e, data) {
				$ctx.find('.widget-table').html(tmplfullDataTable(data));
			});

			$ctx.on('dataavailable', function (e, data) {
				var byCompetence = _.countBy(data, function(obj){
					return obj.properties['Kompetenz'];
				});

				var competenceList = [];

				 _.each(byCompetence, function (value, key, list) {
					competenceList.push({
						competence : key,
						count : value
					});
				});

				$ctx.find('.widget-competence').html(tmplByCompetence(competenceList));
			});

			$ctx.on('dataavailable', function (e, data) {

				console.log('Entries : ', data.length);
				_.each(data, function (item, key, list) {

					var itemLat = item.properties.geo_latitude,
						itemLon = item.properties.geo_longitude,
						itemPoint = new Point(itemLat, itemLon);

					// First check clusters
					var cluster = mod.findClusterWithinDistance(itemPoint, mod.clusterDistance);

					// If no cluster is found, a new one is created
					if (cluster === null) {

						//mod.getLatLonWithinDistance(itemLat, itemLon, data, mod.clusterDistance);

						var newCluster = new Cluster(itemPoint);

						mod.clusters.push(newCluster);

					} else {
						cluster.addPoint(itemPoint);
					}

				});

				console.log('Clusters :', mod.clusters.length);
				_.each(mod.clusters, function (cluster) {
					console.log(cluster.getCenter(), cluster.getPoints().length);
				});

			});

			/**
			 * For each latlng iterate through existing clusters (get their center)
			 */

			$.ajax({
				url : url,
				dataType : 'json',
				success : function (data) {

					mod.$ctx.trigger('dataavailable', [data.features]);
				}
			});

			callback();
		},

		calculateDistance : function (lat1, lon1, lat2, lon2) {
			var p1 = new LatLon(lat1, lon1);
			var p2 = new LatLon(lat2, lon2);
			return p1.distanceTo(p2);          // in km
		},

		/**
		 * @param {number} lat
		 * @param {number} lon
		 * @param {object} data as received (json)
		 * @param {number} distance in km
		 */
		getLatLonWithinDistance : function (lat, lon, data, distance) {
			var mod = this,
				latLonWithinDistance = [];

			_.each(data, function (item, key, list) {

				var itemLat = item.properties.geo_latitude,
					itemLon = item.properties.geo_longitude;

				//mod.calculateDistance(lat, lon, itemLat, itemLon), distance);
			});

		},

		/**
		 *
		 * @param {Point} point
		 * @param {number} distance
		 * @returns {null|Cluster} returns cluster on success
		 */
		findClusterWithinDistance : function (point, distance) {
			var mod = this;

			for (var i = 0, ii = mod.clusters.length; i < ii; i++) {
				var center = mod.clusters[i].getCenter();

				if (mod.calculateDistance(point.lat, point.lon, center.lat, center.lon) <= distance) {
					return mod.clusters[i];
				}
			}

			return null;
		}

	});

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

			return new Point(latTotal / pointsCount, lonTotal / pointsCount);

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
	}
}(Tc.$, window));
