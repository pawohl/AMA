/**
 * Search-algorithm for AMA.webapp
 * @author Felix Pahlow
 * 
 * Requires jQuery and jquery.async
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

/*global loader:false, alert:false, app:false*/
loader.implement('searchalgo.js', ['tabslogic.js'], function($) {
	'use strict';

	var sa,
		maxstore = 5,
		storagekey = 'amakey',
		$doc = $(document);

	// Returns the value of a text input or if empty, the default value 
	// WARNING: defaultValue is non-standard and therefore not mentioned in any W3C draft
	// One day, we may have to duplicate data
	var getVal = function($el) {
		return $el.val() || $el[0].defaultValue;
	};
		
	sa = {
		// UI
		search: function($tab, name, compoundData) {
			var i = 0,
				frcount = 0,
				tiaftcount = 0,
				criteria = {
					tiaft: {}, 
					fr: {},
					name: name
				};
				
			$.each(window.criteria2Selector, function(critKey, crit) {
				var val = getVal($(crit.selector));
				if (!crit.type || 'number' === crit.type) {
					criteria[critKey] = Number(val);
				} else if ('string' === crit.type) {
					criteria[critKey] = val;
				}
			});
			for (i = 1; i <= window.numberoftiafts; ++i) {
				var val = $('#tiaft_' + i).val();
				if (val) tiaftcount++;
				criteria.tiaft['c_t' + i] = val;
			}
			$.each(window.renderfields, function(i, f) {
				if (!f.fs) return;
				var val = $('input[name="opt' + f.k + '"]:checked').val();
				if (val !== 'unknown') frcount++;
				criteria.fr[f.k] = val;
			});
			criteria.frtolerance = criteria.frtolerancerelative * (frcount + !!criteria.smartSmiles) / 100;
			
			if (0 === tiaftcount + frcount + !!criteria.smartSmiles) {
				alert("Du hast keine Angaben gemacht. Dementsprechend konnte keine Filterung vorgenommen werden.");
			}
			
			var results = [],
				totalTiaftDiff = 0,
				totalFRDiff = 0,
				maxtiaft = 0,
				maxfr = 0,
				maxtiaftcount = 0,
				maxfrcount = 0,
				resultCount = 0,
				actualTiaftResultCount = 0,
				actualFRResultCount = 0;
			
			sa.filter(compoundData, criteria)
				.progress(function(st, compound, progress) {
					// Further thinking: optionally push a progressbar forward or similar
					// Since it's pretty fast, not required for <500 compounds, however
					totalTiaftDiff += st.tiaftavgdiff;
					totalFRDiff += st.fravgwrong;
					resultCount++;
					if (st.tiaftcount) actualTiaftResultCount++;
					if (st.frcount) actualFRResultCount++;
					maxtiaftcount = Math.max(st.tiaftcount + st.tiaftstrokecount, maxtiaftcount);
					maxfrcount = Math.max(st.frcount, maxfrcount);
					
					compound.stats = st;
					results.push(compound);
				})
				.done(function() {
					var verySmallNumber = 1 / Math.pow(2, 32),
						// Second term to avoid division by zero
						avgTiaftDiff = totalTiaftDiff / ((actualTiaftResultCount || resultCount) + verySmallNumber),
						avgFRDiff = totalFRDiff / ((actualFRResultCount || resultCount) + verySmallNumber);
						
					
					$.each(results, function(i, r) {
						// If nothing was compared, use the the average
						if (0 === r.stats.tiaftcount) r.stats.tiaftavgdiff = avgTiaftDiff;
						if (0 === r.stats.frcount) r.stats.fravgwrong = avgFRDiff;
						// Stroke "-" (non-reproducible results)
						if (r.stats.tiaftstrokecount) {
							r.stats.tiaftcount += r.stats.tiaftstrokecount;
							r.stats.tiaftavgdiff += (r.stats.tiaftstrokescore / r.stats.tiaftstrokecount) * (avgTiaftDiff || 1);
						}
						// In case that not a lot was compared rank this result slightly down
						r.stats.tiaftavgdiff += Math.sqrt( maxtiaftcount - r.stats.tiaftcount ) * 0.2 * avgTiaftDiff;
						r.stats.fravgwrong += Math.sqrt( maxfrcount - r.stats.frcount ) * 0.2 * avgFRDiff;
						
						maxtiaft = Math.max(maxtiaft, r.stats.tiaftavgdiff);
						maxfr = Math.max(maxfr, r.stats.fravgwrong);
					});
					
					$.each(results, function(i, r) {
						// Hier ist die Stellschraube für die Ergebnisgewichung
						if (maxtiaft === 0) {
							r.stats.fuzzyscore = ( r.stats.fravgwrong / (maxfr || verySmallNumber) );
						} else if (maxfr === 0) {
							r.stats.fuzzyscore = ( r.stats.tiaftavgdiff / (maxtiaft || verySmallNumber) );
						} else {
							var tiaftratio = (r.stats.tiaftcount + 5.5) / (r.stats.frcount + 5);
							r.stats.fuzzyscore = tiaftratio * ( r.stats.tiaftavgdiff / maxtiaft ) + (1/tiaftratio) * ( r.stats.fravgwrong / maxfr );						
						}
					});
					
					results.sort(function(a, b) {
						return a.stats.fuzzyscore - b.stats.fuzzyscore;
					});

					// Save results at local storage
					sa.save(results, criteria, true);
					
					// Render!
					$doc.triggerHandler('ama-search-results', [results, criteria, $tab]);
				})
				.fail();
		},
		fillDialogWithCriteria: function(criteria) {
			$.each(window.criteria2Selector, function(critKey, crit) {
				$(crit.selector).val(criteria[critKey]);
			});
			for (var i = 1; i <= window.numberoftiafts; ++i) {
				$('#tiaft_' + i).val(criteria.tiaft['c_t' + i]);
			}
			$.each(window.renderfields, function(i, f) {
				if (!f.fs) return;
				$('input[name="opt' + f.k + '"]').filter('[value="' + criteria.fr[f.k] + '"]').click();
			});
		},
		// Creates a dialog which offers loading a saved search
		loadUI: function() {
			var $dlg = $('<div>'),
				st = $.jStorage.get(storagekey),
				title = "Gespeicherte Suche laden",
				$form = $('<form>'),
				$sel = $('<select size="8" class="ui-widget-content ui-corner-all" style="width:98%">').appendTo($form);
				
			var _onsubmit = function(e) {
				if (e) e.preventDefault();
				var $opt = $sel.find('option:selected');
				if (!$opt.length) return alert("Bitte wähle eine gespeicherte Suche aus der Liste.");
				
				var data = $opt.data('ama-searchdata'),
					$newTab = app.UI.addTab(data.criteria.name);
					
				// Change tab order (important for menu items)
				$newTab.$header.find('a').click();
				
				$doc.triggerHandler('ama-search-results', [data.result, data.criteria, $newTab.$content]);
				
				$dlg.dialog('close');
			};
			var _onDelete  = function(e) {
				var $opt = $sel.find('option:selected');
				if (!$opt.length) return alert("Bitte wähle eine gespeicherte Suche aus der Liste.");
				
				var data = $opt.data('ama-searchdata'),
					isAuto = $opt.data('ama-is-auto'),
					st_d = $.jStorage.get(storagekey),
					resultcoll = isAuto ? st_d.auto : st_d.manual;
					
				$.each(resultcoll, function(i, infoItem) {
					if (infoItem.id === data.id) {
						resultcoll.splice(i, 1);
						return false;
					}
				});
				$.jStorage.set(storagekey, st_d);
				$dlg.dialog('close');
				$dlg.closeImmediately = true;
				sa.loadUI();
			};

			
			if (!st) return alert("Es sind keine gespeicherten Suchen vorhanden.");
			$.each(st.auto, function(i, sti) {
				$('<option>').text(sti.criteria.name + ' (auto saved)').data('ama-searchdata', sti).data('ama-is-auto', true).appendTo($sel);
			});
			$.each(st.manual, function(i, sti) {
				$('<option>').text(sti.criteria.name).data('ama-searchdata', sti).data('ama-is-auto', false).appendTo($sel);
			});
			
			$form.submit(_onsubmit).appendTo($dlg);
			$sel.dblclick(_onsubmit).keypress(function(e) {
				if (13 === e.which) _onsubmit(e);
			});
			
			$dlg.dialog({
				title: title,
				width: Math.min($(window).width(), 510),
				hide: 'fade',
				buttons: [
					{
						text: "Laden", 
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
					}, {
						text: "Löschen", 
						click: _onDelete,
						icons: {
							primary: 'ui-icon-trash'
						}
					}
				],
				open: function() {
					$dlg.prev().find('.ui-dialog-title').html('<span class="ui-titlebar-icon ui-icon ui-icon-folder-open"></span><span>' + title + '</span>');
				},
				close: function() {
					if ($dlg.closeImmediately) {
						$dlg.remove();
						$dlg.closeImmediately = false;
					} else {
						setTimeout(function() {
							$dlg.remove();
						}, 1000);					
					}
				}
			});
			setTimeout(function() {
				$sel.focus();
			}, 10);
		},
		saveUI: function() {
			var results = window.getCurrentTabResults(),
				criteria = window.getCurrentTabCriteria();
				
			if (!results || !criteria) return alert("Leider kann diese Suche nicht gespeichert werden. U.U. liegt ein Programmfehler vor. Bitte wende Dich an den Softwarehersteller.");
			var $dlg = $('<div>'),
				st = $.jStorage.get(storagekey),
				title = "Suchergebnisse speichern",
				$form = $('<form>'),
				$label = $('<label for="ama_saveui_target">').text("Name, unter dem die aktuelle Suche gespeichert werden soll").appendTo($form),
				$input = $('<input type="text" size="40" style="width:98%" class="ui-widget-content ui-corner-all" id="ama_saveui_target">').val(criteria.name).appendTo($form),
				$info = $.createInfoContainer('ui-icon-info', "Die Speicherdauer hängt von Deinen Browsereinstellungen ab.", '3.3em').appendTo($form);
				
			var _onsubmit = function(e) {
				if (e) e.preventDefault();
				var name = $input.val();
				if (name) criteria.name = name;
				sa.save(results, criteria, false);
				$dlg.dialog('close');
			};

			
			$form.submit(_onsubmit).appendTo($dlg);
			$input.keypress(function(e) {
				if (13 === e.which) _onsubmit(e);
			});
			
			$dlg.dialog({
				title: title,
				width: Math.min($(window).width(), 510),
				hide: 'fade',
				modal: true,
				buttons: [
					{
						text: "Speichern", 
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
					}
				],
				open: function() {
					$dlg.prev().find('.ui-dialog-title').html('<span class="ui-titlebar-icon ui-icon ui-icon-disk"></span><span>' + title + '</span>');
				},
				close: function() {
					setTimeout(function() {
						$dlg.remove();
					}, 1000);
				}
			});
			setTimeout(function() {
				$input.focus();
			}, 10);
		},
		// Saves the search (result and criteria)
		save: function(result, criteria, auto) {
			var st = $.jStorage.get(storagekey),
				id = Math.round(Math.random() * 4294967296);
				
			st = st || { auto: [], manual: [] };
			if (auto) {
				if (st.auto.lenght > maxstore) st.auto.shift();
				st.auto.push({
					result: result,
					id: id,
					criteria: criteria
				});		
			} else {
				st.manual.push({
					result: result,
					id: id,
					criteria: criteria
				});	
			}
			$.jStorage.set(storagekey, st);
		},
		// Logic
		filter: function(data, criteria) {
			var $d = $.Deferred(),
				// There is much room for improvement
				// unfortunately, I was not able to find any SMART/SMILES JS-parser
				// Only C++ https://github.com/openbabel/openbabel/blob/f61715484535efd796d0b4045f17f9ceb1b56028/src/formats/smilesformat.cpp
				// and this is *very* complex, rewriting this in JS will take at least 14d
				smartSmiles = criteria.smartSmiles.replace(/\-([^\[])/g, '').replace(/c/g, 'C').replace(/\[(C)H\d?\]/g, '$1'),
				datalength = data.lenght;
				
			setTimeout(function() {
				jQuery.eachAsync(data, {
					bulk: 200,
					loop: function(idx, v) {
						var matches = true,
							tiaftTolerance = criteria.tiafttolerance,
							remainingExceptions = criteria.exceptioncount,
							tiaftExceptTolerance = criteria.tiaftexcepttolerance,
							frRemaining = criteria.frtolerance,
							// Statistic variables for sorting
							stats = {
								tiaftcount: 0,
								tiaftdiff: 0,
								tiaftavgdiff: 0, //not entirely true
								tiaftstrokescore: 0,
								tiaftstrokecount: 0,
								frcount: 0,
								frcorrect: 0,
								fravgwrong: 0,
								fuzzyscore: 0
							};
						
						for (var i = 1; i <= window.numberoftiafts; ++i) {
							var tKey = 'c_t' + i,
								tValList = v[tKey],
								tValCrit = criteria.tiaft[tKey],
								tDiff;
							
							// Some students want to search for "-", although I consider this highly risky.
							if (!$.isNumeric(tValList) || !$.isNumeric(tValCrit)) {
								if (tValCrit === '-') {
									stats.tiaftstrokecount++;
									if (tValList === '-') {
										// OK
									} else {
										// WRONG!
										remainingExceptions--;
										stats.tiaftstrokescore++;
									}
								}
								continue;
							}
							
							tDiff = Math.abs(tValList - tValCrit);
							stats.tiaftcount++;
							stats.tiaftdiff += Math.pow(tDiff, 1.2);
							
							// Wenn der Unterschied die Toleranz überschreitet…
							if (tDiff > tiaftTolerance) {
								remainingExceptions--;
								// Falls selbst der für die Toleranzen angegebene Wert überschritten wird
								if (tDiff > tiaftExceptTolerance) {
									matches = false;
									// Continue with next compound
									return;
								}
							}
						}
						// Wenn die Anzahl der gewährten Ausreißer überschritten wurde
						if (remainingExceptions < 0) {
							matches = false;
							return;
						}
						// +0.1 to prevent div by zero // 1.1 to honor that more values usually give more statistical
						// security (calculating the standard deviation would require a lot more so let's keep it simple)
						stats.tiaftavgdiff = stats.tiaftdiff / (Math.pow(stats.tiaftcount, 1.1) + 0.1);
						
						$.each(window.renderfields, function(i, f) {
							if (!f.fs) return;
							
							var key = f.k,
								frValList = v[key],
								frValCrit = criteria.fr[key];
							
							if ('unknown' === frValCrit) return;
							if (!frValList) return;
							
							stats.frcount++;
							if ('minus' === frValCrit) {
								// "Hard criterion"
								if (frValList.indexOf('++') >= 0) {
									frRemaining--;
									return;
								}
								// Just downgrade in result ranking
								if (frValList === '+') {
									stats.frcorrect -= 0.3;
								}
								if (frValList !== '-') {
									stats.frcorrect -= 0.2;
								}
								stats.frcorrect += 0.01;
							} else if ('plus' === frValCrit) {
								if (frValList === '-') {
									frRemaining--;
									return;
								}
								if (frValList.indexOf('++') >= 0) {
									stats.frcorrect += 0.01;
								}
							}
							stats.frcorrect += 0.99;
						});
						if (v.c_smiles && smartSmiles) {
							stats.frcount++;
							if (v.c_smiles.indexOf(smartSmiles) > -1) {
								stats.frcorrect++;
							} else {
								frRemaining--;
							}
						}
						stats.fravgwrong = ((stats.frcount - stats.frcorrect) / stats.frcount) || 0;
						if (frRemaining >= 0) $d.notify(stats, v, datalength / idx);
					},
					end: function() {
						$d.resolve();
					}
				});
			}, 1);
			return $d;
		}
	};

	window.searchalgo = sa;
	$(function() {
		$('#ama_load').click(function(e) {
			e.preventDefault();
			sa.loadUI();
		});
		$('#ama_save').click(function(e) {
			e.preventDefault();
			sa.saveUI();
		});
	});
}, window, [jQuery]);