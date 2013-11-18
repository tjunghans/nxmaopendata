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
		getMaximumDistanceToWork : function () {

		}

	};

	Lab.EmployeeCollection = EmployeeCollection;
}(window));