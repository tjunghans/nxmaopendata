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
			this.startAtNamics = json.Start_N;
			this.geo = new Lab.Point(json.geo_latitude, json.geo_longitude);

		}

	};

	Lab.Employee = Employee;
}(window));