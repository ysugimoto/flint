/**
*Flint builtin Object extend plugin
*@author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
*@create 2010/01/12
*/

(function(){
	var FL = getInstance(), win = window;

	//aliases
	var ap = Array.prototype, sp = String.prototype, nump = Number.prototype, dp = Date.prototype;
	/**
	 * Array Extends
	 */
	// Array.isArray
	if(!Array.isArray){Array.isArray = function(arg) {
		return (arg && arg.constructor == Array.constructor);
	};}

	// Array.prototype.indexOf
	if (!ap.indexOf) {ap.indexOf = function(search, index) {
		if (Array.indexOf) { return Array.indexOf(this, search, index);}
		var a = this, len = a.length, i = index || 0;
		if (i >= len) {return -1;}
		if (i < 0) {i += len;}
		for (i; i < len; i++) {
			if (a[i] === search) {return i;}
		}
		return -1;
	};}

	// Array.prototype.lastIndexOf
	if (!ap.lastIndexOf) {ap.lastIndexOf = function(search, lastIndex) {
		if (Array.lastIndexOf){ return Array.lastIndexOf(this,search,lastIndex);}
		var a = this, len = a.length, i = (!lastIndex || lastIndex >= len) ? len - 1 : (lastIndex < 0) ? lastIndex + len : lastIndex;
		for (i; i > -1; i--) {
			if (a[i] === search) {return i;}
		}
		return -1;
	};}

	// Array.prototype.every
	if (!ap.every) {ap.every = function(fn, that){
		var a = this, len = a.length, i = 0;
		if (!ut.isFunction(fn)) {throw new TypeError();}
		for (i; i < len; i++) {
			if (a[i] && !fn.call(that, a[i], i, a)) {return false;}
		}
		return true;
	};}

	// Array.prototype.some
	if (!ap.some) {ap.some = function(fn, that){
		var a = this, len = a.length, i = 0;
		if (!ut.isFunction(fn)) {throw new TypeError();}
		for (i; i < len; i++) {
			if (a[i] && fn.call(that, a[i], i, a)){ return true;}
		}
		return false;
	};}

	// Array.prototype.forEach
	if (!ap.forEach) {ap.forEach = function(fn) {
		var a = this, len = a.length, i = 0;
		if (!ut.isFunction(fn)) {throw new TypeError();}
		for (i; i < len; i++) {
			if (a[i]) {fn.call(that, a[i], i, a);}
		}
	};}

	// Array.prototype.map
	if (!ap.map) {ap.map = function(fn, that) {
		var a = this, len = a.length, i = 0, res;
		if (!ut.isFunction(fn)) {throw new TypeError();}
		for (i; i < len; i++) {
			if (a[i]) {res[i] = fn.call(that, a[i], i, a);}
		}
		return res;
	};}

	// Array.prototype.filter
	if (!ap.filter) {ap.filter = function(fn, that){
		var a = this, len = a.length, i = 0, val, res = [];
		if (!ut.isFunction(fn)) {throw new TypeError();}
		for (i; i < len; i++) {
			if(a[i]){
				val = a[i];
				if (fn.call(that, a[i], i, a)){res.push(val);}
			}
		}
		return res;
	};}

	// Array.prototype.reduce
	if (!ap.reduce) {ap.reduce = function(fn, index){
		var a = this, len = a.length, i = 0, ret;
		if (!ut.isFunction(fn) || (len === 0 && !index)) {throw new TypeError();}
		if (index) {ret = index;}
		else {
			do {
				if (i in a) {ret = a[i++]; break;}
				if (++i >= len) {throw new TypeError();}
			} while(true);
		}
		for (i; i < len; i++) {
			if (a[i]) {ret = fn.call(null, ret, a[i], this);}
		}
		return ret;
	};}

	// Array.prototype.reduceRight
	if (! ap.reduceRight) {ap.reduceRight = function(fn, lastIndex){
		var a = this, len = a.length, i = len - 1, ret;
		if (!ut.isFunction(fn) || (len === 0 && !index)) {throw new TypeError();}
		if (index) {ret = index;}
		else {
			do {
				if (i in a) {ret = a[i--]; break;}
				if (--i >= len) {throw new TypeError();}
			} while(true);
		}
		for (i; i >= 0; i--) {
			if (a[i]) {ret = fn.call(null, ret, a[i], this);}
		}
		return ret;
	};}

	/**
	 * String prototype.extends
	 */

	// String.prototype.trim
	if (!sp.trim) {sp.trim = function(){
		return this.replace(/^\s+|\s+$/g, '');
	};}

	// String.prototype.trimLeft
	if (!sp.trimLeft) {sp.trimLeft = function(){
		return this.replace(/^\s+/g, '');
	};}

	// String.prototype.trimRight
	if (!sp.trimRight) {sp.trimRight = function(){
		return this.replace(/\s+$/g, '');
	};}

	// String.prototype.nl2br
	if (!sp.nl2br) {sp.nl2br = function() {
		return this.replace(/\r\n/g, '<br />').replace(/\r|\n/g, '<br />');
	};}

	// String.prototype.truncate
	if (!sp.truncate) {sp.truncate = function(len, etc) {
		if (!len) {throw new TypeError('truncate');}
		else {
			var suffix = etc || '...';
			var a = this, l = this.length;
			return this.slice(0, (len >= l) ? l : len) + suffix;
		}
	};}

	// String.prototype.clean
	if (!sp.clean) {sp.clean = function(isScript) {
		var quoteMode = (isScript) ? isScript : true;
		if (quoteMode) {
			this.replace(/<script>(.*?)<\/script>/ig, '[removedtag]$1[removedtag]').replace(/javascript:/ig, '[removedprotocol]');
		}
		// String.replaceは引数に関数を与えるよりも、逐一呼び出したほうが関数呼び出しコストが下がり高速である
		return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\'/g, '&#039;');
	};}

	/**
	 * Number prototype.extends
	 */

	// Number.ptrototype.numberFormat
	if (!nump.numberFormat) {nump.numberFormat =  function() {
		var str = this.toString(), f = false, minus = '', spl;
		if (str.indexOf('.') !== -1) {
			spl = str.split('.'); f = spl[1]; str = spl[0];
		}
		if (/^[\-]/.test(str)) {
			minus = '-'; str = str.slice(1);
		}
		if (/[0-9]+/g.test(str)) {
			while(str != (str = str.replace(/^(-?\d+)(\d{3})/, "$1,$2"))){}
			return (f) ? minus +str + '.' + f : minus + str;
		} else{ throw new SyntaxError('numberFormat');}
	};}

	/**
	 * JSON on Global Object
	 */

	if (!ut.isset(win.JSON)) {win.JSON = {};}
	if (!JSON.parse) {JSON.parse = json.parse;}
	if (!JSON.stringify) {JSON.stringify = json.stringify;}

	/**
	 * Math.extends
	 */
	if (!Math.nRandom) {Math.nRandom = function(min, max){return Math.round(Math.random() * (max - min)) + min;};}

	/**
	 * Date.extends
	 */
	// Date.now
	if (!Date.now) {Date.now = function() { return +new Date();};}

	// Date.format
	if (!dp.format) {dp.format = function(format, time) {
		if (time) {this.setTime(time);}
		var y = this.getFullYear(), m = this.getMonth(), day = this.getDay(), date = this.getDate(), h = this.getHours(), min = this.getMinutes(), sec = this.getSeconds();
		function Z() {var cnt; for (var i = 0; i < (m + 1); i++) {cnt += mList[m][2]; return cnt + date;}}
		function H() {var r = ''; if (h > 12){	return (h - 12).toString().length == 1 ? '0' + (h - 12) : h - 12;} else { return (h.toString().length == 1) ? '0' + h : h;}}
		if ((y % 4) === 0 && (y % 100) !== 0 || (y % 400) === 0) {mList[1][2] = 29;}
		var dFormat = {
				'Y' : y, 'y' : this.getYear(), 'F' : mList[m][1], 'm' : (m.toString().length === 1) ? '0' + (m + 1) : (m + 1),
				'M' : mList[m][0], 'n' : (m + 1), 't' : mList[m][2], 'd' : (date.toString().length === 1) ? '0' + date : date,
				'D' : dList[day][0], 'j' : date, 'l' : dList[day][1], 'N' : day, 'w' : (day - 1),
				'z' : Z(), 'a' : (h < 12) ? 'am' : 'pm', 'A' : (h < 12) ? 'AM' : 'PM', 'g' : (h > 12) ? h - 12 : h, 'G' : h,
				'h' : H(), 'H' : (h.toString().length === 1) ? '0' + h : h, 'i' : (min.toString().length === 1) ? '0' + min : min,
				's' : (sec.toString().length === 1) ? '0' + sec : sec, 'u' : this.getMilliseconds()
		};
		for (var p in dFormat) {
			if (!p.isPorototypeOf(dFormat)) {
				if (!(new RegExp(p)).test(format)) {continue;}
				format = format.replace(pt, dFormat[p]);
			}
		}
		return format;
	};}

})();