/**
 * Update script
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

/*global loader:false, amaQtHost:false, alert:false, console:false*/


$('button').one('click', function() {
	'use strict';
	
	var $prog = $('#prog'),
		$progb = $('progress');
	
	$(this).attr('disabled', 'disabled');
	
	var start = new Date().getTime();
	
	window.updateSVGs().progress(function(fraction, text) {
		var now = new Date().getTime();
		if (now - start > 1000) {
			start = now;
			$progb[0].value = fraction*100;
			$progb.hide().show();
			console.log('updating');
		}
		$prog.prepend($('<div>').text(Math.round(fraction*100) + ' % --' + text));
	}).done(function() {
		$prog.prepend($('<div>').text("DONE."));
		setTimeout(function() {
			$progb[0].value = 100;
			$progb.hide().show();
		}, 100);
	});
});

/*
$('button').one('click', function() {
	'use strict';
	
	var $prog = $('#prog'),
		$progb = $('progress');
	
	$(this).attr('disabled', 'disabled');
	
	$prog.prepend($('<div>').text("Updating your database!"));
	var res = amaQtHost.updateSQL();
	$prog.prepend($('<div>').text("Your database was just updated."));
	
	var start = new Date().getTime();
	
	window.convert2Smiles().progress(function(fraction, text) {
		var now = new Date().getTime();
		if (now - start > 1000) {
			start = now;
			$progb[0].value = fraction*100;
			$progb.hide().show();
			console.log('updating');
		}
		$prog.prepend($('<div>').text(Math.round(fraction*100) + ' % --' + text));
	}).done(function() {
		$prog.prepend($('<div>').text("DONE."));
		setTimeout(function() {
			$progb[0].value = 100;
			$progb.hide().show();
		}, 100);
	});
});
*/
