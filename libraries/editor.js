/**
 * Flint rich editor library ver 0.7
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 *
 * @note this library customized for Seezoo
 *  connect file manager API
 *  connect page manager API
 */


ClassExtend('Library', function editor() {

	// ============== initialize stack variables ============================= //

	// alias this object
	var FL = getInstance(), that = this, DOM = FL.DOM;

	// load editor css
	FL.load.css('fl_editor');
	FL.load.library('file_operator');
	FL.load.library('page_operator');

	// alias builtin function
	var pi = parseInt;

	// set flags
	var BOLD = false, UNDER_LINE = false, ALIGN_LEFT = false, ALIGN_CENTER = false, ALIGN_RIGHT = false, OL = false, UL = false,
		COLOR = '#000', FONT_SIZE = 3, ITALIC = false;

	// command stack
	var CMD = {}, UNDO_STACK = [], REDO_STACK = [];

	// canvas iframe document
	var doc = document, doc_c, win_c, body_c, ifr;

	// insert value target textarea and wrapper element;
	var target, frame;

	// current sub menu
	var subMenu;

	// current status
	var currentStyles, currentFamilies, currentFontSize;

	// default settings
	var opt, defaultOption = {width : 750, height : 360, emoji : false};

	// fontsize <=> CSS font-size table
	// key : HTML <font size="*">,  value : CSS font-size : *pt
	var fontTable = {
			1 : 8,
			2 : 10,
			3 : 12,
			4 : 14,
			5 : 18,
			6 : 24,
			7 : 36
	};

	// ColorPicker instances for fontcolor and bgcolor
	var fColorPicker, bColorPicker;

	// link, image inputbox
	var linkBox, imageBox;

	// table, object instance
	var ppTableConf, ppObjectConf;

	// menu html
	var menuHTML = [
	                  '<ul class="fl_editor_tool"', (FL.ua.IE6) ? ' style="overflow:visible;"' : '', '>',
	                  '<li class="fl_editor_tool_first"><a href="javascript:void(0)" id="sz_page_add" unselectable="on">ページリンク追加</a></li>',
	                  '<li><a href="javascript:void(0)" id="sz_file_add" unselectable="on">ファイルの追加</a></li>',
	                  '<li><a href="javascript:void(0)" id="sz_toggle_editor" unselectable="on">HTMLを直接編集</a></li>',
	                  ((FL.ua.is('I6|I7')) ?
	                  '<li class="fl_editor_tool_radius_close" style="position:absolute;right:-16px;background:url(' + FL.config.baseUrl() + 'js/fl_images/editor/editor_control.gif) top right no-repeat;">&nbsp;</li>'
	                     :
	                  '<li class="fl_editor_tool_radius_close">&nbsp;</li>'),
	                  '</ul>',
	                  '<ul class="fl_editor_menu">',
	                  '<li class="fl_list_frame"><span class="styles" id="fl_editor_styles" title="styles" unselectable="on">フォーマット</span><span class="arrow">&nbsp;</span>',
	                  '<ul class="fl_editor_style_list fl_editor_sub_menu"><li><span class="select" unselectable="on" title="p">標準[p]<em class="p" unselectable="on">&lt;p&gt;</em></span></li><li><span unselectable="on" title="h1">見出し[h1]<em>&lt;h1&gt;</em></span></li><li><span unselectable="on" title="h2">見出し[h2]<em>&lt;h2&gt;</em></span></li><li><span unselectable="on" title="h3">見出し[h3]<em>&lt;h3&gt;</em></span></li><li><span unselectable="on" title="h4">見出し[h4]<em>&lt;h4&gt;</em></span></li><li><span unselectable="on" title="h5">見出し[h5]<em>&lt;h5&gt;</em></span></li><li><span unselectable="on" title="h6">見出し[h6]<em>&lt;h6&gt;</em></span></li></ul>',
	                  '</li>',
	                  '<li class="fl_list_frame"><span class="family" id="fl_editor_family" title="font-family" unselectable="on">MS Pゴシック</span><span class="arrow">&nbsp;</span>',
	                  '<ul class="fl_editor_family_list fl_editor_sub_menu"><li><span unselectable="on" type="sans-serif" class="select">Pゴシック</span></li><li><span unselectable="on" type="serif">P明朝</span></li><li><span unselectable="on" type="Times New Roman">Times&nbsp;New&nbsp;Roman</span></li><li><span unselectable="on" type="Arial">Arial</span></li></ul>',
	                  '</li>',
	                  '<li class="fl_list_frame"><span class="fontsize" id="fl_editor_size" title="font-size" unselectable="on">12&nbsp;pt</span><span class="arrow">&nbsp;</span>',
	                  '<ul class="fl_editor_font_list fl_editor_sub_menu"><li><span unselectable="on" type="1">8pt</span></li><li><span class="select" unselectable="on" type="2">10pt</span></li><li><span unselectable="on" type="3">12pt</span></li><li><span unselectable="on" type="4">14pt</span></li><li><span unselectable="on" type="5">18pt</span></li><li><span unselectable="on" type="6">24pt</span></li><li><span unselectable="on" type="7">36pt</span></li></ul>',
	                  '</li>',
	                  '<li class="fl_list_frame"><span unselectable="on" class="etc_edit">挿入</span><span class="arrow">&nbsp;</span>',
	                  '<ul class="fl_editor_etc_list fl_editor_sub_menu"><li><span class="select" unselectable="on" title="hr">罫線<em class="hr" unselectable="on">&lt;hr&nbsp;/&gt;</em></span></li><li><span unselectable="on" title="table">表<em class="table">&lt;table&gt;</em></span></li><!--<li><span unselectable="on" title="object">動画<em class="object">&lt;object&gt;</em></span></li>--><li><span unselectable="on" title="del">打ち消し線<em class="del">&lt;del&gt;</em></span></li></ul>',
	                  '</li>',
	                  '<li class="frame"><span class="undo" title="undo" unselectable="on">&nbsp;</span></li>',
	                  '<li class="frame"><span class="redo" title="redo" unselectable="on">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="bold" title="bold">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="italic" title="italic">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="underline" title="underline">&nbsp;</span></li>',
	                  '<li class="frame fc"><span unselectable="on" class="fontcolor" id="fl_editor_color" title="fontcolor">&nbsp;</span><span class="state" id="sz_color_state" style="height:5px;font-size:0;top:16px;"></span></li>',
	                  '<li class="frame bc"><span unselectable="on" class="bgcolor" id="fl_editor_bgcolor" title="backgroundcolor">&nbsp;</span><span class="state colored" id="sz_color_state_bg" style="height:5px;font-size:0;top:16px;">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="linkto" id="fl_edtior_link" title="link">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="image" id="fl_edtior_image" title="image">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="orderedlist" title="ol">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="unorderedlist" title="ul">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="alignleft" title="align_left">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="aligncenter" title="align_center">&nbsp;</span></li>',
	                  '<li class="frame"><span unselectable="on" class="alignright" title="align_right">&nbsp;</span></li>',
	                  '<li class="frame"><span unselecrable="on" class="emoji" title="emoji">&nbsp;</span></li>',
	                  '</ul>'
	                ];

	// editor mode [rich or direct]
	var editorMode = 'rich';

	// emoji map
	var emojiMap = [
	                "f89f|晴れ", "f8a0|曇り", "f8a1|雨",
	                "f8a2|雪", "f8a3|雷", "f8a4|台風", "f8a5|霧",
	                "f8a6|小雨", "f8a7|牡牛座", "f8a8|牡牛座", "f8a9|双子座",
	                "f8aa|蟹座", "f8ab|獅子座", "f8ac|乙女座", "f8ad|天秤座",
	                "f8ae|蠍座", "f8af|射手座", "f8b0|山羊座", "f8b1|水瓶座",
	                "f8b2|魚座", "f8b3|スポーツ", "f8b4|野球", "f8b5|ゴルフ",
	                "f8b6|テニス", "f8b7|サッカー", "f8b8|スキー", "f8b9|バスケットボール",
	                "f8ba|モータースポーツ", "f8bb|ポケットベル", "f8bc|電車", "f8bd|地下鉄",
	                "f8be|新幹線", "f8bf|車（セダン）", "f8c0|車（ＲＶ）", "f8c1|バス",
	                "f8c2|船", "f8c3|飛行機", "f8c4|家", "f8c5|ビル",
	                "f8c6|郵便局", "f8c7|病院", "f8c8|銀行", "f8c9|ＡＴＭ",
	                "f8ca|ホテル", "f8cb|コンビニ", "f8cc|ガソリンスタンド", "f8cd|駐車場",
	                "f8ce|信号", "f8cf|トイレ", "f8d0|レストラン", "f8d1|喫茶店",
	                "f8d2|バー", "f8d3|ビール", "f8d4|ファーストフード", "f8d5|ブティック",
	                "f8d6|美容院", "f8d7|カラオケ", "f8d8|映画", "f8d9|右斜め上",
	                "f8da|遊園地", "f8db|音楽", "f8dc|アート", "f8dd|演劇",
	                "f8de|イベント", "f8df|チケット", "f8e0|喫煙", "f8e1|禁煙",
	                "f8e2|カメラ",  "f8e3|カバン", "f8e4|本", "f8e5|リボン",
	                "f8e6|プレゼント", "f8e7|バースデー", "f8e8|電話", "f8e9|携帯電話",
	                "f8ea|メモ", "f8eb|ＴＶ", "f8ec|ゲーム", "f8ed|ＣＤ",
	                "f8ee|ハート", "f8ef|スペード", "f8f0|ダイヤ", "f8f1|クラブ",
	                "f8f2|目", "f8f3|耳", "f8f4|手（グー）", "f8f5|手（チョキ）",
	                "f8f6|手（パー）", "f8f7|右斜め下", "f8f8|左斜め上", "f8f9|足",
	                "f8fa|くつ", "f8fb|眼鏡", "f8fc|車椅子", "f940|新月",
	                "f942|やや欠け月", "f943|半月", "f944|三日月", "f944|満月",
	                "f945|犬", "f946|猫", "f947|リゾート", "f948|クリスマス",
	                "f949|左斜め下", "f972|phone to", "f973|mail to", "f974|fax to",
	                "f975|iモード", "f976|iモード（枠付き）", "f977|メール", "f978|ドコモ提供",
	                "f979|ドコモポイント", "f97a|有料", "f97b|無料", "f97c|ID", "f97d|パスワード",
	                "f97d|次項有", "f980|クリア", "f981|サーチ（調べる）", "f982|ＮＥＷ", "f983|位置情報",
	                "f984|フリーダイヤル", "f985|シャープダイヤル", "f986|モバＱ", "f987|1",
	                "f988|2", "f989|3", "f98a|4", "f98b|5",
	                "f98c|6", "f98d|7", "f98e|8", "f98f|9",
	                "f990|0", "f9b0|決定", "f991|黒ハート", "f992|揺れるハート",
	                "f993|失恋", "f994|ハートたち", "f995|わーい", "f996|ちっ",
	                "f997|がく～", "f998|もうやだ～", "f999|ふらふら", "f99a|グッド",
	                "f99b|るんるん", "f99c|いい気分", "f99d|かわいい", "f99e|キスマーク",
	                "f99f|ぴかぴか", "f9a0|ひらめき", "f9a1|むかっ", "f9a2|パンチ",
	                "f9a3|爆弾", "f9a4|ムード", "f9a5|バッド", "f9a6|眠い",
	                "f9a7|exclamation", "f9a8|exclamation&question", "f9a9|exclamation×2", "f9aa|どんっ",
	                "f9ab|あせあせ", "f9ac|たらーっ（汗）", "f9ad|ダッシュ（走り出すさま）", "f9ae|ー（長音記号１）",
	                "f9af|ー（長音記号２）", "f950|カチンコ", "f951|ふくろ", "f952|ペン",
	                "f955|人影", "f956|いす", "f957|夜", "f95b|soon",
	                "f95c|on", "f95d|end", "f95e|時計", "f9b1|iアプリ",
	                "f9b2|iアプリ（枠付き）", "f9b3|Tシャツ（ボーダー）", "f9b4|がま口財布",
	                "f9b5|化粧", "f9b6|ジーンズ", "f9b7|スノボ", "f9b8|チャペル",
	                "f9b9|ドア", "f9ba|ドル袋", "f9bb|パソコン", "f9bc|ラブレター",
	                "f9bd|レンチ", "f9be|鉛筆", "f9bf|王冠", "f9c0|指輪",
	                "f9c1|砂時計", "f9c2|自転車", "f9c3|湯のみ", "f9c4|腕時計",
	                "f9c5|考えてる顔", "f9c6|ほっとした顔", "f9c7|冷や汗", "f9c8|冷や汗2",
	                "f9c9|ぷっくっくな顔", "f9ca|ボケーっとした顔", "f9cb|目がハート", "f9cc|指でOK",
	                "f9cd|あっかんべー", "f9ce|ウィンク", "f9cf|うれしい顔", "f9d0|がまん顔",
	                "f9d1|猫2", "f9d2|泣き顔", "f9d3|涙", "f9d4|NG",
	                "f9d5|クリップ", "f9d6|コピーライト", "f9d7|トレードマーク", "f9d8|走る人",
	                "f9d9|マル秘", "f9da|リサイクル", "f9db|レジスタードトレードマーク", "f9dc|危険・警告",
	                "f9dd|禁止", "f9de|空室・空席・空車", "f9df|合格マーク", "f9e0|満室・満席・満車",
	                "f9e1|矢印左右", "f9e2|矢印上下", "f9e3|学校", "f9e4|波",
	                "f9e5|富士山", "f9e6|クローバー", "f9e7|さくらんぼ", "f9e8|チューリップ",
	                "f9e9|バナナ", "f9ea|りんご", "f9eb|芽", "f9ec|もみじ",
	                "f9ed|桜", "f9ee|おにぎり", "f9ef|ショートケーキ", "f9f0|とっくり（おちょこ付き）",
	                "f9f1|どんぶり", "f9f2|パン", "f9f3|かたつむり", "f9f4|ひよこ",
	                "f9f5|ペンギン", "f9f6|魚", "f9f7|うまい！", "f9f8|ウッシッシ",
	                "f9f9|ウマ", "f9fa|ブタ", "f9fb|ワイングラス", "f9fc|げっそり"
	];

	/**
	 *  ============================================================
	 *            command, utility functions
	 *  ============================================================
	 */

	// execute command
	var execute = function (cmd, opt) {
		if (/(un|re)do/.test(cmd)) {
			try {
				doc_c.execCommand(cmd, false, opt);
			} catch(e) {}
		} else {
			doc_c.execCommand(cmd, false, opt);
		}
		if (!FL.ua.IE) { win_c.focus();}
		drawHTML();
	};

	// remove format
	var restore = function () {
		doc_c.execCommand('removeformat', false, false);
		for (var i in CMD) {
			if (CMD[i]) {
				if (CMD[i] === true) {
					doc_c.execCommand(i, false, false);
				} else {
					doc_c.execCommand(i, false, CMD[i]);
				}
			}
		}
	};

	// drawHTML
	var drawHTML = function () {
		var html = FL.ut.trim(doc_c.body.innerHTML);
		if (/^<br\s?\/?>\n?$/.test(html)) {
			target.setValue('');
		} else {
			target.setValue(format(html));
		}
	};

	// BOOKMARK
	var setSelection = function() {
		var r = new xRange(win_c);

		//alert(r.getParentQuery());
		if (!r.getText()) { return;}
		//r.setParent('div');
		//drawHTML();
	};

	var checkRange = function() {
		var r = new xRange(win_c);
		return !!r.getText();
	};

	// set variable
	var setVariable = function () {

		win_c = ifr.contentWindow;
		doc_c = ifr.contentDocument || ifr.contentWindow.document;

		doc_c.designMode = 'on';

		// set initialize
		if (!FL.ua.IE) {
			doc_c.body.innerHTML = target.getValue();
			FL.event.set(doc_c, 'keydown', keyBind);

			FL.event.set(doc_c, 'keyup', function(ev) {
				// if shiftKey is pushed, selection create
				if (ev.shiftKey) {
					setSelection();
				} else {
					drawHTML();
				}
			});
			FL.event.set(doc_c, 'mouseup', function() {
				setSelection();
			});
			win_c.focus();
		}
		if (FL.ua.IE) {
			// recognize <body> a few miliseconds[we defined 1 second]
			setTimeout(function() {
				if (!doc_c.body) {
					setTimeout(argumens.callee, 500);
				} else {
					doc_c.body.innerHTML = target.getValue();
					FL.event.set(doc_c, 'keydown', keyBind);

					FL.event.set(doc_c, 'keyup', function (ev) {
						drawHTML();
					});
					win_c.focus();

				}
			}, 500);
		}
		//setupMenu();
	};

	// set editor events
	var setEditor = function() {

	};

	// setup
	this.setUp = function(e, option) {
		opt = FL.union(defaultOption, option || {});
		target = DOM(e).addStyle({width : opt.width + 'px', height : opt.height + 'px', display : 'none', margin : 0, padding : 0});
		frame = target.wrap('div');
		ifr = doc.createElement('iframe');


		DOM(ifr).appendTo(target, 'before')
					.addStyle({width : opt.width - 2 + 'px', height : opt.height - 2 + 'px', border : 'solid 1px #ccc', borderTop : 'none', marginTop : '-2px', padding : 0, 'display' : 'block'});

		if (FL.ua.IE) {
			// IE use iframe.onreadystatechange instead of onload
			ifr.onreadystatechange = function() {
				if (ifr.readyState === 'complete') {
					setVariable();
					setupMenu(opt);
					ifr.onreadystatechange = null;
				}
			};
			ifr.src = FL.config.appPath() + 'index.html';
		} else {
			// other browser use onload simply.
			ifr.onload = function() {
				// diapatch once only
				ifr.onload = null;
				if ( FL.ua.Opera ) {
					// Opera recognize <iframe>.onload event.
					// But, need a few seconds until startup and designMode = 'on' completely...
					// So that, we try to delayed setup at 50 msec.
					setTimeout(function() {
						setVariable();
						setupMenu(opt);

					}, 50);
				} else {
					setVariable();
					setupMenu(opt);
				}
			};
			ifr.src = FL.config.appPath() + 'index.html';
		}
	};

	// menu setup
	var setupMenu = function (option) {
		var div = DOM.create('div', {'id' : 'fl_editor_controls'})
					.addStyle('width', opt.width + 'px'),
			emoji;

		// create submenu instances
		fColorPicker = new ColorPicker();
		bColorPicker = new ColorPicker();
		linkBox = new Inputer('link');
		imageBox = new Inputer('image');
		ppTableConf = new TableConf();
		ppObjectConf = new ObjectConf();

		div.html(menuHTML.join('\n')).appendTo(frame.first(), 'before');

		div.detect('ul.fl_editor_tool, ul.fl_editor_menu').foreach(function() {
				DOM(this).addStyle('width', (DOM(this).hasClass('fl_editor_tool') ? (opt.width - 16) : opt.width) + 'px');
			})
			.rollBack()
			.detect('li.frame').event('mouseover', hoverAction)
									.event('mouseout', unHoverAction)
			.rollBack()
			.detect('span').event('click', doCommand)
			.rollBack()
			.detect('span.styles, span.family, span.fontsize, span.etc_edit')
					.event('mouseover', hoverAction)
					.event('mouseout', unHoverAction)
					.event('click', displaySubMenu)
			.rollBack()
			.getOne('span.etc_edit').parent().append(ppTableConf.get())
			.rollBack().rollBack()
			.getOne('span.etc_edit').parent().append(ppObjectConf.get())
			.rollBack().rollBack()
			.getOne('li.fc').append(fColorPicker.get())
				.event('click', displayColorTableFC)
			.rollBack()
			.getOne('li.bc').append(bColorPicker.get())
				.event('click', displayColorTableBC)
			.rollBack()
			.getOne('span.linkto').parent().append(linkBox.get())
				.event('click', displayLinkBox)
			.rollBack().rollBack()
			.getOne('span.image').parent().append(imageBox.get())
				.event('click', displayImageBox);


		FL.event.set(doc, 'click', function (ev) {
			if (ev.target.tagName.toLowerCase() !== 'span') {
				if (subMenu) { subMenu.hide();}
			} else {
				var cl = ev.target.className;
				if (/styles|family|fontsize|etc_edit/.test(cl) === false) {
					if (subMenu) { subMenu.hide();}
				}
			}
			if (!fColorPicker.isHidden()) {
				if (ev.target.tagName.toLowerCase() !== 'div' || DOM(ev.target).parent().tag !== 'td') {
					fColorPicker.hide();
				}
			}
			if (!bColorPicker.isHidden()) {
				if (ev.target.tagName.toLowerCase() !== 'div' || DOM(ev.target).parent().tag !== 'td') {
					bColorPicker.hide();
				}
			}
			if (!linkBox.isHidden()) {linkBox.hide();}
			if (!imageBox.isHidden()) { imageBox.hide();}
		});

		// clear all sub menus
		FL.event.set(doc_c, 'click', function () {
			if (subMenu) { subMenu.hide();}
			if (!fColorPicker.isHidden()) {fColorPicker.hide();}
			if (!bColorPicker.isHidden()) {bColorPicker.hide();}
			if (!linkBox.isHidden()) { linkBox.hide();}
			if (!imageBox.isHidden()) { imageBox.hide();}
		});

		FL.event.set(doc_c, 'keydown', function (ev) {
			// not implement...
//			if (ev.keyCode == 9) {
//				ev.preventDefault();
//				if (ev.shifKey === true) {
//					that.outdent();
//				} else {
//					that.indent();
//				}
//			}
		});

		fColorPicker.get().detect('div').event('click', setFColor);
		bColorPicker.get().detect('div').event('click', setBGColor);

		DOM('ul.fl_editor_sub_menu span')
			.event('mouseover', hoverAction)
			.event('mouseout', unHoverAction)
			.event('click', setSelectSubMenu);

		// Seezoo専用API連携
		setSeezooAPI();

		// テスト実装：絵文字
		if ( option.emoji === true ) {
			emoji = new EmojiPicker();
			emoji.picker.appendTo(div);
			div.getOne('span.emoji')
				.event('click', emoji.toggle, emoji);
			emoji.picker.event('click', setEmoji);
		}


	};

	// editor_canvas keybind
	var keyBind = function (ev) {
		if (ev.keyCode == 90 && ev.ctrlKey === true) { // undo : ctrl + z
			ev.preventDefault();
			that.undo();
		} else if (ev.keyCode == 89 && ev.ctrlKey === true) { // redo : ctrl + y
			ev.preventDefault();
			that.redo();
		}
	};

	// mouseover menus
	var hoverAction = function (ev) {
		DOM(this).addClass('active');
	};

	// mouseoutt menus
	var unHoverAction = function (ev) {
		DOM(this).removeClass('active');
	};

	// set command
	var doCommand = function (ev) {
		//ev.preventDefault();
		var e = DOM(this);
		if (e.get().className === '') { return;}
		if (!that[e.readAttr('class')]) { return; }
		if (/bold|italic|underline/.test(e.readAttr) && checkRange() === false) { return;};
		that[e.readAttr('class')]();
	};

	// active menu
	var activeMenu = function (type, on) {
		//DOM.css('span.' + type).get(0)
		//	.parent()[(on) ? 'addClass' : 'removeClass']('selected');
	};

	// submenu show
	var displaySubMenu = function (ev) {
		if (subMenu) { subMenu.hide(); }
		subMenu = DOM(ev.target).parent().getOne('ul').show();
	};

	// set Selection
	var setSelectSubMenu = function (ev) {
		var type = DOM(this).parent().parent().readAttr('class'), range = new xRange(win_c);

		if (FL.ut.grep(type, 'style')) {
			if (currentStyles) { currentStyles.removeClass('select');}
			currentStyles = DOM(this).addClass('select');

			DOM(this).parent(3)
					.getOne('span.styles')
					.html(currentStyles.get().firstChild.nodeValue);

			range.setParent(currentStyles.readAttr('title'));
			drawHTML();
		} else if (FL.ut.grep(type, 'family')) {
			if (currentFamilies) { currentFamilies.removeClass('select');}
			currentFamilies = DOM(this).addClass('select');

			DOM(this).parent(3)
					.getOne('span.family')
					.html(currentFamilies.get().firstChild.nodeValue);

			that.fontFaceChange(currentFamilies.readAttr('type'));
		} else if (FL.ut.grep(type, 'font')) {
			if (currentFontSize) { currentFontSize.removeClass('select');}
			currentFontSize = DOM(this).addClass('select');

			DOM(this).parent(3)
					.getOne('span.fontsize')
					.html(currentFontSize.get().firstChild.nodeValue);

			that.fontSizeChange(currentFontSize.readAttr('type'));
		} else if (FL.ut.grep(type, 'etc')) {
			that.execListCommand(DOM(this).readAttr('title'));
		}
	};

	// show colorTables
	var displayColorTableBC = function (ev) {
		ev.stopPropagation();
		ev.preventDefault();
		if (!fColorPicker.isHidden()) { fColorPicker.hide();}
		bColorPicker.toggle();
	};

	var displayColorTableFC = function (ev) {
		ev.stopPropagation();
		ev.preventDefault();
		if (!bColorPicker.isHidden()) { bColorPicker.hide();}
		fColorPicker.toggle();
	};

	// show link, image box
	var displayLinkBox = function (ev) {
		ev.stopPropagation();
		ev.preventDefault();
		if (!imageBox.isHidden()) { imageBox.hide();}
		linkBox.show();
	};

	var displayImageBox = function (ev) {
		ev.stopPropagation();
		ev.preventDefault();
		if (!linkBox.isHidden()) { linkBox.hide();}
		imageBox.show();
	};

	// set font color or bg color
	var setFColor = function (ev) {
		ev.stopPropagation();
		var colorHex = DOM(ev.target).readAttr('title');

		DOM.id('sz_color_state').addStyle('backgroundColor', colorHex);
		that.fontColor(colorHex);
		fColorPicker.hide();
		drawHTML();
	};

	var setBGColor = function (ev) {
		ev.stopPropagation();
		var colorHex = DOM(ev.target).readAttr('title'),
			range = new xRange(win_c);

		DOM.id('sz_color_state_bg').addStyle('backgroundColor', colorHex);
		if (doc_c.body.innerHTML == '') { return; }
		range.setStyleParent('backgroundColor', colorHex);
		bColorPicker.hide();
		drawHTML();
	};

	var setEmoji = function(ev) {
		ev.stopPropagation();
		var e = DOM(ev.target),
			range = new xRange(win_c)

		if ( e.tag === 'img' ) {
			e = e.parent();
		}
		if ( e.tag !== 'li' || e.readAttr('emojiIndex') === null ) {
			return;
		}
		range.insertHTML('[m:' + e.readAttr('emojiIndex') + ']');
	};

	var toggleEditorMode = function() {

		if (editorMode === 'rich') {
			DOM(this).addClass('active').html('エディタに戻る');
			drawHTML();
			target.show();
			DOM('ul.fl_editor_menu').get(0).hide();
			ifr.style.display = 'none';
			DOM.id('sz_page_add').addClass('inactive');
			DOM.id('sz_file_add').addClass('inactive');
			editorMode = 'direct';
		} else if (editorMode === 'direct') {
			DOM(this).removeClass('active').html('HTMLを直接編集');
			doc_c.body.innerHTML = target.getValue();
			target.hide();
			DOM('ul.fl_editor_menu').get(0).show();
			ifr.style.display = 'block';
			DOM.id('sz_page_add').removeClass('inactive');
			DOM.id('sz_file_add').removeClass('inactive');
			editorMode = 'rich';
			win_c.focus();
		}
	};

	// SeezooJr API用ハンドラ
	var setSeezooAPI = function () {
		var target, handle, range, e, filePath,
			fn, pid, pp, fid, json;

		// page API handler
		var setPageCallback = function() {
			FL.event.exprdeLive('span.ttl', 'click');
			FL.event.exprLive('span.ttl', 'click', function(ev) {
				ev.preventDefault();
				e = DOM(ev.target); fn = arguments.callee; pid = e.readAttr('pid');

				FL.ajax.get('ajax/get_page/' + pid + '/' + FL.config.item('sz_token'), {
					success : function(resp) {
						//eval('var json=' + resp.responseText);
						json = FL.json.parse(resp.responseText);
//						if (json.page_path) {
//							pp = FL.config.siteUrl() + json.page_path;
//						} else {
//							pp = FL.config.siteUrl() + json.page_id;
//						}
						pp = json.page_path ? json.page_path : json.page_id;
//						if (json.page_path) {
//							pp = json.page_path;
//						} else {
//							pp = json.page_id;
//						}
						if (FL.ua.IE /*&& FL.ua.IEV < 9*/) {
							// Ajax -> pasteHTMLは何故かタイマー仕込まないと認識しないの。
							// 意味不明だよIEは。
							setTimeout(function() { range.setLinkParent(pp); }, 500);
						} else {
							that.createlink(pp);
						}
						FL.event.exprdeLive('span.sz_page_ttl', 'click', fn);
						handle.hide();
					}
				});
			});
		};

		// file add event
		DOM.id('sz_file_add').event('click', function () {
			if (editorMode === 'direct') { return; }
			range = new xRange(win_c);
			handle = Helper.createDOMWindow('画像の選択', '', 938, '85%', false, false);
			FL.ajax.get('ajax/get_files_image_dir/' + 1 + '/' + FL.config.item('sz_token'), {
				success : function(resp) {
					handle.setContent(resp.responseText);
					FL.file_operator.init(range, handle, 'editor');
				}
			});
		});

		// pagelink add event
		DOM.id('sz_page_add').event('click', function () {
			if (editorMode === 'direct') { return; }
			range = new xRange(win_c);
			handle = Helper.createDOMWindow('ページの選択', '', 700, 500);
			pid = 1;
			FL.ajax.get('ajax/get_sitemap/' + pid + '/' + FL.config.item('sz_token'), {
				success : function(resp) {
					handle.setContent(resp.responseText);
					if (!window.SZ_PO_INITED || window.SZ_PO_INITED === false) {
						FL.system.CONTROLLER.page_operator.init('block');
						window.SZ_PO_INITED = true;
					}
					setPageCallback();
				}
			});
		});

		// edit HTML directory
		DOM.id('sz_toggle_editor').event('click', toggleEditorMode);
	};



	/**
	 * ======================================================================
	 *
	 *  document.execCommand functions
	 *
	 *=======================================================================
	 */

	// bold  - selected range to bold
	this.bold = function () {
		this['__bold' + ((BOLD === false) ? 'On' : 'Off')]();
		BOLD = !BOLD;
	};

	this.__boldOn = function () {
		execute('bold', null);
		activeMenu('bold', true);
	};
	this.__boldOff = function () {
		execute('bold', null);
		activeMenu('bold', false);
	};

	// italic - selected range to italic
	this.italic = function () {
		this['__italic' + ((ITALIC === false) ? 'On' : 'Off')]();
		ITALIC = !ITALIC;
	};

	this.__italicOn = function () {
		execute('italic', null);
		activeMenu('italic', true);
	};
	this.__italicOff = function () {
		execute('italic', null);
		activeMenu('italic', false);
	};


	// unerline - selected ragne to underline
	this.underline = function () {
		this[ '__underLine' + ((UNDER_LINE === false) ? 'On' : 'Off')]();
		UNDER_LINE = !UNDER_LINE;
	};
	this.__underLineOn = function () {
		execute('underline', null);
		activeMenu('underline', true);
	};
	this.__underLineOff = function () {
		execute('underline', null);
		activeMenu('underline', false);
	};

	// fontSizeChange - selected range to change font-size
	this.fontSizeChange = function (size) {
		FONT_SIZE = size;
		execute('fontsize', FONT_SIZE);
	};

	// fontFaceChange - seleted range to chage font-face
	this.fontFaceChange = function (face) {
		execute('fontname', face);
	};

	// fontColor
	this.fontColor = function (color) {
		execute('forecolor', color);
	};

	// backgroundcolor
	this.bgColor = function (color) {
		execute('backcolor', color);
	};

	// createlink
	this.createlink = function (linkto) {
		win_c.focus();
		execute('createlink', linkto);
	};

	// insertimage
	this.insertimage = function (path) {
		win_c.focus();
		execute('insertimage', path);
	};

	// orderedList - create ordered list
	this.orderedlist = function () {
		this['__orderedList' + ((OL === false) ? 'On' : 'Off')]();
		OL = !OL;
	};
	this.__orderedListOn = function () {
		CMD['insertorderedlist'] = true;
		this.__margeToUL();
		execute('insertorderedlist', null);
		activeMenu('orderedlist', true);
	};
	this.__orderedListOff = function () {
		CMD['insertorderedlist'] = false;
		execute('insertorderedlist', null);
		activeMenu('orderedlist', false);
	};
	this.__margeToUL = function () {
		if (UL) { UL =!UL;}
		if (CMD['insertunorderedlist'] === true) {
			CMD['insertunorderedlist'] = false;
			activeMenu('unorderedlist', false);
		}
	};

	// unorderedList - creata unsigned list
	this.unorderedlist = function () {
		this['__unorderedList' + ((UL === false) ? 'On' : 'Off')]();
		UL =!UL;
	};
	this.__unorderedListOn = function () {
		CMD['insertunorderedlist'] = true;
		this.__margeToOL();
		execute('insertunorderedlist', false);
		activeMenu('unorderedlist', true);
	};
	this.__unorderedListOff = function () {
		CMD['insertunorderedlist'] = false;
		execute('insertunorderedlist', null);
		activeMenu('unorderedlist', true);
	};
	this.__margeToOL = function () {
		if (OL) { OL =!OL;}
		if (CMD['insertorderedlist'] === true) {
			CMD['insertorderedlist'] = false;
			activeMenu('orderedlist', false);
		}
	};


	// alignLeft- text align left
	this.alignleft = function () {
		this['__alignLeft' + ((ALIGN_LEFT === false) ? 'On' : 'Off')]();
		ALIGN_LEFT = !ALIGN_LEFT;
	};
	this.__alignLeftOn = function () {
		CMD['justifyleft'] = true;
		this.__margeAlign('left');
		execute('justifyleft', null);
		activeMenu('alignleft', true);
	};
	this.__alignLeftOff = function () {
		CMD['justifyleft'] = false;
		execute('justifyleft', null);
		activeMenu('alignleft', false);
	};

	// alignCenter- text align center
	this.aligncenter = function () {
		this['__alignCenter' + ((ALIGN_CENTER === false) ? 'On' : 'Off')]();
		ALIGN_CENTER = !ALIGN_CENTER;
	};
	this.__alignCenterOn = function () {
		CMD['justifycenter'] = true;
		this.__margeAlign('center');
		execute('justifycenter', null);
		activeMenu('aligncenter', true);
	};
	this.__alignCenterOff = function () {
		CMD['justifycenter'] = false;
		execute('justifycenter', null);
		activeMenu('aligncenter', false);
	};

	// alignRight- text align right
	this.alignright = function () {
		this['__alignRight' + ((ALIGN_RIGHT === false) ? 'On' : 'Off')]();
		ALIGN_RIGHT = !ALIGN_RIGHT;
	};
	this.__alignRightOn = function () {
		CMD['justifyright'] = true;
		this.__margeAlign('right');
		execute('justifyright', null);
		activeMenu('alignright', true);
	};
	this.__alignRightOff = function () {
		CMD['justifyright'] = false;
		execute('justifyright', null);
		activeMenu('alignright', false);
	};

	this.__margeAlign = function (type) {
		switch (type) {
		case 'left':
			ALIGN_RIGHT = false;
			ALIGN_CENTER = false;
			if (CMD['justifycenter'] === true) {
				CMD['justifycenter'] = false;
				activeMenu('aligncenter', false);
			}
			if (CMD['justifyright'] === true) {
				CMD['justifyright'] = false;
				activeMenu('alignright', false);
			}
			break;
		case 'center':
			ALIGN_RIGHT = false;
			ALIGN_LEFT = false;
			if (CMD['justifycenter'] === true) {
				CMD['justifycenter'] = false;
				activeMenu('aligncenter', false);
			}
			if (CMD['justifyleft'] === true) {
				CMD['justifyleft'] = false;
				activeMenu('alignleft', false);
			}
			break;
		case 'right':
			ALIGN_LEFT = false;
			ALIGN_CENTER = false;
			if (CMD['justifycenter'] === true) {
				CMD['justifycenter'] = false;
				activeMenu('aligncenter', false);
			}
			if (CMD['justifyleft'] === true) {
				CMD['justifyleft'] = false;
				activeMenu('alignleft', false);
			}
			break;
		}
	};

	// undo
	this.undo = function () {
		execute('undo', null);
		drawHTML();
	};

	// redo
	this.redo = function () {
		execute('redo', false);
		drawHTML();
	};

	// execute from list command
	this.execListCommand = function (type) {
		switch (type) {
		case 'hr' : // horizontal rule
			execute('inserthorizontalrule', null);
			break;
		case 'table' : // table
			ppTableConf.init();
			break;
		case 'object' : // object
			ppObjectConf.init();
			break;
		case 'del' : // strike
			execute('strikethrough', null);
			break;
		}
	};


	// ===================== tag formatter ================= //

	// base format
	var format = function (str) {
		return str;
		str = str.replace(/<strong.+?>/ig, '<span style="font-weight:bold">')
						.replace(/<u.+?>/ig, '<span style="text-decoration:underline">')
						.replace(/<font size="?([^"]+?)"?.+?>/ig, function (str, v) { return '<span style="font-size:' + fontTable[pi(v, 10)] + 'pt">';})
						.replace(/<\/strong>|<\/u>|<\/font>|<\/em>|<\/i>/ig, '</span>')
						//.replace(/\s?__eid="?[0-9]+"?/g, '')
						.replace(/<font\-face="?(.*?)"?.+?>/ig, '<span style="font-family:$1">')
						.replace(/<em>|<i>/ig, '<span style="font-style:italic">')
						.replace(/align="?([left|right|center|justify])"?/ig, function(str, v) {
							if (v === 'justify') {
								return (FL.ua.IE) ? 'style="text-jusity:distribute-all-line"' : 'style="text-align:justify"';
							} else {
								'style="text-align:' + v + '"';
							}
						})
						.replace(/<strike.+?>/ig, '<del>')
						.replace('/<\/strike>/ig', '</del>');
		return extraFormatter(str);
	};

	// clearance tag format for each Browser
	var extraFormatter = function (str) {
		str =  str.replace(/rgb\((\d+),\s?(\d+),\s?(\d+)\)/ig, function(s, v1, v2, v3) {
					return FL.ut.rgbToHex(s);
				});
		// extra <div> tag to <object>
//		var tmp = DOM.create('div').html(str), u, w, h, obj;
//
//		tmp.detect('div.object_conf').foreach(function() {
//			u = this.getAttribute('url'); w = this.getAttribute('vw'); h = this.getAttribute('vh');
//			obj = FL.load.swf(u, { width : w, height : h});
//			obj.appendTo(this, 'after');
//			DOM(this).remove();
//		});
		return str;
//		return tmp.getHTML();
	};


	// ====================== Range utility ==================== //


	function xRange(w) {
		try {
			if (w.getSelection && !FL.ua.IE) { // DOM RangeSupports
				this.range = w.getSelection().getRangeAt(0);
			} else { // IE TextRange
				this.range = w.document.selection.createRange();
			}
		} catch (e) {
			alert('選択範囲が指定されていないか、予期しないブラウザエラーの可能性があります。');
		}
		this.win = w;
		this.doc = w.document;
		return this;
	};

	// for DOM Range
	xRange.prototype = {
		getText : function () { return this.range.toString();},
		getParentQuery : function() {
			return this.__fallbackQuery(this.range.commonAncestorContainer);
		},
		__fallbackQuery : function(e /* native HTMLElement OR textNode */) {
			if (e === doc_c || e === win_c) {return '';} // document and window have not tagName
			if (e.nodeType === 3) { e = e.parentNode;}
			//else if (e.tagName === 'BODY') { return 'body';}
			var cl = e.className,
				c = (FL.ut.grep(cl, ' ')) ? cl.split(' ')[0] : cl,
						resQ = [e.tagName.toLowerCase() + ((c === '') ? '' : '.' + c)];

			while (e.parentNode !== doc_c) {
				e = e.parentNode;
				resQ.push(e.tagName.toLowerCase());
			}
			return resQ.reverse().join(' > ');
		},
		parentElement : function () {
			var n = this.range.commonAncestorContainer;
			if (n.nodeType === 3) {
				var p = doc_c.createElement('span');
				this.range.surroundContents(p);
				return p;
			} else {
				return n;
			}
		},
		setParent : function (tag) {
			try {
				var n = this.range.commonAncestorContainer,
					p;
				if (n.parentNode && n.parentNode.tagName === tag.toUpperCase()) {
					if ( ! n.parentNode.parentNode ) {
						return; // case BODY
					}
					p = n.parentNode;
					p.parentNode.insertBefore(
							doc_c.createTextNode(p.innerHTML),
							p
							);
					p.parentNode.removeChild(p);
					return;
				}
				var t = doc_c.createElement(tag);
				this.range.surroundContents(t);
			} catch(e) {

			}
			return;
			// case :TextNode
			if (n.nodeType === 3) {
				var p = n.parentNode;
				if (p.tagName === 'BODY') {
					var t = this.doc.createElement(tag);
					t.appendChild(n);
					p.appendChild(t);
				} else if (/H[1-6]/i.test(p.tagName)) {
					var h = doc_c.createElement(tag);
					while (p.childNodes.length > 0) {
						h.appendChild(p.firstChild);
					}
					DOM(h).appendTo(p, 'before');
					DOM(p).remove();
				} else {
					DOM(p).wrap(tag);
				}
			// case : parent is body
			} else if (n.tagName === 'BODY') {
				var h = this.doc.createElement(tag);
				while (n.childNodes.length > 0) {
					h.appendChild(n.firstChild);
				}
				n.appendChild(h);
			// case parent is heading tags
			} else if (/H[1-6]/i.test(n.tagName)) {
				var h = doc_c.createElement(tag);
				while (n.childNodes.length > 0) {
					h.appendChild(n.firstChild);
				}
				DOM(h).appendTo(n, 'before');
				DOM(n).remove();
			// case other elements
			} else {
				DOM(n).wrap(tag);
			}
		},
		setStyleParent : function (name, value) {
			var p = this.parentElement();
			if (p === doc_c.body) {
				try {
					var sp = doc_c.createElement('span');
					sp.style[name] = value;
					this.range.surroundContents(sp);
				} catch(e) {
					var frg = this.range.extractContents();
					var div = doc_c.createElement('div');
					div.appendChild(frg);
					for (var i = 0, len = div.childNodes.length; i < len; i++) {
						var s, n = div.childNodes[i];
						if (n.nodeType === 3) {
							s = doc_c.createElement('span');
							s.style[name] = value;
							s.innerHTML = n.nodeValue;
							div.insertBefore(s, n);
							div.removeChild(n);
						} else {
							n.style[name] = value;
						}
					}
					div.style.display = 'inline';
					this.range.insertNode(div);
				}
			} else {
				p.style[name] = value;
			}
		},
		insertHTML : function (html) {
			execute('insertHTML', html);
		},
		setImage : function(filePath) {
			that.insertimage(filePath);
		}
	};

	// for IE TextRange(overwrite)
	if (FL.ua.IE /*&& FL.ua.IEV < 9*/) {
		xRange.prototype = {
			getText : function() { return this.range.text();},
			parentElement : function () {
				return this.range.parentElement();
			},
			setParent : function (tag) {
				var n = this.range.parentElement(), h, p;

				if (n.tagName === tag.toUpperCase()) {
					if ( ! n.parentNode ) {
						return; // case BODY
					}
					p = n.parentNode;
					p.insertBefore(
							doc_c.createTextNode(n.innerHTML),
							n
							);
					p.removeChild(n);
					return;
				}
				this.range.pasteHTML('<' + tag + '>' + this.range.htmlText + '</' + tag + '>');
				return;
				var n = this.range.parentElement(), h;

				if (n.tagName === 'BODY') {
					h = this.doc.createElement(tag);
					while (n.childNodes.length > 0) {
						h.appendChild(n.firstChild);
					}
					n.appendChild(h);
				// case other elements
				} else if (/H[1-6]/.test(n.tagName)) {
					h = doc_c.createElement(tag);
					while (n.childNodes.length > 0) {
						h.appendChild(n.firstChild);
					}
					DOM(h).appendTo(n, 'before');
					DOM(n).remove();
				} else {
					DOM(n).wrap(tag);
				}
			},
			setStyleParent : function (name, value) {
				var tmp = doc_c.createElement('div'),
					spn = doc_c.createElement('span');

				spn.style[name] = value;
				tmp.appendChild(spn);
				spn.innerHTML = this.range.htmlText;
				this.range.pasteHTML(tmp.innerHTML);
			},
			setLinkParent : function (href) {
				if (!this.range) {
					doc_c.body.innerHTML += '<a href="' + href + '">' + href + '</a>';
				} else {
					var tmp = doc_c.createElement('div'),
						a = doc_c.createElement('a'),
						html = '';

					a.href = href;
					tmp.appendChild(a);

					//html = '<a href="' + href + '">' + (this.range.htmlText === '') ? href : this.range.htmlText + '</a>';
					a.innerHTML = (this.range.htmlText === '') ? href : this.range.htmlText;

					this.range.pasteHTML(tmp.innerHTML);
				}
				drawHTML();
			},
			setImage : function (path) {
				if (!this.range) {
					doc_c.body.innerHTML = doc_c.body.innerHTML + '<img src="' + path + '" alt="" />';
				} else {
					this.range.pasteHTML(this.range.htmlText+ '<img src="' + path + '" alt="" />');
				}
				drawHTML();
			},
			insertHTML : function (html) {
				this.range.pasteHTML(html);
			}
		};
	}

	// ====================== Emoji class ================================ //

	function EmojiPicker() {
		this.showFlag = false;
		this.picker   = DOM.create('div', {'class' : 'fl_editor_emojipicker'});
		this.close    = DOM.create('a', {'class' : 'fl_editor_emojipicker_close', 'href' : 'javascript:void(0)'})
		                .appendTo(this.picker);

		this.__construct();
	}

	EmojiPicker.prototype = {
		__construct : function() {
			var ul = DOM.create('ul', {'class' : 'fl_emoji_list'}),
				fragment = document.createDocumentFragment(),
				li,
				data,
				i = -1;

			while ( emojiMap[++i] ) {
				data = emojiMap[i].split('|');
				li   = DOM.create('li')
						.attr({
							emojiIndex : i + 1,
							unselectable : 'on',
							title : data[1]
						});
				DOM.create('img')
					.attr({
						src : FL.config.baseUrl() + 'images/emoji/' + data[0] + '.gif',
						alt : data[1],
						unselectable : 'on'
					})
					.appendTo(li);
				fragment.appendChild(li.get());
			}
			ul.get().appendChild(fragment);
			this.picker.append(ul);

			// close button event
			this.close.event('click', this.__closeHandle, this);
		},
		__closeHandle : function(ev) {
			ev.stopPropagation();
			this.hide();
		},
		hide : function() {
			this.picker.hide();
			this.showFlag = false;
		},
		show : function() {
			this.picker.show();
			this.showFlag = true;
		},
		toggle : function() {
			this.picker[this.showFlag ? 'hide' : 'show']();
			this.showFlag = !this.showFlag;
		}
	};

	// ====================== colorpicker class ========================== //

	function ColorPicker() {
		this.showFlag = false;
		this.picker = DOM.create('div', {'class' : 'fl_editor_colorpicker'});
		var colors = [
	              '<table class="colorpicker_base_grays">',
	              '<tbody>',
	              '<tr></tr>',
	              '</tbody>',
	              '</table>',
	              '<table class="colorpicker_base_vivids">',
	              '<tbody>',
	              '<tr></tr>',
	              '</tbody>',
	              '</table>',
	              '<table class="colorpicker_others">',
	              '<tbody>',
	              '</tbody>',
	              '</table>'
		            ];

		this.picker.html(colors.join('\n'));
		this.createColors();
	};

	ColorPicker.prototype = {
			createColors : function () {
				var grays = ['000000', '444444', '666666', '999999', 'cccccc', 'eeeeee', 'f3f3f3', 'ffffff'],
					vivids = ['ff0000', 'ff9900', 'ffff00', '00ff00', '00ffff', '0000ff', '9900ff', 'ff00ff'],
					others = [
				              ['f4cccc', 'fce5cd', 'fff2cc', 'd9ead3', 'd0e0e3', 'cfe2f3', 'd9d2e9', 'ead1dc'],
				              ['ea9999', 'f9cb9c', 'ffe599', 'b6d7a8', 'a2c4c9', '9fc5e8', 'b4a7d6', 'd5a6bb'],
				              ['e06666', 'f6b26b', 'ffd966', '93c47d', '76a5af', '6fa8dc', '8e7cc3', 'c27ba0'],
				              ['cc0000', 'e69138', 'f1c232', '6aa83f', '45818e', '3d85c6', '674ea7', 'a64d79'],
				              ['990000', 'b45f06', 'bf9000', '38761d', '134f5c', '0b5394', '351c75', '741b47'],
				              ['660000', '783f04', '7f6000', '274e13', '0c343d', '073763', '20124d', '4c1130']
				             ],
				i = 0, j = 0, k = 0, m = 0,
				glen = grays.length, vlen = vivids.length, olen = others.length, tr,
				g = this.picker.detect('tr').get(0, true), v = this.picker.detect('tr').get(1, true);

				for (i; i < glen; i++) {
					DOM.create('td').append('<div style="background-color:#' + grays[i] + '" title="#' + grays[i] + '" unselectable="on">&nbsp;</div>').appendTo(g);
				}
				for (j; j < vlen; j++) {
					DOM.create('td').append('<div style="background-color:#' + vivids[j] + '" title="#' + vivids[j] + '" unselectable="on"></div>').appendTo(v);
				}

				for (k; k < olen; k++) {
					tr = DOM.create('tr');
					for (m = 0; m < others[k].length; m++) {
						DOM.create('td').append('<div style="background-color:#' + others[k][m] + '" title="#' + others[k][m] + '" unselectable="on"></div>').appendTo(tr);
					}
					this.picker.getOne('table.colorpicker_others tbody').append(tr);
				}

				this.picker.detect('td div')
							.event('mouseover', this.setTarget, this)
							.event('mouseout', this.removeTarget, this);
			},
			setTarget : function (ev) {
				DOM(ev.target).addStyle({border : 'solid 1px #fff', 'width' : '14px', 'height' : '14px'});
			},
			removeTarget : function (ev) {
				DOM(ev.target).addStyle({border : 'none', 'width' : '16px', 'height' : '16px'});
			},
			show : function () {
				this.picker.show();
				this.showFlag = true;
			},
			hide : function () {
				this.picker.hide();
				this.showFlag = false;
			},
			toggle : function () {
				this[(this.showFlag === true) ? 'hide' : 'show']();
			},
			get : function () { return this.picker;},
			isHidden : function () { return !this.showFlag;}
	};

	// ================================ link image setter class =================================== //

	function Inputer(type) {
		this.box = DOM.create('div').addClass('fl_editor_inputer');
		this.showFlag = false;
		var html;

		if (type === 'link') {
			html = [
		            '<p>リンク先のURLを入力してください。</p>',
		            '<input type="text" class="fl_editor_input" value="" /><br />',
		            '<input type="button" value="セット" unselectable="on" />'
		            ];
		} else if (type === 'image') {
			html = [
	                '<p>画像パスを入力してください。</p>',
	                '<input type="text" class="fl_editor_input" value="" /><br />',
	                '<input type="button" value="セット" unselectable="on" />'
	            ];
		} else {
			throw TypeError('invalid type!');
			return;
		}
		this.box.append(html.join('\n'));
		this.type = type;
		this.init();
	};

	Inputer.prototype = {
		init : function () {
			// set add format
			FL.event.set(this.box.last(), 'click', this.viewControl, this);
			FL.event.set(this.box, 'click', function (ev) { ev.stopPropagation();});
		},
		setLink : function (ev) {
			ev && ev.stopPropagation();
			var val = this.box.getOne('input').getValue(),
			    r =  new xRange(win_c);

			if (!val || val === '') { return; }
			// Internet explorer blur canvas when other input focus.
			// So that use native execCommand instead of textRange
			if (FL.ua.IE /*&& FL.ua.IEV < 9*/) {
				this.stackRange.setLinkParent(val);
			// other Borwser selection is kept. use execCommand.
			} else if (!r || !r.getText()) {
				doc_c.body.innerHTML += '<a href="' + val + '">' + val + '</a>';
				drawHTML();
			} else {
				that.createlink(val);
			}
			this.hide();
		},
		setImage : function (ev) {
			ev && ev.stopPropagation();
			var val = this.box.getOne('input').getValue();
			if (!val || val === '') { return; }
			// Internet explorer blur canvas when other input focus.
			// So that use native execCommand instead of textRange
			if (FL.ua.IE) {
				this.stackRange.setImage(val);
			// other Borwser selection is kept. use execCommand.
			} else {
				that.insertimage(val);
			}
			this.hide();
		},
		viewControl : function (ev) {
			ev.stopPropagation();
			this[(this.type === 'link') ? 'setLink' : 'setImage']();
		},
		get : function () { return this.box;},
		show : function () {
			if (FL.ua.IE) {
				win_c.focus();
				this.stackRange = new xRange(win_c);
			}
			this.showFlag = true;
			this.box.show();
			this.box.detect('input').get(0, false).focus();
		},
		hide : function () {
			if (FL.ua.IE) {
				this.stackRange = null;
			}
 			this.showFlag = false;
			this.box.hide();
		},
		toggle : function () {
			this[(this.showFlag === true) ? 'hide' : 'show']();
		},
		isHidden : function () { return !this.showFlag;}
	};

	// ==================== table maker class ================================= //

	function TableConf() {
		this.stackRange = null;
		this.showFlag = false;
		this.bgPicker = new ColorPicker();
		this.borderPicker = new ColorPicker();
		this.box = DOM.create('div').appendTo(doc.body).addClass('fl_editor_table');
		var html = [
		            	'<table class="fl_eftor_tableconf" id="tableconf" style="width:100%">',
		            	'<tbody>',
		            	'<tr><th colspan="4">サイズ</th></tr>',
		            	'<tr><td class="cell1">行数</td><td><input type="text" class="mini-text" id="fl_editor_table_rows" value="2" /></td><td>列数</td><td><input type="text" class="mini-text" id="fl_editor_table_cols" value="2" /></td></tr>',
		            	'<tr><td class="cell1">横幅</td><td colspan="2"><select id="fl_editor_table_width"><option value="1">ページの幅</option><option value="2">コンテンツのサイズに合わせる</option><option value="3">ピクセル指定</option><option value="4">パーセント指定</option></select></td><td><input type="text" class="mini-text init_hide" id="fl_editor_table_width_val" /></td></tr>',
		            	'<tr><td class="cell1">縦幅</td><td colspan="2"><select id="fl_editor_table_height"><option value="1">ページの高さ</option><option value="2">コンテンツのサイズに合わせる</option><option value="3">ピクセル指定</option><option value="4">パーセント指定</option></select></td><td><input type="text" class="mini-text init_hide" id="fl_editor_table_height_val" /></td></tr>',
		            	'<tr><th colspan="4">レイアウト</th></tr>',
		            	'<tr><td class="a" colspan="2">パディング<input type="text" class="mini-text" value="3" id="fl_editor_table_padding" /></td><td>間隔</td><td colspan="3"><input type="text" class="mini-text" value="0" id="fl_editor_table_spacing" /></td></tr>',
		            	'<tr><td colspan="4">テキスト配置&nbsp;<select id="fl_editor_table_align"><option value="0">無し</option><option value="1">左</option><option value="2">中央</option><option value="3">右</option></select></td></tr>',
		            	'<tr><th colspan="4">枠線設定</th></tr>',
		            	'<tr><td colspan="2">太さ<input type="text" class="mini-text" id="fl_editor_table_border_width" value="1" /></td><td colspan="2">色<input type="text" class="middle-text" id="fl_editor_table_bordercolor" value="#000000" /></td></tr>',
		            	'<tr><th colspan="4">背景設定</th></tr>',
		            	'<tr><td colspan="4" class="colsp_bg_color">色<input type="text" id="fl_editor_table_bgcolor" value="#ffffff" class="middle-text" /></td></tr>',
		            	'<tr class="fl_editor_table_set"><td colspan="2"><input type="button" id="fl_editor_table_create" value="挿入する" /></td><td colspan="2"><input type="button" id="fl_editor_table_cancel" value="キャンセル" /></td></tr>',
		            	'</tbody>',
		            	'</table>'
		            ];
		this.box.html(html.join('\n'));
		// colorpicker set
		DOM.id('fl_editor_table_bgcolor').parent().append(this.bgPicker.get());
		DOM.id('fl_editor_table_bordercolor').parent().append(this.borderPicker.get());
		// parameters closure array
		this.wModeToValue = [
		                     function () { return FL.ut.getPageSize().width;},
		                     function () { return '100%';},
		                     function () { return DOM.id('fl_editor_table_width_val').getValue() + 'px';},
		                     function () { return DOM.id('fl_editor_table_width_val').getValue() + '%';}
		                     ];
		this.hModeToValue = [
		                     function () { return FL.ut.getPageSize().height;},
		                     function () { return '100%';},
		                     function () { return DOM.id('fl_editor_table_height_val').getValue() + 'px';},
		                     function () { return DOM.id('fl_editor_table_height_val').getValue() + '%';}
		                     ];
		this.alignModeToValue = ['', 'left', 'center', 'right'];
	};

	TableConf.prototype = {
		show : function () { this.showFlag = true;this.box.show();},
		hide : function () { this.showFlag = false;this.box.hide();},
		get : function () { return this.box; },
		init : function () {
			this.stackRange = new xRange(win_c);
			//doc_c.designMode = 'Off';
			this.show();
			// event set
			DOM.id('fl_editor_table_width').event('change', this.toggleWidth);
			DOM.id('fl_editor_table_height').event('change', this.toggleHeight);
			DOM.id('fl_editor_table_bordercolor').event('click', this.showPickerBD, this);
			DOM.id('fl_editor_table_bgcolor').event('click', this.showPickerBG, this);
			DOM.id('fl_editor_table_cancel').event('click', this.clearAllEvents, this);
			DOM.id('fl_editor_table_create').event('click', this._buildTable, this);
			this.bgPicker.get().detect('div').event('click', this.setBGColor, this);
			this.borderPicker.get().detect('div').event('click', this.setBorderColor, this);
			FL.event.set(doc, 'click', this.hidePickers, this);
		},
		hidePickers : function (ev) {
			if (!this.bgPicker.isHidden()) {
				this.bgPicker.hide();
			}
			if (!this.borderPicker.isHidden()) {
				this.borderPicker.hide();
			}
		},
		toggleWidth : function (ev) {
			DOM.id('fl_editor_table_width_val')[this.value === '3' ? 'show' : 'hide']();
		},
		toggleHeight : function (ev) {
			DOM.id('fl_editor_table_height_val')[this.value === '3' ? 'show' : 'hide']();
		},
		showPickerBG : function (ev) {
			ev.stopPropagation();
			this.bgPicker.show();
		},
		hidePickerBG : function (ev) {
			this.bgPicker.hide();
		},
		showPickerBD : function (ev) {
			ev.stopPropagation();
			this.borderPicker.show();
		},
		hidePickerBD : function (ev) {
			this.borderPicker.hide();
		},
		setBGColor : function (ev) {
			ev.stopPropagation();
			DOM.id('fl_editor_table_bgcolor').setValue(ev.target.title);
			this.bgPicker.hide();
		},
		setBorderColor : function (ev) {
			ev.stopPropagation();
			DOM.id('fl_editor_table_bordercolor').setValue(ev.target.title);
			this.borderPicker.hide();
		},
		clearAllEvents : function (ev) {
			DOM.id('fl_editor_table_width').unevent('change', this.toggleWidth);
			DOM.id('fl_editor_table_height').unevent('change', this.toggleHeight);
			DOM.id('fl_editor_table_bordercolor').unevent('click', this.showPickerBD, this);
			DOM.id('fl_editor_table_bgcolor').unevent('click', this.showPickerBG, this);
			DOM.id('fl_editor_table_cancel').unevent('click', this.clearAllEvents, this);
			DOM.id('fl_editor_table_create').unevent('click', this._buildTable, this);
			this.bgPicker.get().detect('div').unevent('click', this.setBGColor, this);
			this.borderPicker.get().detect('div').unevent('click', this.setBorderColor, this);
			FL.event.remove(doc, 'click', this.hidePickers);
			this.hide();
		},
		_buildTable : function (ev) {
			var row = DOM.id('fl_editor_table_rows').getValue(),
				col = DOM.id('fl_editor_table_cols').getValue(),
				w = DOM.id('fl_editor_table_width').getValue(),
				h = DOM.id('fl_editor_table_height').getValue(),
				p = DOM.id('fl_editor_table_padding').getValue(),
				s = DOM.id('fl_editor_table_spacing').getValue(),
				a = DOM.id('fl_editor_table_align').getValue(),
				bw = DOM.id('fl_editor_table_border_width').getValue(),
				bc = DOM.id('fl_editor_table_bordercolor').getValue(),
				bg = DOM.id('fl_editor_table_bgcolor').getValue(),
				st = [], out, r, c,
				r = row === '' ? 2 : row, c = col === '' ? 2 : col;
			w = this.wModeToValue[w]();
			h = this.hModeToValue[h]();
			a = this.alignModeToValue[a];
			// set style stacks
			st.push('width:' + w);
			st.push('height:' + h);
			//st.push('border:solid ' + bw + 'px ' + bc);
			st.push('background-color:' + bg);
			st.push('text-align:' + a);
			out = [ '<table cellpadding="' + p + '" cellspacing="' + s + '" style="' + st.join(';') + '">',
			        	'<tbody>'
			        ];
			for (var i = 0; i < r; i++) {
				out.push('<tr>');
				for (var j = 0; j < c; j++) {
					out.push('<td style="border:solid ' + bw + 'px ' + bc + '"></td>');
				}
				out.push('</tr>');
			}
			out.push('</tbody>');
			out.push('</table>');
			this.stackRange.insertHTML(out.join(''));
			this.hide();
		}
	};

	// =================== object maker class ====================================== //

	function ObjectConf() {
		this.stackRange = null;
		this.showFlag = false;
		this.box = DOM.create('div').appendTo(doc.body).addClass('fl_editor_table');
		var html = [
		            '<table class="fl_editor_objectconf" id="tableconf">',
		            '<tbody>',
		            '<tr><th>動画のURL</th><td colspan="3"><input type="text" class="long-text" id="fl_editor_obj_url" /></td></tr>',
		            '<tr><th colspan="4">表示サイズ</th></tr>',
		            '<tr><td>横幅</td><td><input type="text" class="mini-text" id="fl_editor_obj_width" value="450" />px</td><td>縦幅</td><td><input type="text" class="mini-text" id="fl_editor_obj_height" value="300" />px</td></tr>',
		            '<tr><td colspan="2"><input type="button" id="fl_editor_obj_set" value="追加" /></td><td colspan="2"><input type="button" id="fl_editor_obj_cancel" value="キャンセル" /></tr>',
		            '</tbody>',
		            '</table>'
		            ];
		this.box.html(html.join('\n'));
	};

	ObjectConf.prototype = {
		show : function () { this.showFlag = true;this.box.show();},
		hide : function () { this.showFlag = false;this.box.hide();},
		get : function () { return this.box; },
		init : function () {
			this.stackRange = new xRange(win_c);
			//doc_c.designMode = 'Off';
			this.show();
			// event set
			DOM.id('fl_editor_obj_cancel').event('click', this.clearAllEvents, this);
			DOM.id('fl_editor_obj_set').event('click', this._buildObject, this);
		},

		clearAllEvents : function (ev) {
			DOM.id('fl_editor_obj_cancel').unevent('click', this.clearAllEvents, this);
			DOM.id('fl_editor_obj_set').unevent('click', this._buildObject, this);
			this.hide();
		},
		_buildObject : function (ev) {
			var uri = DOM.id('fl_editor_obj_url').getValue(),
				w = DOM.id('fl_editor_obj_width').getValue() || 450,
				h = DOM.id('fl_editor_obj_height').getValue() || 300,
				out,
				div = '<div class="object_conf" url="' + uri + '" vw="' + w + '" vh="' + h + '" style="width:' + w + 'px;height:' + h + 'px;background:#ccc">動画オブジェクト</div>';

			this.stackRange.insertHTML(div);
			this.hide();
		}
	};
});
