/**
 * Wrapper for abitrary mol edits
 * that are included though iframes
 * to provide a stable interaction
 * a stable interaction-API.
 *
 * TODO: Indicate ready state as quite
 * a few scripts are asynchronously imported
 *
 * Terminology:
 *    Origin = Host-side = outside part
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

/*global loader:false, amaQtHost:false, Canvas2Image:false*/
loader.implement('formulaedit.js', [], function($) {
	'use strict';

	var $win = $(window),
		currentId = 0,
		originFromSrc,
		pingFrame,
		molEdit;
	
	originFromSrc = function( href ) {
		var a = document.createElement('a'),
			ret;

		a.href = href;
		ret = a.origin || location.origin;
		if ('null' === ret || 'file:' === location.protocol) ret  = '*';
		return ret;
	};
	
	pingFrame = function($if, interval, callback) {
		var frameOrigin = originFromSrc($if.attr('src')),
			iv = setInterval(function() {
				$win.on('message', function(msg) {
					msg = msg.originalEvent;
					if (originFromSrc(msg.origin) !== frameOrigin && '*' !== frameOrigin) return;
					msg = msg.data;
					if (msg === 'pong') {
						clearInterval(iv);
						callback();
					}
				});
				$if[0].contentWindow.postMessage('ping', frameOrigin);
			}, interval);
	};
	
	molEdit = window.molEdit = {
		config: {
			iFrameSrc: 'ketcher/ketcher.html'
		},
		$create: function (height, width, mol) {
			var $if = $('<iframe>').attr({
					scrolling: 'no',
					id: 'ama-mol-edit-' + (++currentId),
					'class': 'ama-mol-edit'
				}).css({
					height: height || 530,
					width: width || 800,
					border: 'none',
					overflow: 'visible'
				});
				
			molEdit.augment($if, currentId);
			
			$if.$loadDef = $.Deferred();
			$if.load(function() {
				// Load order seem to be messed-up in chrome
				pingFrame($if, 75, function() {
					$if.$loadDef.resolve();
				});
			});
			if (mol) {
				$if.$setMolecule(mol);
			}
			setTimeout(function() {
				$if.attr('src', molEdit.config.iFrameSrc);
			}, 1);
			
			return $if;
		},
		augment: function($frame, id) {
			$.extend($frame, this.augmentationMembers);
			$frame.id = id;
		},
		augmentationMembers: {
			messageCallbacks: {},
			post: function(data) {
				var $if = this;
				// Modern browsers do not require stringification
				$if[0].contentWindow.postMessage(data, originFromSrc($if.attr('src')));
			},
			onMessage: function(cb, id) {
				var $if = this,
					queue;
				
				this.messageCallbacks[id] = this.messageCallbacks[id] || $.Callbacks(); // TODO: Check
				queue = this.messageCallbacks[id];
				queue.add(cb);
				
				// Install a message-hub for a specific message (by ID)
				queue.messagehub = function(msg) {
					msg = msg.originalEvent;

					// Don't care for messages by other domains than that we told the iframe to load
					var frameOrigin = originFromSrc( $if.attr('src') );
					if (originFromSrc(msg.origin) !== frameOrigin && '*' !== frameOrigin) return;
					msg = msg.data;
					if (msg.id !== id) return;
					queue.fire(msg.data);
				};
				$win.on('message', queue.messagehub);
			},
			offMessage: function(cb, id) {
				var $if = this,
					queue = this.messageCallbacks[id];
					
				queue.remove(cb);
				// .has() w/o arg returns whether there are
				// callbacks in the queue
				if (!queue.has()) {
					$if.off('message', queue.messagehub);
				}
			},
			$operation: function(name, data, timeout) {
				var $if = this,
					opID = $if.currentOpId,
					$def;

				if (!$.isNumeric(opID)) opID = 0;
				$if.currentOpId = ++opID;
				
				$def = $.Deferred();
				$def.done(function() {
					$if.offMessage($def.resolve, $if.currentOpId);
				});
				$if.onMessage($def.resolve, $if.currentOpId);
				
				$if.$loadDef.done(function() {
					setTimeout(function() {
						$if.post({ data: data, operation: name, id: opID });
					}, timeout || 1);
				});
				
				return $def;
			},
			$getMolfile: function() {
				return this.$operation('getMolfile');
			},
			$getSMILES: function() {
				return this.$operation('getSMILES', undefined, 10);
			},
			$getSVG: function() {
				var $def = $.Deferred();
				this.$operation('getSVG', { h: 200, w: 200, margin: 1 }, 10).done(function(svg) {
					if (!/^s*<\?xml/i.test(svg) && window.amaQtHost) svg = amaQtHost.getMetaSetting('SVGHeader') + svg;
					$def.resolve(svg);
				});
				return $def;
			},
			$getPNG: function() {
				// https://developer.mozilla.org/en-US/docs/HTML/Canvas/Drawing_DOM_objects_into_a_canvas
				// Alternative is using canvg (but I guess it's slower)
				var $if = this,
					$def = $.Deferred(),
					$canvas = $('<canvas>').attr({
						style: 'border:2px solid black;',
						width: 200,
						height: 200
					})/*.appendTo('body')*/, // For debugging
					ctx = $canvas[0].getContext('2d'),
					DOMURL = window.URL || window.webkitURL || window,
					img = new Image(),
					retData, svg, url;
					
				img.onload = function() {
					ctx.drawImage(img, 0, 0);
					$def.resolve(Canvas2Image.saveAsPNG($canvas[0], 'data'));
					setTimeout(function() {
						DOMURL.revokeObjectURL(url);
						$canvas.remove();
					}, 10000);
				};
				$if.$operation('getSVGMetrics', { h: 200, w: 200, margin: 1 }, 10).done(function(data) {
					svg = new Blob([data.svg], {type: "image/svg+xml;charset=utf-8"});
					$canvas.attr('width', Math.round(data.w) + 3).attr('height', Math.round(data.h) + 3);
					url = DOMURL.createObjectURL(svg);
					img.src = url;
					retData = data;
				});
				return $def;
			},
			// Returns a jQuery Deferred
			$setMolecule: function(mol) {
				return this.$operation('setMolecule', mol);
			},
			// Returns a jQuery Deferred
			$setMoleculeFragment: function(mol) {
				return this.$operation('setMoleculeFragment', mol);
			},
			// Returns a jQuery Deferred
			$getCredits: function() {
				return this.$operation('getCredits');
			}
		}
	};
	// 'canvg/canvg.js', 'canvg/rgbcolor.js', 'canvg/StackBlur.js'
	loader.load(['canvas2image/canvas2image.js', 'lib/base64.js']);
}, window, [jQuery]);