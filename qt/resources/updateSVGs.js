/**
 * Maintenance script.
 * Loads all molfiles from the database into the (mol)-editor,
 * lets the mol-editor convert it to SVG and saves it to the
 * database.
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
loader.implement('convert2SVG.js', [], function($) {
	'use strict';
	/*global amaQtHost:false*/
	
	window.updateSVGs = function () {
		var $def = $.Deferred(),
			$if = window.molEdit.$create();

		$def.notify(0, "invoking __updateSVGs");
		$if.addClass('ama-invisible').appendTo('body');
		__updateSVGs($if, $def);
		return $def;
	};

	var __updateSVGs = function ($if, $def) {
		// Load all structures, one by one, into the frame and retrieve the SVG code
		var mol, id = 0,
			len = window.coumpoundData.length,
			processed = [];

		function retrieveSVG(attempts) {
			$if.$getSVG().done(function (SVG) {
				if (!attempts) {
					$def.notify(id / len, "No SVG for " + id);
					return nextCompound();
				}
				if (!SVG) return setTimeout(function () {
					retrieveSVG(--attempts);
				}, 100);

				$def.notify(id / len, "got SVG");
				if (amaQtHost.setRecordFieldValue(id, 'SVG', SVG, 0)) {
					$def.notify(id / len, "set SVG ok");
					nextCompound();
				}
			});
		}

		function processCompound() {
			$def.notify(id / len, "setting molfile");
			$if.$setMolecule(mol).done(function () {
				$def.notify(id / len, "getting SVG");
				retrieveSVG(10);
			});
		}
		// Iterator function
		function nextCompound() {
			var nomatch = true;
			$.each(window.coumpoundData, function (i, c) {
				if ($.inArray(c.c_id, processed) === -1 && c.MOL) {
					id = c.c_id;
					mol = c.MOL;
					processed.push(c.c_id);
					processCompound();
					nomatch = false;
					return false;
				}
			});
			if (nomatch) {
				$def.resolve();
			}
		}
		nextCompound();
	};

}, window, [jQuery]);