/**
 * Search dialog and tab handler
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

/*global loader:false, searchalgo:false, app:false, molEdit:false*/
loader.implement('searchdlg.js', ['tabslogic.js'], function() {
	'use strict';
	
	// Search form
	var rowNumber = 0;
	var __getOptions = function(key, desc) {
		if (!desc) return;
		var $tr = $('<tr>'),
			$tdCtrl = $('<td>').appendTo($tr),
			idPlus = 'pos' + key,
			idMinus = 'negative' + key,
			idUnknown = 'unknown' + key;	
			
		if (rowNumber % 2) $tr.addClass('odd');
		$('<td>').html(desc).prependTo($tr);
		
		var $p = $('<input type="radio" name="opt' + key + '" id="' + idPlus + '" value="plus">'),
			$pl = $('<label for="' + idPlus + '" name="opt' + key + '">').text('+').prepend($p).appendTo($tdCtrl),
			$m = $('<input type="radio" name="opt' + key + '" id="' + idMinus + '" value="minus">'),
			$ml = $('<label for="' + idMinus + '" name="opt' + key + '">').text('-').prepend($m).appendTo($tdCtrl),
			$u = $('<input type="radio" name="opt' + key + '" id="' + idUnknown + '" checked="checked"  value="unknown">'),
			$ul = $('<label for="' + idUnknown + '" name="opt' + key + '">').text('k.a.').prepend($u).appendTo($tdCtrl);

		rowNumber++;
		return $tr;
	};
	
	$(function() {
		// modal dialog init: custom buttons and a "close" callback reseting the form inside
		var $dialog = $('#dialog'),
			$dialogTitle,
			$dialogSearchName = $('#amaNewSearchTitle'),
			_onsubmit = function(e) {
				if (e) e.preventDefault();
				var $newTab = app.UI.addTab();
				$newTab.$header.find('a').click();
				searchalgo.search($newTab.$content, $newTab.label, $dialog.compoundData);
				$dialog.dialog('close');
			},
			$form = $dialog.find('form').submit(_onsubmit);

		// Important for Firefox that fills in last values of the TIAFT system into other inputs when page is reloaded
		if ($form[0]) $form[0].reset();
		
		$dialog.dialog({
			autoOpen: false,
			modal: true,
			width: Math.min($(window).width(), 960),
			show: {
				effect: 'drop', 
				complete: function() {
					$('#tiaft_2').focus();
					$('#tiaft_1').focus().select();
				}
			},
			hide: 'fade',
			buttons: [
				{
					text: "Suchen", 
					click: _onsubmit,
					icons: {
						primary: 'ui-icon-circle-check'
					}
				}, {
					text: "Abbrechen", 
					click: function() {
						$( this ).dialog( "close" );
					},
					icons: {
						primary: 'ui-icon-circle-close'
					}
				}, {
					text: "Standardwerte einsetzen", 
					click: function() {
						$form[0].reset();
						$dialogSearchName.val(window.getNewSearchName());
						$('#amaFurtherHints').find('tr')
							.removeClass('ama-furtherhint-unknown').removeClass('ama-furtherhint-minus').removeClass('ama-furtherhint-plus');
					},
					icons: {
						primary: 'ui-icon-refresh'
					}
				}
			],
			close: function() {
				$('.ui-tooltip').remove();
			},
			open: function() {
				$dialogSearchName.val($dialog.searchName);
				var pattern = '<span class="ui-titlebar-icon ui-icon %icon%"></span><span>%title%</span>';
				if ($dialog.isFilter) {
					pattern = pattern
						.replace('%icon%', 'ui-icon-arrowreturnthick-1-e')
						.replace('%title%', "Suchergebnisse erneut durchsuchen");
				} else {
					pattern = pattern
						.replace('%icon%', 'ui-icon-search')
						.replace('%title%', "Neue Suche");
				}
				// jQuery "fixed" a "new" XSS?! so we can't use HTML in the title
				$dialogTitle.html(pattern);
				loader.load('hrf.js');
			}
		});
		$dialogTitle = $dialog.prev().find('.ui-dialog-title');

		
		// Launch a search
		window.launchSearch = function() {
			$dialog.compoundData = window.compoundData;
			$dialog.searchName = window.getNewSearchName();
			$dialog.isFilter = false;
			$dialog.dialog('open');
		};
		window.launchFilter = function() {
			var criteria = window.getCurrentTabCriteria();
			$dialog.compoundData = window.getCurrentTabResults();
			$dialog.searchName =  window.getNewSearchName() + ' gefiltert aus ' + criteria.name;
			$dialog.isFilter = true;
			searchalgo.fillDialogWithCriteria(criteria);
			$dialog.dialog('open');
		};
		
		var __fomulaEditor = function($input, $molInput) {
			loader.using(['formulaedit.js'], function() {
				___fomulaEditor($input, $molInput);
			});
		};
		var ___fomulaEditor = function($input, $molInput) {
			var $dlg = $('<div>').addClass('ama-moledit-container'),
				$molEdit = molEdit.$create(),
				$cred = $('<div>').addClass('ama-moledit-credits ui-widget-content').prependTo($dlg),
				$credSpace = $('<div>').addClass('ama-moledit-credits-spacer').prependTo($dlg),
				mol = $molInput.val();
			
			
			var __transferSMILES = function() {
				$.when($molEdit.$getSMILES().done(function(smiles) {
						$input.val(smiles);
					}), $molEdit.$getMolfile().done(function(molfile) {
						$molInput.val(molfile);
					})
				).done(function() {
					$dlg.dialog( "close" );
				});
			};
			
			$molEdit.appendTo($dlg);
			var w = Number($molEdit.attr('width')) || parseFloat($molEdit.css('width')) + 50;
			
			$dlg.dialog({
				modal: true,
				title: "Strukturformeleditor",
				width: Math.min($(window).width(), w),
				close: function() {
					$( this ).remove();
				},
				buttons: [{
					text: "Übernehmen", 
					click: __transferSMILES,
					icons: {
						primary: 'ui-icon-circle-check'
					}
				}, {
					text: "Abbrechen", 
					click: function() {
						$( this ).dialog( "close" );
					},
					icons: {
						primary: 'ui-icon-circle-close'
					}
				}]
			});
			
			$molEdit.$getCredits().done(function(cred) {
				$cred.append(cred);
				
				var vis = false;
				$('.ama-autoexpand').click(function(e) {
					e.preventDefault();
					if (vis) {
						$cred.css('max-height', '1em');
					} else {
						$cred.css('max-height', 'none');
					}
					vis = !vis;
				});
			});
			if (mol) $molEdit.$setMolecule(mol);
		};
		
		
		$.hook('ama.dataloaded').add(function() {
			var $furtherHints = $('<table id="amaFurtherHints">'),
				$furtherHintsWrap = $('.ama-observations-inputs'),
				$smiles = $('<div>'),
				$amaTiaftInputs, $smilesInput, $molInput, smilesRegExp = /^[A-IK-Za-z0-9@+\-\[\]\(\)\\\/%=#$]{1,}$/,
				__buildInput, i;
				
			
			$.eachItem(window.renderfields, function(i, i2, def) {
				$furtherHints.append(__getOptions(def.k, def.fs));
			});
			$furtherHints.find('input').change(function(e) {
				var $ctrl = $(this);
				$ctrl.closest('tr')
					.removeClass('ama-furtherhint-unknown').removeClass('ama-furtherhint-minus').removeClass('ama-furtherhint-plus')
					.addClass('ama-furtherhint-' + $ctrl.val());
			});
			// https://gist.github.com/lsauer/1312860#file-_smiles_inchi_annotated-js
			// TODO: SMART search (highly complex due to rotation)
			$molInput = $('<textarea id="ama-MOLFILE" placeholder="hidden" type="text" style="display:none"></textarea>')
				.appendTo($smiles);
			
			$smilesInput = $('<input id="ama-SMILES" placeholder="SMILES-Fragment" size="13" class="ama-valid-input ui-widget-content" />')
				.attr('pattern', smilesRegExp.toString().replace(/^\/(.+)\/i?g?$/, '$1'))
				.keyup(function(e) {
					switch (e.which) {
						case 8:
						case 46:
							$molInput.val('');
							break;
					}
				})
				.on('input keyup change', function(e) {
					var $input = $(this),
						val = $input.val(),
						newVal;
						
					newVal = val.replace(smilesRegExp, '');
					if (newVal) return false;
				});
			$('<label for="ama-SMILES">')
				.attr('title', "Simplified Molecular Input Line Entry Specification (SMILES) ist ein chemischer Strukturcode, bei dem die Struktur beliebiger Moleküle stark vereinfacht als (ASCII-)Zeichenkette wiedergegeben werden. Dies erlaubt die Suche, etwa nach einzelnen Atomen, Doppelbindungen und einigen funktionellen Gruppen. Doppelklick, um Strukturformeleditor zu starten.")
				.append($('<span>').text('SMILES'), $('<sup>').text('(experimentell)'), ':', $smilesInput)
				.dblclick(function(e) {
					__fomulaEditor($smilesInput, $molInput);
				})
				.appendTo($smiles);
			$furtherHintsWrap.append($furtherHints, $smiles);
			
			$amaTiaftInputs = $('.ama-tiaft-inputs');
			__buildInput = function(no) {
				$('<li><label for="tiaft_%no">%no: </label><input title="Tiaft %no" type="text" size="4" id="tiaft_%no" class="ui-widget-content ui-corner-all" data-ama-system="%no"/></li>\n'.replace(/%no/g, no))
					.appendTo($amaTiaftInputs);
			};
			for (i = 1; i <= window.numberoftiafts; ++i) {
				__buildInput(i);
			}
			$amaTiaftInputs.find('input').validateNumber('input keyup change', 0, 100).tooltip({
				position: {
					my: 'left top+5',
					at: 'left bottom',
					collision: 'flipfit flip'
				}
			}).dblclick(function() {
				var $tiaftInput = $(this),
					system = $tiaftInput.data('ama-system'),
					dlgTitle = "hRf*-Werte aus Laufhöhen berechnen, DC-Qualität bewerten",
					$dlg = $('<div>').css('text-align', 'center'),
					$titlebar;

				loader.using('hrf.js', function() {
					window.$hrfDlg(system, $dlg).done(function(val) {
						$dlg.dialog('close');
						$tiaftInput.val(val);
					});
					
					$dlg.dialog({
						width: Math.min(570, $(window).width()),
						modal: true,
						title: dlgTitle,
						close: function() {
							$(this).remove();
						},
						open: function() {
							var pattern = '<span class="ui-titlebar-icon ui-icon %icon%"></span><span>%title%</span>'
								.replace('%icon%', 'ui-icon-calculator')
								.replace('%title%', dlgTitle);
								
							// jQuery "fixed" a "new" XSS?! so we can't use HTML in the titlebar directly
							$titlebar.html(pattern);
						},
						autoOpen: false,
						show: {
							effect: 'slide',
							direction: 'up'
						}
					});
					$titlebar = $dlg.prev().find('.ui-dialog-title');
					$dlg.dialog('open');
				});
			}).keyup(function(e) {
				switch (e.which) {
					case 32:
					case 38:
					case 40:
						$(this).dblclick();
				}
			});
			$('#amaTiaftTolerance').validateNumber('input keyup change', 0, 70);
			$('#amaTiaftExcept').validateNumber('input keyup change', 0, window.numberoftiafts);
			$('#amaTiaftExceptTolerance').validateNumber('input keyup change', 0, 100);
			$('#amaFRTolerance').validateNumber('input keyup change', 0, 90);
		});
	});
}, window, [jQuery]);