/**
 * Converts move-heights in TIAFT systems (TLC) to hRf values
 * Contains both, the logic and the user interface.
 */
 
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
 
/**
 * @example
		loader.using('hrf.js', function() {
			console.log('ok');
			$div = $('<div>');
			window.$hrfDlg(1, $div);
			$div.dialog({
				width: 600
			});
		});
*/

/*global loader:false*/
loader.importStylesheet('jQuery/jqPlot/jquery.jqplot.min.css');
loader.implement('hrf.js', [
	'jQuery/jqPlot/jquery.jqplot.min.js',
	'jQuery/jqPlot/excanvas.js',
	'data/hrfcorr.js'
	], function ($) {
	'use strict';
	
	loader.load([
		'jQuery/jqPlot/plugins/jqplot.highlighter.min.js',
		'jQuery/jqPlot/plugins/jqplot.cursor.min.js',
		'jQuery/jqPlot/plugins/jqplot.pointLabels.min.js',
		'jQuery/jqPlot/plugins/jqplot.canvasAxisLabelRenderer.min.js',
		'jQuery/jqPlot/plugins/jqplot.canvasTextRenderer.min.js'
	]);
	
	var $tlcRenderer, $graphRenderer, parseVal,
		$dlgT = $('<form>')
			.attr('autocomplete', 'off'),
		$tlcFieldT = $('<div>')
			.addClass('ama-tlc-field ama-placeholder-box'),
		$graphT = $('<div>')
			.addClass('ama-graph-field ama-placeholder-box'),
		$inputsT = $('<div>')
			.addClass('ama-hrfcorr-input-field');
	
	parseVal = function(v) {
		return parseFloat(v.replace(/,/g, '.'));
	};
	
	/**
	 * Data must use the following format:
		[ // tracks
			{
				points: [{
					hrf: <value>,
					label: '<label>' (optional)
				}],
				label: '<label>' (optional)
			}
		]
	 */
	$tlcRenderer = function($tlcField, system, data) {
		var $def = $.Deferred(),
			tracks = [],
			tlcTotalHeight = $tlcField.height(),
			$baseline, $solventStop,
			$makeTrack, $makePoint, renderTracks, __onBaselineLoaded, __onMarkerPointLoaded;

		// Create the TLC plate
		$tlcField
			.empty()
			.addClass('ama-tlc-plate');

		$baseline = $('<div>')
			.addClass('ama-tlc-plate-baseline')
			.css({
				bottom: tlcTotalHeight / 10,
				left: 0
			})
			.appendTo($tlcField);
			
		$solventStop = $('<div>')
			.addClass('ama-tlc-plate-baseline ama-tlc-solvent-stop')
			.css({
				bottom: tlcTotalHeight / 10,
				left: 0
			})
			.appendTo($tlcField);
			
		__onBaselineLoaded = function() {
			var h = $baseline.height();
			$baseline
				.css('bottom', tlcTotalHeight / 10 - h/2);
			$solventStop
				.animate({
					top: tlcTotalHeight / 30 - h/2
				});
			
			renderTracks(tlcTotalHeight - ( tlcTotalHeight / 10 ) - ( tlcTotalHeight / 30 ), tlcTotalHeight / 10, $tlcField.width());
		};
		$('<img>')
			.load(__onBaselineLoaded)
			.attr('src', 'images/Pencil_stroke.png')
			.appendTo($baseline)
			.clone()
			.appendTo($solventStop);

		$('<div>')
			.addClass('ama-tlc-system-circle')
			.append($('<div>').text(system))
			.appendTo($tlcField);
			
		$makeTrack = function(desc, number, tracksTotal, tlcWidth, tlcHeight, tlcOffset) {
			var space = tlcWidth - (tracksTotal * 18),
				spaceptrack = space / (tracksTotal + 1),
				$track = $('<div>')
					.addClass('ama-tlc-track')
					.css({
						height: tlcHeight,
						width: 18,
						bottom: tlcOffset,
						left: ( number * spaceptrack ) + ( 18 * (number - 1) )
					}),
				$desc = $('<div>')
					.text(desc)
					.addClass('ama-tlc-track-desc')
					.appendTo($track);

			setTimeout(function() {
				$desc.css({
					'margin-left': ($desc.width() / 2 - $track.width() / 2) * -1 + 'px'
				});
			}, 1);
			return $track;
		};
		
		$makePoint = function(point, tlcHeight) {
			var $desc = $('<div>')
					.text(point.label)
					.attr('title', point.label)
					.append('<br/>', Math.round(point.hrf)),
				$point = $('<div>')
					.addClass('ama-tlc-maker-point')
					.css('bottom', -12)
					.appendTo($tlcField);
				
			setTimeout(function() {
				$point.animate({
					bottom: ( tlcHeight * point.hrf / 100 ) - $point.height() / 2
				}, function() {
					$point.append($desc.hide());
					$desc.fadeIn($.proxy($def.resolve, $def));
				});
			}, 1);
			
			return $point;
		};
		
		renderTracks = function(tlcHeight, tlcOffset, tlcWidth) {
			$.each(data, function(i, d) {
				var $t = $makeTrack(d.label, i + 1, data.length, tlcWidth, tlcHeight, tlcOffset);
				$t.appendTo($tlcField);
				$.each(d.points, function(x, point) {
					$t.append($makePoint(point, tlcHeight));
				});
			});
		};
		
		return $def;
	};
	
	$graphRenderer = function($graph, data) {
		$graph.empty().jqplot(data, {
			// Turns on animatino for all series in this plot.
			animate: true,
			// Will animate plot on calls to plot1.replot({resetAxes:true})
			animateReplot: true,
			cursor: {
				show: true,
				zoom: true,
				looseZoom: true,
				showTooltip: false
			},
			seriesDefaults: {
				pointLabels: {
					show: true,
					location:'e',
					edgeTolerance: -50
				},
				rendererOptions: {
					// Speed up the animation a little bit.
					// This is a number of milliseconds. 
					// Default for bar series is 3000. 
					animation: {
						speed: 2500
					}
				}
			},
			axesDefaults: {
				pad: 0
			},
			axes: {
				// These options will set up the x axis like a category axis.
				xaxis: {
					label: 'hRf*'
				},
				yaxis: {
					label: 'hRf',
					labelRenderer: $.jqplot.CanvasAxisLabelRenderer
				}
			},
			highlighter: {
				show: true,
				showLabel: true,
				tooltipAxes: 'y',
				sizeAdjust: 7.5,
				tooltipLocation: 'ne'
			}
		});
	};
	
	window.$hrfDlg = function(system, node) {
	
		var $def = $.Deferred(),
			$dlg = $dlgT.clone(),
			$tlcField = $tlcFieldT.clone().appendTo($dlg),
			$graph = $graphT.clone().appendTo($dlg),
			$inputs = $inputsT.clone().appendTo($dlg),
			$solventWrap = $('<div>')
				.addClass('ama-space')
				.appendTo($inputs),
			$solventL = $('<label for="ama-hrfcorr-solv"/>')
				.text("Laufmittel-Laufhöhe")
				.appendTo($solventWrap),
			$solventInput = $('<input id="ama-hrfcorr-solv" size="8" pattern="[\\d\\,\\.]+" required="required"/>')
				.addClass('ui-widget-content ui-corner-all')
				.appendTo($solventWrap.append('&nbsp;')),
			$sampleWrap = $('<div>')
				.addClass('ama-space')
				.appendTo($inputs),
			$sampleL = $('<label for="ama-hrfcorr-sample"/>')
				.text("Laufhöhe der Probe im System " + system)
				.appendTo($sampleWrap),
			$sampleInput = $('<input id="ama-hrfcorr-sample" size="8" pattern="[\\d\\,\\.]+" required="required"/>')
				.addClass('ui-widget-content ui-corner-all')
				.appendTo($sampleWrap.append('&nbsp;')),
			$refInputsField = $('<fieldset>')
				.addClass('ui-helper-reset ui-corner-all ama-dotted-border ama-fieldblock')
				.appendTo($inputs),
			$refInputL = $('<legend>')
				.text("Laufhöhen der Referenzen (System " + system + ")")
				.appendTo($refInputsField),
			$refInputUl = $('<ul>')
				.addClass('ama-list-inputs-pretty')
				.appendTo($refInputsField),
			refs = $.grep(window.hrfcorr, function(item) {
				return system + '' === item.hc_system + '';
			}).sort(function(el1, el2) {
				return Number(el1.hc_hrfc) - Number(el2.hc_hrfc);
			}),
			$refInputs = $(),
			$resultContainer = $('<div>')
				.addClass('ama-sepa')
				.appendTo($inputs),
			$calcButton = $('<button role="submit" type="submit">')
				.text("Berechnen")
				.button({
					icons: {
						primary: 'ui-icon-calculator'
					}
				})
				.appendTo($resultContainer),
			$calcResult = $('<span>')
				.appendTo($resultContainer.append('&nbsp;')),
			$allInputs;

		$.each(refs, function(i, ref) {
			var id = 'ama-hrfcorr-r' + i,
				$ipWrap = $('<li>')
					.appendTo($refInputUl);

			$('<label>')
				.attr('for', id)
				.text(ref.hc_substance)
				.appendTo($ipWrap);
			$ipWrap.append(' ');
			$refInputs = $refInputs.add( 
				$('<input type="text" size="8" pattern="[\\d\\,\\.]+" required="required"/>')
					.addClass('ui-widget-content ui-corner-all')
					.attr('id', id)
					.data('id', i)
					.appendTo($ipWrap)
			);
		});
		
		$dlg.appendTo(node);
		$allInputs = $refInputs.add($sampleInput).add($solventInput).on('input', function() {
			$tlcField.empty();
			$graph.empty();
			$calcResult.empty();
		}).validateNumber('input', true);
		
		$dlg.submit(function(e) {
			if (e && e.preventDefault) {
				e.preventDefault();
			}
			var solventHeight = parseVal($solventInput.val()),
				data = [[0, 0, '']],
				tlcData = [],
				tlcSampleData = [],
				tlcJoinedData = [],
				getHRf = function(height) {
					return (height / solventHeight) * 100;
				},
				samplehRf = getHRf(parseVal($sampleInput.val())),
				samplehRfc = 0,
				sampleData = [],
				abort, prevRef;
			
			// Validate input
			$allInputs.each(function(i, input) {
				var $input = $(input),
					val = $input.val();
					
				if (!val || parseVal(val) > solventHeight) {
					abort = true;
					$input.add($solventInput)._blink();
				}
			});
			if (abort) return;
			
			$refInputs.each(function(i, el) {
				var $el = $(el),
					id = $el.data('id'),
					ref = refs[id],
					val = getHRf(parseVal($el.val()));
					
				if (prevRef && val < prevRef.val) {
					abort = true;
					$el.add(prevRef.$el)._blink();
				}
				prevRef = {
					val: val,
					$el: $el
				};
				data.push([ref.hc_hrfc, val, ref.hc_substance]);
				tlcData.push({ hrf: val, label: ref.hc_substance });
			});
			if (abort) return;
			data.push([100, 100, '']);
			
			$allInputs.attr('disabled', 'disabled').addClass('ui-state-disabled');
			$calcResult.empty();
			
			// Process the sample
			$.each(data, function(i, values) {
				// Unlikely but we must be correct.
				// And given the fact that Paracetamol appears in samples, not so unlikely at all!
				if (values[1] === samplehRf) {
					sampleData = [[values[0],  samplehRf, "Probe"]];
					tlcSampleData.push({ hrf: samplehRf, label: "Probe" });
					return false;

				} else if (values[1] > samplehRf) {
					var hRfBc = data[i-1][0],
						hRfB = data[i-1][1],
						hRfAc = values[0],
						hRfA = values[1],
						hRfSc = hRfBc + ( (hRfAc-hRfBc) / (hRfA-hRfB) ) * ( samplehRf - hRfB );
					
					sampleData = [[hRfSc,  samplehRf, "Probe"]];
					tlcSampleData.push({ hrf: samplehRf, label: "Probe" });
					return false;
				}
			});
			tlcJoinedData = tlcData.slice(0);
			tlcJoinedData.push.apply(tlcJoinedData, tlcSampleData);
			
			$tlcRenderer($tlcField, system, [{
					points: tlcData,
					label: 'Ref'
				}, {
					points: tlcSampleData,
					label: 'Pr'
				}, {
					points: tlcJoinedData,
					label: 'Ref+Pr'
				}
			]).done($.proxy($graphRenderer, window, $graph, [data, sampleData])).done(function() {
				setTimeout(function() {
					samplehRfc = Math.round(sampleData[0][0]);
					$calcResult.hide().text("hRf* (Probe): " + samplehRfc).fadeIn('slow');
					$('<button>')
						.attr({
							role: 'button',
							type: 'button'
						})
						.addClass('ama-tlc-final-submit')
						.text("Übernehmen")
						.button({
							icons: {
								primary: 'ui-icon-circle-check'
							}
						})
						.click($.proxy($def.resolve, $def, samplehRfc))
						.appendTo($calcResult)
						.focus();
					$allInputs.removeAttr('disabled').removeClass('ui-state-disabled');
				}, 2000);
			});
		
		});
		
		return $def;
	};
	
}, window, [jQuery]);