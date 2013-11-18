(function (window, undefined) {

	'use strict';

	namespace('Lab');

	function EmployeeCollection(json) {

		/**
		 *
		 * @type {Array<Lab.Employee>}
		 */
		this.collection = [];

		this.init(json);

	}

	EmployeeCollection.prototype = {
		constructor : EmployeeCollection,

		/**
		 *
		 * @param json {Array}
		 */
		init : function (json) {

			this.json = json;

			for (var i = 0, ii = json.length; i < ii; i++) {
				this.collection.push(new Lab.Employee(json[i].properties));
			}

		},

		getCollection : function () {
			return this.collection;
		},

		getSize : function () {
			return this.collection.length;
		},

		getMaxDistanceToWork : function () {
			var collection = this.getCollection(),
				item =  _.max(collection, function (item) {

					return parseFloat(item.getDistanceToWork());
				});

			return item.getDistanceToWork();
		},

		getMinDistanceToWork : function () {
			var collection = this.getCollection(),
				item =  _.min(collection, function (item) {

					return parseFloat(item.getDistanceToWork());
				});

			return item.getDistanceToWork();
		}

	};

	Lab.EmployeeCollection = EmployeeCollection;
}(window));