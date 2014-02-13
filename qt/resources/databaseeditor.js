/**
 * Provides the logic and the user interface to edit and interact
 * with the backend database
 * TODO: Better UI<->functionality separation
 * TODO: UI-Message-Strings outsourcen
 * TODO: Ajaxyfy instead of using the bridge directly
 * TODO: Eliminate alert
 * TODO: i18n
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

/*global loader:false, amaQtHost:false, CKEDITOR:false, alert:false, saveAs:false, app:false*/
loader.implement('databaseeditor.js', ['tabslogic.js'], function($) {
'use strict';

	window.amaDeleteRecord = function(id) {
		if (!window.amaQtHost || !amaQtHost.db_connected) return alert("Failed to connect to database");
		var $dlg = $('<div>').text("Das Löschen eines Datensatzes kann nur durch das zurücksetzen der Datenbank auf ein altes Backup rückgängig gemacht werden."),
			compoundRecord = window.getCompoundByID(id),
			title = "Datensatz '" + compoundRecord['c_name'] + "' " + " löschen?",
			_onsubmit = function() {
				if (deleted) return;
				if (amaQtHost.deleteRecord(id)) {
					deleted = true;
					$dlg.text("Datensatz gelöscht.");
					setTimeout(function() {
						$dlg.dialog('close');
					}, 1000);
					
				} else {
					$dlg.text("Fehler beim Löschen des Datensatzes. Stellen Sie sicher, dass die Anwendung mit ausreichenden Rechten ausgeführt wird, um in die Datenbank schreiben zu können.");
					app.UI.currentTab.$getVisibleRowById(id).addClass('ui-state-error');
				}
			},
			deleted;
		
		$dlg.dialog({
			title: title,
			width: 460,
			buttons: [{
					text: "Jetzt löschen", 
					click: _onsubmit,
					icons: {
						primary: 'ui-icon-trash'
					}
				}, {
					text: "Abbrechen", 
					click: function() {
						$(this).dialog("close");
					},
					icons: {
						primary: 'ui-icon-circle-close'
					}
				}],
			close: function() {
				$(this).remove();
			},
			open: function() {
				// TODO: HTML Escape title
				$dlg.prev().find('.ui-dialog-title').html('<span class="ui-titlebar-icon ui-icon ui-icon-trash"></span><span>' + title + '</span>');
			}
		});
		
		

	};

	window.amaAddRecord = function() {
		if (!window.amaQtHost || !amaQtHost.db_connected) return alert("Failed to connect to database");
		
		var title = "Stoff hinzufügen",
			$dlg = window.$getChangeAddDlg();
			
		function _onsubmit(e) {
			if (e && e.preventDefault) e.preventDefault();
			
			window.$getDlgValues($dlg).done(function(datamap) {
				var id = amaQtHost.newRecord(datamap);
				if ( id > -1 ) {
					$dlg.dialog('close');
				} else {
					alert("Während des Hinzufügens des Stoffes trat ein Fehler auf. " + 
						"Möglicherweise haben Sie keine Angaben gemacht oder die Datenbank ist schreibgeschützt.");
				}
			});
		}
		
		$dlg.dialog({
			buttons: [{
					text: "Jetzt hinzufügen", 
					click: _onsubmit,
					icons: {
						primary: 'ui-icon-circle-check'
					}
				}, {
					text: "Abbrechen", 
					click: function() {
						$(this).dialog("close");
					},
					icons: {
						primary: 'ui-icon-circle-close'
					}
				}],
			close: function() {
				$dlg.find('form').off('submit', _onsubmit);
				$('body').css('overflow', '');
			}
		}).dialog('open').find('form').submit(_onsubmit);
		$dlg.prev().find('.ui-dialog-title').html('<span class="ui-titlebar-icon ui-icon ui-icon-circle-plus"></span><span>' + title + '</span>');
	};
	
	window.getNextCompoundId = function(id) {
		var match;
		for (var i = 0, cd = window.compoundData, len = cd.length; i < len; ++i) {
			if (match) return cd[i].c_id;
			if (id === cd[i].c_id) {
				match = true;
			}
		}
		if (id > 0) {
			return window.getNextCompoundId(0);
		}
	};


	window.amaEditRecord = function(id) {
		if (!window.amaQtHost || !amaQtHost.db_connected) return alert("Failed to connect to database");
		id = Number(id);
		
		var title = "Änderung durchführen",
			$dlg = window.$getChangeAddDlg(id);
			
		function _onsubmit(e, cb) {
			if (e && e.preventDefault) e.preventDefault();
			
			
			window.$getDlgValues($dlg).done(function(datamap) {
				if ( amaQtHost.changeRecordById(id, datamap, false) ) {
					$dlg.dialog('close');
					
					// Purge the image files from cache to avoid ghost events
					window.flushImgCache();
					
					app.UI.currentTab.$getVisibleRowById(id).delay(300).effect('highlight', 800);
					if ($.isFunction(cb)) cb();
				} else {
					alert("Während versucht wurde Änderungen an den Stoffdaten vorzunehmen, trat ein Fehler auf.");
					app.UI.currentTab.$getVisibleRowById(id).addClass('ui-state-error');
				}
			});
		}
		
		function _onsubmitnext(e) {
			_onsubmit(e, function() {
				var nextId = window.getNextCompoundId(id);
				
				if ( nextId === undefined ) return;
				window.amaEditRecord(nextId);
			});
		}
		
		$dlg.dialog({
			buttons: [{
					text: "Jetzt ändern", 
					click: _onsubmit,
					icons: {
						primary: 'ui-icon-circle-check'
					}
				}, {
					text: "Ändern und nächsten laden", 
					click: _onsubmitnext,
					icons: {
						primary: 'ui-icon-circle-arrow-e'
					}
				}, {
					text: "Abbrechen", 
					click: function() {
						$(this).dialog("close");
					},
					icons: {
						primary: 'ui-icon-circle-close'
					}
				}],
			close: function() {
				$dlg.find('form').off('submit', _onsubmit);
				$('body').css('overflow', '');
			}
		}).dialog('open').find('form').submit(_onsubmit);
		$dlg.prev().find('.ui-dialog-title').html('<span class="ui-titlebar-icon ui-icon ui-icon-pencil"></span><span>' + title + '</span>');
	};

	// "nummeriert" ist neue Rechtschreibung; vorher nur ein "m"
	var $dlgSort = $('<div>')
		.text("Einen Moment bitte. Es wird alphabetisch sortiert und nummeriert. " + 
			"Während dieses Vorgangs sind keine weiteren Datanbanktransaktionen möglich.")
				.dialog({
						title: "Sortieren …",
						autoOpen: false,
						modal: true
				});

	window.updateSorting = function() {
		if (!amaQtHost.sorting_dirty) return;
		$dlgSort.dialog('open');
		setTimeout(function() {
			amaQtHost.updateSorting();
			// Reload
			window.location.reload();
		}, 10);
	};

	window.onSorting = function() {
		if (!amaQtHost.sorting_dirty) return;
		$dlgSort.dialog('open');
		app.sorting = true;
	};

	// In theory we should fire an event and add a listener to the uihandler
	window.onSortingDirtyChange = function(isDirty) {
		if (isDirty) {
			$('#amaSortNote').show().parent().show();
			$('#ama_sort_now').parent().removeClass('ui-state-disabled');
		} else {
			$('#amaSortNote').hide().parent().hide();
			$('#ama_sort_now').parent().addClass('ui-state-disabled');
			$dlgSort.dialog('close');
			app.sorting = false;
		}
	};
	
	
	window.amaExportRecord = function(id) {
		var data = amaQtHost.getRecord(id),
			jsonData = $.toJSON(data);
		
		var dlgTitle = "Datensatz exportieren",
			$dlg = $('<div>'),
			$dlgContent = $('<textarea>').attr('readonly', 'readonly').css({
				width: '99%',
				height: Math.min($(window).height(), 350)
			}).val(jsonData).click(function() {
				$(this).select();
			}).appendTo($dlg),
			$titlebar;
			
		$dlg.dialog({
			title: dlgTitle,
			width: Math.min($(window).width(), 800),
			height: Math.min($(window).height(), 550),
			buttons: [{
						text: "Auf Datenträger speichern", 
						click: function() {
							var filename = data['c_name'] + '_' + $.now() + '.json';
							if (window.amaQtHost) {
								amaQtHost.saveData(filename, jsonData, 'json');
							} else {
								var blob = new Blob([jsonData], { type: "text/plain;charset=utf-8" });
								saveAs(blob, filename);
							}
						},
						icons: {
							primary: 'ui-icon-disk'
						}
					}],
			modal: true,
			open: function() {
				var pattern = '<span class="ui-titlebar-icon ui-icon %icon%"></span><span>%title%</span>'
					.replace('%icon%', 'ui-icon-arrowthickstop-1-s')
					.replace('%title%', dlgTitle);
					
				// jQuery "fixed" a "new" XSS?! so we can't use HTML in the titlebar directly
				$titlebar.html(pattern);
			},
			close: function() {
				$dlg.remove();
			},
			autoOpen: false
		});
		$titlebar = $dlg.prev().find('.ui-dialog-title');
		$dlg.dialog('open');
	};
	
	window.importRecord = function(data) {
		var dlgTitle = "Datensatz importieren",
			$dlg = $('<form>'),
			$taLbl = $('<label for="ama-import-record-ta"></label>')
				.text("Datensatz hier einfügen")
				.appendTo($dlg),
			$ta = $('<textarea>')
				.attr('id', 'ama-import-record-ta')
				.css({
					width: '99%',
					height: Math.min($(window).height(), 300)
				})
				.appendTo($dlg),
			$fLbl = $('<label for="ama-import-record-f"></label>')
				.text("oder Datei hochladen")
				.appendTo($dlg),
			$f = $('<input type="file" id="ama-import-record-f" name="ama-import-record-f" style="width:98%" multiple="multiple" accept=".json,application/json"/>')
				.css({
					width: '99%'
				})
				.appendTo($dlg),
			$fi = $('<span>').appendTo($dlg),
			$dummy = $('<input type="submit" name="dummy" value="dummy" class="ama-invisible"/>').appendTo($dlg),
			$titlebar;
			
		$f.change(function() {
			if (!(window.File && window.File.prototype.slice && window.FileReader && window.Blob)) {
				return $fi.text("Your browser does not support the full File-API, FileReader and Blob.");
			} else {
				$fi.text(this.files.length + " Dateie(n) ausgewählt.");
			}
		});
		$dlg.dialog({
			title: dlgTitle,
			width: Math.min($(window).width(), 800),
			height: Math.min($(window).height(), 550),
			buttons: [{
						text: "Zur Datenbank hinzufügen",
						id: 'ama-import-submitbutton',
						click: function(e) {
							var text = '', jsonData, toAdd = [], pending = 0,
								$p = $('<pre>').appendTo($dlg.children().hide().parent()),
								$button = $('#ama-import-submitbutton');

							if ($button.button('option', 'disabled')) return;
							$.each($f[0].files, function(i, f) {
								var reader = new FileReader();
								pending++;
								reader.onload = function() {
									pending--;
									try {
										jsonData = $.secureEvalJSON( reader.result );
										toAdd.push(jsonData);
									} catch(invalidJSON) {}
									if (!pending) addToDB();
								};
								reader.readAsText(f);
							});
							try {
								jsonData = $.secureEvalJSON( $ta.val() );
								toAdd.push(jsonData);
							} catch (invalidJSON) {}
							
							if (!pending) addToDB();
							function addToDB() {
								window.$renderRecords(toAdd).done(function() {
									$.each(toAdd, function(i, dataItem) {
										var id = amaQtHost.newRecord(dataItem);
										if ( id > -1 ) {
											dataItem = amaQtHost.getRecord(id);
											window.setCompoundByID(dataItem, id);
											$p.text(text += '\n' + "Inserted " + dataItem['c_name'] + " into the database.");
											$('#tabs-1').find('tbody').prepend(app.UI.printtable.$makeRow(dataItem).delay(300).effect('highlight', 800));
										}
									});
								}).progress(function(p) {
									$p.text(text += '\n' + p);
								});
							}
							$button.button('option', 'disabled', true);
						},
						icons: {
							primary: 'ui-icon-arrowthickstop-1-n'
						}
					}],
			modal: true,
			open: function() {
				var pattern = '<span class="ui-titlebar-icon ui-icon %icon%"></span><span>%title%</span>'
					.replace('%icon%', 'ui-icon-arrowthickstop-1-n')
					.replace('%title%', dlgTitle);
					
				// jQuery "fixed" a "new" XSS?! so we can't use HTML in the titlebar directly
				$titlebar.html(pattern);
			},
			close: function() {
				$dlg.remove();
			},
			autoOpen: false
		});
		$titlebar = $dlg.prev().find('.ui-dialog-title');
		$dlg.dialog('open');
		$dlg.submit(function() {
			$('#ama-import-submitbutton').click();
		});
	};

	window.$packAndGoProgress = $('<div>').text("Tabllen-Daten werden in das JSON-Format umgewandelt.");
	window.$packAndGoProgress.dialog({
		title: "Studentenversion wird erstellt …",
		modal: true,
		autoOpen: false,
		width: Math.min($(window).width(), 490)
	});
		
	window.onPackAndGoProgress = function(percentProg, textProg) {
		var _onopen = function() {
				amaQtHost.showFileInExplorer(textProg);
			},
			_onok = function() {
				window.$packAndGoProgress.dialog('close');
			};

		if (percentProg > 100) {
			setTimeout(function() {
				window.$packAndGoProgress.text("Die Studentenversion wurde erfolgreich erstellt.")
					.append($('<div>')
						.append($('<input>').val(textProg).css({
							'width': '87%',
							'font-size': '70%'
						}).attr('readonly', 'readonly').click(function() { 
							$(this).select();
						}))
						.append(' ')
						.append($('<button>').click(_onopen).attr('title', "Ordner öffnen, in dem die Studentversion erstellt wurde").button({
							text: false,
							icons: {
								primary: 'ui-icon-folder-open'
							}
						})))
					.dialog({
						title: "Studentenversion wurde erfolgreich erstellt.",
						buttons: [{
							text: "OK", 
							click: _onok,
							icons: {
								primary: 'ui-icon-circle-check'
							}
						}],
						autoOpen: true
					});
					window.$packAndGoProgress.dialog('open');
			}, 500);
		} else {
			window.$packAndGoProgress.text(textProg);
		}
	};

	window.packAndGo = function() {
		window.$packAndGoProgress.text("Tabllen-Daten werden in das JSON-Format umgewandelt.");
		
		var ff = amaQtHost.getMetaSetting('FormulaField'),
			ignoreFields = {
				c_masteronly: 1
			},
			dataCopy, fieldInfo;
		
		ignoreFields[ff] = 1;
		
		dataCopy = $.map(window.compoundData, function(originalRecord) {
			var record = {};
			for (var k in originalRecord) {
				if (!ignoreFields[k]) record[k] = originalRecord[k];
			}
			return record;
		});
		dataCopy = $.toJSON(dataCopy);
		fieldInfo = $.toJSON(window.renderfields);
		setTimeout(function() {
			amaQtHost.packAndGo(
				['compoundData(', dataCopy, ')'].join(''),
				['renderfields(', fieldInfo, ')'].join(''),
				['rendergroupinfo(', $.toJSON(window.rendergroupinfo), ')'].join(''),
				['amaviews(', $.toJSON(window.amaviews), ')'].join(''),
				['version("', '$BUILD_NUMBER', '.', '$packageID', '")'].join(''),
				['hrfcorr(', $.toJSON(window.hrfcorr), ')'].join(''),
				['legend(', $.toJSON(window.legend), ')'].join('')
			);
		}, 200);
		window.$packAndGoProgress.dialog('open');
	};

	window.createDBBackUp = function() {
		var $dlg = $('<div>').text("Die Datenbankdatei wird kopiert.");
		
		$dlg.dialog({
			title: "Backup wird erstellt …",
			modal: true,
			close: function() {
				$(this).remove();
			},
			width: Math.min($(window).width(), 490)
		});
		setTimeout(function() {
			var pos = amaQtHost.createDBBackUp(),
				_onok = function() {
					$dlg.dialog('close');
				},
				_onopen = function() {
					amaQtHost.showFileInExplorer(pos);
				};
			
			
			if (pos) {
				$dlg.text("Die Sicherungskopie der Datenbank wurde erfolgreich gespeichert.")
					.append($('<div>')
						.append($('<input>').val(pos).css({
							'width': '87%',
							'font-size': '70%'
						}).attr('readonly', 'readonly').click(function() { 
							$(this).select();
						}))
						.append(' ')
						.append($('<button>').click(_onopen).attr('title', "Ordner öffnen, in dem die Sicherungskopie gespeichert wurde").button({
							text: false,
							icons: {
								primary: 'ui-icon-folder-open'
							}
						})))
					.dialog({
						title: "Sicherungskopie erfolgreich erstellt.",
						buttons: [{
							text: "OK", 
							click: _onok,
							icons: {
								primary: 'ui-icon-circle-check'
							}
						}]
					});
			} else {
				$dlg.text("Beim Erstellen der Sicherungskopie trat ein Fehler auf. Kopieren Sie die SQLITE-Datei selbst.").dialog({
					title: "Fehler beim Erstellen der Sicherungskopie.",
					buttons: [{
						text: "OK, erledige ich selbst", 
						click: _onok,
						icons: {
							primary: 'ui-icon-circle-check'
						}
					}]
				});
			}
		}, 10);
	};

	// Sorting may be dirty from the last use
	window.onSortingDirtyChange(amaQtHost.sorting_dirty);

	// We can be sure that this script is only loaded once and that all the qt stuff we need is present
	amaQtHost.sortingDirtyChange.connect(window, window.onSortingDirtyChange);
	amaQtHost.sorting.connect(window, window.onSorting);
	amaQtHost.packAndGoProgress.connect(window, window.onPackAndGoProgress);

	// Now load our nice Richt-Text-Editor
	if (!window.CKEDITOR) {
		$(document).bind('ckeditor_loaded', function() {
			// Script will query the val-property when addition or change to a compound is being made
			CKEDITOR.editor.prototype.val = function(value) {
				var ed = this,
					d;
				if (arguments.length) {
					ed.setData(value);
				} else {
					d = ed.getData();
					d = window.html_sanitize(d);
						
					// Strip first <p> tag
					d = d.replace(/^\s*<p[^>]*?>((?:\n|.)*?)<[^\/]*?\/p[^>]*?>\s*/, '$1') || d;
					return d;
				}
			};
			CKEDITOR.customHTMLProcessor = function(e) {
				e.on( 'toHtml', function(evt) {
					var evtData = evt.data,
						data = evtData.dataValue;
						
					data = window.html_sanitize(data);
					evtData.dataValue = data;
				}, null, null, 1);
			};
		});
		
		loader.load(['ckeditor/ckeditor.js', 'caja/html-css-sanitizer.concat.min.js', 'formulaedit.js', 'lib/FileSaver.js', 'clipboard.js']);
	}
}, window, [jQuery]);