/**
 * Display data in jqGrid
 * Good for display, bad for printing.
 *
 * @author Felix Pahlow
**/

/*
 * Copyright (C) 2013 Felix Pahlow
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

/*global loader:false, app:false, getCompoundByID:false*/
loader.implement('grid.js', ['views.js'], function($) {
	'use strict';
	app.UI.grid = {};
	
	var $doc = $(document),
		gridCounter = 0;

	var cols2ColNames = function(cols) {
		var colsOut = [];
		
		$.each(app.filterRenderFieldsByCols(cols), function(i, rf) {
			colsOut.push(rf.display || rf.k);
		});
		return colsOut;
	};
	
	/**
	 * Converts data to a format that can be read by jqGrid
	 * @private
	**/
	var cols2ColModel = function(cols) {
		var colsOut = [],
			idField = 'c_id';

		$.each(app.filterRenderFieldsByCols(cols), function(i, rf) {
			var ret = {
				name: rf.k,
				index: rf.k,
				classes: rf.cl,
				width: rf.w,
				align: rf.align,
				sorttype: rf.sorttype || 'text',
				editable: true
			};
			if (rf.k === idField) {
				ret.key = true;
				ret.hidden = true;
			}
			if (rf.formatter) ret.formatter = rf.formatter;
			
			if (rf.html) {
				ret.formatter = htmlFormatter;
			} else if (rf.formatter === 'ghsFormatter') {
				ret.formatter = ghsFormatter;
			} else if (rf.img) {
				ret.formatter = imgFormatter;
				ret.fixed = true;
				ret.resizable = false;
				ret.search = false;
				ret.sortable = false;
			} else {
				ret.formatter = textFormatter;
			}
			if (ret.formatter && !ret.unformat) {
				ret.unformat = unFormatter;
			}
			colsOut.push(ret);
		});
		return colsOut;
	};
	
	var cols2groupHeaders = function(cols) {
		var colsHeadsOut = [],
			currentGroup = null;
			
		$.each(app.filterRenderFieldsByCols(cols), function(i, rf) {
			if (currentGroup) {
				if (currentGroup.id === rf.rgroup) {
					// Belongs to the current group
					currentGroup.numberOfColumns++;
				} else {
					// Group end, push result
					colsHeadsOut.push(currentGroup);
					currentGroup = null;
				}
			}
			if (rf.rgroup && !currentGroup) {
				// Start a new group
				currentGroup = {
					id: rf.rgroup,
					titleText: window.rendergroupinfo[rf.rgroup].display,
					startColumnName: rf.k,
					numberOfColumns: 1
				};
			}
		});
		// Last col maybe not pushed yet
		if (currentGroup) {
			colsHeadsOut.push(currentGroup);
		}
		return colsHeadsOut;
	};
	
	var unFormatter = function(cellvalue, options, cell) {
		return $(cell).find('.originalValue').data('ov');
	};
	
	var originalValue = function(v) {
		return $('<div>').append($('<div>').attr('class', 'originalValue').hide().attr('data-ov', v)).html();
	};
	
	var textFormatter = function(cellvalue) {
		return $('<div>').append($('<span>').text(cellvalue)).html() + originalValue(cellvalue);
	};
	
	var htmlFormatter = function(cellvalue) {
		return cellvalue + originalValue(cellvalue);
	};
	
	var imgFormatter = (function() {
			var rfs, rfd, init;
			
			init = function() {
				rfs = window.renderfields;
				rfd = $.grep(rfs, function(rf, i) { return rf.k === 'c_structure_name'; })[0];
				init = null;
			};

			return function(cellvalue, options, rowObject) {
				var imgSrc;
				if (init) init();

				imgSrc = rfd.img.replace('%1', rowObject[rfd.k]) + (window.amaQtHost ? ('?' + window.cacheID) : '');
				
				return $('<div>').append($('<img>').attr({
						src: imgSrc,
						title: rowObject[rfd.k],
						'data-SMILES': getCompoundByID(Number(rowObject['c_id']))['c_smiles']
					})).html() + originalValue(cellvalue);
			};
		}());
	
	var ghsFormatter = function(cellvalue, options, rowObject) {
		var $ret = $('<div>'),
			pictos = cellvalue.match(/\d\d/g);
		
		$.each(pictos || [], function(i, p) {
			$('<img>')
				.attr({
					src: 'images/GHS/GHS' + p + '.png',
					height: 50,
					width: 50,
					title: 'GHS ' + p
				})
				.appendTo($ret);
		});
		$('<div>').text(cellvalue).appendTo($ret);
		return $ret.html() + originalValue(cellvalue);
	};
	
	
	app.UI.grid.created = [];
	app.UI.grid.createGrid = function(data, cols, $el) {
		$el = $($el);
		var groupHeaders, $panes,
			id = $el.attr('id'),
			h = window.getTabContentHeight(),
			$g = $el.jqGrid({
				data: data,
				datatype: 'local',
				height: h,
				rowNum: 25,
				rowList: [5,10,25,50,100,150,250],
				colNames: cols2ColNames(cols),
				colModel: cols2ColModel(cols),
				viewrecords: true,
				autowidth: true,
				sortname: 'name',
				toppager: true,
				editurl: 'http://example.com/edit.php'
			});
			
		var databaseOk = !!(window.amaQtHost && window.amaQtHost.db_connected),
			toppager = '#' + id + '_toppager';
			
		$el.jqGrid('navGrid', toppager, {del: databaseOk, add: databaseOk, edit: databaseOk, addfunc: databaseOk ? window.amaAddRecord : null, editfunc: databaseOk ? window.amaEditRecord : null }, {}, {}, {}, {multipleSearch:true});
		if (databaseOk) {
			$el.jqGrid('inlineNav', toppager, { add: false });
		}
		groupHeaders = cols2groupHeaders(cols);
		if (groupHeaders.length) {
			$el.jqGrid('setGroupHeaders', {
				useColSpanStyle: false, 
				groupHeaders: groupHeaders
			});
		}
		$panes = $('#gview_' + id).children();
		$el.jqGrid( 'setGridHeight', h - $panes.filter('.ui-jqgrid-toppager').height() - $panes.filter('.ui-jqgrid-hdiv').height() );
		return $g;
	};
	
	
	$doc.bind('ama-view-changed', function(e, v, t) {
		if (v.v_type !== 'grid' || !window.compoundData) return;

		var $t = t.$content,
			v_id = app.views.idFromObj(v),
			$view = t.views[v_id],
			data = t.id === 'tabs-1' ? window.compoundData : t.searchdata.results,
			gridCounter = 0,
			$tbl, gridID;
		
		$t.children().hide();
		
		// Check whether such a table already exists, and show it if so
		if ($view) {
			t.$currentView = $view;
			$view.parents().show();
			return;
		}
		
		gridCounter++;
		gridID = 'grid' + gridCounter + '_' + Math.round(Math.random() * 65536);
		t.views[v_id] = $tbl = $('<table id="' + gridID + '"><tr><td></td></tr></table>').appendTo($t);
		
		app.UI.grid.createGrid(data, v.v_cols.split('|'), $tbl);
		app.UI.grid.created.push($tbl);
		
		$tbl.getVisibleRowById = function(id) {
			return $tbl.find('tr[role="row"][id="' + id + '"]');
		};
	});
	
	$(app).on('message.datasocket', function(e, msg) {
		// Update all grids
		if (app.sorting || !msg.compound.c_id) return;
			setTimeout(function() {
				$.each(app.UI.grid.created, function(i, $grid) {
					var visibleRows = $grid.jqGrid('getDataIDs'),
						isRowVisible;
						
					visibleRows = $.map(visibleRows, function(c_id) {
						return Number(c_id);
					});
					isRowVisible = $.inArray(Number(msg.compound.c_id), visibleRows) > -1;
					
					if (isRowVisible || msg.action === 'insert') {
						// The following does only work if the current row is visible
						switch (msg.action) {
							case 'update':
									$grid.jqGrid('setRowData', msg.compound.c_id, msg.compound, 'ui-state-active');
								break;
							case 'delete':
									$grid.jqGrid('delRowData', msg.compound.c_id);
								break;
							case 'insert':
									$grid.jqGrid('addRowData', msg.compound.c_id, msg.compound, 'first');
								break;
						}
					} else {
						if (msg.action === 'update') {
							var d = $grid.jqGrid('getGridParam', 'data'),
								idx = $grid.jqGrid('getGridParam', '_index'),
								itemIdx = idx[msg.compound.c_id + ''];

							d[itemIdx] = msg.compound;
						} else {
							$grid.jqGrid('setGridParam', { data: window.compoundData });
							setTimeout(function() {
								$grid.trigger('reloadGrid');
							}, 5);
						}
					}
			});
		}, 50);
	});
	
}, window, [jQuery]);