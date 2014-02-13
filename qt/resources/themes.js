/**
 * Theme selection
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
loader.implement('themes.js', ['tabslogic.js'], function($) {
	'use strict';
	var storageKey = 'ama_theme',
		idPrefix = 'ama_theme_',
		selected = {
			brightness: 'light',
			theme: 'flick'
		},
		printTheme = {
			brightness: 'light',
			theme: 'simple'
		},
		allThemes = [],
		$checkTemplate = $('<span class="ui-icon ui-icon-check"></span>'),
		$win = $(window),
		$allThemeMenuItems, beforePrint,
		applyTheme, timeout, extractTheme, saveThemeSelection;
	
	applyTheme = function(t) {
		var $css = $('link[rel="stylesheet"]'),	
			$body = $(document.body);

		$css.each(function(i, el) {
			var $el = $(el),
				href = $el.attr('href');
				
			if (href.indexOf('jQuery/themes/') < 0) return;
			$el.attr('href', href.replace(new RegExp('\\/(?:' + allThemes.join('|') + ')\\/', ''), '/' + t.theme + '/'));
			$body.removeClass('light dark').removeClass(allThemes.join(' ')).addClass(t.brightness).addClass(t.theme);
		});
	};
	
	saveThemeSelection = function(t) {
		app.currentTheme = selected = t;
		$allThemeMenuItems.find('span.ui-icon').remove();
		$('#' + idPrefix + t.theme).prepend($checkTemplate.clone());
		$.jStorage.set(storageKey, t);
		$(window).resize();
	};
	
	extractTheme = function($menuItem) {
		return {
			brightness: $menuItem.attr('href').replace(/#(.+)$/, '$1'),
			theme: $menuItem.attr('id').replace(idPrefix, '')
		};
	};
	
	$allThemeMenuItems = $('#ama_themes').find('li a').click(function(e) {
		var theme = extractTheme($(this));	
		e.preventDefault();
		if (timeout) clearTimeout(timeout);
		applyTheme(theme);
		saveThemeSelection(theme);
		$(window).resize();
	}).hover(function() {
		if (timeout) clearTimeout(timeout);
		var theme = extractTheme($(this));
		timeout = setTimeout(function() {
			applyTheme(theme);
		}, 500);
	}, function() {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(function() {
			applyTheme(selected);
		}, 1);
	}).each(function() {
		var theme = extractTheme($(this));
		allThemes.push(theme.theme);
	});
	
	selected = $.extend(true, selected, $.jStorage.get(storageKey));
	applyTheme(selected);
	saveThemeSelection(selected);
	$win.on('print beforeprint', function() {
		if (beforePrint !==  app.currentTheme) beforePrint = app.currentTheme;
		applyTheme(printTheme);
	});
	$win.on('afterprint onafterprint', function() {
		applyTheme(beforePrint);
	});
}, window, [jQuery]);