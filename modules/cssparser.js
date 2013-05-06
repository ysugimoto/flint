/**
 * Flint CSS Parser
 * this module supplies parsed CSS rule and selectors of all document.stylesheets
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @usage
 *  CSSParser.parsedObj has parsed css rules like:
 *  	parsedObj {
 *  		CSS Property : {
 *  			Property Value : selector ...
 *  		}
 *  	}
 *  	get selectorText that has some Property and value from CSSParser.getElementsByCSSPropAndValue (method name too long...)
 */

(function(){

	var FL = getInstance(), DOM = FL.DOM, isParse = false, doc = document, win = window;
	var Module = FL.Module;
	var trim = function(str){return str.replace(/^\s*(.*?)/, '$1').replace(/(.*?)\s*$/, '$1');};
	var filter = /^filter/i, filterReg = /^filter\s*?:\s*?(.*?)/i, reg = /(\w*?):?([\w\-\(\)]*?):\s?(.+?)/i;
	function CSSParser(css) {
		// parse all css rules
		// script execute time is??
		this.css = css;
		this.cssLen = css.length;
		this.parsedObj = {};
		this.importantStack = [];
		this.imTmp = {};
		this.construct();
	};

	CSSParser.prototype = {
		construct : function() {
			for (var i = 0; i < this.cssLen; i++) {
				this.parseSheets(this.css[i]);
				this.importantStack = [];
				this.imTmp = {};
			}
			this.addImportant();
			isParse = true;
		},
		parseSheets : function(css){
			if (css.imports) {
				try {
					var im = css.imports, iml = im.length;
					for (var i = 0; i < iml; i++) this.parseSheets(im[i]);
				}catch(e){}
			}
			try{
				var rules = css[(FL.ua.IE) ? 'rules' : 'cssRules'], len = rules.length;
				for (var i = 0; i < len ; i++) {
					this.parseRules(rules[i]);
				}
			} catch(e){}
		},
		parseRules : function(rule) {
			var s = rule.selectorText, r = rule.style.cssText.split(';'), rlen = r.length, m, prop, val, imp;
			for (var i = 0; i < rlen; i++) {
				if (r[i] == '')continue;
				if (filter.test(r[i])) { // for IE filtes like (filter : progid:DXImageTransForm...)
					prop = 'filter'; val = r[i].reaplce(filterReg, '');
				} else {
					var p = r[i].lastIndexOf(':');
					prop = r[i].slice(0, p); val = r[i].slice(p + 1);//prop = m[1] + m[2]; val = m[3];
				}
				if (prop && prop != '' && val && val != '') {
					// check !important
					if (val.indexOf('!') !== -1) {
						val = trim(val.slice(0, val.indexOf('!')));
						imp = 1;
					}
					this.addStack(prop.toLowerCase(), val.toLowerCase(), s, imp || false);
				}
			}
		},
		addStack : function(p, v, s, im) {
			var is = this.importantStack, imt = this.imTmp, prop = trim(p), val = trim(v), selector = trim(s), important = im, key;
			if (important){
				is.push([prop, val, selector]);
				imt[prop + selector] = 1;
			} else {
				key = prop + selector;
				if (!(key in imt)) {
					this.add(prop, val, selector);
				}
			}
		},
		add : function(p, v, s) {
			var css = this.parsedObj;
			if (p.indexOf('color') !== -1) {
				v = FL.ut.rgbToHex(v);
			}
			if (!FL.ut.isObject(css[p])) {
				css[p] = {};
			}
			if (!FL.ut.isArray(css[p][v])) {
				css[p][v] = [];
			}
			css[p][v].push(s);
		},
		addImportant : function() {
			var im = this.importantStack, len = im.length;
			for (var i = 0; i < len; i++) {
				this.add(im[i][0], im[i][1], im[i][2]);
			}
		},
		getParsedCSS : function(){
			return (isParsed) ? this.parsedObject : 'css has not parsed yet.';
		},
		getElementsByCSSValue : function(prop, val) {
			var css = this.parsedObj, t, s, q, ret = [];
			if (!css[prop]) return [];
			if (val) {
				if (val in css[prop]) q = css[prop][val];
			} else {
				q = css[prop];
			}
			if (FL.ut.isObject(q)) {
				for (var i in q) {
					ret = ret.concat(this.__get(q[i]));
				}
			} else {
				ret =this.__get(q);
			}
			return DOM.__extendNodeList(ret);
		},
		__get : function(q) {
			var m = 0, len = q.length, query = [];
			for (m; m < len; m++) {
				query = query.concat(DOM.__getElementsBySelector(q[m]));//, querylen = query.length;
				//for (var i = 0; i<querylen; i++) {
				//	res.push(query[i]);
				//}
			}
			return query;
		}
	};

	// ondomReady
	win['FLCSS'] =new CSSParser(doc.styleSheets);
	//Module.onReady('cssparser');
})();