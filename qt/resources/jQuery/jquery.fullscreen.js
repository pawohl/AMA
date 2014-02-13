// __NOINDEX__
// Derivative work of:
// jQuery.FullScreen plugin
// HTML5 FullScreen API plugin for jQuery, based on 
// http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/
//
// Triple-licensed: Public Domain, MIT and WTFPL license - share and enjoy!
// Source https://gist.github.com/2128691#file-jquery-fullscreen-js
// <nowiki>

/**
 * @example 
 * // In FF it seems only to work in response to
 * // a click-event
 * // Switch to fullscreen
 * $('#bodyContent').click(function() {
 *    $(this).requestFullScreen();
 * });
 *
 * // Add a button if fullscreen is supported
 * if ($.FullScreenSupported) $('<button>').text("Full screen").insertBefore('#bodyContent');
 *
 **/

// List the global variables for jsHint-Validation. Please make sure that it passes http://jshint.com/
// Scheme: globalVariable:allowOverwriting[, globalVariable:allowOverwriting][, globalVariable:allowOverwriting]
/*global jQuery:false, mediaWiki:false*/

// Set jsHint-options. You should not set forin or undef to false if your script does not validate.
/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, curly:true, browser:true, boss:true*/


(function($) {
	'use strict';

	function isFullScreen() {
		return document[!prefix ? 'fullScreen' : 'webkit' === prefix ? 'webkitIsFullScreen' : prefix + 'FullScreen'];
	}

	function cancelFullScreen() {
		return document[prefix ? prefix + 'CancelFullScreen' : 'cancelFullScreen']();
	}

	var supported = typeof document.cancelFullScreen !== 'undefined',
		prefixes = ['webkit', 'moz', 'o', 'ms', 'khtml'],
		prefix = '',
		noop = $.noop,
		i;

	if (!supported) {
		for (i = 0; prefix = prefixes[i]; i++) {
			if (typeof document[prefix + 'CancelFullScreen'] !== 'undefined') {
				supported = true;
				break;
			}
		}
	}

	if (supported) {
		$.fn.requestFullScreen = function() {
			return this.each(function() {
				return this[prefix ? prefix + 'RequestFullScreen' : 'requestFullScreen']();
			});
		};
		$.fn.fullScreenChange = function(fn) {
			var ar = [prefix + 'fullscreenchange'].concat([].slice.call(arguments, 0)),
				$e = $(this);
			return $e.bind.apply($e, ar);
		};
		$.FullScreen = {
			isFullScreen: isFullScreen,
			cancelFullScreen: cancelFullScreen
		};
		$.FullScreenSupported = true;
	} else {
		$.fn.requestFullScreen = $.fn.fullScreenChange = noop;
		$.FullScreen = {
			isFullScreen: function() {
				return false;
			},
			cancelFullScreen: noop
		};
	}
})(jQuery);

// </nowiki>
