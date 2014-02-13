/**
 * Polyfill for directly copying stuff into the clipboard without Flash
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
/*global loader:false*/
loader.implement('clipboard.js', [], function ($) {
	'use strict';
	
	var $dummyTA = $('<textarea>').css({
			'border': 'none',
			'opacity': 0,
			'position': 'absolute',
			'top': 0,
			'left': 0
		});
	
	if (!window.clipboardData) {
		window.clipboardData = {
			setData: function(format, d) {
				var noExecCommand = function() {
					var text = "Clipboard access restricted by your browser. Press Ctrl+C", 
						$dlg = $('<div>').attr('title', text),
						$info = $('<div>')
							.text(text)
							.appendTo($dlg),
						$ta = $('<textarea>')
							.val(d)
							.css({
								width: '100%',
								height: '4em'
							}).attr('readonly', 'readonly')
							.appendTo($dlg),
						onclick = function() { $ta.focus().select(); },
						iv;
							
						$dlg.dialog({
							modal: true,
							open: function() {
								setTimeout(function() {
									$ta.focus().select().keydown(function(e) {
										if ((e.metaKey || e.ctrlKey) && e.which === 67) {
											setTimeout(function() {
												$dlg.dialog('close');
											}, 1);
										}
									}).focusout(function() {
										$ta.focus().select();
										return false;
									}).click(function() {
										$ta.select();
									});
								}, 10);
								iv = setInterval(function() {
									$ta.focus().select();
								}, 100);
								$(document).click(onclick);
							},
							close: function() {
								$dlg.remove();
								clearTimeout(iv);
								$(document).off('click', onclick);
							}
						});
				};
			
				// First try the good old "execCommand"
				if ($.isFunction(document.execCommand)) {
					var $ta = $dummyTA.clone().val(d).appendTo('body');
					setTimeout(function() {
						$ta.focus().select();
						try {
							if (document.execCommand('copy')) return $ta.remove();
						} catch (ex) {}
						$ta.remove();
						noExecCommand();
					}, 1);
					return;
				}
				noExecCommand();
			}
		};
	}
	window.clipboardData.getDataDeferred = function(cb) {
		if ($.isFunction(window.clipboardData.getData)) {
			return cb( window.clipboardData.getData( 'Text' ) );
		}
		var noExecCommand = function() {
			var text = "Clipboard access restricted by your browser. Press Ctrl+V", 
				$dlg = $('<div>').attr('title', text),
				$info = $('<div>')
					.text(text)
					.appendTo($dlg),
				$ta = $('<textarea>')
					.css({
						width: '100%',
						height: '4em'
					})
					.appendTo($dlg),
				onclick = function() { $ta.focus().select(); },
				iv;
					
				$dlg.dialog({
					modal: true,
					open: function() {
						setTimeout(function() {
							$ta.focus().select().keydown(function(e) {
								if ((e.metaKey || e.ctrlKey) && e.which === 86) {
									setTimeout(function() {
										cb($ta.val());
										$dlg.dialog('close');
									}, 1);
								}
							}).focusout(function() {
								$ta.focus().select();
								return false;
							}).click(function() {
								$ta.select();
							});
						}, 10);
						iv = setInterval(function() {
							$ta.focus().select();
						}, 100);
						$(document).click(onclick);
					},
					close: function() {
						$dlg.remove();
						clearTimeout(iv);
						$(document).off('click', onclick);
					}
				});
		};
		
		// First try the good old "execCommand"
		if ($.isFunction(document.execCommand)) {
			var $ta = $dummyTA.clone().appendTo('body');
			setTimeout(function() {
				$ta.focus().select();
				try {
					if (document.execCommand('paste')) {
						setTimeout(function() {
							cb($ta.val());
							$ta.remove();
						}, 1);
						return;
					}
				} catch (ex) {}
				$ta.remove();
				noExecCommand();
			}, 1);
		} else {
			noExecCommand();
		}
	};
}, window, [jQuery]);