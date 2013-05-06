/**
*flint cookie_helper.js
*this helper supplies some utility functions for cookie manage
*@author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
*@create 2009/12/21
*/

(function() {
	var FL = getInstance(), Helper = FL.config.getGlobal('Helper'), doc = document;
	var cookiePath = FL.config.item('cookiePath'), cookieDomain = FL.config.item('cookieDomain'),
		cookieMaxAge = FL.config.item('cookieMaxAge'), cookieName = FL.config.item('cookieName'),
		cookieSeparator = FL.config.item('cookieSeparator'), cookieDelimiter = FL.config.item('cookieDelimiter');
	
	if (!functionExists('setCookie')) {
		Helper.setCookie = function(obj) {
			if (!FL.ut.isObject(obj))return;
			var cv = [], path, domain, secure, maxAge, d;
			if ('path' in obj) {
				path = obj.path; delete obj.path;
			} else {
				path = cookiePath;
			};
			if ('domain' in obj) {
				domain = obj.domain; delete obj.domain;
			} else {
				domain = cookieDomain;
			};
			if ('secure' in obj) {
				secure = obj.secure; delete obj.secure;
			} else {
				secure = false;
			};
			
			d = new Date();
			
			if (!('lifetime' in obj)) {
				d.setTime(d.getTime() + cookieMaxAge * 1000 * 60 * 60 * 24);
			} else {
				d.setTime(d.getTime() + obj.lifetime  * 1000 * 60 * 60 * 24);
			};
			maxAge = d.toGMTString();
			
			// set cookieValue
			for (var p in obj) {
				cv.push(cookieName + '_' + p + '=' + encodeURIComponent(obj[p]));
				cv.push('d' + cookieSeparator + domain);
				cv.push('p' + cookieSeparator + path);
				var c = [cv.join(cookieDelimiter)];
				if (path != '') c.push('path=' + path);
				c.push('expires=' + maxAge);
				doc.cookie = c.join('; ');
				cv = [];
			};
			return (doc.cookie) ? true : false;
		};
	}

	if (!functionExists('getCookie')) {
		Helper.getCookie = function(name) {
			var c = doc.cookie;
			if (!c || !name)return false;
			var cvs = c.split(';'), cv = null, cvslen = cvs.length;
			for (var i = 0; i < cvslen; i++) {
				if (cvs[i].indexOf(cookieName + '_' + name) > 0) {
					cv = cvs[i].replace(new RegExp(cookieName + '_' + name + '='), '');
					break;
				};
			};
			if (cv == null) return false;
			var val = cv.split(cookieDelimiter)[0];
			return decodeURIComponent(val);
		};
	}

	if (!functionExists('deleteCookie')) {
		Helper.deleteCookie = function(name) {
			var c = doc.cookie;
			if (!c || !name) return false;
			var cvs = c.split(';'), cvslen = cvs.length, d = '', p = '', cv = null, cd = null, cp = null, cma = null, cn = null;
			for (var i = 0; i < cvslen; i++) {
				if (cvs[i].indexOf(cookieName + '_' + name) > 0) {
					cv = cvs[i];
					break;
				};
			};
			if (cv == null) return false;
			cn = cv.split('=');
			var val = cn[1].split(cookieDelimiter);
			for (var j = 0; j < val.length; j++) {
				var del = val[j].split(cookieSeparator);
				switch (del[0]) {
				case 'd': d = del[1]; break;
				case 'p': p = del[1]; break;
				default : var tmp = del[0]; break;
				};
			};
			if (FL.ua.IE || FL.ua.Safari) {
				var nc = [cn[0] + '=' + tmp];
				if (path != '') nc.push('path=' + path);
				var exp = new Date();
				exp.setTime(exp.getTime() - (10 * 1000 * 24 * 60 * 60));
				nc.push('expires=' + exp.toGMTString());
				doc.cookie = nc.join(';');
			} else {
				doc.cookie = ([cn[0] + '=', 'domain=' + d, 'path=' + p, 'max-age=0']).join(';');
			};
			return true;
		};
	}

})();

// end cookie_helper.js