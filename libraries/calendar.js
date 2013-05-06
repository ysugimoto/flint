/**
 * @author sugimoto
 */

 ClassExtend('Library',
 function calendar()
 {
 	//initialize
	var FL = getInstance();
	var thisClass = this;
	FL.load.css('calendar');
 	var dObj = new Date();
	dObj.setFullYear(1989);
 	var currentYear = dObj.getFullYear();
	var currentMonth = dObj.getMonth();
	var today = currentYear + '' +  currentMonth + '' +  dObj.getDate();
	dObj.setDate(1);

	var currentDay = dObj.getDay();
	var weekArr = ['日', '月', '火', '水', '木', '金', '土'];
	var lastDayArr = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	var calendarNode = DOM.create('div', {id : 'ci_calendar_id', 'class' : 'ci_calendar_box'}).addStyle('opacity', 0);
	calendarNode.event('mousedown', function(ev){
		(FL.ua.IE) ? document.body.onselectstart = function(e){return false;} : ev.preventDefault();
	});
	var ymTable = DOM.create('table', {'class' : 'ci_calendar_ym_table'});
	var calBody = DOM.create('div', {'class' : 'ci_calendar_body'});
	var calBodyTable = DOM.create('table', {'class' : 'ci_calendar_body_table'});
	var inputMode = false, showFlag = false, clicked = false;
	var currentTarget = '';
	this.targetPosition = {};
	this.selectedDate = 0;
	//changeDate Methods
	this.createCalendarCloseBtn = function(){
		var a =  DOM.create('a', {'class' : 'ci_clanedar_close'});
		a.event('click', function(ev){thisClass.hide()});
		return a;
	}
	this.adjustDate = function()
	{
		dObj.setFullYear(currentYear);
		dObj.setMonth(currentMonth);
		dObj.setDate(1);
		currentDay = dObj.getDay();
		showFlag = false;
		this.resetContents();
		this.show(currentTarget, true);

	}
	this.resetContents = function()
	{
		ymTable.first(true).remove();
		calBodyTable.first(true).remove();
		calBody.first(true).remove();
		calendarNode.first(true).remove();
	}
	this.nextMonth = function()
	{
		currentMonth += 1;
		if (currentMonth == 12)
		{
			 currentMonth = 0;
			 currentYear += 1;
		}
		this.adjustDate();
	}
	this.prevMonth = function()
	{
		currentMonth -= 1;
		if (currentMonth < 0)
		{
			currentMonth = 11;
			currentYear -= 1;
		}
		this.adjustDate();
	}
	this.nextYear = function()
	{
		currentYear += 1;
		this.adjustDate();
	}
	this.prevYear = function()
	{
		currentYear -= 1;
		this.adjustDate();
	}
	this.genereteCal = function(y, m, day)
	{
		var day = day;
		if((y % 4 ) == 0 && (y % 100) != 0 || (y % 400) == 0)lastDayArr[1] = 29;
		var lastDay = lastDayArr[m];
		var rowArr = Math.ceil((day + lastDay) / 7);
		var dateArr = [];
		for(var l = 0; l < lastDay; l++)dateArr[l+ day] = l + 1;
		var p = day - 1;
		var prevM = (m - 1 < 0 ) ? 11 : m;
		while (p >= 0)
		{
			dateArr[p] = [lastDayArr[prevM] - (day - p), 'npDay'];
			p--;
		}
		var count =  7 - dateArr.length % 7;
		for (var n = 0; n < count; n++)dateArr.push([n + 1, 'npday']);
		//create date state and prev_next_month, year
		var tbYM = DOM.create('tbody');
		var trYM = DOM.create('tr');
		var YM = DOM.create('th', {'class' : 'ci_calendar_caption_ym', 'colspan' : '5'}).inText(y + '年' + (m + 1) + '月').add(trYM);
		trYM.add(tbYM);
		var trPN = DOM.create('tr');
		var prY = DOM.create('th');
		var prY_a = DOM.create('a');
		prY_a.attr('href', 'javascript:void(0)');
		prY_a.html('&lt;&lt;前年');
		prY_a.event('click', function(ev){
			thisClass.prevYear();
		});
		prY_a.add(prY);
		prY.add(trPN);
		var prM = DOM.create('th');
		var prM_a = DOM.create('a');
		prM_a.attr('href', 'javascript:void(0)');
		prM_a.html('&lt;前月');
		prM_a.event('click', function(){
			thisClass.prevMonth();
		});
		prM_a.add(prM);
		prM.add(trPN);
		var bl = DOM.create('th');
		bl.attr('class', 'ci_calendar_ym_blank');
		bl.add(trPN);
		var neM = DOM.create('th');
		var neM_a = DOM.create('a');
		neM_a.attr('href', 'javascript:void(0)');
		neM_a.html('翌月&gt;');
		neM_a.event('click', function(){
			thisClass.nextMonth();
		});
		neM_a.add(neM);
		neM.add(trPN);
		var neY = DOM.create('th');
		var neY_a = DOM.create('a');
		neY_a.attr('href', 'javascript:void(0)');
		neY_a.html('翌年&gt;&gt;');
		neY_a.event('click', function(){
			thisClass.nextYear();
		});
		neY_a.add(neY);
		neY.add(trPN);
		trPN.add(tbYM);
		tbYM.add(ymTable);
		ymTable.add(calendarNode);

		//create calendar table
		var tb = DOM.create('tbody');
		var tr_week = DOM.create('tr');
		for(var i = 0; i < weekArr.length; i++)
		{
			var th_week = DOM.create('th');
			if (i == 0) {
				th_week.attr('class', 'ci_calendar_sunday');
			}
			else if (i == 6) {
				th_week.attr('class', 'ci_calendar_saturday');
			}
			else
			{
				th_week.attr('class', 'ci_calendar_week');
			}
			th_week.inText(weekArr[i]);
			th_week.add(tr_week);
		}
		tr_week.add(tb);
		for(var j = 0; j < rowArr; j++)
		{
			var tr_body = DOM.create('tr');
			for(var k = 0; k < 7; k++)
			{
				var td_day = DOM.create('td');

				if (typeof dateArr[k + (j * 7)] == 'object') {
					if (k == 0)
					{
						td_day.attr('class', 'ci_calendar_sunday  np_textf');
					}
					else if (k == 6)
					{
						td_day.attr('class', 'ci_calendar_saturday  np_textf');
					}
					else
					{
						td_day.attr('class', 'np_text');
					}
					td_day.inText(dateArr[k + (j * 7)][0]);
				}
				else {
					if (k == 0)
					{
						td_day.attr('class', 'ci_calendar_sunday');
					}
					else if (k == 6)
					{
						td_day.attr('class', 'ci_calendar_saturday');
					}
					if (y + '' + m + '' + dateArr[k + (j * 7)] == today) {
						td_day.attr('id', 'ci_calendar_today');
						td_day.inText(dateArr[k + (j * 7)]);
					}
					else {
						td_day.inText(dateArr[k + (j * 7)]);
					}
/*					td_day.event('mouseover', function(ev){
						var target = thisClass.FL.utility.getEventElement(ev);
						target.addStyle('background-color', '#ccc');
					});
					td_day.event('mouseout', function(ev){
							var target = thisClass.FL.utility.getEventElement(ev);
							if (target.className == 'ci_calendar_sunday')
							{
								var bg = '#ffb9b9';
							}
							else if (target.className == 'ci_calendar_saturday')
							{
								var bg = '#84c1ff';
							}
							else
							{
								var bg = '#fff';
							}
						target.addStyle('background-color', bg);
					})
					td_day.event('mouseover', function(ev){
						var target = thisClass.FL.utility.getEventElement(ev);
						if (thisClass.inputMode === true)
						{
							thisClass.target.value = target.innerHTML;
						}
					})
*/
				}
				td_day.add(tr_body);

			}
			tr_body.add(tb);
		}
		tb.add(calBodyTable);
		calBodyTable.add(calBody)
		calBody.add(calendarNode);
		var close = this.createCalendarCloseBtn();
		close.add(calendarNode);
		calendarNode.addStyle({
			position : 'absolute',
			top : targetPosition.top + 'px',
			left : targetPosition.right + 'px'
		})

		return calendarNode;
	}
	//this.cal = this.genereteCal(this.currentYear, this.currentMonth, this.currentDay);
	this.show = function(target, flag)
	{
		if (showFlag)return;
		var mode = (flag) ? flag : false;
		currentTarget = (target) ? (target.extended) ? target : DOM.ex(target) : DOM.ex(document.body);
		if (currentTarget.tag == 'input' || currentTarget.tag== 'textarea')inputMode = true;
		targetPosition = currentTarget.absDimension();
		var cal = this.genereteCal(currentYear, currentMonth, currentDay);
		this.addEvent();
		if (mode) {
			cal.addStyle('opacity', 1);
		}
		else {
			cal.add();
			//Animation.appear(cal, {speed : (FL.ua.IE) ? 0.1 : 0.02});
			cal.addStyle('opacity', 1);
		}
		showFlag = true;

		if (FL.ua.IE) {
		setTimeout(function(){
			FL.event.set(document, 'click', thisClass.hide);
		}, 500);
		}

	}
	this.hide = function()
	{
		if (FL.ua.IE)FL.event.remove(document, 'click', thisClass.hide);
		if (showFlag === false)return;
		thisClass.resetContents();
		calendarNode.remove();
		//Animation.fade(calendarNode, {
		//	listener : function(){
		//		thisClass.resetContents();
		//		calendarNode.remove();
		//	},
		//	speed : (FL.ua.IE) ? 0.1 : 0.02
		//});
		thisClass.removeEvent();
		showFlag = false;

	}
	var mouseOverListener = function(ev)
	{
		var e = DOM.ex(FL.utility.getEventElement(ev));
		if (e.tag != 'td')return;
		e.addStyle({
			backgroundColor : '#ccc',
			color : '#fff'
		});
	}
	var mouseOutListener = function(ev)
	{
		var e = DOM.ex(FL.utility.getEventElement(ev));
		if (e.tag != 'td')return;
		if (/ci_calendar_sunday/.test(e.readAttr('class'))) {
			if (/np_textf/.test(e.readAttr('class'))) {
				e.addStyle({
					backgroundColor: '#ffb9b9',
					color: '#fff'
				});
			}
			else {
				e.addStyle({
					backgroundColor: '#ffb9b9',
					color: '#f00'
				});
			}
		}
		else
			if (/ci_calendar_saturday/.test(e.readAttr('class'))) {
				if (/np_textf/.test(e.readAttr('class')))
				{
					e.addStyle({
						backgroundColor: '#84c1ff',
						color: '#fff'
					});
				}
				else
				{
					e.addStyle({
						backgroundColor: '#84c1ff',
						color: '#00f'
					});
				}
			}
			else if (e.id == 'ci_calendar_today')
			{
				e.addStyle({
					backgroundColor: '#fff',
					color: '#ff80ff'
				});
			}
			else
			{
				if (/np_text/.test(e.readAttr('class')))
				{
					e.addStyle({
						backgroundColor: '#fff',
						color: '#ccc'
					});
				}
				else
				{
					e.addStyle({
						backgroundColor: '#fff',
						color: '#000'
					});

				}

			}
	}
	var format = function(date) {
		var d = (date.length == 1) ? '0' + date : date;
		var m = (currentMonth + 1).toString();
		m = (m.length == 1) ? '0' + m : m;
		return currentYear + '-' + m + '-' + d;
	}
	var clickListener = function(ev)
	{
		if (FL.ua.IE)ev.returnValue = false;
		var e = DOM.ex(FL.utility.getEventElement(ev));
		if (e.tag != 'td' || e.hasClass('np_text'))return;
		currentTarget.getNative().value = format(e.getHTML());
		//thisClass.hide();
	}
	this.isHidden = function(){
		return (showFlag === true) ? false : true;
	}
	this.addEvent = function()
	{
		FL.event.set(calBodyTable, 'mouseover', mouseOverListener, true);
		FL.event.set(calBodyTable, 'mouseout', mouseOutListener, true);
		if (inputMode)calBodyTable.event('click', clickListener, true);
	}
	this.removeEvent = function()
	{
		FL.event.remove(calBodyTable, 'mouseover', mouseOverListener);
		FL.event.remove(calBodyTable, 'mouseout', mouseOutListener);
		if (inputMode)calBodyTable.event('click', clickListener);

	}
 });
