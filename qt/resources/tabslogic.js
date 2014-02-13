/**
 * Tab handler
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
loader.implement('tabslogic.js', [], function($) {
	'use strict';
	var $win = $(window),
		borders = 90;
	
	if (!app.UI) app.UI = {};
	app.UI.tabs = {};
	
	window.getTabContentHeight = function() {
		return $win.height() - borders;
	};
	
	$(function() {
		var $tabTitle = $('#amaNewSearchTitle'),
			tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close' title='Tab schließen'>Tab schließen</span></li>",
			tabCounter = 2,
			$doc = $(document),
			tab1Id = 'tabs-1',
			$tab1 = $('#' + tab1Id),
			$tabsNav;

		var __onActivate = function(e, ui) {
				app.UI.$amaCurrentTabPanel = ui.newPanel;
				app.UI.currentTab = app.UI.tabs[ui.newPanel.attr('id')];
				$doc.triggerHandler('ama-tab-switch', [ui.newPanel, app.UI.currentTab]);
			},
			$tabs = $('#tabs').tabs({
				activate: __onActivate
			});
			
		app.UI.tabs[tab1Id] = {
			id: 'tabs-1',
			$header: $('#tabs').find('li').first(),
			$content: $tab1,
			views: {}
		};
		__onActivate(null, { newPanel: $tab1 });
		
		$tabsNav = $tabs.find('.ui-tabs-nav').addClass('print-hidden print-reset');
		var makeSortable = function() {
			$tabsNav.sortable({
				axis: "x",
				stop: function() {
					$tabs.tabs( "refresh" );
				}
			});
		};

		// actual addTab function: adds new tab using the input from the form above
		app.UI.addTab = function(labeltitle) {
			var tab = {}, oTab,
				label = labeltitle || $tabTitle.val() || "Tab " + tabCounter,
				panelId = "tabs-" + tabCounter,
				li = $( tabTemplate.replace( /#\{href\}/g, "#" + panelId ).replace( /#\{label\}/g, label ) );

			tab.$header = li;
			tab.$content = $('<div class="tabcontent print-reset" id="' + panelId + '"></div>');
			tab.label = label;
			
			$tabs.find( '.ui-tabs-nav' ).append( tab.$header );
			$tabs.append( tab.$content );
			$tabs.tabs( 'refresh' );
			makeSortable();
			tabCounter++;
			
			oTab = app.UI.tabs[panelId] = {
				id: panelId,
				$header: tab.$header,
				$content: tab.$content,
				views: {}
			};
			
			if (app.UI.currentTab && app.UI.currentTab.viewMode) {
				oTab.viewMode = app.UI.currentTab.viewMode;
			}
			
			return tab;
		};

		// close icon: removing the tab on click
		$doc.on('click', '#tabs span.ui-icon-close', function() {
			var panelId = $( this ).closest('li').remove().attr('aria-controls');
			$( "#" + panelId ).remove();
			$tabs.tabs('refresh');
			makeSortable();
			delete app.UI.tabs[panelId];
		});
		$.hook('ama.tabsready').fire();
	});
}, window, [jQuery]);