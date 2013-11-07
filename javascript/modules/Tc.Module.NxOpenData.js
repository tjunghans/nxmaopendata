(function($, window) {
	"use strict";

	var Lab = window.Lab;

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
		clusterDistance : 20,

		/**
		 *
		 * @type Cluster
		 */
		clusters : [],

		clusterWorkConnections : [],

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
			mod.tmplfullDataTable = doT.template($('#tmpl-FullDataTable').html());
			mod.tmplByCompetence = doT.template($('#tmpl-ByCompetence').html());

			$ctx.on('dataavailable', $.proxy(mod.generateFullTable, mod));
			$ctx.on('dataavailable', $.proxy(mod.generateCompetenceTable, mod));

			$ctx.on('dataavailable', function (e, data) {

				_.each(data, function (item, key, list) {

					var itemLat = item.properties.geo_latitude,
						itemLon = item.properties.geo_longitude,
						itemPoint = new Lab.Point(itemLat, itemLon),
						usedCluster = null;

					// First check clusters
					var cluster = mod.findClusterWithinDistance(itemPoint, mod.clusterDistance);

					// If no cluster is found, a new one is created
					if (cluster === null) {

						var newCluster = new Lab.Cluster(itemPoint);

						mod.clusters.push(newCluster);
						usedCluster = newCluster;

					} else {
						cluster.addPoint(itemPoint);
						usedCluster = cluster;
					}

					mod.clusterWorkConnections.push(
						{
							cluster : usedCluster,
							workPoint : new Lab.Point(item.properties.geo_latitude_A, item.properties.geo_longitude_A)
						}
					);

				});

				var groupByWorkCoordinates = _.groupBy(mod.clusterWorkConnections, function (item) {
					return item.workPoint + ';' + item.cluster.getCenter();
				});

				var clusterWorkConnections = _.map(groupByWorkCoordinates, function(item, key){
					return {
						workPoint : item[0].workPoint,
						clusterCenter : item[0].cluster.getCenter(),
						connections : item.length
					};
				});

				// DEBUG START
				console.log('Entries : ', data.length);
				console.log('Clusters :', mod.clusters.length);
				console.log('Total connections on map: ', clusterWorkConnections.length);

				// 1. Location circles
				_.each(mod.clusters, function (cluster) {
					console.log(cluster.getCenter(), cluster.getPoints().length);
				});

				console.dir(clusterWorkConnections);

				// DEBUG END

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
		 * @method findClusterWithinDistance
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
		},

		generateFullTable : function (e, data) {
			var mod = this,
				$ctx = mod.$ctx;

			$ctx.find('.widget-table').html(mod.tmplfullDataTable(data));
		},

		generateCompetenceTable : function (e, data) {
			var mod = this,
				$ctx = mod.$ctx;

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

			$ctx.find('.widget-competence').html(mod.tmplByCompetence(competenceList));

		}

	});




}(Tc.$, window));
