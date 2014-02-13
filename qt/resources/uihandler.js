/**
 * Builds large parts of the user interface, binds events
 * handlers and even handles some of those directly
 * TODO: Eliminate alert
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

/*global loader:false, amaQtHost:false, usingQt:false, feedbackUpdateLink:false, alert:false, app:false*/
loader.implement('uihandler.js', ['tabslogic.js'], function($) {
	'use strict';

	window.getCurrentTabCriteria = function() {
		return app.UI.$amaCurrentTabPanel.data('ama-search-criteria');
	};
	window.getCurrentTabResults = function() {
		return app.UI.$amaCurrentTabPanel.data('ama-search-results');
	};

	var appStateFullScreen,
		i,
		$menu = $('#ama_menu'),
		$bigsearch = $('#ama_bigsearch'),
		$bigPlus = $('#ama_bigplus'),
		$dropdown = $('#ama_dropdown'),
		$panelbutton = $('#panelbutton'),
		$search = $('#ama_search'),
		$closeApp = $('#ama_close_app'),
		$minimizeApp = $('#ama_minimize_app'),
		$fullscreenApp = $('#ama_fullscreen_app'),
		$closeFullscreenApp = $('#ama_closefullscreen_app'),
		$allowEditApp = $('#ama_allow_edit'),
		$save = $('#ama_save'),
		$filter = $('#ama_filter'),
		$printView = $('#ama_print'),
		$masterOptions = $('#ama_master_options'),
		$sortNow = $('#ama_sort_now'),
		$sortNote = $('#amaSortNote'),
		$addCompound = $('#ama_add_compound'),
		$backUp = $('#ama_backup'),
		$import = $('#ama_import_record'),
		$packAndGo = $('#ama_pack_and_go'),
		$thems = $('#ama_themes'),
		$legend = $('#ama_legend'),
		$feedback = $('#ama_feedback'),
		allowedit = false,
		$tabs = $('#tabs'),
		$tab1 = $('#tabs-1'),
		supportsEditable = 'contentEditable' in ($tabs[0] || {}),
		$win = $(window),
		$doc = $(document);

	// ------------
	//
	$menu.find('a').click(function(e) {
		if (e && e.preventDefault && $(this).attr('href') === '#') e.preventDefault();
	});
	$menu.menu().hide();
	$bigsearch.button({ 
		icons: { 
			primary: 'ui-icon-search' 
		}
	});
	$bigPlus.button({ 
		icons: { 
			primary: 'ui-icon-circle-plus' 
		}
	});
	$dropdown.button({ 
		icons: { 
			primary: 'ui-icon-triangle-1-s' 
		}, 
		text: false 
	}).click(function() {
		$menu.show().position({
			my: 'left top',
			at: 'left bottom',
			of: this
		});

		setTimeout(function() {
			if ($menu.filter(':visible').length) {
				$doc.one('click', function() {
					$menu.hide();
				});
			}
		}, 4);
	}).parent().buttonset();

	$closeApp.click(function(e) {
		if (e && e.preventDefault) e.preventDefault();
		if (window.amaQtHost) {
			setTimeout(function() {
				amaQtHost.closeApp();
			}, 100);
			if (amaQtHost.db_connected) window.onSorting();
		} else {
			window.close();
		}
	});
	$minimizeApp.click(function(e) {
		if (e && e.preventDefault) e.preventDefault();
		if (window.amaQtHost) {
			amaQtHost.minimizeApp();
		} else {
			alert("Not possible when running as a web application");
		}
	});
	var toggleFullScreenButtons = function() {
		appStateFullScreen = !appStateFullScreen;
		$fullscreenApp.toggle();
		$closeFullscreenApp.toggle();
	};
	$fullscreenApp.click(function(e) {
		if (e && e.preventDefault) e.preventDefault();
		if (window.amaQtHost) {
			amaQtHost.fullscreenApp();
		} else {
			$(document.documentElement).requestFullScreen();
		}
		toggleFullScreenButtons();
	});
	$closeFullscreenApp.click(function(e) {
		if (e && e.preventDefault) e.preventDefault();
		if (window.amaQtHost) {
			amaQtHost.closefullscreenApp();
		} else {
			$.FullScreen.cancelFullScreen();
		}
		toggleFullScreenButtons();
	});
	$allowEditApp.click(function(e) {
		if (e && e.preventDefault) e.preventDefault();
		allowedit = !allowedit;
		if (window.amaQtHost) {
			setTimeout(function() {
				amaQtHost.allowEditApp(allowedit);
			}, 100);
		} else {
			$tabs[0].contentEditable = allowedit;
		}
	});

	$bigsearch.focus().add($search).click(function(e) {
		if (e && e.preventDefault) e.preventDefault();
		window.launchSearch();
	});
	$filter.click(function(e) {
		if (e && e.preventDefault) e.preventDefault();
		window.launchFilter();
	});
	$printView.click(function(e) {
		if (e && e.preventDefault) e.preventDefault();
		var __printViewOk = function() {
			$win.off('printViewOk', __printViewOk);
			$win.triggerHandler('print');
			window.print();
			setTimeout(function() {
				$win.triggerHandler('afterprint');
			}, 60000);
		};
		$win.on('printViewOk', __printViewOk);
		$win.triggerHandler('printViewPrepare');
	});
	$thems.click(function(e) {
		if (e && 'ama_themes' === $(e.target).parent().attr('id') && e.stopPropagation) e.stopPropagation();
	});
	$feedback.click(window.feedbackForm).one('mouseenter', feedbackUpdateLink);
	$legend.click(function(e) {
		if (e && e.preventDefault) e.preventDefault();
		var dlgTitle = "Info, Legende",
			$dlgContent = $('<div>').html(window.legend),
			$dlg, $titlebar;
			
		$dlg = $('<div>').append($dlgContent).dialog({
			title: dlgTitle,
			width: Math.min($(window).width(), 800),
			height: Math.min($(window).height() - 10, 800),
			modal: false,
			open: function() {
				var pattern = '<span class="ui-titlebar-icon ui-icon %icon%"></span><span>%title%</span>'
					.replace('%icon%', 'ui-icon-help')
					.replace('%title%', dlgTitle);
					
				// jQuery "fixed" a "new" XSS?! so we can't use HTML in the titlebar directly
				$titlebar.html(pattern);
			},
			autoOpen: false
		});
		$titlebar = $dlg.prev().find('.ui-dialog-title');
		$dlg.dialog('open');
	});
	
	$doc.bind('ama-tab-switch', function(e, $tabpanel) {
		if ($tabpanel.data('ama-search-results')) {
			$save.show();
			$filter.show();
		} else {
			$save.hide();
			$filter.hide();
		}
	});

	usingQt(function() {
		if (window.amaQtHost) {
			$closeFullscreenApp.hide();
			appStateFullScreen = false;
			app.version = amaQtHost.appVersion;
			
			if (!amaQtHost.db_connected) {
				$masterOptions.addClass('ui-state-disabled');
			} else {
				loader.using(['databaseeditor.js', 'recordeditor.js', 'masterrecords.js'], function() {
					$addCompound.add($bigPlus).click(function(e) {
						e.preventDefault();
						window.amaAddRecord();
					});
					$sortNow.add($sortNote).click(function(e) {
						e.preventDefault();
						window.updateSorting();
					});
					$backUp.click(function(e) {
						e.preventDefault();
						window.createDBBackUp();
					});
					$packAndGo.click(function(e) {
						e.preventDefault();
						window.packAndGo();
					});
					$import.click(function(e) {
						e.preventDefault();
						window.importRecord();
					});
				});
			}
		} else {
			$minimizeApp.hide();
			$closeFullscreenApp.hide();
			if (!supportsEditable) $allowEditApp.next('label').hide();
			if (!$.FullScreenSupported) $fullscreenApp.hide();
			if (!window.opener) $closeApp.hide();
			$masterOptions.hide();
			$bigPlus.hide();
			appStateFullScreen = false;
			loader.load('studentrecords.js');
		}
	});
	
}, window, [jQuery]);