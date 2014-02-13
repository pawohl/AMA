/**
 * Check whether this application runs in our qt thin 
 * client-server app or in a regular browser
 *
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
loader.implement('jsinteropQt.js', [], function() {
	'use strict';
	var connected = false,
		connectSlots, queue;
	
	window.qtAvailable = (window.navigator && window.navigator.appVersion && window.navigator.appVersion.indexOf('ama Safari') > -1);
	
	/** 
	 * We use this function because connect statements resolve their target once,
	 * imediately not at signal emission so they must be connected once 
	 * the amaQtHost object has been added to the frame
	 */
	//! <!--  [ connect slots ] -->
	connectSlots = function() {
		if (connected) return;
		// Nothing to connect here
		// …
		connected = true;
	};
	//! <!--  [ connect slots ] -->

	queue = [];
	if (window.qtAvailable) {
		/**
		 * @param cb {Function} A function to be executed as soon as
		 *   amaQtHost is available, or if the application runs in a browser,
		 *   immediately
		 * @context window
		 * @return undefined
		 */
		window.usingQt = function(cb) {
			if (window.amaQtHost) {
				cb();
				connectSlots();
			} else {
				queue.push(cb);
			}
		};
	} else {
		window.usingQt = function(cb) {
			cb();
		};
	}
	/**
	* This will be invoked by the Qt host applications
	* once amaQtHost was added to the global (window) scope
	* @return undefined
	*/
	window.qtenhancedtrigger = function() {
		$.each(queue, function(i, cb) {
			cb();
		});
		queue = [];
		connectSlots();
	};
}, window);