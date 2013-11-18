(function (window, undefined) {

	'use strict';

	namespace('Lab');

	function Employee(json) {
		this.init(json);
	}

	Employee.prototype = {
		constructor : Employee,
		init : function (json) {
			this.address = json.Adresse_H;
			this.birthYear = json.Birth;
			this.country = json.Land_H;
			this.city = json.Ort_H;
			this.postalCode = json.PLZ_H;
			this.startAtNamics = json.Start_N;
			this.geo = new Lab.Point(json.geo_latitude, json.geo_longitude);

			this.workCity = json.Ort_A;
			this.workPostalCode = json.PLZ_A;
			this.workGeo = new Lab.Point(json.geo_latitude_A, json.geo_longitude_A);

			this.distanceToWork = this._calculateDistanceToWork(this.geo, this.workGeo);

		},

		_calculateDistanceToWork : function (pointHome, pointWork) {
			var p1 = new LatLon(pointHome.lat, pointHome.lon),
				p2 = new LatLon(pointWork.lat, pointWork.lon);

			return parseFloat(p1.distanceTo(p2));
		},

		getDistanceToWork : function () {
			return this.distanceToWork;
		}

	};

	Lab.Employee = Employee;
}(window));