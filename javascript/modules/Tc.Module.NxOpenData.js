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
		clusterDistance : 0.1,

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

				var map = new L.Map('map');
				// create the tile layer with correct attribution
				var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
				var osmAttrib='Map data Â© OpenStreetMap contributors';
				var osm = new L.TileLayer(osmUrl, {minZoom: 6, maxZoom: 18, attribution: osmAttrib});

				// start the map in South-East England
				map.setView(new L.LatLng(47.3717,8.5359),8);
				map.addLayer(osm);


				// DEBUG START
				console.log('Entries : ', data.length);
				console.log('Clusters :', mod.clusters.length);
				console.log('Total connections on map: ', clusterWorkConnections.length);
				// DEBUG END

				// 1. Add connections
				_.each(clusterWorkConnections, function (connection) {
					mod.addClusterWorkConnection(map, connection.clusterCenter, connection.workPoint, connection.connections);
				});

				// 2. Cluster circles
				_.each(mod.clusters, function (cluster) {
					mod.addClusterLocation(map, cluster.getCenter(), cluster.getPoints().length)
				});

				_.each(clusterWorkConnections, function (connection) {
					mod.addWorkLocation(map, connection.workPoint)
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

		addClusterLocation : function (map, point, clusterSize) {
			var circle = L.circle([point.lat, point.lon], 500 * clusterSize, {
				color: 'red',
				fillColor: '#f03',
				fillOpacity: 0.5
			}).addTo(map);

			circle.bindPopup('Leute die hier wohnen: ' + clusterSize);
		},

		addWorkLocation : function (map, point) {
			var circle = L.circle([point.lat, point.lon], 300, {
				color: 'lightgreen',
				fillColor: '#0f0',
				fillOpacity: 1
			}).addTo(map);
		},

		addClusterWorkConnection : function (map, clusterCenter, workPoint, connections) {
			var polygon = L.polygon([
				[clusterCenter.lat, clusterCenter.lon],
				[workPoint.lat, workPoint.lon]
			], {
				weight: connections,
				opacity: 0.5
			}).addTo(map);
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
