/**
 * Provides the logic and interface for switching between the
 * different data-view modes. General UI stuff in uihandler,
 * everything required for this in tabslogic.js
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

/*global loader:false, amaQtHost:false, app:false*/
loader.implement('views.js', ['tabslogic.js'], function($) {
	'use strict';
	var storageKey = 'ama_view',
		$doc = $(document),
		$win = $(window),
		$app = $(app),
		$viewButton = $('#ama_view')
		.button({
			icons: {
				primary: 'ui-icon-image',
				secondary: 'ui-icon-triangle-1-s'
			},
			text: false
		}),
		$viewMenu = $('#ama_view_menu'),
		menuSelectHandler, updateViewButton, printView;
	
	$win.on('printViewPrepare', function() {
		var t = app.UI.currentTab,
			v = t.viewMode;

		// Switch to print view
		updateViewButton($.extend({}, printView, { v_icon: 'ui-icon-print' }));
		$doc.trigger('ama-view-changed', [printView, t]);
		
		$win.on('afterprint onafterprint', function() {
			// Switch back
			if (app.UI.currentTab === t) {
				updateViewButton(v);
			}
			$doc.trigger('ama-view-changed', [v, t]);
		});
	});
	
	updateViewButton = function(v) {
		$viewButton.button('option', 'icons', {
			primary: v.v_icon,
			secondary: 'ui-icon-triangle-1-s'
		});
	};
		
	menuSelectHandler = function(evt, ui) {
		$.hook('ama.tabsready').add(function() {
			var v = app.UI.currentTab.viewMode = ui.item.data('view');
			updateViewButton(v);
			// Save view mode for compound-list only
			if (app.UI.currentTab.id === 'tabs-1') $.jStorage.set(storageKey, v);
			// Emit event; it'a up to the view-handlers to deal with this
			$doc.trigger('ama-view-changed', [v, app.UI.currentTab]);
		});
	};
	
	app.views = {
		idFromObj: function(v) {
			return v.v_type + ', ' + v.v_cols;
		}
	};
	
	$doc.bind('ama-tab-switch', function(e, $tabpanel, currentTab) {
		if (currentTab.viewMode) updateViewButton(currentTab.viewMode);
	});
	
	$doc.bind('ama-search-results', function(e, results, criteria, $tab) {
		var tabId = $tab.attr('id'),
			tab = app.UI.tabs[tabId];
		
		// Store results in machine-readable way inside the tab
		$tab.data('ama-search-results', results).data('ama-search-criteria', criteria);
		tab.searchdata = {
			results: results,
			criteria: criteria
		};
		
		// Build table
		$doc.trigger('ama-view-changed', [tab.viewMode, tab]);
		
		// Notify UI handlers that this is a search page with search results
		$doc.triggerHandler('ama-tab-switch', [$tab, tab]);
	});
		
	$.hook('ama.dataloaded').add(function() {
		$.hook('app.contentloaded').add(function() {
			var lastView = $.jStorage.get(storageKey, { v_icon: 'ui-icon-home', v_type: 'grid' }),
				$lastView;

			$.each(window.amaviews, function(i, view) {
				var $li = $('<li>')
						.data('view', view)
						.attr('title', view.v_title),
					$a = $('<a>')
						.attr('href', '#')
						.attr('id', 'ama-view-' + i)
						.text(view.v_display)
						.prependTo($li),
					$span = $('<span>')
						.attr('class', 'ui-icon ' + view.v_icon)
						.prependTo($a);
				$li.appendTo($viewMenu);
				if (lastView.v_icon === view.v_icon && lastView.v_type === view.v_type) {
					$lastView = $a;
				}
				if (view.v_type === 'print') printView = view;
			});
			
			$viewMenu.menu({select: menuSelectHandler }).hide().find('a').click(function(e) {
				if (e && e.preventDefault && $(this).attr('href') === '#') e.preventDefault();
			});
			
			// This also triggers the "ama-view-changed" event
			($lastView || $viewMenu.find('a').first()).click();
			// Tell everyone that we are ready to go and now need a volunteer displaying the data
			$.hook('ama.initialviewmode').fire();
			
			$viewButton.click(function() {
				$viewMenu.show().position({
					my: 'left top',
					at: 'left bottom',
					of: this
				});
				setTimeout(function() {
					if ($viewMenu.filter(':visible').length) {
						$doc.one('click', function(e) {
							$viewMenu.hide();
						});
					}
				}, 4);
			});
			
			var runningPrtinttalbeBuilds = 0;
			$app.on('ama-building-printtable.start', function() {
				runningPrtinttalbeBuilds++;
				$viewButton.button({'disabled': true});
			});
			$app.on('ama-building-printtable.complete', function() {
				runningPrtinttalbeBuilds--;
				if (!runningPrtinttalbeBuilds) $viewButton.button({'disabled': false});
			});
		});
	});
	
	app.filterRenderFieldsByCols = function(cols) {
		var ret = [],
			currentGroup = null;

		$.each(cols, function(i, col) {
			$.each(window.renderfields, function(i2, rf) {
				// Columns can be identified by class or key or group
				if (col !== rf.k && col !== rf.cl && col !== rf.rgroup) return;
				ret.push(rf);
			});
		});
		return ret;
	};
	
	
	app.UI.delegateFormulaMagnifyTooltip = function() {
		$doc.tooltip({
			items: '.ama-sf',
			position: {
				collision: 'flipfit',
				at: 'right top',
				my: 'left bottom'
			},
			content: function() {
				var $this = $(this),
					$img = $this.filter('img').add($this.find('img')),
					newSrc = $img.attr('src'),
					$r = $('<div>').css({
						'background': '#fff'
					});
				 
				if (!newSrc) return false;
				if ($.features.SVGInImg) {
					$r.css({
						'min-height': 329,
						'width': 300
					});
					newSrc = newSrc.replace(/^formulae\/png/, 'formulae/svg')
								.replace(/\.png$/, '.svg')
								.replace(/png(\?\d*)$/, 'svg$1');
				}
				
				var $imgNew = $('<img>').attr({
					src: newSrc
				}).css({
					padding: 5
				}).appendTo($r);
				if ($.features.SVGInImg) {
					$imgNew.css({
						width: '290px',
						height: 'auto'
					});
				}
				$('<div>').addClass('ama-magnify-hover').append(
					$('<div>').text($img.attr('title')),
					$('<div>').addClass('ama-smiles').text($img.data('smiles')) ).appendTo($r);
				return $r;
			}
		});
	
		$win.tooltip({
			items: '.ama-photo',
			tooltipClass: 'ama-photo-tooltip',
			position: {
				collision: 'flipfit',
				at: 'right top',
				my: 'left bottom'
			},
			content: function() {
				var $this = $(this),
					$img = $this.filter('img').add($this.find('img')),
					newSrc = $img.attr('src'),
					$r = $('<div>').css({
						'background': '#eed'
					});
				 
				if (!newSrc) return false;
				$r.css({
					'width': 500
				});
				
				var $imgNew = $('<img>').attr({
					src: newSrc
				}).css({
					padding: 0,
					margin: 0,
					display: 'block'
				}).appendTo($r);
				$imgNew.css({
					width: '500px',
					height: 'auto'
				});
				return $r;
			}
		});
	};
	$(app.UI.delegateFormulaMagnifyTooltip);
	
	window.cacheID = $.now();
	window.flushImgCache = function() {
		window.cacheID = $.now();
	};
	
	if (!app.data) {
		app.data = {};
	}
	app.data.getVal = function(row, field) {
		return window.compoundData[row][field];
	};
	app.UI.currentTab.$getCurrentView = function() {
		return app.UI.currentTab.views[ app.views.idFromObj(app.UI.currentTab.viewMode) ];
	};
	app.UI.currentTab.$getVisibleRowById = function(id) {
		var t = app.UI.currentTab, 
			$v = t.$getCurrentView();

		return $v.getVisibleRowById(id);
	};
}, window, [jQuery]);