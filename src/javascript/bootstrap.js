(function ($) {
	$(document).ready(function () {
		var $page = $('html');
		var application = new Tc.Application($page);
		application.registerModules();
		application.start();
	});
})(Tc.$);