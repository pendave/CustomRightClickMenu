﻿(function() {
	Polymer({
		is: 'log-page',

		properties: {
			isLoading: {
				type: Boolean,
				value: true,
				notify: true
			}
		},

		ready: function() {
			if (window.logConsole && window.logConsole.done) {
				this.isLoading = false;
			}
			window.logPage = this;

			window.setTimeout(function() {
				var event = document.createEvent("HTMLEvents");
				event.initEvent("CRMLoaded", true, true);
				event.eventName = "CRMLoaded";
				document.body.dispatchEvent(event);
			}, 2500);
		}
	});
}());