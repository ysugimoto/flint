/* ========================================================================
 * @license The MIT License
 *
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * @author  Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @copyright Neo,Inc <http://neo-navi.net/>
 * @version    ,v 0.7.1
 * 
 * ========================================================================
 */

/* ========================================================================
 * Animation easing functions
 * 
 * http://www.robertpenner.com/easing/
 * 
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * Copyright © 2001 Robert Penner All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the author nor the names of contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 * =========================================================================
 */


(typeof FL_CONFIG === 'object') ? (function(initTime, doc, win, LOC, UA) {

	// 重複ロード禁止
	if (win.getInstance) {
		return;
	}

	// =================== このスコープで使う変数定義 ========================== /
	// SYSTEM : システム内部で保持するデータやフラグ
	var SYSTEM = {
		INITIAL_TIME : initTime,
		DOM_CREATE_TIME : 0,
		WINDOW_LOADED_TIME : 0,
		SSL_CONNECT : (LOC.protocol === 'https:'),
		GLOBAL_EVAL : win.eval,
		CONTROLLER : null,
		CONTROLLER_NAME  : '',
		EXEC_METHOD : null,
		METHOD_ARGUMENTS : {},
		WINDOW_LOADED : false,
		START_CONTROLLER : null,
		BENCH_MARKS : {},
		DOM_LOADED : false,
		CURRENT_ZINDEX : 1,
		XHR_RESPONSES : {
			READY_STATE : { 1 : 'LOADING', 2 : 'LOADED', 3 : 'INTERACTIVE', 4 : 'COMPLETED'},
			STATUS : {403 : 'PERMISSION ERROR', 404 : 'NOT FOUND', 500 : 'SERVER ERROR',
						503 : 'INTERNAL SERVER ERROR', 200 : 'OK', 999 : 'UNDEFINED'}
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
	},
	// STACK : 拡張xElementやxNodeList、イベントハンドラーを保持
	STACK = {
		LOADED_CORE_CLASSES : {},
		ELEMENTS : {},
		EVENT_HANDLERS : [],
		LOADED_FUNCS : [],
		DOM_LOADED_FUNCS : [],
		INSTANCED_API : {},
		CONFIG : {},
		GLOBAL_LAYER : null,
		CAMELED_PROP : {},
		DECAMELED_PROP : {},
		API_STACK : [],
		CSS_STACK : [],
		API_READY : {},
		MODULE_READY : {},
		API_READY_FUNC : {},
		MODULE_READY_FUNC : {},
		BENCH_MARKS : {},
		AJAX_EVENTS : [],
		AJAX_QUEUE : [],
		DEFFERD : {}
	},
	// 内部取り込み用CONFIGオブジェクト
	CORE_CONFIG = {},
	// ループ用変数
	I,
	// 拡張エレメントインデックスID
	EXID = 0,
	// 検索回避ID
	ignoreID = 0,
	// 状態管理ID
	DEFFERD_ID = 0,
	// ========================= グローバルメソッド等のalias ============== /
	head = doc.head || doc.getElementsByTagName('head')[0],
	body,
	html = doc.documentElement || doc.getElementsByTagName('html')[0],
	pi = win.parseInt,
	pf = win.parseFloat,
	mr = Math.round,
	abs = Math.abs,
	sin = Math.sin,
	cos = Math.cos,
	mp = Math.pow,
	enc = win.encodeURIComponent,
	dec = win.decodeURIComponent,
	delay = win.setTimeout,
	unDelay = win.clearTimeout,
	interval = win.setInterval,
	unInterval = win.clearInterval,
	defWinWidth = win.innerWidth || 0,
	defWinHeight = win.innerHeight || 0,
	SSLURI, SITEURI,
	indexReg = /index\.php\/?/,
	MODULES = {},
	COMPUTED_STYLE = (doc.defaultView && doc.defaultView.getComputedStyle)
						? doc.defaultView.getComputedStyle
						: null,
	// ========================= クラスオブジェクト用内部変数 ================= /
	DOM,
	ua,
	ut,
	enables,
	Animation,
	Timer,
	connect,
	disConnect,
	Controller,
	Model,
	Base,
	IEFIX, // IE拡張用擬似グローバルオブジェクト
	CUSTOM_EVENT,
	DEFFERD_CONTROLLER,

	// ========================= 内部パラメータ =================================== /
	// Color Regexes
	COLOR_REGEX = {
		rgb : /^rgb\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\)$/,
		rgba : /^rgba\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3}),([0-9\.]+)\)$/,
		hex : /^#([0-9a-zA-Z]{3,6})$/,
		hsl : /^hsl\(([0-9]+),([0-9]+)%,([0-9]+)%\)$/,
		hsla : /^hsla\(([0-9]+),([0-9]+)%,([0-9]+)%,([0-9\.]+)\)$/
	},
	// IE6,7用属性変換マップ
	IE_MAP = {
		'class'	: 'className',
		'for'		: 'htmlFor',
		'colspan'	: 'colSpan',
		'rowspan'	: 'rowSpan',
		'acesskey'	: 'accessKey',
		'tabindex'	: 'tabIndex',
		'frameborder' : 'frameBorder'
	},
	ClassMap,
	// インライン要素マッピング用文字列
	INLINE_ELEMENTS = 'span,em,strong,dfn,cide,abbr,acronym,q,sub,sup,br,a,img,input,select,textarea,label',
	BLOCK_ELEMENTS = 'div,h1,h2,h3,h4,h5,h6,address,blockquote,p,pre,ul,li,ol,dl,table,hr,form,fieldset',
	CSS_BG_REG = /^url\s?\(/,
	CoreTimer,
	// 内部タイマーインターバル
	INTERVAL_FPS,
	// 数値CSSマッピング
	NUMERIC_CSS = 'opacity,zIndex',
	EXT = '.js',
	// data-*独自属性プレフィックス
	HTML_DATA_PREFIX = 'data-fl-';
	/*
	// Keymapperモジュール用キーマップ
	KEY_MAP = {
		DOWN_UP : {
			BASIC : {
				NUM_0 : 48, NUM_1 : 49, NUM_2 : 50, NUM_3 : 51, NUM_4 : 52, NUM_5 : 53,
				NUM_6 : 54, NUM_7 : 55, NUM_8 : 56, NUM_9 : 57,
				a : 65, b : 66, c : 67, d : 68, e : 69, f : 70, g : 71, h : 72, i : 73,
				j : 74, k : 75, l : 76, m : 77, n : 78, o : 79, p : 80, q : 81, r : 82,
				s : 83, t : 84, u : 85, v : 86, w : 87, x : 88, y : 89, z : 90,
				HYPEN : 189, CARET : 222, YEN : 220, AT : 192, BRACKET_L : 219,
				SEMICOLON : 187, COLON : 186, BRACKET_R : 221, COMMA : 188, PERIOD : 190,
				SLASH : 191, BACK_SLASH : 226, ESC : 27, F1 : 112, F2 : 113, F3 : 114,
				F4 : 115, F5 : 116, F6 : 117, F7 : 118, F8 : 119, F9 : 120, F10 : 121,
				F11 : 122, F12 : 123, SCROLL_ROCK : 145, INSERT : 45, DELETE : 46, 
				END : 35, PAGE_UP : 33, PAGE_DOWN : 34, LEFT : 37, UP : 38, RIGHT : 39,
				DOWN : 40, TAB : 9, CAPS_LOCK : 240, ALT : 18, SPACE : 32, WINDOWS_L : 91,
				WINDOWS_R : 92, ENTER : 13, BACK_SPACE : 8
			},
			SHIFT : {
				EX_MARK : 49, DOUBLE_QUOTE : 50, NUMBER_SIGN : 51, DOLLER : 52, PERCENT : 53,
				AMPERSAND : 54, SINGLE_QUOTE : 55, PARENTHESIS_L : 56, PARENTHESIS : 57,
				A : 65, B : 66, C : 67, D : 68, E : 69, F : 70, G : 71, H : 72, I : 73,
				J : 74, K : 75, L : 76, M : 77, N : 78, O : 79, P : 80, Q : 81, R : 82,
				S : 83, T : 84, U : 85, V : 86, W : 87, X : 88, Y : 89, Z : 90,
				EQUAL : 189, TILDE : 222, PIPE : 220, BACK_QUOTE : 192, CURLY_BRACKET_L : 219,
				PLUS : 187, ASTERISK : 186, CURLY_BRACKET_R : 221, LESS_THAN : 188, GREATER_THAN : 190,
				QUESTION : 191, UNDER_SCORE : 226
			},
			TEN_KEY : {
				NUM_0 : 96, NUM_1 : 97, NUM_2 : 98, NUM_3 : 99, NUM_4 : 100, NUM_5 : 101,
				NUM_6 : 102, NUM_7 : 103, NUM_8 : 104, NUM_9 : 105, DOT : 110,
				NUMLOCK : 144, SLASH : 111, ASTERISK : 106, HYPHEN : 109, PLUS : 107, ENTER : 13
			}
		},
		PRESS : {
			BASIC : {
				NUM_0 : 48, NUM_1 : 49, NUM_2 : 50, NUM_3 : 51, NUM_4 : 52, NUM_5 : 53,
				NUM_6 : 54, NUM_7 : 55, NUM_8 : 56, NUM_9 : 57,
				a : 97, b : 98, c : 99, d : 100, e : 101, f : 102, g : 103, h : 104, i : 105,
				j : 106, k : 107, l : 108, m : 109, n : 110, o : 111, p : 112, q : 113, r : 114,
				s : 115, t : 116, u : 117, v : 118, w : 119, x : 120, y : 121, z : 122,
				HYPEN : 45, CARET : 94, YEN : 92, AT : 64, BRACKET_L : 91,
				SEMICOLON : 59, COLON : 58, BRACKET_R : 93, COMMA : 44, PERIOD : 46,
				SLASH : 47, BACK_SLASH : 92, ESC : 27, F1 : 112, F2 : 113, F3 : 114,
				F4 : 115, F5 : 116, F6 : 117, F7 : 118, F8 : 119, F9 : 120, F10 : 121,
				F11 : 122, F12 : 123, SCROLL_ROCK : 145, INSERT : 45, DELETE : 46, 
				END : 35, PAGE_UP : 33, PAGE_DOWN : 34, LEFT : 37, UP : 38, RIGHT : 39,
				DOWN : 40, TAB : 9, CAPS_LOCK : 240, ALT : 18, SPACE : 32, WINDOWS_L : 91,
				WINDOWS_R : 92, ENTER : 13, BACK_SPACE : 8
			},
			SHIFT : {
				EX_MARK : 33, DOUBLE_QUOTE : 34, NUMBER_SIGN : 35, DOLLER : 36, PERCENT : 37,
				AMPERSAND : 38, SINGLE_QUOTE : 39, PARENTHESIS_L : 40, PARENTHESIS : 41,
				A : 65, B : 66, C : 67, D : 68, E : 69, F : 70, G : 71, H : 72, I : 73,
				J : 74, K : 75, L : 76, M : 77, N : 78, O : 79, P : 80, Q : 81, R : 82,
				S : 83, T : 84, U : 85, V : 86, W : 87, X : 88, Y : 89, Z : 90,
				EQUAL : 61, TILDE : 126, PIPE : 124, BACK_QUOTE : 86, CURLY_BRACKET_L : 123,
				PLUS : 43, ASTERISK : 42, CURLY_BRACKET_R : 125, LESS_THAN : 60, GREATER_THAN : 62,
				QUESTION : 63, UNDER_SCORE : 95
			},
			TEN_KEY : {
				NUM_0 : 48, NUM_1 : 49, NUM_2 : 50, NUM_3 : 51, NUM_4 : 52, NUM_5 : 53,
				NUM_6 : 54, NUM_7 : 55, NUM_8 : 56, NUM_9 : 57, DOT : 46,
				NUMLOCK : 144, SLASH : 47, ASTERISK : 42, HYPHEN : 45, PLUS : 43, ENTER : 13
			}
		}
	};
	*/

	// ========================= スタートアップ ============================= /

	// 設定情報取り込み
	for ( I in FL_CONFIG ) {
		if ( ! I.isPrototypeOf(FL_CONFIG) ) {
			CORE_CONFIG[I] = FL_CONFIG[I];
		}
	}

	// @notice CIから設定をビルドする場合、オブジェクトデータも文字列になるので、ここで変換（現在はcookieDomainのみ）
	if ( CORE_CONFIG.cookieDomain === 'document.domain' ) {
		CORE_CONFIG.cookieDomain = doc.domain;
	}

	// 設定情報を内部に移したあとは、グローバルオブジェクトを削除する
	try {
		delete FL_CONFIG;
	} catch (e) {
		FL_CONFIG = undefined;
	}

	// siteUrlの値が空の場合は自身のパスからビルドする
	if ( !CORE_CONFIG.siteUrl ) {
		(function() {
			var sc = head.getElementsByTagName('script'),
				i = -1,
				reg = /flint.*\.js$/,
				ap = CORE_CONFIG.scriptPath;

			while(sc[++i]) {
				if (reg.test(sc[i].src)) {
					CORE_CONFIG.siteUrl = sc[i].src.substring(0, sc[i].src.lastIndexOf(ap + 'flint'));
					break;
				}
			}
		})();
	}
	// sslの場合も同様に
	if ( !CORE_CONFIG.ssl_siteUrl ) {
		(function() {
			var sc = head.getElementsByTagName('script'),
				i = -1,
				reg = /flint.*\.js$/,
				ap = CORE_CONFIG.scriptPath;

			while(sc[++i]) {
				if (reg.test(sc[i].src)) {
					CORE_CONFIG.ssl_siteUrl = sc[i].src.substring(0, sc[i].src.lastIndexOf(ap + 'flint'));
					break;
				}
			}
		})();
	}

	// フック取り込み
	if (win.Hook && typeof Hook === 'object') {
		CORE_CONFIG.__hooks = Hook;
		try {
			delete win.Hook;
		} catch (e) {
			win.Hook = undefined;
		}
	}

	// デバッグモードチェック
	if ( CORE_CONFIG.debugMode === true ) {
		// 他のライブラリとの名前空間コンフリクトチェック
		if ( !(function() {
			var cf = [],
				g,
				N,
				gn = CORE_CONFIG.globalNames;

			for (N in gn) {
				if ( win[gn[N]] ) {
					cf[cf.length] = g;
				}
			}
			return (cf.length > 0)
						? confirm('Namespace [' + cf.join(',') + ']'
							+ 'is confrict!\nThis script keep running?')
						: true;
		})() ) {
			return;
		}
	}

	// window.eval禁止チェック
	if ( CORE_CONFIG.disableEval === true ) {
		win.eval = function() {
			throw Error('Eval function has deleted by system.');
		};
	}

	// プロトコルチェックと使用するURIの設定
	SITEURI = CORE_CONFIG.siteUrl.replace(indexReg, '');
	SSLURI = (CORE_CONFIG.ssl_siteUrl)
				? CORE_CONFIG.ssl_siteUrl.replace(indexReg, '')
				: SITEURI;
	// 設定オブジェクトに追加
	CORE_CONFIG.BASE_URL = (SYSTEM.SSL_CONNECT)
								? SSLURI
								: SITEURI;
	CORE_CONFIG.SITE_URL = CORE_CONFIG[(SYSTEM.SSL_CONNECT)
	                                   ? 'ssl_siteUrl'
	                                   : 'siteUrl'];
	CORE_CONFIG.APPPATH = CORE_CONFIG.BASE_URL + CORE_CONFIG.scriptPath;

	// SITE_URLの末尾に/がなければ付加する
	if ( !/.+\/$/.test(CORE_CONFIG.SITE_URL) ) {
		CORE_CONFIG.SITE_URL += '/';
	}

	// ====================- コアクラスマッピング ================== /

	ClassMap = {
		UserAgent : UserAgent,
		Loader : Loader,
		Utility : Utility,
		Router : Router,
		Config : Config,
		Event : Event,
		AjaxInit : AjaxInit,
		FL_Image : FL_Image,
		BenchMark : BenchMark,
		CreateClass : CreateClass,
		Extends : Extends,
		Enables : Enables,
		Language : Language,
		Hook : Hook,
		URI : URI,
		Json : Json,
		Input : Input,
		CustomEvent : CustomEvent
	};

	ua = loadClass('UserAgent');
	enables = loadClass('Enables');
	
	// ======================= Compatible ECMA Script Section ========================== //
	
	// Array#forEach
	// @see https://developer.mozilla.org/ja/JavaScript/Reference/Global_Objects/Array/forEach
	! Array.prototype.forEach && (Array.prototype.forEach = function(fn, pointer) {
		if ( typeof fn !== 'function' ) {
			throw new TypeError('First argument must be function on Array#forEach.');
		}
		var i = 0,
			len = this.length,
			ctx = pointer || null;
		
		for ( ; i < len; ++i ) {
			if ( i in this ) {
				fn.call(ctx, this[i], i, this);
			}
		}
	});
	
	// Array#map
	// @see https://developer.mozilla.org/ja/JavaScript/Reference/Global_Objects/Array/map
	! Array.prototype.map && ( Array.prototype.map = function(fn, pointer) {
		if ( typeof fn !== 'function' ) {
			throw new TypeError('First argument must be function on Array#map.');
		}
		var i = 0,
			len = this.length,
			ctx = pointer || null,
			ret = new Array(len);
		
		for ( ; i < len; ++i ) {
			if ( i in this ) {
				ret[i] = fn.call(ctx, this[i], i, this);
			}
		}
	});
	
	// ======================= /Compatible ECMA Script Section End ========================== //

	// スタートアップ
	function ignite() {
		var UT, CFG, RTR, URI, HOOK, UA, BM, LANG, LOADER, INPUT,
			Class, Method,
			// method alias
			ael = 'addEventListener',
			ate = 'attachEvent',
			dte = 'detachEvent',
			rel = 'removeEventListener',
			dn,
			ss,
			G = CORE_CONFIG.globalNames;
		
		_registCustomEvent();

		// IE8--<canvas>用にVMLセットアップ
		// <canvas>エミュレート以外にもVML置換が必要な場合があるので、
		// 名前空間は作成しておく
		if (enables.needFixBrowserIE) {
			doc.createElement('canvas');
			if (doc.namespaces) {
				dn = doc.namespaces;
				if (!dn.v) { // <v:*> namespace
					dn.add('v', 'urn:schemas-microsoft-com:vml', '#default#VML');
				}
				if (!dn.v_o) { // <v_o:*> namespace
					dn.add('v_o', 'urn:schemas-microsoft-com:office:office', '#default#VML');
				}
				if (!doc.styleSheets.fl_canvas) {
					ss = doc.createStyleSheet();
					ss.owningElement.id = 'fl_canvas';
					ss.cssText = ['canvas{display:inline-block;overflow:hidden;',
					              'text-align:left;width:300px;height:150px;}',
					              'v\\:*{behavior:url(#default#VML)}',
					              'v_o\\:*{behavior:url(#default#VML)}'
					              ].join('');
				}
			}
		}

		ut = loadClass('Utility');
		BM = loadClass('BenchMark');
//		BM.mark('TotalExecutionTimeStart');
//		BM.mark('LoadingTimeBaseClassesStart');

		HOOK = loadClass('Hook');

		HOOK._callHook('preSystem');

		CFG = loadClass('Config');
		URI = loadClass('URI');
		RTR = loadClass('Router');

		// Output Class is No Use.

		LANG = loadClass('Language');
		
		INPUT = loadClass('Input');
		
		LOADER = loadClass('Loader');
		
		// =============== Base Startup Section =====================
		
		Controller = Base = new _Controller();
		Model = new _Model();
		
		// 設定に基づいてグローバルスコープにaliasを貼る
		win.ClassExtend = function(ex, base) {
			new Extends(ex, base);
		};
		win.getInstance = function() {
			return SYSTEM.CONTROLLER || Controller;
		};
		
		alias('FLClass', loadClass('CreateClass'));
		alias(G.DOM, DOM);
		alias(G.Animation, Animation);
		alias(G.Module, Module);
		if (G.Helper !== '') {
			win[G.Helper] = {};
		}
		
		// autoload start!
		Controller.load._fl_autoLoader();
		
		
		if (CORE_CONFIG.routingMode === 'segment'
				|| CORE_CONFIG.routingMode === 'config') {
			Controller.__load(CFG.appPath() + 'controllers/' + RTR.fetchDirectory() + RTR.fetchClass() + EXT);
		} else {
			win[G.Controller] = Controller;
		}

//		EXT._callHook('postSystem');

		if (win[ael]) {
			win[ael]('load', Base.event.__execLoad, false);
			win[ael]('unload', ut.cleanEvElm, false);
		}	else if (win[ate]) {
			// IEはページのunload時に登録ハンドラを全削除(memory leak対策)
			win[ate]('onunload', ut.cleanEvElm);
			win[ate]('onload', Base.event.__execLoad);
		}	else {
			// インラインイベントハンドラも削除
			win.onunload = ut.cleanEvElm;
		}

		// DOM ready監視
		if (enables.canDOMReady) {
			doc[ael]('DOMContentLoaded', Base.event.__execDOM, false);
		} else if (ua.IE) {
			function rsc() {
				if (doc.readyState === 'complete') {
					Base.event.__execDOM(win.event);
					doc.detachEvent('onreadystatechange', rsc);
				}
			}
			doc[ate]('onreadystatechange', rsc);
		} else if (doc.readyState) {
			(function() {
				(doc.readyState == 'loaded' || doc.readyState == 'complete')
						? Base.event.__execDOM()
						: delay(arguments.callee, 0);
			})();
		}

		// TODO : スタートアップ続き書く
	}



	// ============================= 汎用メソッド =========================== /

	/**
	 * union
	 * オブジェクトの合成
	 * @param Object base : 合成元オブジェクト
	 * @param Object ride : 合成させるオブジェクト
	 * @param Boolean isPublicOnly : publicプロパティ/メソッドのみに限定するかどうか
	 * @return Object : 合成されたオブジェクト
	 */
	function union(base, ride, isPublicOnly) {
		var i,
			isP = isPublicOnly || false;

		for (i in ride) {
			if ( !isP || !/^_/.test(i)) {
				base[i] = ride[i];
			}
		}
		return base;
	}

	/**
	 * alias
	 * 対象オブジェクトにメソッド/プロパティの参照aliasを貼る
	 * @param String name : 参照名
	 * @param String prop : 参照させるプロパティ/メソッド
	 * @param Object attach : 参照させるオブジェクト（指定しなければwindow）
	 * @return void
	 */
	function alias(name, prop, attach) {
		(attach || win)[name] = prop;
	}

	/**
	 * apiLoad
	 * APIをロード
	 * @param String type : script or css
	 * @param String path : ロードするAPIのパス
	 * @param String att : cssのmedia属性
	 */
	function apiLoad(type, path, att) {
		var ats = (type === 'css'),
			t = doc.createElement((ats) ? 'link' : 'script');

		t.type = (ats) ? 'text/css' : 'text/javascript';
		t[(ats) ? 'href' : 'src'] = path;
		if (ats) {
			if (att) {
				t.media = att;
			}
			t.rel = 'stylesheet';
		} else {
			t.charset = 'UTF-8';
		}
		head.appendChild(t);
	}

	/**
	 * returnFalse
	 * falseを返す関数
	 */
	function returnFalse() {
		return false;
	}

	/**
	 * loadClass
	 * コアクラスのロード
	 * @param String ClassName : ロードするクラス名
	 * @return Object : クラスインスタンス
	 */
	function loadClass(ClassName) {
		var LCC = STACK.LOADED_CORE_CLASSES,
			cl;

		if (!ClassMap[ClassName]) {
			throw Error(ClassName + ' class is not defined');
			return;
		}
		if (!LCC[ClassName]) {
			LCC[ClassName] = new ClassMap[ClassName]();
		}
		return LCC[ClassName];
	}

	/**
	 * ready : API使用準備完了やDOM構築完了の待ち合わせ
	 * @param mixed String or Function type : 文字列:API待機、Function:DOMReady
	 * @param Function listener : API利用可能時に実行するコールバック
	 */
	function ready(type, listener) {
		var ar = STACK.API_READY,
			arf = STACK.API_READY_FUNC,
			fn;

		if (typeof type === 'string') {
			if (ar[type] === true
					|| (typeof Controller[type] === 'object' 
						|| (SYSTEM.CONTROLLER && typeof SYSTEM.CONTROLLER[type] === 'object'))) {
				listener.call(SYSTEM.CONTROLLER || Controller);
			} else {
				function c() { listener.call(SYSTEM.CONTROLLER || Controller); }

				if (arf[type]) {
					arf[type].push(c);
				} else {
					arf[type] = [c];
				}
			}
		} else if (typeof type === 'function') {
			Base.event.set(doc, 'DOMReady', type);
		}
	}
	
	/**
	 * DefferdInit : FL_Defferd実行のクロージャ
	 */
	function DefferdInit() {
		return new FL_Defferd(arguments);
	}
	
	/**
	 * __registCustomEvent : 独自イベントを登録する
	 * jQueryっぽくmouseenterとかmouseleaveとか登録してみる
	 * @param none
	 */ 
	function _registCustomEvent() {
		CUSTOM_EVENT = loadClass('CustomEvent');
		
		CUSTOM_EVENT.regist('mouseenter', 'mouseover', function(current, ev) {
			var e = ev.relatedTarget || ev.fromElement || null,
				html = doc.documentElement,
				flag = true;

			if ( !e ) {
				return false;
			}
			while(e && e !== html) {
				if ( e === current ) {
					flag = false;
					break;
				}
				e = e.parentNode;
			}
			return flag;
		});
		
		CUSTOM_EVENT.regist('mouseleave', 'mouseout', function(current, ev) {
			var e = ev.relatedTarget || ev.toElement || null,
				html = doc.documentElement,
				flag = true;

			if ( !e ) {
				return false;
			}
			while(e && e !== html) {
				if ( e === current ) {
					flag = false;
					break;
				}
				e = e.parentNode;
			}
			return flag;
		});
	}




	// ========================= Flint Classes ==================== /

	// Enables - サポート状況を保持するクラス
	function Enables() {
		this.xhr = !!win.XMLHttpRequest;
		this.fixIE = (ua.IE && ua.IEV < 9) ? true : false;
		this.positionFixed = this.png = (!ua.IE6) ? true : false;
		this.minmaxWH = (!ua.IE6) ? true : false;
		this.hasAttBug = (ua.IE6 || ua.IE7) ? true : false;
		this.canASCall = (!ua.IE || ua.IEV > 8) ? true : false; // Array.prototype.slice.callが使用可能かどうか
		this.canQSA = (doc.querySelectorAll) ? true : false; // document.querySelectorAllが使えるかどうか

		// IE8とIE9のquerySelectorAllはnth-childとlast-child、!を含むトークンは例外を投げるので判定
		this.isQSAChild = (this.canQSA && ua.IEV >= 8) ? true : false;

		// IE8とIE9以外のブラウザでquerySelectorAllを使う場合、:containsを含むトークンは例外を投げるので判定
		this.isQSAContains = (this.canQSA && !ua.IE) ? true : false;

		// IE拡張が必要なバージョン判定
		this.needFixBrowserIE = (ua.IE && ua.IEV < 9) ? true : false;

		// DOMContentLoadedが使えるブラウザ
		// Firefox, Opera, GoogleChrome, Safari version 3.1以上はaddEventListenerに登録できる
		// added at 2010/09/30 - IE9はaddEventListenerサポート＋ContentLoadedが可能になった
		this.canDOMReady = (ua.IE9 || ua.IE10 || ua.Firefox || ua.Opera || ua.GoogleChrome || (ua.Safari && ua.SafariV > 3.1)) ? true : false;
	}

		Enables.prototype = {};

	// <-- Enables =============================================================================


	// UserAgentクラス -- ユーザーエージェント判定
	function UserAgent() {
		var u = UA,
			sfV,
			__flashVer,
			map,
			i = -1,
			BS = [],
			c = doc.documentElement.className,
			DM = doc.documentMode,
			lteV = 10;

		this.agent = UA;

		// aliasメソッド
		function parse(match, n, m) {
			return pf(match[n] + '.' + ((!m) ? 0 : match[m]));
		}
		function has (str) {
			return (u.indexOf(str) !== -1);
		}
		function set(prefix) {
			BS[++i] = prefix;
			return true;
		}

		// is()メソッド用ショートカットマッピング
		map = { 'I' : 'IE', 'I6' : 'IE6', 'I7' : 'IE7', 'I8' : 'IE8', 'I8S' : 'IE8S',
				'F' : 'Firefox', 'S' : 'Safari', 'C' : 'GoogleCrome', 'O' : 'Opera',
				'L' : 'Lunascape', 'SL' :'Sleipnir', 'W' : 'Wii', 'GB' : 'GameBoy',
				'DS' : 'NintentdoDS', 'PSP' : 'PSP', 'PS2' : 'PlayStation2',
				'PS3' : 'PlayStation3', 'i' : 'iPod', 'ip' : 'iPhone', 'ip3' : 'iPhone3G'
		};

		this.Opera = !!win.opera && set('o');
		this.IE = has('msie') && !this.Opera && set('ie');
		this.IEV = (this.IE) ? parse(u.match(/(.*?)msie ([0-9]{1,2})\.([0-9])/), 2, 3)
								: null;
		this.IE6 = (this.IEV >= 6 && this.IEV < 7) && set('ie6');
		this.IE7 = (this.IEV >= 7 && this.IEV < 8) && set('ie7');
		this.IE8 = (this.IEV >= 8 && this.IEV < 9) && set('ie8');
		this.IE9 = (this.IEV >= 9 && this.IEV < 10) && set('ie9');
		this.IE10 = (this.IEV >= 10 && this.IEV < 11) && set('ie10');
		this.IE8S = (this.IE8 && typeof DM != 'undefined' && DM === 8);
		this.IE9S = (this.IE9 && typeof DM != 'undefined' && DM === 9);
		this.IE10S = (this.IE10 && typeof DM != 'undefined' && DM === 10);
		this.Firefox = this.gecko = has('gecko') && has('fox') && set('ff');
		this.webkit = has('webkit');
		this.Safari = has('safari') && has('applewebkit') > 0 && !has('chrome', u) && set('s');
		this.GoogleChrome = has('chrome', u) && set('gc');
		this.Lunascape = has('lunascape');
		this.Sleipnir = has('sleipnir');
		this.Windows = has('windows');
		this.Mac = has('mac');
		this.Linux = has('linux');
		
		if ( this.IE ) {
			while ( ! this['IE' + lteV] ) {
				set('ie-lte-' + lteV--);
			}
			set('ie-lte-' + lteV--);
		}

		// レンダリングモード
		this.Standard = (doc.compatMode === 'CSS1Compat');

		// ブラウザバージョン
		this.FirefoxV = (this.Firefox) ? pf(u.replace(/(.*?)firefox\/([0-9])\.([0-9])(.*?)/, '$2.$3'))
											: null;
		this.OperaV = (this.Opera) ? parse(u.match(/(.*?)opera[\/|\s]([0-9])\.([0-9])(.*?)/), 2, 3)
											: null;
		this.GoogleChromeV = (this.GoogleChrome) ? pf(u.replace(/(.*?)chrome\/([0-9])\.([0-9])(.*?)/, '$2.$3'))
											:null;
		sfV = (this.Safari) ? u.replace(/(.*?)applewebkit\/([0-9]*?)\.(.*?)/, '$2').substring(0, 2)
								: null;
		this.SafariV = (sfV !== null)
							? (pi(sfV, 10) > 52)
								? u.replace(/(.*?)version\/([0-9])\.([0-9]).*/, '$2.$3') :
									(sfV == '41') ? '2.0' :
										(sfV == '31') ? '1.3' :
											(sfV == '12') ? '1.2' :
												(sfV == '10') ? '1.1' :
													(sfV == '85') ? '1.0' : '0'
														: null;

		// モバイルユーザーエージェント判定
		if (CORE_CONFIG.useMobileAgent) {
			// ゲーム機のuserAgenet
			this.Wii = has('nintendo wii');
			this.GameBoy = has('gameboy');
			this.NintentdoDS = has('nitro');
			this.PSP = has('psp');
			this.PlayStation2 = has('ps2') && has('bb navigator');
			this.PlayStation3 = has('playstation 3');
			// PDAのuserAgent
			this.iPod = has('ipod');
			this.iPnone = has('iphone');
			this.iPhone3G = this.iPhone && has('applewebkit/525');
			this.Android = has('android');
		}

		/**
		 * is
		 * ブラウザ判定ショートカット
		 * @param String reg : ショートカットID,|で複数指定できる
		 * @return Boolean
		 */
		this.is = function(reg) {
			var uas = reg.split('|'),
				uaslen = uas.length,
				i = 0;

			for (;i < uaslen; i++) {
				if (uas[i] in map && this[map[uas[i]]] === true) {
					return true;
				}
			}
			return false;
		};
		__flashVer = (function() {
			var v = [0, 0, 0],
				vn,
				m,
				n = navigator,
				pl,
				AX,
				mmt = 'application/x-shockwave-flash',
				AC7 = 'ShockwaveFlash.ShockwaveFlash.7',
				AC6 = 'ShockwaveFlash.ShockwaveFlash.6';

			// other IE
			if (n.plugins && n.mimeTypes[mmt]) {
				pl = n.mimeTypes[mmt].enabledPlugin;
				if (pl && pl.description) {
					m = pl.description.match(/([0-9]+)\.([0-9])\s?[a-zA-Z]([0-9]+)$/);
					v = [m[1], m[2], m[3]];
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
		this.toString = function() {
			return '[ Class UserAgent ]';
		};

		this.flashVer = __flashVer.join('.');
		this.flashVerArray = __flashVer;
		
		// set Agent prefix
		doc.documentElement.className = ( c === '')
								? BS.join(' ')
								: c + BS.join(' ');
	}

		UserAgent.prototype = {};

	// <-- /UserAgent　=============================================================================

	// CreateClass -- 汎用的なクラス作成
	function CreateClass() {}

		CreateClass.prototype = {
			// genericなクラス雛形生成
			create : function(ext) {
				var fn = function() {};

				return this.__extend(fn, ext || undefined);
			},
			// singletonクラス雛形生成
			singleton : function(ext) {
				var ins,
					fn = function() {
						if (ins) {
							return ins;
						} else {
							ins = this;
						}
					};

				return this.__extend(fn, ext || undefined);
			},
			__extend : function(fn, ext) {
				switch (typeof ext) {
				case 'function':
					fn.constructor = ext;
					fn.prototype = new ext();
					break;
				case 'object':
					fn.constructor = ext.constructor;
					fn.ptototype = ext;
					break;
				default: break;
				}
				return fn;
			}
		};

	// <-- /CreateClass　=============================================================================

	// Configクラス -- 設定情報を取得/設定するクラス
	function Config() {
		this.C = CORE_CONFIG;
	}

		Config.prototype = {
			/**
			 * siteurl
			 * サイトURIを取得
			 * @param String suffix : 後ろに付加するURI
			 * @return String
			 */
			siteUrl : function(suffix) {
				return this.C.SITE_URL + (suffix ? suffix.replace('/^[\/]', '') : '');
			},
			/**
			 * baseUrl
			 * ドキュメントルートまでの絶対パスを取得
			 * @return String
			 */
			baseUrl : function() {
				return this.C.BASE_URL;
			},
			/**
			 * appPath
			 * このファイルまでのパスを取得
			 * @return String
			 */
			appPath : function() {
				return this.C.APPPATH;
			},
			/**
			 * item
			 * 設定情報を取得
			 * @param String name : 設定名
			 * @reutrn mixed
			 */
			item : function(name) {
				return (name in this.C) ? this.C[name] : false;
			},
			/**
			 * isDebug
			 * デバッグモードで動作しているかを取得
			 * @reutrn Boolean
			 */
			isDebug : function() {
				return this.C.debugMode;
			},
			/**
			 * setItem
			 * 設定情報を追加。既に情報がある場合は上書きする
			 * @param String name : 設定名
			 * @param mixed data : 設定データ
			 * @reutrn void
			 */
			setItem : function(name, data) {
				this.C[name] = data;
			},
			/**
			 * getGlobal
			 * 名前空間オブジェクトを返却する
			 */
			getGlobal : function(name) {
				var G = this.C.globalNames;
				if (!name) {
					return {
						Controller : (CORE_CONFIG.routingMode === 'segment') ? '' : G.Controller,
						DOM : G.DOM,
						Animation : G.Animation,
						Helper : (G.helper === '') ? win : G.Helper,
						Module : (G.Module === '') ? win : G.Module
					};
				} else {
					if (G.hasOwnProperty(name)) {
						return (name === 'Helper')
									? (G[name] != '')
									? win[G[name]]
									: win
									: win[G[name]];
					}
				}
			},
			toString : function() {
				return '[ Class Config ]';
			}
		};
	// <-- Config =============================================================================



	// JSONクラス -- window.JSONをサポートしないブラウザ向けJSONサポートクラス
	function Json() {
		this.esc = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
		this.meta = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'};
		this.gap = null;
		this.ind = null;
		this.rep = null;
	}

		Json.prototype = {
			parse : function(str) {
				return SYSTEM.GLOBAL_EVAL('(' + str + ')');
			},
			stringify : function(value, rep, sp) {
				var i = 0;

				this.gap = '';
				this.ind = '';
				if (ut.isNumber(sp)) {
					for (; i < sp; i++) {
						this.ind += ' ';
					}
				} else if (ut.isString(sp)) {
					this.ind = sp;
				}
				this.rep = rep;
				if (rep && !ut.isFunction(rep) && (!ut.isObject(rep) || !ut.isNumber(rep.length))) {
					throw new TypeError('Json.stringify');
				}
				return this.__strstr('', {'' : value});
			},
			__q : function(str) {
				var esc = this.esc,
					m = this.meta;

				esc.lastIndex = 0;
				return esc.test(str) ? '"' + str.replace(esc, function(s){
					return (ut.isString(m[s])) ? m[s] : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				}) + '"' : '"' + str + '"';
			},
			__strstr : function(key, obj) {
				var i, k, v, len,
					m = this.gap,
					pat = [],
					val = obj[key],
					rep = json.rep,
					isF = window.isFinite;

				if (ut.isFunction(rep)) {
					val = rep.call(obj, key, val);
				}
				if (ut.isString(val)) {
					return this.__q(val);
				} else if (ut.isNumber(val)) {
					return isF(val) ? String(val) : 'nul';
				} else if (ut.isBool(val) || ut.isNull(val)){
					return String(val);
				} else if (ut.isArray(val)) {
					if (!val) {
						return 'null';
					}
					this.gap += this.ind;
					len = val.length;
					for (i = 0; i < len; i++) {
						pat[i] = this.__strstr(i, val) || 'null';
					}
					v = (pat.length === 0) ? '[]' :
											this.gap ? '[\n' + this.gap + pat.join(',\n' + this.gap) + '\n' + m + ']' :
											'[' + pat.join(',') + ']';
					this.gap = m;
					return v;
				} else { // object
					if (!val) {
						return 'null';
					}
					this.gap += this.ind;
					if (rep && ut.isObject(rep)) {
						len = rep.length;
						for (i = 0; i < len; i++) {
							k = rep[i];
							if (ut.isString(k)) {
								v = this.__strstr(k, val);
								if (v) {
									pat.push(json.__q(k) + (json.gap ? ': ' : ':') + v);
								}
							}
						}
					} else {
						for (k in val) {
							if (Object.hasOwnProperty.call(val, k)) {
								v = this.__strstr(k, val);
								if (v) {
									pat.push(json.__q(k) + (json.gap ? ': ' : ':') + v);
								}
							}
						}
					}
					v = (pat.lnegth === 0) ? '{}' :
										this.gap ? '{\n' + this.gap + pat.join(',\n' + this.gap) + '\n' + m + '}' : '{' + pat.join(',') + '}';
					this.gap = m;
					return v;
				}
			},
			toString : function() {
				return '[ Class Json ]';
			}
		};
	// <-- Json =============================================================================

	// BenchMarkクラス -- 実行時間計測系クラス
	function BenchMark() {
		this.STB = STACK.BENCH_MARKS;
		this.SYB = SYSTEM.BENCH_MARKS;
	}

		BenchMark.prototype = {
			mark : function(name) {
				var n = name || 'default';

				this.STB[n] = +new Date();
				this.SYB[n] = 'running...';
			},
			end : function(name, isDisplay) {
				var n = name || 'default',
					s = this.STB[n],
					e = +new Date(),
					r = e -s;

				this.SYB[n] = r + ' ms';
				return isDisplay ? r : alert('BenchMarks "' + n + '" runs ' + r + ' ms');
			},
			toString : function() {
				return '[ Class BenchMark ]';
			}
		};
	// <-- BenchMark =============================================================================


	// URIクラス -- アクセスURIに関するクラス
	function URI() {
		this.hash;
		this.search;
		this.uri;
		this.__construct();
	}

		URI.prototype = {
			__construct : function() {
				var URL = LOC.href,
					hp = URL.indexOf('#'),
					sp = URL.indexOf('?'),
					acu,
					splitUri,
					segmentLen,
					ii = 0,
					uriO = {},
					uriA = [''];
					
				// parse request URI
				this.hash = ( hp !== -1 ) ? URL.slice(hp) : '#';
				this.search = ( sp !== -1 ) ? URL.slice(sp + 1) : '';
				this.uri = URL.replace(this.hash, '').replace('?' + this.search, '');
				this._uriString = this.uri.replace(CORE_CONFIG.SITE_URL);
			
				// parse to Object-Array
				acu = this._uriString.replace(/index\.php\/?/, '');
				splitUri = acu.split('/');
				segmentLen = splitUri.length;
				
				for (; ii < segmentLen; ii++) {
					uriO[ii + 1] = uriA[uriA.length] = splitUri[ii];
				}
				this.uriObj = uriO;
				this.uriArray = uriA;
			},
			// ハッシュ値取得
			getHash : function(withHash) {
				return (withHash) ? this.hash : this.hash.slice(1);
			},
			// セグメントデータを配列で取得
			segmentArray : function() {
				var u = this.uriArray,
					len = u.length,
					i = 0,
					ret = [''];

				while (u[++i]) {
					ret[ret.length] = u[i];
				}
				return ret;
			},
			// セグメントを指定して取得
			segment : function(num, def) {
				return this.uriArray[num] || def;
			},
			// 最後のセグメントを取得
			lastSegment : function(def) {
				return this.uriArray[this.uriArray.length - 1] || def || undefined;
			},
			// スラッシュ付きセグメントの取得
			slashSegment : function(num, slash) {
				var u = this.uriArray,
					sh = slash || '',
					prefix = (sh === 'leading' || sh === 'both') ? '/' : '',
					suffix = (sh === 'both') ? '/' : '';

				return u[num] ? prefix + u[num] + suffix : false;
			},
			// URIを文字列で取得
			uriString : function() {
				return this._uriString;
			},
			assocToUri : function(arr) {
				return '/' + arr.join('/');
			},
			toString : function() {
				return '[ Class URI ]';
			}
		};
	// <-- URI =============================================================================
	
	// Inputクラス -- 入力値を保持するクラス
	// JavaScriptの特性上、POSTは取れないので単純にqueryStringを解析、get()メソッドのみ実装
	function Input() {
		this._GET = {};
		this.__construct();
	}
	
		Input.prototype = {
			/**
			 * コンストラクタ
			 */
			__construct : function() {
				var s = (LOC.search !== '') ? LOC.search.slice(1) : '',
					sp = s.split('&'),
					spp,
					i = -1;
				
				while(sp[++i]) {
					spp = sp[i].split('=');
					this._GET[dec(spp[0])] = dec(spp[1]);
				}
				this._GET = this.__cleanInputData(this._GET);
			},
			/**
			 * 入力値の検証
			 * @note パラメータはXSS検証しないので注意
			 */
			__cleanInputData : function(str) {
				if ( ut.isObject(str)) {
					var i,
						ret = {},
						keyRegex = /^[a-zA-Z0-9:_\/\-]+$/;
					
					for ( i in str ) {
						if ( str.hasOwnProperty(i) ) {
							if ( keyRegex.test(i) ) {
								ret[i] = this.__cleanInputData(str[i]);
							}
						}
					}
					return ret;
				}
				
				return str.replace(/[\r\n|\r]/g, '\n');
			},
			/**
			 * GETパラメータ取得
			 */
			get : function(key) {
				return (key && this._GET.hasOwnProperty(key) ) ? this._GET[key] : false;
			}
		};
		
	// <-- Input =============================================================================
	
		// Hookクラス -- スタートアップ中に任意のタイミングでコールバックを実行するクラス
	function Hook() {
		this.__hooks = CORE_CONFIG._hooks || {};
	}

		Hook.prototype = {
			_callHook : function(type) {
				var h = this.__hooks;

				if (h[type] && ut.isFunction(h[type])) {
					h[type]();
				}
			}
		};
	// <-- Hook =============================================================================


	// Utilityクラス -- クロスブラウザユーティリティクラス
	function Utility() {}

		Utility.prototype = {
			/**
			 * 要素のviewport座標系位置を取得
			 */
			getAbsPosition : function(e) {
				var t, l, p, sc,
					gCS, nowStyle;

				if (e.style.position === 'fixed') { // case position : fixed
					t = e.style.top;
					l = e.style.left;

					// top
					if (t == 'auto' || t == '') {
						t = e.offsetTop;
					} else if (t.indexOf('%') > -1) {
						t = mr(screen.availHeight * pi(t) / 100);
					} else {
						t = pi(t);
					}
					// left
					if (l == 'auto' || l == '') {
						l = e.offsetLeft;
					} else if (l.indexOf('%') > -1) {
						l = mr(screen.availHeight * pi(l) / 100);
					} else {
						l = pi(l);
					}
					return {x : l, y : t};
				}

				if (e.getBoundingClientRect) { // IE6+
					p = e.getBoundingClientRect();
					sc = this.getScrollPosition();
					return { x : mr(p.left + sc.x), y : mr(p.top + sc.y)};
				}
				// getBoundingClientRectが未サポートの場合、手動で絶対位置を計算
				p = { x : 0, y : 0 };
				var getStyle = function(elm, cameledProp, prop) {
					if (elm.currentStyle) {
						switch (elm.currentStyle[camledProp]) {
							case 'thin' : return 2;
							case 'medium' : return 4;
							case 'thick' : return 6;
							default : return elm.currentStyle[cameledProp];
						}
					} else if (COMPUTED_STYLE) {
						nowStyle = COMPUTED_STYLE(elm, '');
						return nowStyle.getPropertyValue(prop);
					}
					return 0;
				};
				while (e) {
					p.x += e.offsetLeft;
					p.y += e.offsetTop;
					e = e.offsetParent;
					if (e && ua.IE) {
						p.x += (pi(getStyle(e, 'borderLeftWidth', 'border-left-width'), 10) || 0);
						p.y += (pi(getStyle(e, 'borderTopWdth', 'border-top-width'), 10) || 0);
					}
				}
				if (ua.Firefox) {
					p.x += 2 * (pi(getStyle(body, 'borderLeftWidth', 'border-left-width'), 10) || 0);
					p.y += 2 * (pi(getStyle(body, 'borderTopWidth', 'border-top-width'), 10) || 0);
				}
				return p;
			},
			// getScrollPosition - 現在のスクロール量を取得
			getScrollPosition : function() {
				var b = doc.body,
					h = doc.documentElement;

				return ( win.IEFIX && win.IEFIX.body )
				        ? { x : win.IEFIX.body.scrollLeft, y : win.IEFIX.body.scrollTop }
				        : { x : b.scrollLeft || h.scrollLeft || 0, y : b.scrollTop || h.scrollTop || 0 };
			},
			// getPageSize - コンテンツの最大幅を取得
			getPageSize : function() {
				var b = doc.body,
					h = doc.documentElement,
					max = Math.max;

				return {
					width : max(b.innerWidth || 0, b.clientWidth || 0, b.scrollWidth || 0, h.clinetWidth || 0, h.scrollWidth || 0),
					height : max(b.innerHeight || 0, b.clientHeight || 0, b.scrollHeight || 0, h.clinetHeight || 0, h.scrollHeight || 0)
				};
			},
			// getContentSize - ウインドウ表示領域を取得
			getContentSize : function() {
				var b = doc.body,
					h = doc.documentElement;

				return {
					width : ( defWinWidth > 0 )      ? defWinWidth 
					        : ( !!win.innerWidth )   ? win.innerWidth 
					        : ( ua.Standard )        ? h.clientWidth
					        : b.clientWidth,
					height : ( defWinHeight > 0 )    ? defWinHeight 
					         : ( !!win.innerHeight ) ? win.innerHeight 
					         : ( ua.Standard )       ? h.clientHeight
					         : b.clientHeight
				};
			},
			// getCenterPosition - ウインドウ表示領域中心点を取得
			getCenterPosition : function(current) {
				var size = this.getContentSize(),
					sc = this.getScrollPosition();

				return {
					x : size.width / 2 + (current ? sc.x : 0),
					y : size.height / 2 + (current ? sc.y : 0)
				};
			},
			// getPixel - 各単位をpxに変換
			getPixel : function(unit) {
				var d = doc.createElement('div'),
					ret = {},
					val = pf(unit);

				if (isNaN(val)) {
					return 0;
				}
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
				d = null;
				return  (unit.indexOf('em') !== -1) ? ret.em * val
							: (unit.indexOf('pt') !== -1) ? ret.pt * val
							: val;
			},
			// getTextSize - テキストを表示させた時の幅を取得する
			getTextSize : function(txt, additional) {
				var d = doc.createElement('span'),
					res = {};

				d.style.fontSize = additional || 'inherit';
				d.style.width = 'auto';
				d.style.visibility = 'hidden';
				d.appendChild(doc.createTextNode(txt));
				doc.body.appendChild(d);
				res.width = d.offsetWidth;
				res.height = d.ofsetHeight;
				doc.body.removeChild(d);
				d = null;
				return res;
			},
			// inRect - 要素1が要素2の中に入っているかどうかをチェック
			inRect : function(elm1, elm2) {
				var fd = DOM(elm1).absDimension(),
					td = DOM(elm2).absDimension();

				return (fd.top > td.top && fd.left > td.left
							&& fd.bottom < td.bottom && fd.right < td.right);
			},
			// inRectPiece - 要素1が要素2の一部分に入っているかどうかをチェック
			inRectPiece : function(elm1, elm2) {
				var fd = DOM(elm1).absDimension(),
					td = DOM(elm2).absDimension();

				return !(fd.bottom < td.top || fd.top > td.bottom
							|| fd.right < td.left || fd.left > td.right);
			},
			// inRectHalfVertical - 要素1が要素2の一部分に入っている場合、上半分か下半分かをチェック
			inRectHalfVertical : function(elm1, elm2) {
				if (this.inRectPiece(elm1, elm2) === false) {
					return false;
				}
				var fd = DOM(elm1).absDimension(),
					td = DOM(elm2).absDimension();

				if ((fd.bottom >= td.top && fd.bottom <= td.bottom - (td.height / 2))
						&& ((fd.left >= td.left && fd.left <= td.right) || (fd.right >= td.left && fd.right <= td.right))) {
					return 'T';
				} else if ((fd.top >= td.top + (td.height / 2) && fd.top <= td.bottom)
						&& ((fd.left >= td.left && fd.left <= td.right) || (fd.right >= td.left && fd.right <= td.right))) {
					return 'B';
				}
				return false;
			},
			// inRectParallel - 要素1が要素2の一部分に入っている場合、左半分か右半分かをチェック
			inRectHalfParallel : function(elm1, elm2) {
				if (this.inRectPiece(elm1, elm2) === false) {
					return false;
					}
				var fd = DOM(elm1).absDimension(),
					td = DOM(elm2).absDimension();

				if ((fd.left >= td.left + (td.width / 2) && fd.left <= td.right)
						&& ((fd.top >= td.top && fd.top <= td.bottom) || (fd.bottom >= td.top && fd.bottom <= td.bottom))) {
					return 'L';
				} else if ((fd.right >= td.left && fd.right <= td.left + (td.width / 2))
						&&  ((fd.top >= td.top && fd.top <= td.bottom) || (fd.bottom >= td.top && fd.bottom <= td.bottom))) {
					return 'R';
				}
				return false;
			},
			// mouseInRect - マウス座標が要素の中に入ったかどうかをチェック
			mouseInRect : function(mouse, elm) {
				var ed = DOM(elm).absDimension();

				return (mouse.x >= ed.left && mouse.x <= ed.right
							&& mouse.y >= ed.top && mouse.y <= ed.bottom);
			},
			// mouseInRectHalfVertical - マウス座標が要素の一部分に入っている場合、上半分か下半分かをチェック
			mouseInRectHalfVertical : function(mouse, elm) {
				if (!this.mouseInRect(mouse, elm)) {
					return false;
				}
				var td = DOM(elm).absDimension();

				if ((mouse.y >= td.top && mouse.y < td.top + (td.height / 2))
						&& (mouse.x >= td.left && mouse.x <= td.right)) {
					return 'T';
				} else if ((mouse.y >= td.top + (td.height / 2)
						&& mouse.y <= td.bottom) && (mouse.x >= td.left && mouse.x <= td.right)) {
					return 'B';
				}
				return false;
			},
			// mouseInRectHalfParallel- マウス座標が要素の一部分に入っている場合、左半分か右半分かをチェック
			mouseInRectHalfParallel : function(mouse, elm) {
				if (!this.mouseInRect(mouse, elm)) {
					return false;
				}
				var td = DOM(elm).absDimension();

				if ((mouse.x >= td.left && mouse.x < td.left + (td.width / 2))
						&& (mouse.y >= td.top && mouse.y <= td.bottom)) {
					return 'L';
				} else if ((mouse.x >= td.left + (td.width / 2)
						&& mouse.x <= td.right) && (mouse.y >= td.top && mouse.y <= td.bottom)) {
					return 'R';
				}
				return false;
			},
			// __is - nullでなくundefinedでないか判定
			__is : function(o) {
				return (o === null || typeof o == 'undefined');
			},
			// isString - Stringオブジェクトであるかを判定
			isString : function(o) {
				return (this.__is(o) === false && typeof o == 'string');
			},
			// isNumber - Numberオブジェクトであるかを判定
			isNumber : function(o) {
				return (this.__is(o) === false && typeof o == 'number');
			},
			// isFunction - Functionオブジェクトであるかを判定
			isFunction : function(o) {
				return (this.__is(o) === false && typeof o == 'function');
			},
			// isArray - Arrayオブジェクトであるかを判定
			isArray : Array.isArray || function(o) {
				return (this.__is(o) === false && typeof o == 'object' && Object.prototype.toString.call(o) === '[object Array]');
			},
			// isObject - Objectオブジェクトであるかを判定
			isObject : function(o) {
				return (this.__is(o) === false && typeof o == 'object' && Object.prototype.toString.call(o) === '[object Object]');
			},
			// isBool - 真偽値オブジェクトであるかを判定
			isBool : function(o) {
				return (this.__is(o) === false && typeof o == 'boolean');
			},
			// isset - 変数が未定義かどうか判定
			isset : function(v) {
				return (typeof v == 'undefined');
			},
			// isNull - nullがどうか判定
			isNull : function(v) {
				return (v === null);
			},
			// isXElement - xElementのインスタンスかどうかを判定
			isXElement : function(e) {
				return !!(e instanceof xElement);
			},
			// isxNodeList - xNodelistのインスタンスかどうかを判定
			isXNodeList : function(e) {
				return !!(e instanceof xNodeList);
			},
			// rgbToHex - rgbをhexに変換
			rgbToHex : function(rgb) {
				var t = this.trim(rgb),
					m,
					i = 1,
					h,
					ret = ['#'];

				if (/^rgb/.test(t) === false) {
					return rgb;
				}
				m = rgb.match(COLOR_REGEX.rgb);
				if (pi(m[1], 10) > 255 || pi(m[2], 10) > 255 || pi(m[3], 10) > 255) {
					throw Error('can\'t convert RGB to Hex on ' + rgb);
				}
				for (i; i < 4; i++) {
					h = pi(m[i], 10).toString(16);
					ret[ret.length] = (h.length === 1) ? '0' + h : h;
				}
				return ret.join('');
			},
			// hexToRgb - Hexをrgbに変換
			hexToRgb : function(hex) {
				var t = this.trim(hex),
					m,
					ret = hex;

				if (/^#[0-9a-fA-F]{6}$/.test(t)) {
					m = t.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
					ret = 'rgb(' + pi(m[1], 16).toString() + ',' + pi(m[2], 16).toString() + ',' + pi(m[3], 16).toString() + ')';
				} else if (/^#[0-9a-fA-F]{3}/.test(t)) {
					m = t.match(/^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/);
					ret = 'rgb(' + pi(m[1] + m[1], 16).toString() + ',' + pi(m[2] +m[2], 16).toString() + ',' + pi(m[3] + m[3], 16).toString() + ')';
				} else {
					throw Error('invalid hex foramt on ' + hex);
				}
				return ret;
			},
			// grep - 文字列が特定の文字列を持つかどうかを判定- String.indexOfとRegExp.testのショートカット
			grep : function(str, has) {
				if (!ut.isString(str) || !has) {
					throw TypeError('invalid arguments of Utility.grep function parameter by ' + str);
				}
				if (typeof has === 'string') { // String
					return (str.indexOf(has) !== -1);
				}
				else if (has.constructor === RegExp) { // RegExp
					return has.test(str);
				}
				return false;
			},
			// serializeForm - <form>要素内の入力要素を通信パラメータ用のJSONにまとめる
			serializeForm : function(elm) {
				if (!elm.nodeType || elm.tagName.toLowerCase() !== 'form') {
					throw new Error('utility.serializeForm works <form> element only.');
					return;
				}
				var res = {},
					input, inputlen,
					iptName,
					iptArr = {},
					select, selectlen,
					textarea, textarealen,
					chStack = {},
					ch = false,
					chMulti = {},
					e, chName,
					i, j, s, sl, k, m, ipt, c;

				// input elements
				input = elm.getElementsByTagName('input');
				inputlen = input.length;
				for (i = 0; i < inputlen; i++) {
					e = input[i];
					switch (e.type) {
					case 'text':
					case 'password':
					case 'submit':
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
						if (e.checked === true) {
							res[e.name] = e.value;
						}
						break;
					case 'checkbox':
						if (e.checked === true) {
							ch = true;
							if ( ut.grep(e.name, '[]') ) {
								chName = e.name.replace('[]', '');
								chMulti[chName] = 1;
							} else {
								chName = e.name;
							}
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
					for (c in chStack) {
						if ( ! c.isPrototypeOf(chStack) ) {
							res[c] = ( c in chMulti ) ? chStack[c] : chStack[c][0];
						}
					}
				}
				// posted value has array?
				for (ipt in iptArr) {
					if (! ipt.isPrototypeOf(iptArr)) {
						res[ipt] = iptArr[ipt];
					}
				}
				// select elements
				select = elm.getElementsByTagName('select');
				selectlen = select.length;
				for (j = 0; j < selectlen; j++) {
					s = select[j].options;
					sl = s.length;
					for (k = 0; k < sl; k++) {
						if (s[k].selected === true) {
							if (select[j].multiple) {
								if (res[select[j].name]) {
									res[select[j].name].push(s[k].value);
								} else {
									res[select[j].name] = s[k].value;
								}
							}
							else {
								res[select[j].name] = s[k].value;
								break;
							}
						}
					}
				}
				// textarea elements
				textarea = elm.getElementsByTagName('textarea');
				textarealen = textarea.length;
				for (m = 0; m < textarealen; m++) {
					res[textarea[m].name] = textarea[m].value;
				}
				
				// destory reference
				chStack = chMulti = null;
				return res;
			},
			// trim - 前後の空白文字をカット
			trim : function(str) {
				return ( String.prototype.trim )
				          ? str.trim()
				          : str.replace(/^\s+|\s+$/, '');
			},
			// ucfirst - 先頭の文字だけを大文字にする
			ucfirst : function(str) {
				return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
			},
			// br2nl - brタグを改行コードに変換
			br2nl : function(str) {
				return str.replace(/<br\s?\/?>/g, '\n');
			},
			// nl2br - 改行コードを<br />タグに変換
			nl2br : function(str) {
				return str.replace(/\r\n/g, '<br />').replace(/\r|\n/g, '<br />');
			},
			// javascript Stringを削除
			clean : function(str, ignoreScript) {
				var quoteMode = ignoreScript || true, i;

				if (typeof str == 'object') {
					for (i in str) {
						if (!i.isPrototypeOf(str)) {
							str[i] = this.clean(str[i], quoteMode);
						}
					}
					return str;
				}
				if (quoteMode) {
					str = str.replace(/javascript:/ig, '[removedprotocol]');
				}
				return str.replace(/&/g, '&amp;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')
							.replace(/"/g, '&quot;')
							.replace(/\'/g, '&#039;');
			},
			// 配列の中に一致する要素があるかどうかを判定
			// 第三引数がtrueなら型の一致もチェック
			inArray : Array.inArray || function(v, arr, strict) {
				var len = arr.length,
					i = 0,
					s = strict || false;

				for (; i < len; i++) {
					if (arr[i] == v) {
						if (s) {
							if (arr[i] === v) {
								return true;
							}
						} else {
							return true;
						}
					}
				}
				return false;
			},
			// forEach : Array#forEach実装
			forEach : function(ary, fn) {
				// native API exists?
				if ( ary.forEach ) {
					return ary.forEach(fn); 
				}
				var i = -1;
				
				while ( ary[++i] ) {
					fn.call(ary[i], i);
				}
			},
			//getDefaultWH - 要素のデフォルトサイズを取得する
			getDefaultWH : function(e) {
				var elm = DOM(e),
					dis = elm.readStyle('display'),
					w = elm.readStyle('width'),
					h = elm.readStyle('height'),
					abs;

				elm.addStyle({
					width : 'auto',
					height : 'auto',
					display : 'block'
				});
				abs = {
					width : e.offsetWidth,
					height : e.offsetHeight
				};
				elm.addStyle({
					width : w,
					height : h,
					display : dis
				});
				return abs;
			},
			// toURIParams - オブジェクトをURIパラメータ形式に変換
			toURIParams : function(data) {
				if (!this.isObject(data)) {
					throw TypeError('argument must be an Object.');
					return;
				}
				var ret = [],
					i;

				for (i in data) {
					if ( !i.isPrototypeOf(data)) {
						ret[enc(i)] = enc(data[i]);
					}
				}
				return ret.join('&=');
			},
			// getExecuteName - ロードした関数の連結名をロードURIから取得
			getExecuteNames : function(func) {
				var ts,
					n = this.getRealName(func),
					sc = doc.getElementsByTagName('script'),
					len = sc.length,
					i = len - 1,
					sp;

				if (!n || n === '') {
					throw Error('extend class name is undefined.');
					return;
				}
				for (; i >= 0; i--) {
					if (sc[i].src && sc[i].src.indexOf(n) !== -1) {
						ts = sc[i].src;
						break;
					}
				}
				if (!ts || ut.grep(ts, '?')) {
					return {name : n, bindName : n};
				}
				sp = ts.split('&');
				return {
					name : n,
					bindName : (sp[1] && ut.grep(sp[1], 'bind')) ? sp[1].split('=')[1] : n
				};
			},
			// getRealName - 関数から定義名のみを取り出す
			getRealName : function(func){
				return func.name || (function(){
						var name = func.toString();

						return name.slice(9, name.indexOf('('));
					})();
			},
			// cleanEvElm - ページのunload時に全イベント解除と拡張エレメントを削除する
			cleanEvElm : function() {
				Base.event.deleteAllEvent();
				STACK.ELEMENTS = [];
				STACK.GLOBAL_LAYER = null;
				STACK.DEFFERD = {};
			},
			// camel - ハイフンの次の文字をキャメルケースにする
			camel : function(str) {
				var spl, p, i = 0;

				if (str in STACK.CAMELED_PROP) {
					return STACK.CAMELED_PROP[str];
				}
				if (!ut.grep(str, '-')) {
					return str;
				}
				spl = str.split('-');
				p = [spl[0]];
				while (spl[++i]) {
					p[i] = spl[i].charAt(0).toUpperCase() + spl[i].slice(1).toLowerCase();
				}
				STACK.CAMELED_PROP[str] = p.join('');
				return STACK.CAMELED_PROP[str];
			},
			// deCamel - キャメライズされた文字をハイフン＋小文字に戻す
			deCamel : function(str) {
				var ret;

				if (str in STACK.DECAMELED_PROP) {
					return STACK.DECAMELED_PROP[str];
				}
				ret = str.replace(/([A-Z]{1})/g, '-$1').toLowerCase();
				STACK.DECAMELED_PROP[str] = ret;
				return ret;
			},
			// exists - 関数が定義されているかをチェックする
			exists : function(fn) {
				var h = CORE_CONFIG.globalNames.Helper,
					obj = (h != '') ? win[h] : win;

				return !!obj[fn];
			},
			// makeFilter - IE用のfilter文字列を生成する
			makeFilter : function(type, value, ext) {
				switch (type) {
				case 'op' : return 'alpha(opacity=' + (value.indexOf('.') !== -1) ? value * 100 : value + ')';
				case 'png' : return 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src=' + value + ', sizingMethod=' + ((ext) ? ext : 'scale') + ')';
				default : return '';
				}
			},
			toString : function(){
				return '[ Class Utility ]';
			}
		};
	// <-- Utility =============================================================================

	// Firefox on Event::offsetX, Event::offsetY
	if (ua.Firefox) {
		win.Event.prototype.__defineGetter__('offsetX', function() {
			return this.layerX;
		});
		win.Event.prototype.__defineGetter__('offsetY', function() {
			return this.layerY;
		});
		win.Event.prototype.__defineGetter__('wheelData', function() {
			return this.detail;
		});
	}

	// Eventクラス -- クロスブラウザなイベントモデルクラス（DOM Level2イベントモデル準拠）
	function Event() {
		this.DRreg = /domready/i;
		this.ae = STACK.AJAX_EVENTS;
		this.df = STACK.DOM_LOADED_FUNCS;
		this.lf = STACK.LOADED_FUNCS;
		this._customEvents = [];
		this._AjaxEventNames = {'AjaxEnd' : 1, 'AjaxComplete' : 1, 'AjaxError' : 1};
		this.EXPR_LIVE_LIST = [];
		this.LIVE_LIST = [];
		this.LIVE_EVENTS = 'mousemove|mouseout|mouseover|mousedown|mouseup|mousewheel|DOMMouseScroll|click|keydown|keypress|keyup';
	}

		Event.prototype = {
			/**
			 * set - イベントセット
			 * @param Element elm : イベント設定要素
			 * @param String type : イベントタイプ
			 * @param Function listener : イベントリスナ
			 * @param Object bindObj : callコンテキストオブジェクト
			 * @param Boolean isOnce : 一度だけ実行するかどうかのフラグ
			 * @param Booelan isCapture : キャプチャフェーズでハンドリングするかどうか
			 */
			set : function(elm, type, listener, bindObj, isOnce, isCapture) {
				var bind = bindObj || false,
					target = (elm instanceof xElement) ? elm.get() : elm,
					closure,
					once = isOnce || false,
					capture = isCapture || false,
					df = this.df,
					lf = this.lf;

				// Ajaxカスタムイベントの場合はスタックに追加
				if (this._AjaxEventNames[type]) {
					this.ae[this.ae.length] = [target, type, listener, bind, once];
					return;
				} else if ( type in CUSTOM_EVENT._customs ) {
					CUSTOM_EVENT.add(target, type, listener, bind, once);
					return;
				}
				if (type === 'mousewheel'
						&& (!('onmousewheel' in body) && ua.Opera)) {
					type = 'DOMMouseScroll';
				}
				// イベントクロージャ生成
				closure = this.__createClosure(target, type, listener, bind, once, capture);

				// document.readyの場合は既にロード済みなら実行、まだならキューに追加
				if (this.DRreg.test(type)) {
					df[df.length] = [closure, bind];
				} else if (type === 'load' && target === win) {
					lf[lf.length] = [closure, bind];
				} else {
					this.__set(target, type, closure, listener, capture);
				}
			},
			// once - 一度だけ実行するイベントを設定する
			// setメソッドに第５引数を渡すためのシンタックスシュガー
			once : function(target, type, listener, bindObj) {
				this.set(target, type, listener, bindObj, true);
			},
			/**
			 * custom - カスタムイベント生成
			 * @param Element target : イベント設定要素
			 * @param String type : カスタムイベント名
			 * @param Function listener : イベントリスナ
			 * @param bindObj : call1コンテキストオブジェクト
			 */
			custom : function(target, type, listener, bindObj) {
				var bind = bindObj || false,
					elm = (target instanceof xElement) ? target.get() : target,
					closure = this.__createWrap(target, listener, bind, type, false),
					ael = 'addEventListener',
					ce = this._customEvents;

				if (target[ael]) {
					target[ael](type, closure, false);
				}
				ce[ce.length] = [target, type, listener, closure, bind];
				return;
			},
			/**
			 * removeCustom - カスタムイベント削除
			 * @param Element target : カスタムイベントを設定した要素
			 * @param String type : カスタムイベント名
			 * @param Function listener : イベントハンドラ
			 */
			removeCustom : function(target, type, listener) {
				var c = this._customEvents,
					len = c.length,
					i = 0,
					elm = (target instanceof xElement) ? target.get() : target,
					del = 'removeEventListener', dt = 'detachEvent';

				for (; i < len; i++) {
					if (c[i][0] === elm && c[i][1] === type && (!listener || c[i][2] === listener)) {
						if (elm[del]) {
							elm[del](type, c[i][3], false);
						} else if (elm[dt]) {
							elm[dt]('on' + type, c[i][3]);
						}
						c.splice(i, 1);
					}
				}
			},
			/**
			 * fire - イベント発火
			 * @param Element target : イベント発生コンテキスト要素
			 * @param String type : イベントタイプ
			 * @param mixed data : イベントに渡すパラメータ
			 * @param String dataType : イベントデータタイプ
			 */
			fire : function(target, type, data, dataType) {
				var e,
					elm = (target instanceof xElement) ? target.get() : target,
					dp = 'dispatchEvent',
					fe = 'fireEvent';

				if (doc.createEventObject) {
					e = doc.createEventObject();
					e.type = type;
				} else if (doc.createEvent){
					e = doc.createEvent('Events');
					e.initEvent(type, true, true);
				} else {
					throw new Error('don\'t supports custom Event on your Browser');
					return;
				}
				e.dataType = dataType;
				e.data = data;
				if ( type in CUSTOM_EVENT._customs ) {
					CUSTOM_EVENT.dispatch(target, e);
					return;
				}
				if (elm[dp]) {
					elm[dp](e);
				} else if (elm[fe]) {
					// IEは未定義のイベントタイプは例外を投げるようなので、自力で特定し、ディスパッチ
					var c = EV.CUSTOM_EVENTS,
						len = c.length,
						i = 0;

					for (i; i < len; i++) {
						if (c[i][1] === type) {
							c[i][2].call(c[i][3], new Base.event.__margeDOM2Event(c[i][0], e, data, dataType));
						}
					}
				}
			},
			/**
			 * live 動的イベントハンドリング
			 * @param Element elm : イベント監視起点ノード
			 * @param String type : イベントタイプ
			 * @param Function listener : イベントハンドラ
			 * @param Object bindObj : callコンテキストオブジェクト
			 */
			live : function(elm, type, listener, bindObj) {
				var expr = DOM.__fallbackQuery(elm);

				this.exprLive(expr, type, listener, bindObj || undefined, elm);
			},
			/**
			 * exprLive - CSSセレクタ指定型の動的イベントハンドリング
			 * @param String expr : CSSセレクタフォーマット
			 * @param String type : イベントタイプ
			 * @param Function listener : イベントハンドラ
			 * @param Object bindObj : callコンテキストオブジェクト
			 * @param Element baseNode : イベント監視起点ノード
			 */
			exprLive : function(expr, type, listener, bindObj, baseNode) {
				if (type.indexOf(this.LIVE_LIST) === -1) {
					return;
				}
				var bind = bindObj || false,
					closure = this.__createLiveClosure(listener, bind, type, expr),
					ELL = this.EXPR_LIVE_LIST;

				this.__set(baseNode || doc, type, closure, listener);
				ELL[ELL.length] = [type, listener, expr, closure, baseNode || doc];
			},
			/**
			 * delive - 動的イベントハンドリング解除
			 * @param Element elm : イベント監視起点要素
			 * @param String type : イベントタイプ
			 * @pram Function listener : イベントハンドラ
			 */
			deLive : function(elm, type, listener) {
				var expr = DOM.__fallbackQuery(elm);

				this.exprdeLive(expr, type, listener, bindObj || undefined, elm);
			},
			/**
			 * exprdeLive - CSSセレクタ指定動的イベントハンドリング解除
			 * @param String expr : CSSセレクタフォーマット
			 * @param String type : イベントタイプ
			 * @param Function listener : イベントハンドラ
			 */
			exprdeLive : function(expr, type, listener, baseNode) {
				var live = this.EXPR_LIVE_LIST,
					len = live.length,
					i= 0,
					base = baseNode || doc;

				for (; i< len; i++) {
					if (live[i] && live[i][0] === type
							&& live[i][2] === expr
							&& live[i][4] === base
							&& (!listener || live[i][1] === listener)) {
						this.__remove([live[i][4], live[i][0], live[i][3]], i, live);
					}
				}
			},
			/**
			 * remove - イベント監視解除
			 * @param Element target : イベントを設定した要素
			 * @param String type : イベントタイプ
			 * @param Function listener : イベントハンドラ
			 */
			remove : function(target, type, listener) {
				var fns = STACK.EVENT_HANDLERS,
					fnslen = fns.length,
					i = fnslen - 1,
					ind = -1;

				if (ut.isArray(type)) {
					while(type[++ind]) {
						if (type[i]) {
							this.remove(target, type[i], listener || undefined);
						}
					}
					return;
				}
				if (this._AjaxEventNames[type]) {
					this.__removeAjaxEvents(target, type, listener);
					return;
				} else if ( type in CUSTOM_EVENT._customs ) {
					CUSTOM_EVENT.remove(target, type, listener);
					return;
				}


				for (; i >= 0; i--) {
					if (fns[i][0] === target
							&& fns[i][1] === type
							&& (!listener || fns[i][3] === listener)) {
						this.__remove(fns[i], i, fns);
					}
				}
			},
			/**
			 * _remove - イベント削除実行
			 * @param Array arr イベントスタック
			 * @param Number num : イベント管理連番
			 * @param Array marr : イベントスタックマスターデータ
			 */
			__remove : function(arr, num, marr) {
				var re = 'removeEventListener',
					de = 'detachEvent';

				if (arr[0][re]) {
					arr[0][re](arr[1], arr[2], arr[4]);
				} else if (arr[0][de]) {
					arr[0][de]('on' + arr[1], arr[2]);
				} else {
					arr[0]['on' + arr[1]] = null;
				}
				marr.splice(num, 1);
			},
			/**
			 * __isAlready - イベントがセットされているかどうかチェック
			 * @param Element target : イベント設定要素
			 * @param String type : イベントタイプ
			 * @param Function listener : イベントハンドラ
			 */
			__isAlready : function(target, type, listener) {
				var fns = STACK.EVENT_HANDLERS,
					fnslen = fns.length,
					i = fnslen - 1;

				for (; i >= 0; i--) {
					if (fns[i][0] === target
							&& fns[i][1] === type
							&& fns[i][3] === listener) {
						return true;
					}
				}
				return false;
			},
			/**
			 * __createClosure - イベントハンドラクロージャ生成
			 * @param Element target : イベント発生要素
			 * @param Function lis : イベントハンドラ
			 * @param mixed bind : callコンテキストオブジェクト
			 * @param String type : イベントタイプ
			 * @param Boolean isOnce : 実行後に削除するか
			 */
			__createClosure : function(target, type, lis, bind, isOnce, capture) {
				var that = this;

				return function(ev) {
					var event = new Base.event.__margeDOM2Event(target, ev || win.event);
					
					if (isOnce === true) {
						Base.event.remove(target, type, lis);
					}
					if (capture && enables.fixIE) {
						win.event.useCapture = true;
					}
					if ( lis.call(bind || target, event) === false ) {
						event.preventDefault();
					}
				};
			},
			/**
			 * __createLiveClosure - liveExpr用ラッパー関数生成
			 * @param Function listener イベントハンドラ
			 * @param mixed bindObj : callコンテキストオブジェクト
			 * @param String type : イベントタイプ
			 * @param String expr : CSSセレクタ
			 */
			__createLiveClosure : function(listener, bindObj, type, expr){
				var that = this;

				return function(ev) {
					var e = ev || win.event,
						elm = e.target || e.srcElement,
						list = DOM.getElementsBySelector(expr),
						len = list.length,
						i = 0,
						evt = new that.__margeDOM2Event(elm, e);

					if (elm.nodeType === 3) {
						elm = elm.parentNode;
					}
					for (; i < len; i++) {
						if (list[i] === elm) {
							if ( listener.call(bindObj || elm, evt) === false ) {
								evt.preventDefault();
							}
							return;
						}
					}
				};
			},
			/**
			 * __set - イベントリスナ設定
			 * @param Element target : イベントを設定する要素
			 * @param String type : イベントタイプ
			 * @param Function wrap : クロージャハンドラ
			 * @param Function fn : イベントハンドラ
			 * @param Boolean capture : キャプチャフェーズかどうか
			 */
			__set : function(target, type, wrap, fn, capture) {
				var ael = 'addEventListener',
					at = 'attachEvent',
					EH = STACK.EVENT_HANDLERS;

				if (target[ael]) {
					target[ael](type, wrap, capture);
				} else if (target[at]) {
					target[at]('on' + type, wrap);
				} else {
					target['on' + type] = wrap;
				}
				EH[EH.length] = [target, type, wrap, fn, capture];
			},
			/**
			 * deleteAllEvent - すべてのイベントリスナ開放
			 * 主にメモリリーク対策
			 */
			deleteAllEvent : function() {
				var fns = STACK.EVENT_HANDLERS,
					len = fns.length,
					i = 0,
					t, e, f,
					del = 'removeEventListener',
					dt = 'detachEvent';

				for (; i < len; i++) {
					t = fns[i][0];
					e = fns[i][1];
					f = fns[i][2];
					if (!t || !e || !f) {
						continue;
					}
					if (t[del]) {
						t[del](e, f, fns[4]);
					} else if (t[dt]) {
						t[dt]('on' + e, f);
					} else {
						t['on' + e] = null;
					}
				}
				STACK.EVENT_HANDLERS = [];
			},
			/**
			 * __execDOM - DOMツリー構築完了時のハンドラーを実行（1回のみ）
			 */
			__execDOM : function() {
				SYSTEM.DOM_LOADED = true;
				SYSTEM.DOM_CREATE_TIME = (new Date()).getTime() - SYSTEM.INITIAL_TIME;
				STACK.BODY = STACK.HTML = body = doc.body;

				var api = STACK.API_STACK,
					apilen = api.length,
					s,
					css = STACK.CSS_STACK,
					csslen = css.length,
					a = 0, tmp,
					f = STACK.DOM_LOADED_FUNCS,
					len2 = f.length;

				// STACKからAPIのロード
				if (apilen > 0) {
					for (a = 0; a < apilen; a++) {
						apiLoad('script', api[a][0]);
					}
				}
				// STACkからCSSのロード
				for (a = 0; a < csslen; a++) {
					apiLoad('css', css[a][0], css[a][1] || null);
				}
				// STACKからDOMハンドラー実行
				for (a = 0; a < len2; a++) {
					f[a][0]();
				}
				// 全てのシステムの準備が完了したらコントローラの初期メソッド実行
				if (ut.isFunction(SYSTEM.START_CONTROLLER)) {
					SYSTEM.START_CONTROLLER();
				};
			},
			/**
			 * __execLoad - window.onload時のハンドラーを実行（1回のみ）
			 */
			__execLoad : function(e) {
				SYSTEM.WINDOW_LOADED = true;
				SYSTEM.WINDOW_LOADED_TIME = (new Date()).getTime() - SYSTEM.INITIAL_TIME;

				// STACKからonloadハンドラー実行
				var f = STACK.LOADED_FUNCS,
					len = f.length,
					i = 0;

				for (; i < len; i++) {
					f[i][0]();
				}
			},
			/**
			 * __margeDOM2Event - DOM Level2 Eventモデルをエミュレート
			 * @note 既知の問題
			 *  webkit Safariの旧バージョン(ver 2.x?)はevent.targetにテキストノードを示す場合がある
			 *  IE9以前はそもそも独自イベントモデルなのでマージする
			 */
			// @access private
			__margeDOM2Event : function(elm, eObj, data, dataType) {
				// IE9とSafari以外はDOMイベントモデルでビルド
				if ((!ua.IE && !ua.Safari) || ua.IE9) {
					return eObj;
				}
				var sc = ut.getScrollPosition(),
					b = eObj.button;

				// イベントプロパティをマージ
				this.__nativeEV = eObj;
				this.type = eObj.type;
				this.data = eObj.data || data || null;
				this.dataType = eObj.dataType || dataType || null;
				this.target = eObj.target || eObj.srcElement;
				if ( this.target && this.target.nodeType && this.target.nodeType === 3 ) {
					this.target = this.target.parentNode;
				} 
//				this.target = (eObj.target) ? (eObj.target.nodeType === 3) ? eObj.target.parentNode
//													: eObj.target
//													: eObj.srcElement;
				this.currentTarget = elm;
				this.relatedTarget = eObj.relatedTarget ||
				                     (eObj.type === 'mouseover')
					                     ? eObj.fromElement
					                     : eObj.toElement || undefined;
				this.keyCode = eObj.keyCode;
				this.shiftKey = eObj.shiftKey;
				this.ctrlKey = eObj.ctrlKey;
				this.propertyName = eObj.propertyName || undefined;
				this.pageX = eObj.pageX || (eObj.clientX + sc.x);
				this.pageY = eObj.pageY || (eObj.clientY + sc.y);
				this.clientX = eObj.clientX;
				this.clientY = eObj.clientY;
				this.detail = eObj.wheelData || eObj.detail;
				if (ua.IE) {
					this.button = (b == 4) ? 1 : (b == 1) ? 0 : b;
					this.which = (b == 4) ? 2 : (b == 2) ? 3 : b;
					this.stopPropagation = function() {
						this.__nativeEV.cancelBubble = true;
					};
					this.preventDefault = function() {
						this.__nativeEV.returnValue = false;
					};
				} else {
					this.button = eObj.button;
					this.which = eObj.which;
//					this.stopPropagation = eObj.stopPropagation;
//					this.preventDefault = eObj.preventDefault;
					this.stopPropagation = function() {eObj.stopPropagation(); };
					this.preventDefault = function() {eObj.preventDefault(); };
				}
			},
			toString : function() {
				return '[ Class Event ]';
			}
		};

	// <-- Event =============================================================================
		
	// CustomEvent -- カスタムイベントを定義する
	function CustomEvent() {
		this._customs = {};
		this._customsStack = {};
	}
		// prototypes
		CustomEvent.prototype = {
			// regist : カスタムイベント登録
			regist : function(type, bindType, judgeFunc) {
				if ( !type || !bindType ) {
					throw Error('parameters not enough at CustomEvent.regist.');
					return;
				}
				this._customs[type] = {type : bindType, fn : judgeFunc};
			},
			// destroy : カスタムイベント破棄
			destroy : function(type) {
				if ( type in this._customs ) {
					delete this._customs[type];
				}
			},
			// add : カスタムイベントバインド
			add : function(target, type, listener, bindObj, isOnce) {
				if ( ! this._customs[type] ) {
					return;
				}
				var CE = this._customs[type],
					CES = this._customsStack,
					ael = 'addEventListener',
					ate = 'attachEvent',
					closure = this.__createCustomClosure(target, type, listener, CE.fn, bindObj, isOnce),
					stack = {target : target, type : type, closure : closure, listener : listener, isOnce : isOnce || false};
				
				if ( target[ael] ) {
					target[ael](CE.type, closure, false);
				} else if ( target[ate] ) {
					target[ate]('on' + CE.type, closure);
				} else {
					target['on' + CE.type] = closure;
				}
				if ( CES[type] ) {
					CES[type][CES[type].length] = stack;
				} else {
					CES[type] = [stack];
				}
			},
			// remove : カスタムイベントの監視終了
			remove : function(target, type, listener) {
				if ( ! this._customs[type]
						|| ( ! this._customsStack[type] || this._customsStack[type].length === 0 )) {
					return;
				}
				var CES = this._customsStack[type],
					CE = this._customs[type],
					i = CES.length,
					rel = 'removeEventListener',
					dte = 'detachEvent',
					S;
				
				while ( CES[--i] ) {
					S = CES[i];
					if ( S.target === target && ( !listener || (listener && S.listener === listener)) ) {
						if ( target[rel] ) {
							target[rel](CE.type, S.closure, false);
						} else if ( target[dte] ) {
							target[dte]('on' + CE.type, S.closure);
						} else {
							target['on' + CE.type] = null;
						}
						CES.splice(i, 1);
					}
				}
			},
			// dispatch : カスタムイベント発火
			dispatch : function(target, evt) {
				if ( ! this._customs[type]
						|| ( ! this._customsStack[type] || this._customsStack[type].length === 0 )) {
					return;
				}
				var CES = this._customsStack[type],
					CE = this._customs[type],
					i = CES.length,
					S;
				
				while ( CES[--i] ) {
					S = CES[i];
					if ( S.target === target ) {
						S.closure(evt);
					}
				}
			},
			// __createCustomClosure : カスタムイベント用クロージャ発行
			__createCustomClosure : function(target, type, listener, fn, bindObj, isOnce) {
				var that = this;
				
				return function(ev) {
					var evt = ev || win.event;
					if ( fn(target, evt) === true ) {
						listener.call(bindObj, new Base.event.__margeDOM2Event(target, evt));
						if ( isOnce ) {
							that.remove(target, type, listener);
						}
					}
				}
			},
			toString : function() {
				return '[class CustomEvent]';
			}
		};
		
		
	// <-- CustomEvent =======================================================================
		
	// Loaderクラス -- APIロードやCSSのロードを担当する
	function Loader() {
		this.ap = {};
		this.apcs = {};
		this.instanced = STACK.INSTANCED_API;
		this.appPath = CORE_CONFIG.APPPATH;

		// SWF用設定
		this.swfDefaultOptions = { scale : 'noScale', salign : 'lt', menu : false, wmode : 'transparent' };
	}

		Loader.prototype = {
			config : function(name) {
				if (ut.isString(name) && !(name in this.ap)) {
					this.__loadAPI(this.appPath + 'config/' + name + 'js');
				}
			},
			helper : function(name) {
				var i = 0, len,
					hp = CORE_CONFIG.globalNames.Helper,
					loadName;

				if (ut.isArray(name)) {
					for (len = name.length; i < len; i++) {
						this.helper(name[i]);
					}
					return;
				} else if (typeof name === 'string'){
					loadName = name.replace('_helper', '') + '_helper';

					if (loadName in this.ap) {
						return;
					}
					// グローバル空間にヘルパーオブジェクトがなければ作成
					if (hp != '' && !win[hp]) {
						win[hp] = {};
					}

					// ヘルパー関数チェックメソッドをグローバルに追加
					if ( !win.functionExists) {
						win.functionExists = ut.exists;
					}
					this.__loadAPI(this.appPath + 'helpers/' + loadName + '.js', loadName, 'h');
				}
			},
			library : function(name) {
				this.__lbLoad(name, 'libraries/', 'l');
			},
			model : function(name) {
				this.__lbLoad(name, 'models/', 'mo');
			},
			__lbLoad : function(name, dir, type) {
				var i, len;

				if (ut.isArray(name)) {
					for (i = 0, len = name.length; i < len; i++) {
						this.__lbLoad(name[i], dir, type);
					}
					return;
				} else if (typeof name === 'string') {
					if (name in this.ap) {
						// インスタンス済みの場合は即座にattach
						if (this.instanced[name]) {
							Controller[name] = this.instanced[name];
							return;
						}
					} else {
						this.__loadAPI(this.appPath + dir + name + '.js', name, type);
					}
					STACK.API_READY[name] = false;
				}
			},
			module : function(name) {
				var i , len, m;

				if (ut.isArray(name)) {
					for (i = 0, len = name.length; i < len; i++) {
						this.module(name[i]);
					}
					return;
				} else if (typeof name === 'string') {
					m = CORE_CONFIG.globalNames.Module;
					if (!win[m]) {
						win[m] = Module;
					}
					if (name in this.ap) {
						return;
					}
					if (MODULES.hasOwnProperty(name)) {
						if (!Module[name]) {
							Module[name] = MODULES[name];
						}
						this.ap[name] = true;
					} else {
						this.__loadAPI(this.appPath + 'modules/' + name + '.js', name, 'm');
					}
				}
				STACK.MODULE_READY[name] = false;
			},
			css : function(css, media) {
				if (css in this.apcs) {
					return;
				}
				this.__loadCSS(this.appPath + 'fl_css/' + css + '.css', css, media || false);
			},
			ajax : function() {
				if ( ! Controller.ajax ) {
					Controller.ajax = new AjaxInit();
				}
			},
			view : function(path, appendObj, async) {
				if (!Controller.ajax) {
					this.ajax();
				}
				Controller.ajax.get(path, {async : !!!async, success : function(resp) {
					DOM(appendObj).append(resp.responseText);
				}});
			},
			plugin : function(name) {
				var i = -1, len;

				if (ut.isArray(name)) {
					while(name[++i]) {
						this.plugin(name[i]);
					}
				} else if (typeof name === 'string') {
					if (!(name in this.ap)) {
						this.__loadAPI(this.appPath + 'plugins/' + name + '.js', name, 'p');
					}
				}
			},
			__loadAPI : function(path, name, type, bind) {
				var SAS = STACK.API_STACK;

				this.ap[name] = name;
				// DOMが構築完了していれば<head>にappend
				if (SYSTEM.DOM_LOADED) {
					apiLoad('script', path);
				} else if (/mo|h|p/.test(type)) {
					// 構築前の場合は、モデル/ヘルパー以外はスタックに追加
					doc.write('<script type="text\/javascript" src="' + path + '" charset="UTF-8"><\/script>');
				} else {
					SAS[SAS.length] = [path, name, type, bind || 0];
				}
			},
			__loadCSS : function(path, name, md) {
				var linkStr,
					SCS = STACK.CSS_STACK;

				if (SYSTEM.DOM_LOADED) {
					apiLoad('css', path, md || null);
				} else if (ua.IE && !ua.IE9) {
					linkStr = ['<link rel="stylesheet" type="text/css" href="', path, '"'];
					if (md) {
						linkStr[linkStr.length] = ' media="', md, '"';
					}
					linkStr[linkStr.length] = ' />';
					doc.write(linkStr.join(''));
				} else {
					SCS[SCS.length] = [name, md || null];
					this.apcs[name] = true;
				}
			},
			language : function(lang) {
				var path = ([this.appPath, 'languages/', (CORE_CONFIG.language || 'japanese'), '.js']).join('');

				if (SYSTEM.DOM_LOADED) {
					apiLoad('script', path);
				} else {
					doc.write('<script type="text\/javascript" src="' + path + '" charset="UTF-8"><\/script>');
				}
				SYSTEM.languages = {};
			},
			__swfInit : function() {
				this.swfDefaultOption = { scale : 'noScale', salign : 'lt', menu : false, wmode : 'transparent'};
			},
			swf : function(mov, id, options, returnable) {
				this.__swfInit();

				if (arguments.length < 1) {
					throw TypeError('not enough arguments of Loader.swf');
					return;
				}
				var obj = doc.createElement('object'),
					str = ['<object '],
					op = options || {},
					opt = union(this.swfDefaultOption, op || {}),
					flvar = ut.toURIParams(op.param || op.flashVars || {}),
					p,
					i;

				if (!returnable) { // return <object> element
					obj.width = op.width || 600;
					obj.height = op.height || 400;
					if (id) {
						obj.id = id;
					}
					for(i in opt) {
						p = doc.createElement('param');
						p.name = i;
						p.value = opt[i];
						obj.appendChild(p);
					}
					// set FlashVars if exists
					if (flvar !== '') {
						p = doc.createElement('param');
						p.name = 'FlashVars';
						p.value = flvar;
						obj.appendChild(p);
					}
					// attach movie
					// IE sets param element with name="movie" attirbute
					if (ua.IE) {
						p = doc.createElement('param');
						p.name = 'movie';
						p.value = mov;
						obj.appendChild(p);
						obj.setAttribute('classid', 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000');
					} else {
					// else, set object element of "data" attribute
						obj.type = 'application/x-shockwave-flash';
						obj.data = mov;
					}
					obj.style.visibility = 'visible';
					if (op.width) {
						obj.style.width = op.width + 'px';
					}
					if (op.height) {
						obj.style.height = op.hjeight + 'px';
					}
					return DOM(obj);
				} else { // return <object> string
					str[str.length] = 'style="visibility:visible;width:' + (op.width || 600) + 'px;height:' + (op.height || 400) + 'px" ';
					if (id) {
						str[str.length] = 'id="' + id + '" ';
					}
					if (ua.IE) {
						str[str.length] = 'classid="clsid:D26CD863-AE6D-11cf-9688-44453540000">';
					} else {
						str[str.length] = 'type="application/x-shockwave-flash" data="', mov, '">';
					}
					for (i in opt) {
						str[str.length] = '<param name="', i, '" value="', opt[i], '" />';
					}
					if (flvar !== '') {
						str[str.length] = '<param name="FlashVars" value="', flvar, '" />';
					}
					str[str.length] = '</object>';
					return str.join('');
				}
			},
			/**
			 * 設定情報からaAPIをautoload
			 */
			_fl_autoLoader : function() {
				var C = CORE_CONFIG,
					path = C.APPPATH,
					boost,
					pls = C.usePlugins;

				// プロファイラを使う場合はロードする
				if (C.useProfiler === true) {
					C.autoLoadModule[C.autoLoadModule.length] = 'flint_profiler';
					Controller.image.preLoad([
					                          path + 'fl_images/fl_tree_marker_close.gif',
					                          path + 'fl_images/fl_tree_marker.gif'
					                          ]);
				}
				// Plugin
				// Prototype拡張を使う場合はロードスタックに追加
				if (C.useBuiltinClassExtend) {
					pls[pls.length] = 'prototype_extend';
				}
				// IE用拡張を行うかどうか
				if (enables.needFixBrowserIE) {
					for (boost in C.IEboost) {
						if (!boost.isPrototypeOf(C.IEboost)
								&& C.IEboost[boost] === true) {
							pls[pls.length] = 'ie-ignite';
							break;
						}
					}
				}
				if (pls.length > 0) {
					this.plugin(pls);
				}


				// Helper
				if (C.autoLoadHelper.length > 0) {
					this.helper(C.autoLoadHelper);
				}

				// Module
				if (C.autoLoadModule.length > 0) {
					this.module(C.autoLoadModule);
				}

				// Model
				if (C.autoLoadModel.length > 0) {
					this.model(C.autoLoadModel);
				}

				// Library
				if (C.autoLoadLibrary.length > 0) {
					this.library(C.autoLoadLibrary);
				}
			},
			toString : function() {
				return '[ Class Loader ]';
			}
		};
	// <-- Loader =============================================================================


	// FL_Image - 画像を扱うクラス（コンフリクト回避のクラス名）
	function FL_Image() {}

		FL_Image.prototype = {
			preLoad : function(img) {
				var i, len, IMG;

				if (ut.isArray(img)) {
					for (i = 0, len = img.length; i < len; i++) {
						this.preLoad(img[i]);
					}
					return;
				} else if (typeof img === 'string') {
					IMG = new Image();
					IMG.src = img;
				}
			},
			getDefaultSize : function(imgObj) {
				var oldW, oldH, def;

				if (imgObj.naturalWidth && imgObj.naturalHeight) {
					return {
						width : imgObj.naturalWidth,
						height : imgObj.naturalHeight
					};
				} else if (imgObj.runtimeStyle) {
					oldW = imgObj.runtimeStyle.width;
					oldH = imgObj.runtimeStyle.height;
					imgObj.runtimeStyle.width = imgObj.runtimeStyle.height = 'auto';
					def = {
						width : imgObj.width,
						height : imgObj.height
					};
					imgObj.runtimeStyle.width = oldW;
					imgObj.runtimeStyle.height = oldH;
					return def;
				} else {
					return {
						width : imgObj.width,
						height : imgObj.height
					};
				}
			},
			toString : function() {
				return '[ Class FL_Image ]';
			}
		};
	// <-- FL_Image =============================================================


	// Languageクラス -- 言語クラス
	function Language() {}

		Language.prototype = {
			// Language.load - 言語ファイルのロード
			load : function(lang) {
				Controller.load.language(lang);
			},
			// Language.line - キーで翻訳
			line : function(key) {
				return SYSTEM.languages[key] || key;
			},
			toString : function() {
				return '[ Class Language ]';
			}
		};
	// <-- Language =============================================================


	// AjaxInitクラス -- Ajax周りを扱うクラス
	function AjaxInit() {
		this.timeout = CORE_CONFIG.AjaxTimeout || 30000;
		this.state = {};
		this.maxConnection = CORE_CONFIG.AjaxMaxConnection;
		this.queue = STACK.AJAX_QUEUE;
	}

		AjaxInit.prototype = {
			/**
			 * 通信デフォルトパラメータ生成
			 */
			__getDefaultOptions : function(m) {
				return {
					method : null,
					param : '',
					success : null,
					error : null,
					async : true,
					start : null,
					abort : null,
					header : null,
					cache : false,
					bind : null,
					timeout : this.timeout
				};
			},
			/**
			 * Ajax通信用オブジェクトを取得する
			 */
			__createXHR : function() {
				var x;

				if (win.XMLHttpRequest) {
					return new XMLHttpRequest();
				} else if (win.ActiveXObject) {
					try {
						x = new ActiveXObject('Msxml2.XMLHTTP');
					} catch (e) {
						try {
							x = new ActiveXObject('Microsoft.XMLHTTP');
						} catch (e) {}
					}
					if (!x) {
						throw Error('XHR don\'t sucport on your browser.');
						return;
					}
					return x;
				}
			},
			/**
			 * setQueue - 通信順番待ちをセットする
			 * @param String type : 通信タイプ
			 * @param String url : 通信URI
			 * @param Object opt : 通信オプション
			 * @return Boolean
			 */
			setQueue : function(type, url, opt) {
				var qID = +new Date(),
					M = this.maxConnection,
					q = this.queue,
					wait = (M === 0 || q.length >= M);

				q[q.length] = {
					stable : wait,
					type : type,
					url : url,
					opt : opt,
					qID : qID
				};
				return !wait;
			},
			/**
			 * __doNextQueue - 待機状態のリクエストがあれば実行、無ければ初期化
			 */
			__doNextQueue : function() {
				var st = this.queue,
					len = st.length,
					i = 0,
					q,
					isEmpty = true; // guard flag

				for (; i < len; i++) {
					if(st[i].stable === true) {
						st[i].stable = isEmpty = false;
						this.__connect(st[i].type, st[i].url, st[i].opt, st[i].opt.param);
						return;
					}
				}
				if(isEmpty === true) {
					this.queue = []; // 待機なし
				}
			},
			/**
			 * __getWrappedResponse - コールバック引き渡し用オブジェクト生成
			 * @param XMLHttpRequest(ActiveXObject) xhr : 通信オブジェクト
			 */
			__getWrappedResponse : function(xhr) {
				return {
					responseText : xhr.responseText,
					responseXML : xhr.responseXML,
					getResponseArray : function(separator) {
						return xhr.responseText.split(separator);
					},
					getAllHeaders : function() {
						var head = xhr.getAllResponseHeaders().split(/\n/),
							hd = {},
							len = head.length,
							i = 0,
							h, p;

						for (; i < len; i++) {
							if (head[i].length === 0) {
								continue;
							}
							h = head[i];
							p = h.indexOf(':');
							hd[tr(h.slice(0, p))] = ut.trim(h.slice(p + 1));
						}
						return hd;
					}
				};
			},
			/**
			 * get - GET通信
			 * @param String url : リクエストURI
			 * @param Object opt : 通信オプション
			 */
			get : function(url, opt) {
				var p = [], i, j, len, ob,
					o = union(this.__getDefaultOptions(), opt || {});

				if (ut.isObject(o.param)) {
					ob = o.param;
					for (i in ob) {
						if (ut.isArray(ob[i])) {
							for (j = 0, len = ob[i].length; j < len; j++) {
								p[p.length] = enc(i) + '=' + enc(ob[i][j]);
							}
						} else {
							p[p.length] = enc(i) + '=' + enc(ob[i]);
						}
					}
					o.param = p.join('&');
				}
				url = this.__buildURL(url, o.param, 'get');
				if ( !this.setQueue('GET', url, o) ) {
					return;
				}
				return this.__connect('GET', url, o, null);
			},
			/**
			 * post - post送信
			 * @param String url : リクエストURI
			 * @param Object opt : 通信オプション
			 */
			post : function(url, opt) {
				var p = [], i, j, len, ob,
					o = union(this.__getDefaultOptions(), opt || {});
				if (ut.isObject(o.param)) {
					ob = o.param;
					for (i in ob) {
						if (i.isPrototypeOf(ob)) {
							continue;
						}
						if (ut.isArray(ob[i])) {
							for (j = 0, len =ob[i].length; j < len; j++) {
								p[p.length] = enc(i) + '[]=' + enc(ob[i][j]);
							}
						} else {
							p[p.length] = enc(i) + '=' + enc(ob[i]);
						}
					}
					o.param = (p.length > 0) ? p.join('&') : null;
				}
				url = this.__buildURL(url, null, 'post');
				if (!this.setQueue('POST', url, o)) {
					return;
				}
				return this.__connect('POST', url, o, o.param);
			},
			/**
			 * head - ヘッダ情報のみ取得
			 * @param String url : リクエストURI
			 * @param Object opt : 通信オプション
			 */
			head : function(url, opt) {
				var that = this,
					xhr = this.__createXHR(),
					timer,
					o = union(this.__getDefaultOptions(), opt || {});

				this.state.request = 'HEAD';
				url = this.__buildURL(url, null, 'head');
				xhr.open('HEAD', url, true);
				this.state.text = 'LOADING';

				// add Ajax header of X-Requested-With
				// if transporter is ActiveXObject, also, set value 'XMLHttpRequest'.
				xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				o.url = url;

				// 接続遮断タイマーセット
				timer = setTimeout(function(){
					that.stop(xhr, o);
					}, this.timeout);

				// onreadystatechangeのハンドラ設定(非同期)
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						clearTimeout(timer);
						if (ut.isFunction(o.success)) {
							if (o.bind) {
								o.success(xhr);
							} else {
								o.success.call(o.bind, xhr);
							}
						}
						xhr.onreadystatechange = null;
						xhr = null;
					}
				};
				xhr.send(null);
				
				return DefferdState(this);
			},
			/**
			 * jsonp - JSONP通信
			 * @param String url : リクエストURI
			 * @param Function callback : コールバック関数
			 * @param Object bind : callコンテキストオブジェクト
			 */
			jsonp : function(url, callback, bind) {
				if (!url || !callback) {
					throw new TypeError('not enough argument on JSONP.');
				}
				var that = this, s,
					bindObj = bind || false,
					tmpSetJSONPTimeStamp = +new Date(),
					cfn = function(obj) {
						if (bindObj) {
							callback.call(bindObj, obj);
						} else {
							callback(obj);
						}
						try {
							delete win['FlintJSONPCallBack' + tmpSetJSONPTimeStamp];
						} catch(e) {
							win['FlintJSONPCallBack' + tmpSetJSONPTimeStamp] = undefined;
						} finally {
							head.removeChild(doc.getElementById('flintjsonpscript' + tmpSetJSONPTimeStamp));
						}
					};

				win['FlintJSONPCallBack' + tmpSetJSONPTimeStamp] = cfn;

				// create connect script element
				s = doc.createElement('script');
				s.type = 'text/javascript';
				s.src = this.__buildURL(url , 'FlintJSONPCallBack' + tmpSetJSONPTimeStamp, 'jsonp');
				s.id = 'flintjsonpscript' + tmpSetJSONPTimeStamp;
				head.appendChild(s);
				
				return DefferdState(this);
			},
			/**
			 * request - 汎用的な通信メソッド。引数でget,post,jsonp, headのいずれかが行える
			 * @param Object opt : 通信オプション
			 * @notice 関数呼び出しコストが一回分増えるので、決まっている場合は対応したメソッドを呼んでください。
			 */
			request : function(opt) {
				var params = union(this.__getDefaultOptions(), opt),
					m;

				if (!opt.url || !opt.method) {
					throw Error('not enough parameter.');
				}
				switch (opt.method.toLowerCase()) {
					case 'get': return this.get(opt.url, opt); break;
					case 'post' : return this.post(opt.url, opt); break;
					case 'jsonp' : return this.jsonp(opt.url, opt.success); break;
					case 'head' : return this.head(opt.url, opt); break;
					default : throw Error('undefined request method');
				}
			},
			/**
			 * __buildURL - 通信形式に従ったURIを生成
			 * @param String url : リクエストURI(セグメントのみを渡した場合はサイトURLを自動付加します)
			 * @param String param : パラメ−タ文字列
			 * @param String method : 通信メソッド
			 * @return String url : 整形後のURL
			 *
			 */
			__buildURL : function(url, param, method) {
				if (!/^http|^file|^\.\.?\//.test(url)) {
					url = CORE_CONFIG.SITE_URL + url;
				}
				if (method === 'get' && param) {
					url += (!/segment|config|/.test(CORE_CONFIG.routingMode)) ? ((/\?/.test(url)) ? '&' + param
																				: '?' + param)
																				: ( (/\/$/.test(url)) ? param.replace(/[=&]/g, '/')
																				: '/' + param.replace(/[=&]/g, '/'));
				} else if (method === 'jsonp') {
					url += (/\?$/.test(url)) ? 'callback=' + param
												: (/\?/.test(url)) ? '&callback=' + param
												: '?callback=' + param;
				}
				return url;
			},
			/**
			 * __connect - Ajaxリスエスト送信メソッド
			 * @param String type : リクエストメソッド
			 * @param String url : リクエストURI
			 * @param Object o : 通信オプション
			 * @param String param : パラメータ
			 */
			__connect : function(type, url, o, param) {
				var that = this,
					xhr = this.__createXHR(),
					timer,
					h,
					j;

				this.state.request = type;
				xhr.open(type, url, o.async);
				if (ut.isFunction(o.start)) {
					if (o.bind) {
						o.start.call(o.bind);
					} else {
						o.start();
					}
				}
				this.state.text = 'LOADING';

				// add Ajax header of X-Requested-With
				// if transporter is ActiveXObject, also, set value 'XMLHttpRequest'.
				xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				if (type === 'POST') {
					xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				}
				// 追加ヘッダ情報があれば付加
				if (ut.isObject(o.header)) {
					h = o.header;
					for (j in h) {
						if (!j.isPrototypeOf(h)){
							xhr.setRequestHeader(j, h[j]);
						}
					}
				}
				if (!o.cache) {
					xhr.setRequestHeader('If-Modified-Since', "01 Jan 1970 00:00:00 GMT");
					xhr.setRequestHeader('Cache-Control', 'no-store, no-chache, must-revalidate, post-check=0, pre-check=0');
					xhr.setRequestHeader('Pragma', 'no-cache');
					xhr.setRequestHeader('Expires', 'Mon, 26, Jul, 1997, 05:00:00 GMT');
				}
				o.url = url;

				// 接続遮断タイマーセット

				timer = win.setTimeout(function(){
						that.stop(xhr, o);
					}, o.timeout);
				
				// onreadystatechangeのハンドラ設定(非同期)
				// ActiveXの場合、正しくreadyStateごとにハンドラが呼ばれない時があるので、setTimeoutで複数回呼び出す（jQuery方式）
				if (o.async) {
					if (enables.xhr) {
						xhr.onreadystatechange = function() {
							that.__loadedFunc(xhr, o, timer);
						};
					} else { // ActiveX
						win.setTimeout(function(){
							that.__loadedFunc(xhr, o, timer);
						}, 10);
					}
				}
				xhr.send(param);
				o._defferd = DefferdState(this);
				
				// Delegate the abort callback
				o._defferd.abort(function() {
					that.stop(xhr, o);
				});

				// 同期通信の場合はここでハンドリング
				if (!o.async) {
					this.__loadedFunc(xhr, o, timer);
				}
				return o._defferd;
			},
			/**
			 * __loadedFunc - 通信状態をハンドリング
			 */
			__loadedFunc : function(xhr, o, timer) {
				var that = this,
					RES = SYSTEM.XHR_RESPONSES,
					resp = null;

				that.state.code = xhr.readyState;

				if (xhr.readyState == 4) {
					try{
						win.clearTimeout(timer);
					} catch(e){}
					
					that.state.text = 'COMPLETED';

					if (xhr.status == 200 || (/^file/.test(o.url))) { // ローカルファイルアクセス
						that.state.httpResponse = 'LOADED';
						resp = that.__getWrappedResponse(xhr);
						if (ut.isFunction(o.success)) {
							if (o.bind) {
								o.success.call(o.bind, resp);
							} else {
								o.success(resp);
							}
						}
						// AjaxEndイベント発行
						that.__doAjaxEvent('AjaxComplete', resp, o, xhr);
						o._defferd.success();
					} else {
						that.state.httpResponse = RES.STATUS[xhr.Status] || 999;
						if (ut.isFunction(o.error)) {
							if (o.bind) {
								o.error.call(o.bind, that.__getWrappedResponse(xhr));
							} else {
								o.error(that.__getWrappedResponse(xhr));
							}
						}
						// AjaxErrorイベント実行
						that.__doAjaxEvent('AjaxError', resp, o, xhr);
						o._defferd.failed();
					}

					//me.xhr = null; // GC破棄
					that.__doAjaxEvent('AjaxEnd', resp, o, xhr);
					that.__doNextQueue();
					// option GC destroy
					that.opt = {};
					if (enables.xhr){
						xhr.onreadystatechange = null;
					}
					xhr = null;
				} else if ( ! enables.xhr ) {
					try{
						win.clearTimeout(timer);
					} catch(e){}
					timer = win.setTimeout(function() {
							that.__loadedFunc(xhr, o, timer);
						}, 10);
				}
			},
			/**
			 * stop - 通信ストップ
			 * @param XMLHttpRequest(ActiveXObject) xhr : 通信オブジェクト
			 * @param Object o : 通信オプション
			 */
			stop : function(xhr, o) {
				xhr.abort();
				if (ut.isFunction(o.stop)) {
					if (o.bind) {
						o.stop.call(o.bind);
					} else {
						o.stop();
					}
				}
				this.__doAjaxEvent('AjaxError', null, o, xhr);
				this.__doAjaxEvent('AjaxEnd', null, o, xhr);
				o._defferd.abort();
			},
			/**
			 * __doAjaxEvent - Ajaxイベント発行
			 * @param String type : 通信メソッド
			 * @param mixed resp : 結果通信結果オブジェクト
			 * @param Object : 通信オプション
			 * @param XMLHttpRequest(ActiveXObject) xhr : 通信オブジェクト
			 */
			__doAjaxEvent : function(type, resp, o, xhr) {
				var st = STACK.AJAX_EVENTS,
					len = st.length,
					i = 0,
					callFn,
					e;

				for (; i < len; i++) {
					if (st[i][1] === type) {
						st[i][2].call(st[i][3], new this.__AjaxFakeEvent(type, st[i][0], xhr, resp, o));
						if (st[i][4] === true) {
							st.splice(i, 1);
						}
					}
				}
			},
			/**
			 * __AjaxFakeEvent - 擬似的なAjaxイベントオブジェクト生成
			 * @param String type : イベントタイプ
			 * @param mixed target : イベント対象
			 * @param XMLHttpRequest(ActiveXObject) xhr : 通信オブジェクト
			 * @param Object data : イベントデータ
			 * @param Object : param : 通信パラメータ
			 */
			__AjaxFakeEvent : function(type, target, xhr, data, p) {
				this.type = type;
				this.data = data;
				this.target = xhr;
				this.params = p;
				this.currentTarget = target;
				this.relatedTarget = null;
				this.keyCode = null;
				this.shiftKey = false;
				this.ctrlKey = false;
				this.which = null;
				this.button = 0;
				this.propertyName = undefined;
				this.pageX = 0;
				this.pageY = 0;
				this.clientX = 0;
				this.clientY = 0;
				this.stopPropagation = returnFalse;
				this.preventDefault = returnFalse;
			},
			toString : function() {
				return '[ Class Ajax ]';
			}
		};
	// <-- AjaxInit ======================================================================================


	// Extendsクラス - クラスの継承関係を管理するクラス
	function Extends(ex, fn) {
		var extend;

		if (typeof ex !== 'string') {
			throw Error('Extend Class must be string!');
			return;
		}
		extend = ex.toLowerCase();

		if (this[extend]) {
			this[extend](fn, extend);
		} else {
			throw new TypeError('undefined extend Class on ClassExtend.');
		}
	}


		Extends.prototype = {
			config : function(fn) {
				var p;

				if (ut.isObject(fn)) {
					for (p in fn) {
						if (!p.isPrototypeOf(fn)
								&& !CORE_CONFIG[p]){
							CORE_CONFIG[p] = fn[p];
						}
					}
				}
			},
			element : function(fn) {
				this.__extend(fn, xElement.prototype);
			},
			nodelist : function(fn) {
				this.__extend(fn, xNodeList.prototype);
			},
			elementlist : function(fn) {
				this.__extend(fn, xNodeList.prototype);
			},
			effect : function(fn) {
				this.__extend(fn. Animation);
			},
			__extend : function(fn, target) {
				var p;

				if (ut.isFunction(fn)) {
					fn = new fn();
				}
				if (ut.isObject(fn)) {
					for (p in fn) {
						if (!p.isPrototypeOf(fn)) {
							target[p] = fn[p];
						}
					}
				}
			},
			controller : function(fn) {
				var con,
					i,
					Method;


//				for (i in Controller) {
//					fn.prototype[i] = Controller[i];
//				}
				fn.prototype = Controller;
				con = new fn();
				SYSTEM.CONTROLLER = con;

				if (CORE_CONFIG.routingMode === 'none') {
					win[SYSTEM.CONTROLLER_NAME] = con;
				}
				if (con.hasOwnProperty('__construct')) {
					con.__construct();
				}
				Method = con.router.fetchMethod();
				SYSTEM.EXEC_METHOD = (Method === 'none') ? 'index' : Method;
				
				function startup() {
					
					if (con.hasOwnProperty('_remap')) {
						con._remap(Method);
					} else if (con.hasOwnProperty(Method)
								&& /^[_]/.test(Method) === false) {
						con[Method].call(con, SYSTEM.METHOD_ARGUMENTS);
					} else {
						if (CORE_CONFIG.debugMode) {
							throw Error(Method + ' is undefined or private');
						}
					}
					SYSTEM.START_CONTROLLER = null;
				}
				if ( ! SYSTEM.DOM_LOADED　) {
					// DOM構築がまだなら、初期メソッドの実行スタック追加
					SYSTEM.START_CONTROLLER = startup;
				} else {
					startup();
				}
			},
			language : function(obj) {
				SYSTEM.languages = obj;
			}
		};
		Extends.prototype.model = Extends.prototype.library = function(fn, type) {
			var names = ut.getExecuteNames(fn),
				tmp,
				i,
				a = STACK.API_READY_FUNC[names.bindName],
				len,
				CON = SYSTEM.CONTROLLER || Controller;

			// Model継承の場合のみprototype継承
			if (type === 'model') {
				fn.prototype = Model;
			}
			tmp = STACK.INSTANCED_API[names.name] = new fn();
			if (tmp.__construct) {tmp.__construct();}
			// parentにコントローラを指定
			tmp.parent = CON;
			// attach先を特定
			CON[names.name] = tmp;
			STACK.API_READY[names.name] = true;
			if (a) {
				for (i = 0, len = a.length; i < len; i++) {
					a[i]();
				}
				a = null;
			}
		};
	// <-- Extends


	// Routerクラス - アクセスURIからルーティングを行い、コントローラ/メソッドを特定する
	function Router() {
		this._controllerName = '';
		this._directoryName = '';
		this._methodName = '';
		this._conf = CORE_CONFIG;
		this._uri = loadClass('URI');
		this.__setRouting();
	}

		Router.prototype = {
			__setRouting : function() {
				switch (this._conf.routingMode) {
				case 'none' :
					this._controllerName = this._conf.globalNames.Controller;
					this._methodName = 'none';
					break;
				case 'segment':
					var l, arg, argC = 2, uri = this._uri.uri,
						base = this._conf.SITE_URL,
						point;

					l = uri.replace(base, '');
					arg = (l === '') ? [this._conf.defaultController, 'index'] : l.split('/');

					while (ut.inArray(arg[0], this._conf.directoryList)) {
						arg[0] = arg[0] + '/' + (arg[1] || '');
						arg.splice(1, 1);
					}

					if (!arg[1]) {
						arg[1] = 'index';
					}
					point = arg[0].lastIndexOf('/');
					if (point === -1) {
						this._controllerName = arg[0];
						this._directoryName = '';
					} else {
						this._directoryName = arg[0].slice(0, point) + '/';
						this._controllerName = arg[0].slice(point + 1);
					}
					this._methodName = arg[1];
					// detect arguments
					while(arg[argC]) {
						SYSTEM.METHOD_ARGUMENTS[arg[argC - 2]] = arg[argC];
						argC++;
					}
					break;
				case 'config':
					// configの場合、設定オブジェクトからコントローラ決め打ち
					this._controllerName = (this._conf.loadController) ? this._conf.loadController
																			: this._conf.defaultController;
					this._methodName = (this._conf.execMethod) ? this._conf.execMethod
																			: 'index';
					break;
				default: break;
				}
			},
			fetchDirectory : function() {
				return this._directoryName;
			},
			fetchClass : function() {
				return this._controllerName;
			},
			fetchMethod : function() {
				return this._methodName;
			},
			toString : function() {
				return '[ Class Router ]';
			}
		};
	// <-- Router


	// FL_Baseクラス - ベースクラス
	function FL_Base() {
		this.instance = this;
	}

		FL_Base.prototype = {
			getInstance : function() {
				return this.instance;
			}
		};
	// <-- FL_Base


	// _Controllerクラス - メインコントローラクラス ========================================================
	function _Controller() {
		this._flInitialize();
	}

		_Controller.prototype = {
			_flInitialize : function() {
				var classes = {
					config : 'Config',
					benchmark : 'BenchMark',
					uri : 'URI',
					lang : 'Language',
					router : 'Router',
					event : 'Event',
					ut : 'Utility',
					load : 'Loader',
					image : 'FL_Image',
					input : 'Input',
					customEvent : 'CustomEvent'
				}, i;

				for (i in classes) {
					this[i] = loadClass(classes[i]);
				}

				this.ua = ua;
				this.ready = ready;
				this.union = union;
				this.alias = alias;
				this.connect = connect;
				this.disConnect = disConnect;
				this.DOM = DOM;
				this.Module = Module;
				this.system = SYSTEM;
				this.Timer = Timer;
				this.json = win.JSON || loadClass('Json');
				this.Animation = Animation;
				this.defferd = DefferdInit;
			},
			__load : function(path) {
				var s;
				
				if ( ! SYSTEM.DOM_LOADED ) {
					doc.write('<script type="text\/javascript" src="' + path + '" charset="UTF-8"><\/script>');
				} else {
					apiLoad('script', path);
				}
			}
		};
	// <-- Controller

	// Modelクラス
	function _Model() {
		this.__construct();
	}

		_Model.prototype = {
			__construct : function() {
				var classes = {
						config : 'Config',
						benchmark : 'BenchMark',
						uri : 'URI',
						ajax : 'AjaxInit',
						lang : 'Language',
						router : 'Router',
						event : 'Event',
						ut : 'Utility',
						load : 'Loader',
						ua : 'UserAgent'
					}, i;

				for (i in classes) {
					this[i] = loadClass(classes[i]);
				}
				this.union = union;
				this.alias = alias;
				this.connect = connect;
				this.json = win.JSON || loadClass('Json');
				this.disConnect = disConnect;
			}
		};
	// <-- _Model

	/**
	 * Moduleクラス
	 * メソッドつきコンストラクタ
	 * @param String method : 実行するメソッド名
	 * @return mixed instance or null
	 */
	function Module(method) {
		var M = win[CORE_CONFIG.globalNames.Module],
			MM = M[method],
			ag = arguments,
			k = 0,
			ind = -1,
			m = [];

		if (!MM) {
			return;
		}
		while(ag[++k]) {
			m[++ind] = ag[k];
		}
		// 内部モジュールの引数は3つまで渡せるがやや原始的な方法
		return MM.apply(MM, m);
//		if (args === 3) {return new M[method](ag[1] || undefined, ag[2] || undefined, ag[3] || undefined);}
//		else if (args === 2) {return new M[method](ag[1] || undefined, ag[2] || undefined);}
//		else if (args === 1) {return new M[method](ag[1] || undefined);}
//		else {return new M[method]();}
	}

	// not prototype!
	/**
	 * Module.ready : モジュールの使用準備開始を待機
	 * @param String apiName : ロードしたモジュール名
	 * @param Function listener : 準備完了時に実行するリスナー
	 */
	Module.ready = function(apiName, listener) {
		var mr = STACK.MODULE_READY,
			mrf = STACK.MODULE_READY_FUNC;

		if (mr[apiName] && mr[apiName] === true) {
			listener();
		} else {
			if (!mrf[apiName]) {
				mrf[apiName] = [listener];
			} else {
				mrf[apiName].push(listener);
			}
		}
	};

	/**
	 * Module.attach - モジュールをこのオブジェクトに追加する
	 * @param mixed Function or Object : 追加するメソッド/メソッド群
	 */
	Module.attach = function(attachObj) {
		var i;

		if (typeof attachObj === 'function') {
			Module[ut.getRealName(attachObj)] = attachObj;
		} else if (typeof attachObj === 'object') {
			for (i in attachObj) {
				if(!i.isPrototypeOf(attachObj)) {
					Module[i] = attachObj[i];
				}
			}
		}
	};

	/**
	 * Module.onReady - モジュール利用可能状態を通知
	 * @param String name : モジュール名
	 */
	Module.onReady = function(name) {
		var mr = STACK.MODULE_READY,
			mrf = STACK.MODULE_READY_FUNC,
			ind = -1;

		if (!mr[name] || mr[name] === false) {
			mr[name] = true;
		}
		if (mrf[name]) {
			if (ut.isArray(mrf[name])) {
				while(mrf[name][++ind]) {
					mrf[name][ind]();
				}
				mrf[name] = []; // once
			} else {
				mrf[name]();
			}
		}
	};

	/*
	 * =====================================================================================================
	 * 内部モジュール
	 * =====================================================================================================
	 */

	// Colorクラス ========================================================================================
	/**
	 * コンストラクタ
	 * 引数のフォーマットでデータを変換
	 * 取り回しが効きそうなので、内部ではRGBでデータを保持
	 */
	function FL_Color(colorStr, type) {
		// props
		this.R = 0;
		this.G = 0;
		this.B = 0;
		this.A = null;
		this.regex = COLOR_REGEX;

		this.__construct(colorStr, type);
	}

		FL_Color.prototype = {
			__construct : function(color, type) {
				// delete white space
				c = color.replace(/\s/g, '');

				// type was defined?
				if (type) {
					this['__parse' + type.toUpperCase()](c);
					return;
				}
				// match regex
				if (this.regex.hex.test(c)) {         // #000000 or #000
					this.__parseHEX(c);
				} else if (this.regex.rgb.test(c)) {  // rgb(255,255,255)
					this.__parseRGB(c);
				} else if (this.regex.rgba.test(c)) { // rgba(255,255,255,1)
					this.__parseRGBA(c);
				} else if (this.regex.hsl.test(c)) {  // hsl(0,100%,50%)
					this.__parseHSL(c);
				} else if (this.regex.hsla.test(c)) { // hsla(0,100%,50%,1);
					this.__psrseHSLA(c);
				} else {
					throw TypeError('invalid color format on Fl_Color. color is ' + c);
				}
			},

			/** ================= getter method ======================= **/
			getAlpha : function() {
				return this.A;
			},

			/** ================= setter method ======================= **/
			setAlpha : function(alpha) {
				this.A = pf(alpha);
			},

			/** ================= boolean method ====================== **/
			hasAlpha : function(alpha) {
				return this.A !== null;
			},

			/** ================= convert methods ===================== **/
			// toHex : #000000形式に変換
			toHex : function() {
				return [
				        '#',
				        this.R.toString(16),
				        this.G.toString(16),
				        this.B.toString(16)
				        ].join('');
			},
			// toRGB : rgb(r,g,b)形式に変換
			toRGB : function() {
				return ['rgb(',
				        this.R, ',',
				        this.G, ',',
				        this.B,
				        ')'
				        ].join('');
			},
			// toRGBA : rgba(r,g,b,a)形式に変換
			toRGBA : function() {
				return ['rgba(',
				        this.R, ',',
				        this.G, ',',
				        this.B, ',',
				        this.A.toFixed(1),
				        ')'
				        ].join('');
			},
			// toHSL : hsl(h,s%,l%)形式に変換
			toHSL : function() {
				var h = 0,
					s = 0,
					l = 0,
					r = this.R / 255,
					g = this.G / 255,
					b = this.B / 255,
					max = Math.max(r ,g, b),
					min = Math.min(r, g, b),
					mm = max + min,
					c = max - min,
					mr = Math.round;

				if (r === g && r === b) {
					h = 0;
					s = 0;
					l = r;
				} else {
					l = mm / 2;
					s = (l <= 0.5) ? c / mm : c / (2 - mm);
					h = ((r === max) ? (g - b) / c
							: (g === max) ? 2 + (b -r) / c
									: (b === max) ? 4 + (r -g) / c
											: 0) * 60;
					h /= 6;
					if (h < 0) {
						++h;
					}

					// correct range
					h = (h < 0) ? 0 : (h > 1) ? 1 : h;
					s = (s < 0) ? 0 : (s > 1) ? 1 : s;
					l = (l < 0) ? 0 : (l > 1) ? 1 : l;
				}
				return ['hsl(',
				        mr(h * 360), ',',
				        mr(s * 100), '%,',
				        mr(l * 100), '%',
				        ')'
				        ].join('');
			},
			// toHSLA : hsla(h,s%,l%,a)形式に変換
			toHSLA : function() {
				return this.toHSL().replace(')', ',' + this.A.toFixed(1) + ')');
			},

			/** ================= parse methods =========================== **/
			// __parseHEX - hexをRGBにパース
			__parseHEX : function(color) {
				var pi = pi,
					c = color.slice(1);
					r1,
					r2,
					r3;

				if (c.length === 3) { // #FFF等の省略指定の場合
					r1 = c.slice(0, 1);
					r2 = c.slice(1, 2);
					r3 = c.slice(2);
				} else {
					r1 = c.slice(0, 2);
					r2 = c.slice(2, 4);
					r2 = c.slice(4);
				}
				this.R = pi(r1, 16);
				this.G = pi(r2, 16);
				this.B = pi(r3, 16);
			},
			// __parseRGB - RGB形式をパース
			__parseRGB : function(color) {
				var m = color.match(this.regex.rgb);

				this.R = m[1];
				this.G = m[2];
				this.B = m[3];
			},
			// __parseRGBA - RGBA形式をパース
			__parseRGBA : function(color) {
				var m = color.match(this.regex.rgba);

				this.R = m[1];
				this.G = m[2];
				this.B = m[3];
				this.A = pf(m[4]);
			},
			// __parseHSL - HSL形式をパース
			// @note : CSS3のHSLのSとLは%形式なので変換が必要
			__parseHSL : function(color) {
				var m = color.match(this.regex.hsl),
					h = pi(m[1], 10) / 360,
					s = pf(m[2] / 100),
					l = pf(m[3] / 100),
					r1,
					g1,
					b1,
					s1,
					s2,
					r,
					g,
					b,
					c;

				if (s === 0) {
					r = g = b = 1;
				} else {
					s2 = (l < 0.5) ? l * (1 + s) : (l + s) - (l * s);
					s1 = 2 * l - s2;
					r1 = h + 1 / 3;

					if (r1 > 1) {
						--r1;
					}
					g1 = h;
					b1 = h - 1 / 3;

					if (b1 < 0) {
						++b1;
					}
					c = s1 + (s2 - s1) * 6;

					r = (r1 < 1 / 6) ? c * r1
							: (r1 < 0.5) ? s2
									: (r1 < 2 / 3) ? c * ((2 / 3) - r1)
											: s1;
					g = (g1 < 1 / 6) ? c * g1
							: (g1 < 0.5) ? s2
									: (g1 < 2 / 3) ? c * ((2 / 3) - g1)
											: s1;
					b  = (b1 < 1 / 6) ? c * b1
							: (b1 < 0.5) ? s2
									: (b1 < 2 / 3) ? c * ((2 / 3) - b1)
											: s1;
				}
				this.R = r * 255;
				this.G = g * 255;
				this.B = b * 255;
			},
			// __parseHSLA
			__parseHSLA : function(color) {
				var m = color.match(this.regex.hsla),
					h = pi(m[1], 10) / 360,
					s = pf(m[2] / 100),
					l = pf(m[3] / 100),
					r1,
					g1,
					b1,
					s1,
					s2,
					r,
					g,
					b,
					c;

				if (s === 0) {
					r = g = b = 1;
				} else {
					s2 = (l < 0.5) ? l * (1 + s) : (l + s) - (l * s);
					s1 = 2 * l - s2;
					r1 = h + 1 / 3;

					if (r1 > 1) {
						--r1;
					}
					g1 = h;
					b1 = h - 1 / 3;

					if (b1 < 0) {
						++b1;
					}
					c = s1 + (s2 - s1) * 6;

					r = (r1 < 1 / 6) ? c * r1
							: (r1 < 0.5) ? s2
									: (r1 < 2 / 3) ? c * ((2 / 3) - r1)
											: s1;
					g = (g1 < 1 / 6) ? c * g1
							: (g1 < 0.5) ? s2
									: (g1 < 2 / 3) ? c * ((2 / 3) - g1)
											: s1;
					b  = (b1 < 1 / 6) ? c * b1
							: (b1 < 0.5) ? s2
									: (b1 < 2 / 3) ? c * ((2 / 3) - b1)
											: s1;
				}
				this.R = r * 255;
				this.G = g * 255;
				this.B = b * 255;
				this.A = m[4];
			}
		};
		// <-- FL_Color
		
	// Defferdクラス ========================================================================================
	/**
	 * 時間のかかる処理系（Ajax、アニメーション）の状態監視クラス
	 * 即時系のオブジェクト、つまり上記以外のオブジェクトはすべて完了状態とする
	 */
	function DefferdState(obj, appointID) {
		
		// object is Defferd instance?
		if ( obj instanceof _Defferd ) {
			// update appointID
			obj._appoint = appointID;
			return obj;
		}
		
		var isD = ( obj instanceof AjaxInit || obj instanceof Animation ),
			state = {
				success : !isD,
				failed : !isD,
				abort : !isD
			};
		
		// return _Defferd intstance
		return new _Defferd(obj, state, appointID || 0);
	}
	
		// marking
		DefferdState.prototype = {};
	
	function _Defferd(obj, state, appointID) {
		this._state = state;
		this._instance = obj;
		this.__isLocked = false;
		this._appoint = appointID;
		this._callbacks = {
			success : [],
			failed  : [],
			abort   : []
		};
	}
	
	_Defferd.prototype = {
		success : function(param) {
			return this.__registOrFire('success', param);
		},
		failed : function(param) {
			return this.__registOrFire('failed', param);
		},
		abort : function(param) {
			return this.__registOrFire('abort', param);
		},
		__registOrFire : function(type, param) {
			var i = -1,
				c = this._callbacks[type];
			
			if ( typeof param === 'undefined' ) {
				// If parameter is none, do complete
				this.__updateState(type);
			} else if ( ut.isFunction(param) ) {
				// Else if parameter is funtion, regist callbacks
				c[c.length] = param;
			} else if ( ut.isArray(param) ) {
				// Else if parameter is Array, regist callbacks too.
				while ( param[++i] ) {
					c[c.length] = param[i];
				}
			}
			return this; // method chain
		},
		isSuccess : function() {
			return this._state.success;
		},
		isFailed : function() {
			return this._state.failed;
		},
		isAbort  : function() {
			return this._state.abort;
		},
		__updateState : function(type) {
			// If state set true either, nothing to do.
			if ( this.__isLocked ) {
				return;
			}
			// initial guard
			this.__isLocked = true;
			this._state[type] = true;
			
			// do ordered callbacks
			var i = -1,
				c = this._callbacks[type];
			
			while ( c[++i] ) {
				c[i]();
			}
			
			// Does this object has appointment?
			if ( this._appoint > 0 ) {
				FL_Defferd.meet(this._appoint, type);
			}
		},
		toString : function() {
			return '[class DefferdState]';
		}
	};
	
	/**
	 * Defferd Appointment Function
	 * Defferdオブジェクトの待ち合わせ
	 */
	
	function FL_Defferd(args) {
		var i = -1,
			ary = [],
			q = ++DEFFERD_ID;
		
		while(args[++i]) {
			ary[ary.length] = DefferdState(args[i], q);
		}
		
		this._callbacks = {
			success : null,
			failed  : null,
			abort   : null
		};
		this.__locked = false;
		this._ary = ary;
		
		STACK.DEFFERD[q] = this;
		return this;
	}
	
	FL_Defferd.meet = function(appID, type) {
		if ( !(appID in STACK.DEFFERD) || this.__locked === true ) {
			return;
		}
		var D,
			flag,
			i = -1,
			SD = STACK.DEFFERD[appID],
			st = SD._ary,
			cb = SD._callbacks;
		
		switch (type) {
		case 'success':
			flag = true;
			// Do callback if all green
			while (st[++i]) {
				D = st[i]._state;
				if ( D.success !== true ) {
					flag = false;
				}
			}
			break;
		default :
			flag = false;
			// Do callback if either failed flag is true
			while (st[++i]) {
				D = st[i]._state;
				if ( D[type] === true ) {
					flag = true;
					break;
				}
			}
			break;
		}
		
		if ( flag === true && ut.isFunction(cb[type])) {
			cb[type]();
			this.__locked = true;
		}
	};
	
		FL_Defferd.prototype = {
			success : function(callback) {
				this._callbacks.success = callback;
			},
			failed : function(callback) {
				this._callbacks.failed = callback;
			},
			abort : function(callback) {
				this._callbacks.abort = callback;
			},
			toString : function() {
				return '[class FL_Defferd]';
			}
		};

	// DOMクラス ==========================================================================================
	/**
	 * コンストラクタ関数
	 * 引数によって挙動を変化
	 * @param mixed elm
	 * 			- undefined : 未定義の場合はbody要素が定義されていれば拡張を返却
	 * 			- xElement instance or xNodelist instance
	 * 				or document or window : 拡張済みの場合はそのまま返却
	 * 			- Element : HTML要素の場合はxElementのインスタンスに変換して返却
	 * 			- HTMLCollection : ノードリストの場合は拡張ノードリストとして返却
	 * 			- JS Array : 配列の場合は中身が要素の物だけをフィルタリングして拡張、返却
	 * 			- String : 文字列の場合はCSSセレクタで検索を試みる
	 * 			- other throw TypeError
	 * @return mixed
	 */
	DOM = function(elm, p) {
		var e,
			i = -1,
			ret = [],
			SE = STACK.ELEMENTS;

		if (!elm) {
			body ? STACK.ELEMENTS[body.__exid] || new xElement(body, null) : null;
		} else if (elm === doc || elm === window
						|| elm instanceof xElement
						|| elm instanceof xNodeList) {
			return elm;
		} else if (elm.nodeType && elm.nodeType === 1) {
			elm.__exid = elm.__exid || ++EXID;
			// スタックにIDがあればそこから返却
			if (elm.__exid && SE[elm.__exid]) {
				return SE[elm.__exid];
			} else {
				e = new xElement(elm, p || null);
				SE[elm.__exid] = e;
				return e;
			}
		} else if (elm.length && elm.item && !elm.slice) { // nodeArray
			// JS Arrayに変換
			while(elm[++i]) {
				ret[i] = elm[i];
			}
			return new xNodeList(ret, p || null);
		} else if (ut.isArray(elm)) { // JS Array
			while(elm[++i]) {
				if (elm[i].nodeType && elm[i].nodeType === 1) {
					ret[ret.length] = elm[i];
				}
			}
			return new xNodeList(ret, p || null);
		} else if (typeof elm === 'string') {
			return new xNodeList(DOM.getElementsBySelector(elm, p || null));
		} else {
			throw TypeError('invalid argument type called DOM.');
		}
	};

	/**
	 * DOM.id - document.getElementByIdのショートカット
	 * @param String id : ID属性値
	 * @return xElement instance
	 */
	DOM.id = function(id) {
		var node;

		if (typeof id !== 'string') {
			return null;
		}
		node = doc.getElementById(id);
		return node && !node.__ignore ? STACK.ELEMENTS[node.__exid] || new xElement(node) : null;
	};

	/**
	 * DOM.className -document.getElementsByClassNameショートカット
	 * @param String v : class属性の値
	 * @param String tag : タグ名指定の場合はセット
	 * @return xNodeList instance
	 */
	DOM.className = function(v, tag) {
		var nl = doc.getElementsByClassName(v),
			r = [],
			ind = -1,
			i = 0;

		while (nl[i]) {
			if (nl[i] && !nl[i].__ignore) {
				r[++ind] = nl[i];
			}
			++i;
		}
		return new xNodeList(r);
	};

	// Compatible unspported method of document.getElementsByClassName
	if ( ! doc.getElementsByClassName) {
		DOM.className = function(v, tag) {
			var nl = doc.getElementsByTagName(tag || '*'),
				r = [],
				ind = -1,
				i = 0;

			if (enables.canASCall) {
				r = Array.prototype.slice.call(nl);
			} else {
				while (nl[i]) {
					if (nl[i] && nl[i].nodeType
							&& nl[i].nodeType === 1
							&& !nl[i].__ignore) {
						r[++ind] = nl[i];
					}
					++i;
				}
			}
			return new xNodeList(DOM.hasClass(r, v));
		};

		DOM.hasClass = function(arr, val) {
			var res = [],
				len = arr.length,
				cName = ' ' + val + ' ',
				e,
				cl,
				ind = -1,
				i = 0;

			for (; i < len; i++) {
				e = arr[i];
				cl = ' ' + e.className + ' ';
				if (cl.indexOf(cName) !== -1) {
					res[++ind] = e;
				}
			}
			return res;
		};
	}

	/**
	 * DOM.tag - タグ名を指定して検索
	 * @param String tag : タグ名
	 * @param Element base : 起点ノード(ネイティブ要素)
	 * @return xNodeList
	 */
	DOM.tag = function(tag, base) {
		var n = base || doc,
			nl = n.getElementsByTagName(tag || '*'),
			i = 0,
			e,
			r = [],
			ind = -1;

		while(nl[i]) {
			e = nl[i];
			if (e && e.nodeType
						&& e.nodeType === 1
						&& !e.__ignore) {
				r[++ind] = e;
			}
			++i;
		}
		return new xNodeList(r);
	};

	/**
	 * DOM.byName - name属性指定検索
	 * @param String name : name属性の値
	 */
	DOM.byName = function(name) {
		var nl = doc.getElementsByName(name),
			i = 0,
			r = [],
			ind = -1,
			e;

		if (enables.canASCall) {
			r = Array.prototype.slice.call(nl);
		} else {
			while(nl[i]) {
				e = nl[i];
				if (e && e.nodeType
						&& e.nodeType === 1
						&& !e.__ignore) {
					r[++ind] = e;
				}
				++i;
			}
		}
		return new xNodeList(r);
	};

	/**
	 * DOM.css - CSSセレクタで検索
	 * @param String expr : CSSセレクタ
	 * @param Bolean isOrig : trueを渡すと独自パースで検索する
	 * 							この場合、独自attribute属性も検索できます
	 * @return xNodeList
	 */
	DOM.css = function(expr, isOrig) {
		var nl = this.getElementsBySelector(expr, doc, !!isOrig);

		return new xNodeList(nl);
	};

	/**
	 * DOM.origCSS - 独自属性が有効なCSSセレクタで検索
	 * @param String expr : CSSセレクタ
	 * @notice DOM.cssに引数を渡すシンタックスシュガーです
	 * @return xNodeList
	 */
	DOM.origCSS = function(expr) {
		var nl = this.getElementsBySelector(expr, doc, true);

		return new xNodeList(nl);
	};

	/**
	 * DOM.create - HTML要素を生成
	 * @param String tag : 要素名
	 * @param Object attr : 生成時に付加する属性ハッシュ
	 * @reutrn xElement
	 */
	DOM.create = function(tag, attr) {
		var e = new xElement(doc.createElement(tag)),
			i;

		if (attr && typeof attr === 'object') {
			for(i in attr) {
				e.attr(i, attr[i]);
			}
		}
		return e;
	};

	/**
	 * DOM.fallbackQuery - トップレベルからみたCSSクエリをビルドする
	 * @param Element e : HTML要素
	 * @return String
	 */
	DOM.fallbackQuery = function(e) {
		if (e === doc || e === win) {
			return '';
		} // document and window have not tagName
		var cl,
			id,
			q,
			ind = -1,
			resQ = [];

		do {
			q = [e.tagName.toLowerCase()];
			if (e.id) {
				q[q.length] = '#' + e.id;
			}
			if (e.className) {
				q[q.length] = '.' + e.className.replace(' ', '.');
			}
			resQ[++ind] = q.join('');
			e = e.parentNode;

		} while (e !== doc);

		return resQ.reverse().join(' > ');
	};

	// ========================= CSSセレクタ検索セクション =========================
	// <-- create scope
	(function() {
		var enb = enables,
			tReg = /^\s+|\s+$/,
			// CSS3セレクタの構成要素を特定するためのReg配列(タグ部分のみ)
			SE = [
				[/^[\*]$/, 'universal'],  //universal selector
				[/^\w*\[.+\]$/, 'attribute'],  //Attribute selector
				[/^\w*\.[\w\-_\$]+$/, 'class'],  //class selector
				[/^\w*\#[\w\-_\$]+$/, 'id']  //ID selector
			],
			// CSS3擬似クラス部分のフィルター配列[Reg, function]
			SF = [
				[/^root$/, _root],
				[/^nth-child\(.+\)$/, _nthChild],
				[/nth-last-child\(.+\)$/, _nthLastChild],
				[/nth-of-type\(.+\)$/, _nthOfType],
				[/nth-last-of-type\(.+\)$/, _nthLastOfType],
				[/first-child$/, _firstChild],
				[/last-child$/, _lastChild],
				[/first-of-type$/, _firstOfType],
				[/last-of-type$/, _lastOfType],
				[/only-child$/, _onlyChild],
				[/only-of-type$/, _onlyOfType],
				[/contains\(.+\)$/, _contains],
				[/empty$/, _empty],
				[/not\(.+\)$/, _not],
				[/^checked$/, _checked],
//				[/^enabled$/, _enabled],
				[/^disabled$/, _disabled]
			],
			cid = 0,
			did = 0,
			cache = {},
			CPP_REG = /([\+>|~[^=],])/g,
			CPP_IREG = /^\+>~$/,
			IE_QSA_REG = /[\(|\)]|only\-child|last\-child|!/,
			QSA_REG = /!|:contains/,
			GROUP_QUERY = /^[0-9a-zA-Z\s,]+$/,
			SIMPLE_QUERY = /^[0-9a-zA-Z\s]+$/,
			ATTR_MODE = /[\$!\^~\*\|]?=/,
			ATTR_REG = /\[([^\[\]]+[\^~\$\*!\|]?=?[^\[\]]+)\]/g,
			ATTR_REG_MODE = /[0-9a-zA-Z]+=[0-9a-zA-Z]+/,
			QUOTES = /['"]/g,
			NTH_STEPS = /[0-9]*[\\n][\+\-][0-9]*$/;

		// inline functions
		function trim(str) {
			return str.replace(tReg, '');
		}

		// get next or previous Element
		function npElement(e, isNext) {
			e = isNext ? e.nextSibling : e.previousSibling;

			while (e) {
				if (e.nodeType === 1) {
					break;
				}
				e = isNext ? e.nextSibling : e.previousSibling;
			}
			return e;
		}

		// get Selectors parse Rule
		function getParseRule(expr) {
			var i = -1;

			while(SE[++i]) {
				if (SE[i][0].test(expr)) {
					return SE[i][1];
				}
			}
			return false;
		}

		// get Filter pseudo Rule
		function getFilterPseudo(expr) {
			var i = -1;

			while (SF[++i]) {
				if (SF[i][0].test(expr)){
					return SF[i][1];
				}
			}
			return false;
		}

		// Element has Attribute?
		function _hasAttr(e, att) {
			var a = (att in IE_MAP) ? IE_MAP[att] : att;
			
			return (enables.hasAttBug)
			       ? (e[a] && e[a] != '') ? true : false
			       : e.hasAttribute(att);
		}
		// get Element attribute value
		function _getAttr(e, att) {
			return ( enables.hasAttBug )
			       ? e[(att in IE_MAP) ? IE_MAP[att] : att] || null
			       : e.getAttribute(att);
		}

		// check attribute seletors
		function attrMatch(e, att) {
			var len = att.length,
				i = -1,
				a,
				p,
				n,
				nn,
				v,
				r,
				ret = true,
				av,
				at;

			while(att[++i]) {
				a = att[i];
				if (!a) {
					continue;
				}
				if (ATTR_MODE.test(a) === false) {
					// has case
					if (!_hasAttr(e, a)) {
						ret =  false;
					}
				} else {
					// CSS3 Reg match case
					p = a.indexOf('=');
					nn = a.slice(0, p);
					v = a.slice(p + 1);
					if (ATTR_REG_MODE.test(a)) {
						// equal
						if (_getAttr(e, nn) !== v) {
							ret = false;
						}
					} else {
						n = nn.slice(0, nn.length - 1);
						r = nn.slice(nn.length - 1);
						av = _getAttr(e, n);
						ret = (av === null) ? false
								: (r === '^') ? (new RegExp('^' + v).test(av))
								: (r === '~') ? (av.indexOf(v) !== -1)
								: (r === '$') ? (new RegExp(v + '$').test(av))
								: (r === '*') ? (av.indexOf(v) !== -1)
								: (r === '!') ? (av.indexOf(v) === -1)
								: (r === '|') ? (av.indexOf(v) !== -1)
								: ret;
					}
				}
				if (ret === false) {
					return false;
				}
			}
			return true;
		}

		// group query case div,p,a,...
		function groupQuery(expr) {
			var cache = {},
				i,
				ret = [],
				ind = -1,
				query = expr.split(','),
				qlen = query.length,
				qcn = 0,
				q,
				nl,
				len,
				e;

			for (; qcn < qlen; ++qcn) {
				q = trim(query[qcn]);

				if (q.indexOf(' ') !== -1) {
					nl = simpleQuery(q);
				} else {
					nl = doc.getElementsByTagName(q);
				}
				len = nl.length;
				for (i = 0; i < len; ++i) {
					e = nl[i];
					e.__cid = e.__cid || ++cid;
					if (cache[e.__cid]) {
						continue;
					} else {
						ret[++ind] = e;
						cache[e.__cid] = 1;
					}
				}
			}
			return ret;
		}

		// simple query
		function simpleQuery(expr) {
			var root = [doc],
				r = 1,
				cache = {},
				i,
				tmp = [],
				ind = -1,
				query = expr.split(/\s+/),
				qlen = query.length,
				qcn = 0,
				q,
				nl,
				len,
				j,
				e;

			for (; qcn < qlen; ++qcn) {
				q = trim(query[qcn]);

				for (i = 0; i < r; i++) {
					nl = root[i].getElementsByTagName(q);
					len = nl.length;
					for (j = 0; j < len; ++j) {
						e = nl[j];
						e.__cid = e.__cid || ++cid;
						if (cache[e.__cid]) {
							continue;
						} else {
							tmp[++ind] = e;
							cache[e.__cid] = 1;
						}
					}
				}
				if (ind === -1) {
					return [];
				}
				// update roots
				root = tmp;
				r = tmp.length;
				tmp = [];
				ind = -1;
			}
			return root;
		}

		/**
		 * セレクタ検索メイン関数
		 */
		function getElementsBySelector(expr, base, orig) {
				// 検索起点ノードは配列に変換
			var root = (!base || base === doc) ? [doc] : [base],
				// 検索クエリを正規化 (ex. div>p -> div > p)
				v = trim(expr.replace(CPP_REG, ' $1 ')),
				i = 0,
				j,
				k,
				p,
				t,
				res,
				len,
				vlen,
				ret = [],
				ind = -1,
				tmp = [],
				mode = false;

			// querySelectorAllが使えれば使用する
			if (enb.canQSA && orig !== true) {
				if (enb.isQSAChild
						&& IE_QSA_REG.test(v) === false) { //IE8+
					tmp = root[0].querySelectorAll(v);
					len = tmp.length;
					for (; i < len; i++) {
						if (!tmp[i].__ignore) {
							ret[++ind] = tmp[i];
						}
					}
					return ret;
				} else if (enb.isQSAContains
								&& QSA_REG.test(v) === false) {
					tmp = root[0].querySelectorAll(v);
					len = tmp.length;
					for (; i < len; i++) {
						if (!tmp[i].__ignore) {
							ret[++ind] = tmp[i];
						}
					}
					return ret;
				}
			} // <-- end querySelectorAll section

			// サポートしていない、または独自属性検索が必要な場合は以下の処理で検索

			if (base && base ===doc) {
				if (GROUP_QUERY.test(v)) {
					// クエリグループ(ex: div, p, a)
					return groupQuery(v);
				} else if (SIMPLE_QUERY.test(v)) {
					// シンプルクエリ(ex: div p a)
					return simpleQuery(v);
				}
			}
			// それ以外はパース検索
			cache = {};
			v = v.split(',');
			for (k = 0, vlen = v.length; k < vlen; ++k) {
				t = v[k];
				if (t === '') {
					continue;
				}
				p = trim(t).split(/\s+/);
				res = _loop(p, root);
				len = res.length;
				if (len > 0) {
					for (i = 0; i < len; ++i) {
						ret[++ind] = res[i];
					}
				}
			}
			return ret;
		}

		// 内部関数
		function _loop(arr, rootElm) {

			var tmp = [],
				mode = false,
				qcn = 0,
				len,
				arrlen = arr.length,
				r = rootElm.length,
				root,
				len2,
				v,
				rule,
				next,
				done,
				ret = [],
				cache = {},
				nl,
				cl = '',
				id,
				tpp,
				tag,
				ind = -1,
				sind = -1,
				atts,
				filter,
				sp, e, f, t, i = 0, j, k = 0, p;
			
			for (; qcn < arrlen; ++qcn) {
				v = trim(arr[qcn]);
				if (CPP_IREG.test(v)) {
					continue;
				}
				if (v.indexOf(':') !== -1) { // has Filter?
					sp = v.split(':');
					t = sp[0];
					f = sp.slice(1);
				} else {
					t = v;
					f = [];
				}
				// 検索ルール特定
				rule = getParseRule(t);

				// 検索をインラインループで実行

				if (rule === 'universal') {  // ユニバーサルセレクタ検索
					for (i = 0; i < r; ++i) {
						root = rootElm[i];
						nl = root.getElementsByTagName('*');
						len = nl.length;
						for (j = 0; j < len; ++j) {
							tmp[++ind] = nl[j];
						}
					}
				} else if (rule === 'class') {  // クラスセレクタ検索
					p = t.indexOf('.');
					tag = t.slice(0, p) || '*';
					cl = t.slice(p + 1).replace('.', ' '); // -> div.example.pre to "example pre"
					for (i = 0; i < r; ++i) {
						root = rootElm[i];
						if (doc.getElementsByClassName) {
							// document.getElementsByClassNameがあれば使用する
							nl = root.getElementsByClassName(cl);
							len = nl.length;
							for (j = 0; j < len; ++j) {
								if (!tag || nl[j].tagName.toLowerCase() === tag) {
									tmp[++ind] = nl[j];
								}
							}
						} else {
							// なければgetElementsByTagNameで検索
							nl = root.getElementsByTagName(tag);
							len = nl.length;
							for (j = 0; j < len; j++) {
								if ((' ' + (nl[j].className || '') + ' ').indexOf(' ' + cl + ' ') !== -1) {
									tmp[++ind] = nl[j];
								}
							}
						}
					}
				} else if (rule === 'id') {  // IDセレクタ検索
					p = t.indexOf('#');
					tag = (p === 0) ? '' : t.slice(0, p);
					tpp = t.slice(p + 1);
					// #title.exampleのようにID+Classのコンビネーションがありえるのでチェック
					p = tpp.indexOf('.');
					if (p !== -1) {
						id = tpp.slice(0, p);
						cl = ' ' + tpp.slice(p + 1).replace('.', ' ') + ' ';
					} else {
						id = tpp;
						cl = null;
					}
					nl = doc.getElementById(id);
					if (nl && (!tag || nl.tagName.toLowerCase() === tag)
							&& (!cl || (' ' + nl.className + ' ').indexOf(cl) !== -1)) {
						tmp[++ind] = nl;
					}
				} else if (rule === 'attribute') {  // 属性検索
					t = t.replace(QUOTES, '');
					p = t.indexOf('[');
					tag = t.slice(0, p);
					t = t.slice(p + 1);
					t = t.slice(0, t.length -1)
						.split('][');
					for (i = 0; i < r; ++i) {
						root = rootElm[i];
						nl = root.getElementsByTagName(tag || '*');
						len = nl.length;
						for (j = 0; j < len; j++) {
							e = nl[j];
							if (attrMatch(e, t) === true) {
								e.__cid = e.__cid || ++cid;
								if (!cache[e.__cid]) {
									tmp[++ind] = e;
								}
							}
						}
					}
				} else { // タグ名 or child-sibling-preceded
					tag = t;
					if (mode ==='preceded') { // E + F
						for (i = 0; i < r; ++i) {
							root = rootElm[i];
							e = npElement(root, 1);
							if (e && e.tagName && e.tagName.toLowerCase() === tag) {
								tmp[++ind] = e;
							}
						}
					} else if (mode === 'sibling') { // E ~ F
						done = ++did;
						for (i = 0; i < r; ++i) {
							root = rootElm[i];
							p = root.parentNode;
							if (p && (!p.__done || p.__done !== done)) {
								for (e = root.nextSibling; e; e = e.nextSibling) {
									if (e && e.nodeType === 1
											&& e.tagName.toLowerCase() === tag) {
										//e.__cid = e.__cid || ++cid;
										//if (!cache[e.__cid]) {
											tmp[++ind] = e;
										//}
									}
								}
								p.__done = done;
							}
						}
					} else if (mode === 'child') { // E > F
						for (i = 0; i < r; ++i) {
							root = rootElm[i];
							nl = root.getElementsByTagName(tag);
							len = nl.length;
							for (j = 0; j < len; ++j) {
								if (nl[j].parentNode === root) {
									tmp[++ind] = nl[j];
								}
							}
						}
					} else { // E F
						for (i = 0; i < r; ++i) {
							root = rootElm[i];
							nl = root.getElementsByTagName(tag);
							len = nl.length;
							for (j = 0; j < len; ++j) {
								tmp[++ind] = nl[j];
							}
						}
					}
				} // <-- 検索条件分岐終了

				// フィルターがあればフィルター適用
				if (f.length > 0) {
					for (k = 0, len2 = f.length; k < len2; ++k) {
						filter = getFilterPseudo(f[k]);
						if (filter) {
							tmp = filter(tmp, f[k]);
						}
					}
				}

				len = tmp.length;
				for (k = 0; k < len; k++) {
					e = tmp[k];
					e.__cid  = e.__cid || (e.__cid = ++cid);
					if (cache[e.__cid] || e.__ignored) {
						continue;
					} else {
						ret[++sind] = e;
						cache[e.__cid] = 1;
					}
				}

				// 検索ヒット数が0なら終了
				if (ret.length === 0) {
					return [];
				}

				// 次の要素をチェック
				next = arr[qcn + 1];

				if (!next) {
					return ret;
				} else if (next === '+') {
					mode = 'preceded';
					if (!arr[qcn + 2]) {
						throw SyntaxError('invalid selector query.');
						return [];
					}
					++qcn;
				} else if (next === '~') {
					mode = 'sibling';
					if (!arr[qcn + 2]) {
						throw SyntaxError('invalid selector query.');
						return [];
					}
					++qcn;
				} else if (next === '>') {
					mode = 'child';
					if (!arr[qcn + 2]) {
						throw SyntaxError('invalid selector query.');
						return [];
					}
					++qcn;
				} else {
					mode = false;
				}

				// それ以外はパラメータを初期化して再検索
				r = ret.length;
				rootElm = ret;
				// initialize stacks;
				ind = -1;
				sind = -1;
				ret = [];
				tmp = [];
			}
		};

		// :擬似クラスに基づいてノードリストフィルタリング
		function selectElementsByFilter(nodeList, filters) {
			if (!filters || filters.length === 0) {
				throw Error('invalid argument. filter string must be applied');
				return nodeList;
			}

			var node,
				nlen = nodeList.length,
				flen = filters.length,
				filter,
				rule,
				i = 0,
				j = 0,
				done,
				e,
				p,
				sp;

			for (i = 0; i < flen; ++i) {
				filter = filters[i];
				rule = getFilterPseudo(filter);

				if (rule === false) {
					return nodeList;
				} else {
					node = rule(nodeList, filter);
				}
			}
			return node;
		}

		// ========================== Filter functions section =====================

		// _detectNthSteps - even,odd,2n+1等のステップを正規化
		function __detectNthSteps(rule) {
			var pi = pi;

			if (rule === 'n') {
				return [1, 0];
			} else if (rule === 'odd') {
				return [2, 1];
			} else if (rule === 'even') {
				return [2, 0];
			} else if  (NTH_STEPS.test(rule)) { // (ex:2n+1)
				return rule.split('n');
			} else if (rule.indexOf('n') !== -1) { // (ex:2n)
				return [(rule.indexOf('n') !== 0) ? rule.slice(0, rule.indexOf('n')) : 1, 0];
			} else if (!isNaN(pi(rule, 10))) { // (ex:2)
				return [0, pi(rule, 10)];
			} else {
				throw new SyntaxError('invalid nth-step argument of' + rule + '.');
			}
		}

		// nthChild
		function _nthChild(nodeList, filter) {
			var rule = filter.replace(/nth-child\((.*?)\).*$/, '$1'),
				done = ++did,
				tmp = [],
				ind = -1,
				fo,
				eo,
				len = nodeList.length,
				i = 0,
				e,
				p,
				a,
				cnt = 0,
				first,
				offset;

			if (rule === 'n') {
				return nodeList;
			}
			fo = __detectNthSteps(rule);

			for (i = 0; i < len; ++i) {
				e = nodeList[i];
				p = e.parentNode;
				if (p && (!p.__done || p.__done !== done)) {
					cnt = 0;
					for (a = p.firstChild; a; a = a.nextSibling) {
						if (a.nodeType === 1) {
							a.__aid = ++cnt;
						}
					}
					p.__done = done;
				}
				eo = e.__aid - fo[1];
				if (fo[0] === 0 && eo === 0) {
					tmp[++ind] = e;
				} else if(eo % fo[0] === 0
							&& (eo / fo[0] >= 0)) {
					tmp[++ind] = e;
				}
			}
			return tmp;
		}

		// nthLastChild
		function _nthLastChild(nodeList, filter) {
			var rule = filter.replace(/nth-last-child\((.*?)\).*$/, '$1'),
				done = ++did,
				tmp = [],
				ind = -1,
				fo,
				eo,
				len = nodeList.length,
				i = 0,
				e,
				p,
				a,
				cnt = 0,
				first,
				offset;

			if (rule === 'n') {
				return nodeList;
			}
			fo = __detectNthSteps(rule);

			for (i = 0; i < len; ++i) {
				e = nodeList[c];
				p = e.parentNode;
				if (p && (!p.__done || p.__done !== done)) {
					cnt = 0;
					for (a = parent.lastChild; a; a = a.previousSibling) {
						if (a.nodeType === 1) {
							a.__aid = ++cnt;
						}
					}
					p.__done = done;
				}
				eo = e.__aid - fo[1];
				if (fo[0] === 0 && eo === 0) {
					tmp[++ind] = e;
				} else if(eo % fo[0] === 0
							&& (eo / fo[0] >= 0)) {
					tmp[++ind] = e;
				}
			}
			return tmp;
		}

		// nthOfType
		function _nthOfType(nodeList, filter) {
			var rule = filter.replace(/nth-of-type\((.*?)\).*$/, '$1'),
				done = ++did,
				tmp = [],
				ind = -1,
				fo,
				eo,
				len = nodeList.length,
				i = 0,
				e,
				p,
				a,
				cnt = 0,
				first,
				offset;

			fo = __detectNthSteps(rule);

			for (i = 0; i < len; ++i) {
				e = nodeList[c];
				p = e.parentNode;
				if (p && (!p.__done || p.__done !== done)) {
					cnt = 0;
					for (a = parent.firstChild; a; a = a.nextSibling) {
						if (a.nodeType === 1) {
							a.__aid = ++cnt;
						}
					}
					p.__done = done;
				}
				eo = e.__aid - fo[1];
				if (fo[0] === 0 && eo === 0) {
					tmp[++ind] = e;
				} else if(eo % fo[0] === 0
							&& (eo / fo[0] >= 0)) {
					tmp[++ind] = e;
				}
			}
			return tmp;
		}

		// nthLastOfType
		function _nthLastOfType(nodeList, filter) {
			var rule = filter.replace(/nth-last-of-type\((.*?)\).*$/, '$1'),
				done = ++did,
				tmp = [],
				ind = -1,
				fo,
				eo,
				len = nodeList.length,
				i = 0,
				e,
				p,
				a,
				cnt = 0,
				first,
				offset;

			fo = __detectNthSteps(rule);

			for (i = 0; i < len; ++i) {
				e = nodeList[c];
				p = e.parentNode;
				if (p && (!p.__done || p.__done !== done)) {
					cnt = 0;
					for (a = parent.lastChild; a; a = a.previousSibling) {
						if (a.nodeType === 1) {
							a.__aid = ++cnt;
						}
					}
					p.__done = done;
				}
				eo = e.__aid - fo[1];
				if (fo[0] === 0 && eo === 0) {
					tmp[++ind] = e;
				} else if(eo % fo[0] === 0
							&& (eo / fo[0] >= 0)) {
					tmp[++ind] = e;
				}
			}
			return tmp;
		}

		// firstChild
		function _firstChild(nodeList, filter) {
			var done = ++did,
				tmp = [],
				ind = -1,
				e,
				p,
				f,
				i = 0,
				len = nodeList.length;

			for (; i < len; ++i) {
				e = nodeList[i];
				p = e.parentNode;
				if (p.__done && p.__done === done) {
					continue;
				}
				f = p.firstChild;
				while (f) {
					if (f.nodeType === 1) {
						if (f === e) {
							tmp[++ind] = f;
						}
						break;
					}
					f = f.nextSibling;
				}
				p.__done = done;
			}
			return tmp;
		}

		// lastChild
		function _lastChild(nodeList, filter) {
			var done = ++did,
				tmp = [],
				ind = -1,
				e,
				p,
				l,
				i = 0,
				len = nodeList.length;

			for (; i < len; ++i) {
				e = nodeList[i];
				p = e.parentNode;
				if (!p || (p.__done && p.__done === done)) {
					continue;
				}
				l = p.lastChild;
				while (l) {
					if (l.nodeType === 1) {
						if (l === e) {
							tmp[++ind] = l;
						}
						break;
					}
					l = l.previousSibling;
				}
			}
			return tmp;
		}

		// firstOfType
		function _firstOfType(nodeList, filter) {
			var done = ++did,
				tmp = [],
				ind = -1,
				e,
				p,
				c,
				i = 0,
				place,
				len = nodeList.length;

			for (; i < len; ++i) {
				e = nodeList[i];
				p = e.parentNode;
				if (!p || (p.__done && p__done === done)) {
					continue;
				}
				place = false;
				for (c = p.firstChild; c; c = c.nextSibling) {
					if (c.nodeType === 1) {
						if (place === true
								&& c !== e
								&& c.tagName === e.tagName) {
							tmp[++ind] = c;
							break;
						}
						if (c === e) {
							place = true;
						}
					}
				}
				p.__done = done;
			}
			return tmp;
		}

		// lastOfType
		function _lastOfType(nodeList, filter) {
			var done = ++did,
				tmp = [],
				ind = -1,
				e,
				p,
				c,
				i = 0,
				place,
				len = nodeList.length;

			for (; i < len; ++i) {
				e = nodeList[i];
				p = e.parentNode;
				if (!p || (p.__done && p__done === done)) {
					continue;
				}
				place = false;
				for (c = p.lastChild; c; c = c.previousSibling) {
					if (c.nodeType === 1) {
						if (place === true
								&& c !== e
								&& c.tagName === e.tagName) {
							tmp[++ind] = c;
							break;
						}
						if (c === e) {
							place = true;
						}
					}
				}
				p.__done = done;
			}
			return tmp;
		}

		// onlyChild
		function _onlyChild(nodeList, filter) {
			var done = ++did,
				tmp = [],
				ind = -1,
				p,
				f,
				l,
				i = 0,
				len = nodeList.length;

			for (; i < len; ++i) {
				p = nodeList[i].parentNode;
				if (!p || (p.__done && p.__done === done)) {
					continue;
				}
				f = p.firstChild;
				l = p.lastChild;
				// detect firstChild
				while (f && f.nodeType !== 1) {
					f = f.nextSibling;
				}
				while (l && l.nodeType !== 1) {
					l = l.previousSibling;
				}
				if (f && l && f === l) {
					tmp[++ind] = f;
				}
				p.__done = done;
			}
			return tmp;
		}

		// onlyOfType
		function _onlyOfType(nodeList, filter) {
			// simply implement. but slowly...
			nodeList = _firstOfType(nodeList);
			return _lastOfType(nodeList);
		}

		// empty
		function _empty(nodeList, filter) {
			var tmp = [],
				ind = -1,
				e,
				i = 0,
				len = nodeList.length;

			for (; i < len; ++i) {
				e = nodeList[i];
				if (e.firstChild === null && e.lastChild === null) {
					tmp[++ind] = e;
				}
			}
			return tmp;
		}

		// contains
		function _contains(nodeList, filter) {
			var tmp = [],
				txt = filter.replace(/contains\(['"]?(.*?)['"]?\)$/, '$1'),
				ind = -1,
				e,
				t,
				i = 0,
				len = nodeList.length;

			for (; i < len; ++i) {
				e = nodeList[i];
				t = e.textContent || e.innerText || '';
				if (t.indexOf(txt) >= 0) {
					tmp[++ind] = e;
				}
			}
			return tmp;
		}

		// not
		function _not(nodeList, filter) {
			var tmp = [],
				txt = filter.replace(/not\(['"]?(.*?)['"]?\)$/, '$1'),
				ind = -1,
				e,
				i = 0,
				j,
				flag = true;
				len = nodeList.length,
				ts = getElementsBySelector(txt),
				tslen = ts.length;

			for (; i < len; ++i) {
				e = nodeList[i];
				j = -1;
				flag = true;
				while (ts[++j]) {
					if (ts[j] === e) {
						flag = false;
						break;
					}
				}
				if (flag) {
					tmp[++ind] = e;
				}
			}
			return tmp;
		}

		// checked
		function _checked(nodeList, filter) {
			var tmp = [],
				ind = -1,
				e,
				i = 0,
				j,
				len = nodeList.length;

			for (; i < len; ++i) {
				e = nodeList[i];
				if (e.checked && e.checked === true) {
					tmp[++ind] = e;
				}
			}
			return tmp;
		}

		// disabled
		function _disabled(nodeList, filter) {
			var tmp = [],
				ind = -1,
				e,
				i = 0,
				j,
				len = nodeList.length;

			for (; i < len; ++i) {
				e = nodeList[i];
				if (e.disabled && e.disabled === true) {
					tmp[++ind] = e;
				}
			}
			return tmp;
		}

		// root
		function _root() {
			return doc.documentElement || doc.getElementsByTagName('html')[0];
		}

		// alias to outer scope
		DOM.getElementsBySelector = getElementsBySelector;
		DOM.selectElementsByFilter = selectElementsByFilter;

	})(); // <-- // CSSセレクタ検索終わり

	// ============================== DOM拡張エレメント定義 ================================== //

	/**
	 * xElement : 単一要素を内包するラッパークラス
	 * 	クロスブラウザなメソッドを提供
	 * @param Element e : HTML要素
	 * @param Object pp : 参照元オブジェクト
	 * @return Object instance
	 */
	function xElement(e, pp) {
		// 拡張済みの場合はそのまま返却
		if (e instanceof xElement) {
			return e;
		}
		this.element = e;
		this.tag = e.tagName ? e.tagName.toLowerCase() : '';
		this.__dataset = e.dataset || {};
		this.__parent = pp || null;
		// 不要な空白テキストノード除去
		e.normalize();
	}

		/**
		 * 拡張メソッド定義
		 */
		xElement.prototype = {
			/**
			 * get : 拡張元のエレメントを返却
			 * @return Element : 素のHTML要素
			 */
			get : function() {
				return this.element;
			},

			/**
			 * __getCID : エレメントのユニークID取得
			 *@deprecated
			 */
			__getCID : function() {
				return this.element.__exid;
			},

			/**
			 * rollback : 参照元のオブジェクトに戻る
			 * @param Number times : ロールバック回数
			 * @return mixed xNodeList or Null
			 */
			rollBack : function(times) {
				var n = 0,
					t = times || 1,
					e = this;

				while (n++ < t) {
					e = e.__parent;
					if (e === null) {
						return null;
					}
				}
				return e;
			},

			/**
			 * ignore : 一時的にDOM.xxxの検索にヒットしなくなる。
			 *           ただし、getElementsBytagName等のネイティブ検索にはヒットするので注意
			 * @return this
			 * enable method chain
			 */
			ignore : function() {
				this.element.__ignore = ++ignoreID;
				return this;
			},

			/**
			 * recognize : ignore()から復帰する
			 * @return this
			 * enable method chain
			 */
			recognize : function() {
				this.element.__ignore && (this.element.__ignore = undefined);
				return this;
			},

			/**
			 * absDimension : viewport座標系の絶対位置と縦横の幅を取得する
			 * @return Object dimensions
			 */
			absDimension : function() {
				var dim = ut.getAbsPosition(this.element),
					w = this.readStyle('width', true),
					h = this.readStyle('height', true);

				w = (!w || w === 'auto' || w === 0) ? this.element.offsetWidth : w;
				h = (!h || h === 'auto' || h === 0) ? this.element.offsetHeight : h;
				return {
					top : dim.y,
					left : dim.x,
					right : dim.x + w,
					bottom : dim.y + h,
					width : w,
					height : h
				};
			},

			/**
			 * defaultSize : 要素本来の縦、横を取得
			 *               : display:noneなどの状態の要素に有効
			 * @return Object wh
			 */
			defaultSize : function() {
				return ut.getDefaultWH(this.element);
			},

			/**
			 * attr : 属性追加
			 * @param mixed name : 追加する属性名、またはハッシュオブジェクト
			 * @param String val : 追加する属性値
			 * @return this
			 *
			 * @notice Need Compatible IE6,7
			 */
			attr : function(name, val) {
				var i, res;

				if (typeof name === 'object') {
					for (i in name) {
						this.attr(i, name[i]);
					}
				} else if (typeof name === 'string') {
					// 拡張フックがあれば実行
					if (typeof this['__extendAttr' + name] === 'function') {
						if (this['__extendAttr' + name](val) === true) {
							return this;
						}
					}
					this.element.setAttribute(name, val);
				}
				return this;
			},

			/**
			 * readAttr : 属性値取得
			 *  @note : 一般的なHTML属性値の取得に使用。checkedなどのプロパティ系はpropメソッドで取得
			 *  @param mixed name
			 *  @return mixed val : nameがStringであればString,Arrayであれば、オブジェクトで返却
			 *
			 *  @notice Need Compatible IE6,7
			 */
			readAttr : function(name) {
				var i = -1, len, ret;

				if (typeof name === 'string') {
					return this.element.getAttribute(name);
				} else if (ut.isArray(name)) {
					ret = {};
					while(name[++i]) {
						ret[name[i]] = this.readAttr(name[++i]);
					}
					return ret;
				}
			},

			/**
			 * removeAttr : 属性削除
			 * @param mixed name : 削除する属性名
			 * @return this
			 */
			removeAttr : function(name) {
				var i = -1, len;

				if (typeof name === 'string') {
					this.element.removeAttribute(name);
				} else if (ut.isArray(name)) {
					while(name[++i]) {
						this.element.removeAttribute(name[i]);
					}
				}
				return this;
			},

			/**
			 * addClass : 要素にclass属性を追加
			 * @param String v : 追加する値
			 * @return this
			 */
			addClass : function(v) {
				var c;

				if (!v || v === '') {
					return this;
				}
				c = this.element.className;

				if ((' ' + c + ' ').indexOf(' ' + v + ' ') === -1) {
					this.element.className = (c === '') ? v : (c + ' ' + v);
				}
				return this;
			},

			/**
			 * hasClass : 要素が指定したclassNameをもつかどうかを判定
			 * @param String v : 判定するclassの値
			 * @return Boolean
			 */
			hasClass : function(v) {
				return (' ' + this.element.className + ' ').indexOf(' ' + v + ' ') !== -1;
			},

			/**
			 * removeClass : 要素から指定したclass属性値を削除
			 * @param String v : 削除するclassの値
			 * @return this
			 */
			removeClass : function(v) {
				var a = this.element.className.split(' '),
					len = a.length,
					st = [],
					ind = -1,
					i = -1;

				while(a[++i]) {
					if (a !== '' && a[i] !== v) {
						st[++ind] = a[i];
					}
				}
				this.element.className = (st.length > 0) ? st.join(' ') : '';
				return this;
			},

			/**
			 * replaceClass : class属性を置き換える
			 * @param String grep : 置き換え対象のclass値
			 * @param String sed : 置き換えるclass値
			 * @return this
			 */
			replaceClass : function(grep, sed) {
				if (this.hasClass(grep)) {
					this.removeClass(grep).addClass(sed);
				}
				return this;
			},

			/**
			 * toggleClass : class値を交互に付加/削除する
			 * @param String c : 付加/削除するclass値
			 * @return this
			 */
			toggleClass : function(c) {
				return this[this.hasClass(c) ? 'removeClass' : 'addClass'](c);
			},

			/**
			 * event : 要素にイベントをセットする
			 * @param String type : イベントタイプ
			 * @param Function fn : イベントリスナ
			 * [@param Object bind : callコンテキストオブジェクト]
			 * @return this
			 *
			 * @note 後ろでマウスイベント系のシンタックスを定義しています
			 */
			event : function(type, fn, bind) {
				Base.event.set(this.element, type, fn, bind || false);
				return this;
			},

			/**
			 * hover : mouseoverとmouseoutをセットする
			 * @param Function overFn : mouseover時のイベントハンドラ
			 * @param Function outFn : mouseout時のイベントハンドラ
			 * @param Object bind : callコンテキストオブジェクト
			 * @return this
			 */
			hover : function(overFn, outFn, bind) {
				var b = bind || false;

				if(overFn) {
					Base.event.set('mouseover', overFn, b);
				}
				if(outFn) {
					Base.event.set('mouseout', outFn, b);
				}
				return this;
			},

			/**
			 * once : 要素に一度だけ発行するイベントをセットする
			 * @param String type : イベントタイプ
			 * @param Function fn : イベントリスナ
			 * [@param Object bind : callコンテキストオブジェクト]
			 * @return this
			 */
			once : function(type, fn, bind) {
				Base.event.once(this.element, type, fn, bind || false);
				return this;
			},

			/**
			 * Cevent : 必ずControllerからcallされるイベントをセット
			 * @param String type : イベントタイプ
			 * @param Function fn : イベントリスナ
			 * @return this
			 */
			Cevent : function(type, fn) {
				Base.event.set(this.element, type, fn, SYSTEM.CONTROLLER);
				return this;
			},

			/**
			 * unevent : イベント解除
			 * @param String type : イベントタイプ(,区切りで複数指定可能)
			 * [@param Function fn : イベントリスナ(,区切りでtypeを渡した場合は無効)]
			 */
			unevent : function(type, fn) {
				var i = -1;

				if (ut.isArray(type)) {
					while(type[++i]) {
						this.unevent(type[i], fn || undefined);
					}
				} else {
					if (type.indexOf(',') !== -1) {
						type = type.replace(' ', '').split(',');
						while(type[++i]) {
							Base.event.remove(this.element, type[i]);
						}
					} else {
						Base.event.remove(this.element, type, fn || undefined);
					}
				}
				return this;
			},

			/**
			 * customEvent : 要素にカスタムイベントをセットする
			 * @param String type : イベントタイプ
			 * @param Function fn : イベントリスナ
			 * [@param Object bind : callコンテキストオブジェクト]
			 * @return this
			 */
			customEvent : function(type, fn, bind) {
				Base.event.custom(this.element, type, fn, bind || false);
				return this;
			},

			/**
			 * unCustomEvent : カスタムイベント解除
			 * @param String type : イベントタイプ
			 * @param Function fn : イベントリスナ
			 * @return this
			 */
			unCustomEvent : function(type, fn, bind) {
				Base.event.removeCustom(this.element, type, fn, bind || false);
				return this;
			},

			/**
			 * fire : イベント起動
			 * @param String type : イベントタイプ
			 * @param mixed data : イベントに渡すデータ
			 * @param String dataType : イベントのデータタイプ
			 * @return this
			 */
			fire : function(type, data, dataType) {
				Base.event.fire(this.element, type, data || null, dataType || 'null');
				return this;
			},

			/**
			 * live : 要素に動的なをセットする
			 * @param String type : イベントタイプ
			 * @param Function fn : イベントリスナ
			 * [@param Object bind : callコンテキストオブジェクト]
			 * @return this
			 */
			live : function(type, fn, bind) {
				Base.event.live(this.element, type, fn, bind || false);
				return this;
			},

			/**
			 * inText : 要素にテキストノードを挿入
			 * @param String txt : 挿入するテキスト
			 * [@param Boolean ride : false-上書き,true-後ろに追加
			 * @return this
			 */
			inText : function(txt, ride) {
				if (ride) {
					if (this.element.innerText) {
						this.element.innerText = txt;
					} else if (this.element.textContent) {
						this.element.textContent = txt;
					}
				} else {
					this.element.appendChild(doc.createTextNode(txt));
				}
				this.element.normalize();
				return this;
			},

			/**
			 * getText : 要素のテキストデータ取得
			 * @return String txt
			 */
			getText : function() {
				return this.element.textContent || this.element.innerText;
			},

			/**
			 * html : HTMLテキスト挿入
			 * @param String html : 挿入するHTMLデータ
			 * @return this
			 */
			html : function(html) {
				this.element.innerHTML = html;
				return this;
			},

			/**
			 * getHTML : HTMLデータ取得
			 * @return String
			 */
			getHTML : function() {
				return this.element.innerHTML;
			},

			/**
			 * outerHTML : 要素を含めたHTML文字列取得
			 * @return String
			 */
			outerHTML : function() {
				return ( 'outerHTML' in this.element ) ? this.element.outerHTML
				       : doc.createElement('div').appendChild(this.element).parentNode.innerHTML;
			},

			/**
			 * appendTo : 要素を引数にappendChildする
			 * @param mixed xElement or Element target : 追加ターゲットの要素
			 * @param String pos : 追加位置 default : 'default'
			 * @return this
			 */
			appendTo : function(target, pos) {
				var p = pos || 'default',
					t = (!target) ? body
							: (target instanceof xElement) ? target.get()
									: target;

				if (p === 'before') {
					t.parentNode.insertBefore(this.element, t);
				} else if (p === 'after') {
					if (t.parentNode.lastChild === t) {
						t.parentNode.appendChild(this.element);
					} else {
						t.parentNode.insertBefore(this.element, t.nextSibling);
					}
				} else {
					t.appendChild(this.element);
				}
				return this;
			},

			/**
			 * append : 文字列や要素を可能な限りノードとしてappendChildする
			 * @param mixed data : 追加する要素、またはHTMLデータ
			 * @return this
			 */
			append : function(data) {
				var d;

				if (data instanceof xElement) {
					this.element.appendChild(data.get());
				} else if (data.nodeType
								&& (data.nodeType === 1
										|| data.nodeType === 3)) {
					this.element.appendChild(data);
				} else if (typeof data === 'string') {
					d = doc.createElement('div');
					d.innerHTML = data;
					while(d.childNodes.length > 0) {
						this.element.appendChild(d.firstChild);
					}
					d = null; // destroy GC
				}
				return this;
			},

			/**
			 * prependTo : 要素を引数の最初にappendChildする
			 * @param mixed xElement or Element target : 追加ターゲットの要素
			 * @return this
			 */
			prependTo : function(target) {
				var t = (!target) ? body
							: (target instanceof xElement) ? target.get()
									: target;
				
				( t.firstChild ) ? t.insertBefore(this.element, t.firstChild)
									: t.appendChild(this.element);
				return this;
			},

			/**
			 * prepend : 文字列や要素を可能な限りノードとしてappendChildする
			 * @param mixed data : 追加する要素、またはHTMLデータ
			 * @return this
			 */
			prepend : function(data) {
				var d;

				if (data instanceof xElement) {
					this.element.insertBefore(data.get(), this.element.firstChild);
				} else if (data.nodeType
								&& (data.nodeType === 1
										|| data.nodeType === 3)) {
					this.element.insertBefore(data, this.element.firstChild);
				} else if (typeof data === 'string') {
					d = doc.createElement('div');
					d.innerHTML = data;
					while(d.childNodes.length > 0) {
						this.element.insertBefore(d.lastChild, this.element,firstChild);
					}
					d = null; // destroy GC
				}
				return this;
			},

			/**
			 * wrap : 要素を引数のタグ要素で包む
			 * @param String tag : 包むタグ要素名
			 * @return xElement : 包んだ後の拡張エレメント
			 */
			wrap : function(tag) {
				var e = doc.createElement(tag),
					r;

				// JSCriptならapplyElementメソッドがあるので利用する
				if (this.element.applyElement) {
					this.element.applyElement(e, 'outside');
				} else if (doc.createRange) {
					// DOM Rangeが使えれば使用する
					r = doc.createRange();
					r.selectNode(this.element);
					r.surroundContents(e);
					r.detach();
				} else {
					// not support
					throw Error('wrap method is not supported on your Browser.');
					return;
				}
				return STACK.ELEMENTS[e.__exid] || new xElement(e, this);
			},

			/**
			 * unwrap : 要素の親ノードを取り除く
			 * @return this
			 */
			unwrap : function() {
				var frg = doc.createDocumentFragment(),
					p = this.element.parentNode,
					c,
					len,
					i = -1;

				if (!p || p === doc.body) {
					throw Error('document.body cannnot remove!');
					return this;
				}
				while(p.firstChild) {
					frg.appendChild(p.firstChild);
				}
				p.parentNode.removeChild(p);
				p.parentNode.appendChild(frg);
				return this;
			},

			/**
			 * copy : 要素の複製を作成する
			 * @param Boolean isChild : 子要素も複製するかどうか
			 * @return xElement : 複製した要素
			 */
			copy : function(isChild) {
				var b = isChild || false,
					e = this.element,
					c = e.cloneNode(b);

				// id属性は重複すべきでないのでsuffixを付加
				if (e.id) {
					c.id = e.id + '_clone';
				}
				//拡張IDを更新
				e.__exID = ++EXID;
				// ignore解除
				e.__ignore = undefined;
				return new xElement(c);
			},

			/**
			 * remove : 要素をDOMツリーから削除する
			 * @return this
			 */
			remove : function() {
				if (this.element.parentNode) {
					this.element.parentNode.removeChild(this.element);
				}
				return this;
			},

			/**
			 * empty : 要素の子要素を全て削除
			 * @return this;
			 */
			empty : function() {
				this.element.innerHTML = '';
				return this;
			},

			/**
			 * isEmpty : 要素の中身が空かどうかを判定
			 * @return Boolean
			 */
			isEmpty : function() {
				return !this.element.hasChildNodes();
			},

			/**
			 * replace : 要素入れ替え
			 * @param mixed xElement or Element : 置換対象のエレメント
			 * @return this
			 */
			replace : function(to) {
				var t = (to instanceof xElement) ? to.get() : to;

				this.element.parentNode.replaceChild(t, this.element);
				return this;
			},

			/**
			 * replaceTo : 対象の要素に入れ替える
			 * @param mixed xElement or Element : 置換対象のエレメント
			 * @return this
			 */
			replaceTo : function(to) {
				var t = (to instanceof xElement) ? to.get() : to;

				t.parentNode.replaceChild(this.element, t);
				return this;
			},

			/**
			 * hide : 要素を非表示にする
			 * @return this
			 */
			hide : function() {
				this.element.style.display = 'none';
				return this;
			},

			/**
			 * isHidden : 要素が非表示状態かどうか判定
			 * @return Boolean
			 */
			isHidden : function() {
				return this.readStyle('display') === 'none';
			},

			/**
			 * isAnimate : 要素がアニメーション中かどうかを判定
			 * @return Boolean
			 */
			isAnimate : function() {
				return !!this.element.__animate;
			},

			/**
			 * show : 要素を表示状態にする
			 * @param String mode : 表示状態制御文字
			 * @return this
			 */
			show : function(mode) {
				var v = (mode === 'i') ? 'inline'
							: (mode === 'ib') ? 'inline-block'
								: 'block';
				this.element.style.display = v;
				return this;
			},

			/**
			 * toggleShow : 表示/非表示状態を切り替える
			 * @return this
			 */
			toggleShow : function() {
				this[this.isHidden() ? 'show' : 'hide']();
				return this;
			},

			/**
			 * visible : 要素を可視化する
			 * @return this
			 */
			visible : function() {
				this.element.style.visibility = 'visible';
				return this;
			},

			/**
			 * invisible : 要素を不可視にする
			 * @return this
			 */
			invisible : function() {
				this.element.style.visibility = 'hidden';
				return this;
			},

			/**
			 * isVisible : 要素が可視状態であるかどうかを判定する
			 * @preturn Boolean
			 */
			isVisible : function() {
				return this.readStyle('visibility') !== 'hidden';
			},

			/**
			 * toggleV : 要素の可視/不可視を切り替える
			 * @return this
			 */
			toggeleV : function() {
				this[this.isVisible() ? 'invisible' : 'visible']();
				return this;
			},

			/**
			 * getValue : フォームパーツのvalue値取得
			 */
			getValue : function() {
				return ('value' in this.element) ? this.element.value : null;
			},

			/**
			 * setValue : フォームパーツのvalue値セット
			 * @param String val : セットする値
			 * @return this
			 */
			setValue : function(val) {
				if ('value' in this.element) {
					this.element.value = val;
				}
				return this;
			},

			/**
			 * prop : 要素のプロパティにアクセス
			 * @param String name : プロパティ名
			 * @param : String val : セットする値
			 * @return mixed xElement or propertyValue
			 * @note 第二引数があればSetter,なければgetterで動作
			 */
			prop : function(name, val) {
				if (typeof val === 'undefined') {
					return this.element[name];
				} else {
					this.element[name] = val;
					return this;
				}
			},
			
			/**
			 * getData : data-*独自プレフィックスの値を取得
			 * @param string name
			 * @return string or null
			 */
			getData : function(name) {
				name = ut.camel(name);
				if ( !this.__dataset[name] ) {
					this.__dataset[name] = this.element.getAttribute(HTML_DATA_PREFIX + ut.deCamel(name));
				}
				return this.__dataset[name];
			},
			
			/**
			 * getDataset : data-*独自プレフィックスのセットを全て取得
			 * @return object
			 * @note ループ処理が入るのでやや高負荷
			 */
			getDataSet : function() {
				var attrs = this.element.attributes,
					i      = -1,
					ret    = {},
					point,
					attr;
				
				while ( attrs[++i] ) {
					attr  = attrs[i];
					point = attr.name.indexOf(HTML_DATA_PREFIX);
					if ( point === 0 ) {
						ret[ut.camel(attr.name.slice(HTML_DATA_PREFIX.length))] = attr.value; 
					}
				}
				attrs = attr = null;
				this.__dataset = ret;
				return ret;
			},
			
			/**
			 * setData : data-*独自プレフィックスの値をセット
			 * @param string or Object name
			 * @param string value
			 * @return self
			 * @note 第一引数がオブジェクトの場合は再帰的にセットする
			 */
			setData : function(name, value) {
				if ( ut.isObject(name) ) {
					for ( var i in name ) {
						if ( name.hasOwnProperty(i) ) {
							this.setData(i, name[i]);
						}
					}
					return;
				}
				name = ut.camel(name);
				this.__dataset[name] = value;
				this.element.setAttribute(HTML_DATA_PREFIX + ut.deCamel(name), value);
				return this;
			},

			/**
			 * getScroll : 要素のスクロール量を取得
			 * @return Object sc : スクロール量
			 */
			getScroll : function() {
				return {
					x : this.element.scrollLeft,
					y : this.element.scrollTop
				};
			},

			/**
			 * method : 要素固有のメソッドを実行
			 * @param String name : メソッド名
			 * @return this
			 */
			method : function(name) {
				if (name && name in this.element) {
					this.element[name]();
				} else {
					throw TypeError(name + ' method is not defined.');
				}
				return this;
			},

			/** ========================= DOM traversal methods ====================== **/

			/**
			 * getParentForm : 要素を包む親Form要素を取得
			 * @return mixed xElement or null : 拡張Form要素またはNull
			 */
			getParentForm : function() {
				if (this.tag === 'form') {
					return this;
				} else if ( this.element.form !== undefined ) {
					return new xElement(this.element.form, this);
				}
				var e = this.element.parentNode,
					reg = /form/i;

				while(e && e !== doc.body) {
					if (reg.test(e.tagName)) {
						return STACK.ELEMENTS[e.__exid] || new xElement(e, this);
					}
					e = e.parentNode;
				}
				return null;
			},

			/**
			 * parent : 親要素取得
			 * @param Number level : 階層レベル
			 * @return mixed xElement or Null
			 */
			parent : function(level) {
				var l = level || 1,
					p = this.element,
					i = 0;

				while(p && ++i <= l) {
					p = p.parentNode;
				}
				return p ?STACK.ELEMENTS[p.__exid] || new xElement(p, this) : null;
			},

			/**
			 * children : 子要素リストを取得
			 * @return xNodeList
			 */
			children : function(num) {
				var c = this.element.childNodes,
					ind = -1,
					ret = [],
					i = -1;

				while(c[++i]) {
					if (c[i].nodeType === 1) {
						ret[++ind] = c[i];
					}
				}
				return (typeof num !== 'undefined')
							? (ret[num])
									? STACK.ELEMENTS[ret[num].__exid] || new xElement(ret[num], this)
										: null
											:new xNodeList(ret, this);
			},

			/**
			 * first : 一番最初の子要素を取得
			 * @return xElement or Null
			 */
			first : function() {
				var e = this.element.firstChild;

				while (e) {
					if (e.nodeType === 1) {
						break;
					}
					e = e.nextSibling;
				}
				return e ? STACK.ELEMENTS[e.__exid] || new xElement(e, this) : null;
			},

			/**
			 * last : 一番最後の子要素を取得
			 * @return xElement or Null
			 */
			last : function() {
				var e = this.element.lastChild;

				while (e) {
					if (e.nodeType === 1) {
						break;
					}
					e = e.previousSibling;
				}
				return e ? STACK.ELEMENTS[e.__exid] || new xElement(e, this) : null;
			},

			/**
			 * next : 次の要素を取得
			 * @param Number step : ステップ数
			 * @return xElement or Null
			 */
			next : function(step) {
				var e = this.element,
					s = step || 1,
					i = 0;

				while (e && i < s) {
					e = e.nextSibling;
					if (e && e.nodeType === 1) {
						++i;
					}
				}
				return e ? STACK.ELEMENTS[e.__exid] || new xElement(e, this) : null;
			},
			
			/**
			 * nexts : この要素以降の兄弟要素を取得
			 * @return xNodeList
			 */
			nexts : function() {
				var e = this.element,
					p = this.element.parentNode,
					ret = [],
					ch,
					flag = false;
					ind = -1;
				
				if ( ! p ) {
					return null;
				}
				ch = p.childNodes;
				while ( ch[++ind] ) {
					if ( ch[ind].nodeType !== 1 ) {
						continue;
					} else if ( ch[ind] === e ) {
						flag = true;
						continue;
					}
					if ( flag ) {
						ret[ret.length] = ch[ind];
					}
				}
				
				return new xNodeList(ret, this);
			},

			/**
			 * prev : 前の要素を取得
			 * @param Number step : ステップ数
			 * @return xElement or Null
			 */
			prev : function(step) {
				var e = this.element,
					s = step || 1,
					i = 0;

				while(e && i < s) {
					e = e.previousSibling;
					if (e && e.nodeType === 1) {
						++i;
					}
				}
				return e ? STACK.ELEMENTS[e.__exid] || new xElement(e, this) : null;
			},
			
			/**
			 * prevs : この要素より前の兄弟要素を取得
			 * @return xNodeList
			 */
			prevs : function() {
				var e = this.element,
					p = this.element.parentNode,
					ret = [],
					ch,
					ind = -1;
				
				if ( ! p ) {
					return null;
				}
				ch = p.childNodes;
				while ( ch[++ind] ) {
					if ( ch[ind].nodeType !== 1 ) {
						continue;
					} else if ( ch[ind] === e ) {
						break;
					}
					ret[ret.length] = ch[ind];
				}
				
				return new xNodeList(ret, this);
			},

			/**
			 * detect : 現在の要素を起点にCSSセレクタ検索
			 * @param String expr : CSSセレクタクエリ
			 * @param Boolean isOrig : 独自属性も検索するかどうか
			 * @return xNodeList
			 */
			detect : function(expr, isOrig) {
				var nl = DOM.getElementsBySelector(expr, this.element, !!isOrig);

				return new xNodeList(nl, this);
			},

			/**
			 * detectC : 現在の要素を起点に独自要素も含めてCSSセレクタ検索
			 * @param String expr : CSSセレクタクエリ
			 * @return xNodeList
			 * @note detect()メソッドの第二引数を渡すだけ
			 */
			detectC : function(expr) {
				var nl = DOM.getElementsBySelector(expr, this.element, true);

				return new xNodeList(nl, this);
			},

			/**
			 * getOne : detect()メソッドの結果から単一要素だけを返すショートカット
			 * @param String expr : CSSセレクタクエリ
			 * @param : Nuber index : 取得するインデックス
			 * @return xElement or Null
			 */
			getOne : function(expr, index) {
				var i = index || 0,
					nl = DOM.getElementsBySelector(expr, this.element);

				return nl[i] ? STACK.ELEMENTS[nl[i].__exid] || new xElement(nl[i], this) : null;
			},

			/** ===================// DOM traversal methods ========================= **/

			/**
			 * isExpr : 与えられたCSSクエリで検索される要素軍に含まれるかどうか
			 * @param String expr : CSSセレクタクエリ
			 * @return Boolean
			 */
			isExpr : function(expr) {
				var nl = DOM.getElementsBySelector(expr),
					i = -1;

				while (nl[++i]) {
					if (this.element === nl[i]) {
						return true;
					}
				}
				return false;
			},

			/**
			 * isFirst : 要素が親要素から見て一番最初の子要素がどうかを判定
			 * @return Boolean
			 */
			isFirst : function() {
				return this.parent().first().get() === this.element;
			},

			/**
			 * isLast : 要素が親要素から見て一番最後の子要素かどうかを判定
			 * @return Boolean
			 */
			isLast : function() {
				return this.parent().last().get() === this.element;
			},

			/**
			 * serialize : フォーム要素のみ、中のフォームパーツの値をオブジェクトにシリアライズ
			 * @return mixed Object || false
			 */
			serialize : function() {
				return (this.tag === 'form') ? ut.serializeForm(this.element) : false;
			},

			/**
			 * getContenxt : CanvasRenderingContext2Dオブジェクト返却
			 * @param String dim : Dimension 現在は2Dのみだと思う
			 * @return Object ctx
			 */
			getContext : function(dim) {
				var d = dim || '2D';

				if (this.element.geContext) {
					return this.element.getContext(d);
				}
				throw TypeError('Not support CanvasRenderingContext2D on this element or Browser.');
			},

			/**
			 * addStyle : 要素にCSSを付与
			 * @param mixed name : CSSプロパティ名、またはハッシュオブジェクト
			 * @param String val : プロパティの値
			 * @return this
			 *
			 * Need Compatible Browser for IE6,7
			 */
			addStyle : function(name, val) {
				var i,
					p;

				if (typeof name === 'object') {
					for (i in name) {
						this.addStyle(i, name[i]);
					}
				} else {
					p = ut.camel(name);

					// Does hook Style function exists?
					if (typeof this['_extendStyle' + p] === 'function') {
						if (this['_extendStyle' + p](this.element, val)) {
							return this;
						}
					}

					switch (p) {
					case 'opacity':
						return this.setOpacity(val);
					case 'filter':
						if (ua.IE) {
							this.element.style.filter[p] = val;
						}
						return this;
					case 'float':
						p = (ua.IE6 || ua.IE7) ? 'styleFloat' : 'cssFloat';
						break;
					case 'backgroundImage':
						val = (!CSS_BG_REG.test(val)) ? 'url(' + val + ')' : val;
						break;
					default: break;
					}
					this.element.style[p] = val;
				}
				return this;
			},

			/**
			 * readStyle : 要素のCSS設定値を取得する
			 * @param mixed name : Array or String
			 * @param Boolean isParse : 可能な限り数値で取得するかどうか
			 * @return mixed Object or String or Number or Null
			 *
			 * Need Compatible Browser on IE6,7
			 */
			readStyle : function(name, isParse) {
				var cp,
					e = this.element,
					i = -1,
					isP = isParse || false,
					val,
					now,
					ret,
					pr;

				if (ut.isArray(name)) {
					ret = {};

					while(name[++i]) {
						ret[ut.camel(name[i])] = this.readStyle(name[i], isP);
					}
					return ret;
				}
				cp = ut.camel(name);
				if (cp === 'float') {
					cp = p = 'cssFloat';
				} else if (cp === 'opacity') {
					return this.getOpacity();
				}
				// styleオブジェクトから取得できた場合
				if (e.style[cp]) {
					val = e.style[cp];
				} else {
					// 見つからなかった場合、getComputedStyleから取得
					if ( !COMPUTED_STYLE ) {
						return null;
					}
					now = COMPUTED_STYLE(e, '');
					val = now.getPropertyValue(ut.deCamel(name));
				}
				if (isP) {
					if (cp === 'backgroundImage') {
						return val.replace(/url\(["']?(.+?)["']?\)/, '$1');
					}
					pr = pf(val);
					return (isNaN(pr)) ? val : pr;
				} else {
					return val;
				}
			},

			/**
			 * removeStyle : CSSプロパティを削除する
			 * @param mixed prop : Array or String
			 * @return this
			 */
			removeStyle : function(prop) {
				var i = -1,
					st,
					sp = [],
					pp;

				if (ut.isArray(prop)) {
					while(prop[++i]) {
						this.removeStyle(prop[i]);
					}
				} else {
					st = (this.element.style.cssText) ? this.element.style.cssText.toLowerCase()
							: (this.element.getAttribute('style')) ? this.element.getAttribute('style').cssText.toLowerCase()
									: undefined;
					if (!st) {
						return this;
					}
					pp = ut.deCamel(prop);
					if (st.indexOf(pp) !== -1) {
						sp = st.split(';');
						while(sp[++i]) {
							if (sp[i].indexOf(pp) !== -1) {
								sp.splice(i, 1);
								break;
							}
						}
					}
					if (this.element.style.cssText) {
						this.element.style.cssText = sp.join(';');
					} else if (this.element.getAttribute('style')) {
						this.element.getAttribute('style').cssText = sp.join(';');
					}
				}
				return this;
			},

			/**
			 * setOpacity : opacity値をセットする
			 * @param Number(float) op : 透明度(0〜1)
			 * @return this
			 */
			setOpacity : function(op) {
				this.element.style.opacity = op;
				return this;
			},

			/**
			 * getOpacity : opacity値を取得する
			 * @return Number(float) op
			 */
			getOpacity : function() {
				var now,
					v;

				if (this.element.style.opacity) {
					return pf(this.element.style.opacity);
				}
				// 見つからなかった場合、getComputedStyleから取得
				if ( !COMPUTED_STYLE ) {
					return null;
				}
				now = COMPUTED_STYLE(this.element, '');
				return pf(now.getPropertyValue('opacity'));
			},

			/**
			 * animate : アニメーションショートカット
			 * @param mixed Object or String prop : アニメーションショートカット名、またはアニメーションさせるプロパティハッシュ
			 * @param Object extra : アニメーションパラメータ
			 * @return this
			 */
			animate : function(prop, extra) {
				if (typeof prop === 'string' && Animation[prop]) {
					Animation[prop](this.element, extra);
				} else if (typeof prop === 'object') {
					new Animation(this.element, prop, extra);
				}
				return this;
			},
			
			/**
			 * isSame : 引数の要素が同一の要素であるかをチェック
			 * @param mixed DOM Element|xElement
			 * @return bool
			 */
			isSame : function(to) {
				return this.element === DOM(to).get();
			},

			toString : function() {
				return '[ Class xElement ]';
			}
		};

		// Compatible fix browser section ===============

		// IE6,7,8
		if ( enables.fixIE ) {
			
			xElement.prototype.setOpacity = function(op) {
				if (this.element.runtimeStyle.hasLayout !== true) {
					this.element.style.zoom = 1;
				}
				
				this.element.style.filter = 'alpha(opacity=' + mr(op * 100) + ')';
				return this;
			};

			xElement.prototype.getOpacity = function() {
				var cs = this.element.currentStyle;

				return (/^alpha\(/.test(cs.filter))
							? pi(cs.filter.replace(/^alpha\(opacity=([0-9]+)\)?/, '$1'), 10) / 100
							: 1;
			};

			xElement.prototype.attr = function(name, val) {
				var i, res;

				if (typeof name === 'object') {
					for (i in name) {
						this.attr(i, name[i]);
					}
				} else if (typeof name === 'string') {
					// 拡張フックがあれば実行
					if (typeof this['__extendAttr' + name] === 'function') {
						if(this['__extendAttr' + name](val) === true) {
							return this;
						}
					}
					if (IE_MAP[name]) {
						this.element[IE_MAP[name]] = val;
					} else {
						this.element.setAttribute(name, val);
					}
				}
				return this;
			};

			xElement.prototype.readAttr = function(name) {
				var i = -1, len, ret;

				if (typeof name === 'string') {
					return (IE_MAP[name]) ? this.element[IE_MAP[name]]
											: this.element.getAttribute(name);
				} else if (ut.isArray(name)) {
					ret = {};
					while(name[++i]) {
						ret[name[i]] = this.readAttr(name[++i]);
					}
					return ret;
				}
			};

			xElement.prototype.readStyle = function(name, isParse) {
				var cp,
					e = this.element,
					i = -1,
					isP = isParse || false,
					val,
					cs,
					ret,
					pr;

				if (ut.isArray(name)) {
					ret = {};

					while(name[++i]) {
						ret[ut.camel(name[i])] = this.readStyle(name[i], isP);
					}
					return res;
				}
				cp = ut.camel(name);
				if (cp === 'float') {
					cp = p = 'styleFloat';
				}
				if (cp === 'opacity') {
					val = this.getOpacity();
				} else if (e.style[cp]) {
					// styleオブジェクトから取得できた場合
					val = e.style[cp];
				} else {
					// なければcurrentStyleから取得
					val = e.currentStyle[cp];
				}
				if (isP) {
					if (cp === 'backgroundImage') {
						return val.replace(/url\(["']?(.+?)["']?\)/, '$1');
					}
					pr = pf(val);
					return (isNaN(pr)) ? val : pr;
				} else {
					return val;
				}
			};

		}

		// advance Compatible IE6 CSS position:fixed
		if (ua.IE6 && CORE_CONFIG.IEboost.positionFix) {
			ua.__positionKey = true;
			xElement.prototype.appendTo = function(elm, mode) {
				var to = mode || 'default',
					S = SYSTEM,
					t,
					v;

				if (!elm) {
					if (!this.element.parentNode) {
						v = this.element.__isFixed || S.POSITION[this.readStyle('position')];
						t = (e === S.POSITION_FIXED) ? body : win.IEFIX.body || body;
					} else {
						t = win.IEFIX.body;
					}
				} else {
					t = (elm instanceof xElement) ? elm.get() : elm;
				}
				if (to === 'before') {
					t.parentNode.insertBefore(this.element, t);
				} else if (to === 'after') {
					if (t.parentNode.lastChild === t) {
						t.parentNode.appendChild(this.element);
					} else {
						t.parentNode.insertBefore(this.element, t.nextSibling);
					}
				} else {
					t.appendChild(this.element);
				}
				return this;
			};

			// override again.
			xElement.prototype.addStyle = function(name, val) {
				var i,
					p,
					v,
					cv,
					cp,
					parent,
					val;

				if (typeof name === 'object') {
					for (i in name) {
						this.addStyle(i, name[i]);
					}
				} else {
					p = ut.camel(name);

					// Does hook Style function exists?
					if (typeof this['_extendStyle' + p] === 'function') {
						if (this['_extendStyle' + p](this.element, val)) {
							return this;
						}
					}

					switch (p) {
					case 'opacity':
						return this.setOpacity(val);
					case 'filter':
						this.element.style[p] = val;
					case 'float':
						p = 'float';
						break;
					case 'position':
						parent = this.element.parentNode;
						if (parent) {
							cp = this.readStyle('position');
							v = SYSTEM.POSITION[val];
							if (v === SYSTEM.POSITION_FIXED) {
								// fixedの場合、bodyにappend
								this.appendTo(doc.body);
								val = 'absolute';
							} else if (parent === doc.body) {
								this.appendTo(win.IEFIX.body);
							}
						}
						this.element.__isFixed = v;
						this.element.style.position = val;
						break;
					case 'backgroundImage':
						val = (!CSS_BG_REG.test(val)) ? 'url(' + val + ')' : val;
						break;
					default: break;
					}
					this.element.style[p] = val;
				}
				return this;
			};

			// override again
			xElement.prototype.readStyle = function(name, isParse) {
				var cp,
					e = this.element,
					i = -1,
					isP = isParse || false,
					val,
					cs,
					ret,
					pr;

				if (ut.isArray(name)) {
					ret = {};

					while(name[++i]) {
						ret[ut.camel(name[i])] = this.readStyle(name[i], isP);
					}
					return res;
				}
				cp = ut.camel(name);
				if (cp === 'float') {
					cp = p = 'styleFloat';
				}
				if (cp === 'opacity') {
					val = this.getOpacity();
				} else if (e.style[cp]) {
					// styleオブジェクトから取得できた場合
					val = e.style[cp];
				} else {
					val = e.currentStyle[cp];
				}
				if (val === 'position' && this.element.__isFixed) {
					return SYSTEM.POSITION[val] || 'static';
				}
				if (isP) {
					if (cp === 'backgroundImage') {
						return val.replace(/url\(["']?(.+?)["']?\)/, '$1');
					}
					pr = pf(val);
					return (isNaN(pr)) ? val : pr;
				} else {
					return val;
				}
			};
		}

		// <-- xElement

	/**
	 * xNodeList
	 */
	function xNodeList(nodeList, parent) {
		var len = nodeList.length;

		this.nodeList = nodeList;
		this.length = len;
		this.__first = nodeList[0] || null;
		this.__last = nodeList[len - 1] || null;
		this.__parent = parent || null;
		this.__with = false;
	}

		xNodeList.prototype = {
			/**
			 * is : 要素が存在するかどうかをチェック
			 * @return Boolean
			 */
			is : function() {
				return this.length > 0;
			},

			/**
			 * foreach : 要素リストに対してループ処理
			 * @param Function fn : 適用する関数
			 * @return this
			 *
			 * @note 適用関数の第一引数にはインデックスナンバーが渡される
			 */
			foreach : function(fn) {
				var n = this.nodeList,
					len = this.length,
					i = -1;

				while(n[++i]) {
					if (fn.call(n[i], i) === false) {
						break;
					}
				}
				return this;
			},

			/**
			 * each : 要素リストに対してループ処理（軽負荷バージョン）
			 * @param Function fn : 適用する関数
			 * @return this
			 *
			 * @note Function.callをしないのでやや早い
			 */
			each : function(fn) {
				var n = this.nodeList,
					len = this.length,
					i = -1;

				while(n[++i]) {
					if (fn(n[i], i) === false) {
						break;
					}
				}
				return this;
			},

			/**
			 * get : 要素リストのn番目を取得
			 * @param Number num : 取得インデックス
			 * @return xElement
			 */
			get : function(num) {
				return this.nodeList[num]
								? STACK.ELEMENTS[this.nodeList[num].__exid] || new xElement(this.nodeList[num], this)
								: null;
			},

			/**
			 * slice : 要素を範囲指定で切り出す
			 * @param Number start : 切り出し開始位置
			 * [@param Number end : 切り出し終了位置（なければ最後まで）
			 * @return mixed xNodeList or Null
			 */
			slice : function(start, end) {
				return new xNodeList(this.nodeList.slice(start || 0, end), this);
				var n = this.nodeList,
					len = this.length,
					i = start,
					ind = -1,
					res = [];

				if ( ! n[i]) {
					return null;
				}
				while(n[i]) {
					res[++ind] = n[i];
					++i;
					if (end && end === i) {
						break;
					}
				}
				return new xNodeList(res, this);
			},

			/**
			 * first : 要素リストの一番初めの要素を取得
			 * @return mixed xElement or Null
			 */
			first : function() {
				return (this.__first !== null)
							? STACK.ELEMENTS[this.__first.__exid] || new xElement(this.__first)
							: null;
			},

			/**
			 * last : 要素リストの一番最後の要素を取得
			 * @return mixed xElement or Null
			 */
			last : function() {
				return (this.__last !== null)
							? STACK.ELEMENTS[this.__last.__exid] || new xElement(this.__last)
							: null;
			},

			/**
			 * add : 要素リストに追加
			 * @param mixed data : Element or xElement or JSArray or nodeArray or CSS SelectorString
			 * @return this;
			 */
			add : function(data) {
				var p = DOM(data),
					n = this.nodeList;
					pn,
					len,
					len2,
					i = -1;

				if (p instanceof xNodeList) {
					pn = p.nodeList;
					len = this.length;
					this.__length = len;
					len2 = p.length;
					while(pn[++i]) {
						n[len++] = pn[i];
						++this.length;
					}
				} else if (p instanceof xElement) {
					this.length = n.push(this.__parent.get());
				}
				return this;
			},

			/**
			 * with : parentがある場合、その要素も含める
			 * @return this;
			 */
			'with' : function() {
				var p = this.__parent,
					n = this.nodeList;
					pn,
					len,
					len2,
					i = -1;

				if (p && !this.__with) {
					if (p instanceof xNodeList) {
						pn = p.nodeList;
						len = this.length;
						this.__length = len;
						len2 = p.length;
						while(pn[++i]) {
							n[len++] = pn[i];
							++this.length;
						}
					} else if (p instanceof xElement) {
						this.length = n.push(this.__parent.get());
					}
					this.__with = true;
				}
				return this;
			},

			/**
			 * withOut : with()を実行していた場合、parentを含めなくする
			 * @return this
			 */
			withOut : function() {
				if (this.__with) {
					if (this.__length) {
						this.nodeList = this.nodeList.slice(0, this.__length);
						this.length = this.__length;
					} else {
						this.nodeList.pop();
						--this.length;
					}
					this.__with = false;
				}
				return this;
			},

			/**
			 * filter : 擬似クラスでフィルタリング
			 * @param String filter : 擬似クラスフィルター文字列
			 * @return xNodeList
			 */
			filter : function(filter) {
				if (/^:/.test(filter)) {
					filter = filter.slice(1);
				}
				var nl = DOM.selectElementsByFilter(this.nodeList, [filter]);

				return new xNodeList(nl, this);
			},
			
			/**
			 * nth : nth-childフィルタリング
			 * @param String rule : 2n+1, even, odd...
			 * @return xNodeList
			 */
			nth : function(rule) {
				return this.filter(':nth-child(' + rule + ')');
			},
			
			/**
			 * 指定classを持たないものをフィルタリング
			 * @param String klass : class属性値
			 * @return xNodeList
			 */
			notHasClass : function(klass) {
				var i = -1,
					nodeList = this.nodeList,
					ret = [],
					kv = ' ' + klass + ' ',
					elm;
				
				while ( nodeList[++i] ) {
					elm = nodeList[i];
					if ( (' ' + elm.className + ' ').indexOf(kv) === -1 ) {
						ret[ret.length] = elm;
					}
				}
				
				return new xNodeList(ret, this);
			},
			
			/**
			 * rollBack : parentに戻る
			 * @return mixed xNodeList or xElement or Null
			 */
			rollBack : function() {
				return this.__parent;
			},

			toString : function() {
				return '[ Class xNodeList ]';
			}
		};
	// <-- xNodeList
		xNodeList.prototype.getRange = xNodeList.prototype.slice;


	// xNodeListにxElementのメソッドをattach、イベントショートカット生成
	(function() {
		var evs = ('click,mouseover,mouseout,dblclick,'
					+ 'mousedown,mouseup,submit,change,'
					+ 'blur,focus,keydown,keypress,keyup,select').split(','),
			xepProps = ('ignore,attr,removeAttr,addClass,removeClass,'
						+ 'toggleClass,replaceClass,event,hover,once,'
						+ 'Cevent,unevent,inText,html,remove,empty,'
						+ 'hide,show,toggleShow,visible,invisible,'
						+ 'setValue,prop,addStyle').split(','),
			i = -1,
			j = -1,
			p,
			e,
			xep = xElement.prototype,
			xnp = xNodeList.prototype;

		while(xepProps[++j]) {
			p = xepProps[j];
			if (typeof xep[p] === 'function'
					&& typeof xnp[p] === 'undefined') {
				(function(m) {
					// @note xElementのメソッド群は最大で3つの引数を取る。
					// ある/なしに関わらず3つの引数を渡してapplyを使用しない。
					xnp[m] = function(a1, a2, a3) {
						var nl = this.nodeList,
							i = -1;

						while(nl[++i]) {
							(STACK.ELEMENTS[nl[i].__exid] ||new xElement(nl[i]))[m](a1, a2, a3);
						}
						return this;
					};
				})(p);
			}
		}

		while(evs[++i]) {
			e = evs[i];
			(function(e) {
				xep[e] = function(fn, bind) {
					Base.event.set(this.element, e, fn, bind || false);
					return this;
				};
				xep['un' + e] = function(fn) {
					Base.event.remove(this.element, e, fn);
					return this;
				};
				xnp[e] = function(fn, bind) {
					var i = -1,
						n = this.nodeList;

					while(n[++i]) {
						Base.event.set(n[i], e, fn, bind || n[i]);
					}
					return this;
				};
				xnp['un' + e] = function(fn, bind) {
					var i = -1,
						n = this.nodeList;

					while(n[++i]) {
						Base.event.remove(n[i], e, fn);
					}
					return this;
				};
			})(e);
		}


	})();

	/** ============ // xElement,xNodeList拡張クラスここまで =========================== **/

	/** ============================ 内部タイマーモジュール ================================== **/

	INTERVAL_FPS = ua.IE && ua.IEV < 9 ? 5 : 10;
	/**
	 * Timer : タイマー管理I/Oクラス
	 */
	function Timer(fn) {
		this.fn = this.__makeFunction(fn);
		this.timerID = CoreTimer.pushStack(this);
		return this;
	}

		Timer.prototype = {
			stop : function() {
				CoreTimer.stop(this.timerID);
			},
			start : function(begin) {
				this.begin = begin || 0;
				CoreTimer.start();
			},
			exec : function() {
				this.fn();
			},
			__makeFunction : function(fn) {
				fn.prototype.stop = this.stop;
				return fn;
			},
			isPlaying : function() {
				return CoreTimer.isPlaying;
			}
		};
	// <-- Timer

	/**
	 * CoreTimer : 内部タイマー管理
	 */
	CoreTimer = {
		count : 0,
		stack : [],
		play : false,
		globalTimerID : 0,
		pushStack : function(timer) {
			var cn = this.count;

			this.stack[cn] = [timer, cn, false];
			++this.count;
			return cn;
		},
		isPlaying : function() {
			return this.play;
		},
		start : function() {
			if (this.play === true) {
				return;
			}
			this.play = true;
			this.globalTimerID = interval(function() {
				var st = CoreTimer.stack,
					i = -1;

				while(st[++i]) {
					if (st[i] && st[i][2] === false) {
						st[i][0].exec();
					}
				}
			}, INTERVAL_FPS);
		},
		stop : function(id) {
			if ( ! this.stack[id]) {
				return;
			}
			this.stack[id][2] = true;

			var st = this.stack,
				i = -1,
				f = true;

			while(st[++i]) {
				if (st[i] && st[i][2] === true) {
					continue;
				} else {
					f = false;
				}
			}
			if (f === true) {
				this.clear();
			}
		},
		clear : function() {

			unInterval(this.globalTimerID);
			this.play = false;
			this.stack = [];
			this.stackLength = 0;
			this.count = 0;
		}
	};
	
	/** ================================= Keyマッパーモジュール ========================================= **/

	function KeyMapper(ev) {
		this.code = ev.keyCode || ev.charCode || ev.which;
		this.SHIFT = !!ev.shiftKey;
		this.CTRL  = !!ev.ctrlKey;
		this.TenKeys = {};
		
		if ( ev.type === 'keypress' ) {
			this.__setUpKeyMap(KEY_MAP.PRESS);
		} else {
			this.__setUpKeyMap(KEY_MAP.DOWN_UP);
		}
	}
	
		KeyMapper.prototype = {
			__setUpKeyMap : function(map) {
				var k = pi(this.code, 10),
					basic = map.BASIC,
					shift = map.SHIFT,
					tenkey = map.TEN_KEY,
					i;
					
				for ( i in basic) {
					this[i] = (basic[i] === k);
				}
				for ( i in shift ) {
					this[i] = (this.SHIFT && shift[i] === k);
				}
				for ( i in tenkey ) {
					this.TenKeys[i] = (tenkey[i] === k);
				}
			}
		};
		
	MODULES.keymapper = KeyMapper;
	
	/** ================================= レイヤーモジュール ========================================= **/

	function Layer(bool) {
		var layer;

		// already instanced.
		if (STACK.GLOBAL_LAYER) {
			if (bool === true) {
				STACK.GLOBAL_LAYER.show();
			}
			layer = union({}, STACK.GLOBAL_LAYER);
			layer.opacity = 0.6;
			layer.showFlag = !!bool;
			if (layer.showFlag === true) {
				layer.show();
			}
			return layer;
		} else {
			this.opacity = 0.6;
			this.showFlag = !!bool;
			STACK.GLOBAL_LAYER = this;
			this.__construct();
			if (this.showFlag === true) {
				this.show();
			}
			return this;
		}
	}

		Layer.prototype = {
			/**
			 * コンストラクタ
			 */
			__construct : function() {
				var z = SYSTEM.CURRENT_ZINDEX;

				// create layer
				this.layer = DOM.create('div')
									.attr('id', 'fl_layer')
									.appendTo()
									.addStyle({
										position : 'fixed',
										width : '100%',
										height : '100%',
										backgroundColor : '#000',
										display : 'none',
										margin : '0',
										top : '0px',
										left : '0px',
										zIndex : z > 1000 ? z + 1 : 1000
									});
				this.__lock = false;
			},

			/**
			 * isHidden : レイヤーが表示状態かどうかを判定
			 * @return Boolean
			 */
			isHidden : function() {
				return !this.showFlag;
			},

			/**
			 * setOpacity : 透明度設定
			 * @param Number(float) : op 透明度
			 * @return this
			 */
			setOpacity : function(op) {
				this.layer.setOpacity(op);
				return this;
			},

			/**
			 * lock : レイヤーの表示状態をロックする
			 */
			lock : function() {
				this.__lock = true;
			},

			/**
			 * unlock : 表示ロック解除
			 */
			unlock : function() {
				this.__lock = false;
			},

			/**
			 * show : レイヤー表示
			 * @param Boolean isAnimate : フェードインさせるかどうか
			 * @param Function callback : 表示後に実行する関数
			 * @reutrn this
			 */
			show : function(isAnimate, callback) {
				var that = this;

				if (isAnimate) {
					Animation.appear(this.layer, {
						from : 0,
						to : this.opacity,
						speed : 0.1,
						easing : 100,
						callback : function() {
										that.__show(callback);
									}
					});
				} else {
					this.__show(callback);
				}
				this.showFlag = true;
				return this;
			},

			/**
			 * __show : 表示実行
			 * @param Function fn :show()メソッドで渡したコールバック
			 */
			__show : function(fn) {
				this.layer.setOpacity(this.opacity);
				this.layer.show();
				if (typeof fn === 'function') {
					fn();
				}
			},

			/**
			 * hide : レイヤーを非表示にする
			 * @param Boolean isAnimate : フェードアウトさせるかどうか
			 * @param Function callback : 非表示後に実行するコールバック関数
			 * @return this;
			 */
			hide : function(isAnimate, callback) {
				var that = this;

				if (this.__lock === true) {
					return this;
				}

				if (isAnimate) {
					Animation.fade(this.layer, {
						from : this.opacity,
						to : 0,
						speed : 0.1,
						easing : 0,
						callback : function() {
										that.__hide(callback);
									}
					});
				} else {
					this.__hide(callback);
				}
				return this;
			},

			/**
			 * __hide : 非表示実行
			 * @param Function fn : 実行する関数
			 */
			__hide : function(fn) {
				this.layer.hide();
				if (typeof fn === 'function') {
					fn();
				}
			},

			/**
			 * getLayer : レイヤー要素を取得
			 * @return xElement
			 */
			getLayerObject : function() {
				return this.layer;
			},

			/**
			 * showLoading : 中央にローディングアニメーション表示
			 * @param String className : ローディング用class属性
			 * @return this
			 */
			showLoading : function(className) {
				if (className) {
					this.layer.addClass(className);
				} else {
					this.layer.addStyle({
						backgroundImage : 'url(' + CORE_CONFIG.APPPATH + ')',
						backgroundPosition : 'center center',
						backgroundRepeat : 'no-repeat'
					});
				}
			},

			/**
			 * hideLoading : ローディングアニメーション削除
			 * @param String className : ローディングでつけたclass属性
			 * @return this
			 */
			hideLoading : function(className) {
				if (className) {
					this.layer.removeClass(className);
				} else {
					this.layer.removeStyle(['backgroundImage', 'backgroundPosition', 'backgroundRepeat']);
				}
				return this;
			},

			toString : function() {
				return '[ Module Layer ]';
			}
		};

		// Compatible Override
		if (ua.IE6) {
			Layer.prototype.__construct = function() {
				var sc = ut.getScrollPosition(),
					z = (SYSTEM.CURRENT_ZINDEX > 1000) ? SYSTEM.CURRENT_ZINDEX + 1 : 1000;

				this.layer = DOM.create('div')
								.attr('id', 'fl_layer')
								.addStyle({
									position : 'absolute',
									width : '100%' ,
									height : body.clientHeight + 'px',
									overflow : '', opacity : 0.6,
									backgroundColor : '#000',
									display : 'none',
									top : 0 + 'px',
									left : 0 + 'px',
									zIndex : z
								})
								.appendTo(CORE_CONFIG.IEboost.positionFix ? win.IEFIX.body : doc.body)
								.addStyle('position', 'fixed'); // need process!
				if (CORE_CONFIG.IEboost.positionFix) {
					this.__coveredBody = DOM(doc.getElementById('fl_cover_body'));
				}
				this.__lock = false;
			};

			Layer.prototype.__isOverlay = function(e) { // IE6 only
				var z = DOM(e).readStyle('zIndex');

				return !(z === 'auto' || z > 1000);
			};

			// override
			Layer.prototype.show = function(bool, callback) {
				var that = this,
					isFix = CORE_CONFIG.IEboost.positionFix;

				if (!isFix) {
					body.style.height = '100%';
					body.style.width = '100%';
					doc.documentElement.style.overflow = 'hidden';
				}

				// ReFix body height
				this.layer.addStyle('height', body.clientHeight + 'px');

				// invisible select element
				this.selectElements = (isFix) ? this.__coveredBody.detect('select') : DOM('select');
				this.selectElements.foreach(function() {
						if (that.__isOverlay(this)) {
							this.style.visibility = 'hidden';
						}
					});

				if (bool) {
					Animation.appear(this.layer, {
						from : 0,
						to : this.opacity,
						speed : 0.1,
						easing : 100,
						callback : function(){
							that.__show(callback);
						}
					});
				} else {
					this.__show(callback);
				}
				this.showFlag = true;
			};

			Layer.prototype.hide = function(bool, callback) {
				var that = this,
					isFix = CORE_CONFIG.IEboost.positionFix;

				if (this.__lock === true) {
					return this;
				}

				// visible select element
				if (!bool && this.selectElements && this.selectElements.length > 0) {
					this.selectElements.foreach(function(){
							this.style.visibility = 'visible';
						});
				}
				if (!isFix) {
					body.style.height = 'auto';
					body.style.width = 'auto';
					doc.documentElement.style.overflow = 'auto';
				}

				if (bool) {
					Animation.fade(this.layer, {
						from : this.opacity,
						to : 0,
						speed : 0.1,
						easing : 0,
						callback: function(){
							that.selectElements.foreach(function(){
									this.style.visibility = 'visible';
								});
							that.__hide(callback);
						}
					});
				} else {
					that.__hide(callback);
				}
				this.showFlag = false;
				return this;
			};
		}

		// <-- Layer

	MODULES.layer = Layer;

	/** ============================================ Windowモジュール ======================================== */
/*
	// TODO : implemenet
	(function() {
		var ppCount = 0,
			ppStack = [],
			stableIndex = 990,
			latestIndex = 1100,
			imgBase = CORE_CONFIG.BASE_URL,
			//layer = new Layer(),
			loadedCss = false,
			skins = {
				'default' : {
					titleColor : '#bdd7ee',
					borderColor : '#829edf'
				}
			};

		// local functions
		function hideWindow() {
			var PP;

			if (ppCount === 1) {
				PP = ppStack[ppCount - 1];
				// do callback is exists
				if (PP.closeCallback && ut.isFunction(PP.closeCallback)) {
					PP.closeCallback();
				}
				PP.box
					.unevent(['mouseover', 'mouseout'])
					.remove();
				ppStack = [];
				ppCount--;
				if (PP.keepLayer === false) {
					layer.hide();
				}
			} else {
				PP = ppStack[ppCount - 1];
				// do callback is exists
				if (PP.closeCallback && FL.ut.isFunction(PP.closeCallback)) {
					PP.closeCallback();
				}
				PP.box
					.unevent(['mouseover', 'mouseout'])
					.remove();
				ppStack[ppCount - 2].box
					.addStyle('zIndex', latestIndex);
				ppStack.pop();
				ppCount--;
			}
		}

		function _Window(obj, isShow) {
			if (ppCount === 10) {
				return alert('これ以上はウインドウは増やせません！');
			}
			try {
			if (!loadedCss) {
				Base.load.css('fl_window');
				loadedCss = true;
			}


			this.__construct(obj, isShow);
			this.isHidden = true;
			++ppCount;
			ppStack[ppStack.length] = this;
			return this;
			}catch(e) {
				console.log(e);
			}
		}

			_Window.prototype = {
				__construct : function(obj, isShow) {
					union(this, union({
						title : '',
						width : 600,
						height : 400,
						skin : 'default',
						modal : false,
						fixPosition : false
					}, obj || {}));
					if (this.modal) {
						this.layer = new Layer();
					}
					this.__generateWindow();

					if (isShow) {
						this.show();
					}
				},
				setTitle : function(ttl) {
					this.title = ttl || '';
				},
				setWidth : function(w) {
					this.widthidth = w || 600;
				},
				setHeight : function(h) {
					this.height = h || 400;
				},
				setDimension : function(obj) {
					this.width = obj.width || this.width;
					this.height = obj.height || this.height;
				},
				setSkin : function(skin) {
					this.skin = skin || this.skin;
				},
				setContent : function(html) {
					if (this.body) {
						this.body.html(html);
					}
				},
				__generateWindow : function() {
					var s = this.skin;

					this.__win = DOM.create('div')
										.addClass('fl_windows')
										.addStyle({
											border : 'solid 3px ' + skins[s].borderColor,
											MozBorderRadius : '8px',
											borderRadius : '8px',
											WebkitBorderRadius : '8px',
											MozBoxShadow : '5px 5px 5px #ccc',
											WebkitBoxShadow : '5px 5px 5px #ccc',
											boxShadow : '5px 5px 5px #ccc',
											position : 'absolute',
											display : 'none',
											top : '50%',
											left : '50%',
											zIndex : latestIndex
										});
					this.ttl = DOM.create('div')
							.addClass('fl_window_title')
							.addStyle({
								margin : 0,
								backgroundColor : skins[s].titleColor,
								MozBorderRadius : '5px 5px 0 0',
								borderRadius : '5px 0 5px 0',
								WebkitBorderRadius : '5px 0 5px 0',
								width : '100%',
								height : '30px',
								position : 'relative'
							})
							.appendTo(this.__win);
					DOM.create('span')
							.addStyle({
								position : 'absolute',
								top : '5px',
								left : '5px'
							})
							.appendTo(this.ttl);
					DOM.create('a')
							.attr('href', 'javascript:void(0)')
							.addStyle({
								position : 'absolute',
								top : '5px',
								right : '5px',
								textDecoration : 'none'
							})
							.inText('close')
							.appendTo(this.ttl);
					this.body = DOM.create('div')
							.addClass('fl_window_body')
							.addStyle({
								margin : 0,
								padding : '10px',
								backgroundColor : '#fff'
							})
							.appendTo(this.__win);

					this.__win.appendTo()
								.getOne('a').click(this.hide, this);
				},
				show : function() {
					var c = ut.getCenterPosition(),
						sc = ut.getScrollPosition();

					this.ttl.getOne('span').inText(this.title);
					this.body.addStyle({
						width : this.width - 26 + 'px',
						height : this.height - 56 + 'px',
					});
					this.__win.addStyle({
						width : this.width + 'px',
						height : this.height + 'px',
						marginTop : -this.height / 2 + 'px',
						marginLeft : -this.width / 2 + 'px',
						display : 'block'
					});
				},
				hide : function() {
					this.__win.hide();
				}
			};

		Core.modules.window = _Window;

	})();
*/

	/**
	 * Animationモジュールコンストラクタ
	 * 以下のメソッドからこのコンストラクタが呼ばれる。
	 * または、グローバルにコード中から呼んでも良い。
	 * @param mixed Element or xElement e : アニメーション対象要素
	 * @param Object prop : アニメーション変更オブジェクト
	 * @param Object extra : 追加パラメータ
	 * @return void
	 */
	function Animation(e, prop, extra) {
		var elm = (e instanceof xElement) ? e.get() : e,
			ee = DOM(e),
			opt = union({
				speed : 30,
				easing : 0,
				callback : null,
				delay : 0
			}, extra || {}),
			obj = {
				width : elm.style.pixelWidth || elm.offsetWidth,
				height : elm.style.pixelHeight || elm.offsetHeight,
				top : elm.style.pixelTop || elm.offsetTop,
				left : elm.style.pixelLeft || elm.offsetLeft,
				marginTop : Animation.__getStyle(ee, 'marginTop'),
				marginLeft : Animation.__getStyle(ee, 'marginLeft'),
				visibility : ee.readStyle('visibility'),
				display : ee.readStyle('display'),
				position : ee.readStyle('position'),
				opacity : ee.getOpacity()
			},
			cProp = {},
			defs = {},
			c = 0,
			cEnd = opt.speed - 1,
			o,
			step,
			k = 0.8,
			deg,
			KE = k * opt.easing,
			A = 100 / k,
			p,
			i,
			t,
			tcp,
			tcpv,
			tcpvi,
			D;

		if (obj.position === 'static') {
			elm.style.position = 'relative';
		}
		if (obj.display === 'none') {
			elm.style.display = '';
		}
		if ( obj.visibility === 'hidden' ) {
			elm.style.visibility = 'visible';
		}
		
		elm.__animate = true;
		for (p in prop) {
			tcp = ut.camel(p);
			tcpv = (tcp in obj) ? obj[tcp] : ee.readStyle(tcp, true);
			tcpvi = pf(tcpv, 10);
			if (NUMERIC_CSS.indexOf(tcp) !== -1) {
				cProp[tcp] = [prop[p], (prop[p] > tcpv), true];
				defs[tcp] = tcpv;
			} else if (!isNaN(tcpvi)) {
				cProp[tcp] = [prop[p], (prop[p] > tcpvi), false];
				defs[tcp] = tcpvi;
			}
		}
		
		D = new DefferdState(this);
		
		var a = [], b = [];
		for ( var i in defs ) {
			a.push(i, defs[i]);
		}
		for ( var i in cProp ) {
			b.push(i, cProp[i]);
		}
		//alert(a.join(','));
		//alert(b.join(','));
		
		t = new Timer(function() {
			if (c++ <= cEnd) {
				step = c / cEnd;
				deg = (100 + KE) * step / (2 * KE * step + 100 - KE);
				for (i in cProp) {
					o = defs[i] + (cProp[i][0] - defs[i]) * deg;
					if ((cProp[i][1] && cProp[i][0] < o)
							|| (!cProp[i][1] && cProp[i][0] > o)) {
						o = cProp[i][0];
					}
					//alert(o);
					ee.addStyle(i, o + (cProp[i][2] === true ? '' : 'px'));
				}
			} else {
				this.stop();
				D.success();
				elm.__animate = false;
				if (typeof opt.callback === 'function') {
					opt.callback.call(elm);
				}
				if (opt.afterHide === true) {
					e.hide();
				}
			}
		});
		
		(opt.delay > 0) ? delay(t.start, opt.delay)
								: t.start();
		D.abort(function() {
			t.stop();
			elm.__animate = false;
		});
		return D;
	}
	
	// animation smoothly easing and timer durations 
	// @note this method is currentry ready...
	//  maybe we implement this method at main function on next version.
	Animation.smoothly = function (e, prop, extra) {
		var elm = (e instanceof xElement) ? e.get() : e,
			ee = DOM(e),
			opt = union({
				duration : 1,
				easing : 'liner',
				callback : null,
				delay : 0
			}, extra || {}),
			obj = {
				width : elm.style.pixelWidth || elm.offsetWidth,
				height : elm.style.pixelHeight || elm.offsetHeight,
				top : elm.style.pixelTop || elm.offsetTop,
				left : elm.style.pixelLeft || elm.offsetLeft,
				marginTop : Animation.__getStyle(ee, 'marginTop'),
				marginLeft : Animation.__getStyle(ee, 'marginLeft'),
				visibility : ee.readStyle('visibility'),
				display : ee.readStyle('display'),
				position : ee.readStyle('position'),
				opacity : ee.getOpacity()
			},
			cProp = {},
			defs = {},
			p,
			i,
			t,
			tcp,
			tcpv,
			tcpvi,
			D,
			duration = opt.duration * 1000,
			easing = opt.easing;

		if (obj.position === 'static') {
			elm.style.position = 'relative';
		}
		if (obj.display === 'none') {
			elm.style.display = '';
		}
		if ( obj.visibility === 'hidden' ) {
			elm.style.visibility = 'visible';
		}
		
		elm.__animate = true;
		for (p in prop) {
			tcp = ut.camel(p);
			tcpv = (tcp in obj) ? obj[tcp] : ee.readStyle(tcp, true);
			tcpvi = pf(tcpv, 10);
			if (NUMERIC_CSS.indexOf(tcp) !== -1) {
				cProp[tcp] = [prop[p], (prop[p] > tcpv), true];
				defs[tcp] = tcpv;
			} else if (!isNaN(tcpvi)) {
				cProp[tcp] = [prop[p], (prop[p] > tcpvi), false];
				defs[tcp] = tcpvi;
			}
		}
		D = new DefferdState(this);

		t = new Timer(function() {
			var now = +new Date,
				time = now - this.begin,
				point;
			
			if ( time < duration ) {
				for (i in cProp) {
					point = Animation.easings[easing](time, defs[i], cProp[i][0], duration);
					ee.addStyle(i, point + (cProp[i][2] === true ? '' : 'px'));
				}
			} else {
				for (i in cProp) {
					ee.addStyle(i, cProp[i][0] + defs[i] + (cProp[i][2] === true ? '' : 'px'));
				}
				this.stop();
				D.success();
				elm.__animate = false;
				if (typeof opt.callback === 'function') {
					opt.callback.call(elm);
				}
				if (opt.afterHide === true) {
					ee.hide();
				}
			}
		});
		
		(opt.delay > 0) ? delay(function() {t.start(+new Date);}, opt.delay)
								: t.start(+new Date);
		D.abort(function() {
			t.stop();
			elm.__animate = false;
		});
		return D;
	};
	
	// easing functions
	Animation.easings = {
		liner : function(t, b, c, d) {
			return c * t / d + b;
		},
		easeInQuad : function(t, b, c, d) {
			return c * (t /= d) * t + b;
		},
		easeOutQuad : function(t, b, c, d) {
			return -c *(t /= d) * (t - 2) + b;
		},
		easeInOutQuad: function(t, b, c, d) {
			return ( (t /= d / 2) < 1 )
			       ? c / 2 * t * t + b
			       : -c / 2 * ((--t) * (t - 2) - 1) + b;
		},
		easeInCubic : function(t, b, c, d) {
			return (t / d) * t * t + b;
		},
		easeOutCubic : function(t, b, c, d) {
			return c * ((t = t / d - 1) * t * t + 1) + b;
		},
		easeInOutCubic : function(t, b, c, d) {
			return ( (t /= d / 2 ) < 1 )
			       ? c / 2 * t * t * t + b
			       : c / 2 * ((t -= 2) * t * t + 2) + b;
		},
		easeOutBack : function(t, b, c, d) {
			var s = 1.70158;
			
			return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
		},
		easeOutBounce : function(t, b, c, d) {
			return ( (t /= d) < (1 / 2.75) ) ? c * (7.5625 * t * t) + b :
			       ( t < (2 / 2.75) ) ? c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b :
			       ( t < (2.5 / 2.75) ) ? c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b :
			       c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
		}
	};

	Animation.__getStyle = function(e, style) {
		var v = e.readStyle(style);

		return (v !== 'auto') ? pi(v, 10) : 0;
	};

	// Shortcut methods
	/**
	 * Animation.appear : フェードイン
	 */
	Animation.appear = function(elm, extra) {
		var e = DOM(elm),
			opt = union({
				speed : 40,
				easing : 0,
				callback : null
			}, extra || {});

		if (e.isHidden()) {
			e.show();
		}
		if (!e.isVisible()) {
			e.visible();
		}
		return new Animation(e.setOpacity(opt.from || 0), {opacity : opt.to || 1}, opt);
	};

	/**
	 * Animation.fade : フェードアウト
	 */
	Animation.fade = function(elm, extra) {
		var e = DOM(elm),
			opt = union({
				speed : 40,
				easing : 0,
				callback : null,
				afterHide : true
			}, extra || {});

		if (e.isHidden()) {
			e.show();
		}
		if (!e.isVisible()) {
			e.visible();
		}
		return new Animation(e, {opacity : opt.to || 0}, opt);
	};

	/**
	 * Animation.expand : 要素ズーム
	 */
	Animation.expand = function(elm, extra) {
		var e = DOM(elm),
			el = e.get(),
			w = el.offsetWidth,
			h = el.offsetHeight,
			opt = union({
				speed : 40,
				mode : 'wh',
				dest : 'center',
				width : w,
				height : h,
				easing : 0,
				callback : null
			}, extra || {}),
			defml = e.readStyle('marginLeft', true),
			defmt = e.readStyle('marginTop', true),
			ml,
			mt,
			prop;

		if (defml === 'auto') {
			defml = el.offsetLeft;
		}
		if (defmt === 'auto') {
			defmt = el.offsetTop;
		}
		ml = (opt.mode.indexOf('w') !== -1)
				? (opt.dest === 'center')
					? -(opt.width / 2 - w / 2)
							: (opt.dest === 'left')
							? -(opt.width - w)
									: 0
										: 0;
		mt = (opt.mode.indexOf('h') !== -1)
				? (opt.dest === 'center')
						? -(opt.height / 2 - h / 2)
								: (opt.dest === 'left')
								? -(opt.height - h)
										: 0
											: 0;
		prop = (opt.mode === 'w')
					? { width : opt.width, marginLeft : ml - defml }
					: (opt.mode === 'h')
						? { height : opt.height, marginTop : mt - defmt }
							: {
								width : opt.width,
								marginLeft : ml - defml,
								height : opt.height,
								marginTop : mt - defmt
								};
		return new Animation(e, prop, opt);
	};

	/**
	 * Animation.move : 要素移動
	 */
	Animation.move = function(elm, extra) {
		var e = DOM(elm),
			ee = e.get(),
			defml = e.readStyle('marginLeft', true),
			defmt = e.readStyle('marginTop', true),
			opt = union({
				left : 0,
				top : 0,
				speed : 40,
				easing : 0,
				callback : null
			}, extra || {}),
			prop = {};

		if (defml === 'auto') {
			defml = ee.offsetLeft;
		}
		if (defmt === 'auto') {
			defmt = ee.offsetTop;
		}		

		prop.marginLeft = defml + opt.left;
		prop.marginTop = defmt + opt.top;

		return new Animation(e, prop, opt);
	};

	/**
	 * Animation.blindDown : ブラインドダウン
	 */
	Animation.blindDown = function(elm, extra) {
		var e = DOM(elm),
			ee = e.get(),
			dim = e.defaultSize(),
			prop = {},
			opt = union({
				mode : 'y',
				speed : 40,
				easing : 0,
				from : 0,
				callback : null
			}, extra || {});

		if (opt.mode.indexOf('x') !== -1) {
			prop.width = opt.width || dim.width;
		}
		if (opt.mode.indexOf('y') !== -1) {
			prop.height = opt.height || dim.height;
		}
		ee.style.overflow = 'hidden';
		ee.style.height = opt.from + 'px';

		return new Animation(e, prop, opt);
	};

	/**
	 * Animation.blindUp : ブラインドアップ
	 */
	Animation.blindUp = function(elm, extra) {
		var e = DOM(elm),
			ee = e.get(),
			prop = {},
			opt = union({
				mode : 'y',
				to : 1,
				speed : 40,
				easing : 0,
				callback : null
			}, extra || {});

		if (opt.mode.indexOf('x') !== -1) {
			prop.width = opt.to;
		}
		if (opt.mode.indexOf('y') !== -1) {
			prop.height = opt.to;
		}
		ee.style.overflow = 'hidden';

		return new Animation(e, prop, opt);
	};

	/**
	 * Animation.centerize : 要素を中央に移動
	 */
	Animation.centerize = function(elm, extra) {
		var e = DOM(elm),
			ee = e.get(),
			dim = e.absDimension(),
			prop = {},
			opt = union({
				speed : 40,
				easing : 0,
				offsetX : 0,
				offsetY : 0,
				callback : null
			}, extra || {}),
			pos = e.readStyle('position'),
			p = ut.getCenterPosition((pos === 'fixed') ? false : true);

		if (opt.targetWidth) {
			prop.width = opt.targetWidth;
			prop.marginLeft = mr(p.x - opt.targetWidth / 2) - dim.left + e.readStyle('marginLeft', true) - (opt.offsetX || 0);
		} else {
			//prop.marginLeft = mr(p.x - dim.width / 2) - dim.left + e.readStyle('marginLeft', true) - (opt.offsetX || 0);
		}
		if (opt.targetHeight) {
			prop.height = opt.targetHeight;
			prop.marginTop = mr(p.y - opt.targetHeight / 2) - dim.top + e.readStyle('marginTop', true) - (opt.offsetY || 0);
		} else {
			//prop.marginTop = mr(p.y - dim.height / 2) - dim.top + e.readStyle('marginTop', true) - (opt.offsetY || 0);
		}

		return new Animation(e, prop, opt);
	};

	Animation.toString = function() {
		return '[ Module Animation ]';
	};
	// <-- Animation

	/**
	 * Connection Module
	 * 別window、または別フレームからコアへアクセス
	 * @note 一時的にコネクションを貼るだけなので、connectのあとはdisConnectでコネクションを閉じてください
	 */
	(function() {
		var _tmpWindow,
			_tmpDocumentl,
			_tmpBody,
			_tmpHead;

		function __connect(w) {
			_tmpWindow = win;
			_tmpDocument = doc;
			_tmpHead = head;
			_tmpBody = body;
			win = w;
			doc = w.document;
			head = doc.head || doc.getElementsByTagName('head')[0];
			body = doc.body;
		}

		function __disConnect() {
			win = _tmpWindow;
			doc = _tmpDocument;
			head = _tmpHead;
			body = _tmpBody;
		}

		connect = __connect;
		disConnect = __disConnect;
	})();

	ignite();

})(
	(new Date()).getTime(),
	document,
	this,
	location,
	navigator.userAgent.toLowerCase()
) : (function() {
	throw new Error('Undefined Configure Object!');
})();
