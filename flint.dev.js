/* ========================================================================
 * @license The MIT License
 *    http://www.opensource.org/licenses/mit-license.php
 * @author  Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @copyright Neo,Inc <http://neo-navi.net/>
 * @version    ,v 0.6.1
 * ========================================================================
 */

(function(initTime, doc, win, uri, ua) {

	// 重複ロードを禁止する
	if (win.getInstance) { return;}

	/*
	 * 内部で使用するオブジェクトや一時格納用オブジェクト定義
	 */
	// SYSTEM - コアシステム上のランタイムの計測等の実行時間保持
	var SYSTEM = {
			INITIAL_TIME : initTime,
			DOM_CREATE_TIME : 0,
			WINDOW_LOADED_TIME : 0,
			READY_TIME : 0,
			ACCESS_URI : uri,
			CONTROLLER : null,
			CONTROLLER_NAME  : '',
			EXEC_METHOD : null,
			METHOD_ARGUMENTS : {},
			WINDOW_LOADED : false,
			START_CONTROLLER : null,
			READY : false,
			READY_FUNC : [],
			BENCH_MARKS : {},
			DOM_LOADED : false,
			CURRENT_ZINDEX : 1,
			SSL_CONNECT : false,
			IS_READY : false,
			XHR_RESPONSES : {
				READY_STATE : { 1 : 'LOADING', 2 : 'LOADED', 3 : 'INTERACTIVE', 4 : 'COMPLETED'},
				STATUS : {403 : 'PERMISSION ERROR', 404 : 'NOT FOUND', 500 : 'SERVER ERROR', 503 : 'INTERNAL SERVER ERROR', 200 : 'OK', 999 : 'UNDEFINED'}
			},
			/*
			 * POSITION_FIX for IE6
			 * position:static -- 1
			 * position:relative -- 2
			 * position:absolute -- 3
			 * position:fixed -- 4
			 */
			POSITION_STATIC : 1,
			POSITION_RELATIVE : 2,
			POSITION_ABSOLUTE : 3,
			POSITION_FIXED : 4,
			POSITION : {'static' : 1, 'relative' : 2, 'absolute' : 3, 'fixed' : 4}
	};

	// STACK - ラッパーオブジェクトやイベントハンドラを保持
	var STACK = {
			ELEMENTS : {},
			EVENT_HANDLERS : [],
			LOADED_FUNCS : [],
			DOM_LOADED_FUNCS : [],
			LOADED_API : {},
			ATTACH_API : {},
			LOADED_CSS : {},
			INSTANCED_API : {},
			CONFIG : {},
			GLOBAL_LAYER : null,
			CAMELED_PROP : {},
			DECAMELED_PROP : {},
			API_STACK : [],
			CSS_STACK : [],
			LOADER_COUNT : 0,
			API_READY : {},
			MODULE_READY : {},
			API_READY_FUNC : {},
			MODULE_READY_FUNC : {},
			ATTACH_API_READY : {},
			BENCH_MARKS : {},
			AJAX_QUEUE : [],
			AJAX_EVENTS : [],
			URI_DATA : {}
	};
	// SelectorCSSExp - CSS3セレクタの構成要素を特定するためのregオブジェクト(タグ部分のみ)
	var SelectorCSSExp = {
		universal: /^[\*]$/,  //universal selector
		AttributeSelector: /^\w*\[.+\]$/,  //Attribute selector
		classSelector : /^\w*\.[\w\-_\$]+$/,  //class selector
		idSelector : /^\w*\#[\w\-_\$]+$/  //ID selector
	};

	// SelectorsFilterExp - CSS3擬似クラス部分のフィルターハッシュ
	var SelectorsFilterExp = {
		root: /^root$/,
		nthChild: /^nth-child\(.+\)$/,
		nthLastChild: /nth-last-child\(.+\)$/,
		nthOfType: /nth-of-type\(.+\)$/,
		nthLastOfType: /nth-last-of-type\(.+\)$/,
		firstChild: /first-child$/,
		lastChild: /last-child$/,
		firstOfType: /first-of-type$/,
		lastOfType: /last-of-type$/,
		onlyChild: /only-child$/,
		onlyOfType: /only-of-type$/,
		contains : /contains\(.+\)$/,
		empty: /empty$/,
		not : /not\(.+\)$/
	};

	var CORE_CONFIG = {}, head = doc.getElementsByTagName('head')[0], pi = win.parseInt, pf = win.parseFloat;

	// 定義済みのFL_CONFIGをチェック後、データの取り込み
	if (typeof FL_CONFIG != 'object') {return alert('undefined FL_CONFIG Object!');}
	for (var i in FL_CONFIG) {
		if (!i.isPrototypeOf(FL_CONFIG)) {
			CORE_CONFIG[i] = FL_CONFIG[i];
		}
	}

	// CIから書き出した場合、オブジェクト指定も文字列となってビルドされる。（現状、cookieDomainのみ）
	// ここで正規化しておく
	if (CORE_CONFIG.cookieDomain === 'document.domain') {
		CORE_CONFIG.cookieDomain = doc.domain;
	}
	// グローバルラインのFL_CONFIGを削除
	try {delete win.FL_CONFIG; }
	catch(e) {win.FL_CONFIG = undefined;}

	if (CORE_CONFIG.debugMode === true) {
		// check confrict of other libraries.
		var confricts = [], g, gn = CORE_CONFIG.globalNames;
		for (var N in gn) {
			if (win[gn[N]]) {confricts.push(g);}
		}
		if (confricts.length > 0) {
			if (!confirm('Globalnames [' + confricts.join(',') + '] is confrict!\nThis script keep running?')) {
				return;
			}
		}
	}

	// siteUrlの値が空の場合は自身のパスからビルドする
	if (!CORE_CONFIG.siteUrl || CORE_CONFIG.siteUrl === '') {
		(function() {
			var sc = doc.getElementsByTagName('head')[0].getElementsByTagName('script'), i = 0,
				len = sc.length, reg = /flint.*\.js$/, ap = CORE_CONFIG.scriptPath;

			for (; i < len; i++) {
				if (reg.test(sc[i].src)) {
					CORE_CONFIG.siteUrl = sc[i].src.substring(0, sc[i].src.lastIndexOf(ap + 'flint'));
					break;
				}
			}
		})();
	}

	// プロトコルチェックと使用URIの設定
	var ssl = (location.protocol == 'https'), loc,
		sslU = CORE_CONFIG.ssl_siteUrl.replace(/index\.php\/?/, ''),
		stU = CORE_CONFIG.siteUrl.replace(/index\.php\/?/, '');
	SYSTEM.SSL_CONNECT = ssl;
	CORE_CONFIG.BASE_URL = ((ssl) ? sslU : stU);
	CORE_CONFIG.APPPATH = ((ssl) ? sslU : stU) + CORE_CONFIG.scriptPath;
	loc = CORE_CONFIG.SITE_URL = (ssl) ? CORE_CONFIG.ssl_siteUrl : CORE_CONFIG.siteUrl;
	if (!/.+\/$/.test(CORE_CONFIG.SITE_URL)) { CORE_CONFIG.SITE_URL += '/';}
//	// アクセスURIとbaseUrlの整合性チェック。外部からのインクルードは禁止する
//	if (SYSTEM.ACCESS_URI.indexOf(loc) === -1) {
//		return alert('this script banned external load!' );
//	}

	// window.evalの禁止 - 内部変数に移動する
	SYSTEM.GLOBAL_EVAL = win.eval;
	if (CORE_CONFIG.disableEval) {
		win.eval = function(){alert('eval function has deleted on system.');};
	}

	// コアオブジェクト定義
	var Core = {};
	Core.modules = {};
	Core.helpers = {}; // no use?

	// Core.alias - オブジェクトに参照aliasを貼る
	Core.alias = function(name/*name*/, prop/*property*/, attachObj/*alias to*/) {
		(attachObj || win)[name] = prop;
	};

	// Core.union - オブジェクトの合成
	Core.union = function(from, to, publicOnly) {
		for (var i in to) {
			if (!publicOnly) { from[i] = to[i];}
			else {
				if (!/^[_]/.test(i)) {from[i] = to[i];}
			}
		}
		return from;
	};


	// Core.Class - プロトタイプベースのクラスを生成
	Core.Class = function(fn) {
		var func = function(){
			if (this.__construct) {this.__construct.apply(this, arguments);}
		};
		if (fn) { func.prototype = new fn(); }
		return func;
	};

	// Core.config - 設定情報を取得。不用意な書き換えを防ぐためgetterのみ定義
	Core.config = {
		siteUrl : function(mode) {
			if (mode && mode === 'all') {return SYSTEM.ACCESS_URI;}
			var m = mode || '';
			return CORE_CONFIG.SITE_URL + ((ut.isArray(m)) ? m.join('/') : m);
		},
		baseUrl : function() { return CORE_CONFIG.BASE_URL;},
		appPath : function() {return CORE_CONFIG.APPPATH;},
		item : function(name) {return (name in CORE_CONFIG) ? CORE_CONFIG[name] : null;},
		isDebug : function() {return CORE_CONFIG.debugMode;},
		getGlobal : function(name) {
			var G = CORE_CONFIG.globalNames;
			if (!name) {
				return { Controller : (CORE_CONFIG.routingMode === 'segment') ? '' : G.Controller,
							DOM : G.DOM, Animation : G.Animation, Helper : (G.helper === '') ? win : G.Helper, Module : (G.Module === '') ? win : G.Module};
			} else {
				if (G.hasOwnProperty(name)) {
					if (name === 'Helper') {return (G[name] != '') ? win[G[name]] : win;}
					else {return win[G[name]]; }
				}
			}
		},
		setItem : function(name, val) {
			CORE_CONFIG[name] = val;
		},
		toString : function() { return '[class Config]';}
	};

	// Core.ua - userAgent情報とレンダリングモード保持クラス
	Core.ua = (function(o){
		var u = ua;
		function parse(match,n, m) {return parseFloat(match[n] +'.' + ((!m) ? 0 : match[m]));}
		function has(str) { return (u.indexOf(str) !== -1);}
		//o.IE = (u.indexOf('msie') !== -1 && !window.opera) ? true : false;
		o.agent = u;
		o.IE = has('msie');
		o.IEV = (!o.IE) ? null : parse(u.match(/(.*?)msie ([0-9])\.([0-9])/), 2, 3);
		o.IE6 = (o.IEV >= 6 && o.IEV < 7);
		o.IE7 = (o.IEV >= 7 && o.IEV < 8);
		o.IE8 = (o.IEV >= 8 && o.IEV < 9);
		o.IE9 = (o.IEV >= 9 && o.IEV < 10);
		o.IE8S = (o.IE8 && typeof doc.documentMode != 'undefined' && doc.documentMode === 8);
		o.Firefox = o.gecko =has('gecko') && !has('khtml');
		o.webkit = has('webkit');
		o.Safari = has('safari') && has('applewebkit') > 0 && !has('chrome', u);
		o.Opera = has('opera') && window.opera;
		o.GoogleChrome = has('chrome', u);
		o.Lunascape = has('lunascape');
		o.Sleipnir = has('sleipnir');
		o.Windows = has('windows');
		o.Mac = has('mac');
		o.Linux = has('linux');
		// ブラウザバージョン
		o.FirefoxV = (!o.Firefox) ? null : parseFloat(u.replace(/(.*?)firefox\/([0-9])\.([0-9])(.*?)/, '$2.$3'));
		o.OperaV = (!o.Opera) ? null :parse(u.match(/(.*?)opera[\/|\s]([0-9])\.([0-9])(.*?)/), 2, 3);
		o.GoogleChromeV = (!o.GoogleChrome) ? null : parseFloat(u.replace(/(.*?)chrome\/([0-9])\.([0-9])(.*?)/, '$2.$3'));
		var sfV = (!o.Safari) ? null : u.replace(/(.*?)applewebkit\/([0-9]*?)\.(.*?)/, '$2').substring(0, 2);
		o.SafariV = (sfV === null) ? null : (parseInt(sfV, 10) > 52) ? u.replace(/(.*?)version\/([0-9])\.([0-9]).*/, '$2.$3')
				: (sfV == '41') ? '2.0' : (sfV == '31') ? '1.3' : (sfV == '12') ? '1.2' : (sfV == '10') ? '1.1' : (sfV == '85') ? '1.0' : '0';
		if (CORE_CONFIG.useMobileAgent) {
			// ゲーム機のuserAgenet
			o.Wii = has('nintendo wii');
			o.GameBoy = has('gameboy');
			o.NintentdoDS = has('nitro');
			o.PSP = has('psp');
			o.PlayStation2 = has('ps2') && has('bb navigator');
			o.PlayStation3 = has('playstation 3');
			// PDAのuserAgent
			o.iPod = has('ipod');
			o.iPnone = has('iphone');
			o.iPhone3G = o.iPhone && has('applewebkit/525');
		}
		// レンダリングモード
		o.Standard = (doc.compatMode == 'CSS1Compat');
		var map = { 'I' : 'IE', 'I6' : 'IE6', 'I7' : 'IE7', 'I8' : 'IE8', 'I8S' : 'IE8S', 'F' : 'Firefox', 'S' : 'Safari', 'C' : 'GoogleChrome',
				'O' : 'Opera', 'L' : 'Lunascape', 'SL' :'Sleipnir', 'W' : 'Wii', 'GB' : 'GameBoy', 'DS' : 'NintentdoDS',
				'PSP' : 'PSP', 'PS2' : 'PlayStation2', 'PS3' : 'PlayStation3', 'i' : 'iPod', 'ip' : 'iPhone', 'ip3' : 'iPhone3G'};
		// o.is - 複数のuserAgent判定を行える関数
		// @params  [|]で区切ったuserAgentの頭文字（但しIEはI7のようにバージョン指定できるものとする）
		o.is = function(reg) {
			var uas = reg.split('|'), uaslen = uas.length, i = 0;
			for (i; i < uaslen; i++) {
				if (uas[i] in map && o[map[uas[i]]] === true) { return true; }
			}
			return false;
		};
		o.__positionKey = false;
		// Flash version判定 - 現行バージョン6までを取得
		// __flashVer - Array
		o.__flashVer = (function() {
			var v = [0, 0, 0], vn, m, n = navigator, AX, mmt = 'application/x-shockwave-flash', pl,
					AC7 = 'ShockwaveFlash.ShockwaveFlash.7', AC6 = 'ShockwaveFlash.ShockwaveFlash.6';
			// other IE
			if (n.plugins && n.mimeTypes[mmt]) {
				pl = n.mimeTypes[mmt].enabledPlugin;
				if (pl && pl.description) {
					m = pl.description.match(/([0-9]+)\.([0-9])\s?[r|d]([0-9]+)$/);
					if (m) {
						v = [m[1], m[2], m[3]];
					}
				}
			} else { // Windows IE
				try { // version 7+ try
					AX = new ActiveXObject(AC7);
					vn = AX.GetVariable("$version");
				} catch (e) {
					try { // version 6 try
						AX = new ActiveXObject(AC6);
						vn = 'WIN 6,0,21,0';
						AX.AllowScriptAccess = 'always';
						vn = AX.GetVariable("$version");
					} catch (e) { vn = null; }
				}
				if (vn) {
					v = vn.replace(/^WIN /, '').split(',');
					v.splice(3, 1);
				}
			}
			return v;
		})();
		// flashVer - String with dot
		o.flashVer = o.__flashVer.join('.');
		// get formatted Flash Version
		o.getFlashVer = function(ver) {
			var f = o.__flashVer;
			switch (ver) {
			case 'm': // major
				return  pi(f[0], 10);
			case 'mm': // major + minor
				return pf(f[0] + '.' + f[1]);
			case 'mmr': // major + minor + release
				return o.flashVer;
			}
		};
		o.toString = function() { return '[class UserAgent]';};
		return o;
	})({}); // -- end Core.ua

	// Core.zIndexer - ドキュメントのzIndexの値を管理（configによりインスタンス化を選択）
	Core.__zIndexer = function() {
		(function() {
			var zIndexValue, scz = SYSTEM.CURRENT_ZINDEX;
			DOM.tag('*', doc.body).foreach(function() {
				zIndexValue = DOM(this).readStyle('zIndex');
				if (!isNaN(parseInt(zIndexValue, 10)) && zIndexValue >scz) {scz = zIndexValue;}
			});
		})();
		var zc = {
			getCurrentIndex : function() {return scz;},
			getNextHigherIndex : function() {return ++scz;},
			setHighestIndex : function(e) {e.style.zIndex = ++scz;},
			toString : function() { return '[class ZIndexer]';}
		};
		Core.zIndexer = Core.baseController.prototype.zIndexer = zc;
	};

	// Core.json - JSONを取り扱うクラス
	// @see http://www.json.org/json2.js
	// @see JavaScript: The Good Parts
	var json = {}; // alias
	Core.JSON = json =  win.JSON || {
//		cx : /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		esc : /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
		meta : { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'},
		gap : null, ind : null, rep : null,
		parse : (function(str, rev) {
			var pointer = 0, ch, esc = {'"' : '"', '\\': '\\', '/' : '/', b : 'b', f : 'f', n : 'n', r : 'r', t : 't'}, text,
				pi = win.parseInt, SF = String.fromCharCode, value;
			var next = function(c) {
				if(c && c !== ch) {
					throw Error("Expected '" + c + "' instead of '" + ch + "'");
				}
				ch = text.charAt(pointer);
				pointer += 1;
				return ch;
			};
			var num = function() {
				var number, string = '';
				if(ch === '-') {
					string = '-'; next('-');
				}
				while(ch >= '0' && ch <= '9'){
					string += ch;
					next();
				}
				if(ch === '.') {
					string += '.';
					while(next() && ch >= '0' && ch <= '9'){ string += ch; }
				}
				if(ch === 'e' || ch === 'E') {
					string += ch;
					next();
					if(ch === '-' || ch === '+') {
						string += ch;
						next();
					}
					while(ch >= '0' && ch <= '9') {
						string += ch;
						next();
					}
				}
				number += string;
				if(isNaN(number)){
					throw Error("illegal Number");
				} else {
					return number;
				}
			};

			var string = function() {
				var hex, i, string = '';
				var uffff;
				if(ch === '"') {
					while(next()) {
						if(ch === '"') {
							next();
							return string;
						} else if(ch === '\\') {
							next();
							if(ch === 'u') {
								uffff = 0;
								for(i = 0; i < 4; i++){
									hex = pi(next(), 16);
									if(!isFinite(hex)){ break; }
									uffff = uffff * 16 + hex;
								}
								string += SF(uffff);
							} else if(typeof esc[ch] === 'string') {
								string += esc[ch];
							} else { break; }
						} else{ string += ch; }
					}
				}
				throw Error("illegal string");
			};

			var white = function() {
				while(ch && ch <= ' '){ next(); }
			};

			var word = function() {
				switch(ch){
					case 't':
						next('t');
						next('r');
						next('u');
						next('e');
						return true;
					case 'f':
						next('f');
						next('a');
						next('l');
						next('s');
						next('e');
						return false;
					case 'n':
						next('n');
						next('u');
						next('l');
						next('l');
						return null;
				}
				throw Error("Unexpected '" + ch + "'");
			};

			var array = function() {
				var array = [];
				if(ch === '[') {
					next('[');
					white();
					if(ch === ']') {
						next(']');
						return array;
					}
					while(ch) {
						array.push(value());
						white();
						if(ch === ']') {
							next(']');
							return array;
						}
						next(',');
						white();
					}
				}
				throw Error("illegal array");
			};

			var object = function() {
				var key, obj = {};
				if(ch === '{') {
					next('{');
					white();
					if(ch === '}') {
						next('}');
						return obj;
					}
					while(ch) {
						key = string();
						white();
						next(':');
						obj[key] = value();
						white();
						if(ch === '}'){
							next('}');
							return obj;
						}
						next(',');
						white();
					}
				}
				throw Error("illegal object");
			};

			var value = function() {
				white();
				switch(ch){
					case '{': return object();
					case '[': return array();
					case '"': return string();
					case '-': return number();
					default:  return (ch >= '0' && ch <= '9') ? number() : word();
				}
			};

			return function(source, reviver){
				var result;
				text = source;
				at = 0;
				ch = ' ';
				result = value();
				white();
				if(ch){
					throw Error("Syntax error");
				}
				return typeof reviver === 'function' ? json.__aryWalk({'' : result}, '', reviver) : result;
			};
		})(),
				parse : function(str) { return eval('(' + str + ')');},
		stringify : function(value, rep, sp) {
			var i;
			json.gap = ''; json.ind = '';
			if (ut.isNumber(sp)) {
				for (i = 0; i < sp; i++) { json.ind += ' ';}
			} else if (ut.isString(sp)) {
				json.ind = sp;
			}
			json.rep = rep;
			if (rep && !ut.isFunction(rep) && (!ut.isObject(rep) || !ut.isNumber(rep.length))) {throw new TypeError('Core.JSON.stringify');}
			return json.__strstr('', {'' : value});
		},
		// @private
		__aryWalk : function(obj, key, rev) {
			var k, v, val = obj[key];
			if (val && ut.isObject(val)) {
				for (k in val) {
					if (Object.hasOwnProperty.call(val, k)) {
						v = json.__aryWalk(val, k);
						if (ut.isset(v)) { val[k] = v;} else { delete val[k];}
					}
				}
			}
			return rev.call(obj, key, val);
		},
		__q : function(str) {
			var esc = json.esc, m = json.meta;
			esc.lastIndex = 0;
			return esc.test(str) ? '"' + str.replace(esc, function(s){
				return (ut.isString(m[s])) ? m[s] : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
			}) + '"' : '"' + str + '"';
		},
		__strstr : function(key, obj) {
			var i, k ,v, len, m = json.gap, pat = [], val = obj[key], rep = json.rep, isF = window.isFinite;
			//if (val && ut.isObject(val)) val = val.toString(); // TODO:builtin.prototype.toJSONは実装すべきか検討中
			if (ut.isFunction(rep)) {val = rep.call(obj, key, val);}
			if (ut.isString(val)) {return json.__q(val);}
			else if (ut.isNumber(val)) {return isF(val) ? String(val) : 'nul';}
			else if (ut.isBool(val) || ut.isNull(val)){ return String(val);}
			else if (ut.isArray(val)) { // array
				if (!val) {return 'null';}
				json.gap += json.ind;
				len = val.length;
				for (i = 0; i < len; i++) {pat[i] = json.__strstr(i, val) || 'null';}
				v = (pat.length === 0) ? '[]' :
					json.gap ? '[\n' + json.gap + pat.join(',\n' + json.gap) + '\n' + m + ']' :
						'[' + pat.join(',') + ']';
				json.gap = m;
				return v;
			} else { // object
				if (!val) {return 'null';}
				json.gap += json.ind;
				if (rep && ut.isObject(rep)) {
					len = rep.length;
					for (i = 0; i < len; i++) {
						k = rep[i];
						if (ut.isString(k)) {
							v = json.__strstr(k, val);
							if (v) {pat.push(json.__q(k) + (json.gap ? ': ' : ':') + v);}
						}
					}
				} else {
					for (k in val) {
						if (Object.hasOwnProperty.call(val, k)) {
							v = json.__strstr(k, val);
							if (v) {pat.push(json.__q(k) + (json.gap ? ': ' : ':') + v);}
						}
					}
				}
				v = (pat.lnegth === 0) ? '{}' :
					json.gap ? '{\n' + json.gap + pat.join(',\n' + json.gap) + '\n' + m + '}' : '{' + pat.join(',') + '}';
				json.gap = m;
				return v;
			}
		},
		toString : function() { return '[class JSON]';}
	};

	// Core.benchMark - ベンチマーククラス
	Core.benchMark = {
		start : function(name) {
			STACK.BENCH_MARKS[name || 'default'] = +new Date();
			SYSTEM.BENCH_MARKS[name || 'default'] = 'running...';
		},
		end : function(name, bool) {
			var s = STACK.BENCH_MARKS[name || 'default'], e = +new Date();
			SYSTEM.BENCH_MARKS[name || 'default'] = e - s + 'ms';
			return bool ? (e - s) : alert('benchMarks "' + (name || '') + ' " runs ' + (e - s) + ' ms.');
		},
		toString : function(){ return '[class BenchMark]';}
	};

	// Core.ready - ライブラリ使用準備完了後に実行する関数をキューに積む
	Core.ready = function(apiName, fn) {
		var ar = STACK.API_READY, arf = STACK.API_READY_FUNC;

		if (ar[apiName] === true || ut.isObject(SYSTEM.CONTROLLER[apiName])) {fn.call(SYSTEM.CONTROLLER);}
		else {
			if (arf[apiName]) {
				arf[apiName].push(function() {fn.call(SYSTEM.CONTROLLER);});
			} else {
				arf[apiName] = [function() {fn.call(SYSTEM.CONTROLLER);}];
			}
		}
	};
	var ut; // alias
	// Core.utility - クロスブラウザで様々な値を取得できるクラス
	Core.utility = ut = {
		// Core.utility.getAbsPosition - 要素の絶対位置を取得
		getAbsPosition : function(e) {
			var pi = win.parseInt, mr = Math.round;
			if (DOM(e).readStyle('position') === 'fixed' || (Core.ua.__positionKey && e.__isFixed === SYSTEM.POSITION_FIXED)) { // case position : fixed
				var t = e.style.top, l = e.style.left;
				if (t == 'auto' || t == '') { t = e.offsetTop;}
				else if (t.indexOf('%') > -1) {t = mr(screen.availHeight * pi(t) / 100);}
				else {t = pi(t);}
				if (l == 'auto' || l == '') {l = e.offsetLeft;}
				else if (l.indexOf('%') > -1) {l = mr(screen.availHeight * pi(l) / 100);}
				else {l = pi(l);}
				return {x : l, y : t};
			}
			var p, sc;
			if (e.getBoundingClientRect) { // IE6+
				p = e.getBoundingClientRect(); sc = ut.getScrollPosition();
				var ct = (Core.ua.__positionKey) ? IEFIX.__defaultMarginTop : 0, cl = (Core.ua.__positionKey) ? IEFIX.__defaultMarginLeft : 0;
				return { x : mr(p.left + sc.x - cl), y : mr(p.top + sc.y - ct) };
			}
			// getBoundingClientRectが未サポートの場合、手動で絶対位置を計算
			p = { x : 0, y : 0 };
			var getStyle = function(elm, cameledProp, prop) {
				if (elm.currentStyle) {
					switch (elm.currentStyle[camledProp]) {
						case 'thin' : return 0;
						case 'medium' : return 0;
						case 'thick' : return 0;
						default : return elm.currentStyle[cameledProp];
					}
				} else if (win.getComputedStyle || (doc.defaultView && doc.defaultView.getComputedStyle)) {
					var gCS = win.getComputedStyle || doc.defaultView.getComputedStyle;
					var nowStyle = gCS(elm, '');
					return nowStyle.getPropertyValue(prop);
				}
			};
			while (e) {
				p.x += e.offsetLeft;
				p.y += e.offsetTop;
				e = e.offsetParent;
				if (e && Core.ua.IE) {
					p.x += (pi(getStyle(e, 'borderLeftWidth', 'border-left-width'), 10) || 0);
					p.y += (pi(getStyle(e, 'borderTopWdth', 'border-top-width'), 10) || 0);
				}
			}
			if (Core.ua.Firefox) {
				var bd = doc.body;
				p.x += 2 * (pi(getStyle(bd, 'borderLeftWidth', 'border-left-width'), 10) || 0);
				p.y += 2 * (pi(getStyle(bd, 'borderTopWidth', 'border-top-width'), 10) || 0);
			}
			return p;
		},
		// Core.utility.getScrollPosition - 現在のスクロール量を取得
		getScrollPosition : function() {
			var isFix = (Core.ua.__positionKey && win.IEFIX && win.IEFIX.html), b = doc.body, h = doc.documentElement;
			return {
				x : (!isFix) ? b.scrollLeft || h.scrollLeft || 0 : win.IEFIX.body.scrollLeft,
				y : (!isFix) ? b.scrollTop || h.scrollTop || 0 :win.IEFIX.body.scrollTop
			};
		},
		// Core.utlity.getPageSize - コンテンツの最大幅を取得
		getPageSize : function() {
			var b = doc.body, h = doc.documentElement;
			return {
				width : Math.max(b.innerWidth || 0, b.clientWidth || 0, b.scrollWidth || 0, h.clinetWidth || 0, h.scrollWidth || 0),
				height : Math.max(b.innerHeight || 0, b.clientHeight || 0, b.scrollHeight || 0, h.clinetHeight || 0, h.scrollHeight || 0)
			};
		},
		// Core.utility.getContentSize - ウインドウ表示領域を取得
		getContentSize : function() {
			var b = doc.body, h = doc.documentElement,
			obj = {
				width : win.innerWidth || (Core.ua.Standard) ? h.clientWidth : b.clientWidth,
				height : win.innerHeight || (Core.ua.Standard) ? h.clientHeight : b.clientHeight
			};
			return obj;
		},
		// Core.utility.getCenterPosition - ウインドウ表示領域中心点を取得
		// @param bool current
		// current === trueの場合、スクロール量を加味した絶対位置を取得する
		getCenterPosition : function(current) {
			var size = this.getContentSize(), sc = this.getScrollPosition();
			return { x : size.width / 2 + (current ? sc.x : 0), y : size.height / 2 + (current ? sc.y : 0)};
		},
		// Core.utility.getPixel - 各単位をpxに変換
		getPixel : function(unit) {
			if (/^[^0-9]$/.test(unit)) {return 0;}
			var d = doc.createElement('div'), ret = {}, val = parseFloat(unit);
			d.style.visibility = 'hidden';
			d.style.position = 'absolute';
			d.style.top = '0px';
			d.style.left = '0px';
			doc.body.appendChild(d);
			d.style.width = '10pt';
			ret.pt = d.offsetWidth / 10;
			d.style.width = '10em';
			ret.em = d.offsetWidth / 10;
			doc.body.removeChild(d);
			if (unit.indexOf('px') !== -1) {return val;}
			else if (unit.indexOf('em') !== -1) {return ret.em * val;}
			else if (unit.indexOf('pt') !== -1) {return ret.pt * val;}
			return val;
		},
		// Core.utility.getTextSize - テキストを表示させた時の幅を取得する
		getTextSize : function(txt, additional) {
			var d = doc.createElement('span'), res = {};
			d.style.fontSize = additional || 'inherit';
			d.appendChild(doc.createTextNode(txt));
			doc.body.appendChild(d);
			res.width = d.offsetWidth;
			res.height = d.ofsetHeight;
			doc.body.removeChild(d);
			return res;
		},
		// Core.utiliy.inRect - 要素1が要素2の中に入っているかどうかをチェック
		inRect : function(elm1, elm2) {
			var fd = DOM(elm1).absDimension(), td = DOM(elm2).absDimension();
			return (fd.top > td.top && fd.left > td.left && fd.bottom < td.bottom && fd.right < td.right);
		},
		// Core.utility.inRectPiece - 要素1が要素2の一部分に入っているかどうかをチェック
		inRectPiece : function(elm1, elm2) {
			var fd = DOM(elm1).absDimension(), td = DOM(elm2).absDimension();
			return !(fd.bottom < td.top || fd.top > td.bottom || fd.right < td.left || fd.left > td.right);
		},
		// Core.utility.inRectHalfVertical - 要素1が要素2の一部分に入っている場合、上半分か下半分かをチェック（Modules.ui.sortableに使用）
		inRectHalfVertical : function(elm1, elm2) {
			if (Core.utility.inRectPiece(elm1, elm2) === false) {return false;}
			var fd = DOM(elm1).absDimension(), td = DOM(elm2).absDimension();
			if ((fd.bottom >= td.top && fd.bottom <= td.bottom - (td.height / 2)) && ((fd.left >= td.left && fd.left <= td.right) || (fd.right >= td.left && fd.right <= td.right))) {
				return 'T';
			} else if ((fd.top >= td.top + (td.height / 2) && fd.top <= td.bottom) && ((fd.left >= td.left && fd.left <= td.right) || (fd.right >= td.left && fd.right <= td.right))) {
				return 'B';
			}
			return false;
		},
		// Core.utility.inRectParallel - 要素1が要素2の一部分に入っている場合、左半分か右半分かをチェック（Modules.ui.sortableに使用）
		inRectHalfParallel : function(elm1, elm2) {
			if (Core.utility.inRectPiece(elm1, elm2) === false) {return false;}
			var f = DOM(elm1), t = DOM(elm2);
			var fd = f.absDimension(), td = t.absDimension();
			if ((fd.left >= td.left + (td.width / 2) && fd.left <= td.right) && ((fd.top >= td.top && fd.top <= td.bottom) || (fd.bottom >= td.top && fd.bottom <= td.bottom))) {
				return 'L';
			} else if ((fd.right >= td.left && fd.right <= td.left + (td.width / 2)) &&  ((fd.top >= td.top && fd.top <= td.bottom) || (fd.bottom >= td.top && fd.bottom <= td.bottom))) {
				return 'R';
			}
			return false;
		},
		// Core.utility.mouseInRect - マウス座標が要素の中に入ったかどうかをチェック
		mouseInRect : function(mouse, elm) {
			var ed = DOM(elm).absDimension();
			return (mouse.x >= ed.left && mouse.x <= ed.right && mouse.y >= ed.top && mouse.y <= ed.bottom);
		},
		// Core.utility.mouseInRectHalfVertical - マウス座標が要素の一部分に入っている場合、上半分か下半分かをチェック
		mouseInRectHalfVertical : function(mouse, elm) {
			if (!Core.utility.mouseInRect(mouse, elm)) { return false;}
			var td = DOM(elm).absDimension();
			if ((mouse.y >= td.top && mouse.y < td.top + (td.height / 2)) && (mouse.x >= td.left && mouse.x <= td.right)) {
				return 'T';
			} else if ((mouse.y >= td.top + (td.height / 2) && mouse.y <= td.bottom) && (mouse.x >= td.left && mouse.x <= td.right)) {
				return 'B';
			}
			return false;
		},
		// Core.utility.mouseInRectHalfParallel- マウス座標が要素の一部分に入っている場合、左半分か右半分かをチェック
		mouseInRectHalfParallel : function(mouse, elm) {
			if (!Core.utility.mouseInRect(mouse, elm)) { return false;}
			var td = DOM(elm).absDimension();
			if ((mouse.x >= td.left && mouse.x < td.left + (td.width / 2)) && (mouse.y >= td.top && mouse.y <= td.bottom)) {
				return 'L';
			} else if ((mouse.x >= td.left + (td.width / 2) && mouse.x <= td.right) && (mouse.y >= td.top && mouse.y <= td.bottom)) {
				return 'R';
			}
			return false;
		},
		// Core.utility.__is - nullでなくundefinedでないか判定
		__is : function(o) {
			return (o === null || typeof o == 'undefined');
		},
		// Core.utility.isString - Stringオブジェクトであるかを判定
		isString : function(o) {
			return (ut.__is(o) === false && typeof o == 'string');
		},
		// Core.utlity.isNumber - Numberオブジェクトであるかを判定
		isNumber : function(o) {
			return (ut.__is(o) === false && typeof o == 'number');
		},
		// Core.utility.isFunction - Functionオブジェクトであるかを判定
		isFunction : function(o) {
			return (ut.__is(o) === false && typeof o == 'function');
		},
		// Core.utility.isArray - Arrayオブジェクトであるかを判定
		isArray : function(o) {
			return (ut.__is(o) === false && typeof o == 'object' && o.constructor === Array);
		},
		// Core.utility.isObject - Objectオブジェクトであるかを判定
		isObject : function(o) {
			return (ut.__is(o) === false && typeof o == 'object' && o.constructor === Object);
		},
		// Core.utility.isBool - 真偽オブジェクトであるかを判定
		isBool : function(o) {
			return (ut.__is(o) === false && typeof o == 'boolean');
		},
		// Core.utility.isset - 変数が未定義かどうか判定
		isset : function(v) {
			return (typeof v == 'undefined');
		},
		// Core.utility.isNull - nullがどうか判定
		isNull : function(v) {
			return (v === null);
		},
		// Core.utility.rgbToHex - rgbをhexに変換
		rgbToHex : function(rgb) {
			var t = sf.trim(rgb);
			if (/^rgb/.test(t) === false) { return rgb; }
			var m = rgb.match(/rgb\(([0-9]+),\s?([0-9]+).\s?([0-9]+)\)/), p = win.parseInt, i = 1, h, ret = ['#'];
			if (p(m[1], 10) > 255 || p(m[2], 10) > 255 || p(m[3], 10) > 255) {
				throw Error('can\'t convert RGB to Hex.');
			}
			for (i; i < 4; i++) {
				h = p(m[i], 10).toString(16);
				ret.push((h.length === 1) ? '0' + h : h);
			}
			return ret.join('');
		},
		// Core.utility.hexToRgb - Hexをrgbに変換
		hexToRgb : function(hex) {
			var t = sf.trim(hex), m, p = win.parseInt, ret = hex;
			if (/^#[0-9a-fA-F]{6}$/.test(t)) {
				m = t.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
				ret = 'rgb(' + p(m[1], 16).toString() + ',' + p(m[2], 16).toString() + ',' + p(m[3], 16).toString() + ')';
			} else if (/^#[0-9a-fA-F]{3}/.test(t)) {
				m = t.match(/^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/);
				ret = 'rgb(' + p(m[1] + m[1], 16).toString() + ',' + p(m[2] +m[2], 16).toString() + ',' + p(m[3] + m[3], 16).toString() + ')';
			}
			return ret;
		},
		// Core.utility.pythagorean - 三平方の定理で斜辺を返す
		pythagorean : function(r1, r2, bool /* round? */) {
			var r = Math.sqrt(Math.pow(r1, 2) + Math.pow(r2, 2));
			return (bool) ? Math.round(r) : r;
		},
		// Core.utility.makeFilter - IE用にfilter Stringを生成して返却
		makeFilter : function(type, value, ext) {
			switch (type) {
			case 'op' : return 'alpha(opacity=' + (value.indexOf('.') !== -1) ? value * 100 : value + ')';
			case 'png' : return 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src=' + value + ', sizingMethod=' + ((ext) ? ext : 'scale') + ')';
			default : return '';
			}
		},
		// Core.utility.grep - 文字列が特定の文字列を持つかどうかを判定- String.indexOfとRegExp.testのショートカット
		grep : function(str, has) {
			if (!ut.isString(str) || !has) {throw TypeError('invalid arguments of utility.grep function');}
			if (typeof has === 'string') { return (str.indexOf(has) !== -1);} // String
			else if (has.constructor === RegExp) { return has.test(str);} // RegExp
			return false;
		},
		// getBorderSize - [thin], [medium], [thick]を含めてpxでサイズ取得
		getBorderSize : function(elm) {
			var pi = win.parseInt, e = DOM(e);
				btw = e.radStyle('borderTopWidth'), blw = e.readStyle('borderLeftWidth'), bbw = e.readStyle('borderBottomWidth'), brw = e.readStyle('borderRightWidth');

			return {
					top : (btw === 'thin') ? 2 : (btw === 'medium') ? 4 : (btw === 'thick') ? 6 : pi(btw, 10),
					left : (blw === 'thin') ? 2 : (blw === 'medium') ? 4 : (blw === 'thick') ? 6 : pi(blw, 10),
					right : (brw === 'thin') ? 2 : (brw === 'medium') ? 4 : (brw === 'thick') ? 6 : pi(brw, 10),
					bottom : (bbw === 'thin') ? 2 : (bbw === 'medium') ? 4 : (btw === 'thick') ? 6 : pi(bbw, 10)
			};
		},
		// serializeForm - <form>要素内の入力要素を通信パラメータ用のJSONにまとめる
		serializeForm : function(elm) {
			if (!elm.nodeType || elm.tagName.toLowerCase() !== 'form') { throw new Error('utility.serializeForm works <form> element only.');}
			var res = {}, input, inputlen, iptName, iptArr = {}, select, selectlen, textarea, textarealen, chStack = {}, ch = false, e, chName;
			// input elements
			input = elm.getElementsByTagName('input'); inputlen = input.length;
			for (var i = 0; i < inputlen; i++) {
				e = input[i];
				switch (e.type) {
				case 'text':
				case 'hidden':
					if (ut.grep(e.name, '[]')) {
						iptName = e.name.replace('[]', '');
						if (iptName in iptArr) {
							iptArr[iptName].push(e.value);
						} else {
							iptArr[iptName] = [e.value];
						}
					} else {
						res[e.name] = e.value;
					}
					break;
				case 'radio':
					if (e.checked === true) {res[e.name] = e.value;}
					break;
				case 'checkbox':
					if (e.checked === true) {
						ch = true; chName = ut.grep(e.name, '[]') ? e.name.replace('[]', '') : e.name;
						if (chName in chStack) {
							chStack[chName].push(e.value);
						} else {
							chStack[chName] = [e.value];
						}
					}
					break;
				default : break;
				}
			}
			// add checkbox
			if (ch) {
				for (var c in chStack) {
					if (!c.isPrototypeOf(chStack)) {
						res[c] = chStack[c];
					}
				}
			}
			// posted value has array?
			for (var ipt in iptArr) {
				if (! ipt.isPrototypeOf(iptArr)) {
					res[ipt] = iptArr[ipt];
				}
			}
			// select elements
			select = elm.getElementsByTagName('select'); selectlen = select.length;
			for (var j = 0; j < selectlen; j++) {
				var s = select[j].options, sl = s.length;
				for (var k = 0; k < sl; k++) {
					if (s[k].selected === true) {
						if (select[j].multiple) { if (res[select[j].name]) { res[select[j].name].push(s[k].value);} else { res[select[j].name] = s[k].value;}}
						else { res[select[j].name] = s[k].value;}
					}
				}
			}
			// textarea elements
			textarea = elm.getElementsByTagName('textarea'); textarealen = textarea.length;
			for (var m = 0; m < textarealen; m++) {
				res[textarea[m].name] = textarea[m].value;
			}
			return res;
		},
		trim : function(str) { return str.replace(/^\s*(.*?)/, '$1').replace(/(.*?)\s*$/, '$1');},
		br2nl : function(str) { return str.replace(/<br>|<br \/>|<br\/>/g, '\n');},
		nl2br : function(str) { return str.replace(/\r\n/g, '<br />').replace(/\r|\n/g, '<br />');},
		toString : function(){ return '[class Utility]';},
		clean : function(str) { return sf.clean(str); },
		inArray : function(v, arr) {
			var len = arr.length, i = 0;
			for (i; i < len; i++) {
				if (arr[i] === v) { return true; }
			}
			return false;
		},
		//getDefaultWH - 要素のデフォルトサイズを取得する
		getDefaultWH : function(e, mode) {
			var elm = DOM(e),
				dis = elm.readStyle('display'),
				w = elm.readStyle('width'),
				h = elm.readStyle('height'),
				abs;
			elm.addStyle({width : 'auto', height : 'auto', display : 'block'});
			abs = { width : elm.get().offsetWidth, height : elm.get().offsetHeight};
			elm.addStyle({width : w, height : h, display : dis});
			return abs;
		},
		// toURIParams - オブジェクトをURIパラメータ形式に変換
		toURIParams : function(data) {
			if (!this.isObject(data)) {
				throw TypeError('argument must be an Object.');
				return;
			}
			var ret = [], i, enc = win.encodeURIComponent;
			for (i in data) {
				if (i.isPrototypeOf(data)) { continue;}
				ret[enc(i)] = enc(data[i]);
			}
			return ret.join('&=');
		}
	};  // end Core.utility

	var EV = {}; // alias
	var AjaxEventNames = {'AjaxEnd' : 1, 'AjaxComplete' : 1, 'AjaxError' : 1};
	// Core.event - IEも含めたDOM level2イベントモデルを生成
	Core.event = EV ={
		LIVE_LIST : [], LIVE_EVENTS : 'mousemove|mouseout|mouseover|mousedown|mouseup|mousewheel|DOMMouseScroll|click|keydown|keypress|keyup',
		CUSTOM_EVENTS : [], CUSTOMES : [], DRReg : /domready/i,
		// Core.event.set - イベント登録
		set : function(elm, type, listener, bindObj, isOnce /* once event is true */, capture /* event capture */) {
			var bind = (bindObj) ? bindObj : SYSTEM.CONTROLLER, target = (elm instanceof xElement) ? elm.get() : elm;
			//if (!target.__eid) {target.__eid = ++DOM.eid;}
			if (type in AjaxEventNames) {
				STACK.AJAX_EVENTS.push([target, type, listener, bind, isOnce || false]);
				return;
			}
			var  wrapped = this.__createWrap(target, listener, bind, type, isOnce || false, capture || false);
			if (EV.DRReg.test(type)) {
				STACK.DOM_LOADED_FUNCS.push([wrapped, bind]);
			} else if (type === 'load' && (target === win || target === doc)) {
				STACK.LOADED_FUNCS.push([wrapped, bind]);
			} else {this.__set(target, type, wrapped, listener);}
		},
		// Core.event.once - 一度だけ実行するイベントを設定する
		// setメソッドに第５引数を渡すためのシンタックスシュガー
		once : function(target, type, listener, bindObj) {
			this.set(target, type, listener, bindObj, true);
		},
		// Core.event.setCapture - キャプチャイベント監視
		setCapure : function(target, type, listener, bindObj) {
			this.set(target, type, listener, bindObj, false, true);
		},
		// Core.event.custom - カスタムイベント生成
		custom : function(target, type, listener, bindObj) {
			var bind = bindObj || SYSTEM.CONTROLLER, elm = (target instanceof xElement) ? target.get() : target;
			if (!target.__eid) {target.__eid = ++DOM.eid;}
			var wrapped = this.__createWrap(target, listener, bind, type, false);
			if (target.addEventListener) {
				target.addEventListener(type, wrapped, false);
				EV.CUSTOM_EVENTS.push([target, type, listener, wrapped, bind]);
			} else if (target.attachEvent) {
				EV.CUSTOM_EVENTS.push([target, type, listener, wrapped, bind]);
			}
			else { return;}
		},
		// Core.event.removeCustom - カスタムイベント削除
		removeCustom : function(target, type, listener) {
			var c = EV.CUSTOM_EVENTS, len = c.length, i = 0, elm = (target instanceof xElement) ? target.get() : target;
			for (i; i < len; i++) {
				if (!listener) {
					if (c[i][0] === elm && c[i][1] === type) {
						if (elm.removeEventListener) { elm.removeEventListener(type, c[i][3], false); }
						else if (elm.detachEvent) { elm.detachEvent('on' + type, c[i][3]);}
						c.splice(i, 1);
					}
				} else {
					if (c[i][0] === elm && c[i][1] === type && c[i][2] === listener) {
						if (elm.removeEventListener) { elm.removeEventListener(type, c[i][3], false); }
						else if (elm.detachEvent) { elm.detachEvent('on' + type, c[i][3]);}
						c.splice(i, 1);
					}
				}
			}
		},
		// Core.event.fire - イベント発生
		fire : function(target, type, data, dataType) {
			var e, elm = (target instanceof xElement) ? target.get() : target;
			if (doc.createEventObject) { e = doc.createEventObject();}
			else if (doc.createEvent){
				e = doc.createEvent('Events');
				e.initEvent(type, true, true);
			} else { throw new Error('don\'t supports custom Event in this Browser');}
			e.dataType =dataType;
			e.data = data;
			if (elm.dispatchEvent) { elm.dispatchEvent(e); }
			else if (elm.fireEvent) {
				// IEは未定義のイベントタイプは例外を投げるようなので、自力で特定し、ディスパッチ
				var c = EV.CUSTOM_EVENTS, len = c.length, i = 0; e.type = type;
				for (i; i < len; i++) {
					if (c[i][1] === type) { c[i][2].call(c[i][3], new Core.event.__margeDOM2Event(c[i][0], e)); }
				}
			}
		},
		// Core.event.live - 動的イベントハンドリング
		live : function(elm, type, listener, bindObj) {
			var expr = DOM.__fallbackQuery(elm);
			Core.event.exprLive(expr, type, listener, bindObj || undefined);
		},
		EXPR_LIVE_LIST : [],
		// Core.event.exprLive - CSSセレクタ指定型の動的イベントハンドリング（試験的実装）
		exprLive : function(expr, type, listener, bindObj) {
			if (!ut.grep(EV.LIVE_EVENTS, type)) {return;}
			var bind =bindObj || false, wrapped = this.__createWrapLiveExpr(listener, bind, type, expr);
			this.__set(doc, type, wrapped, listener);
			EV.EXPR_LIVE_LIST.push([type, listener, expr, wrapped]);
		},
		// Core.event.deLive - liveハンドリング削除
		deLive : function(elm, type, listener) {
			var target = (elm instanceof xElement) ? elm.get() : elm;
			var live = EV.LIVE_LIST, len = live.length, i = 0, l;
			for (i; i < len; i++) {
				l = live[i];
				if (l[0] === target && l[1] === type && l[2] === listener) {
					this.__remove([doc, l[1], l[3]], i, live);
				}
			}
		},
		exprdeLive : function(expr, type, listener) {
			var live = EV.EXPR_LIVE_LIST, len = live.length, i= 0;
			for (i; i< len; i++) {
				if (!listener) {
					if (live[i] && live[i][0] === type && live[i][2] === expr) { this.__remove([doc, live[i][0], live[i][3]], i, live);}
				} else {
					if (live[i] && live[i][0] === type && live[i][1] === listener && live[i][2] === expr) { this.__remove([doc, live[i][0], live[i][3]], i, live);}
				}
			}
		},
		// Core.event.remove - イベント削除
		// 第三引数listenerが指定された場合は単一のイベント削除、指定されない場合は要素のイベントタイプに登録されたハンドラを全て削除
		remove : function(target, type, listener) {
			if (type in AjaxEventNames) { this.__removeAjaxEvents(target, type, listener); return;}
			var fns = STACK.EVENT_HANDLERS, fnslen = fns.length, i;
			for (i = fnslen - 1; i >= 0; i--) {
				if (!listener) {
					if (fns[i][0] === target && fns[i][1] === type) { Core.event.__remove(fns[i], i, fns);}
				} else {
					if (fns[i][0] === target && fns[i][1] === type && fns[i][3] === listener) { Core.event.__remove(fns[i], i, fns);}
				}
			}
		},
		// Core.event.__remove - イベント削除実行
		__remove : function(arr, num, marr) {
			if (win.removeEventListener) {arr[0].removeEventListener(arr[1], arr[2], false); }
			else if (win.detachEvent) { arr[0].detachEvent('on' + arr[1], arr[2]); }
			else { target['on' + arr[1]] = null; }
			marr.splice(num, 1);
		},
		// Core.event.__isAlready - イベントがセットされているかどうかチェック
		__isAlready : function(target, type, listener) {
			var fns = STACK.EVENT_HANDLERS, fnslen = fns.length, i;
			for (i = fnslen - 1; i >= 0; i--) {
				if (fns[i][0] === target && fns[i][1] === type && fns[i][3] === listener) { return true;}
			}
			return false;
		},
		//Core.event.createWrap - ラッパー関数生成
		__createWrap : function(target, lis, bind, type, isOnce, capture) {
			return function(ev) {
				var E;
				
				if (isOnce === true) {Core.event.remove(target, type, lis);}
				if (capture && Core.ua.IE) { win.event.useCapture = true; }
				E = new Core.event.__margeDOM2Event(target, ev ||win.event);
				if (lis.call(bind, E) === false) {
					E.preventDefault();
				}
			};
		},
		// Core.event.createWrapLive - live用ラッパー関数生成
		__createWrapLive : function(listener, bindObj, type){
			return function(ev) {
				var e = ev || win.event;
				var elm = e.target || e.srcElement;
				if (Core.ua.webkit && elm.nodeType === 3) {elm = elm.parentNode;}
				if (!elm.__eid) {elm.__eid = ++DOM.cid;}
				var live = EV.LIVE_LIST, len = live.length, i = len - 1, q = DOM.__fallbackQuery(elm);
				for (i; i >= 0; i--) {
					if (live[i][2] === q && live[i][0] === e.type) {
						return live[i][1].call(bindObj || elm, new Core.event.__margeDOM2Event(elm, ev ||win.event));
					}
				}
			};
		},
		// Core.event.createWrapLiveExpr - liveExpr用ラッパー関数生成
		__createWrapLiveExpr : function(listener, bindObj, type, expr){
			return function(ev) {
				var e = ev || win.event;
				var elm = e.target || e.srcElement;
				if (Core.ua.webkit && elm.nodeType === 3) {elm = elm.parentNode;}
				if(!elm.__eid) {elm.__eid = ++DOM.cid;}
				var list = DOM.__getElementsBySelector(expr), len = list.length, i = 0;
				for (i; i < len; i++) {
					if (list[i] === elm) {
						return listener.call(bindObj || elm, new Core.event.__margeDOM2Event(elm, ev ||win.event));
					}
				}
			};
		},
		// Core.event.__set - イベントリスナ設定
		__set : function(target, type, wrap, fn) {
			if (target.addEventListener) {target.addEventListener(type, wrap, false);}
			else if (target.attachEvent) {target.attachEvent('on' + type, wrap);}
			else {target['on' + type] = wrap;}
			STACK.EVENT_HANDLERS.push([target, type, wrap, fn]);
		},
		// Core.event.deleteAllEvent - 全てのイベントを削除
		// IEはリロード後もイベント削除を行わず、メモリリークが発生するケースがあるため、unloadのイベントで全削除を実行させる
		deleteAllEvent : function() {
			var fns = STACK.EVENT_HANDLERS, len = fns.length;
			for (var i = 0; i < len; i++) {
				var t = fns[i][0], e = fns[i][1], f = fns[i][2];
				if (!t || !e || !f) { continue;}
				if (t.removeEventListener) { t.removeEventListener(e, f, false); }
				else if (t.detachEvent) { t.detachEvent('on' + e, f); }
				else { t['on' + e] = null; }
			}
			STACK.EVENT_HANDLERS = [];
		},
		// Core.event.__execDOM - DOMツリー構築完了時のハンドラーを実行（1回のみ）
		// @access private
		__execDOM : function() {
			SYSTEM.DOM_LOADED = true;
			SYSTEM.DOM_CREATE_TIME = (new Date()).getTime() - SYSTEM.INITIAL_TIME;
			STACK.BODY = STACK.HTML = doc.body;
			//if (Core.ua.IE) {win.IEFIX = new Core.__fixIE();}

			// 設定ファイルに基づきautoLoadHelper開始
			if (CORE_CONFIG.autoLoadHelper.length > 0) {
				Controller.load.helper(CORE_CONFIG.autoLoadHelper);
			}
			var h = doc.getElementsByTagName('head')[0];
			// STACKからAPIのロード
			var api = STACK.API_STACK, apilen = api.length, s, css = STACK.CSS_STACK, csslen = css.length, l, a, c;
			if (apilen > 0) {
	//			if (CORE_CONFIG.routingMode === 'segment') {
	//				sf.buildAPI(api);
	//			} else {
					for (a = 0; a < apilen; a++) {
						Core.api.load('script', api[a][0]);
					}
	//			}
			}
			// STACkからCSSのロード
			for (c = 0; c < csslen; c++) {
				Core.api.load('css', css[c][0], css[c][1] || null);
			}
			// STACKからDOMハンドラー実行
			var f = STACK.DOM_LOADED_FUNCS, len2 = f.length;
			for (var j = 0; j < len2; j++) {
				var tmp = new f[j][0]();
				//if (tmp.__construct) { tmp.__construct(); }
			}
			// 全てのシステムの準備が完了したらコントローラの初期メソッド実行
			if (ut.isFunction(SYSTEM.START_CONTROLLER)) {
				SYSTEM.START_CONTROLLER();
			};

		},
		// Core.event.__execLoad - window.onload時のハンドラーを実行（1回のみ）
		__execLoad : function(e) {
			SYSTEM.WINDOW_LOADED = true;
			SYSTEM.WINDOW_LOADED_TIME = (new Date()).getTime() - SYSTEM.INITIAL_TIME;
			var ev = e || new Core.event.__margeDOM2Event(target, win.event);
			// STACKからonloadハンドラー実行
			var f = STACK.LOADED_FUNCS, len = f.length;
			for (var i = 0; i < len; i++) {
				var tmp = new f[i][0](ev);
				//if (tmp.__construct) { tmp.__construct(); }
			}
		},
		// Core.event.__margeDOM2Event - IEのイベントモデルをDOM Level2 Eventモデルでエミュレート
		// @access private
		__margeDOM2Event : function(elm, eObj) {
			// modified at 2010/09/30 IE9はDOMイベントモデルでビルドするように条件変更
			if ((!Core.ua.IE || Core.ua.IE9) &&  !Core.ua.Safari) {return eObj;}
			this.__nativeEV = eObj;
			this.type = eObj.type;
			this.target = (Core.ua.Safari) ? (eObj.target.nodeType === 3) ? eObj.target.parentNode : eObj.target : eObj.srcElement;
			this.currentTarget = elm;
			this.relatedTarget = (Core.ua.Safari) ? eObj.relatedTarget : eObj.toElement;
			this.keyCode = eObj.keyCode;
			this.shiftKey = eObj.shiftKey;
			this.ctrlKey = eObj.ctrlKey;
			this.propertyName = eObj.propertyName || undefined;
			var sc = ut.getScrollPosition();
			this.pageX = eObj.clientX + sc.x;
			this.pageY = eObj.clientY + sc.y;
			this.clientX = eObj.clientX;
			this.clientY = eObj.clientY;
			if (Core.ua.IE) {
				var b = eObj.button;
				this.button = (b == 4) ? 1 : (b == 1) ? 0 : b;
				this.which = (b == 4) ? 2 : (b == 2) ? 3 : b;
				this.stopPropagation = function() {this.__nativeEV.cancelBubble = true;};
				this.preventDefault = function() { this.__nativeEV.returnValue = false;};
			} else {
				this.button = eObj.button;
				this.which = eObj.which;
				this.stopPropagation = function() {eObj.stopPropagation(); };
				this.preventDefault = function() {eObj.preventDefault(); };
			}
		},
		toString : function() { return '[class Event]';}
	};

	// Core.api - API動的ロード
	Core.api ={
		load : function(type, path, att) {
			var ats = (type == 'css');
			var t = doc.createElement((ats) ? 'link' : 'script');
			t.type = (ats) ? 'text/css' : 'text/javascript';
			t[(ats) ? 'href' : 'src'] = path;
			if (ats) {
				if (att) {t.media = att;}
				t.rel = 'stylesheet';
			} else {t.charset = 'UTF-8';}
			head.appendChild(t);
		}
	};

	// Core.Loader - Loaderクラス
	Core.Loader = function(attach) {
		// ロード先を特定させるため、連結先のオブジェクトを内部に持たせる
		this.obj = attach;
		this.at = 'fl' +(++STACK.LOADER_COUNT);
	};
	// Core.Loader.prototype - Loaderクラスのprototype定義
	Core.Loader.prototype = {
		config : function(fn) {
			if (ut.isString(fn) ){
				if (!(fn in STACK.LOADED_API)) {this.__loadAPI(Core.config.appPath() + 'config/' + fn + '.js');}
			}
			return this;
		},
		helper : function(fn) {
			if (Core.utility.isArray(fn)) {
				for (var i = 0; i < fn.length; i++) { arguments.callee.apply(this, [fn[i]]); }
				return this;
			} else if (typeof fn == 'string') {
				var hp = CORE_CONFIG.globalNames.Helper,
					loadName = (fn.indexOf('_helper') > 0) ? fn.slice(0, fn.indexOf('_helper')) : fn + '_helper';

				if (loadName in STACK.LOADED_API) { return; }
				if (hp != '' && !win[hp]) {win[hp] = {};}

					// ヘルパ関数チェックメソッドをグローバルにattach
					if (! win.functionExists) {Core.alias('functionExists', sf.exists);}
					var loadPath = Core.config.appPath() + 'helpers/' + loadName +'.js';
					this.__loadAPI(loadPath, loadName, 'h');

			}
			return this;
		},
		library : function(fn, bindName) {
			this.__lbLoad(fn, bindName || 0, 'libraries/', 'l');
			return this;
		},
		model : function(fn, bindName) {
			this.__lbLoad(fn, bindName || 0, 'models/', 'mo');
			return this;
		},
		__lbLoad : function(fn, b, dir, type) {
			if (ut.isArray(fn)) {
				var len = fn.length;
				for (var i = 0; i < len; i++) {
					arguments.callee.apply(this, [fn[i], b, dir, type]);
				}
			} else if (ut.isString(fn)) {
				if (fn in STACK.LOADED_API) {
					// ロード済みならインスタンス化も行われているはずである
					if (STACK.INSTANCED_API[fn]) {
						this.obj[b || fn] =  STACK.INSTANCED_API[fn];
					}
				} else { this.__loadAPI(Core.config.appPath() + dir + fn + '.js', fn, type, b);}
				STACK.API_READY[fn] = false;
			}

		},
		module : function(fn) {
			if (ut.isArray(fn)) {
				for (var i = 0; i < fn.length; i++) { arguments.callee.apply(this, [fn[i]]); }
				return this;
			} else if (ut.isString(fn)) {
				var m = CORE_CONFIG.globalNames.Module;
				if (!win[m]) {win[m] = Module;}
				if (fn in STACK.LOADED_API) { return; }

				if (Core.modules.hasOwnProperty(fn)) {
					if (!Module[fn]) { Module[fn] = Core.modules[fn];}
					STACK.LOADED_API[fn] = true;
				}
				else { this.__loadAPI(Core.config.appPath() + 'modules/' + fn +'.js', fn, 'm');}
			}
			STACK.MODULE_READY[fn] = false;
			return this;
		},
		css : function(css, media) {
			if (css in STACK.LOADED_CSS) { return; }
			var md = (media) ? media : false;
			this.__loadCSS(Core.config.appPath() + 'fl_css/' + css + '.css', css, md);
			return this;
		},
		ajax : function() {
			if (!this.obj.ajax) {this.obj.ajax = new Core.__AjaxInit(this.obj);}
			return this;
		},
		view : function(path, appendObj, async) {
			// CIの$this->load->viewに近いメソッド。第二引数がオブジェクトの場合、innerHTML実行。
			// XHRを使用するため、非同期処理に制限されるが、同期処理も一応実装しておく。
			if (this.obj.ajax) {this.ajax();}
			var a = async || false, t = DOM(appendObj);
			this.obj.ajax.get(path, {async : a, success : function(resp){
				t.append(resp.responseText);
			}});
		},
		plugin : function(fn) {
			if (ut.isArray(fn)) {
				for (var i = 0; i < fn.length; i++) { arguments.callee.apply(this, [fn[i]]); }
				return this;
			} else if (ut.isString(fn)) {
				if (!(fn in STACK.LOADED_API)) {this.__loadAPI(Core.config.appPath() + 'plugins/' + fn +'.js', fn, 'p');}
			}
			return this;
		},
		// Core.Loader.__loadAPI - APIのロード
		__loadAPI : function(path, name, type, bind) {
			if (type === 'mo' || type === 'l') {
				if (!(name in STACK.ATTACH_API)) {
					STACK.ATTACH_API[name] = [this.obj];
				} else {
					STACK.ATTACH_API[name].push(this.obj);
				}
			}
			STACK.LOADED_API[name] = name;
			// DOMが構築完了していれば<head>にappend
			if (SYSTEM.DOM_LOADED) {Core.api.load('script', path);}
			// IEの場合は即時document.writeでロードしたほうがトータルで早い。理由はキャッシュ？
			//else if (Core.ua.IE) { doc.write('<script type="text\/javascript" src="' + path + '" charset=UTF-8"><\/script>'); }
			// その他のブラウザはレンダリング優先でOK。DOM構築後にまとめて<head>にappend
			else {
				if (type === 'mo') {
					// modelの場合はdocument.writeした方が応答が早いが、レンダリングが犠牲になる
					if (SYSTEM.DOM_LOADED) {
						Core.api.load('script', path);
					} else {
						doc.write('<script type="text\/javascript" src="' + path + '" charset="UTF-8"><\/script>');
					}
				} else {
					STACK.API_STACK.push([path, name, type, bind || 0]);
				}
			}
			// modelとlibraryは呼び出し元に連結する必要がある
		},
		// Core.Loader.__loadCSS - CSSのロード
		__loadCSS : function(path, name, md) {
			if (SYSTEM.DOM_LOADED) {Core.api.load('css', path, md || null);}
			else if (Core.ua.IE) {
				var linkStr = ['<link rel="stylesheet" type="text/css" href="', path, '"'];
				if (md) { linkStr.push(' media="', md, '"');}
				linkStr.push(' />');
				doc.write(linkStr.join(''));
			}else {
				STACK.CSS_STACK.push([path, md || null]);
				STACK.LOADED_CSS[name] = true;
			}
		},
		// Core.Loader.language : 言語ファイルのロード
		language : function(lang) {
			var path = ([Core.config.appPath(), 'languages/', (CORE_CONFIG.language || 'japanese'), '.js']).join('');

			if (SYSTEM.DOM_LOADED) {
				Core.api.load('script', path);
			} else {
				doc.write('<script type="text\/javascript" src="' + path + '" charset="UTF-8"><\/script>');
			}
			SYSTEM.languages = {};
		},
		toString : function() { return '[class Loader]';}
	}; // end Core.Loader.prototype

	// Core.image - 画像を扱うクラス
	Core.image = {
		// Core.image.preLoad - 画像を先読みする
		preLoad : function(img, ret) {
			var res = [], i, imgO;
			if (ut.isArray(img)) {
				var len = img.length;
				for (i = 0; i < len; i++) {
					imgO = new Image();
					res[i] = imgO.src = img[i];
				}
				return (ret) ? res : undefined;
			} else if (ut.isObject(img)) {
				res = {};
				for (i in img) {
					if (!i.isPrototypeOf(img)) {
						imgO = new Image();
						res[i] = imgO.src = img[i];
					}
				}
				return (ret) ? res : undefined;
			} else if (ut.isString(img)) {
				imgO = new Image();
				imgO.src = img;
				return imgO;
			}
		},
		// Core.image.getDefaultSize - 画像の実際の大きさを取得
		getDefaultSize : function(imgObj) {
			if (imgObj.naturalWidth && imgObj.naturalHeight) {
				return {width : imgObj.naturalWidth, height : imgObj.naturalHeight};
			} else if (imgObj.runtimeStyle) {
				var oldW = imgObj.runtimeStyle.width, oldH = imgObj.runtimeStyle.height;
				imgObj.runtimeStyle.width = imgObj.runtimeStyle.height = 'auto';
				var def = {width : imgObj.width, height : imgObj.height};
				imgObj.runtimeStyle.width = oldW;
				imgObj.runtimeStyle.height = oldH;
				return def;
			} else {
				return {width : imgObj.width, height : imgObj.height};
			}
		},
		toString : function() { return '[class Image]';}
	};  // end Core.image

	// Core.swf - Flashを扱うクラス
	Core.swf = {
		// Core.swf.defaultOption - 初期化オプション
		defaultOption : { scale : 'noScale', salign : 'lt', menu : false, wmode : 'transparent'},
		// Core.swf.init - パラメータ初期化
		init : function() { Core.swf.defaultOption = { scale : 'noScale', salign : 'lt', menu : false, wmode : 'transparent'};}
	}; // end Core.swf

	// alias loader prototype
	// Core.swf.load - <object>タグをブラウザに適応させた状態で生成する
	// @param String mov - ムービーファイルへのパス
	// @param Number w - 横幅
	// @param Number h - 縦幅
	// @param Object param - SWFに渡すパラメータ
	// @param Object opt - 表示オプション
	// return xElement obj - 拡張された<object>要素
	Core.swf.load = Core.Loader.prototype.swf = function(mov, id, options, returnable) {
		Core.swf.init();
		if (arguments.length < 1) {
			throw TypeError('not enough arguments of swf.load');
			return;
		}
		var obj = doc.createElement('object'), str = ['<object '], p, op = options || {},
			opt = Core.union(Core.swf.defaultOption, op || {}),
			flvar = ut.toURIParams(op.param || {}), i;

		if (id) { opt.id = id;}
		if (!returnable || returnable === false) { // return <object> element
			obj.width = op.width || 600;
			obj.height = op.height || 400;
			if (id) { obj.id = id;}
			for(i in opt) {
				p = doc.createElement('param');
				p.name = i; p.value = opt[i];
				obj.appendChild(p);
			}
			// set FlashVars is exists
			if (flvar !== '') {
				p = doc.createElement('param');
				p.name = 'FlashVars'; p.value = flvar;
				obj.appendChild(p);
			}
			// attach movie
			// IE sets param element with name="movie" attirbute
			if (Core.ua.IE) {
				p = doc.createElement('param');
				p.name = 'movie'; p.value = mov;
				obj.appendChild(p);
				obj.setAttribute('classid', 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000');
			} else {
			// else, set object element of "data" attribute
				obj.type = 'application/x-shockwave-flash';
				obj.data = mov;
			}
			obj.style.visibility = 'visible';
			return DOM(obj);
		} else { // return <object> string
			str.push('width="', op.width || 600, '" height="', op.height || 400, '" style="visibility:visible;" ');
			if (id) { str.push('id="' + id + '" ');}
			if (Core.ua.IE) {
				str.push('classid="clsid:D26CD863-AE6D-11cf-9688-44453540000">');
			} else {
				str.push('type="application/x-shockwave-flash" data="', mov, '">');
			}
			for (i in opt) {
				str.push('<param name="', i, '" value="', opt[i], '" />');
			}
			if (flvar !== '') {
				str.push('<param name="FlashVars" value="', flvar, '" />');
			}
			str.push('</object>');
			return str.join('');
		}
	};

	var sf = {}; // alias
	// Core.systemFunc - このスコープでの値のやり取りを行うクラス
	Core.systemFunc = sf = {
		//Core.systemFunc.getExecuteName - ロードした関数の連結名をロードURIから取得
		getExecuteNames : function(func) {
			var ts, n = Core.systemFunc.getRealName(func), sc = doc.getElementsByTagName('script'), len = sc.length;

			if (!n || n === '') {
				throw Error('extend class name is undefined.');
				return;
			}
			for (var i = len - 1; i >= 0; i--) {
				if(!sc[i].src) {continue;}
				if (ut.grep(sc[i].src, n)) { ts = sc[i].src; break;}
			}
			if (!ts || ut.grep(ts, '?')) {
				return {name : n, bindName : n};
			}
			var sp = ts.split('&');
			return {
				name : n,
				bindName : (sp[1] && ut.grep(sp[1], 'bind')) ? sp[1].split('=')[1] : n
			};
		},
		// Core.systemFunc.__getRealName - 関数から定義名のみを取り出す
		getRealName : function(func){
			return func.name || (function(){var name = func.toString(); return name.slice(9, name.indexOf('('));})();
		},
		// Core.systemFunc.clean - 文字エンティティの変換（PHPのhtmlspecialchars関数互換。ただし全てENT_QUOTESである）
		// 拡張仕様として、引数はオブジェクトでも良い、<script>タグとjavascript:プロトコルも削除する（第二引数無し、またはtrue時）
		clean : function(str, isScript /* bool */) {
			var quoteMode = (isScript === false) ? isScript : true;
			if (typeof str == 'object') {
				for (var i in str) { if(!i.isPrototypeOf(str)) {str[i] = arguments.callee(str[i], isScript);}}
				return str;
			}
			if (quoteMode) {
				str = str.replace(/<script>(.*?)<\/script>/ig, '[removedtag]$1[removedtag]').replace(/javascript:/ig, '[removedprotocol]');
			}
			return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\'/g, '&#039;');
		},
		// Core.systemFunc.cleanEvElm - ページのunload時に全イベント解除と拡張エレメントを削除する
		cleanEvElm : function() {
			EV.deleteAllEvent();
			STACK.ELEMENTS = [];
			STACK.GLOBAL_LAYER = null;
		},
		// Core.systemFunc.camel - ハイフンの次の文字をキャメルケースにする
		camel : function(str) {
			if (str in STACK.CAMELED_PROP) {return STACK.CAMELED_PROP[str];}
			if (!ut.grep(str, '-')) {return str;}
			var spl = str.split('-'), p = [spl[0]], i = 0;
			while (spl[++i]) {p[i] = spl[i].charAt(0).toUpperCase() + spl[i].substring(1).toLowerCase();}
			STACK.CAMELED_PROP[str] = p.join('');
			return p.join('');
		},
		// Core.systemFunc.deCamel - キャメライズされた文字をハイフン＋小文字に戻す
		deCamel : function(str) {
			if (str in STACK.DECAMELED_PROP) {return STACK.DECAMELED_PROP[str];}
			var ret = str.replace(/([A-Z]{1})/g, '-$1').toLowerCase();

			STACK.DECAMELED_PROP[str] = ret;
			return ret;
		},
		// Core.systemFunc.trim - 文字列の前後の空白を削除
		trim : function(str) { return str.replace(/^\s*(.*?)/, '$1').replace(/(.*?)\s*$/, '$1');},
		// Core.systemFunc.exists - 関数が定義されているかをチェックする
		exists : function(fn) {
			var h = CORE_CONFIG.globalNames.Helper, obj = (h != '') ? win[h] : win;
			return !!obj[fn];
		},
		// Core.systemFunc.buildAPI - 一括ロード用のAPIパスを生成
		buildAPI : function(arr) {
			var len = arr.length, p = [], a, id, s;
			for (var i = 0; i < len; i ++) {
				a = arr[i];
				p.push(a[2] + '-' + a[1]);
			}
			Core.api.load('script', CORE_CONFIG.SITE_URL + 'flint/load_api/' + p.join(':'));
		}
	}; // end Core.systemFunc

	// Core.attr - attributeを正規化するクラス
	Core.attr = {
		// Core.attr.toStrictAttr - IE6,IE7を考慮してattributeを正規化
		toStrictAttr : function(e, name, val, mode) {
			var p = name.toLowerCase(), ie = Core.ua.IE, ie67 = Core.ua.is('I6|I7'), m = (mode) ? true : false /* default false */,  g = Core.attr.get, s = Core.attr.set;
			switch (p) {
			case 'class' :            return (m) ? s(e, (ie) ? 'className' : 'class', val, ie) : g(e, (ie) ? 'className' : 'class', ie);
			case 'classname' :   return (m) ? s(e, (ie) ? 'className' : 'class', val, ie) : g(e, (ie) ? 'className' : 'class', ie);
			case 'for' :               return (m) ? s(e, (ie) ? 'htmlFor' : 'for', val, ie) : g(e, (ie) ? 'htmlFor' : 'for', ie);
			case 'style' :            return (m) ? (ie) ? (e.style.cssText = e.style.cssText + val) : e.setAttribute('style') :(ie) ? e.style.cssText : e.getAttribute('style');
			case 'colspan' :       return (m) ? s(e, (ie67) ? 'colSpan' : 'colspan', val, ie67) : g(e, (ie67) ? 'colSpan' : 'colspan', ie67);
			case 'rowspan' :      return (m) ? s(e, (ie67) ? 'rowSpan' : 'rowspan', val, ie67) : g(e, (ie67) ? 'rowSpan' : 'rowspan', ie67);
			case 'accesskey' :   return (m) ? s(e, (ie67) ? 'accessKey' : 'accesskey', val, ie67) : g(e, (ie67) ? 'accessKey' : 'accesskey', ie67);
			case 'tabindex' :     return (m) ? s(e, (ie67) ? 'tabIndex' : 'tabindex', val, ie67) : g(e, (ie67) ? 'tabIndex' : 'tabindex', ie67);
			case 'frameborder':return (m) ? s(e, (ie67) ? 'frameBorder' : 'frameborder', val, ie67) : g(e, (ie67) ? 'frameBorder' : 'frameborder', ie67);
			default :               return (m) ? s(e, name, val, false) : g(e, name, false);
			}
		},
		set : function(e, name, val, toProp) {
			if (toProp) {e[name] = val;}
			else {e.setAttribute(name, val);}
		},
		get : function(e, name, toProp) {
			return (toProp) ? e[name] : e.getAttribute(name);
		}
	};

	// Core.language - 言語周りを扱うクラス
	Core.language = {
		// Core.language.load - 言語ファイルのロード
		load : function(lang) {
			Core.load.language(lang);
		},
		// Core.language.line - キーで翻訳
		line : function(key) {
			return SYSTEM.languages[key] || key;
		}
	};

	// Core.__AjaxInit - XHR周りをクロスブラウザ化する
	// このクラスはCore.Loader.prototype.ajaxからしかインスタンス化されない
	// @access private
	Core.__AjaxInit = function(obj) {
		var thisClass = this, tmpJSONPTimeStamp = 0; // JSONPを行う時のタイムスタンプ
		this.timeout = CORE_CONFIG.AjaxTimeout || 30000; //タイムアウト秒数(ms) - デフォルト10秒
		this.state = {}; // 通信中のパラメータハッシュ
		this.parentObj = obj;
	};
	// Core.__AjaxInit.prototype - Ajaxクラスプロトタイプ
	Core.__AjaxInit.prototype = {
		// Core.__AjaxInit.prototype.__createXHR - XHR生成
		__createXHR : function() {
			if (win.XMLHttpRequest) {return new XMLHttpRequest();}
			else if (win.ActiveXObject) {
				var x = null;
				try { x = new ActiveXObject('Msxml2.XMLHTTP');}
				catch(e) {
					try { x = new ActiveXObject('Microsoft.XMLHTTP');} catch(e) {}
				}
				if (x) {return x;}
				throw Error('XHR is undefined.');
			}
		},
		__createXDR : function() {
			if (!win.XMLHttpRequest) { return false; }
			var xdr = new XMLHttpRequest();
			if ('withCredentials' in xdr) {
				return xdr;
			} else if (typeof XDomainRequest !== 'undefined') {
				return new XDomainRequest();
			}
			return false;
		},
		// Core.__AjaxInit.prototype.setQueue - 通信順番待ちをセットする
		setQueue : function(type, url, opt, XDR) {
			var qID = +new Date(), M = CORE_CONFIG.AjaxMaxConnection, wait = (M === 0 || STACK.AJAX_QUEUE.length >= M);
			STACK.AJAX_QUEUE.push({stable : wait, type : type, url : url, opt : opt, qID : qID, XDR : XDR});
			return !wait;
		},
		// Core.__AjaxInit.prototype.__doNextQueue - 待機状態のリクエストがあれば実行、無ければ初期化
		__doNextQueue : function() {
			var st = STACK.AJAX_QUEUE, len = st.length, i = 0, q, isEmpty = true; // guard flag
			for (i; i < len; i++) {
				if(st[i].stable === true) {
					st[i].stable = isEmpty = false;
					this['__connect' + (st[i].XDR ? 'X' : '')](st[i].type, st[i].url, st[i].opt, st[i].opt.param);
					return;
				}
			}
			if(isEmpty === true) { STACK.AJAX_QUEUE = [];} // 待機なし
		},
		// Core.__AjaxInit.prototype.__getWrappedResponse - コールバック引き渡し用オブジェクト生成
		__getWrappedResponse : function(xhr) {
			return {
				xhr : xhr,
				responseText : xhr.responseText,
				responseXML : xhr.responseXML,
				responseJSON : (function(){try{return Core.JSON.parse(xhr.responseText);}catch(e){return '';}})(),
				getResponseArray : function(separator) { return xhr.responseText.split(separator); },
				getAllHeaders : function() {
					var head = xhr.getAllResponseHeaders().split(/\n/), hd = {}, len = head.length, tr = Core.systemFunc.trim;
					for (var i = 0; i < len; i++) {
						if (head[i].length === 0) {continue;}
						var h = head[i], p = h.indexOf(':');
						hd[tr(h.slice(0, p))] = tr(h.slice(p + 1));
					}
					return hd;
				}
			};
		},
		// Core.__AjaxInit.prototype.get - GET送信
		get : function(url, opt, XDR) {
//			this.initParameter();
			var o = Core.union({method : null, param : '', success : null, error : null, async : true, start : null, abort : null, header : null, cache : false}, opt || {});
			if (ut.isObject(o.param)) {
				var p = [], ob = o.param, enc = win.encodeURIComponent;
				for (var i in ob) {
					if (ut.isArray(ob[i])) {
						var j = 0, jlen = ob[i].length;
						for (j; j < jlen; j++) {p.push(enc(i) + '=' + enc(ob[i][j]));}
					} else { p.push(enc(i) + '=' + enc(ob[i])); }
				}
				o.param = p.join('&');
			}
			url = this.__buildURL(url, o.param, 'get');
			if (!this.setQueue('GET', url, o, !!XDR)) {return;}
			this['__connect' + (XDR ? 'X' : '')]('GET', url, o, null);
		},
		getX : function(url, opt) { this.get(url, opt, true);}, // syntax sugar
		// Core.__AjaxInit.prototype.post - post送信
		post : function(url, opt, XDR) {
//			this.initParameter();
			var o = Core.union({method : null, param : '', success : null, error : null, async : true, start : null, abort : null, header : null, cache : false}, opt || {});
			if (ut.isObject(o.param)) {
				var p = [], ob = o.param, enc = win.encodeURIComponent;
				for (var i in ob) {
					if (i.isPrototypeOf(ob)) { continue; }
					if (ut.isArray(ob[i])) {
						var j = 0, jlen = ob[i].length;
						for (j; j < jlen; j++) {p.push(enc(i) + '[]=' + enc(ob[i][j]));}
					} else {
						p.push(enc(i) + '=' + enc(ob[i]));
					}
				}
				o.param = (p.length > 0) ? p.join('&').toString() : null;
			}

			url = this.__buildURL(url, null, 'post');
			if (!this.setQueue('POST', url, o, !!XDR)) {return;}
			this['__connect' + (XDR ? 'X' : '')]('POST', url, o, o.param);
		},
		postX : function(url, opt) { this.post(url, opt, true); }, // syntax sugar
		// Core.__AjaxInit.prototype.head - ヘッダ取得メソッド
		head : function(url, opt) {
			var o = Core.union({method : null, param : '', success : null, error : null, async : true, start : null, abort : null, header : null, cache : false}, opt || {});
			var thisClass = this, xhr = this.__createXHR(), timer;
			this.state.request = 'HEAD';
			xhr.open('HEAD', url, true);
			this.state.text = 'LOADING';

			// add Ajax header of X-Requested-With
			// if transporter is ActiveXObject, also, set value 'XMLHttpRequest'.
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			o.url = url;

			// 接続遮断タイマーセット
			timer = setTimeout(function(){thisClass.stop.apply(thisClass, [xhr, o]);}, o.timeout ||thisClass.timeout);

			// onreadystatechangeのハンドラ設定(非同期)
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					clearTimeout(timer);
					if (ut.isFunction(o.success)) {
						o.success.call(thisClass.parentObj, xhr);
					}
					xhr.onreadystatechange = null;
					xhr = null;
				}
			};
			xhr.send(null);

		},
		// Core.__AjaxInit.prototype.request - 汎用的な通信メソッド
		request : function(opt) {
//			this.initParameter();
			var params = Core.union({method : null, param : '', success : null, error : null, async : true, start : null, abort : null, header : null, cache : false}, opt), m;
			if (!opt.url || !opt.method) {
				throw Error('not enough parameter.');
			}
			switch (opt.method.toLowerCase()) {
			case 'get': this.get(opt.url, opt); break;
			case 'post' : this.post(opt.url, opt); break;
			case 'jsonp' : this.jsonp(opt.url, opt.success); break;
			default : throw Error('undefined request method');
			}
		},
		// Core.__AjaxInit.prototype.__connectX - クロスドメインXHR（UA限定付き）
		// Implement : Firefox 3.5+, Safari 4.x+, Google Chrome, IE8
		__connectX : function(type, url, o, param) {
			var thisClass = this, xdr = this.__createXDR(), timer;
			if (!xdr) {
				throw Error('your Browser not Support XDR.');
				return;
			}
			this.state.request = type;
			xdr.open(type, url, true);
			if (ut.isFunction(o.start)) {o.start.call(this.parentObj);}
			this.state.text = 'LOADING';

			if (type === 'POST') {
				xdr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			}
			if (ut.isObject(o.header)) {
				var h = o.header;
				for (var j in h) {if (!j.isPrototypeOf(h)){xdr.setRequestHeader(i, h[i]);}}
			}
			if (!o.cache) {
				xdr.setRequestHeader('If-Modified-Since', "01 Jan 1970 00:00:00 GMT");
				xdr.setRequestHeader('Cache-Control', 'no-store, no-chache, must-revalidate, post-check=0, pre-check=0');
				xdr.setRequestHeader('Pragma', 'no-cache');
				xdr.setRequestHeader('Expires', 'Mon, 26, Jul, 1997, 05:00:00 GMT');
			}
			o.url = url;

			// 接続遮断タイマーセット
			timer = setTimeout(function(){thisClass.stop.apply(thisClass, [xdr, o]);}, o.timeout || thisClass.timeout);

			// onreadystatechangeのハンドラ設定(非同期)
			// ActiveXの場合、正しくreadyStateごとにハンドラが呼ばれない時があるので、setTimeoutで複数回呼び出す（jQuery方式）
			xdr.onload = function() { thisClass.__loadedFunc.apply(thisClass, [xdr, o, timer, true]);};
			xdr.send(param);

		},
		// Core.__AjaxInit.prototype.__buildURL - 適切な通信URLに整形
		__buildURL : function(url, param, method) {
			if (!/^http|^file|^\.\.?\//.test(url)) {url = CORE_CONFIG.SITE_URL + url;}
			//if (method === 'post' || method === 'jsonp') {return url;}
			if (method === 'get' && param) {
				url += (!/segment|config|/.test(CORE_CONFIG.routingMode)) ? ((/\?/.test(url)) ? '&' + param : '?' + param)
						: ( (/\/$/.test(url)) ? param.replace(/[=&]/g, '/') : '/' + param.replace(/[=&]/g, '/'));
			} else if (method === 'jsonp') {
				url += (/\?$/.test(url)) ? 'callback=' + param : (/\?/.test(url)) ? '&callback=' + param : '?callback=' + param;
			}
			return url;
		},
		// Core.__AjaxInit.prototype.__connect - 通信開始
		__connect : function(type, url, o, param) {
			var thisClass = this, xhr = this.__createXHR(), timer;
			this.state.request = type;
			xhr.open(type, url, o.async);
			if (ut.isFunction(o.start)) {o.start.call(this.parentObj);}
			this.state.text = 'LOADING';

			// add Ajax header of X-Requested-With
			// if transporter is ActiveXObject, also, set value 'XMLHttpRequest'.
			xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
			if (type === 'POST') {
				xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			}
			if (ut.isObject(o.header)) {
				var h = o.header;
				for (var j in h) {if (!j.isPrototypeOf(h)){xhr.setRequestHeader(j, h[j]);}}
			}
			if (!o.cache) {
				xhr.setRequestHeader('If-Modified-Since', "01 Jan 1970 00:00:00 GMT");
				xhr.setRequestHeader('Cache-Control', 'no-store, no-chache, must-revalidate, post-check=0, pre-check=0');
				xhr.setRequestHeader('Pragma', 'no-cache');
				xhr.setRequestHeader('Expires', 'Mon, 26, Jul, 1997, 05:00:00 GMT');
			}
			o.url = url;

			// 接続遮断タイマーセット
			timer = setTimeout(function(){thisClass.stop.apply(thisClass, [xhr, o]);}, thisClass.timeout);

			// onreadystatechangeのハンドラ設定(非同期)
			// ActiveXの場合、正しくreadyStateごとにハンドラが呼ばれない時があるので、setTimeoutで複数回呼び出す（jQuery方式）
			if (o.async) {
				if (win.XMLHttpRequest) {
					xhr.onreadystatechange = function() { thisClass.__loadedFunc.apply(thisClass, [xhr, o, timer]);};
				} else { // ActiveX
					win.setTimeout(function(){thisClass.__loadedFunc.apply(thisClass, [xhr, o, timer] );}, 10);
				}
			}
			xhr.send(param);

			// 同期通信の場合はここでハンドリング
			if (!o.async) {
				thisClass.__loadedFunc.apply(thisClass, [xhr, o, timer]);
			}
		},
		// Core.__AjaxInit.prototype.jsonp - jsonp通信
		jsonp : function(url, callback, bind) {
			if (!url || !callback) { throw new TypeError('not enough argument on JSONP.');}
			var head = doc.getElementsByTagName('head')[0], thisClass = this, bindObj = bind || win;
			var tmpSetJSONPTimeStamp = +new Date();
			var cfn = function(obj) {
				callback.call(bindObj, obj);
				try { delete win['FlintJSONPCallBack' + tmpSetJSONPTimeStamp];}
				catch(e) { win['FlintJSONPCallBack' + tmpSetJSONPTimeStamp] = undefined; }
				finally { head.removeChild(doc.getElementById('flintjsonpscript' + tmpSetJSONPTimeStamp));}
			};
			win['FlintJSONPCallBack' + tmpSetJSONPTimeStamp] = cfn;
			var s = doc.createElement('script');
			s.type = 'text/javascript';
			s.src = this.__buildURL(url , 'FlintJSONPCallBack' + tmpSetJSONPTimeStamp.toString(), 'jsonp');
			s.id = 'flintjsonpscript' + tmpSetJSONPTimeStamp;
			head.appendChild(s);
		},
		// Core.__AjaxInit.prototype.__loadedFunc - 通信状態の監視とコールバック設定
		__loadedFunc : function(xhr, o, timer, isXDR) {
			var me = this, RES = SYSTEM.XHR_RESPONSES, resp = null;
			me.state.code = xhr.readyState;
			if (xhr.readyState == 4) {
				try{win.clearTimeout(timer);} catch(e){}
				me.state.text = 'COMPLETED';
				if (xhr.status == 200 || (/^file/.test(o.url))) {
					me.state.httpResponse = 'LOADED';
					resp = new me.__getWrappedResponse(xhr);
					if (ut.isFunction(o.success)) {o.success.call(me.parentObj, resp);}
					// AjaxEndイベント実行
					me.__doAjaxEvent('AjaxComplete', resp, o, xhr);
				}else {
					me.state.httpResponse = RES.STATUS[xhr.Status] || 999;
					if (ut.isFunction(o.error)) {o.error.call(me.parentObj, {status : xhr.Status});}
					// AjaxErrorイベント実行
					me.__doAjaxEvent('AjaxError', resp, o, xhr);
				}

				// 明示的にストップさせる
				//me.stop(o, false);
				//me.xhr = null; // GC破棄
				me.__doAjaxEvent('AjaxEnd', resp, o, xhr);
				me.__doNextQueue();
				// option GC destroy
				me.opt = {};
				if (isXDR) {
					xhr.onload = null;
				} else if (win.XMLHttpRequest){xhr.onreadystatechange = null;}
				xhr = null;
			} else if (!win.XMLHttpRequest && win.ActiveXObject) {
				try{win.clearTimeout(timer);} catch(e){}
				timer = win.setTimeout(function() {me.__loadedFunc.apply(me, [xhr, o, timer]);}, 10);
			}
		},
		// Core.__AjaxInit.prototype.stop - Ajax通信ストップ
		stop : function(xhr, o) {
			xhr.abort();
			if (ut.isFunction(o.stop)) {o.stop.call(this.parentObj);}
			this.__doAjaxEvent('AjaxError', null, null, xhr);
			this.__doAjaxEvent('AjaxEnd', null, null, xhr);
//			this.initParameter();
		},
		// Core.__AjaxInit.prototype.__doAjaxEvent - Ajax通信イベントとして発行し、dispatch
		__doAjaxEvent : function(type, resp, o, xhr) {
			var st = STACK.AJAX_EVENTS, len = st.length, i = 0, callFn, e;
			for (i; i < len; i++) {
				if (st[i][1] === type) {
					st[i][2].call(st[i][3], new AjaxFakeEvent(type, st[i][0], xhr, resp, o));
					if (st[i][4] === true) {st.splice(i, 1);}
				}
			}
		},
		toString : function() { return '[class Ajax]';}
	}; // end Core.__AjaxInit.prototype

	var rf = function() { return false;};
	var AjaxFakeEvent = function(type, target, xhr, data, p) {
		this.type = type;
		this.data = data;
		this.target = xhr;
		this.params = p;
		this.currentTarget = target;
		this.relatedTarget = null;
		this.keyCode = null;
		this.shiftKey = false;
		this.which = null;
		this.propertyName = undefined;
		this.pageX = 0;
		this.pageY = 0;
		this.stopPropagation = rf;
		this.preventDefault = rf;
	};

	// Core.uri - セグメントを扱うクラス
	Core.uri = {
		// Cpre.uri.getHash - URIハッシュを取得
		getHash : function(withHash) {
			var h = STACK.URI_DATA.hash;
			return (withHash) ? h : h.slice(1);
		},
		// Core.uri.segmentArray - セグメントデータを配列で取得
		segmentArray : function() {
			// ここでは新たに配列を生成して返さないと、返却値を変更されると参照が変わる。
			var u = STACK.URI_DATA.uriArray, res = [''], i = 0;
			while(u[++i]) { res.push(u[i]); }
			return res;
		},
		// Core.uri.segment - 指定セグメントの値を取得
		segment : function(num, def) {
			var d = (def + '' === '0') ? def : (def) ? def : false;
			return STACK.URI_DATA.uriArray[num] || def;
		},
		// Core,uri,lastSegment [flint original] - 最後のセグメントを取得
		lastSegment : function() {
			var d = STACK.URI.DATA.uriArray;
			return d[d.length - 1];
		},
		// Core.uri.slashSegment - スラッシュ付きセグメントの取得
		slashSegment : function(num, slash) {
			var u = STACK.URI_DATA.uriArray, sh = slash || '',
				prefix = /leading|both/.test(sh) ? '/' : '',
				suffix = (sh === 'both') ? '/' : '';
			return u[num] ? prefix + u[num] + suffix : false;
		},
		// Core.uri.uriToAssoc - ハッシュオブジェクトを取得
		uriToAssoc : function(num, def) {
			var s = STACK.URI_DATA.uriArray, i = num || 3, len = s.length, res = {};
			if (def && ut.isArray(def)) {
				var dlen = def.length, j = 0;
				for (j; j < dlen; j++) {
					res[def[j]] = s[i + 1] || false;
					i += 2;
				}
			} else {
				while (s[i]) {
					res[s[i]] = s[i + 1] || false;
					i += 2;
				}
			}
			return res;
		},
		// Core.uri.uriString - URIを文字列として返却
		uriString : function() {
			return STACK.URI_DATA.uriArray.join('/');
		},
		// Core.uri.assocToUri - ハッシュオブジェクトからURI文字列をビルド
		assocToUri : function(obj) {
			// !notice! JavaScriptではオブジェクトをforループは順序が保証されていないので期待した結果が得られないことがある
			// 結果を保証したい場合は下のassocToUriArray()を使用してください。
			var res = [];
			for (var i in obj) {
				res.push(i + '/' + obj[i]);
			}
			return '/' + res.join('/');
		},
		// Core.uri.asocToUriArray - 完全な配列からURIを生成
		// 上記assocToUri()メソッドの代替案だが、自前でビルドした方が早いです。
		assocToUriArray : function(arr) {
			return '/' + arr.join('/');
		},
		toString : function() { return '[class URI]';}
	};

	// Core.init - システムのスタートアップ
	Core.init = function() {
		// IE8--では<canvas>をサポートしていないため、ここでメモリ認識させる
		// 実際の使用はcanvasプラグインをロードした際である
		// ついでにv_とv_oの名前空間を追加しておく(Canvas以外でもVMLを使わないと行けない部分が結構あるため)
		if (Core.ua.IE && Core.ua.IEV < 9) {
			doc.createElement('canvas');
			if (doc.namespaces) {
				var dn = doc.namespaces;
				if (!dn.v) {dn.add('v', 'urn:schemas-microsoft-com:vml', '#default#VML');}
				if (!dn.v_o) {dn.add('v_o', 'urn:schemas-microsoft-com:office:office', '#default#VML');}
				if (!doc.styleSheets.fl_canvas) {
					var ss = doc.createStyleSheet();
					ss.owningElement.id = 'fl_canvas';
					ss.cssText = 'canvas{display:inline-block;overflow:hidden;' +
					'text-align:left;width:300px;height:150px;}' +
					'v\\:*{behavior:url(#default#VML)}' +
					'v_o\\:*{behavior:url(#default#VML)}';
				}
			}
		}

		// プロファイラがONの時はモジュールのロード
		if (CORE_CONFIG.useProfiler === true) {
			Controller.load.module(['layer', 'flint_profiler']);
			Core.image.preLoad([CORE_CONFIG.APPPATH + 'fl_images/fl_tree_marker_close.gif', CORE_CONFIG.APPPATH + 'fl_images/fl_tree_marker.gif']);
		}

		// 使用するプラグインのロード
		var usePlugin = CORE_CONFIG.usePlugins;
		//if (CORE_CONFIG.useIECanvas === true && Core.ua.IE) { usePlugin.unshift('canvas');}
		if (CORE_CONFIG.useBuiltinClassExtend === true) { usePlugin.push('prototype_extend'); }
		if (Core.ua.IE && !Core.ua.IE9) {
			for (var bo in CORE_CONFIG.IEboost) {
				// 1つでも機能追加があればプラグインロード
				if (!bo.isPrototypeOf(CORE_CONFIG.IEboost) && CORE_CONFIG.IEboost[bo] === true) { usePlugin.push('ie-ignite'); break;}
			}
		}
		var plLen = usePlugin.length, pl = 0;
		if (plLen > 0) {
			// 地道に1つずつロード
			for (pl; pl < plLen; pl++) {
				doc.write('<script type="text\/javascript" src="' + CORE_CONFIG.APPPATH + 'plugins/' + usePlugin[pl] + '.js" charset="UTF-8" defer="defer"><\/script>');
			}
		}

		// URIクラスビルド
		var acu = (SYSTEM.ACCESS_URI.replace(new RegExp(CORE_CONFIG.SITE_URL), '')).replace(/index\.php\/?/, ''), uriO = {}, uriA = [''],
			hash = location.hash, splitUri = acu.replace(hash, '').split('/'), segmentLen = splitUri.length, ii = 0;
		for (ii; ii < segmentLen; ii++) {
			uriO[ii + 1] = splitUri[ii];
			uriA.push(splitUri[ii]);
		}
		STACK.URI_DATA.uriObj = uriO;
		STACK.URI_DATA.uriArray = uriA;
		STACK.URI_DATA.hash = hash;


		// routingModeに基づきコントローラの決定
		switch (CORE_CONFIG.routingMode) {
		case 'none':
			// ルーティング無しの場合、汎用コントローラがグローバルラインにインスタンス化される
			SYSTEM.CONTROLLER_NAME = CORE_CONFIG.globalNames.Controller;
			SYSTEM.EXEC_METHOD = 'none';
			Controller.load.ajax();
			// 専用メソッド定義、FL.Class
			Controller.Class = function(bool) {
				var nc = function() {
					if (bool) {
						Core.union(this, {load : new Core.Loader(this), event : Core.event, ua : Core.ua, ut : Core.utility, json : Core.JSON});
						this.load.ajax();
					}
					this.__construct.apply(this, arguments);
				};
				return nc;
			};
			win[SYSTEM.CONTROLLER_NAME] = SYSTEM.CONTROLLER = Controller;
			break;
		case 'segment':
			// segmentの場合、URIからコントローラを取得
			// この場合、絶対パスである必要がある。また、CIのようにルーティングでindex.phpがある場合はこれも削除する
			var l, arg, argC = 2, con, exec, uri = SYSTEM.ACCESS_URI.replace('#' + location.hash, '').replace(location.search, ''), base = CORE_CONFIG.BASE_URL, isRoot, dirPath;
			//if (ut.grep(uri, 'index.php')) {uri = uri.replace(/index\.php\/?/, '');}
			// CONFIGで設定したドメインかどうかをチェック、無ければsame originではないのでエラーとする
			if (!ut.grep(uri, base)) {return alert('illegal URI! location violates same origin policy.');}
			//if (ut.grep(uri, 'index.php')) {uri = uri.replace(/index\.php\/?/, '');}
			l = uri.replace(base, '').replace(/index\.php\/?/, ''); isRoot = (l === '');
			// http://example.com/のようなルートにアクセスした場合はdefaultCotrollerの値を使用する
			arg = (isRoot) ? [CORE_CONFIG.defaultController, 'index'] : l.split('/');
			// パスがディレクトリがどうかチェック
			while(ut.inArray(arg[0], CORE_CONFIG.directoryList)) {
				// チェックにかかればパスを合成
				arg[0] = arg[0] + '/' + arg[1];
				// セグメントを詰める
				arg.splice(1, 1);
			}
			// メソッドがなくなったらデフォルトをセット
			if (!arg[1]) { arg[1] = 'index';}
			SYSTEM.CONTROLLER_NAME = arg[0];
			SYSTEM.EXEC_METHOD = arg[1];
			// コントローラのロード
			doc.write('<script type="text\/javascript" src="' + CORE_CONFIG.APPPATH + 'controllers/' + SYSTEM.CONTROLLER_NAME + '.js" charset="UTF-8"><\/script>');
			while(arg[argC]) {
				SYSTEM.METHOD_ARGUMENTS[arg[argC - 2]] = arg[argC];
				argC++;
			}
			break;
		case 'config':
			// configの場合、設定オブジェクトからコントローラ決め打ち
			SYSTEM.CONTROLLER_NAME = (CORE_CONFIG.loadController) ? CORE_CONFIG.loadController : CORE_CONFIG.defaultController;
			SYSTEM.EXEC_METHOD = (CORE_CONFIG.execMethod) ? CORE_CONFIG.execMethod : 'index';
			doc.write('<script type="text/javascript" src="' + CORE_CONFIG.APPPATH + 'controllers/' + SYSTEM.CONTROLLER_NAME + '.js" charset="UTF-8"><\/script>');
			break;
		}  // end routing switch

		// 言語指定がされていれば言語ファイルをロード
		if (CORE_CONFIG.language !== '') {
			Core.load.language(CORE_CONFIG.language);
		}

		// autoLoadLibraryに基づきライブラリをロード
		if (CORE_CONFIG.autoLoadLibrary.length > 0) {
			Core.load.library(CORE_CONFIG.autoLoadLibrary);
		}
		// autoLoadModelに基づきモデルファイルをロード
		if (CORE_CONFIG.autoLoadModel.length > 0) {
			Core.load.model(CORE_CONFIG.autoLoadLModel);
		}
		// autoLoadMudleに基づきモジュールをロード
		if (CORE_CONFIG.autoLoadModule.length > 0) {
			Core.load.module(CORE_CONFIG.autoLoadModule);
		}

		// onloadイベント監視
		if (win.addEventListener) {
			win.addEventListener('load', Core.event.__execLoad, false);
			win.addEventListener('unload', sf.cleanEvElm, false);
			//if (Core.ua.Safari) {win.addEventListener('unload', sf.cleanEvElm, false);}
		}	else if (win.attachEvent) {
			// IEはページのunload時に登録ハンドラを全削除(memory leak対策)
			win.attachEvent('onunload', sf.cleanEvElm);
			win.attachEvent('onload', Core.event.__execLoad);
		}	else {
			// インラインイベントハンドラも削除
			win.onunload = Core.systemFunc.cleanEvElm;
		}

		// DOM ready監視
		// Firefox, Opera, GoogleChrome, Safari version 3.1以上はaddEventListenerに登録できる
		// added at 2010/09/30 - IE9はaddEventListenerサポート＋ContentLoadedが可能になった
		if (Core.ua.IE9 || Core.ua.Firefox || Core.ua.Opera || Core.ua.GoogleChrome || (Core.ua.Safari && Core.ua.SafariV > 3.1 )) {
			doc.addEventListener('DOMContentLoaded', Core.event.__execDOM, false);
		} else if (Core.ua.IE) {
			doc.attachEvent('onreadystatechange', function() {
				if (doc.readyState == 'complete') {
					Core.event.__execDOM(win.event);
					doc.detachEvent('onreadystatechange', arguments.callee);
				}
			});
		} else if (doc.readyState) {
			(function() {
				if (doc.readyState == 'loaded' || doc.readyState == 'complete') {Core.event.__execDOM();}
				else {win.setTimeout(arguments.callee, 0);}
			})();
		} else { // other Browser??
			if (win.addEventListener) {win.addEventListener('load', Core.event.__execDOM, false);}
			else if (win.attachEvent) {win.attachEvent('onload', Core.event.__execDOM);}
			else {win.onload = function() {
					Core.event.__execDOM();
					Core.event.__execLoad();
				};
			}
		}
	}; // end Core.init

	// Core.__readyFunc - onloadの判定後、trueなら実行し、falseならイベント登録
	Core.__readyFunc = function(fn) {
		if (!SYSTEM.WINDOW_LOADED) {
			STACK.LOADED_FUNCS.push([fn]);
		} else {
			var tmp = new fn();
			if (tmp.__construct) {tmp.__construct();}
		}
	};
	// Core.extend - 各オブジェクトを継承したクラスを生成。継承（追加先）は第一引数で特定
	Core.extend = function(ex, fn) {
		if (typeof ex != 'string') {return alert('Extend Class must be string!');}
		var extend = ex.toLowerCase();
		if (extend === 'core') {return alert('CoreClass can\'t extend!');}
		if (Core.extend[extend]) { Core.extend[extend](fn, extend); return;}
		throw new TypeError('undefined extend Class on ClassExtend.');
	};
	Core.extend.config = function(fn){
		if (ut.isObject(fn)) { for (var p in fn) { if (!p.isPrototypeOf(fn) && !CORE_CONFIG[p]){CORE_CONFIG[p] = fn[p];}}}
	};
	Core.extend.element = function(fn) {
		if (ut.isFunction(fn)){fn = new fn();}
		if (ut.isObject(fn)) { for (var p in fn) { if (!p.isPrototypeOf(fn)) {xElement.prototype[p] = fn[p];}}}
	};
	Core.extend.elementlist = function(fn) {
		if (ut.isFunction(fn)) {fn = new fn();}
		if (ut.isObject(fn)) { for (var p in fn) { if (!p.isPrototypeOf(fn)) {xNodeList.prototype[p] = fn[p];}}}
	};
	Core.extend.effect = function(fn) {
		if (ut.isFunction(fn)) {fn = new fn();}
		if (ut.isObject(fn)) { for (var p in fn) {  if (!p.isPrototypeOf(fn)) {Animation[p] = fn[p];}}}
	};
	Core.extend.helper = function(fn) {Core.__readyFunc(fn);};
	Core.extend.controller = function(fn) {
		//if (SYSTEM.CONTROLLER !== null) {return alert('Controller Class has already Extended!');}
		var con, EM = SYSTEM.EXEC_METHOD;
		fn.prototype = Controller;
		fn.prototype.toString = function() { return '[class Controller]';};
		con = new fn();
		if (ut.isObject(SYSTEM.CONTROLLER)) {
			for (var i in SYSTEM.CONTROLLER) {
				if ( !con[i]) { con[i] = SYSTEM.CONTROLLER[i]; }
			}
		}
		SYSTEM.CONTROLLER = con;
		if (CORE_CONFIG.routingMode === 'none') {
			win[SYSTEM.CONTROLLER_NAME] = con;
		}
		if (con.hasOwnProperty('__construct')) {con.__construct();}
		// 初期メソッドの実行スタック追加
		SYSTEM.START_CONTROLLER = function() {
			if (SYSTEM.EXEC_METHOD === 'none') { SYSTEM.EXEC_METHOD = 'index';}

			if (con.hasOwnProperty('_remap')) { con._remap(SYSTEM.EXEC_METHOD);}
			else if (con.hasOwnProperty(EM) && /^[_]/.test(EM) === false) {
				con[EM].call(con, SYSTEM.METHOD_ARGUMENTS);
			} else {
				if (CORE_CONFIG.debugMode) {alert(EM + ' is undefined or private');}
				return;
			}
		};
	};
	Core.extend.model = Core.extend.library = function(fn, type) {
		var names = sf.getExecuteNames(fn), tmp;
		// Model継承の場合のみprototype継承
		if (type === 'model') { fn.prototype = new Core.baseModel(); }
		tmp = STACK.INSTANCED_API[names.name] = new fn();
		if (tmp.__construct) {tmp.__construct();}
		// parentにコントローラを指定
		tmp.parent = SYSTEM.CONTROLLER;
		// attach先を特定
		var attachTo = STACK.ATTACH_API[names.name], bindName = names.bindName, len = attachTo.length;
		for (var i = 0; i < len; i++) {
			if (!attachTo[i][bindName]) {attachTo[i][bindName] = tmp;}
			//attachTo[i][bindName] = tmp;
		}
		STACK.API_READY[names.name] = true;
		if (STACK.API_READY_FUNC[bindName]) {
			var j = 0, a = STACK.API_READY_FUNC[bindName], len2 = a.length;
			for (j; j < len2; j++) {
				a[j]();
			}
			a = null;
		}
	};
	Core.extend.language = function(obj) {
		SYSTEM.languages = obj;
	};

	// Core.baseController - コントローラクラスのbaseを生成
	// Coreの外部向けメソッドのみを継承させる
	Core.baseController = function() {
		this.config = Core.config;
		this.load = new Core.Loader(this);
	};

	// Core.baseController.prototype継承
	Core.baseController.prototype = {
			event : Core.event,
			image : Core.image,
			ut : Core.utility,
			ua : Core.ua,
			alias : Core.alias,
			union : Core.union,
			ready : Core.ready,
			json : Core.JSON,
			bench : Core.benchMark,
			uri : Core.uri,
			lang : Core.language,
			toString : function() { return '[class Controller]';},
			execute : function(method) {
				this[method || 'index']();
			}
	};

	// Core.baseModel - モデル基底クラス
	Core.baseModel = function() {
		this.config = Core.config;
		this.load = new Core.Loader(this);
		this.load.ajax();
	};

	Core.baseModel.prototype = {
			event : Core.event,
			ut : Core.utility,
			alias : Core.alias,
			ua : Core.ua,
			json : Core.JSON,
			uri : Core.uri,
			lang : Core.language,
			toString : function() { return '[class Model]';}
	};

	// Module - ロードされたモジュールの実行と格納スタック
	var Module = function(method) {
		var M = win[CORE_CONFIG.globalNames.Module];
		if (!M[method]) {return;}
		var ag = arguments, args = M[method].length, k = 1, m = [];
		for (k; k < ag.length; k++) { m.push(ag[k]);}
		// 内部モジュールの引数は3つまで渡せるがやや原始的な方法...もっと良い方法を探る
		//return new M[method].apply(M[method], m);
		if (args === 3) {return new M[method](ag[1] || undefined, ag[2] || undefined, ag[3] || undefined);}
		else if (args === 2) {return new M[method](ag[1] || undefined, ag[2] || undefined);}
		else if (args === 1) {return new M[method](ag[1] || undefined);}
		else {return new M[method]();}
	};

	// Module.attach - モジュールをこのオブジェクトに追加する
	Module.attach = function(attachObj) {
		if (ut.isFunction(attachObj)) {
			Module[sf.getRealName(attachObj)] = attachObj;
		} else if (ut.isObject(attachObj)) {
			for (var i in attachObj) { if(!i.isPrototypeOf(attachObj)) {Module[i] = attachObj[i];}}
		}
	};

	//Module.onReady - モジュール利用可能状態を通知
	Module.onReady = function(name) {
		var mr = STACK.MODULE_READY, mrf = STACK.MODULE_READY_FUNC;
		if (!mr[name] || mr[name] === false) {mr[name] = true;}
		if (mrf[name]) {
			if (ut.isArray(mrf[name])) {
				var len = mrf[name].length, i = 0;
				for (i; i< len; i++) {mrf[name][i]();}
				mrf[name] = [];
			} else {mrf[name]();}
		}
	};

	// Module.ready - モジュール利用可能時に実行する関数を格納する
	Module.ready = function(name, fn) {
		var mr = STACK.MODULE_READY, mrf = STACK.MODULE_READY_FUNC;
		if (mr[name] && mr[name] === true) {fn();}
		else {
			if (!mrf[name]) {mrf[name] = [fn];}
			else {mrf[name].push(fn);}
		}
	};

	// DOMモジュール定義
	var DOM = function(elm, p) {
		if (!elm || elm === doc ) {return DOM.__extend(doc, p || null);}
		else if (elm instanceof xElement) { return elm;}
		else if (elm && elm.nodeType && elm.nodeType === 1) {return DOM.__extend(elm, p || null);}
		else if (elm.item || ut.isArray(elm)) { return new xNodeList(elm, p || null);} // NodeList
		else {return new xNodeList(DOM.__getElementsBySelector(elm, p || null));}
	};
	DOM.cid = 0; DOM.did = 0; DOM.eid = 0; DOM.ignoreID = 0;

	// DOM検索系メソッド定義。これらはクロスブラウザメソッドを定義したラッパーオブジェクトを返す

	// DOM.id - 要素のid検索
	DOM.id = function(val) {
		if (typeof val != 'string') {return null;}
		var node = doc.getElementById(val);
		return (node && !node.__ignore) ? DOM.__extend(node) : null;
	};

	// DOM.className - 要素のclass検索
	DOM.className = function(val, tag, bool) {
		var nl, r = [], nllen, i = 0;
		if (doc.getElementsByClassName) {
			// 組み込みメソッドがあれば実行
			nl = doc.getElementsByClassName(val); nllen = nl.length;
			for (i; i < nl.length; i++) {
				if (!nl[i].__ignore) { r.push(nl[i]);}
			}
			return new xNodeList(r);
		} else {
			// 無ければ自力で検索
			nl = doc.getElementsByTagName(tag || '*'); r = []; nllen = nl.length;
			if (Core.ua.IE && !Core.ua.IE9) {
				// IEは「*」で検索するとテキストノードも拾うので、要素ノードだけを選択させる処理を追加
				for (i; i < nllen; i++) {
					if (nl[i].nodeType && nl[i].nodeType === 1 && !nl[i].__ignore) {r.push(nl[i]);}
				}
			} else {
				for (i; i < nllen; i++) {
					if (!nl[i].__ignore) {r.push(nl[i]);}
				}
				// それ以外は通常通りの処理
				//r = Array.prototype.slice.call(nl);
			}
			return (bool) ? DOM.__isClass(r, val) : new xNodeList(DOM.__isClass(r, val));
		}
	};

	// DOM.tag  - 要素のタグ名検索
	DOM.tag = function(val, r) {
		var root = (r) ? r : doc, res = [];
		var nl = root.getElementsByTagName(val), nllen = nl.length;
		// IEは「*」で検索するとテキストノードも拾うので、要素ノードだけを選択させる処理を追加
		if (Core.ua.IE && !Core.ua.IE9) {
			for (var i = 0; i < nllen; i++) {
				if (nl[i].nodeType && nl[i].nodeType === 1 && !nl[i].__ignore) {res.push(nl[i]);}
			}
		} else {
			for (var i = 0; i < nllen; i++) {
				if (!nl[i].__ignore) {res.push(nl[i]);}
			}
			//res = Array.prototype.slice.call(nl);}
		}
		return new xNodeList(res);
	};

	// DOM.name - 要素のname属性検索
	DOM.byName = function(val) {
		var nl = doc.getElementsByName(val), nllen = nl.length, res = [];
		for (var i = 0; i < nllen; i++) { if (!nl[i].__ignore) {res.push(nl[i]);}}
		return new xNodeList(res);
	};

	// DOM.attribute - 要素の属性検索
	DOM.attribute = function(att, val, tag, r) {
		var root = r || doc, res = [];
		var nl = root.getElementsByTagName(tag || '*'), nllen = nl.length;
		if (Core.ua.IE && !Core.ua.IE9) {
			for (var i = 0; i < nllen; i++) {
				if (nl[i].nodeType && nl[i].nodeType == 1 && !nl[i].__ignore) {res.push(nl[i]);}
			}
		} else {
			for (var i = 0; i < nllen; i++) {
				if (!nl[i].__ignore) {res.push(nl[i]);}
			}
			//res = Array.prototype.slice.call(nl);
		}
		return new xNodeList(DOM.__isAttr(res, att, val));
	};

	// DOM.css - 要素のCSSセレクタ検索
	// 第に２引数をtrueにすると独自検索で取得する（ちょっと遅くなります）
	DOM.css = function(val, orig) {
		return new xNodeList(DOM.__getElementsBySelector(val, doc, orig || undefined));
	};

	// DOM.origCSS - 要素のCSSセレクタ検索（独自定義の属性で取得する場合はこっちを使用する。ちょっと遅くなります）
	DOM.origCSS = function(val) {
		return new xNodeList(DOM.__getElementsBySelector(val, doc, true));
	};

	// DOM.__isClass - 要素リストのうち指定classNameを持つ物のみを抽出
	// @access private
	DOM.__isClass = function(el, c) {
		var res = [], len = el.length, cName = ' ' + c + ' ', e, cl;
		for (var i = 0; i < len; i++) {
			e = el[i]; cl = ' ' + e.className + ' ';
			if (cl.indexOf(cName) !== -1) { res.push(e);}
		}
		return res;
	};

	// DOM.__isAttr - 要素リストのうち指定attibuteを持つ物のみを抽出
	// @access private
	DOM.__isAttr = function(el, at, val) {
		var res = [], len = el.length, e ,v, atName;

		if (at == 'class') {return DOM.__isClass(el, val);}
		atName = (at == 'for') ? 'htmlFor' : (at == 'colspan') ? 'colSpan' : (at == 'rowspan') ? 'rowSpan' : at;
		for (var i = 0; i < len; i++) {
			e = el[i]; v = e.getAttribute((Core.ua.is('I6|I7')) ? atName :(atName == 'htmlFor') ? atName : atName.toLowerCase());
			if (!v || v != val) {continue;}
			res.push(e);
		}
		return res;
	};

	// DOM.create - 要素を生成
	DOM.create = function(tag, att) {
		var e = DOM.__extend(doc.createElement(tag), true);
		if (att && ut.isObject(att)) { for (var i in att) {if (!i.isPrototypeOf(att)) {e.attr(i, att[i]);}}}
		return e;
	};
	// DOM.__extend - 要素を内包するラッパーオブジェクトに変換
	// これらの要素はSTACK.ELEMENTSに保持される
	DOM.__extend = function(e, bool) {
		var __eid, st = STACK.ELEMENTS, exd;
		if (e.__eid) { __eid = e.__eid;} else { __eid = e.__eid = ++DOM.eid;}
		if ((__eid in st) && st[__eid][0] === e) {return st[__eid][1];}
		exd = new xElement(e, bool || false);
		st[__eid] = [e, exd];
		return exd;
	};

	// DOM.__extendArray - ノードリスト拡張
	DOM.__extendNodeList = function (nodeList) {
		return new xNodeList(nodeList);
	};

	// DOM.__wrappedExtendNodeList - ノードリスト拡張
	function xNodeList(arr, parent) {
		this.nodeList = arr;
		this.length = arr.length;
		this.is = (arr.length > 0);
		this.parent = parent || null;
	};

	// DOM.__wrappedExtendNodeList.prototype - ノードリストのラッパークラスprototype
	xNodeList.prototype = {
		extended : true,
		__wd : false,
		// foreach - ノードリストに対し関数をループで適用
		foreach : function(fn) {
			var e = this.nodeList, len = e.length;
			for (var i = 0; i < len; i++) {
				if (fn.call(e[i], i) === false) {
					break;
				}
			}
			return this;
		}, // enable method chain
		// get - ノードリストのn番目の要素を取得
		get : function(num, extend) {
			var e = this.nodeList[num], ex = (extend === false) ? false : true;
			return (ex) ? DOM.__extend(e, this) : e;
		}, // enable method chain (xElement)
		// getRange - 範囲指定して要素を抽出
		getRange : function(st, ed) {
			var ret = [], e = this.nodeList, len = ed ? (ed > this.length ? this.length : ed) : this.length, i = st || 0;
			for (; i < len; i++) { ret.push(e[i]); }
			return new xNodeList(ret, this);
		}, // enable method chain (ranged xNodeList)
		// first - ノードリストの一番最初の要素を抽出
		first : function(extend) {
			return (extend && extend === false) ? this.nodeList[0] : DOM.__extend(this.nodeList[0], this);
		}, // enable method chain (xElement)
		// last - ノードリスとの一番最後の要素を抽出
		last : function(extend) {
			return (extend && extend === false) ? this.nodeList[this.length - 1] : DOM.__extend(this.nodeList[this.length - 1], this);
		}, // enable method chain (xElement)
		// event - 再帰的にイベントを設定
		event : function(type, fn, b) {
			var e = this.nodeList, len = e.length;
			for (var i = 0; i < len; i++) {
				Core.event.set(e[i], type, fn, (b) ? b : e[i]);
			}
			return this;
		}, // enable method chain
		// Cevent - コントローラにバインドしたイベント
		Cevent : function(type, fn) {
			var e = this.nodeList, len = e.length;
			for (var i = 0; i < len; i++) {
				Core.event.set(e[i], type, fn, SYSTEM.CONTROLLER);
			}
			return this;
		}, // enable method chain
		// unevent - イベント削除
		unevent : function(type, fn) {
			var e = this.nodeList, len = e.length;
			for (var i = 0; i < len; i++) {
				Core.event.remove(e[i], type, fn || undefined);
			}
			return this;
		}, // enable method chain
		// addClass : 一括class付与
		addClass : function(val) {
			var e = this.nodeList, len = e.length;
			for (var i = 0; i < len; i++) {
				this.get(i, true).addClass(val);
			}
			return this;
		}, // enable method chain
		// removeClass : 一括class削除
		removeClass : function(val) {
			var e = this.nodeList, len = e.length;
			for (var i = 0; i < len; i++) {
				this.get(i, true).removeClass(val);
			}
			return this;
		}, // enable method chain
		// rollBack - 検索基点元に戻る
		rollBack : function() {return this.parent;},
		// with - parentがある場合、その要素も含める
		'with' : function() {
			if (this.parent && !this.__wd) {
				this.length = this.nodeList.push(this.parent.get());
				this.__wd = true;
			}
			return this;
		},
		// withOut - with()を実行していた場合、parentを含めなくする
		withOut : function() {
			if (this.__wd) {
				this.nodeList.pop();
				this.length--;
				this.__wd = false;
			}
			return this;
		},
		// squeeze - 要素を絞り込む
		// @param type - 抽出する形式
		//   supprots ... css : CSSルール
		//                      attr : 属性
		//                      prop : プロパティ
		// @param val - "name[!]=val"の形式の文字列
		squeeze : function(type, val) {
			var o, sp = val.split('='), n = sp[0], v = sp[1], fl = ut.grep(n, '!'), f;
			if (fl) { n = n.slice(0, n.length - 1);}
			// TODO : implement
		},
		toString : function() { return '[class xNodeList]';}
	}; // end DOM.__wrappedExtendNodeList.prototype

	// DOM.__wrappedExtend - 要素のラッパーオブジェクトクラス
	function xElement(e, parent) {
		this.is = !!e;
		this.extended = true;
		this.element = e;
		this.tag = e.tagName ? e.tagName.toLowerCase() : '';
		this.parentE = parent || null;
		e.normalize && e.normalize();
	};

	// DOM.__wrappedExtend.prototype - 要素のラッパーオブジェクトクラスのprototype拡張
	// 「return this」の記述のあるものはメソッドチェーンが可能である
	xElement.prototype = {
		// get - 素のエレメントを返す
		get : function() {	return this.element;},  // disable method chain
		// toString - overwrite クラス名セット
		toString : function() { return '[class xElement]';},
		// rollBack - 取得元に戻る
		rollBack : function() { return this.parentE;},
		// __getCID - 内部メソッド、連番IDを返す
		__getCID : function() { return this.element.__eid;},
		// ignore : - 一時的に要素検索にかからなくする。IEなど要素を追加してエミュレートする要素に実行すると便利か
		ignore : function() {
			this.element.__ignore = ++DOM.ignoreID;
			return this;
		},
		// recognize - ignoreから復帰する
		recognize : function() {
			try { delete this.element.__ignore;}
			catch(e) { this.element.__ignore = undefined;}
		},
		// absDimension - 要素の絶対位置とサイズを返す
		absDimension : function() {
			var info = ut.getAbsPosition(this.element), w = this.readStyle('width', true), h = this.readStyle('height', true);
			info.width = (w === 'auto' || w === 0 || !w) ? this.element.offsetWidth : w;
			info.height = (h === 'auto' || h === 0 || !h) ? this.element.offsetHeight : h;
			return { top : info.y, left : info.x, width : info.width, height : info.height, right : info.x + info.width, bottom : info.y + info.height };
		},
		// defaultSize - 要素本来の高さを取得
		defaultSize : function() {
			return ut.getDefaultWH(this);
		},
		// attr - 属性追加
		attr : function(name, val) {
			// 第一引数がObjectであれば繰り返し実行
			if (ut.isObject(name)) {
				for (var i in name) {if (!i.isPrototypeOf(name)) {arguments.callee.apply(this, [i, name[i]]);}}
			} else {
				if (ut.isFunction(this['__extendAttr' + name])) {
					var res = this['__extendAttr' + name](this.element, val);
					if (res) { return this;}
				}
				Core.attr.toStrictAttr(this.element, name, val, 'set');
			}
			return this; // enable method chain
		},
		// readAttr - 属性取得（これは一般的なHTMLの属性値のみを取得する。固有のプロパティはpropメソッドで取得すべきである）
		readAttr : function(name) {
			if (ut.isArray(name)) {
				var len = name.length, res = {};
				for (var i = 0; i < len; i++) {
					res[name[i]] = arguments.callee.apply(this, [name[i]]);
				}
				return res; // hash
			} else {
				return Core.attr.toStrictAttr(this.element, name);
			}
		},
		// removeAttr - 要素の属性削除
		removeAttr : function(name) {
			if (ut.isArray(name)) {
				for (var i = 0; i < name.length; i++) {
					arguments.callee.apply(this, [name[i]]);
				}
			} else {
				var ie = Core.ua.IE, ie67 = Core.ua.is('I6|I7'), p = name.toLowerCase();
				switch (p) {
				case 'class' : this.removeClass(); break;
				case 'className' : this.removeClass(); break;
				case 'for' : name = (ie) ? 'htmlFor' : name; break;
				case 'colspan' : name = (ie67) ? 'colSpan' : name; break;
				case 'rowspan' : name = (ie67) ? 'rowSpan' : name; break;
				case 'accesskey' :name = (ie67) ? 'accessKey' : name; break;
				case 'tabindex' : name = (ie67) ? 'tabIndex' : name; break;
				case 'frameborder' : name = (ie67) ? 'frameBorder' : name; break;
				default : break;
				}
				if (name == 'style') {
					if (ie) {this.element.style.cssText = '';} else {this.element.removeAttribute('style');}
				} else {
					this.element.removeAttribute(name);
				}
			}
			return this; // enable method chain
		},
		// addClass - 要素のclass属性を追加
		addClass : function(val) {
			if (!val) {return this;}
			var c = this.element.className;
			if (this.hasClass(val)) {return this;}
			this.element.className = (c === '') ? val : c + ' ' + val;
			return this; // enable method chain
		},
		// removeClass - 要素のclass属性を削除 引数があればその値のみを削除、引数が無ければ全削除
		removeClass : function(val) {
			if (!val) {
				this.element.className = '';
				return this;
			}
			var c = this.element.className;
			var a = c.split(' '), len = a.length;
			for (var i = 0; i < len; i++) {
				if (a[i] === val) {a.splice(i, 1);}
			}
			this.element.className = a.join(' ');
			return this; // enable method chain
		},
		// hasClass - 要素が指定したclassNameを持つか判定
		hasClass : function(val) {
			var c = ' ' + this.element.className + ' ', v = ' ' + val + ' ';
			return (ut.grep(c, v)); // disable method chain
		},
		// replaceClass - class属性を置き換える
		replaceClass : function(grep, sed) {
			if (!this.hasClass(grep)) { return this;}
			return this.removeClass(grep).addClass(sed);
		},
		// toggleClass - classを交互に付けたり外したりする
		toggleClass : function(c) {
			if (!c) {return this;}
			return this[this.hasClass(c) ? 'removeClass' : 'addClass'](c);
			//if (this.hasClass(c)) {this.removeClass(c);} else {this.addClass(c);}
			//return this;
		},
		// event - 要素にイベントをセットする。callは第三引数で決める。
		event : function(type, fn, b) {
			// 第三引数がtrueならばバインド指定、falseなら要素自身からcallされる。デフォルトfalse
			Core.event.set(this.element, type, fn, b || this.element);
			return this; // enable method chain
		},
		// once - 一度だけ実行するイベントを設定。callも選択可能
		once : function(type, fn, b) {
			Core.event.once(this.element, type, fn, b || this.element);
			return this;
		},
		// Cevent - 要素にイベントをセット。ハンドラはコントローラからcallされる
		Cevent : function(type, fn) {
			Core.event.set(this.element, type, fn, SYSTEM.CONTROLOLER);
			return this; // enable method chain
		},
		// unevent - イベントハンドラ削除
		unevent : function(type, fn) {
			Core.event.remove(this.element, type, fn || undefined);
			return this; // enable method chain;
		},
		// customEvent - カスタムイベントセット
		customeEvent : function(type, fn, b) {
			Core.event.custom(this.element, type, fn, b || this.element);
			return this;
		},
		// unCustom - カスタムイベント削除
		unCustomEvent : function(type, fn) {
			Core.event.removeCustom(this.element, type, fn || undefined);
			return this;
		},
		// dispatch - イベント起動
		dispatch : function(type, data, dataType) {
			Core.event.fire(this.element, type, data, dataType);
			return this;
		},
		// live - jQueryっぽい動的イベント監視
		live : function(type, fn, bind) {
			Core.event.live(this.element, type, fn, bind || undefined);
			return this;
		},
		// inText - テキストノードを挿入
		inText : function(t) {
			//var m = (mode) ? mode : 'all'; // all : 全置換, after : 後ろに追加, before : 前に追加
			var now = (Core.ua.IE) ? this.element.innerText : this.element.textContent;
			// 少し手間がかかるが、改行コードに応じて<br />を生成して改行処理をつける
			var nreg = /\n/, rreg = /\r/, rnreg = /\r\n/;
			var ar = (rnreg.test(t)) ? t.split(rnreg) : (rreg.test(t)) ? t.split(rreg) : (nreg.test(t)) ? t.split(nreg) : [t], arlen = ar.length;
//			if (m == 'all') { // 全置換
				this.element[Core.ua.IE ? 'innerText' : 'textContent'] = '';
				//if (Core.ua.IE) {this.element.innerText = '';} else {this.element.textContent = '';}
				for (var i = 0; i < arlen; i++) {
					this.element.appendChild(doc.createTextNode(ar[i]));
					if (ar[i + 1]) {
						this.element.appendChild(doc.createElement('br'));
					}
				}
/*			} else if ( m == 'after') { // 後方連結
				for (var i = 0; i < arlen; i++) {
					this.element.appendChild(doc.createTextNode(ar[i]));
					if (ar[i + 1]) {
						this.element.appendChild(doc.createElement('br'));
					};
				};
			} else if (m == 'before') { // 前方連結
				(Core.ua.IE) ? this.element.innerText = '' : this.element.textContent = '';
				this.element.appendChild(doc.createTextNode(now));
				for (var i = 0; i < arlen; i++) {
					this.element.appendChild(doc.createTextNode(ar[i]));
					if (ar[i + 1]) {
						this.element.appendChild(doc.createElement('br'));
					};
				};
			};
*/			this.element.normalize();
			return this; // enable method chain
		},
		// getText - 要素の中身をテキストで取得
		getText : function() {
			return this.element.textContent || this.element.innerText;
			//return (Core.ua.IE) ? this.element.innerText : this.element.textContent; // disable method chain
		},
		// html - 要素にHTMLを挿入
		html : function(html, pos) {
			var mode = pos || 'all';
			var now = this.element.innerHTML;
			if (mode === 'all') {
				this.element.innerHTML = html;
			} else if (mode === 'before') {
				if (this.element.insertAdjacentHTML) {this.element.insertAdjacentHTML('afterBegin', html);} else {this.element.innerHTML = html + now;}
			} else if (mode === 'after') {
				if (this.element.insertAdjacentHTML) {this.element.insertAdjacentHTML('beforeEnd', html);} else {this.element.innerHTML = now + html;}
			}
			return this; // enable method chain
		},
		// getHTML - HTMLテキストを取得
		getHTML : function() {
			var a = arguments, alen = a.length, val = this.element.innerHTML.toString();
			if (alen === 2) {return val.slice(a[0], a[2]);}
			else if (alen === 1) { return val.slice(a[0]); }
			else {return val;}
		},
		// appendTo - 要素自身を引数にappendChildする。位置は第二引数によって決まる
		appendTo : function(elm, mode) {
			var to = mode || 'default', t;
			if (elm) {
				t = (elm instanceof xElement) ? DOM(elm).get() : elm;
			}else if( Core.ua.__positionKey && !this.element.parentNode) {
				if(this.element.__isFixed) {
					t = (this.element.__isFixed === SYSTEM.POSITION_FIXED) ? doc.body : IEFIX.body || doc.body;
					//this.element.style.position == 'absolute';
				} else {
					var p = this.readStyle('position'), v = SYSTEM.POSITION[(p != '') ? p : 'static'];
					t = (v === SYSTEM.POSITION_FIXED) ? doc.body :IEFIX.body || doc.body;
				}
			} else {
				t = (Core.ua.__positionKey) ? IEFIX.body : doc.body;
			}
			if (to === 'before') { t.parentNode.insertBefore(this.element, t);}
			else if (to === 'after') {
				if (t.parentNode.lastChild === t) {t.parentNode.appendChild(this.element);}
				else {t.parentNode.insertBefore(this.element, t.nextSibling);}
			} else {t.appendChild(this.element);}
			return this; // enable method chain
		},
		// append - 文字列、または要素を可能な限りNodeとしてappendChildする
		append : function(str) {
			var t, n;
			if (str instanceof xElement) { this.element.appendChild(str.get());}
			else if (str.nodeType) { this.element.appendChild(str);}
			else if (ut.isString(str)) {
				var d = doc.createElement('div');
				d.innerHTML = str;
				while(d.firstChild !== null) {
					if (!d.firstChild) { break;} // guard
					this.element.appendChild(d.firstChild);
				}
			} else { throw Error('invalid argument.');}
			return this;  // enable method chain
		},
		// prependTo - 要素自身を引数の一番始めにappendChildする
		prependTo : function(elm) {
			if (elm.nodeType && elm.nodeType !== 1) { throw Error('invalid argument.');return;}
			var t = (elm instanceof xElement) ? elm.get() : elm;
			t.insertBefore(this.element, t.firstChild);
			return this;  // enable method chain
		},
		// prepend - 文字列、または要素を可能な限り一番始めのNodeとしてappendChildする
		prepend : function(str) {
			var t, n;
			if (str.nodeType && str.nodeType !== 1) { throw Error('invalid argument.');return;}
			if (str instanceof xElement || str.nodeType ) { this.element.insertBefore(DOM(str).get(), this.element.firstChild);}
//			else if (str.nodeType) { this.element.appendChild(str);}
			else if (ut.isString(str)) {
				var d = doc.createElement('div');
				d.innerHTML = str;
				while(d.lashChild !== null) {
					if (!d.lastChild) { break;} // guard
					this.element.insertBefore(d.lastChild, this.element.firstChild);
				}
			} else { throw Error('invalid argument.');}
			return this;  // enable method chain
		},
		// wrap - 要素を引数のタグ要素でラッピングする
		wrap : function(tag) {
			var e = doc.createElement(tag);
			if (Core.ua.IE) {
				this.element.applyElement(e, 'outside');
			} else {
				var r = doc.createRange();
				r.selectNode(this.element);
				r.surroundContents(e);
				r.detach();
			}
			return DOM(e); // return wrapped xElement
		},
		// unwrap - 要素の親ノードを取り除く
		unwrap : function() {
			var frg = doc.createDocumentFragment(), p = this.element.parentNode, pp = p.parentNode, c, len, i, stack = [];
			if (!p || p === doc.body) { return this; } // no wrap
			c = p.childNodes; len = c.length;
			for (i = 0; i < len; i++) {
				if (!c[i]) { break;}
				if (c[i].nodeType === 3) { continue;}
				stack.push(c[i]);
				frg.appendChild(c[i]);
			}
			pp.removeChild(p); len = stack.length;
			pp.appendChild(frg);
			return this;
		}, // enable method chain
		// copy : cloneNode互換
		copy : function(bool) {
			var b = (bool) ? bool : false;
			var clone = this.element.cloneNode(b);
			// id属性の重複を避ける
			if (this.element.id) {clone.id = this.element.id + '_clone';}
			// IEは検索後のプロパティも複製するようなので、liveイベント用に一度nullをセット
			if (clone.__cid) {clone.__cid = null;}
			// ignore属性も解除
			if (clone.__ignore) { clone.__ignore = undefined;}
			clone.__eid = ++DOM.eid;
			return DOM.__extend(clone); // enable method chain(of clone)
		},
//		// hasClone - コピーした要素が存在するかどうか
//		hasClone : function() {
//			return (this.element.__cid in STACK.ELEMENTS); // disable method chain
//		},
		// remove - 要素をツリーから削除する
		remove : function() {
			//var from = (t) ? (t.extended) ? t.get() : t : this.element.parentNode;
			if (this.element.parentNode) {this.element.parentNode.removeChild(this.element);}
			return this; // enable method chain
		},
		// removeAll - 要素の子要素を全て削除
		removeAll : function() {
			var ch = this.element.childNodes, len = ch.length; i = 0;
			for (i ; i < len; i++) { this.element.removeChild(ch[i]);}
		},
		//isEmpty - 子要素を持つかどうかを判定
		isEmpty : function() { return !this.element.hasChildNodes();},
		// replace - 要素置換
		replace : function(to) {
			DOM(to).parent().get().replaceChild(this.element, DOM(to).get());
			return this;
		},
		// addStyle - 要素にCSSを設定する
		addStyle : function(name, val) {
			// 第一引数がObjectなら繰り返し実行
			if (Core.utility.isObject(name)) {
				for (var i in name) { if (!i.isPrototypeOf(name)) {arguments.callee.apply(this, [i, name[i]]);}}
			} else {
				var p = Core.systemFunc.camel(name), bgreg = /^url\s?\(/, ie = (Core.ua.IE && !Core.ua.IE9);

				/* hook extend function exists*/
				if (ut.isFunction(this['__extendStyle' + p])) {
					var res = this['__extendStyle' + p](this.element, val);
					if (res ) {return this;}
				}
				/* end hook extend function */

				switch (p) {
				case 'float' : this.element.style[(Core.ua.is('I6|I7')) ? 'styleFloat' : 'cssFloat'] = val; break;
				case 'opacity' :
					if (ie) {
						if (this.element.style.hasLayout !== true) {this.element.style.zoom = '1';}
						this.element.style.filter = 'alpha(opacity=' + Math.round(val * 100) + ')';
					} else {
						this.element.style.opacity = val;
					}
					break;
				case 'filter':
					if (Core.ua.IE) {this.element.style[p] = val;}
				break;
				case 'position':
					if (Core.ua.__positionKey) {
						var cp = this.readStyle('position'), v = SYSTEM.POSITION[val], cv = SYSTEM.POSITION[cp] || SYSTEM.POSITION_STATIC, parent = this.element.parentNode;
						if (parent) {
							if (v === SYSTEM.POSITION_FIXED) {
								// fixedの場合、bodyにappend
								this.appendTo(doc.body);
								val = 'absolute';
							} else if (parent === doc.body) {
								this.appendTo(STACK.BODY);
							}
						}
						this.element.__isFixed = v;
					}
					this.element.style.position = val;
					break;
				case 'backgroundImage' : this.element.style.backgroundImage = (bgreg.test(val)) ? val : 'url(' + val + ')'; break;
				default : this.element.style[p] = val; break;
				}
			}
			return this; // enable method chain
		},
		// hide - 要素を非表示にする
		hide : function() {
			this.element.style.display = 'none';
			return this;
		},
		// isHidden - 要素の表示状態をbooleanで返す
		isHidden : function() { return (this.readStyle('display') === 'none');},
		// isAnimate - アニメーション中かどうかを判定
		isAnimate : function() { return !!this.__animate;},
		// show - 要素を表示する
		show : function(mode) {
			if (mode) {
				switch (mode) {
				case 'i' : this.element.style.display = 'inline'; break;
				case 'b' :  this.element.style.display = 'block'; break;
				case 'ib' :  // inline-block
					// inline-blockの対応状況によって分岐
					if (Core.ua.is('I6|I7')) {
						this.addStyle({display : 'inline-block', zoom : 1}); // for IE6 or IE7
					} else if (Core.ua.Firefox) {
						if (Core.ua.FirefoxV > 3.0) {this.element.style.display = 'inline-block';}
						else {this.element.style.display = '-moz-inline-box'; this.element.style.display = 'inline-block';}
					} else {
						this.element.style.display = 'inline-block';
					}
				break;
				case 'tbCell' :
					this.element.style.display = (!Core.ua.is('I6|I7')) ? 'table-cell' : 'block';  // not Impl for IE6 or IE7
				break;
				default : this.element.style.display = 'block'; break;
				}
			} else {
				this.element.style.display ='block';
			}
			this.element.style.visibility = 'visible';
			return this;
		},
		// toggleShow - 表示・非表示を交互に切り替える
		toggleShow : function() {
			if (this.isHidden()) {this.show();} else {this.hide();}
			return this;
		},
		// visible - 要素を可視化する（displayは変更しない）
		visible : function() {
			this.element.style.visibility = 'visible';
			return this;
		},
		// isVisible - 要素の可視状態をbooleanで返す
		isVisible : function() { return (this.element.style.visibility === 'visible');},
		// invisible - 要素を不可視にする（displayは変更しない）
		invisible : function() {
			this.element.style.visibility = 'hidden';
			return this;
		},
		// toggleV - 要素の可視・不可視を切り替える
		toggleV : function() {
			var v = this.element.style.visibility;
			this.element.style.visibility = (v === 'visible') ? 'hidden' : 'visibile';
			return this;
		},
		// readStyle - 要素のCSSを取得する。第二引数がtrueの場合、値は可能な限り数値（小数含む）で返る
		readStyle : function(name, parse) {
//			if (name === 'font' || name === 'background' || name === 'border') {
//				return this.__readMixedProp(arguments.callee(this, [name, this.__mixedProp(name)]));
//			}
			if (Core.utility.isArray(name)) {
				var res = {}, len = name.length;
				for (var i = 0; i < len; i++) {
					res[name[i]] = arguments.callee.apply(this, [name[i], parse || undefined]);
				}
				return res;
			}
			var p = name, subp = Core.systemFunc.camel(name), n = parse || false, ie = Core.ua.IE, val, st, pr;

			if (subp === 'float') {subp = (Core.ua.is('I6|I7')) ? 'styleFloat' : 'cssFloat';}
			if (this.element.style[subp]) {
				// 直接CSSオブジェクトから取得できた場合
				st = this.element.style;
				if (Core.ua.IE && !Core.ua.IE9) {return this.__read(st, subp, n);}
				else {
					var v = this.element.style[subp];
					if(n) {
						pr = parseFloat(v);
						if (subp === 'backgroundImage') {return v.replace(/url\(["']?(.+?)["']?\)/, '$1');}
						else {return (isNaN(pr)) ? 0 : pr;}
					} else {
						return v;
					}
				}
			} else {
				// 無ければ、IEならcurrentStyle, その他はgetComputedStyleから取得を試みる
				if (this.element.currentStyle) {
					st = this.element.currentStyle;
					return this.__read(st, subp, n);
				} else if (this.element.runtimeStyle) {
					st = this.element.runtimeStyle;
					return this.__read(st, subp, n);
				} else {
					var gcs, now, r;

					if (win.getComputedStyle) { gcs = getComputedStyle;}
					else if (doc.defaultView && doc.defaultView.getComputedStyle) { gcs = doc.defaultView.getComputedStyle;}
					p = Core.systemFunc.deCamel(p);
					now = gcs(this.element, '');
					r = now.getPropertyValue(p);
					if (n) {
						pr = parseFloat(r);
						if (subp === 'backgroundImage') {return r.replace(/url\(["']?(.+?)["']?\)/, '$1');}
						else {return (isNaN(pr)) ? 0 : pr;}
					} else {
						return r;
					}
				}
			}
		}, // disable method chain
		// __read - readStyleの処理をまとめたもの
		// @access private
		__read : function(st, subp, parse) {
			switch (subp) {
			case 'backgroundImage' : return (parse) ? st[subp].replace(/url\((.*?)\)/, '$1').replace(/['"]/g, '') : st[subp];
			case 'opacity' :
				var al = (/^alpha\(/.test(st.filter)) ? parseInt(st.filter.replace(/^alpha\(opacity=([0-9]+)\)?/, '$1'), 10) / 100 : 1;
				if (parse) {
					return (isNaN(parseFloat(al))) ? al : parseFloat(al);
				} else {
					return al;
				}
				break;
			case 'zIndex' :
				if (parse) {
					return (isNaN(parseInt(st[subp], 10))) ? st[subp] : parseInt(st[subp], 10);
				} else {
					return st[subp];
				}
				break;
			default :
				if(parse) {
					return (isNaN(parseInt(st[subp], 10))) ? (st[subp] == 'auto') ? 0 : st[subp] : parseInt(st[subp], 10);
				} else {
					return st[subp];
				}
			}
		},
		// removeStyle - 特定のインラインCSSプロパティを削除する
		removeStyle : function(prop) {
			if (Core.utility.isArray(prop)) {
				var len = prop.length;
				for (var i = 0; i < len; i++) {arguments.callee.apply(this, [prop[i]]);}
				return this;
			} else {
				var st = (Core.ua.is('I6|I7')) ? this.element.getAttribute('style').cssText.toLowerCase() : this.element.style.cssText.toLowerCase();
				var pp = Core.systemFunc.deCamel(prop);
				if (!st) {return this;}
				if (st.indexOf(pp) !== -1) {
					var sts = st.split(';'), stslen = sts.length;
					for (var j = 0; j < stslen; j++) {
						if (sts[j].indexOf(pp) !== -1) {
							sts.splice(j, 1);
							break;
						}
					}
					if (Core.ua.is('I6|I7')) {
						this.element.style.cssText = sts.join(';');
					} else {
						this.element.setAttribute('style', sts.join(';'));
					}
				}
				return this; // enable method chain
			}
		},
		// getValue - input系のvalue属性のgetter
		getValue : function() {
			if (!/input|select|textarea|option/.test(this.tag)) {return;}
			return this.element.value;
		},
		// setValue - input系のvalue属性のsetter
		setValue : function(val) {
			if (!/input|select|textarea|option/.test(this.tag)) {return;}
			this.element.value = val;
			return this;
		},
		// prop - 要素ごとに存在するプロパティにアクセス
		prop : function(pName, val) {
			// valがあればsetter、なければgetter
			if (val) {
				this.element[pName] = val;
				return this;
			} else{
				return (pName in this.element) ? this.element[pName] : null;
			}
		},
		// getScroll - スクロール量を取得
		getScroll : function() {
			return { x : this.element.scrollLeft, y : this.element.scrollTop};
		},
		// method - 要素ごとに存在するメソッドを実行
		method : function(method) {
			if (method) {
				if (!(method in this.element)) {
					throw new TypeError(method + 'is not a function.');
				} else {
					this.element[method]();//.apply(this.element, arg);
				}
			}
			return this;
		}, // enable method chain;
		// getParentForm - この要素が属する<form>要素を遡って取得
		getParentForm : function() {
			var e = this.element, reg = /form/i;
			while (e && e !== doc.body) {
				if (reg.test(e.tagName)) { return DOM(e, this); }
				e = e.parentNode;
			}
			return null;
		}, // disabled method chain
		// parent - 親要素取得
		parent : function(level) {
			var l = level || 1, i = 0, p = this.element;
			while (p && ++i <= l) {
				p = p.parentNode;
			}
			return p ? DOM(p, this) : null;
		},
		// children - 子要素一括取得、numがあれば指定番号の要素を取得
		children : function(num) {
			var c = this.element.childNodes, clen = c.length, res = [];
			for (var i = 0; i < clen; i++) {
				if (c[i].nodeType === 1) { res.push(c[i]); }
			}
			if (typeof num === 'undefined') {
				return new xNodeList(res, this);
			}
			return (num >= 0 && /[0-9]+/.test(num.toString())) ? (res[num]) ? DOM(res[num], this) : null : new xNodeList(res, this);
		},
		// first - 一番最初の子要素を取得
		first : function() {
			return this.__getFLNP(this.element.firstChild, true);
		},
		// last - 一番最後の子要素を取得
		last : function() {
			return this.__getFLNP(this.element.lastChild, false);
		},
		// next - 次のエレメントを取得
		next : function() {
			return this.__getFLNP(this.element.nextSibling, true);
		},
		// prev - 前のエレメントを取得
		prev : function() {
			return this.__getFLNP(this.element.previousSibling, false);
		},
		// __ getFLNP - 要素取得統括メソッド
		__getFLNP : function(e, type) {
			if (!e) { return null; }
			if (e.nodeType === 1) { return DOM(e); }
			while (e) {
				if (e.nodeType === 1) {break;}
				e = (type === true) ? e.nextSibling : e.previousSibling;
			}
			if (!e) { return null; }
			return DOM(e, this);
		},
		 // detect - 現在の要素を基点としてCSSセレクタで検索
		detect : function(val /* val = CSS Selector */) {
			var list = DOM.__getElementsBySelector(val, this.element);
			return new xNodeList(list, this);
		},
		 // detectC - 現在の要素を基点としてCSSセレクタで検索(非標準の属性も検索するが、やや動作は遅くなる)
		detectC : function(val /* val = CSS Selector */) {
			var list = DOM.__getElementsBySelector(val, this.element, true);
			return new xNodeList(list, this);
		},
		// getOne - detect -> get(0)のショートカット
		getOne : function(val /* val = CSS Selector */) {
			var list = DOM.__getElementsBySelector(val, this.element);
			return new xElement(list[0], this);
		},
		// isExpr - 与えられたCSSセレクタで取得される要素に含まれるかどうか
		isExpr : function (expr) {
			var list = DOM.__getElementsBySelector(expr), len = list.length, i = 0;
			for (i; i < len; i++) {
				if (this.element === list[i]) { return true;}
			}
			return false;
		},
		// isFirst - 要素が親要素からみた最初の要素であるかどうかを返却
		isFirst : function() {
			return (this.parent().first().get() === this.element);
		},
		// isLast - 要素が親要素から見た最後の要素であるかどうかを返却
		isLast : function() {
			return (this.parent().last().get() === this.element);
		},
		// serialize - form要素の内容をシリアライズ
		serialize : function() {
			if (this.tag !== 'form') {return;}
			return ut.serializeForm(this.element);
		},
		// getContext - CanvasRenderingContext2Dオブジェクト取得
		getContext : function(dim) {
			if (this.tag !== 'canvas' || !this.element.getContext) {throw new TypeError('getContext supports canvas element only.');}
			return this.element.getContext(dim);
		}
	};

	// DOM.__getElementsBySelector用内部メソッド
	var DOMUT = {
		// getNextElNode - 要素の次のエレメントを取得する（textNode除く）
		getNextElNode : function (node) {
			node.normalize();
			if (!node || !node.nextSibling) {return null;}
			if (node.nextSibling.nodeType !== 1) {return arguments.callee(node.nextSibling);}
			return node.nextSibling;
		},
		// getParseRule - セレクタの検索方法を取得
		getParseRule : function(text) {
			for (var pattern in SelectorCSSExp) {
				if (!pattern.isPrototypeOf(SelectorCSSExp)) {
					if (SelectorCSSExp[pattern].test(text)) {
						return pattern;
					}
				}
			}
			return false;
		},
		// getFilter - 擬似クラス特定
		getFilter : function(val) {
			for (var i in SelectorsFilterExp) {
				if (!i.isPrototypeOf(SelectorsFilterExp)) {
					if (SelectorsFilterExp[i].test(val)) {return i;}
				}
			}
			return false;
		},
		// IE6-7用特殊属性定義
		IE67bugAttr : 'class,for,colspan,rowspan,accesskey,tabindex,cellspacing,cellpadding,frameborder',
		// @note
		// IEの速度低下の原因は処理の度にRegExpの生成が発生する為
		// 必要な正規表現は一括定義しておく方が良さそう
		getValueExp : {
			attPseudoReg : /[\^~\$\*\|!]$/,
			attGetReg : /^[a-zA-Z0-9]+\[(.*?)\]$/
//			simpleQueryReg : /^[0-9a-zA-Z\s]+$/,
//			simpleQueryConma : /^[0-9a-zA-Z\s\,]+$/
		},
		nextJudgeReg : /([\+>~])/g
	};

	// DOM.__fallbackQuery - トップレベルから見たCSSクエリをビルドする
	DOM.__fallbackQuery = function(e /* native HTMLElement */) {
		if (e === doc || e === win) {return '';} // document and window have not tagName
		var cl = e.className, c = (ut.grep(cl, ' ')) ? cl.split(' ')[0] : cl, resQ = [e.tagName.toLowerCase() + ((c === '') ? '' : '.' + c)];
		while (e.parentNode !== doc) {
			e = e.parentNode;
			resQ.push(e.tagName.toLowerCase());
		}
		return resQ.reverse().join(' > ');
	};

	// DOM.__getElementsBySelector - 要素をCSSセレクタで検索する
	DOM.__getElementsBySelector = function(value, root, orig){
		var _doc = (root) ? root : doc, cache = {};
		if (!(_doc.__cid)) {_doc.__cid = ++DOM.cid;}
		var trim = function(str) { return (typeof str == 'string') ? str.replace(/^\s*(.*)/, '$1').replace(/(.*)\s*$/, '$1') : str;};
		var value = trim(value.replace(DOMUT.nextJudgeReg, ' $1 '));
		//document.querySelectorAllが使用できれば、それを使う
		// 2010/03/31 modified div[example=1]などの独自定義のAttributeはquerySelectorAllの検索対象外となり、正確に取得できない。
		// それを回避するために第三引数origを定義。これが渡された時は下の独自パースで検索する（querySelectorAllは使用しない）
		// getAttribute('example')では取得出来るのに＞＜Selectors APIは未実装な部分が多いのか、それとも独自属性を検索しないのが正しい仕様なのか。
		// 追記：IE9はIE8のquerySelectorAllと同じ実装のようなので、特に考慮しない。

		if (_doc.querySelectorAll && !orig) {
			if (Core.ua.IE8 || Core.ua.IE9) { //IE8,9 はメソッドはサポートしているが、nth-childとlast-child、!を含むトークンは例外を投げる
				if (/[\(|\)]|only\-child|last\-child|!/.test(value) === false)  {
					var res = _doc.querySelectorAll(value), reslen = res.length, ret = [];
					for (var i = 0; i < reslen; i++) {
						if (!res[i].__ignore) {ret.push(res[i]);}
					};
					return ret;
				};
			} else {//他のサポートブラウザについては、'!', ':contains' のトークンを含むクエリはエラーを投げる(2009/11/24現在)
				if (/!/.test(value) === false && value.indexOf(':contains') === -1) {
					var res = _doc.querySelectorAll(value), reslen = res.length, ret = [];
					for (var i = 0; i < reslen; i++) {
						if (!res[i].__ignore) {ret.push(res[i]);}
					};
					return ret;
					//return Array.prototype.slice.call(_doc.querySelectorAll(value));
				};
			};
		};
		//else : Selector APIが使えない場合は、自力でパースして取得
		// separateLoop - セレクタ検索メイン関数
		var separateLoop = function(arr) {
			if (typeof arr == 'string') {var arr = [arr];}
			var tmpElm, rootElm = [((root) ? root : _doc)], mode, last = false, arrlen = arr.length, qcn;

			for (qcn= 0; qcn < arrlen; qcn++) {
				if (/^[>+~]/.test(trim(arr[qcn]))) continue;
				var q = trim(arr[qcn]), next = (arr[qcn+1]) ? trim(arr[qcn+1]) : null;
				// 2009/12/22 added フィルターをかける
				if (q.indexOf(':') !== -1) {
					var sp = q.split(':'), t = sp[0], f = sp[1];
				} else {
					var t = q, f = false;
				}
				res = DOMUT.getParseRule(t), rootlen = rootElm.length;
				switch(res) {
				case 'AttributeSelector':

					var tag = t.slice(0, t.indexOf('['));
					if (tag == '') tag = '*';
					var getAttrWithCond = function(e, cond) {
						// condition definition
						var ret, n, val, sep, attV, condlen = cond.length, ie67 = Core.ua.is('I6|I7');
						for (var i = 0; i < condlen; i++) {
							subCond = (cond[i].indexOf('=') !== -1) ? cond[i].split('=') : [cond[i], ''];
							if (/[\^~\$\*\|!]$/.test(subCond[0])) {
								n = subCond[0].slice(0, subCond[0].length - 1); val = subCond[1].replace(/['"]/g, ''); sep = subCond[0].slice(-1);
							} else {
								n = subCond[0]; val = subCond[1]; sep = 'has';
							};
							if (sep == 'has' && val == '') { // ex a[href]
								switch (true) {
								case (n == 'class' || n == 'className') : ret = (ie67) ? (e.className != '') : e.hasAttribute('class'); break;
								case (n == 'for'): ret = (ie67) ? (e.htmlFor != '') : e.hasAttribute('for'); break;
								case (n == 'colspan') : ret = (ie67) ? (e.colSpan != '') : e.hasAttribute('colspan'); break;
								case (n == 'rowSpan') : ret = (ie67) ? (e.rowSpan != '') : e.hasAttribute('rowspan'); break;
								case (n == 'accesskey') :ret = (ie67) ? (e.accessKey != '') : e.hasAttribute('accesskey'); break;
								case (n == 'tabindex') : ret = (ie67) ? (e.tabIndex != '') : e.hasAttribute('tabindex'); break;
								default : ret = (ie67) ? (e[n] != '') : e.hasAttribute(n); break;
								};
							} else { // ex a[class^=exa]
								// IE用に検索属性を正規化
								switch (true) {
								case (/class|className/.test(n)): attV = e.className; break;
								case (n == 'for'): attV = e.htmlFor; break;
								case (n == 'colspan') : attV = (ie67) ? e.colSpan : e.getAttribute('colspan'); break;
								case (n == 'rowSpan') : attV = (ie67) ? e.rowSpan : e.getAttribute('rowspan'); break;
								case (n == 'accesskey') : attV = (ie67) ? e.accessKey : e.getAttribute('accesskey'); break;
								case (n == 'tabindex') : attV = (ie67) ? e.tabIndex : e.getAttribute('accesskey'); break;
								case (n == 'frameborder') : attV = (ie67) ? e.frameBorder : e.getAttribute('frameborder');break;
								default : attV = e.getAttribute(n); break;
								};
								if (!attV) {
									ret = false;
								} else {
									switch (sep) {
									case '^': ret = (new RegExp('^' + val).test(attV) === true); break;
									case '~': ret = (attV.indexOf(val) !== -1); break;
									case '$': ret = (new RegExp(val + '$').test(attV) === true); break;
									case '*': ret = (attV.indexOf(val) !== -1); break;
									case '!': ret = (attV.indexOf(val) === -1); break;
									case '|': ret = (attV.indexOf(val) !== -1); break;
									case 'has': ret = (val != '') ? (attV == val) : (!attV) ; break;
									};
								}
							};
							if (ret === false)return false;
						};
						return true;
					};
					var tp = t.replace(/^[a-zA-Z0-9]+\[(.*?)\]$/, '$1'), attributes = tp.split(']['), attlen = attributes.length, tmp, totalElms = [], cached = {}, atllen, __cid;
					for (var k = 0; k < rootlen; k++) {
						var atl = rootElm[k].getElementsByTagName(tag);
						atllen = atl.length;
						if (atllen === 0)return [];
						for (var i = 0; i < atllen; i++) {
							if (getAttrWithCond(atl[i], attributes) === true) {
								__cid = (atl[i].__cid) ? atl[i].__cid : ++DOM.cid;
								if (__cid in cached)continue;
								else{
									totalElms.push(atl[i]);
									cached[__cid] = atl[i];
								};
							};
						};
					};
					tmp = totalElms;
					break; // break of Attribute Selectors
				case 'universal':
					var tmp = [];
					for (var k = 0; k < rootlen; k++) {
						var e = rootElm[k].getElementsByTagName('*'), elen = e.length;
						for (var c = 0; c < elen; c++) tmp.push(e[c]);
					};
					//tmpElm = tmp;
					break; // break of universal Selector
				case 'classSelector':
					t = t.split(".");
					var tmp = [], len, clcid;
					if (doc.getElementsByClassName) {
						for (var k = 0; k < rootlen; k++) {
							var e = rootElm[k].getElementsByClassName(t[1]), len = e.length;
							if (len == 0) continue;
							for (var i = 0; i < len; i++) {tmp.push(e[i]);}
						}
					}
					if (t[0] == '') { // タグ名が無い時
						for (var k = 0; k < rootlen; k++) {
							var e = rootElm[k].getElementsByTagName('*'), len = e.length, cl = ' ' + t[1] + ' ';
							if (len == 0) continue;
							for (var c = 0; c < len; c++) {
								//if (e[c].nodeType !== 1) { continue;}
								if ((' ' +(e[c].className || '') + ' ').indexOf(cl) !== -1) tmp.push(e[c]);
							};
						};
					} else {
						for (var k = 0; k < rootlen; k++) {
							var e = rootElm[k].getElementsByTagName(t[0]), len = e.length, cl = ' ' + t[1] + ' ';
							if (len == 0) continue;
							for (var c = 0; c < len; c++) {
								if ((' ' + (e[c].className || '') + ' ').indexOf(cl) !== -1) tmp.push(e[c]);
							};
						};
					};
					if (tmp.length == 0)return [];
					//tmpElm = tmp;
					break; // break of ClassSelector
				case 'idSelector':
					t = t.split("#");
					var tmp = [], e = doc.getElementById(t[1]);
					if (e == null)return [];
					if (t[0] != '') {
						if (e.tagName.toLowerCase() == t[0]) tmp.push(e);
					} else tmp.push(e);
					if (tmp.length == 0)return [];
					//tmpElm = tmp;
					break; // break of idSelector
				default :
					switch(mode) {
					case 'adjacent':
						if (rootElm.length == 0) return [];
						else {
							var tmp = [];
							for (var k = 0; k < rootlen; k++) {
								var e = DOMUT.getNextElNode(rootElm[k]);
								if (!e) continue;
								if (e.tagName && e.tagName.toLowerCase() == t) tmp.push(e);
							};
							if (tmp.length == 0)return [];
						//	tmpElm = tmp;
						};
						break; // break of normal tag selector adjacent
					case 'child':
						var tmp = [];
						for (var k = 0; k < rootlen; k++) {
							var e = rootElm[k].getElementsByTagName(t), elen = e.length;
							if (elen == 0)continue;
							for (var l = 0; l < elen; l++) {
								if (e[l].parentNode == rootElm[k])tmp.push(e[l]);
							};
						};
						//tmpElm = tmp;
						break; // break of normal tag selector child
					case 'general':
						if (rootElm == null) return [];
						else {
							var tmp = [], cache = {}, done = 'general' + ++DOM.did;
							for (var k = 0; k < rootlen; k++) {
								var e = rootElm[k], p = e.parentNode;
								if (!p.__done || p.__done !== done) {
									while(e != null) {
										if (e.nodeType == 1) {
											if (e.tagName.toLowerCase() == t) {
//												e.__cid = (e.__cid) ? e.__cid : ++DOM.cid;
//												if (!(e.__cid in cache)) {
													tmp.push(e);
//													cache[e.__cid] = e;
//												};
											};
										};
										e = e.nextSibling;
									};
									p.__done = done;
								};
							};
							if (tmp.length == 0) return [];
							//tmpElm = tmp;
						};
						break; // break of normal tag selector general
					default :
						var tmp = [];
						cache = {};
						for (var k = 0; k < rootlen; k++) {
							var e = rootElm[k].getElementsByTagName(t), elen = e.length;
							if (elen == 0)continue;
							for (var l = 0; l < elen; l++) {
//								e[l].__cid = (e[l].__cid) ? e[l].__cid : ++DOM.cid;
//								if (e[l].__cid in cache)continue;
								tmp.push(e[l]);
//								cache[e[l].__cid] = e[l];
							};
						};
						//tmpElm = tmp;
						break;
					}
				break;
				} // end of first switch.

				if (f !== false) {
					tmpElm = DOM.__selectElementsByFilter(tmp, f);
				} else {
					// タグ名ふるい落とし
					var len = tmp.length, cache = {}, tmpElm = [];
					for (var s = 0; s < len; s++) {
						tmp[s].__cid =  (tmp[s].__cid) ? tmp[s].__cid : ++DOM.cid;
						if ((tmp[s].__cid in cache) || tmp[s].__ignore) continue;
						else {
							tmpElm.push(tmp[s]);
							cache[tmp[s].__cid] = tmp[s];
						}
					}
				}
				if (next == null) {
					return tmpElm;
				}
				else if (next.indexOf('+') !== -1) { mode = 'adjacent';}
				else if (next.indexOf('~') !== -1) { mode = 'general';}
				else if (next.indexOf('>') !== -1) { mode = 'child';}
//				else if (/^[\+]/.test(next)) mode = 'adjacent';
//				else if (/^[~]/.test(next)) mode = 'general';
//				else if (/^[>]/.test(next)) mode = 'child';
				if (tmpElm.length > 0) {
					rootElm = tmpElm;
					continue;
				}
				else  {
					return tmpElm;
				}
			} // end CSSExp Loop
		}; // end function separateLoop scope.
		var returns = [], text = value.split(","), textlen = text.length;
		for (var i = 0; i < textlen; i++) {
			if (text[i] == '')continue;
			var pointer = trim(text[i]).split(/\s/), ret = separateLoop(pointer), retlen = ret.length;
			if (retlen > 0) {
				for (var m = 0; m < retlen; m++) {
					returns.push(ret[m]);
				};
			};
		};
		return returns;
	};

	// DOM.__selectElementsByFilter - 取得した要素に対してフィルタリングする
	DOM.__selectElementsByFilter = function(nodeList, filter) {
		if (!filter) {return nodeList;}
		var doc = document, type = DOMUT.getFilter(filter), tmp, done, cache = {}, n = nodeList, nlen = nodeList.length, E = SelectorsFilterExp, rule,
				i, j, k, e, c, a, p,r, num, m, t, cnt, txt;
		if (!type) {return n;}
		switch (type) {
		case 'root': return doc.getElementsByTagName('html')[0];
		case 'nthChild':
			rule = filter.replace(/nth-child\((.*?)\).*$/, '$1'); done = ++DOM.did; tmp = []; var first, offset;
			if (rule === 'n') {return n;}
			else {
				if (rule === 'odd') {first = 2; offset = 1;}
				else if (rule === 'even') {first = 2; offset = 0;}
				else if  (/[0-9]*[\\n][\+\-][0-9]*$/.test(rule)) { // (ex:2n+1)
					var sp = rule.split('n'); first = sp[0]; offset = sp[1].slice(1);
				} else if (rule.indexOf('n') !== -1) {
					first = (rule.indexOf('n') !== 0) ? rule.slice(0, rule.indexOf('n')) : 1; offset = 0;
					//var first = parseInt(n), offset = 0; break;
				} else {
					if (isNaN(parseInt(rule, 10))) {
						throw new SyntaxError();
					} else {
						first = 0; offset = parseInt(rule, 10);
					}
				}
				for (c = 0; c < nlen; c++) {
					e = n[c]; var parent = e.parentNode;
					if (parent && (!parent.__done || parent.__done !== done)) {
						cnt = 0;
						for (a = parent.firstChild; a; a = a.nextSibling) {
							if (a.nodeType === 1) {a.__cid = ++cnt;}
						}
						parent.__done = done;
					}
					if (first === 0) {
						if ((e.__cid - offset) === 0) {tmp.push(e);}
					} else {
						if (((e.__cid - offset) % first === 0) && ((e.__cid - offset) / first >= 0)) {tmp.push(e);}
					}
				}
			}
			return tmp;
		case 'nthLastChild' :
			rule = filter.replace(/nth-last-child\((.*?)\).*$/, '$1'); tmp = [];
			if (nlen === 0) {return [];}
			for (k = 0; k < nlen; k++) {
				if (isNaN(parseInt(rule, 10))) {
					throw new SyntaxError();
				} else{
					num = parseInt(rule, 10);
					if (num === 0) {num = 1;}
					childs.reverse();
				}
				tmp.push(childs[num - 1]);
			}
			return tmp;
		case 'nthOfType' :
			rule = filter.replace(/nth-of-type\((.*?)\).*$/, '$1'); tmp = []; r = parseInt(rule, 10);
			if (isNaN(r)) {
				throw new SyntaxError();
			}
			done = ++DOM.did;
			for (k = 0; k < nlen; k++) {
				e = n[k]; p = e.parentNode;
				if (p && (!p.__done || p.__done || p.__done != done)) {
					cnt = 0;
					for (i = p.firstChild; i; i = i.nextSibling) {
						if (i.nodeType === 1 && i.tagName.toLowerCase() === e.tagName.toLowerCase) {
							++cnt;
							if (cnt === r) {tmp.push(e);}
						}
					}
					p.__done = done;
				}
			}
			return tmp;
		case 'nthLastOfType' :
			rule = filter.replace(/nth-last-of-type\((.*?)\).*$/, '$1'); tmp = []; r = parseInt(rule, 10);
			if (isNaN(r)) {
				throw new SyntaxError();
			}
			done = ++DOM.did;
			for (k = 0; k < nlen; k++) {
				e = rootElm[k]; p = e.parentNode;
				if (p && (!p.__done || p.__done || p.__done != done)) {
					cnt = 0;
					for (i = p.lastChild; i; i = i.previousSibling) {
						if (i.nodeType === 1 && i.tagName.toLowerCase() === e.tagName.toLowerCase()) {
							++cnt;
							if (cnt === r) {tmp.push(e);}
						}
					}
					p.__done = done;
				}
			}
			return tmp;
		case 'firstChild' :
			tmp = []; done = ++DOM.did; cache = {};
			if (nlen === 0) {return [];}
			for (c = 0; c < nlen; c++) {
				p = n[c].parentNode; e = n[c];
				if (p){
					for (a = p.firstChild; a; a = a.nextSibling) {
						if (a.nodeType === 1) {
							if (a === e) {tmp.push(e);}
							p.__done = done;
							break;
						}
					}
				}
			}
			return tmp;
		case 'lastChild':
			tmp = []; done = ++DOM.did; cache = {};
			if (nlen === 0) {return [];}
			for (c = 0; c < nlen; c++) {
				p = n[c].parentNode; e = n[c];
				if (p) {
					for (a = p.lastChild; a; a = a.previousSibling) {
						if (a.nodeType === 1) {
							if (a === e) {tmp.push(e);}
							p.__done = done;
							break;
						}
					}
				}
			}
			return tmp;
		case 'onlyChild':
			tmp = []; cache = {};
			for (c = 0; c < nlen; c++) {
				p = n[c].parentNode; var ef = p.firstChild, el = p.lastChild;
				while (ef.nodeType !== 1) {
					if (!ef) {
						cache[p.__cid] = p;
						break;
					}
					ef = ef.nextSibling;
				}
				while (el.nodeType !== 1) {
					if (!el){
						cache[p.__cid] = p;
						break;
					}
					el = el.previousSibling;
				}
				if (ef === n[c] && el === n[c]) {
					tmp.push(e);
					cache[p.__cid] = p;
				}
			}
			return tmp;
		case 'firstOfType':
			tmp = []; done = ++DOM.did;
			for (k = 0; k < nlen; k++) {
				e = n[k]; p = e.parentNode;
				if (p && (!p.__done || p.__done || p.__done != done)) {
					for (i = p.firstChild; i; i = i.nextSibling) {
						if (i.nodeType === 1 && i.tagName.toLowerCase() === e.tagName.toLowerCase()) {
							tmp.push(e);
							break;
						}
					}
					p.__done = done;
				}
			}
			return tmp;
		case 'lastOfType':
			tmp = []; done = ++DOM.did;
			for (k = 0; k < nlen; k++) {
				e = n[k]; p = e.parentNode;
				if (p && (!p.__done || p.__done || p.__done != done)) {
					for (i = p.lastChild; i; i = i.previousSibling) {
						if (i.nodeType === 1 && i.tagName.toLowerCase() === e.tagName.toLowerCase()) {
							tmp.push(e);
							break;
						}
					}
					p.__done = done;
				}
			}
			return tmp;
		case 'onlyOfType':
			tmp = []; done = ++DOM.did;
			for (k = 0; k < nlen; k++) {
				e = n[k]; p = e.parentNode;
				if (p && (!p.__done || p.__done || p.__done != done)) {
					cnt = 0;
					for (i = p.firstChild; i; i = i.nextSibling) {
						if (i.nodeType === 1 && i.tagName.toLowerCase() === e.tagName.toLowerCase()) {
							++cnt;
						}
					}
					if (cnt === 1) {tmp.push(e);}
					p.__done = done;
				}
			}
			return tmp;
		case 'empty':
			tmp = []; cache = {};
			for (i = 0; i < nlen; i++) {
				p = n[i];
				if (p.firstChild === null && p.childNodes.length === 0 && (!p.__cid || !(p.__cid in cache))) {
					tmp.push(p);
					p.__cid = ++DOM.cid;
					cache[p.__cid] = p;
				}
			}
			return tmp;
		case 'contains' :
			tmp = []; cache = {}; txt = filter.replace(/contains\((.*?)\)$/, '$1').replace(/['"]/g, '');
			for (m = 0; m < nlen; m++) {
				p = n[m]; t = (Core.ua.IE) ? p.innerText : p.textContent;
				if (t.indexOf(txt) !== -1) {
					p.__cid = (p.__cid) ? p.__cid : ++DOM.cid;
					if (p.__cid in cache) {continue;}
					else {
						tmp.push(p);
						cache[p.__cid] = p;
					}
				}
			}
			return tmp;
		case 'not' :
			tmp = []; cache = {}; txt = filter.replace(/not\((.*?)\)$/, '$1').replace(/['"]/g, '');
			var to = DOM.__getElementsBySelector(txt), tolen = to.length, flag, __cid, o;
			for (m = 0; m < nlen; m++) {
				flag = true;
				for (o = 0; o < tolen; o++) {
					if (n[m] === to[o]) {
						flag = false;
						continue;
					}
				}
				if (flag === true) {
					__cid = (n[m].__cid) ? n[m].__cid : ++DOM.cid;
					if (__cid in cache) {continue;}
					else {
						tmp.push(n[m]);
						cache[__cid] = n[m];
					}
				}
			}
			return tmp;
		default : return [];
		}
	};

	// Timerクラス - タイマー管理クラス
	var Timer = function(fn) {
		this.fn = this.__fnToReg(fn);
		this.timerId = CoreTimer.pushStack(this);
		return this;
	};
	Timer.prototype = {
		stop : function() { CoreTimer.stop(this.timerId); },
		start : function() { CoreTimer.start(); },
		exec : function() { this.fn(); },
		__fnToReg : function(fn) {
			var f, that = this;
			if (ut.isString(fn)) {
				f = SYSTEM.GLOBAL_EVAL(fn);
			} else if (ut.isFunction(fn)) {
				f = fn;
			} else {
				throw Error('first argument must be function!');
			}
			f.prototype.stop = that.stop;
			return f;
		}
	};

	// CoreTimer - 内部処理タイマーオブジェクト
	var CoreTimer = {count : 0, stack : [], play : false, globalTimerId : null};
	CoreTimer.pushStack = function(obj /* Timer instance */) {
		var cn = this.count;
		this.stack[cn] = [obj, cn, false];
		this.count++;
		return cn;
	};
	CoreTimer.isPlaying = function() {
		return this.play;
	};
	CoreTimer.start = function() {
		if (this.isPlaying() === true) {return;}
		this.play = true;
		CoreTimer.globalTimerId = win.setInterval(function() {
			var len = CoreTimer.stack.length, t;
			for (var i = 0; i < len; i++) {
				t = CoreTimer.stack[i];
				if (t && t[2] === false) {t[0].exec();}
			}
		},( Core.ua.IE7 || Core.ua.IE8) ? 5 : 10);
	};
	CoreTimer.stop = function(id) {
		if(!this.stack[id]) {return;}
		this.stack[id][2] = true;
		var len = this.stack.length, flag = true;
		for (var i = 0; i < len; i++) {
			if (this.stack[i][2] === true) {continue;}
			else {flag = false;}
		}
		if (flag === true) {this.clear();}
	};
	CoreTimer.clear = function() {
		win.clearInterval(CoreTimer.globalTimerId);
		CoreTimer.play = false;
		CoreTimer.stack = [];
		CoreTimer.count = 0;
	};

	/* 組み込みモジュール定義 これらはLoaderからインスタンスされるべきである */

	var layerStack = [];
	// Core.modules.layer - レイヤー生成モジュール
	Core.modules.layer = function(bool) {
		if (STACK.GLOBAL_LAYER !== null) {
			if (bool && bool === true) {STACK.GLOBAL_LAYER.show();}
			var res = Core.union({}, STACK.GLOBAL_LAYER); // copy layer statement
			res.opacity = 0.6;
			res.layerNumber = 'flLayer' +new Date;
			return res;
		} else {
			this.layerNumber = 'flLayer' +new Date;
			this.opacity = 0.6;
			this.showFlag = (bool && bool === true) ? true : false;
			this.layer = (Core.ua.IE6) ? this.__initLayerIE6() : this.__initLayer();
			if (this.showFlag) {this.show();}
			this.selectElements = null; // for IE6

			 STACK.GLOBAL_LAYER = this;
			 return this;
		}
	};
	Core.modules.layer.prototype = {
		__initLayer : function() {
			var z = SYSTEM.CURRENT_ZINDEX;
			var d = DOM.create('div')
						.attr('id', 'fl_layer')
						.appendTo()
						.addStyle({position : 'fixed', width : '100%', height : '100%', opacity : 0.6, backgroundColor : '#000', display : 'none', top : '0px', left : '0px'})
						.addStyle('zIndex', (z > 10000) ? (z + 1) : 1000);
			return d;
		},
		__initLayerIE6 : function() {
//			var sc = Core.utility.getScrollPosition();
			var z = (SYSTEM.CURRENT_ZINDEX > 10000) ? SYSTEM.CURRENT_ZINDEX + 1 : 1000;
			var d = DOM.create('div')
						.attr('id', 'fl_layer')
						.addStyle({position : 'absolute', width : '100%' , height :doc.body.clientHeight + 'px', overflow : '', opacity : 0.6, backgroundColor : '#000', display : 'none', top : 0 + 'px', left : 0 + 'px'})
						.appendTo(win.IEFIX ? IEFIX.body : doc.body)
						.addStyle('zIndex', z).addStyle('position', 'fixed');
			//Core.event.set(win, 'resize', this.__resizeFix, this);
			if (win.IEFIX) {
				this.__coveredBody = doc.getElementById('fl_cover_body');
			}
			return d;
		},
		isHidden : function() { return (this.showFlag) ? false : true;},
		setOpacity : function(op) {
			this.opacity = op;
			this.layer.addStyle('opacity', op);
			return this;
		},
		__isOverlay : function(e) { // IE6 only
			var z = DOM(e).readStyle('zIndex');
			return !(z === 'auto' || z > 10000);
		},
		__resize : function() {
			if (this.guard) return;
			this.guard = true;
			var wh = ut.getContentSize();
			this.layer.addStyle({width : wh.width + 'px', height : wh.height + 'px'});
			this.guard = false;
		},
		show : function(bool, callback) {
//			if (this.__isOtherShow()) { return;}
			if (Core.ua.IE6) {
				if (!Core.ua.__positionKey) {
					doc.body.style.height = '100%';
					doc.body.style.width = '100%';
					doc.documentElement.style.overflow = 'hidden';
				} else {
					Core.event.set(win, 'resize', this.__resize, this);
				}

				// invisible select element
				var that = this;
				if (Core.ua.__positionKey) {
					this.selectElements = DOM(doc.getElementById('fl_cover_body').getElementsByTagName('select')).foreach(function(){if (that.__isOverlay(this)) { this.style.visibility = 'hidden';}});
				} else {
					this.selectElements = DOM('select').foreach(function() { if (that.__isOverlay(this)) { this.style.visibility = 'hidden';}} );
				}
			}
			if (bool) {
				var that = this;
				Animation.appear(this.layer, {from : 0, to : that.opacity, speed : 0.1, easing : 100, callback : function(){
					if (ut.isFunction(callback)) {callback();}
					that.layer.show();
					}});
			} else {
				this.layer.addStyle('opacity', this.opacity);
				this.layer.show();
				if (ut.isFunction(callback)) {callback();}
			}
			this.showFlag = true;
			layerStack.push(this.layerNumber);
		},
		hide : function(bool, callback) {
//			if (!this.__isOtherShow()) { return;}
			if (Core.ua.IE6 && !bool) {
				// visible select element
				if (this.selectElements && this.selectElements.length > 0) {
					this.selectElements.foreach(function(){this.style.visibility = 'visible';});
				}
				if (!Core.ua.__positionKey) {
					doc.body.style.height = 'auto';
					doc.body.style.width = 'auto';
					doc.documentElement.style.overflow = 'auto';
				} else {
				//	Core.event.remove(win, 'resize', this.__resize);
				}
			}
			var that = this;
			if (bool) {
				Animation.fade(this.layer, {from : this.opacity, to : 0, speed : 0.1, easing : 0, callback: function(){
					if (Core.ua.IE6) {that.selectElements.foreach(function(){this.style.visibility = 'visible';});}
					that.layer.hide();
					if (ut.isFunction(callback)) {callback();}
				}});
			} else {
				this.layer.hide();
				if (ut.isFunction(callback)) {callback();}
			}
			this.showFlag = false;
			var ls = layerStack, len = ls.length, i = 0;
			for (i; i < len; i++) {
				if (ls[i] === this.layerNumber) { ls.splice(i, 1);}
			}
			if (ls.length === 0) { ls = [];}
		},
		getLayerObject : function(){ return this.layer;},
		showLoading : function(className) {
			if (className) {
				this.layer.addClass(className);
			} else {
				this.layer.addStyle({'backgroundImage' : CORE_CONFIG.APPPATH + 'fl_images/loader.gif',
											 'backgroundPosition' : 'center center',
											 'backgroundRepeat' : 'no-repeat'
											});
			}
		},
		hideLoading : function(className) {
			if (className) {
				this.layer.removeClass(className);
			} else {
				this.layer.removeStyle(['background-image', 'background-position', 'background-repeat']);
			}
		},
		__isOtherShow : function() {
			return (layerStack.length === 1 && layerStack[0] === this.layerNumber);
		},
		toString : function() { return '[module Layer]';}
	}; // end Core.module.layer.prototype

	// 計算系メソッドのショートカット
	var mr = Math.round, mc = Math.ceil, pi = win.parseInt, mabs = Math.abs, sin = Math.sin, cos = Math.cos,
		mp = Math.pow;

	// 数値のみのCSSプロパティマッピング
	var NumericCSS = { opacity : 1, zIndex : 1};

	// Animation - エフェクトオブジェクト定義
	//var Animation = {};


	// Animation.__animate : CSSパラメータ指定アニメーション
	var Animation = function(e, prop, extra) {
		var elm = e.get(), opt = Core.union({speed : 30, easing : 0, callback : null, delay : 0}, extra || {});
		var obj = {
			width : elm.style.pixelWidth || elm.offsetWidth,
			height : elm.style.pixelHeight || elm.offsetHeight,
			top : elm.style.pixelTop || elm.offsetTop,
			left : elm.style.pixelLeft || elm.offsetLeft,
			marginTop : (function() { var mt = e.readStyle('marginTop'); return (mt !== 'auto') ? mt : 0;})(),
			marginLeft : (function() { var ml = e.readStyle('marginLeft'); return (ml !== 'auto') ? ml : 0;})(),
			visibility : e.readStyle('visibility'),
			display : e.readStyle('display'),
			position : e.readStyle('position'),
			opacity : e.readStyle('opacity', true)
		};
		if (obj.position === 'static') { e.addStyle('position', 'relative');}
		if (obj.display === 'none') { e.addStyle('display', '');}
		e.__animate = true;
		// marge IE times duration
		if (Core.ua.IE) {opt.speed /= 2;}
		var cProp = {}, defs = {}, c = 0, cEnd = opt.speed - 1, o, step, k = 0.8, deg, KE = k * opt.easing, A = 100 / k, p;
		for (p in prop) {
			var tcp = sf.camel(p), tcpv = (tcp in obj) ? obj[tcp] : e.readStyle(tcp), tcpvi = parseFloat(tcpv, 10);
			if (/opacity|zIndex/.test(tcp)) {
				cProp[tcp] = [prop[p], (prop[p] > tcpv) ? true : false, true];
				defs[tcp] = tcpv;
			} else if (!isNaN(tcpvi)) {
				cProp[tcp] = [prop[p], (prop[p] > tcpvi) ? true : false, false];
				defs[tcp] = tcpvi;
			}
		}

		var fn = function() {
			if (c++ <= cEnd) {
				step = c / cEnd;
				deg = (100 + KE) * step / (2 * KE * step + 100 - KE);
				for (var i in cProp) {
					o = defs[i] + (cProp[i][0] - defs[i]) * deg;
					if (cProp[i][1] && cProp[i][0] < o) { o = cProp[i][0];}
					else if (!cProp[i][1] && cProp[i][0] > o) { o = cProp[i][0];}
					e.addStyle(i, o + (cProp[i][2] === true ? '' : 'px'));
				}
			} else {
				this.stop();
				e.__animate = false;
				if (ut.isFunction(opt.callback)) {opt.callback.call(e.get());}
				//if (opt.returnDefault === true) {e.addStyle('opacity', info.opacity);}
				if (opt.afterHide && opt.afterHide === true) {e.hide();}
			}
		};
		(opt.delay > 0) ? setTimeout(function() {new Timer(fn).start();}, opt.delay) : new Timer(fn).start();
	};

	Animation.appear = function(elm, extra) {
		var e = DOM(elm), opt = Core.union({speed : 40, easing : 0, callback : null}, extra || {});

		e.isHidden() && e.show();

		if (Core.ua.IE7 || Core.ua.IE8) { opt.speed /= 2;}

		new Animation(e.addStyle('opacity', opt.from || 0), {opacity : opt.to || 1}, opt);
	};
	Animation.fade = function(elm, extra) {
		var e = DOM(elm), opt = Core.union({speed : 40, easing : 0, callback : null, afterHide : true}, extra || {});

		e.isHidden() && e.show();

		if (Core.ua.IE7 || Core.ua.IE8) { opt.speed /= 2;}

		new Animation(e, {opacity : opt.to || 0}, opt);
	};
	Animation.expand = function(elm, extra) {
		var e = DOM(elm), w = e.get().offsetWidth, h = e.get().offsetHeight,
				opt = Core.union({mode : 'wh', dest : 'center', width : w, height : h, speed : 40, easing : 0, callback : null}, extra || {}),
				defml = e.readStyle('marginLeft', true), defmt = e.readStyle('marginTop', true), ml, mt;

		if (defml === 'auto') { defml = e.get().offsetLeft;}
		if (defmt === 'auto') { defmt = e.get().offsetTop;}
		ml = (ut.grep(opt.mode, 'w')) ? (opt.dest === 'center') ? -(opt.width / 2 - w / 2)
															: (opt.dest === 'left') ? -(opt.width - w)
																: 0
																	: 0;
		mt = (ut.grep(opt.mode, 'h')) ? (opt.dest === 'center') ? -(opt.height / 2 - h / 2)
															: (opt.dest === 'left') ? -(opt.height - h)
																: 0
																	: 0;

		if (Core.ua.IE7 || Core.ua.IE8) { opt.speed /= 2;}

		new Animation(e, {width : opt.width, height : opt.height, marginTop : defmt - mt, marginLeft : defml - ml}, opt);
	};
	Animation.move = function(elm, extra) {
		var e = DOM(elm), defml = e.readStyle('marginLeft', true), defmt = e.readStyle('marginTop', true),
				opt = Core.union({left :  0, top : 0, speed : 40, easing : 0, callback : null}, extra || {});

		if (defml === 'auto') { defml = e.get().offsetLeft;}
		if (defmt === 'auto') { defmt = e.get().offsetTop;}

		if (Core.ua.IE7 || Core.ua.IE8) { opt.speed /= 2;}

		new Animation(e, {marginLeft : defml + opt.left, marginTop : defmt + opt.top}, opt);
	};
	Animation.blindUp = function(elm, extra) {
		var e = DOM(elm), opt = Core.union({mode : 'y', to : 0, speed : 40, easing : 0, callback : null}, extra || {}),
			dim = e.absDimension(), h = dim.height, w = dim.width, prop = {};

		if (ut.grep(opt.mode, 'x')) {prop.width = opt.to;}
		if (ut.grep(opt.mode, 'y')) { prop.height = opt.to;}
		e.addStyle('overflow', 'hidden');

		if (Core.ua.IE7 || Core.ua.IE8) { opt.speed /= 2;}

		new Animation(e, prop, opt);
	};
	Animation.blindDown = function(elm, extra) {
		var e = DOM(elm), opt = Core.union({from : 0, mode : 'y', speed : 40, easing : 0, callback : null}, extra || {}),dim = e.absDimension(),
		h = dim.height, w = dim.width, defs = e.defaultSize(), prop = {};

		if (ut.grep(opt.mode, 'x')) {prop.width = opt.width || defs.width;}
		if (ut.grep(opt.mode, 'y')) { prop.height = opt.height || defs.height;}
		e.addStyle('overflow', 'hidden');
		e.addStyle('height', opt.from + 'px');

		if (Core.ua.IE7 || Core.ua.IE8) { opt.speed /= 2;}

		new Animation(e, prop, opt);
	};
	Animation.centerize = function(elm, extra) {
		var e = DOM(elm), dim = e.absDimension(), opt = Core.union({speed : 40, easing : 0, callback : null}, extra || {}), pos = e.readStyle('position');
			p = ut.getCenterPosition((e.readStyle('position') === 'fixed' || (elm.__positionKey && elm__isFixed === 4)) ? false : true), prop = {};

			if (opt.targetWidth) {
				prop.width = opt.targetWidth;
				prop.marginLeft = mr(p.x - opt.targetWidth / 2) - dim.left + e.readStyle('marginLeft', true) - (opt.offsetX || 0);
			}
			if (opt.targetHeight) {
				prop.height = opt.targetHeight;
				prop.marginTop = mr(p.y - opt.targetHeight / 2) - dim.top + e.readStyle('marginTop', true) - (opt.offsetY || 0);
			}

			if (Core.ua.IE7 || Core.ua.IE8) { opt.speed /= 2;}

		new Animation(e, prop, opt);
	};
	Animation.toString = function() { return '[class Animation]';};

	if (CORE_CONFIG.globalNames.Animation !== '') { win[CORE_CONFIG.globalNames.Animation] = Animation;}
	xElement.prototype.animate = function(type, opt) {
		if (!Animation[type]) { return this;}
		Animation[type](this, opt);
		return this;
	};

	var tmpW, tmpD;
	var Connect = function(w) {
		tmpW = win, tmpD = doc;
		win = w; doc = w.document;
	};

	var disConnect = function() {
		if (!tmpW || !tmpD) { throw Error('not connected other window or frame.'); return;}
		win = tmpW; doc = tmpD;
	};

	var Controller = new Core.baseController();
	Controller.system = SYSTEM;
	Controller.Timer = Timer;
	Controller.DOM = DOM;
	Controller.ready = Core.ready;
	Controller.Module = Module;
	Controller.json = Core.JSON;
	Controller.bench = Core.benchMark;
	Controller.toString = function() { return '[class FL_BASE]';};
	Controller.connect = Connect;
	Controller.disConnect = disConnect;
	Controller.uri = Core.uri;
	Controller.Animation = Animation;

	// getInstance - CIのget_instance代替関数
	// Controllerのインスタンスを返却する
	var getInstance = function() { return Controller; };
	Core.load = new Core.Loader(Core.baseController);
	Core.load.ajax();

	// 必要なクラスをグローバルスコープに移行させる
	Core.alias('ClassExtend', Core.extend);
	Core.alias('getInstance', getInstance);
	Core.alias(CORE_CONFIG.globalNames.DOM, DOM);
	// 初期化
	Core.init();

})((new Date()).getTime(), document, window, location.href, navigator.userAgent.toLowerCase());
