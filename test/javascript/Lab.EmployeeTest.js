(function (window) {
	'use strict';

	var data = {"id":"Thu Nov 07 11:27:32 GMT+01:00 2013","properties":{"Adresse_H":"61381 Friedrichsdorf, Germany","":"","Land_H":"Germany","geo_longitude_A":8.6819118,"PLZ_H":61381,"PLZ_A":60596,"Ort_H":"Friedrichsdorf","BU":"","geo_latitude_A":50.0982839,"Ort_A":"Frankfurt","Timestamp":"Thu Nov 07 11:27:32 GMT+01:00 2013","Birth":1983,"Start_N":"23.01.2006","Kompetenz":"","Land_A":"Germany","geo_latitude":50.2538496,"geo_longitude":8.6417409},"type":"Feature","geometry":{"type":"Point","coordinates":[8.6417409,50.2538496]}};

	var employee;

	module("Lab.Employee", {
		setup: function() {
			employee = new Lab.Employee(data.properties)
		}, teardown: function() {
			employee = null;
		}
	});

	test("getDistanceToWork", function() {
		strictEqual(employee.getDistanceToWork(), 17.53);
	});



}(window));