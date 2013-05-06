/**
 * Flint Calendar Library
 *
 * generate ajax calendar Element support
 * @package Flint
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 */
ClassExtend('Library', function sz_calendar() {

	// make API in this scope
	var FL = getInstance(), DOM = FL.DOM;

	// alias shortcut functions
	var mc = Math.ceil, pi = parseInt;

	// fixes this class scope
	var that = this;

	// base date object
	var dObj = new Date();

	// current y,m,d
	var current = {
		year : dObj.getFullYear(),
		month : dObj.getMonth(),
		date : dObj.getDate(),
		day : dObj.getDay()
	};

	// guard flag
	var generated = false;

	// today
	var today = current.year + '' + current.month + '' + current.date + '';

	// today year-month
	var todayYM = current.year + '' + current.month;

	dObj.setDate(1);

	/* ============================= statick values ================================ */

	var weekArr = ['日', '月', '火', '水', '木', '金', '土'];
	var lastDateArr = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	/* ========================================================================================= */

	// configraltion
	var config = {
		yearRange : '1989-' + dObj.getFullYear(),
		inputMode : false,
		template : 'calendar',
		mode : 'range',
		separator : '-'
	};

	// minimum year, max year
	var minYear, maxYear;

	// targets
	var target, iptMonth, iptYear;

	// base node
	var calendar = DOM.create('div').attr('id', 'fl_calendar');

	// check strict date
	var isCorrectYM = function() {
		var y = current.year + '', m = current.month + '', op, len, i = 0;

		switch (config.mode) {
		case 'past':
			if (y + m <= todayYM) { return false;}
			break;
		case 'future':
			if (y + m >= todayYM) { return false;}
			break;
		case 'range':
				op = iptYear.get().options;
				len = op.length;
				for(i; i < len; i++) {
					if (op[i].value == y) { return true;}
				}
				return false;
		}
		return true;
	};

	// adjust date
	var adjustDate = function(flag) {
		dObj.setFullYear(current.year);
		dObj.setMonth(current.month);
		dObj.setDate(1);
		current.day = dObj.getDay();
		iptYear.setValue(current.year);
		iptMonth.setValue(current.month);
		resetContents();
	};

	// resetContents : clear calendar table
	var resetContents = function() {
		calendar.detect('div.fl_calendar_body').get(0).html(createBody());
	};

	// format date
	var format = function(d) {
		var s = config.separator, c = current,
			dv = d.length === 1 ? '0' + d : d,
			m = ((c.month + 1) + '').length === 1 ? '0' + (c.month + 1) : c.month + 1;

		return c.year + s + m + s + dv;
	};

	// click event handilng
	var handleCalendarEvent = function(ev) {
		ev.stopPropagation();
		ev.preventDefault();
		var e = DOM(ev.target);

		if (e.tag === 'a') {
			if (e.parent().tag === 'td') { // date clicked
				if (config.inputMode === true) {
					target.setValue(format(e.getHTML()));
					calendar.hide();
				}
			} else if (e.hasClass('move')) { // prev/next month
				if (e.hasClass('next_month')) {
					that.nextMonth();
				} else if (e.hasClass('prev_month')) {
					that.prevMonth();
				}
			}
		}
	};

	// select change handling(year)
	var handleSelectChange = function(ev) {
		current.year = pi(iptYear.getValue());
		current.month = pi(iptMonth.getValue());
		adjustDate();
	};

	// create year pulldown
	var createPullDownYear = function() {
		var sp = config.yearRange.split('-'), s = pi(sp[0], 10), e = sp[1],
			out = ['<select class="fl_calendar_year">'];

		for (s; s <= e; s++) {
			out.push('<option value="' + s + '">' + s + '</option>');
		}
		out.push('</select>');
		return out.join('');
	};

	// create month pulldown
	var createPullDownMonth = function() {
		var out = ['<select class="fl_calendar_month">'], i = 0;

		for (i; i < 12; i++) {
			out.push('<option value="' + i + '">' + (i + 1) + '</option>');
		}
		out.push('</select>');
		return out.join('');
	};

	// create year, month section
	var createHeader = function() {
		var html = [
		            '<div class="fl_calendar_header">',
		            '<form>',
		            createPullDownYear() + '年' + createPullDownMonth() + '月',
		            '</form>',
		            '<a href="javascript:void(0)" class="prev_month move">&laquo;前月</a>',
		            '<a href="javascript:void(0)" class="next_month move">翌月&raquo;</a>',
		            '</div>'
		            ];

		return html.join('');
	};

	// create week header
	var createWeekHeader = function() {
		var out = ['<table class="fl_calendar_weeks" cellspacing="2" cellpadding="2"><tbody><tr>'], i = 0, str;

		for (i; i < 7; i++) {
			switch(i) {
				case 0: str = 'sunday'; break;
				case 6: str = 'saturday'; break;
				default: str = 'week'; break;
			}
			out.push('<td class="' + str + '"><span>' + weekArr[i] + '</span></td>');
		}
		out.push('</tr></tbody></table>');
		return out.join('');
	};

	// create calendar body
	var createBody = function() {
		var y = current.year, m = current.month, d = dObj.getDay(), lastDate = lastDateArr[m], rows = mc((d + lastDate) / 7),
			p = d - 1, prevM = (m - 1) < 0 ? 11 : m, dates = [], count, n = 0, i = 0,
			j = 0, k = 0, out = ['<table cellspacing="2" cellpadding="2"><tbody>'], row, d;

		for (i; i < lastDate; i++) { dates[i + d] = i + 1;}
		while (p >= 0) {
			dates[p] = [lastDateArr[prevM] - (d - p), 'np_day'];
			p--;
		}
		count = 7 - dates.length % 7;
		for (n; n < count; n++) { dates.push([n + 1, 'np_day']);}
		for (; j < rows; j++) {
			row = '<tr>';
			for (k = 0; k < 7; k++) {
				row += '<td'; d = dates[k + j * 7];
				switch (k) {
					case 0: row += ' class="sunday">'; break;
					case 6: row += ' class="saturday">'; break;
					default: row += '>'; break;
				}
				if (FL.ut.isArray(d)) {
					row += '<span>' + d[0] + '</span>';
				} else {
					row += '<a href="javascript:void(0)">' + d + '</a>';
				}
				row += '</td>';
			}
			row += '</tr>';
			out.push(row);
		}
		out.push('</tbody></table>');
		return out.join('');
	};

	// set current yar and month
	var setCurrentYM = function() {
		calendar.children(0).detect('select').get(0).setValue(current.year + '')
													.rollBack()
													.get(1).setValue(current.month + '');
	};
	
	var formatYearRange = function(y) {
		var tmp;
		
		if ( y.indexOf('+') !== -1 ) {
			tmp = y.split('+');
			tmp[2] = 1;
		} else if ( y.indexOf('-') !== -1 ) {
			tmp = y.split('-');
			tmp[2] = 0;
		} else {
			tmp = [y, 0, 1];
		}
		
		tmp[0] = ( tmp[0] === 'current') 
			        ? current.year
			        : tmp[0] | 0;
		tmp[1] = tmp[1] | 0;
		
		if ( tmp[2] ) {
			return tmp[0] + tmp[1];
		} else {
			return tmp[0] - tmp[1];
		}
	}

	// change config
	this.initialize = function(conf) {
		var range;
		
		config = FL.union(config, conf || {});
		range = config.yearRange.split('-');
		range[0] = formatYearRange(range[0]);
		range[1] = formatYearRange(range[1]);
		config.yearRange = range.join('-');
	};


	// set next month
	this.nextMonth = function() {
		if (++current.month === 12) {
			current.month = 0;
			current.year += 1;
			if (!isCorrectYM()) {
				current.month = 11;
				current.year--;
				return;
			}
		}
		if (!isCorrectYM()) {
			current.month--;
			return;
		}
		adjustDate();
	};

	// set previous month
	this.prevMonth = function() {
		if (--current.month < 0) {
			current.month = 11;
			current.year -= 1;
			if (!isCorrectYM()) {
				current.month = 0;
				current.year++;
				return;
			}
		}
		if (!isCorrectYM()) {
			current.month++;
			return;
		}
		adjustDate();
	};

	// set next year
	this.nextYear = function() {
		current.year++;
		adjustDate();
	};

	// set previous year
	this.prevYear = function() {
		current.year--;
		adjustDate();
	};

	this.setUp = function(input) {
		if (input) {
			if (target && input == target) { return;}
			target = input;
			config.inputMode = true;
		}
		FL.load.css(config.template);
		this.generate();
	}

	// generate calendar
	this.generate = function() {
		if (generated === false) {
			var sp = config.yearRange.split('-'), html;

			minYear = pi(sp[0], 10); maxYear = pi(sp[1], 10);
			html = [
		            '<div class="fl_calendar_wrapper">',
		            createHeader(),
		            createWeekHeader(),
		            '<div class="fl_calendar_body">',
		            createBody(),
		            '</div>',
		            '</div>',
		            '<div class="fl_calendar_footer">&nbsp;</div>'
		            ];

			calendar.html(html.join('')).appendTo(document.body);

			// event set
			FL.event.set(calendar, 'click', handleCalendarEvent);
			FL.event.set(document, 'click', function() {
				if (calendar.isHidden()) { return;}
				calendar.hide();
			});
			generated = true;
		}
		if (config.inputMode === true) {
			var dim = target.absDimension();

			setCurrentYM();
			iptYear = calendar.detect('select').get(0);
			iptMonth = calendar.detect('select').get(1);

			iptYear.event('change', handleSelectChange);
			iptMonth.event('change', handleSelectChange);

			calendar.addStyle({top : dim.bottom + 'px', left : dim.left + 'px'});
			target.event('focus', function(ev) {
				ev.stopPropagation();
				calendar.show();
			}).event('click', function(ev) { ev.stopPropagation();});

		}
	};
});