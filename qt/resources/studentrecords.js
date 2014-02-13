/**
 * Pendant to masterrecords.js
 * Imports data for the student-version.
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
loader.implement('studentrecords.js', [], function() {
	'use strict';
	var pending = 0;
	
	window.getCompoundByID = function(id) {
		for (var i = 0, cd = window.compoundData, len = cd.length; i < len; ++i) {
			if (id === cd[i].c_id) return cd[i];
		}
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
		if (!pending) loader.load('data/compoundData.js');
	};
	pending++;
	window.rendergroupinfo = function(data) {
		pending--;
		window.rendergroupinfo = data;
		if (!pending) loader.load('data/compoundData.js');
	};
	pending++;
	window.amaviews = function(data) {
		pending--;
		window.amaviews = data;
		if (!pending) loader.load('data/compoundData.js');
	};
	window.compoundData = function(data) {
		window.compoundData = data;
		$.hook('ama.dataloaded').fire();
	};
	window.version = function(data) {
		app.version = data;
		window.version = null;
	};
	window.legend = function(data) {
		window.legend = data;
		$('#ama_print_legend').html(data);
	};
	window.hrfcorr = function(data) {
		window.hrfcorr = data;
	};
	loader.load('data/renderfields.js');
	loader.load('data/rendergroupinfo.js');
	loader.load('data/amaviews.js');
	loader.load('data/version.js');
	loader.load('data/legend.js');
	loader.load('data/hrfcorr.js');
}, window);