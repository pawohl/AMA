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
		var $dlg = $('<div>').text(
			"Das Feedback wird auf einem von der Google Inc. betriebenen Server gesammelt. Im Folgenden einige Informationen zu Deinem System, die speziell für die Fehlerberichterstattung nützlich sind:"
		),
			$ul = $('<ul>').appendTo($dlg),
			profile = $.client.profile();

		$('<li>').text("Versionsnummer der Anwendung: " + app.version).appendTo($ul);
		$('<li>').text("Dein Betriebssystem: " + profile.platform).appendTo($ul);
		$('<li>').text("Dein Browser: " + formatClientProfile(profile)).appendTo($ul);
		$dlg.dialog({
			title: "Informationen zur Berichterstattung",
			width: Math.min($win.width(), 600),
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