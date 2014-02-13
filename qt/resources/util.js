/**
 * A bunch of helper functions
 * that I do often use
 */
 
/*
 * Copyright (C) 2013 Felix Pahlow and others
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

/*global loader:false*/
loader.implement('util.js', [], function($) {
	'use strict';
	window.app = {};
	
	var slice = Array.prototype.slice;
	
	$.eachItem = function(obj, cb) {
		var i = 0;
		for (var elem in obj) {
			if (obj.hasOwnProperty(elem)) {
				if (false === cb(i, elem, obj[elem])) break;
				i++;
			}
		}
		return obj;
	};
	window.firstItem = function (o) { for (var i in o) { if (o.hasOwnProperty(i)) { return o[i]; } } };

	window.dumpObject = function(obj, recurs) {
		var $pre = $('<pre>');
		window.dor = 0;
			
		var dumpObjPriv = function(obj) {
			window.dor++;
			if (window.dor > 10) return '…..';
			for (var k in obj) {
				var v = obj[k],
					t = typeof v;
					
				$('<div>').text(
					(obj.hasOwnProperty(k) ? '' : 'proto') +
					' ' + t + ' ' + k + ' ' +
					({ 'number': true, 'string': true }[t] ? v : 
						('function' === t ? v.toString() : (
							('object' === t && recurs) ? '{' + dumpObjPriv(v) + '}' : ''
						))
					)
				).appendTo($pre);
			}
			return '';
		};
		dumpObjPriv(obj);
		$pre.appendTo('body');
	};
	
	window.getNewSearchName = function() {
		var currentDate = new Date(),
			pad0 = function (s) {
				s = "" + s;
				return (s.length > 1 ? s : "0" + s);
			};
		return $.datepicker.formatDate('yy-mm-dd', currentDate) + ' ' + pad0(currentDate.getHours()) + ':' + pad0(currentDate.getMinutes()) + ':' + pad0(currentDate.getSeconds());
	};
	
	$.createInfoContainer = function(icon, text, height) {
		var $cont = $('<div>').attr({
				'class': 'ui-state-highlight ui-corner-all ui-widget-content',
				'style': 'width:98%; margin-top:4px; position:relative;'
			}).height(height),
			$icon = $('<div>').attr({
				'class': 'ui-icon',
				'style': 'position:absolute; left:3px; top:8px'
			}).addClass(icon).appendTo($cont),
			$text = $('<div>').attr({
				'style': 'position:absolute; left:22px; top:3px'
			}).text(text).appendTo($cont);
			
		return $cont;
	};
	
	/**
	 * From: Core MediaWiki JavaScript Library
	 * GPL v.2
	 * @author Krinkle
	 * @author Daniel Friesen
	 */
	/*
	 * JavaScript backwards-compatibility alternatives and other convenience functions
	 */
	$.extend({
		trimLeft: function ( str ) {
			return str === null ? '' : str.toString().replace( /^\s+/, '' );
		},
		trimRight: function ( str ) {
			return str === null ?
					'' : str.toString().replace( /\s+$/, '' );
		},
		ucFirst: function ( str ) {
			return str.charAt( 0 ).toUpperCase() + str.substr( 1 );
		},
		escapeRE: function ( str ) {
			return str.replace ( /([\\{}()|.?*+\-\^$\[\]])/g, '\\$1' );
		},
		isDomElement: function ( el ) {
			return !!el && !!el.nodeType;
		},
		isEmpty: function ( v ) {
			var key;
			if ( v === '' || v === 0 || v === '0' || v === null
				|| v === false || v === undefined )
			{
				return true;
			}
			// the for-loop could potentially contain prototypes
			// to avoid that we check it's length first
			if ( v.length === 0 ) {
				return true;
			}
			if ( typeof v === 'object' ) {
				for ( key in v ) {
					return false;
				}
				return true;
			}
			return false;
		},
		compareArray: function ( arrThis, arrAgainst ) {
			if ( arrThis.length !== arrAgainst.length ) {
				return false;
			}
			for ( var i = 0; i < arrThis.length; i++ ) {
				if ( $.isArray( arrThis[i] ) ) {
					if ( !$.compareArray( arrThis[i], arrAgainst[i] ) ) {
						return false;
					}
				} else if ( arrThis[i] !== arrAgainst[i] ) {
					return false;
				}
			}
			return true;
		},
		compareObject: function ( objectA, objectB ) {
			var prop, type;

			// Do a simple check if the types match
			if ( typeof objectA === typeof objectB ) {

				// Only loop over the contents if it really is an object
				if ( typeof objectA === 'object' ) {
					// If they are aliases of the same object (ie. mw and mediaWiki) return now
					if ( objectA === objectB ) {
						return true;
					} else {
						// Iterate over each property
						for ( prop in objectA ) {
							// Check if this property is also present in the other object
							if ( prop in objectB ) {
								// Compare the types of the properties
								type = typeof objectA[prop];
								if ( type === typeof objectB[prop] ) {
									// Recursively check objects inside this one
									switch ( type ) {
										case 'object' :
											if ( !$.compareObject( objectA[prop], objectB[prop] ) ) {
												return false;
											}
											break;
										case 'function' :
											// Functions need to be strings to compare them properly
											if ( objectA[prop].toString() !== objectB[prop].toString() ) {
												return false;
											}
											break;
										default:
											// Strings, numbers
											if ( objectA[prop] !== objectB[prop] ) {
												return false;
											}
											break;
									}
								} else {
									return false;
								}
							} else {
								return false;
							}
						}
						// Check for properties in B but not in A
						// This is about 15% faster (tested in Safari 5 and Firefox 3.6)
						// ...than incrementing a count variable in the above and below loops
						// See also: http://www.mediawiki.org/wiki/ResourceLoader/Default_modules/compareObject_test#Results
						for ( prop in objectB ) {
							if ( !( prop in objectA ) ) {
								return false;
							}
						}
					}
				}
			} else {
				return false;
			}
			return true;
		}
	});
	
	/**
	 * From: Core MediaWiki JavaScript Library
	 * GPL v.2
	 *
	 * Registry and firing of events.
	 *
	 * MediaWiki has various interface components that are extended, enhanced
	 * or manipulated in some other way by extensions, gadgets and even
	 * in core itself.
	 *
	 * This framework helps streamlining the timing of when these other
	 * code paths fire their plugins (instead of using document-ready,
	 * which can and should be limited to firing only once).
	 *
	 * Features like navigating to other wiki pages, previewing an edit
	 * and editing itself – without a refresh – can then retrigger these
	 * hooks accordingly to ensure everything still works as expected.
	 *
	 * Example usage:
	 *
	 *     $.hook( 'wikipage.content' ).add( fn ).remove( fn );
	 *     $.hook( 'wikipage.content' ).fire( $content );
	 *
	 * Handlers can be added and fired for arbitrary event names at any time. The same
	 * event can be fired multiple times. The last run of an event is memorized
	 * (similar to `$(document).ready` and `$.Deferred().done`).
	 * This means if an event is fired, and a handler added afterwards, the added
	 * function will be fired right away with the last given event data.
	 *
	 * Like Deferreds and Promises, the mw.hook object is both detachable and chainable.
	 * Thus allowing flexible use and optimal maintainability and authority control.
	 * You can pass around the `add` and/or `fire` method to another piece of code
	 * without it having to know the event name (or `mw.hook` for that matter).
	 *
	 *     var h = $.hook( 'bar.ready' );
	 *     new $.Foo( .. ).fetch( { callback: h.fire } );
	 *
	 * Note: Events are documented with an underscore instead of a dot in the event
	 * name due to jsduck not supporting dots in that position.
	 *
	 * @class $.hook
	 * @author Krinkle
	 */
	$.hook = ( function () {
		var lists = {};

		/**
		 * Create an instance of mw.hook.
		 *
		 * @method hook
		 * @member mw
		 * @param {string} name Name of hook.
		 * @return {mw.hook}
		 */
		return function ( name ) {
			var list = lists[name] || ( lists[name] = $.Callbacks( 'memory' ) );

			return {
				/**
				 * Register a hook handler
				 * @param {Function…} handler Function to bind.
				 * @chainable
				 */
				add: list.add,

				/**
				 * Unregister a hook handler
				 * @param {Function…} handler Function to unbind.
				 * @chainable
				 */
				remove: list.remove,

				/**
				 * Run a hook.
				 * @param {Mixed…} data
				 * @chainable
				 */
				fire: function () {
					return list.fireWith( null, slice.call( arguments ) );
				}
			};
		};
	}() );
	
	$.fn._blink = function() {
		var _this = this;
		this.addClass('ui-state-error');
		setTimeout(function() {
			_this.removeClass('ui-state-error');
		}, 800);
	};
	
	$.fn.validateNumber = function(events, minOrAllowComma, max) {
		this.on(events, function() {
			var $input = $(this),
				regExp = minOrAllowComma === true ? /[^\d\,\.]/g : /[^\d]/g,
				origVal = $input.val(),
				newVal = origVal;
				
			if (!newVal) return;
			if (!$.isNumeric(newVal) && newVal !== '-') newVal = origVal.replace(regExp, '');
			if (!newVal) {
				$input._blink();
				return $input.val('');
			}
			if (minOrAllowComma !== true && newVal !== '-') {
				newVal = Number(newVal);
				if (newVal > max) newVal = max;
				if (newVal < minOrAllowComma) newVal = minOrAllowComma;
				if (newVal.toString() !== origVal) {
					$input._blink();
					$input.val(newVal);
				}
			} else if (newVal === '-') {
				if (newVal.toString() !== origVal) {
					$input._blink();
					$input.val(newVal);
				}
			} else {
				if (newVal.toString() !== origVal) {
					$input._blink();
					$input.val(newVal);
				}
			}
		});
		return this;
	};
}, window, [jQuery]);