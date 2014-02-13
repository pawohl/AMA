/**
 * A module loader for javascript
 * written with MediaWiki's ResourceLoader in mind
 * but this time purely client side.
 * In theory it wouldn't need such efforts but thanks
 * one browser vendor (I don't think I have to record the name here)
 * one can't reliable say if a script was loaded
 * or whether the load failed.
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

/*global console:false*/

(function (registered, loading, loaded, executed) {
	'use strict';
	var privateModules = {},
		// Object whose keys are the script source and values are $.Callbacks()
		scriptCache = {},
		stylesheetCache = {},
		loadsPending = [],
		doc = document,
		toString = Object.prototype.toString,
		isArray = function(a) {
			return toString.call(a) === '[object Array]';
		},
		isFunction = function(f) {
			return toString.call(f) === '[object Function]';
		},
		makeModule = function(key) {
			return {
				key: key,
				src: key,
				dependencies: []
			};
		},
		onModuleLoaded = function() {
			// Loop through the callback-queue and look for what can be executed now
			var i = 0,
				len = loadsPending.length,
				load, checkDeps;
			
			checkDeps = function(deps) {
				var ret = true,
					len = deps.length,
					d = 0,
					m;
					
				for (d = len-1; d >= 0; d--) {
					m = privateModules[deps[d]];
					if (!m) {
						m = makeModule(deps[d]);
						loader.register(m);
					}
					if (m.dependencies.length) ret = ret && checkDeps(m.dependencies);
					ret = ret && m.state === executed;
				}
				return ret;
			};
			
			for (i = len-1; i >= 0; i--) {
				load = loadsPending[i];
				// Load can be empty if some callback functionn called onModuleLoaded again
				if (!load || !checkDeps(load.dependencies)) return;
				clearTimeout(load.failTimeout);
				loadsPending.splice(i, 1);
				load.callback();
			}
		};
	
	
	// Note that a module does not neccessarily have to be registerd
	// If it isn't registered, its source is assumed being its name and vice versa
	var loader = window.loader = {
		importStylesheet: function(href) {
			if (stylesheetCache[href]) return;
			stylesheetCache[href] = true;
			
			var head   = doc.getElementsByTagName('head')[0],
				link = doc.createElement('link');
				
			link.rel = 'stylesheet';
			link.type = 'text/css';
			link.href  = href;
			head.appendChild(link);
		},
		importScript: function(src, callback) {
			if (scriptCache[src]) return scriptCache[src].add( callback );
			scriptCache[src] = $.Callbacks( 'once memory' );
			scriptCache[src].add( callback );
		
			var head   = doc.getElementsByTagName('head')[0],
				script = doc.createElement('script'),
				done = false;
				
			script.onload = script.onreadystatechange = function() {
				if ( !done && (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') ) {
					done = true;
					scriptCache[src].fire();

					// Handle memory leak in IE
					script.onload = script.onreadystatechange = null;
					if ( head && script.parentNode ) {
						head.removeChild( script );
					}
				}
			};

			script.type = 'text/javascript';
			script.src  = src;
			head.appendChild(script);
		},
		register: function(modules) {
			var len;
			
			if (!modules) return;
			
			len = modules.length;
			if (len) {
				for (var i = 0; i < len; i++) {
					loader.register(modules[i]);
				}
				return;
			}
			if (!modules.dependencies) modules.dependencies = [];
			
			privateModules[modules.key] = modules;
		},
		load: function(modules) {
			loader.using(modules);
		},
		using: function(dependencies, callback) {
			var len, failTimeout;
			
			if (!dependencies && isFunction(callback)) return callback();
			
			len = dependencies.length;
			if (dependencies && !isArray(dependencies)) {
				dependencies = [dependencies];
				len = 1;
			}
			
			if (callback && isFunction(callback)) {
				failTimeout = setTimeout(function() {
					// Check whether we can execute a callback function
					if (window.console && console.log) console.log("Loading failed", dependencies);
				}, 10000);
				loadsPending.push({
					dependencies: dependencies,
					callback: callback,
					failTimeout: failTimeout
				});
			}
			
			for (var i = 0; i < len; i++) {
				var k = dependencies[i],
					m = privateModules[k];
					
				if (!m) {
					m = makeModule(k);
					loader.register(m);
				}
				if (m.dependencies.length) loader.load(m.dependencies);
				
				// Are we already loading this module?
				if (m.state && m.state !== registered) return onModuleLoaded();
				m.state = loading;
				(function(m) {
					loader.importScript(m.src, function() {
						setTimeout(function() {
							m.state = executed;
							onModuleLoaded();
						}, 100);
					});
				}(m));
			}
			onModuleLoaded();
		},
		implement: function(key, dependencies, moduleexecutable, thisarg, args) {
			if (!privateModules[key]) {
				loader.register(makeModule(key));
			}
			privateModules[key].state = loaded;
			loader.using(dependencies, function() {
				moduleexecutable.apply(thisarg || window, args || []);
				privateModules[key].state = executed;
				onModuleLoaded();
			});
		}
	};
}('registered', 'loading', 'loaded', 'executed'));