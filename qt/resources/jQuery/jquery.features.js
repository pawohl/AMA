/**
 * Feature detection and browser-glitch-resolver.
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
/*global loader:false*/

(function( $ ) {
	'use strict';

	$.features = $.features || {};
	$(function() {
		var $img = $('<img>').load(function(e) {
			var $this = $img;
			setTimeout(function() {
				if ($this.prop('width') >= 100) $.features.SVGInImg = true;
				$this.remove();
			}, 1);
		})
			.css({
				display: 'block',
				position: 'fixed',
				top: -400,
				left: -400
			})
			.attr('src', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48L3N2Zz4%3D')
			.appendTo('body');
		setTimeout(function() {
			$img.css('display', 'none');
		},2000); // we need such a big timeout for Opera
	});
	setTimeout(function() {
		$.features.isMobile = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
			$('#mobile-dummy').css('display') === 'none');
	}, 100);
	$.features.isCanvasSupported = function () {
		var elem = document.createElement('canvas');
		return !!(elem.getContext && elem.getContext('2d'));
	};
	// IE10 and 11 have the habit of rendering the fieldset's border through the legend
	if (/(?:MSIE 10|rv\:11\.0)/i.test(navigator.userAgent)) {
		$(function() {
			$('body').addClass('styled-legend');
		});
	}
}( jQuery ));