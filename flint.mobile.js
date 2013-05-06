/* ========================================================================
 * @license The MIT License
 *
 *    http://www.opensource.org/licenses/mit-license.php
 * @author  Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * @copyright Neo,Inc <http://neo-navi.net/>
 * @version    ,v 0.5.1
 * ========================================================================
 */


(Object.prototype.toString.call(FL_CONFIG) === '[object Object]') ?
(function(initTime, win, LOC, UA) {

	// 重複ロード禁止
	if (win.getInstance) {
		return;
	}

	// =================== このスコープで使う変数定義 ========================== /
	// SYSTEM : システム内部で保持するデータやフラグ
	var SYSTEM = {
		INITIAL_TIME       : initTime,
		DOM_CREATE_TIME    : 0,
		WINDOW_LOADED_TIME : 0,
		SSL_CONNECT        : (LOC.protocol === 'https:'),
		GLOBAL_EVAL        : win.eval,
		CONTROLLER         : null,
		CONTROLLER_NAME    : '',
		EXEC_METHOD        : null,
		METHOD_ARGUMENTS   : {},
		WINDOW_LOADED      : false,
		START_CONTROLLER   : null,
		BENCH_MARKS        : {},
		DOM_LOADED         : false,
		CURRENT_ZINDEX     : 1,
		XHR_RESPONSES      : {
		                       READY_STATE : {
		                                      1 : 'LOADING',
		                                      2 : 'LOADED',
		                                      3 : 'INTERACTIVE',
		                                      4 : 'COMPLETED'
		                                      },
		                       STATUS      : {
		                                      403 : 'PERMISSION ERROR',
		                                      404 : 'NOT FOUND',
		                                      500 : 'SERVER ERROR',
		                                      503 : 'INTERNAL SERVER ERROR',
		                                      200 : 'OK',
		                                      999 : 'UNDEFINED'
		                                      }
		}
	},
	// STACK : 拡張xElementやxNodeList、イベントハンドラーを保持
	STACK = {
		LOADED_CORE_CLASSES : {},
		ELEMENTS            : {},
		EVENT_HANDLERS      : [],
		LOADED_FUNCS        : [],
		DOM_LOADED_FUNCS    : [],
		INSTANCED_API       : {},
		CONFIG              : {},
		GLOBAL_LAYER        : null,
		CAMELED_PROP        : {},
		DECAMELED_PROP      : {},
		API_STACK           : [],
		CSS_STACK           : [],
		API_READY           : {},
		MODULE_READY        : {},
		API_READY_FUNC      : {},
		MODULE_READY_FUNC   : {},
		BENCH_MARKS         : {},
		AJAX_EVENTS         : [],
		AJAX_QUEUE          : [],
		DEFFERD             : {}
	},
	doc         = win.document,
	// 内部取り込み用CONFIGオブジェクト
	CORE_CONFIG = {},
	// ループ用変数
	I,
	// 拡張エレメントインデックスID
	EXID        = 0,
	// 検索回避ID
	ignoreID    = 0,
	// 状態管理ID
	DEFFERD_ID  = 0,
	// ========================= グローバルメソッド等のalias ============== /
	head           = doc.head || doc.getElementsByTagName('head')[0],
	html           = doc.documentElement || doc.getElementsByTagName('html')[0],
	body,
	pi             = win.parseInt,
	pf             = win.parseFloat,
	mr             = Math.round,
	abs            = Math.abs,
	sin            = Math.sin,
	cos            = Math.cos,
	mp             = Math.pow,
	enc            = win.encodeURIComponent,
	dec            = win.decodeURIComponent,
	delay          = win.setTimeout,
	interval       = win.setInterval,
	unInterval     = win.clearInterval,
	indexReg       = /index\.php\/?/,
	MODULES        = {},
	COMPUTED_STYLE = (doc.defaultView && doc.defaultView.getComputedStyle)
						? doc.defaultView.getComputedStyle
						: null,
	OPST = Object.prototype.toString,
	SSLURI,
	SITEURI,
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
	ClassMap,
	// インライン要素マッピング用文字列
	INLINE_ELEMENTS = 'span,em,strong,dfn,cide,abbr,acronym,q,sub,sup,br,a,img,input,select,textarea,label',
	BLOCK_ELEMENTS  = 'div,h1,h2,h3,h4,h5,h6,address,blockquote,p,pre,ul,li,ol,dl,table,hr,form,fieldset',
	CSS_BG_REG      = /^url\s?\(/,
	CoreTimer,
	// 内部タイマーインターバル
	INTERVAL_FPS,
	// 数値CSSマッピング
	NUMERIC_CSS     = 'opacity,zIndex',
	EXT = '.js',
	// touchイベントマッピング
	SP_EVENTS = {
		click     : 'touchend',
		mousedown : 'touchstart',
		mousemove : 'touchmove',
		mouseup   : 'touchend',
		rotate    : 'orientationchange', // alias
		gs        : 'gesturestart',      // alias
		ge        : 'gestureend',        // alias
		gc        : 'gesturechange'      // alias
	},
	SP_ORIGINAL_EVENTS = {};
	
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
	if ( ! CORE_CONFIG.siteUrl ) {
		(function() {
			var sc  = head.getElementsByTagName('script'),
				i   = -1,
				reg = /flint.*\.js$/,
				ap  = CORE_CONFIG.scriptPath;

			while( sc[++i] ) {
				if ( reg.test(sc[i].src) ) {
					CORE_CONFIG.siteUrl = sc[i].src.substring(0, sc[i].src.lastIndexOf(ap + 'flint'));
					break;
				}
			}
		})();
	}
	// sslの場合も同様に
	if ( ! CORE_CONFIG.ssl_siteUrl ) {
		CORE_CONFIG.ssl_siteUrl = CORE_CONFIG.siteUrl.replace('https?', 'https');
//		(function() {
//			var sc = head.getElementsByTagName('script'),
//			    i = -1,
//			    reg = /flint.*\.js$/,
//			    ap = CORE_CONFIG.scriptPath;
//
//			while( sc[++i] ) {
//				if ( reg.test(sc[i].src)) {
//					CORE_CONFIG.ssl_siteUrl = sc[i].src.substring(0, sc[i].src.lastIndexOf(ap + 'flint'));
//					break;
//				}
//			}
//		})();
	}

	// フック取り込み
	if ( win.Hook && typeof Hook === 'object' ) {
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
		if ( ! (function() {
			var cf = [],
				g,
				N,
				gn = CORE_CONFIG.globalNames;

			for ( N in gn ) {
				if ( win[gn[N]] ) {
					cf[cf.length] = g;
				}
			}
			return ( cf.length > 0 )
			       ? confirm('Namespace [' + cf.join(',') + ']' + 'is confrict!\nThis script keep running?')
			       : true;
		})() ) {
			return;
		}
	}

	// window.eval禁止チェック
	if ( CORE_CONFIG.disableEval === true ) {
		win.eval = function() {
			throw Error('Eval function has deleted by system.');
			return void(0);
		};
	}

	// プロトコルチェックと使用するURIの設定
	SITEURI = CORE_CONFIG.siteUrl.replace(indexReg, '');
	SSLURI  = ( CORE_CONFIG.ssl_siteUrl )
	           ? CORE_CONFIG.ssl_siteUrl.replace(indexReg, '')
	           : SITEURI;
	// 設定オブジェクトに追加
	CORE_CONFIG.BASE_URL = (SYSTEM.SSL_CONNECT) ? SSLURI : SITEURI;
	CORE_CONFIG.SITE_URL = CORE_CONFIG[(SYSTEM.SSL_CONNECT) ? 'ssl_siteUrl' : 'siteUrl'];
	CORE_CONFIG.APPPATH  = CORE_CONFIG.BASE_URL + CORE_CONFIG.scriptPath;

	// SITE_URLの末尾に/がなければ付加する
	if ( ! /.+\/$/.test(CORE_CONFIG.SITE_URL) ) {
		CORE_CONFIG.SITE_URL += '/';
	}

	// ====================- コアクラスマッピング ================== /

	ClassMap = {
		UserAgent   : UserAgent,
		Loader      : Loader,
		Utility     : Utility,
		Router      : Router,
		Config      : Config,
		Event       : Event,
		AjaxInit    : AjaxInit,
		FL_Image    : FL_Image,
		BenchMark   : BenchMark,
		CreateClass : CreateClass,
		Extends     : Extends,
		Enables     : Enables,
		Language    : Language,
		Hook        : Hook,
		URI         : URI,
		//Json : Json,
		Input       : Input,
		CustomEvent : CustomEvent
	};

	ua      = loadClass('UserAgent');
	enables = loadClass('Enables');
	
	// スタートアップ
	function ignite() {
		var UT, CFG, RTR, URI, HOOK, UA, BM, LANG, LOADER, INPUT,
			Class, Method,
			// method alias
			ael = 'addEventListener',
			rel = 'removeEventListener',
			dn,
			ss,
			G = CORE_CONFIG.globalNames;
		
		_registCustomEvent();

		ut = loadClass('Utility');
		BM = loadClass('BenchMark');

		HOOK = loadClass('Hook');

		HOOK._callHook('preSystem');

		CFG = loadClass('Config');
		URI = loadClass('URI');
		RTR = loadClass('Router');

		// Output Class is No Use.

		LANG   = loadClass('Language');
		INPUT  = loadClass('Input');
		LOADER = loadClass('Loader');
		
		// =============== Base Startup Section =====================
		
		Controller = Base = new _Controller();
		Model      = new _Model();
		
		// 設定に基づいてグローバルスコープにaliasを貼る
		win.ClassExtend = function(ex, base) {
			new Extends(ex, base);
		};
		win.getInstance = function() {
			return SYSTEM.CONTROLLER || Controller;
		};
		
		alias('Class', loadClass('CreateClass'));
		alias(G.DOM, DOM);
		alias(G.Animation, Animation);
		alias(G.Module, Module);
		if ( G.Helper !== '' ) {
			win[G.Helper] = {};
		}
		
		// autoload start!
		Controller.load._fl_autoLoader();
		
		if ( CORE_CONFIG.routingMode === 'segment'
				|| CORE_CONFIG.routingMode === 'config' ) {
			Controller.__load(CFG.appPath() + 'controllers/' + RTR.fetchDirectory() + RTR.fetchClass() + EXT);
		} else {
			win[G.Controller] = Controller;
		}

		win[ael]('load', Base.event.__execLoad, false);
		win[ael]('unload', ut.cleanEvElm, false);

		// DOM ready監視
		doc[ael]('DOMContentLoaded', Base.event.__execDOM, false);
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

		for ( i in ride ) {
			if ( !isP || ! /^_/.test(i) ) {
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
		if ( ats ) {
			if ( att ) {
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

		if ( ! ClassMap[ClassName] ) {
			throw Error(ClassName + ' class is not defined');
			return;
		}
		if ( ! LCC[ClassName] ) {
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
			fn = function() {
					listener.call(SYSTEM.CONTROLLER || Controller);
				};

		if ( typeof type === 'string' ) {
			if ( ar[type] === true || typeof Controller[type] === 'object' ) {
				fn();
			} else if ( ut.isArray(arf[type]) ) {
				arf[type].push(fn);
			} else {
				arf[type] = [fn];
			}
		} else if (typeof type === 'function') {
			Base.event.set(doc, 'DOMReady', type);
		}
	}
	
	/**
	 * DefferdInit : FL_Defferd実行のClojure
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
				flag = true;

			if ( ! e ) {
				return false;
			}
			while( e && e !== html ) {
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
				flag = true;

			if ( ! e ) {
				return false;
			}
			while( e && e !== html ) {
				if ( e === current ) {
					flag = false;
					break;
				}
				e = e.parentNode;
			}
			return flag;
		});
		
		// Smartphone extra "tap" event
		SP_ORIGINAL_EVENTS.tap = function(target, listener, bind, once) {
			this.target   = target;
			this.listener = listener;
			this.context  = bind;
			this.isOnce   = once;
			this.step     = 1;
			
			this.construct();
		};
		
		SP_ORIGINAL_EVENTS.tap.prototype = {
			construct : function() {
				if ( ! this.target.addEventListener ) {
					return;
				}
				
				this.target.addEventListener('touchstart', this, false);
				this.target.addEventListener('touchend',   this, false);
			},
			handleEvent : function(event) {
				event.preventDefault();
				var ev = event.touches[0],
					ce;
				
				switch ( event.type ) {
				case 'touchstart':
					if ( this.step < 2 ) {
						this.step = 1;
						return;
					}
					this.step++;
					break;
				case 'touchend':
					if ( this.step === 2 ) {
						this.step = 1;
						return;
					}
					ce = doc.createEvent('Events');
					ce.initEvent('tap', true, true);
					ce.dataType = 'touch';
					ce.data     = null;
					this.listener.call(this.context, ev);
					if ( this.isOnce ) {
						this.target.removeEventListener('touchstart', this);
					//	this.target.removeEventListener('touchmove',  this);
						this.target.removeEventListener('touchend',   this);
					}
					this.step = 1;
				}
			}
		};
		
		// Smartphone extra "flick" event
		SP_ORIGINAL_EVENTS.flick = function(target, listener, bind, once) {
			this.target   = target;
			this.listener = listener;
			this.context  = bind;
			this.isOnce   = once;
			this.step     = 1;
			this.init     = { x : 0, y : 0 };
			this.diff     = { x : 0, y : 0 };
			
			this.construct();
		};
		
		SP_ORIGINAL_EVENTS.flick.prototype = {
			construct : function() {
				if ( ! this.target.addEventListener ) {
					return;
				}
				
				this.target.addEventListener('touchstart', this, false);
				this.target.addEventListener('touchmove',  this, false);
				this.target.addEventListener('touchend',   this, false);
			},
			handleEvent : function(event) {
				event.stopPropagation();
				event.preventDefault();
				var ev = event.touches[0],
					ce,
					dest;
				
				switch ( event.type ) {
				case 'touchstart':
					if ( this.step !== 1 ) {
						this.step = 1;
						return;
					}
					this.step = 2;
					this.init = { x : ev.clientX, y : ev.clientY };
					break;
				case 'touchmove':
					if ( this.step !== 2 ) {
						this.step = 1;
						return;
					}
					this.diff = { x : ev.clientX - this.init.x, y : ev.clientY - this.init.y };
					break;
				case 'touchend':
					if ( this.step !== 2 ) {
						this.step = 1;
						return;
					}
					dest = (this.diff.x > 30) ? 'right'
					         : (this.diff.x < -30) ? 'left'
					         : (this.diff.y > 30) ? 'bottom'
					         : (this.diff.y < -30) ? 'top'
					          : false;
					if ( ! dest ) {
						this.step = 1;
						return;
						
					}
					ce = doc.createEvent('Events');
					ce.initEvent('flick', true, true);
					ce.dataType = 'touch';
					ce.data     = dest;
					this.listener.call(this.context, ce);
					if ( this.isOnce ) {
						this.target.removeEventListener('touchstart', this);
						this.target.removeEventListener('touchmove',  this);
						this.target.removeEventListener('touchend',   this);
					}
					this.step = 1;
				}
			}
		};
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
		var u    = UA,
			i    = -1,
			BS   = [],
			c    = doc.documentElement.className,
			DM   = doc.documentMode,
			lteV = 10,
			sfV,
			__flashVer,
			map;

		this.agent = UA;

		// aliasメソッド
		function parse(match, n, m) {
			return pf(match[n] + '.' + ((!m) ? 0 : match[m]));
		}
		function has(str) {
			return (u.indexOf(str) !== -1);
		}
		function set(prefix) {
			BS[++i] = prefix;
			return true;
		}
		this.Opera = !!win.opera && set('o');
		this.Firefox = this.gecko = has('gecko') && has('fox') && set('ff');
		this.webkit = has('webkit');
		this.Safari = has('safari') && has('applewebkit') > 0 && !has('chrome', u) && set('s');

		// レンダリングモード
		this.Standard = (doc.compatMode === 'CSS1Compat');

		// ブラウザバージョン
		this.FirefoxV = ( this.Firefox )
		                  ? pf(u.replace(/(.*?)firefox\/([0-9])\.([0-9])(.*?)/, '$2.$3'))
		                  : null;
		this.OperaV   = ( this.Opera )
		                  ? parse(u.match(/(.*?)opera[\/|\s]([0-9])\.([0-9])(.*?)/), 2, 3)
		                  : null;
		sfV           = ( this.Safari )
		                  ? u.replace(/(.*?)applewebkit\/([0-9]*?)\.(.*?)/, '$2').substring(0, 2)
		                  : null;
		this.SafariV  = ( sfV !== null )
		                  ? (pi(sfV, 10) > 52)
		                    ? u.replace(/(.*?)version\/([0-9])\.([0-9]).*/, '$2.$3') :
		                      (sfV == '41') ? '2.0' :
		                      (sfV == '31') ? '1.3' :
		                      (sfV == '12') ? '1.2' :
		                      (sfV == '10') ? '1.1' :
		                      (sfV == '85') ? '1.0' : '0'
		                    : null;

		this.iPod     = has('ipod');
		this.iPnone   = has('iphone');
		this.iPhone3G = this.iPhone && has('applewebkit/525');
		this.iPad     = has('ipad');
		this.Android  = has('android');

		__flashVer = (function() {
			var vn,
				m,
				pl,
				v   = [0, 0, 0],
				n   = navigator,
				mmt = 'application/x-shockwave-flash';

			if ( n.plugins && n.mimeTypes[mmt] ) {
				pl = n.mimeTypes[mmt].enabledPlugin;
				if ( pl && pl.description ) {
					m = pl.description.match(/([0-9]+)\.([0-9])\s?[a-zA-Z]([0-9]+)$/);
					v = [m[1], m[2], m[3]];
				}
			}
			return v;
		})();
		
		this.toString = function() {
			return '[ Class UserAgent ]';
		};

		this.flashVer      = __flashVer.join('.');
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
				
				if ( ! name ) {
					return {
						Controller : (CORE_CONFIG.routingMode === 'segment') ? '' : G.Controller,
						DOM        : G.DOM,
						Animation  : G.Animation,
						Helper     : (G.helper === '') ? win : G.Helper,
						Module     : (G.Module === '') ? win : G.Module
					};
				} else {
					if (G.hasOwnProperty(name)) {
						return (name === 'Helper')
						         ? (G[name] != '') ? win[G[name]] : win
					            : win[G[name]];
					}
				}
			},
			toString : function() {
				return '[ Class Config ]';
			}
		};
	// <-- Config =============================================================================


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
				this.hash       = ( hp !== -1 ) ? URL.slice(hp) : '#';
				this.search     = ( sp !== -1 ) ? URL.slice(sp + 1) : '';
				this.uri        = URL.replace(this.hash, '').replace('?' + this.search, '');
				this._uriString = this.uri.replace(CORE_CONFIG.SITE_URL);
			
				// parse to Object-Array
				acu        = this._uriString.replace(/index\.php\/?/, '');
				splitUri   = acu.split('/');
				segmentLen = splitUri.length;
				
				for (; ii < segmentLen; ii++) {
					uriO[ii + 1] = uriA[uriA.length] = splitUri[ii];
				}
				this.uriObj   = uriO;
				this.uriArray = uriA;
			},
			// ハッシュ値取得
			getHash : function(withHash) {
				return (withHash) ? this.hash : this.hash.slice(1);
			},
			// セグメントデータを配列で取得
			segmentArray : function() {
				var u   = this.uriArray,
					len = u.length,
					i   = 0,
					ret = [''];
				
				for (; i < len; ++i ) {
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
				var ret = ( typeof def === 'undefined' ) ? undefined : def;
				
				return this.uriArray[this.uriArray.length - 1] || ret;
			},
			// スラッシュ付きセグメントの取得
			slashSegment : function(num, slash) {
				var u     = this.uriArray,
					sh     = slash || '',
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
					i  = -1;
				
				while( sp[++i] ) {
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
						ret      = {},
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

				if ( e.style.position === 'fixed' ) { // case position : fixed
					t = e.style.top;
					l = e.style.left;

					// top
					if ( t == 'auto' || t == '' ) {
						t = e.offsetTop;
					} else if ( t.indexOf('%') > -1 ) {
						t = mr(screen.availHeight * pi(t) / 100);
					} else {
						t = pi(t);
					}
					// left
					if ( l == 'auto' || l == '' ) {
						l = e.offsetLeft;
					} else if ( l.indexOf('%') > -1 ) {
						l = mr(screen.availHeight * pi(l) / 100);
					} else {
						l = pi(l);
					}
					return { x : l, y : t };
				}

				if ( e.getBoundingClientRect ) { // IE6+
					p  = e.getBoundingClientRect();
					sc = this.getScrollPosition();
					return { x : mr(p.left + sc.x), y : mr(p.top + sc.y) };
				} else {
					// getBoundingClientRectが未サポートの場合、手動で絶対位置を計算
					p = { x : 0, y : 0 };
				}
				function getStyle (elm, cameledProp, prop) {
					if (COMPUTED_STYLE) {
						nowStyle = COMPUTED_STYLE(elm, '');
						return nowStyle.getPropertyValue(prop);
					}
					return 0;
				};
				while (e) {
					p.x += e.offsetLeft;
					p.y += e.offsetTop;
					e = e.offsetParent;
				}
				if ( ua.Firefox ) {
					p.x += 2 * (pi(getStyle(body, 'borderLeftWidth', 'border-left-width'), 10) || 0);
					p.y += 2 * (pi(getStyle(body, 'borderTopWidth', 'border-top-width'), 10) || 0);
				}
				return p;
			},
			// getScrollPosition - 現在のスクロール量を取得
			getScrollPosition : function() {
				var b = body,
					h = html;

				return {
					x : b.scrollLeft || h.scrollLeft || 0,
					y : b.scrollTop || h.scrollTop || 0
				};
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
				var b = doc.body;

				return {
					width : win.innerWidth,
					height : win.innerHeight
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

				if ( isNaN(val) ) {
					return 0;
				}
				d.style.visibility = 'hidden';
				d.style.position   = 'absolute';
				d.style.top        = '0px';
				d.style.left       = '0px';
				doc.body.appendChild(d);
				d.style.width      = '10pt';
				ret.pt             = d.offsetWidth / 10;
				d.style.width      = '10em';
				ret.em             = d.offsetWidth / 10;
				doc.body.removeChild(d);
				d                  = null;
				return  ( unit.indexOf('em') !== -1 ) ? ret.em * val
				          : ( unit.indexOf('pt') !== -1 ) ? ret.pt * val
				          : val;
			},
			// getTextSize - テキストを表示させた時の幅を取得する
			getTextSize : function(txt, additional) {
				var d = doc.createElement('span'),
					res = {};

				d.style.fontSize   = additional || 'inherit';
				d.style.width      = 'auto';
				d.style.visibility = 'hidden';
				d.appendChild(doc.createTextNode(txt));
				doc.body.appendChild(d);
				res.width          = d.offsetWidth;
				res.height         = d.ofsetHeight;
				doc.body.removeChild(d);
				d                  = null;
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
				return (this.__is(o) === false && typeof o == 'object' && OPST.call(o) === '[object Array]');
			},
			// isObject - Objectオブジェクトであるかを判定
			isObject : function(o) {
				return (this.__is(o) === false && typeof o == 'object' && OPST.call(o) === '[object Object]');
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
					chStack = {}, ch = false,
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
							chName = ut.grep(e.name, '[]') ? e.name.replace('[]', '') : e.name;
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
						if (!c.isPrototypeOf(chStack)) {
							res[c] = chStack[c];
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
				return res;
			},
			// trim - 前後の空白文字をカット
			trim : String.trim || function(str) {
				return str.replace(/^\s|\s$/g, '');
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
				var i = 0,
					len = ary.length;
				
				for ( ; i < len; ++i ) {
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
			toString : function(){
				return '[ Class Utility ]';
			}
		};
	// <-- Utility =============================================================================

	// Firefox on Event::offsetX, Event::offsetY
	if ( ua.Firefox && win.Event ) {
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
				} else if ( type in SP_EVENTS ) {
					type = SP_EVENTS[type];
				} else if ( SP_ORIGINAL_EVENTS[type] ) {
					new SP_ORIGINAL_EVENTS[type](target, listener, bind, once);
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
					del = 'removeEventListener';

				for (; i < len; i++) {
					if (c[i][0] === elm && c[i][1] === type && (!listener || c[i][2] === listener)) {
						if (elm[del]) {
							elm[del](type, c[i][3], false);
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
					dp = 'dispatchEvent';

				if (doc.createEvent){
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
				var re = 'removeEventListener';

				if (arr[0][re]) {
					arr[0][re](arr[1], arr[2], arr[4]);
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

				return function(event) {
					//var event = new Base.event.__margeDOM2Event(target, ev || win.event);
					
					if (isOnce === true) {
						Base.event.remove(target, type, lis);
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
						i = 0;

					if (elm.nodeType === 3) {
						elm = elm.parentNode;
					}
					for (; i < len; i++) {
						if (list[i] === elm) {
							if ( listener.call(bindObj || elm, ev) === false ) {
								ev.preventDefault();
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
					EH = STACK.EVENT_HANDLERS;

				if (target[ael]) {
					target[ael](type, wrap, capture);
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
					del = 'removeEventListener';

				for (; i < len; i++) {
					t = fns[i][0];
					e = fns[i][1];
					f = fns[i][2];
					if (!t || !e || !f) {
						continue;
					}
					if (t[del]) {
						t[del](e, f, fns[4]);
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
			 * __setCustomFlickEvent - スマートフォン用のフリックイベントバインド
			 * 
			 */
			__setCustomFlickEvent : function(target, listener, bind, once) {
				var that = this,
					control = new this.__flickEvent(target, listener, once);
				
				this.set(target, 'touchstart', control, false);
				this.set(target, 'touchmove', control, false);
				this.set(target, 'touchend', control, false);
			},
			/**
			 * __flickEvent - フリックイベントコントロールクラス
			 */
			__flickEvent : function(target, listener, bind, once) {
				this.target = target;
				this.listener = listener;
				this.bindObj = bind;
				this.isOnce = once || false;
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
					closure = this.__createCustomClosure(target, type, listener, CE.fn, bindObj, isOnce),
					stack = {target : target, type : type, closure : closure, listener : listener, isOnce : isOnce || false};
				
				if ( target[ael] ) {
					target[ael](CE.type, closure, false);
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
					S;
				
				while ( CES[--i] ) {
					S = CES[i];
					if ( S.target === target && ( !listener || (listener && S.listener === listener)) ) {
						if ( target[rel] ) {
							target[rel](CE.type, S.closure, false);
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
					this.__loadAPI(this.appPath + 'config/' + name + EXT);
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
					this.__loadAPI(this.appPath + 'helpers/' + loadName + EXT, loadName, 'h');
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
						this.__loadAPI(this.appPath + dir + name + EXT, name, type);
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
						this.__loadAPI(this.appPath + 'modules/' + name + EXT, name, 'm');
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
						this.__loadAPI(this.appPath + 'plugins/' + name + EXT, name, 'p');
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
				var path = ([this.appPath, 'languages/', (CORE_CONFIG.language || 'japanese'), EXT]).join('');

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
					obj.type = 'application/x-shockwave-flash';
					obj.data = mov;
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
					str[str.length] = 'type="application/x-shockwave-flash" data="', mov, '">';
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

				// Plugin
				// Prototype拡張を使う場合はロードスタックに追加
				if (C.useBuiltinClassExtend) {
					pls[pls.length] = 'prototype_extend';
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
				return new win.XMLHttpRequest();
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
					FJCB = 'FlintJSONPCallBack' + tmpSetJSONPTimeStamp,
					cfn = function(obj) {
						if (bindObj) {
							callback.call(bindObj, obj);
						} else {
							callback(obj);
						}
						try {
							delete win[FJCB];
						} catch(e) {
							win[FJCB] = undefined;
						} finally {
							head.removeChild(doc.getElementById('flintjsonpscript' + tmpSetJSONPTimeStamp));
						}
					};

				win[FJCB] = cfn;

				// create connect script element
				s = doc.createElement('script');
				s.type = 'text/javascript';
				s.src = this.__buildURL(url , FJCB, 'jsonp');
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
					xhr.onreadystatechange = function() {
						that.__loadedFunc(xhr, o, timer);
					};
				}
				xhr.send(param);
				o._defferd = DefferdState(this);

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
								o.error.call(o.bind, {status : xhr.Status});
							} else {
								o.error({status : xhr.Status});
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
					this._controllerName = this._conf.loadController || this._conf.defaultController;
					this._methodName = this._conf.execMethod || 'index';
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
				this.DOM = DOM;
				this.Module = Module;
				this.system = SYSTEM;
				this.Timer = Timer;
				this.json = win.JSON;
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
				this.json = win.JSON;
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
			return isSuccess;
		},
		isFailed : function() {
			return isFailed;
		},
		isAbort  : function() {
			return isAbort;
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
		} else if (elm.constructor === Array) { // JS Array
			while(++i) {
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

	DOM.getElementsBySelector = function(expr, base) {
		var root = base || doc,
			tmp = root.querySelectorAll(expr),
			len = tmp.length,
			i = 0,
			ind = -1,
			ret = [];
		
		for (; i < len; i++) {
			if (!tmp[i].__ignore) {
				ret[++ind] = tmp[i];
			}
		}
		return ret;
	};

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

				if (doc.createRange) {
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

				this.element.parentNode.replaceChild(this.element, t);
				return this;
			},

			/**
			 * replaceTo : 対象の要素に入れ替える
			 * @param mixed xElement or Element : 置換対象のエレメント
			 * @return this
			 */
			replaceTo : function(to) {
				var t = (to instanceof xElement) ? to.get() : to;

				t.parentNode.replaceChild(t, this.element);
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
				} else if ( this.element.form ) {
					return this.element.form;
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
				return p ? STACK.ELEMENTS[p.__exid] || new xElement(p, this) : null;
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
			 * isExpr : 与えられたCSSクエリで検索される要素群に含まれるかどうか
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
						return this;
					case 'float':
						p = 'cssFloat';
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

	INTERVAL_FPS = 1000/ 60;
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

		// <-- Layer

	MODULES.layer = Layer;

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
					e.addStyle(i, point + (cProp[i][2] === true ? '' : 'px'));
				}
			} else {
				for (i in cProp) {
					e.addStyle(i, cProp[i][0] + defs[i] + (cProp[i][2] === true ? '' : 'px'));
				}
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
		
		(opt.delay > 0) ? delay(function() {t.start(+new Date);}, opt.delay)
								: t.start(+new Date);
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
					? { width : opt.width, marginLeft : defml - ml }
					: (opt.mode === 'h')
						? { height : opt.height, marginTop : defmt - mt }
							: {
								width : opt.width,
								marginLeft : defml - ml,
								height : opt.height,
								marginTop : defmt - mt
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

	ignite();

})(
	(new Date()).getTime(),
	this,
	location,
	navigator.userAgent.toLowerCase()
	) :alert('Undefined Configure Object!');
