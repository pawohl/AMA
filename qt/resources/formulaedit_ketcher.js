/**
 * Code to be injected into the ketcher iframe so it
 * provides the API neccessary for accessing it as generic
 * formulaedit.
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

 /*global ketcher:false, $$:false, $:false*/
(function() {
	'use strict';
	var processMessage, replyMessage, replyMessageSuccess, onMessage, onDOMReady, DOMReady, getCredits, getSVG, sendPong;
	
	getCredits = function() {
		return "<div style=\"font-family:monospace;white-space:pre-wrap\">"+
			"<a href=\"#\" class=\"ama-autoexpand\">Ketcher is Copyright (C) of GGA Software Services LLC 2009-2010.</a>\n" +
			"This program is free software: you can redistribute it and/or modify " +
			"it under the terms of the GNU Affero General Public License as published " +
			"by the Free Software Foundation, version 3 of the License.\n" +
			"This program is distributed in the hope that it will be useful, " +
			"but WITHOUT ANY WARRANTY; without even the implied warranty of "  +
			"MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the " +
			"GNU Affero General Public License for more details.</div>" +
			"You already received <a href=\"./ketcher/\">the source code</a> which is " +
			"distributed along with the main application you're using.";
	};
	
	getSVG = function(data, metrics) {
		var ra = document.createElement('div'),
			ras = ra.style,
			id = 'svgdrawingarea' + Math.round(Math.random() * 1048576),
			s = new XMLSerializer(),
			viewBox = [],
			margin = data.margin || 0,
			$svg, bbox, renderOpts, svg, w, h;
			
		ras.width = data.w + 'px';
		ras.height = data.h + 'px';
		//ras.opacity = 0;
		ras.position = 'absolute';
		ras.top = 0;
		ras.left = 0;
		ra.id = id;
		document.body.appendChild(ra);
		
		renderOpts = {
			'autoScale':true,
			'autoScaleMargin':margin,
			'ignoreMouseEvents':true,
			'atomColoring': true
		};
		ketcher.showMolfileOpts(ra, ketcher.getMolfile(), 20, renderOpts);
		// Crop whitespace from SVG
		$svg = $$('#' + id + ' svg')[0];
		if (metrics) {
			$$('#' + id + ' svg rect[x="0"][y="0"][r="0"]').each(function(el) {
				// Remove empty rects set by Raphaël
				el.remove();
			});
			bbox = $svg.getBBox();
			w = Math.ceil(bbox.width);
			h = Math.ceil(bbox.height);
			viewBox = [
				(data.w - w) / 2 - margin,
				(data.h - h) / 2 - margin,
				w + margin * 2,
				h + margin * 2
			];
			$svg.setAttribute('width', w);
			$svg.setAttribute('height', h);
			$svg.setAttribute('viewBox', viewBox.join(' '));
		} else {
			// IE 10 needs a viewbox for scaling
			viewBox = [
				'0',
				'0',
				$svg.getAttribute('width'),
				$svg.getAttribute('height')
			];
			$svg.setAttribute('viewBox', viewBox.join(' '));
		}
		
		svg = s.serializeToString($svg)
			.replace(/\-webkit\-tap-highlight\-color\: rgba\(0\, 0\, 0\, 0\); ?/g, '')
			.replace(/style=\"\s*\"/g, '')
			.replace(/transform=\"\s*\"/g, '')
			.replace(/&quot;/g, '\'');
		
		if (metrics) {
			svg = {
				svg: svg,
				h: bbox.height,
				w: bbox.width
			};
		}
		document.body.removeChild(ra);
		return svg;
	};
	onDOMReady = function(cb) {
		if (DOMReady) return cb();
		// Prototype
		document.observe('dom:loaded', function() {
			cb();
		});
	};
	processMessage = function(msg, e) {
		var r = '';
		switch (msg.operation) {
			case 'setMolecule':
				//TODO: Validate molfile
				ketcher.setMolecule(msg.data);
				replyMessageSuccess(msg, e);
				break;
			case 'setMoleculeFragment':
				ketcher.addFragment(msg.data);
				replyMessageSuccess(msg, e);
				break;
			case 'getMolfile':
				replyMessage(msg, e, ketcher.getMolfile());
				break;
			case 'getSMILES':
				try {
					r = ketcher.getSmiles();
				} catch(ex) {}
				replyMessage(msg, e, r);
				break;
			case 'getSVG':
				replyMessage(msg, e, getSVG(msg.data));
				break;
			case 'getSVGMetrics':
				replyMessage(msg, e, getSVG(msg.data, true));
				break;
			case 'getCredits':
				replyMessage(msg, e, getCredits());
				break;
		}
	};
	replyMessageSuccess = function(msg, e) {
		return replyMessage(msg, e, 'success');
	},
	replyMessage = function(msg, e, reply) {
		var target = e.origin;
		if (target === 'null' || location.protocol === 'file:') target = '*';
		msg.data = reply;
		e.source.postMessage(msg, target);
	},
	sendPong = function(e) {
		var target = e.origin;
		if (target === 'null' || location.protocol === 'file:') target = '*';
		e.source.postMessage('pong', target);
	},
	onMessage = function(e) {
		if (e) {
			if (e.data === 'ping') {
				sendPong(e);
			}
			if (e.data.operation) {
				onDOMReady(function() {
					processMessage(e.data, e);
				});
			}
		}
	};
	window.addEventListener('message', onMessage, false);

	// Prototype
	document.observe('dom:loaded', function() {
		ketcher.init();
		DOMReady = true;
	});
}());