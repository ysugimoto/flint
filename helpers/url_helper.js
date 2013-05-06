/**
*flint url helper
*this helper supplies some functions like CodeIgniter uri_helper
*@author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
*@create 2009/12/21
*/

(function(){
	var FL = getInstance(), Helper = FL.config.getGlobal('Helper');
	if (!functionExists('siteUrl')) {
		Helper.siteUrl = function(segment) {
			var suffix = segment || '';
			return FL.config.siteUrl(suffix);
		};
	}

	if (!functionExists('baseUrl')) {
		Helper.baseUrl = function() {
			return FL.config.baseUrl();
		};
	}

	if (!functionExists('currentUrl')) {
		Helper.currentUrl = function() {
			return FL.config.siteUrl('all');
		};
	}

	if (!functionExists('uriString')) {
		Helper.uriString = function() {
			var all = FL.config.siteUrl('all');
			var current = FL.config.siteUrl();
			return all.replace(current, '');
		};
	}

	if (!functionExists('anchor')) {
		Helper.anchor = function(uri, title, att) {
			var title = title || '', site, att = att || '';
			if (FL.ut.isArray(uri)) {
				site = siteUrl(uri);
			} else {
				site = (/^\w+:\/\//i.test(uri) === false) ? siteUrl(uri) : uri;
			}
			if (title == '') {
				title = site;
			}
			if (att != '') {
				if (FL.ut.isObject(att)) {
					var tmpAtt = [];
					for (var i in att) {
						tmpAtt.push(i + '="' + att[i] + '"');
					}
					att = tmpAtt.join(' ');
				}
			}
			return '<a href="' + site + '"' + att + '>' + title + '</a>';
		};
	}

	if (!functionExists('anchorE')) {
		Helper.anchorE = function(uri, title, att) {
			var title = title || '', site, att = att || '', DOM = FL.config.getGlobal('DOM');
			if (FL.ut.isArray(uri)) {
				site = siteUrl(uri);
			} else {
				site = (/^\w+:\/\//i.test(uri) === false) ? siteUrl(uri) : uri;
			}
			if (title == '') {
				title = site;
			}
			if (att != '') {
				if (FL.ut.isString(att)) {
					var atts = att.split(' '), attslen = atts.length, tmpO = {};
					for (var i = 0; i < attslen; i++) {
						var at = atts[i].split('=');
						tmpO[at[0]] = at[1].replace(/['"]/g, '');
					}
					att = tmpO;
				}
			}
			return DOM.create('a', att).inText(title);
		};
	}

	if (!functionExists('redirect')) {
		Helper.redirect = function(path) { location.href = FL.config.siteUrl() + path;};
	}

	if (!functionExists('absRedirect')) {
		Helper.absRedirect = function(abs) { location.href = abs;};
	}
	/** other url_helper method unnecessary in javascript? */
})();


// End file of url_helper.js
// Location: helpers/url_helper.js