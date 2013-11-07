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


				_.each(data, function (item, key, list) {
					console.log('lat', item.properties.geo_latitude);
					console.log('lon', item.properties.geo_longitude);
				});


			});

			$.ajax({
				url : url,
				dataType : 'json',
				success : function (data) {

					mod.$ctx.trigger('dataavailable', [data.features]);
				}
			});

			// Testing
			console.log(mod.calculateDistance(47.345441, 8.606525, 47.6464245, 9.1725561));

			// Iterate over all lat lng




			callback();
		},

		calculateDistance : function (lat1, lon1, lat2, lon2) {
			var p1 = new LatLon(lat1, lon1);
			var p2 = new LatLon(lat2, lon2);
			return p1.distanceTo(p2);          // in km
		}

	});
}(Tc.$, window));
