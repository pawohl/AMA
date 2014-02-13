/**
 * Imports data from the Master-Application
 * which is serving JSONP
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

 /*global loader:false, app:false, QtWebSocket:false*/
loader.implement('masterrecords.js', [], function() {
	'use strict';
	var pending = 0;
	
	window.getCompoundByID = function(id) {
		for (var i = 0, cd = window.compoundData, len = cd.length; i < len; ++i) {
			if (id === cd[i].c_id) return cd[i];
		}
	};

	window.setCompoundByID = function(data, id) {
		for (var i = 0, cd = window.compoundData, len = cd.length; i < len; ++i) {
			if (id === cd[i].c_id) {
				cd[i] = data;
				return true;
			}
		}
		// Nothing found, so push it
		window.compoundData.push(data);
	};

	window.criteria2Selector = {
		tiafttolerance: {
			selector: '#amaTiaftTolerance'
		},
		exceptioncount: {
			selector: '#amaTiaftExcept'
		},
		tiaftexcepttolerance: {
			selector: '#amaTiaftExceptTolerance'
		},
		frtolerancerelative: {
			selector: '#amaFRTolerance'
		},
		smartSmiles: {
			selector: '#ama-SMILES',
			type: 'string'
		},
		molFile: {
			selector: '#ama-MOLFILE',
			type: 'string'
		}
	};
	var regExp2Shortcut = {
			reTiaft: /^(?:(?:\d{1,2}|100)|\-)$/,
			reFR: /^(?:\+\+|\+|\-|\([\+\-]\))$/
		};

	// Fetch data->UI definition and then data
	pending++;
	window.renderfields = function(data) {
		pending--;
		window.renderfields = data;
		window.numberoftiafts = 0;
		$.each(data, function(i, d) {
			if (d.cl === 'ama-tiaft') window.numberoftiafts++;
		});
		if (!pending) loader.load('data/queryfields.js');
	};
	pending++;
	window.rendergroupinfo = function(data) {
		pending--;
		window.rendergroupinfo = data;
		if (!pending) loader.load('data/queryfields.js');
	};
	pending++;
	window.amaviews = function(data) {
		pending--;
		window.amaviews = data;
		if (!pending) loader.load('data/queryfields.js');
	};
	window.legend = function(data) {
		window.legend = data.legend;
		$('#ama_print_legend').html(data);
	};
	window.queryfields = function(data) {
		window.queryfields = data;
		loader.load('data/querygroupinfo.js');
		// Process this data
		$.each(window.queryfields, function(i, qf) {
			if (qf.pattern) {
				if (qf.pattern in regExp2Shortcut) {
					qf.pattern = regExp2Shortcut[qf.pattern];
				} else {
					qf.pattern = new RegExp(qf.pattern, '');
				}
			}
		});
	};
	window.querygroupinfo = function(data) {
		window.querygroupinfo = data;
		loader.load('data/compoundData.js');
	};
	window.compoundData = function(data) {
		window.compoundData = data;
		$.hook('ama.dataloaded').fire();
	};
	window.hrfcorr = function(data) {
		window.hrfcorr = data;
	};
	loader.load('data/renderfields.js');
	loader.load('data/rendergroupinfo.js');
	loader.load('data/amaviews.js');
	loader.load('data/legend.js');
	loader.load('data/hrfcorr.js');
	
	var handleDataUpdate = function(msg) {
		if (app.sorting || !msg.compound.c_id) return;
		switch (msg.action) {
			case 'update':
				$.each(window.compoundData, function(i, compound) {
					if (msg.compound.c_id === compound.c_id) {
						$.extend(window.compoundData[i], msg.compound);
						return false;
					}
				});
				break;
			case 'delete':
				$.each(window.compoundData, function(i, compound) {
					if (msg.compound.c_id === compound.c_id) {
						window.compoundData.splice(i, 1);
						return false;
					}
				});
				break;
			case 'insert':
				var dontInsert;
				$.each(window.compoundData, function(i, compound) {
					if (msg.compound.c_id === compound.c_id) {
						// TODO: Investigate when these strange things happen
						dontInsert = true;
					}
				});
				
				if (!dontInsert) {
					window.compoundData.unshift(msg.compound);
				}
				break;
		}
	};
	
	// Websocket communication
	loader.using('qtLocalWebSocket.js', function() {
		var ws = app.websocket = new QtWebSocket('wss://datasocket.ama-app.org');
		ws.onmessage = function(msg) {
			handleDataUpdate(msg);
			$(app).trigger('message.datasocket', msg);
		};
		ws.onopen = function() {
			$.hook('ama.websocket.open').fire();
		};
		ws.onclose = function() {
			$.hook('ama.websocket.close').fire();
		};
		ws.onerror = function(msg) {
			$(app).trigger('error.datasocket', msg);
		};
	});
}, window);