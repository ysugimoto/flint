/**
*flint date_helper
*this helper supplies some functions about Date like PHP function
*@author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
*@create 2009/12/21
*/

(function() {
	var FL = getInstance(), Helper = FL.config.getGlobal('Helper');
	var d = new Date(), mList = [['Jan', 'January', 31], ['Feb', 'February', 28], ['Mar', 'March', 31], ['Apr', 'Aplil', 30], ['May', 'May', 31], ['Jun', 'June', 30], ['Jul', 'July', 31], ['Aug', 'August', 31], ['Sep', 'September', 30], ['Oct', 'October', 31], ['Nov', 'November', 30], ['Dec', 'December', 31]];
	var dList = [['Mon', 'Monday'], ['Tue', 'Tuesday'], ['Wed', 'Wednesday'], ['Thu', 'Thursday'], ['Fri', 'Friday'], ['Sat', 'Saturday'], ['Sun', 'Sunday']];

	if (!functionExists('now')) {
		Helper.now = function() { return (new Date()).getTime(); };
	}

	if (!functionExists('checkDate')) {
		Helper.checkDate = function(m, d, y) {
			if (y < 1970)return false;
			var dateL = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
			if((y % 4 ) == 0 && (y % 100) != 0 || (y % 400) == 0)dateL[1] = 29;
			if (m <= 0 || m > 12) return false;
			if (d <= 0 || d > dateL[m - 1])return false;
			return true;
		};
	}

	if (!functionExists('date')) {
		Helper.date = function(format, timeStamp) {
			var ts = (timeStamp) ? timeStamp : Helper.now(), pt;
			d.setTime(ts);
			var y = d.getFullYear(), m = d.getMonth(), day = d.getDay(), date = d.getDate(), h = d.getHours(), min = d.getMinutes(), sec = d.getSeconds();
			if ((y % 4) == 0 && (y % 100) != 0 || (y % 400) == 0) mList[1][2] = 29;
			var dFormat = {'Y' : y, 'y' : d.getYear(), 'F' : mList[m][1], 'm' : (m.toString().length == 1) ? '0' + (m + 1) : (m + 1),
										'M' : mList[m][0], 'n' : (m + 1), 't' : mList[m][2], 'd' : (date.toString().length == 1) ? '0' + date : date,
										'D' : dList[day][0], 'j' : date, 'l' : dList[day][1], 'N' : day, 'w' : (day - 1),
										'z' : (function() {
											var cnt;
											for (var i = 0; i < (m + 1); i++) cnt += mList[m][2];
											return cnt + date;
										}),
										'a' : (h < 12) ? 'am' : 'pm', 'A' : (h < 12) ? 'AM' : 'PM', 'g' : (h > 12) ? h - 12 : h, 'G' : h,
										'h' : (function() {
											var r = '';
											if (h > 12){
												return (h - 12).toString().length == 1 ? '0' + (h - 12) : h - 12;
											} else {
												return (h.toString().length == 1) ? '0' + h : h;
											};
										})(),
										'H' : (h.toString().length == 1) ? '0' + h : h, 'i' : (min.toString().length == 1) ? '0' + min : min,
										's' : (sec.toString().length == 1) ? '0' + sec : sec, 'u' : d.getMilliseconds()
			};
			for (var p in dFormat) {
				pt = new RegExp(p);
				if (!pt.test(format)) continue;
				format = format.replace(pt, dFormat[p]);
			};
			return format;
		};
	}
})();

// end file date_helper.js