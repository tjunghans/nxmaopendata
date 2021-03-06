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
		clusterDistance : 1,

		mapCenter : {
			lat : 47.3647388,
			lon : 8.5312022
		},

		/**
		 *
		 * @type Cluster
		 */
		clusters : [],

		clusterWorkConnections : [],

		map : null,

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

		namicsOffices : {},

		averageDistanceLayers : [],

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
			var urlNamicsPeopleLocations = $ctx.data('namics-ppl-locations'),
				urlNamicsOffices = $ctx.data('namics-offices');

			// Templates
			//mod.tmplfullDataTable = doT.template($('#tmpl-FullDataTable').html());
			//mod.tmplByCompetence = doT.template($('#tmpl-ByCompetence').html());
			mod.tmplOfficeNavigation = doT.template($('#tmpl-OfficeNavigation').html());

			mod.koModel = {
				clusterDistance : ko.observable(),
				numberOfEmployees : ko.observable(),
				employeeClusters : ko.observable(),
				clusterWorkConnections : ko.observable(),
				minDistance : ko.observable(),
				maxDistance : ko.observable(),
				radioSelectedOptionValue : ko.observable(mod.clusterDistance),
				showAverageDistance : ko.observable()
			};

			mod.koModel.radioSelectedOptionValue.subscribe($.proxy(mod.changeClusterDistance, mod));
			mod.koModel.showAverageDistance.subscribe($.proxy(mod.toggleAvgDistanceLayer, mod));

			// Event handlers
			//$ctx.on('dataready', $.proxy(mod.generateFullTable, mod));

			// Displays competency count. Currently commented out, because no data is available
			//$ctx.on('dataready', $.proxy(mod.generateCompetenceTable, mod));

			$ctx.on('dataready', function () {
				/**
				 * Holds properties for each work location. The key is made up of the latitude and longitude eg. ["47.3647388,8.5312022"].
				 * Each work location objects holds an array of all
				 * @type {Object}
				 */
				mod.workPlaceMappings = _.groupBy(mod.employeeCollection.getCollection(), function (item) {
					return item.workGeo;
				});

				_.each(mod.workPlaceMappings, function (workPlace, key) {
					var workers = workPlace.length,
						point = mod.namicsOffices[key].point,
						totalDistance = 0;

					_.each(workPlace, function (employee) {
						var lat = employee.geo.lat,
							lon = employee.geo.lon;

						totalDistance += mod.calculateDistance(point.lat, point.lon, lat, lon);
					});

					// Extend the original data (TODO: Refactor since we shouldn't extend what isn't ours)
					$.extend(workPlace, {
						totalDistanceRounded : Math.round(totalDistance * 100) / 100,
						averageDistanceRounded : Math.round(totalDistance / workers * 100) / 100
					});


				});

				mod.workPlaces = _.map(mod.workPlaceMappings, function (value, key) {
					var latLon = key.split(',');

					return {
						workPlacePoint : new Lab.Point(latLon[0], latLon[1]),
						employees : value.length,
						totalDistanceRounded : value.totalDistanceRounded,
						averageDistanceRounded : value.averageDistanceRounded

					}
				});

				mod.addAverageDistanceLayers();

				mod.koModel.numberOfEmployees(mod.employeeCollection.getSize());
				mod.koModel.minDistance(mod.employeeCollection.getMinDistanceToWork());
				mod.koModel.maxDistance(mod.employeeCollection.getMaxDistanceToWork());

				mod.initMapWidget();
			});

			$ctx.on('dataavailable', function (e, peopleLocationData, officeLocationData) {

				// Prepare data
				mod.prepareOfficeLocationData(officeLocationData);

				mod.officeLocationBounds = _.map(mod.namicsOffices, function (item) {
					return [item.point.lat, item.point.lon];
				});

				mod.employeeCollection = new Lab.EmployeeCollection(peopleLocationData);

				// All data is ready for usage
				$ctx.trigger('dataready');

			});

			$ctx.on('click', '.widget-map-navigation button', function () {
				mod.map.panTo(new L.LatLng($(this).data('lat'), $(this).data('lon')));
			});

			$ctx.on('click', '.show-all', $.proxy(mod.showAllOfficeLocations, mod));

			// Fetch data
			$.when(
				$.getJSON(urlNamicsPeopleLocations),
				$.getJSON(urlNamicsOffices)
			).done(function (a, b) {
				var peopleLocationData = a[0],
					officeLocationData = b[0];

				mod.$ctx.trigger('dataavailable', [peopleLocationData.features, officeLocationData]);
			});

			ko.applyBindings(mod.koModel, $ctx[0]);

			callback();
		},

		addAverageDistanceLayers : function () {
			var mod = this;

			_.each(mod.workPlaces, function (workPlace) {
				var lat = workPlace.workPlacePoint.lat,
					lon = workPlace.workPlacePoint.lon;

				var circle = new L.circle(new L.LatLng(lat, lon), workPlace.averageDistanceRounded * 1000, {
					color: '#f00',
					opacity: 0.3,
					weight: 5,
					fill : false,
					stroke: true
				});

				mod.averageDistanceLayers.push(circle);

				circle.bindPopup('Durschnittliche Distanz in Km (Luftweg): ' + workPlace.averageDistanceRounded);
			});
		},

		prepareOfficeLocationData : function (officeLocationData) {
			var mod = this,
				$ctx = mod.$ctx;

			_.each(officeLocationData, function (item) {
				var location = new Lab.OfficeLocation(item.name, item.point[0], item.point[1]);
				mod.namicsOffices[location.getId()] = {
					name : location.getName(),
					point : location.getPoint()
				}
			});

			var namicsOfficesFormattedForTemplate = _.map(mod.namicsOffices, mod.namicsOfficeMapper);

			$ctx.find('.widget-map-navigation').html(mod.tmplOfficeNavigation(namicsOfficesFormattedForTemplate));
		},

		namicsOfficeMapper : function (location) {
			return {
				point : location.point,
				name : location.name
			}
		},

		resetMap : function () {
			var mod = this;

			mod.clusterWorkConnectionLayer.clearLayers();

			mod.clusterLocationLayer.clearLayers();

			mod.workLocationLayer.clearLayers();

			mod.clusters = [];
			mod.clusterWorkConnections = [];

			mod.initMapWidget();
		},

		initMapWidget : function () {
			var mod = this,
				$ctx = mod.$ctx;

			_.each(mod.employeeCollection.getCollection(), $.proxy(mod.createClusterAndWorkConnections, mod));

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

			if (mod.map === null) {
				mod.initMap(); // TODO: Refactor
			}

			// Using knockout to fill data column on the right
			mod.koModel.employeeClusters(mod.clusters.length);
			mod.koModel.clusterDistance(mod.clusterDistance);
			mod.koModel.clusterWorkConnections(mod.formattedClusterWorkConnections.length);


			// 1. Add connections
			_.each(mod.formattedClusterWorkConnections, function (connection) {
				mod.addClusterWorkConnection(mod.map, connection.clusterCenter, connection.workPoint, connection.connections);
			});

			// 1.1 The shapes are first added to the layer and then the layer is added to the map
			mod.clusterWorkConnectionLayer.addTo(mod.map);

			// 2. Cluster circles
			_.each(mod.clusters, function (cluster) {
				mod.addClusterLocation(mod.map, cluster.getCenter(), cluster.getPoints().length)
			});

			// 2.1
			mod.clusterLocationLayer.addTo(mod.map);

			// 3. Add Namics locations
			_.each(mod.formattedClusterWorkConnections, function (connection) {
				mod.addWorkLocation(mod.map, connection.workPoint)
			});

			// 3.1
			mod.workLocationLayer.addTo(mod.map);

		},

		/**
		 * distance is the distance between two employee home locations in km
		 * @param {number} distance
		 */
		changeClusterDistance : function (distance) {
			var mod = this;
			mod.clusterDistance = parseFloat(distance);
			mod.resetMap();
		},

		/**
		 * Zooms map out to show all office locations
		 */
		showAllOfficeLocations : function () {
			var mod = this;

			mod.map.fitBounds(mod.officeLocationBounds);
		},

		showAverageDistanceLayer : function () {
			var mod = this;

			_.each(mod.averageDistanceLayers, function (circle) {
				mod.averageDistanceLayer.addLayer(circle);
			});

			mod.averageDistanceLayer.addTo(mod.map);

		},

		hideAverageDistanceLayer : function () {
			var mod = this;

			mod.averageDistanceLayer.clearLayers()
		},

		toggleAvgDistanceLayer : function (show) {
			var mod = this;
			if (show === true) {
				mod.showAverageDistanceLayer();
			} else {
				mod.hideAverageDistanceLayer();
			}
		},

		/**
		 * Creates the clusters (mod.clusters) and then connections between work and clusters. The connections are added to
		 * mod.clusterWorkConnections.
		 *
		 * This method is called in a loop.
		 *
		 * @method createClusterAndWorkConnections
		 * @param {Lab.Employee} employee
		 * @return {boolean} true on success
		 */
		createClusterAndWorkConnections : function (employee) {

			if ((employee instanceof Lab.Employee) === false) {
				return false;
			}

			var mod = this,
				employeeGeo = employee.geo,
				cluster,
				newCluster = null,
				usedCluster = null;


			// First check clusters
			cluster = mod.findClusterWithinDistance(employeeGeo, mod.clusterDistance);

			// If no cluster is found, a new one is created
			if (cluster === null) {

				newCluster = new Lab.Cluster(employeeGeo);
				mod.clusters.push(newCluster);
				usedCluster = newCluster;

			} else {

				// If a cluster is found, at the employee to it
				cluster.addPoint(employeeGeo);
				usedCluster = cluster;
			}

			mod.clusterWorkConnections.push(
				{
					cluster : usedCluster,
					workPoint : employee.workGeo
				}
			);

			return true;

		},

		/**
		 * Initialises leaflet map
		 *
		 * @method initMap
		 */
		initMap : function () {
			var mod = this,
				osm;

			if (mod.map === null) {
				mod.map = new L.Map('map');
			}
			// create the tile layer with correct attribution
			var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
			var osmAttrib='Map data Â© OpenStreetMap contributors';

			// Original Layer
			osm = new L.TileLayer(osmUrl, {minZoom: 6, maxZoom: 18, attribution: osmAttrib});

			// Source of other layers: https://github.com/leaflet-extras/leaflet-providers
			//osm = L.tileLayer.provider('Stamen.Toner');
			osm = L.tileLayer.provider('Nokia.normalGreyDay');

			mod.map.addLayer(osm);

			// Create Layer for clusters, connections and namics locations
			mod.clusterLocationLayer = new L.layerGroup();
			mod.clusterWorkConnectionLayer = new L.layerGroup();
			mod.workLocationLayer = new L.layerGroup();
			mod.averageDistanceLayer = new L.layerGroup();

			mod.map.setView(new L.LatLng(mod.mapCenter.lat, mod.mapCenter.lon),12);
		},

		getEmployeeNumberByWorkLocation : function (workPoint) {
			var mappingKey = workPoint.lat + ',' + workPoint.lon;

			return this.workPlaceMappings[mappingKey].length;
		},

		addClusterLocation : function (map, point, clusterSize) {


			var mod = this,
				radius = 500,
				clusterScale = Math.log(clusterSize);

			var circle = L.circle([point.lat, point.lon], radius * clusterScale, {
				color: '#0093c1',
				fillColor: '#63c2d8',
				fillOpacity: 0.5
			});

			// Add to layer instead of directly to map
			mod.clusterLocationLayer.addLayer(circle);

			circle.bindPopup('Leute die hier wohnen: ' + clusterSize);
		},

		addWorkLocation : function (map, point) {
			var mod = this;

			var circle = L.circle([point.lat, point.lon], 300, {
				color: '#f99b00',
				fillColor: '#f9b300',
				fillOpacity: 1
			});

			mod.workLocationLayer.addLayer(circle);

			circle.bindPopup(mod.namicsOffices[point.lat + ',' + point.lon].name + '. Mitarbeiter. ' + mod.getEmployeeNumberByWorkLocation(point));
		},


		addClusterWorkConnection : function (map, clusterCenter, workPoint, connections) {

			var mod = this,
				factor = 2,
				scale = Math.log(connections),
				opacity = 0.5 + 0.1 * scale;

			var polyline = L.polyline([
				[clusterCenter.lat, clusterCenter.lon],
				[workPoint.lat, workPoint.lon]
			], {
				weight: 1.2 + factor * scale,
				opacity: opacity,
				color: '#00539e'
			});

			mod.clusterWorkConnectionLayer.addLayer(polyline);
		},

		getNamicsColor : function (connections){
			if (connections < 2) {
				//1
				return "#63C2D8";
			} else if(connections < 11){
				//2-10
				return "#0093C1";
			} else {
				//10+
				return "#00539E";
			}
		},

		/**
		 * Uses the moveabletype.latlong library to determine the distance in km between two points
		 *
		 * @method calculateDistance
		 * @param lat1
		 * @param lon1
		 * @param lat2
		 * @param lon2
		 * @returns {Number}
		 */
		calculateDistance : function (lat1, lon1, lat2, lon2) {

			// LatLon is from the moveabletype.latlong library
			var p1 = new LatLon(lat1, lon1),
				p2 = new LatLon(lat2, lon2);

			return parseFloat(p1.distanceTo(p2));          // in km
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
