/**
 * Implements a webSocket-like interface on top of Qt's
 * signal-slot-system
 * In other words: 
 * This application must run in a Qt Webkit element if you
 * want to use this.
 *
 * For reference, see http://www.w3.org/TR/websockets/
 *
 * Reasoning:
 *   # Switching to a real websocket-server will be easier
 *   # WebSockt-stuff is not handled by QNetworkAccessManager::createRequest()
 *     consequently it is really hard to intercept with it on the "server-side"
 *     of this application.
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
 
/*global loader:false, amaQtHost:false*/
loader.implement('qtLocalWebSocket.js', [], function ($) {
	'use strict';
	
	var CONNECTING = 0, OPEN = 1, CLOSING = 2, CLOSED = 3;
	var obj = amaQtHost;
		
	var signalNameFromURL = function(url) {
		var urlParser = document.createElement('a');
		urlParser.href = url;
		return urlParser.hostname.split('.')[0];
	};
	
	window.QtWebSocket = function(host, protocols) {
		var socket = this;
		
		this.url = host;
		this.readyState = CONNECTING;
		this.bufferedAmount = 0;
		
		this.onopen = null;
		this.onerror = null;
		this.onclose = null;
		this.onmessage = null;
		
		this.extensions = '';
		this.protocol = '';
		
		var urlParser = document.createElement('a'),
			insecure = /^ws:\/\//.test(host);
			
		urlParser.href = host;
		
		if (!/^wss?:\/\//.test(host)) throw new SyntaxError('new QtWebSocket(host, protocols) - Invalid protocol. Host must start with ws:// or wss://');
		if (location.protocol === 'https:' && insecure) throw new Error('SecurityError. new QtWebSocket(host, protocols) - You\'re on https: but are attempting to connect to insecure ws: protocol.');
		if ($.inArray(urlParser.port, [1, 7, 9, 11, 13, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 77, 79, 87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 139, 143, 179, 389, 465, 512, 513, 514, 515, 526, 530, 531, 532, 540, 556, 563, 587, 601, 636, 993, 995, 6666]) > -1) throw new SyntaxError('new QtWebSocket(host, protocols) - Invalid port. Port is blocked by most browsers.');
		if (!protocols) protocols = [];
		if (typeof protocols === 'string') protocols = [protocols];
		
		this.____msgFunc = function(msg) {
			if ($.isFunction(socket.onmessage)) socket.onmessage(msg);
		};
		
		var init = function() {
			// continue these steps in the background (without blocking scripts)
			// establish a fake-WebSocket connection given the set (host, port, resource name, secure),
			// We have to connect to a signal
			obj[signalNameFromURL(host) + 'Change'].connect(socket.____msgFunc);
			socket.readyState = OPEN;
			if ($.isFunction(socket.onopen)) socket.onopen();
		};
		
		setTimeout(init, 5);
	};
	
	QtWebSocket.fn = QtWebSocket.prototype;
	
	$.extend(QtWebSocket.fn, {
		url: '',
		CONNECTING: CONNECTING,
		OPEN: OPEN,
		CLOSING: CLOSING,
		CLOSED: CLOSED,
		readyState: CLOSED,
		bufferedAmount: undefined,
		onopen: undefined,
		onclose: undefined,
		extensions: undefined,
		protocol: undefined,
	
		close: function(code, reason) {
			if ( !$.isNumeric(code) || (code !== 1000 && (code < 3000 || code > 4999)) ) throw new Error('InvalidAccessError. QtWebSocket.close(code, reason) - Code must be 1000 or between 3000 and 4999.');
			if ( arguments.length === 2 && typeof reason !== 'string') throw new TypeError('QtWebSocket.close(code, reason) - Reason must be of type string');
			if ( reason.replace( /[\u0080-\u07FF\uD800-\uDFFF]/g, '**' ).replace( /[\u0800-\uD7FF\uE000-\uFFFF]/g, '***' ).length > 123 ) 
				throw new SyntaxError('QtWebSocket.close(code, reason) - Reason must not be longer than >123 characters');
				
			this.readyState = CLOSING;
			if ($.isFunction(this.onclose)) this.onclose();
			obj[signalNameFromURL(this.url) + 'Change'].disconnect(this.____msgFunc);
			this.readyState = CLOSED;
		},
		binaryType: 'blob',
		send: function(data) {
			obj[signalNameFromURL(this.url) + 'Data'](data);
		}
	});
}, window, [jQuery]);