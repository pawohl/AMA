/**
 * Provides the functionality for building
 * the list of compounds.
 *
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
loader.implement('printtable.js', ['tabslogic.js', 'views.js'], function($) {
	'use strict';
	app.UI.printtable = {};
	
	var $deleteButtons = $(),
		$editButtons = $(),
		$exportButtons = $(),
		$win = $(window),
		$doc = $(document),
		$progTable;
	
	$doc.on('ama-view-changed', function(e, v, t) {
		if (v.v_type !== 'print' || !window.compoundData) return;

		var $t = t.$content,
			v_id = app.views.idFromObj(v),
			$view = t.views[v_id],
			data = t.id === 'tabs-1' ? window.compoundData : t.searchdata.results,
			$tbl;
		
		$t.children().hide();
		
		// Check whether such a table already exists, and show it if so
		if ($view) {
			t.$currentView = $view;
			$view.parents().add($view).show();
			$win.trigger('resize');
			$win.trigger('printViewOk');
			return;
		}
		
		$tbl = window.$manageBuildTable(data, '#' + t.id, v.v_cols.split('|')).$table;
		t.views[v_id] = $tbl;
		app.UI.printtable.created.push($tbl);
	});
	
	window.$manageBuildTable = function(data, tab, fields) {
		if (!$progTable) {
			$progTable = $('#progtable').show().css('height', window.getTabContentHeight());
		}
		$progTable.appendTo(tab);
	
		var $prog = $('#loadprog'),
			$progTxt = $('#loadprogtxt'),
			$def = app.UI.printtable.$build(data, tab, fields)
				.progress(function(prog, progTxt) {
					$prog.progressbar({ value: prog });
					$progTxt.text(progTxt);
				})
				.done(function() {
					$progTable.detach();
				})
				.fail();
				
		return $def;
	};
	
	var onMasterButtonClick = function(e) {
		e.preventDefault();
		var $this = $(this),
			$tr = $this.closest('tr'),
			id = $tr.data('ama-compound-id'),
			op = $this.data('ama-button-op');
			
		if (!$tr.length) $tr = $this.filter('tr');
		window[op](id);
	};
	
	
	
	/*****************************************************/
	/*****************************************************/
	/*****************************************************/
	app.UI.printtable.created = [];
	app.UI.printtable.$makeRow = function(v, fields) {
		var $row = $('<tr>'),
			casField = $.grep(window.renderfields, function(v, i) { return v.k === 'c_cas'; })[0],
			amaQtHost = window.amaQtHost,
			imgSrc;

		$.eachItem(fields, function(i, i2, def) {
			var $td = $('<td>').attr({
				'class': def.cl,
				'title': def.title
			});
			if (def.img) {
				imgSrc = def.img.replace('%1', v[def.k]) + (window.amaQtHost ? ('?' + window.cacheID) : '');
				
				$('<img>').attr({
					src: imgSrc,
					title: v[def.k]
				}).data('smiles', v['c_smiles']).appendTo($td);
			} else if (def.html) {
				$td.html(v[def.k]);
			} else {
				
				if (def.k === 'c_name') {
					// TODO: This should not be hardcoded
					// Insert CAS-number below the name
					$td.append( $('<div>').text(v[def.k]), $('<div>', { title: casField.title, 'class': 'ama-cas' }).text(v['c_cas']) );
				} else {
					$td.text(v[def.k]);
				}
			}
			if (def.buttons && amaQtHost && amaQtHost.db_connected) {
				$deleteButtons = $deleteButtons.add(
					$('<button>')
						.attr('title', "Löschen")
						.button({ icons: { primary: 'ui-icon-trash' }, text: false })
						.data('ama-button-op', 'amaDeleteRecord')
						.click(onMasterButtonClick)
						.appendTo($td) 
				);
				$exportButtons = $exportButtons.add(
					$('<button>')
						.attr('title', "Exportieren")
						.button({ icons: { primary: 'ui-icon-arrowthickstop-1-s' }, text: false })
						.data('ama-button-op', 'amaExportRecord')
						.click(onMasterButtonClick)
						.appendTo($td)
				);
				$editButtons = $editButtons.add(
					$('<button>')
						.attr('title', "Ändern")
						.button({ icons: { primary: 'ui-icon-pencil' }, text: false })
						.data('ama-button-op', 'amaEditRecord')
						.click(onMasterButtonClick)
						.appendTo($td)
				);
				$row.data('ama-compound-id', v.c_id);
			}
			$row.append($td);
		});
		if (amaQtHost && amaQtHost.db_connected) {
			$row.data({
					'ama-button-op': 'amaEditRecord',
					'ama-compound-id': v.c_id,
					'ama-imgsrc': imgSrc
				})
				.dblclick(onMasterButtonClick);
		}
		return $row;
	};
	
	// This is not an entire proper solution as
	// td should only contain data and not a legend…
	app.UI.printtable.$getLegend = function() {
		var $foot = $('<tfoot>').addClass('print-block ama-legend-foot'),
			$row = $('<tr>').appendTo($foot),
			$cell = $('<td>').appendTo($row),
			colCount = 0;
			
		$.eachItem(window.renderfields, function(i, i2, def) {
			colCount++;
			// Only add those that have an additional explanation-text
			// This should be probably an unordered list
			if (def.title) {
				if (!def.display) {
					$('<span>').text(def.k + ": " + def.title).appendTo($cell);
				} else {
					$('<span>').html(def.display + ": " + def.title).appendTo($cell);
				}
				$cell.append(' | ');
			}
		});
		$cell.attr('colspan', colCount);
		
		return $foot;
	};
	
	app.UI.printtable.$build = function(data, tab, fields) {
		var $def = $.Deferred(),
			$st = $('<table>').addClass('printtable'),
			$head = $('<thead>').appendTo($st),
			$columnheadings = $('<tr>').appendTo($head),
			$tbody = $('<tbody>').appendTo($st),
			datalength = data.length;
			
		$(app).trigger('ama-building-printtable.start');
		fields = app.filterRenderFieldsByCols(fields);
		$st.rows = {};
		$st.fields = fields;
				
		$.eachItem(fields, function(i, i2, def) {
			var $th = $('<th>').attr({
				'class': def.cl
			}).appendTo($columnheadings);
			if (def.title) {
				$th = $('<abbr>').attr('title', def.title).appendTo($th);
			}
			if (!def.display) {
				$th.text(def.k);
			} else {
				$th.html(def.display);
			}
		});
		$columnheadings.appendTo($head);
		
		
		jQuery.eachAsync(data, {
				bulk: 200,
				loop: function(idx, v) {
					var $row = app.UI.printtable.$makeRow(v, fields);
					$row.appendTo($tbody);
					$def.notify(idx/datalength*100, "Laden der Liste…");
					$st.rows[v.c_id] = $row;
				},
				end: function() {
					var resizeTimeout, $footer;
					
					$def.notify(100, "Darstellung wird ausgeführt…");
					$footer = app.UI.printtable.$getLegend();
					$footer.appendTo($st);
					
					setTimeout(function() {
						$st.css('visibility', 'hidden').appendTo(tab);
						
						if (app.currentTheme.theme !== 'simple' && !$.features.isMobile) {
							// Not a typo. See https://github.com/markmalek/Fixed-Header-Table/issues/59
							setTimeout(function() {
								$st.css('visibility', '');
								$st.fixedHeaderTable({ fixedColumn: false, height: window.getTabContentHeight() });
								$st.fixedHeaderTable({ fixedColumn: false, height: window.getTabContentHeight() });
							}, 1);
						} else {
							$st.css('visibility', '');
						}
						$win.resize(function() {
							if (resizeTimeout) clearTimeout(resizeTimeout);
							resizeTimeout = setTimeout(function() {
								var $stParent = $st.parent();
								if (app.currentTheme.theme === 'simple' || $.features.isMobile) {
									$st.fixedHeaderTable('destroy');
								} else {
									if (window.printing || app.UI.currentTab.viewMode.v_type !== 'print') return;
									$st.fixedHeaderTable({ fixedColumn: false, height: window.getTabContentHeight() });
									$st.fixedHeaderTable({ fixedColumn: false, height: window.getTabContentHeight() });
								}
							}, 600);
						});
						$win.on('print beforeprint', function() {
							window.printing = true;
							$st.fixedHeaderTable('destroy');
						});
						$win.on('afterprint', function() {
							window.printing = false;
							$win.triggerHandler('resize');
						});
						setTimeout(function() {
							$win.trigger('printViewOk');
						}, 10);
						$def.resolve();
						$(app).trigger('ama-building-printtable.complete');
					}, 10);
				}
		});
		$st.getVisibleRowById = function(id) {
			return $st.rows[id];
		};
		$def.$table = $st;
		return $def;
	};
	
	$(app).on('message.datasocket', function(e, msg) {
		// Update all printtables
		if (app.sorting || !msg.compound.c_id) return;
		setTimeout(function() {
			switch (msg.action) {
				case 'update':
					$.each(app.UI.printtable.created, function(i, $printtable) {
						var $row = $printtable.rows[msg.compound.c_id];
						if (!$row) return;
						$printtable.rows[msg.compound.c_id] = app.UI.printtable
							.$makeRow(msg.compound, $printtable.fields)
							.insertAfter($row).addClass('ui-state-active');
						$row.remove();
					});
					break;
				case 'delete':
					$.each(app.UI.printtable.created, function(i, $printtable) {
						var $row = $printtable.rows[msg.compound.c_id];
						if (!$row) return;
						$row.remove();
					});
					break;
				case 'insert':
					// Add on top of all tables
					$.each(app.UI.printtable.created, function(i, $printtable) {
						var $row = app.UI.printtable
							.$makeRow(msg.compound, $printtable.fields)
							.delay(300)
							.effect('highlight', 800);
						
						$printtable.rows[msg.compound.c_id] = $row;
						$printtable.find('tbody').prepend($row);
					});
					break;
			}
		}, 50);
	});

}, window, [jQuery]);