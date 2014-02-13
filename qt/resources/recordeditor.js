/**
 * Provides the API and user interface for editing
 * records.
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
 
/*global loader:false, amaQtHost:false, CKEDITOR:false, molEdit:false, saveAs:false*/
loader.implement('recordeditor.js', ['clipboard.js'], function($) {
	'use strict';
	var $win = $(window);
	
	window.$renderRecords = function(records) {
		var $def = $.Deferred(),
			$if = window.molEdit.$create();

		$def.notify(0, "invoking __convert2Smiles");
		$if.addClass('ama-invisible').appendTo('body');
		__renderImages($if, $def);
		return $def;
		
		function __renderImages($if, $def) {
			// Load all structures, one by one, into the frame and retrieve the SMILES code and images
			var mol, record,
				len = records.length,
				processed = [];

			function retrieveSMILES(attempts) {
				$if.$getSMILES().done(function (SMILES) {
					if (!attempts) {
						$def.notify("No SMILES for " + record['c_name']);
						return nextCompound();
					}
					if (!SMILES) return setTimeout(function () {
						retrievePNG(--attempts);
					}, 100);

					$def.notify("got SMILES");
					record['c_smiles'] = SMILES;
					nextCompound();
				});
			}
				
			function retrievePNG(attempts) {
				$if.$getPNG().done(function (PNG) {
					if (!attempts) {
						$def.notify("No PNG for " + record['c_name']);
						return nextCompound();
					}
					if (!PNG) return setTimeout(function () {
						retrievePNG(--attempts);
					}, 100);

					$def.notify("got PNG");
					record['PNG'] = PNG;
					retrieveSMILES(10);
				});
			}
				
			function retrieveSVG(attempts) {
				$if.$getSVG().done(function (SVG) {
					if (!attempts) {
						$def.notify("No SVG for " + record['c_name']);
						return nextCompound();
					}
					if (!SVG) return setTimeout(function () {
						retrieveSVG(--attempts);
					}, 100);

					$def.notify("got SVG for " + record['c_name']);
					record['SVG'] = SVG;
					retrievePNG(10);
				});
			}

			function processCompound() {
				$def.notify("setting molfile for " + record['c_name']);
				$if.$setMolecule(mol).done(function () {
					$def.notify("getting images for " + record['c_name']);
					retrieveSVG(10);
				});
			}
			
			// Iterator function
			function nextCompound() {
				var nomatch = true;
				$.each(records, function (i, c) {
					if ($.inArray(c, processed) === -1 && c.MOL) {
						mol = c.MOL;
						record = c;
						processed.push(c);
						processCompound();
						nomatch = false;
						return false;
					}
				});
				if (nomatch) {
					$def.resolve();
					$if.remove();
				}
			}
			if (records.length) {
				nextCompound();
			} else {
				$def.notify("Nothing to import.");
				$def.resolve();
			}
		}
	};
	
	window.$getDlgValues = function($dlg) {
		var $def = $.Deferred(),
			defs = [],
			datamap = $dlg.compoundData;
		
		// Text data
		$.each($dlg.valueFields, function(key, $fld) {
			datamap[key] = $fld.val();
		});
		
		// Formula data
		defs.push( $dlg.$molEdit.$getMolfile().done(function(molfile) {
			datamap['MOL'] = molfile;
		}) );
		defs.push( $dlg.$molEdit.$getSMILES().done(function(smiles) {
			datamap['c_smiles'] = smiles;
		}) );
		defs.push( $dlg.$molEdit.$getSVG().done(function(svg) {
			datamap['SVG'] = svg;
		}) );
		defs.push( $dlg.$molEdit.$getPNG().done(function(png) {
			datamap['PNG'] = png;
		}) );
		
		$.when.apply($.when, defs).done(function() {
			$def.resolve(datamap);
		});
		
		return $def;
	};
	
	window.$getChangeAddDlg = function(id) {
		var data;
		
		if (!window.$changeAddDlg) window.createChangeAddDlg();
		
		if (id || 0 === id) data = window.getCompoundByID(id);
		
		$.each(window.$changeAddDlg.valueFields, function(key, $ip) {
			if (data && data[key] && $ip) {
				if ($ip.valProp) $ip[$ip.valProp](data[key]);
			} else {
				if ($ip.valProp) $ip[$ip.valProp]('');
			}
		});
		
		if (data) {
			window.$changeAddDlg.$molEdit.$setMolecule(data[amaQtHost.getMetaSetting('FormulaField')]);
			window.$changeAddDlg.compoundData = data;
		} else {
			window.$changeAddDlg.$molEdit.$setMolecule(amaQtHost.getMetaSetting('BlankFormula'));
			window.$changeAddDlg.compoundData = {};
		}
		
		return window.$changeAddDlg;
	};
	
	window.createChangeAddDlg = function() {
		var $dlg = $('<div>').hide().addClass('ama-span-fullscreen'),
			$f = $('<form>').addClass('ama-flex').appendTo($dlg), htmledits = [], appendToGroup;
		
		$dlg.valueFields = {};
		$dlg.$inputs = $();
		
		appendToGroup = function(g, $el) {
			// Check whether group already exists
			if (!$dlg.groups) $dlg.groups = {};
			if (!$dlg.groups[g]) {
				var qgi = window.querygroupinfo[g];
				$dlg.groups[g] = $('<ul>').attr('class', 'ama-list-inputs ' + qgi.cls)
					.appendTo($('<fieldset>').attr('class', 'ui-helper-reset ui-corner-all ama-dotted-border ama-block').append($('<legend>').text(qgi.display)).appendTo($f));
			}
			$('<li>').append($el).appendTo($dlg.groups[g]);
		};
		
		$.each(window.queryfields, function(idx, fieldinfo) {
			if (!fieldinfo.field) return;
			var details = fieldinfo.fieldinfo ? fieldinfo.fieldinfo.split('|') : ['', ''];
			
			var id = 'changeinfo_' + fieldinfo.k,
				g = fieldinfo.qgroup,
				$input, $label, type = fieldinfo.field, prop, lastEditor;
			
			switch (type) {
				case 'text':
					var p = fieldinfo.pattern;
					$input = $('<input type="text">').attr({
						id: id,
						size: details[0],
						maxlen: details[1],
						'class': 'ui-widget-content ui-corner-all'
					});
					if (!details[0]) {
						$input.css('width', '98%');
					}
					if (fieldinfo.help && fieldinfo.help !== 'h') {
						$input.attr('title', fieldinfo.help);
					}
					if (p) {
						$input.addClass('ama-valid-input').attr({
							pattern: p.source,
							required: 'required'
						});
					}
					if (fieldinfo.required) $input.attr('required', 'required');
					if (fieldinfo.trim) {
						$input.on({
							'input': function() {
								var v = $input.val(),
									nv = $.trim(v);
								if (v !== nv) $input.val(nv);
							}
						});
					}
					if (p) {
						$input.on({
							'input': function(e) {
								if (!p.test($input.val())) {
									e.preventDefault();
									$input._blink();
								}
							}
						});
					}
					$dlg.valueFields[fieldinfo.k] = $input;
					
					$label = $('<label>', {
							text: fieldinfo.display
						}).attr({
							'for': id,
							'class': 'ama-broken-label'
						});
						
					if (g) {
						appendToGroup( g, $('<div>').append($label, $input) );
					} else {
						$('<div>').addClass('ama-block').append($label, $input).appendTo($f);
					}
					$input.valProp = 'val';
					break;
					
				case 'textarea':
					$input = $('<textarea>').attr({
							id: id,
							'class': 'ui-widget-content ui-corner-all'
						}).css({
							height: '3em',
							width: '98%'
						});
					$label = $('<label>', {
							text: fieldinfo.display
						}).attr({
							'for': id,
							'class': 'ama-broken-label'
						});

					if (g) {
						appendToGroup( g, $('<div>').addClass('ama-block').append($label, $input) );
					} else {
						$('<div>').addClass('ama-block').append($label, $input).appendTo($f);
					}
					$dlg.valueFields[fieldinfo.k] = $input;
					$input.valProp = 'val';
					break;
					
				case 'htmledit':
					var e,
						createEdit = function() {
							setTimeout(function() {
								// http://docs.ckeditor.com/#!/api/CKEDITOR.config
								e = CKEDITOR.inline( $input[0], { 
									autoParagraph: false, 
									clipboard_defaultContentType: 'text',
									fontSize_defaultLabel: '0.7em',
									fontSize_sizes: 'larger;smaller;0.5em;0.6em;0.7em;0.8em;0,9em;1em;1.1em;1.2em;1.4em;1.7em'
								} );
								e.on('instanceReady', function (e) {
									CKEDITOR.customHTMLProcessor(e.editor);
								});
								e.valProp = 'val';
								
								$dlg.valueFields[fieldinfo.k] = e;
								htmledits.push(e);
								lastEditor = {
									ed: e,
									$i: $input
								};
							}, 1);
						};
					
					$input = $('<div>').attr({
							id: id,
							'class': 'ui-widget-content ui-corner-all ama-htmlrichtextedit',
							contenteditable: true
						}).css({
							height: '3em',
							width: '98%'
						});
					$label = $('<label>', {
							text: fieldinfo.display
						}).attr({
							'for': id,
							'class': 'ama-broken-label'
						});
					if (g) {
						appendToGroup( g, $('<div>').addClass('ama-block').append($label, $input) );
					} else {
						$('<div>').addClass('ama-block').append($label, $input).appendTo($f);
					}

					createEdit();
					$input.valProp = 'html';
					$dlg.valueFields[fieldinfo.k] = $input;
					break;
					
				case 'formulaedit':
					p = fieldinfo.pattern;
					$input = $('<input type="text">').attr({
						id: id,
						size: details[0],
						maxlen: details[1],
						'class': 'ui-widget-content ui-corner-all'
					});
					if (p) {
						$input.addClass('ama-valid-input').attr({
							pattern: p.source,
							required: 'required',
							title: fieldinfo.help
						});
					}
					if (fieldinfo.pattern) {
						$input.on({
							'input': function(e) {
								if (!fieldinfo.pattern.test($input.val())) {
									e.preventDefault();
									$input._blink();
								}
							}
						});
					}
					$dlg.valueFields[fieldinfo.k] = $input;
					
					$label = $('<label>', {
							text: fieldinfo.display
						}).attr({
							'for': id,
							'class': 'ama-broken-label'
						});

					var copyText = "Kopiere Molfile in die Zwischenablage",
						saveText = "Molfile auf Datenträger speichern",
						loadFromFileText = "Molfile vom Datenträger laden",
						pasteText = "Molfile aus der Zwischenablage als Fragment einfügen",
						$molEdit, $wrap, $buttonWrap, $copy, $paste, $loadFromFile, $loadFromFileWrap, $safeToFile;

					$buttonWrap = $('<span>')
						.addClass('ama-formulaed-buttonset');
					$copy = $('<button>')
						.attr('type', 'button')
						.attr('title', copyText)
						.text(copyText)
						.button({
							text: false,
							icons: {
								primary: 'ui-icon-copy'
							}
						}).click(function() {
							$copy.button('option', 'disabled', true);
							$molEdit.$getMolfile().done(function(mf) {
								window.clipboardData.setData('Text', mf);
								$copy.button('option', 'disabled', false);
							});
						}).appendTo($buttonWrap);
					$paste = $('<button>')
						.attr('type', 'button')
						.attr('title', pasteText)
						.text(pasteText)
						.button({
							text: false,
							icons: {
								primary: 'ui-icon-clipboard'
							}
						}).click(function() {
							$copy.button('option', 'disabled', true);
							window.clipboardData.getDataDeferred(function(d) {
								$molEdit.$setMoleculeFragment(d);
								$copy.button('option', 'disabled', false);
							});
						}).appendTo($buttonWrap);
					$safeToFile = $('<button>')
						.attr('type', 'button')
						.attr('title', saveText)
						.text(saveText)
						.button({
							text: false,
							icons: {
								primary: 'ui-icon-disk'
							}
						}).click(function() {
							$safeToFile.button('option', 'disabled', true);
							$molEdit.$getMolfile().done(function(mf) {
								var filename = $input.val() + '_' + $.now() + '.mol';
								if (window.amaQtHost) {
									amaQtHost.saveData(filename, mf, 'mol');
								} else {
									var blob = new Blob([mf], { type: "text/plain;charset=utf-8" });
									saveAs(blob, filename);
								}
								$safeToFile.button('option', 'disabled', false);
							});
						}).appendTo($buttonWrap);
					$loadFromFileWrap = $('<button>')
						.attr('type', 'button')
						.attr('title', loadFromFileText)
						.css({
							position: 'relative',
							overflow: 'hidden',
							padding: 0
						})
						.text(loadFromFileText)
						.button({
							text: false,
							icons: {
								primary: 'ui-icon-folder-open'
							}
						}).appendTo($buttonWrap);
					$loadFromFile = $('<input type="file" id="ama-import-mol-f" name="ama-import-record-f" style="width:98%" accept=".mol,chemical/x-mdl-molfile"/>')
						.css({
							'font-size': '5em',
							width: '8em',
							height: '5em',
							position: 'absolute',
							top: 0,
							left: 0,
							opacity: 0,
							margin: 0,
							cursor: 'pointer'
						})
						.change(function() {
							$loadFromFileWrap.button('option', 'disabled', true);
							var f = $loadFromFile[0].files[0],
								reader = new FileReader();
								
							reader.onload = function() {
								$molEdit.$setMolecule( reader.result ).done(function() {
									$loadFromFileWrap.button('option', 'disabled', false);
								});
							};
							reader.readAsText(f);
								
						}).appendTo($loadFromFileWrap);
						
					
					$molEdit = molEdit.$create();
					$wrap = $('<div>').attr({
						id: id,
						'class': 'ui-corner-all ama-block'
					}).append($label, $input, $buttonWrap.buttonset(), $molEdit).appendTo($f);
					
					$dlg.$molEdit = $molEdit;
					$input.valProp = 'val';
					break;
			}
			$dlg.$inputs = $dlg.$inputs.add($input);
		});
		
		
		$f.append('<input type="submit" value="dummy" style="position: absolute; height: 0px; width: 0px; border: none; padding: 0px;" hidefocus="true" tabindex="-1"/>');
		
		$dlg.dialog({
			modal: false,
			resizable: false,
			draggable: false,
			autoOpen: false,
			position: [0, 0],
			width: $win.width(),
			height: $win.height(),
			open: function() {
				$win.resize();
				$('body').css('overflow', 'hidden');
			}
		});
		$win.resize(function() {
			$dlg.dialog({
				width: $win.width(),
				height: $win.height()
			});
		});
		
		window.$changeAddDlg = $dlg;
	};
}, window, [jQuery]);