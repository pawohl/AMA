/**
 * Provides the logic for sending feedback
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
 
/*global loader:false, app:false*/
loader.implement('feedback.js', [], function ($) {
	'use strict';

	var $win = $(window),
		formatClientProfile = function (p) {
			return p.name +
				' ' + p.version +
				' (' + p.layout +
				' ' + p.layoutVersion + ')';
		};

	window.feedbackForm = function (e) {
		// Don't prevent default (opening a new tab)
		
		var cssHash = {
				'position': 'relative',
				'z-index': '2',
				'text-shadow': '0 0 2px #000, 0 0 8px #000',
				'font-weight': 'bold',
				'color': '#FFF',
				'background-color': 'rgba(100,100,50,0.2)'
			},
			$dlg = $('<div>').css('position', 'relative'),
			$bg = $('<div>').text('AMA App').attr('style', 'width:831px; height: 260px; background-image: url("images/photos/ChemDrugs_Rillke.jpg"); background-repeat: no-repeat; background-position: 0px 0px; color: rgb(134, 194, 62); display: block; text-align: center; font-weight: bold; font-size: 90px; line-height: 1em; padding-top: 90px; text-shadow: 0px 0px 10px rgb(255, 255, 255), 0px 0px 10px rgb(255, 255, 255), 0px 0px 10px rgb(255, 255, 255); position: absolute; top: 0px; left: 0px; z-index: 1;').appendTo($dlg),
			$info = $('<div>').css(cssHash).text("Das Feedback wird auf einem von der Google Inc. betriebenen Server gesammelt. Im Folgenden einige Informationen zu Deinem System, die speziell für die Fehlerberichterstattung nützlich sind:").hide().delay(500).fadeIn('slow').appendTo($dlg),
			$ul = $('<ul>').css(cssHash).hide().delay(500).fadeIn('slow').appendTo($dlg),
			profile = $.client.profile();

		$('<li>').text("Versionsnummer der Anwendung: " + app.version).appendTo($ul);
		$('<li>').text("Dein Betriebssystem: " + profile.platform).appendTo($ul);
		$('<li>').text("Dein Browser: " + formatClientProfile(profile)).appendTo($ul);
		$dlg.dialog({
			title: "Informationen zur Berichterstattung",
			width: Math.min($win.width(), 837),
			height: Math.min($win.height(), 410),
			close: function () {
				$(this).remove();
			}
		});
	};

	window.feedbackUpdateLink = function () {
		var $this = $(this),
			baseURL = $this.attr('href'),
			profile = $.client.profile();

		baseURL += (baseURL.indexOf('?') > -1) ? '&' : '?';
		// System+Browser
		baseURL += 'entry.1382463044=' + encodeURIComponent(profile.platform + '; ' + formatClientProfile(profile));
		// Version
		baseURL += '&entry.45875960=' + encodeURIComponent(app.version);
		$this.attr('href', baseURL);
	};

}, window, [jQuery]);