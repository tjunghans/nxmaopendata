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
		 * Distance in km. Reduce this value to increase precision and clusters.
		 *
		 * @type number
		 */
		clusterDistance : 2,

		/**
		 *
		 * @type Cluster
		 */
		clusters : [],

		clusterWorkConnections : [],

		/**
		 * Holds a collection of objects
		 * { workPoint : item[0].workPoint,
		 	clusterCenter : item[0].cluster.getCenter(),
		 	connections : item.length }

		 * This is used to create the connections on the map
		 *
		 * @method formattedClusterWorkConnections
		 */
		formattedClusterWorkConnections : [],

		koModel : {},

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

			// Url for JSONP call
			var url = $ctx.data('url');

			// Templates
			mod.tmplfullDataTable = doT.template($('#tmpl-FullDataTable').html());
			mod.tmplByCompetence = doT.template($('#tmpl-ByCompetence').html());

			mod.koModel = {
				clusterDistance : ko.observable(),
				numberOfEmployees : ko.observable(),
				employeeClusters : ko.observable(),
				clusterWorkConnections : ko.observable()
			};

			// Event handlers
			$ctx.on('dataavailable', $.proxy(mod.generateFullTable, mod));
			$ctx.on('dataavailable', $.proxy(mod.generateCompetenceTable, mod));

			$ctx.on('dataavailable', function (e, data) {

				_.each(data, $.proxy(mod.createClusterAndWorkConnections, mod));

				var groupByWorkCoordinates = _.groupBy(mod.clusterWorkConnections, function (item) {
					return item.workPoint + ';' + item.cluster.getCenter();
				});

				mod.formattedClusterWorkConnections = _.map(groupByWorkCoordinates, function(item, key){
					return {
						workPoint : item[0].workPoint,
						clusterCenter : item[0].cluster.getCenter(),
						connections : item.length
					};
				});

				mod.initMap();

				// Using knockout to fill data column on the right

				mod.koModel.numberOfEmployees(data.length);
				mod.koModel.employeeClusters(mod.clusters.length);
				mod.koModel.clusterDistance(mod.clusterDistance);
				mod.koModel.clusterWorkConnections(mod.formattedClusterWorkConnections.length);

				var groupByWorkplace = _.groupBy(mod.formattedClusterWorkConnections, function (connection) {
					return connection.workPoint;
				});

				console.dir(mod.formattedClusterWorkConnections);

				_.map(mod.formattedClusterWorkConnections, function (item, key) {

				});

				// 1. Add connections
				_.each(mod.formattedClusterWorkConnections, function (connection) {
					mod.addClusterWorkConnection(mod.map, connection.clusterCenter, connection.workPoint, connection.connections);
				});

				// 2. Cluster circles
				_.each(mod.clusters, function (cluster) {
					mod.addClusterLocation(mod.map, cluster.getCenter(), cluster.getPoints().length)
				});

				// 3. Add Namics locations
				_.each(mod.formattedClusterWorkConnections, function (connection) {
					mod.addWorkLocation(mod.map, connection.workPoint)
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

					ko.applyBindings(mod.koModel, $ctx[0]);
				}
			});

			callback();
		},

		/**
		 * Creates the clusters (mod.clusters) and then connections between work and clusters (mod.clusterWorkConnections)
		 * This method is called in a loop.
		 *
		 * @method createClusterAndWorkConnections
		 * @param {object} dataItem, a row from the json response
		 * @return {object} with two properties, clusters and clusterWorkConnections
		 */
		createClusterAndWorkConnections : function (dataItem) {
			var mod = this,
				itemLat = dataItem.properties.geo_latitude,
				itemLon = dataItem.properties.geo_longitude,

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
					workPoint : new Lab.Point(dataItem.properties.geo_latitude_A, dataItem.properties.geo_longitude_A)
				}
			);

			return {
				clusters : mod.clusters,
				clusterWorkConnections : mod.clusterWorkConnections
			}
		},

		/**
		 * Initialises leaflet map
		 *
		 * @method initMap
		 */
		initMap : function () {
			var mod = this;

			mod.map = new L.Map('map');
			// create the tile layer with correct attribution
			var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
			var osmAttrib='Map data Â© OpenStreetMap contributors';
			var osm = new L.TileLayer(osmUrl, {minZoom: 6, maxZoom: 18, attribution: osmAttrib});

			// start the map in South-East England
			mod.map.setView(new L.LatLng(47.3717,8.5359),8);
			mod.map.addLayer(osm);
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
