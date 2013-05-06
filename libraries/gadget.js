/**
 * ===================================================================================================
 * 
 * Seezoo gadget controller
 * 
 * manage gadget create, delete, move
 * 
 * @package Seezoo Core
 * @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
 * 
 * ===================================================================================================
 */
ClassExtend('Library', function gadget() {

	// local variables
	var FL = getInstance(),
		that = this,
		globals = FL.config.getGlobal(),
		DOM = FL.DOM,
		Animation = globals.Animation,
		gadgetStack = [],
		sortHandle = null,
		guardFlag = false,
		// insert target element
		target,
		// check target is Hidden to load reduction
		globalCheck = false,
		// weather city list strings
		cityList = (['<p class="gadget_weather_area_caption">北海道地方</p><a href="javascript:void(0)" class="city_ids" rel="1">稚内</a><a href="javascript:void(0)" class="city_ids" rel="2">旭川</a><a href="javascript:void(0)" class="city_ids" rel="3">留萌</a><a href="javascript:void(0)" class="city_ids" rel="4">札幌</a><a href="javascript:void(0)" class="city_ids" rel="5">岩見沢</a><a href="javascript:void(0)" class="city_ids" rel="6">倶知安</a><a href="javascript:void(0)" class="city_ids" rel="7">網走</a><a href="javascript:void(0)" class="city_ids" rel="8">北見</a><a href="javascript:void(0)" class="city_ids" rel="9">紋別</a><a href="javascript:void(0)" class="city_ids" rel="10">根室</a><a href="javascript:void(0)" class="city_ids" rel="11">釧路</a><a href="javascript:void(0)" class="city_ids" rel="12">帯広</a><a href="javascript:void(0)" class="city_ids" rel="13">室蘭</a><a href="javascript:void(0)" class="city_ids" rel="14">浦河</a><a href="javascript:void(0)" class="city_ids" rel="15">函館</a><a href="javascript:void(0)" class="city_ids" rel="16">江差</a>',
		             '<p class="gadget_weather_area_caption">東北地方</p><a href="javascript:void(0)" class="city_ids" rel="17">青森</a><a href="javascript:void(0)" class="city_ids" rel="18">むつ</a><a href="javascript:void(0)" class="city_ids" rel="19">八戸</a><a href="javascript:void(0)" class="city_ids" rel="20">秋田</a><a href="javascript:void(0)" class="city_ids" rel="21">横手</a><a href="javascript:void(0)" class="city_ids" rel="22">盛岡</a><a href="javascript:void(0)" class="city_ids" rel="23">宮古</a><a href="javascript:void(0)" class="city_ids" rel="24">大船渡</a><a href="javascript:void(0)" class="city_ids" rel="25">仙台</a><a href="javascript:void(0)" class="city_ids" rel="26">白石</a><a href="javascript:void(0)" class="city_ids" rel="27">山形</a><a href="javascript:void(0)" class="city_ids" rel="28">米沢</a><a href="javascript:void(0)" class="city_ids" rel="29">酒田</a><a href="javascript:void(0)" class="city_ids" rel="30">新庄</a><a href="javascript:void(0)" class="city_ids" rel="31">福島</a><a href="javascript:void(0)" class="city_ids" rel="32">小名浜</a><a href="javascript:void(0)" class="city_ids" rel="33">若松</a>',
		             '<p class="gadget_weather_area_caption">関東地方</p><a href="javascript:void(0)" class="city_ids" rel="54">水戸</a><a href="javascript:void(0)" class="city_ids" rel="55">土浦</a><a href="javascript:void(0)" class="city_ids" rel="56">宇都宮</a><a href="javascript:void(0)" class="city_ids" rel="57">大田原</a><a href="javascript:void(0)" class="city_ids" rel="58">前橋</a><a href="javascript:void(0)" class="city_ids" rel="59">みなかみ</a><a href="javascript:void(0)" class="city_ids" rel="60">さいたま</a><a href="javascript:void(0)" class="city_ids" rel="61">熊谷</a><a href="javascript:void(0)" class="city_ids" rel="62">秩父</a><a href="javascript:void(0)" class="city_ids" rel="63">東京</a><a href="javascript:void(0)" class="city_ids" rel="64">大島</a><a href="javascript:void(0)" class="city_ids" rel="65">八丈島</a><a href="javascript:void(0)" class="city_ids" rel="66">父島</a><a href="javascript:void(0)" class="city_ids" rel="67">千葉</a><a href="javascript:void(0)" class="city_ids" rel="68">銚子</a><a href="javascript:void(0)" class="city_ids" rel="69">館山</a><a href="javascript:void(0)" class="city_ids" rel="70">横浜</a><a href="javascript:void(0)" class="city_ids" rel="71">小田原</a><a href="javascript:void(0)" class="city_ids" rel="75">甲府</a><a href="javascript:void(0)" class="city_ids" rel="76">河口湖</a>',
		             '<p class="gadget_weather_area_caption">信越・北陸地方</p><a href="javascript:void(0)" class="city_ids" rel="44">富山</a><a href="javascript:void(0)" class="city_ids" rel="45">伏木</a><a href="javascript:void(0)" class="city_ids" rel="46">金沢</a><a href="javascript:void(0)" class="city_ids" rel="47">輪島</a><a href="javascript:void(0)" class="city_ids" rel="48">福井</a><a href="javascript:void(0)" class="city_ids" rel="49">敦賀</a><a href="javascript:void(0)" class="city_ids" rel="50">新潟</a><a href="javascript:void(0)" class="city_ids" rel="51">長岡</a><a href="javascript:void(0)" class="city_ids" rel="52">高田</a><a href="javascript:void(0)" class="city_ids" rel="53">相川</a><a href="javascript:void(0)" class="city_ids" rel="72">長野</a><a href="javascript:void(0)" class="city_ids" rel="73">松本</a><a href="javascript:void(0)" class="city_ids" rel="74">飯田</a>',
		             '<p class="gadget_weather_area_caption">東海地方</p><a href="javascript:void(0)" class="city_ids" rel="34">静岡</a><a href="javascript:void(0)" class="city_ids" rel="35">網代</a><a href="javascript:void(0)" class="city_ids" rel="36">三島</a><a href="javascript:void(0)" class="city_ids" rel="37">浜松</a><a href="javascript:void(0)" class="city_ids" rel="38">名古屋</a><a href="javascript:void(0)" class="city_ids" rel="39">豊橋</a><a href="javascript:void(0)" class="city_ids" rel="40">岐阜</a><a href="javascript:void(0)" class="city_ids" rel="41">高山</a><a href="javascript:void(0)" class="city_ids" rel="42">津</a><a href="javascript:void(0)" class="city_ids" rel="43">尾鷲</a>',
		             '<p class="gadget_weather_area_caption">近畿地方</p><a href="javascript:void(0)" class="city_ids" rel="77">大津</a><a href="javascript:void(0)" class="city_ids" rel="78">彦根</a><a href="javascript:void(0)" class="city_ids" rel="79">京都</a><a href="javascript:void(0)" class="city_ids" rel="80">舞鶴</a><a href="javascript:void(0)" class="city_ids" rel="81">大阪</a><a href="javascript:void(0)" class="city_ids" rel="82">神戸</a><a href="javascript:void(0)" class="city_ids" rel="83">豊岡</a><a href="javascript:void(0)" class="city_ids" rel="84">奈良</a><a href="javascript:void(0)" class="city_ids" rel="85">風屋</a><a href="javascript:void(0)" class="city_ids" rel="86">和歌山</a><a href="javascript:void(0)" class="city_ids" rel="87">潮岬</a>',
		             '<p class="gadget_weather_area_caption">中国地方</p><a href="javascript:void(0)" class="city_ids" rel="88">岡山</a><a href="javascript:void(0)" class="city_ids" rel="89">津山</a><a href="javascript:void(0)" class="city_ids" rel="90">広島</a><a href="javascript:void(0)" class="city_ids" rel="91">庄原</a><a href="javascript:void(0)" class="city_ids" rel="92">松江</a><a href="javascript:void(0)" class="city_ids" rel="93">浜田</a><a href="javascript:void(0)" class="city_ids" rel="94">西郷</a><a href="javascript:void(0)" class="city_ids" rel="95">鳥取</a><a href="javascript:void(0)" class="city_ids" rel="96">米子</a><a href="javascript:void(0)" class="city_ids" rel="97">下関</a><a href="javascript:void(0)" class="city_ids" rel="98">山口</a><a href="javascript:void(0)" class="city_ids" rel="99">柳井</a><a href="javascript:void(0)" class="city_ids" rel="100">萩</a>',
		             '<p class="gadget_weather_area_caption">四国地方</p><a href="javascript:void(0)" class="city_ids" rel="101">徳島</a><a href="javascript:void(0)" class="city_ids" rel="102">日和佐</a><a href="javascript:void(0)" class="city_ids" rel="103">高松</a><a href="javascript:void(0)" class="city_ids" rel="104">松山</a><a href="javascript:void(0)" class="city_ids" rel="105">新居浜</a><a href="javascript:void(0)" class="city_ids" rel="106">宇和島</a><a href="javascript:void(0)" class="city_ids" rel="107">高知</a><a href="javascript:void(0)" class="city_ids" rel="108">室戸</a><a href="javascript:void(0)" class="city_ids" rel="109">清水</a>',
		             '<p class="gadget_weather_area_caption">九州地方</p><a href="javascript:void(0)" class="city_ids" rel="110">福岡</a><a href="javascript:void(0)" class="city_ids" rel="111">八幡</a><a href="javascript:void(0)" class="city_ids" rel="112">飯塚</a><a href="javascript:void(0)" class="city_ids" rel="113">久留米</a><a href="javascript:void(0)" class="city_ids" rel="114">大分</a><a href="javascript:void(0)" class="city_ids" rel="115">中津</a><a href="javascript:void(0)" class="city_ids" rel="116">日田</a><a href="javascript:void(0)" class="city_ids" rel="117">佐伯</a><a href="javascript:void(0)" class="city_ids" rel="118">長崎</a><a href="javascript:void(0)" class="city_ids" rel="119">佐世保</a><a href="javascript:void(0)" class="city_ids" rel="120">厳原</a><a href="javascript:void(0)" class="city_ids" rel="121">福江</a><a href="javascript:void(0)" class="city_ids" rel="122">佐賀</a><a href="javascript:void(0)" class="city_ids" rel="123">伊万里</a><a href="javascript:void(0)" class="city_ids" rel="124">熊本</a><a href="javascript:void(0)" class="city_ids" rel="125">阿蘇乙姫</a><a href="javascript:void(0)" class="city_ids" rel="126">牛深</a><a href="javascript:void(0)" class="city_ids" rel="127">人吉</a><a href="javascript:void(0)" class="city_ids" rel="128">宮崎</a><a href="javascript:void(0)" class="city_ids" rel="129">延岡</a><a href="javascript:void(0)" class="city_ids" rel="130">都城</a><a href="javascript:void(0)" class="city_ids" rel="131">高千穂</a><a href="javascript:void(0)" class="city_ids" rel="132">鹿児島</a><a href="javascript:void(0)" class="city_ids" rel="133">鹿屋</a><a href="javascript:void(0)" class="city_ids" rel="134">種子島</a><a href="javascript:void(0)" class="city_ids" rel="135">名瀬</a>',
		             '<p class="gadget_weather_area_caption">南西諸島地方</p><a href="javascript:void(0)" class="city_ids" rel="136">那覇</a><a href="javascript:void(0)" class="city_ids" rel="137">名護</a><a href="javascript:void(0)" class="city_ids" rel="138">久米島</a><a href="javascript:void(0)" class="city_ids" rel="139">南大東島</a><a href="javascript:void(0)" class="city_ids" rel="140">宮古島</a><a href="javascript:void(0)" class="city_ids" rel="141">石垣島</a><a href="javascript:void(0)" class="city_ids" rel="142">与那国島</a>'
		             ]).join(''),
		box = DOM.create('div')
					.addClass('fl_gadget_frame')
					.addClass('fl_sortable')
					.html(([
				        '<div class="fl_gadget_bar">',
				        '<span class="fl_gadget_title"></span>',
				        '<ul class="fl_gadget_options">',
				        '<li><a href="javascript:void(0)" class="fl_gadget_close" title="ガジェットを閉じる">閉じる</a></li>',
				        '<li><a href="javascript:void(0)" class="fl_gadget_resize" title="リサイズ">サイズ変更</a></li>',
				        '<li><a href="javascript:void(0)" class="fl_gadget_config" title="設定">設定</a></li>',
				        '<li><a href="javascript:void(0)" class="fl_gadget_info" title="このガジェットについて">情報</a></li>',
				        '<li><a href="javascript:void(0)" class="fl_gadget_reload" title="更新">更新</a></li>',
				        '</ul>',
				        '<div class="fl_gadget_config_content"></div>',
				        '<div class="fl_gadget_connecting"></div>',
				        '</div>',
				        '<div class="fl_gadget_content">',
				        '<p class="fl_gadget_init">データ取得中...</p>',
				        '</div>',
				        '<div class="fl_gadget_footer">&nbsp;</div>'
				    ]).join(''));
	
	// load depend module
	FL.load.ajax();
	FL.load.helper('date');
	
	/* ===================================================================================================
	 * local functions
	 * ===================================================================================================
	 */
	
	/**
	 * ===================================================================================================
	 * refreshSeparator
	 * refresh gadget separator
	 * @access private
	 * @execute call
	 * @patam bool flag
	 * @return void
	 * ===================================================================================================
	 */
	var refreshSeparator = function(flag) {
		var sp = target.detect('div.fl_gadget_separator'),
			gs = target.detect('div.fl_gadget_frame'),
			param = {}, gd;
		
		sp.foreach(function(num) {
			DOM(this).appendTo(gs.get(num), 'after');
		});
		
		DOM('div#gadget div.fl_gadget_frame').foreach(function(num) {
			gd = gadgetStack[DOM(this).readAttr('gadget_number')];
			param[num + 1] = gd.token;
		});
		
		if (!flag) {
			FL.ajax.post('gadget_ajax/sort_gadget/' + FL.config.item('sz_token'), {
				param : param,
				error : function() {
					alert('位置の保存に失敗しました。');
				}
			});
		}
	};

	/**
	 * ===================================================================================================
	 * Gadget Template generator Class
	 * 
	 * @construotor
	 * @access public
	 * @param String gName
	 * @param Number gid
	 * @param Number h
	 * @return void (or instance)
	 * ===================================================================================================
	 */
	var GadgetTemplate = function(gName, gid, h) {
		var cp = box.copy(true), resize = false, that = this, cfb;
		
		cp.attr('gadget_number', gadgetStack.length);
		cp.detect('span.fl_gadget_title').get(0).html(gName);
		this.currentHeight = h || 100;
		this.box = cp;
		this.title = cp.detect('div.fl_gadget_bar span.fl_gadget_title');
		this.content = cp.detect('div.fl_gadget_content').get(0).addStyle('height', this.currentHeight + 'px');
		this.settings = cp.detect('div.fl_gadget_bar a');
		this.custom = cp.detect('div.fl_gadget_config_content').get(0);
		// close handle
		this.settings.get(0).event('click', function(ev) {
			if (!confirm('このガジェットを削除します。よろしいですか？\n（保存されたデータも削除されます）')) {return;}
			FL.ajax.get('gadget_ajax/delete_gadget/' + gid + '/' + FL.config.item('sz_token'), {
				error : function() { alert('ガジェットの削除に失敗しました。'); },
				success : function(resp) {
					if (resp.responseText === 'complete') {
						cp.animate('fade', {speed : 30, callback : function() {
							cp.hide();
							if (cp.prev()) {
								cp.prev().remove();
							}
						}});
					} else {
						alert('ガジェットの削除に失敗しました。');
					}
				}
			});
			return false;
		}).event('mousedown', function(ev) { ev.stopPropagation();});

		// resize handle
		this.settings.get(1).event('click', function(ev) {
			ev.stopPropagation();
			if (!resize) {
				that.currentHeight = that.content.readStyle('height', true);
				that.content.addStyle('height', '0px').invisible();
				//that.content.animate('blindUp', {to : 10, speed : 0.4});
			} else {
				that.content.addStyle('height', that.currentHeight + 'px').visible();
				//that.content.animate('blindDown', {to : that.currentHeight, speed : 0.4});
			}
			resize = !resize;
			return false;
		}).event('mousedown', function(ev) { ev.stopPropagation();});

		// config handle
		this.settings.get(2).event('click', function(ev) {
			ev.stopPropagation();
			cfb = this.box.detect('div.fl_gadget_config_content').get(0).toggleShow();
			//conf = !conf;
		}, this).event('mousedown', function(ev) { ev.stopPropagation();});

		this.box.detect('div.fl_gadget_config_content').event('mousedown', function(ev) {ev.stopPropagation();});
	};

	/**
	 * ===================================================================================================
	 * GadgetTemplate Class Methods
	 * ===================================================================================================
	 */
	
	/**
	 * ===================================================================================================
	 * insertSeparator
	 * insert gadget separator
	 * ===================================================================================================
	 */
	GadgetTemplate.insertSeparator = function() {
		return DOM.create('div').addClass('fl_gadget_separator').html('<hr />').appendTo(target);
	}
	/**
	 * ===================================================================================================
	 * memo
	 * generate memo gadget content
	 * @access public
	 * @param String val
	 * @param xElement ctx [ gadget content element]
	 * ===================================================================================================
	 */
	GadgetTemplate.memo = function(val, ctx) {
		ctx.html('');
		DOM.create('textarea', { 'class' : 'gadget_memo'}).setValue(val)
			.appendTo(ctx); // value has sanityzed by CI
	}
	/**
	 * ===================================================================================================
	 * weather
	 * generate weather gadget content
	 * @access public
	 * @param Object data
	 * @param xElement ctx
	 * ===================================================================================================
	 */
	GadgetTemplate.weather = function(data, ctx) {
		ctx.html('');
		// build html
		var t,
			html = [
		            '<table class="sz_gadget_weather_table">',
		            '<tbody>',
		            '<tr>',
		            '<td colspan="3" class="caption">' + data.place[0] + 'の天気</td>',
		            '</tr>',
		            '<tr>',
		            '<td class="today">'
		            ];
		// today is exists?
		if (data.today) {
			t = data.today;
			html.push('<span class="weather_title">' + t.day + '<br />' + t.img.title[0] + '</span>');
			html.push('<img src="' + t.img.url[0] + '" width="' + t.img.width[0] + '" height="' + t.img.height[0] + '" alt="きょう" />');
			if (t.temp.min[0] || t.temp.max[0]) {
				html.push('<span class="temperature">' + ((t.temp.min[0]) ? t.temp.min[0] + '℃' : '-') + '&nbsp;/&nbsp;' + ((t.temp.max[0]) ? t.temp.max[0] + '℃' : '-') + '</span>');
			}
		} else {
			html.push('情報が取得できませんでした。');
		}
		html.push('</td><td class="tomorrow">');
		// tomorrow is exists?
		if (data.tomorrow) {
			t = data.tomorrow;
			html.push('<span class="weather_title">' + t.day + '<br />' + t.img.title[0] + '</span>');
			html.push('<img src="' + t.img.url[0] + '" width="' + t.img.width[0] + '" height="' + t.img.height[0] + '" alt="きょう" />');
			if (t.temp.min[0] || t.temp.max[0]) {
				html.push('<span class="temperature">' + ((t.temp.min[0]) ? t.temp.min[0] + '℃' : '-') + '&nbsp;/&nbsp;' + ((t.temp.max[0]) ? t.temp.max[0] + '℃' : '-') + '</span>');
			}
		} else {
			html.push('情報が取得できませんでした。');
		}
		html.push('</td><td class="dayaftertomorrow">');
		// dayaftertomorrow is exists?
		if (data.dayaftertomorrow) {
			t = data.dayaftertomorrow;
			html.push('<span class="weather_title">' + t.day + '<br />' + t.img.title[0] + '</span>');
			html.push('<img src="' + t.img.url[0] + '" width="' + t.img.width[0] + '" height="' + t.img.height[0] + '" alt="きょう" />');
			if (t.temp.min[0] || t.temp.max[0]) {
				html.push('<span class="temperature">' + ((t.temp.min[0]) ? t.temp.min[0] + '℃' : '-') + '&nbsp;/&nbsp;' + ((t.temp.max[0]) ? t.temp.max[0] + '℃' : '-') + '</span>');
			}
		} else {
			html.push('情報が取得できませんでした。');
		}
		html.push('</td></tr></tbody></table>');
		ctx.html(html.join(''));
	};

	/**
	 * ===================================================================================================
	 * gmail
	 * generate gmail gadget content
	 * @access public
	 * @param Object data
	 * @param xElement ctx
	 * @param Number flag
	 * ===================================================================================================
	 */
	GadgetTemplate.gmail = function(data, ctx, flag) {
		var html;
		if (flag === 1) { // show_data
			html = ['<div class="gmail">',
			        '<p class="gmail_info">最新10件表示、件名クリックで本文表示</p>',
			        '<table class="gmail_list"><tbody>'];
			for (var i in data) {
				if (data[i].seen > 0) {
					html.push('<tr>');
				} else {
					html.push('<tr class="unread">');
				}
				html.push('<td class="from">' + data[i].from + '</td>');
				html.push('<td class="subject">' + data[i].subject + '<div class="mail_body" style="display:none">' + data[i].body + '</div></td>');
				html.push('<td class="post_date">' + data[i].date + '</td>');
				html.push('</tr>');
			}
			html.push('</tbody></table><div class="gmail_body></div></div>');
		} else if (flag === 2) {
			html = [
			        '<form>',
			        '<p class="message">アカウント情報が設定されていません。<br />アカウントを作成してください。<br />設定したアカウント</p>',
			        '<dl class="gmail_login">',
			        '<dt>メールアドレス</dt>',
			        '<dd><input type="text" name="email", id="email_login" value="" /></dd>',
			        '<dt>パスワード</dt>',
			        '<dd><input type="password" name="password" id="password_login" /></dd>',
			        '</dl>',
			        '<p class="login_btn"><input type="button" value="アカウントを設定する" class="loginbtn" /></p>',
			        '</form>'
			        ];
		} else {
			html = [
			        '<form>',
			        '<p class="message">ログインしてください</p>',
			        '<dl class="gmail_login">',
			        '<dt>メールアドレス</dt>',
			        '<dd><input type="text" name="email", id="email_login" value="" /></dd>',
			        '<dt>パスワード</dt>',
			        '<dd><input type="password" name="password" id="password_login" /></dd>',
			        '</dl>',
			        '<p class="login_btn"><input type="button" value="ログイン" class="loginbtn" /></p>',
			        '</form>'
			        ];
		}
		ctx.html(html.join('\n'));
	};
	
	/**
	 * ===================================================================================================
	 * rss
	 * generate rss gadget contents
	 * @access public
	 * @param Object json
	 * @param xElement ctx
	 * @param Number flag
	 * ===================================================================================================
	 */
	GadgetTemplate.rss = function(json, ctx, flag) {
		var html, i = 0, len, c;

		// pre remove event
		if (ctx.detect('input.login_btn').length > 0) {
			ctx.detect('input.login_btn').unevent('click');
		}
		switch (flag) {
		case 0:
			// setup RSS
			html = [
			        '<form>',
			        '<p class="message">購読先のRSSのアドレスを入力してください。</p>',
			        '<dl class="set_rss">',
			        '<dt></dt>',
			        '<dd><input type="text" name="email", id="email_login" value="" /></dd>',
			        '</dl>',
			        '<p class="login_btn"><input type="button" value="RSS設定" class="loginbtn" /></p>',
			        '</form>'
			        ];
			break;
		case 1:
			html = [
			        '<p class="message">指定したRSSが取得できませんでした。URLを確認してください。<br >',
			        '指定されたURL：&nbsp;' + json.rss_url,
			        '</p>'
			        ];
			break;
		case 2:
			html= ['<ul class="gadget_rss">'];
			len = json.item.length;
			for(i; i < len; i++) {
				c = json.item[i];
				if (!c.title) { continue;}
				html.push('<li' + (i % 2 > 0 ? ' class="odd"' : '') + '>');
				html.push('<a href="' + c.link + '" target="_blank">' + c.title + '</a></li>');
				if (i === 9) { break;}
			}
			html.push('</ul>');
		}
		ctx.html(html.join('\n'));
	};

	/**
	 * ===================================================================================================
	 * bbs
	 * generate bbd gadget content
	 * @access public
	 * @param Object json
	 * @param xElemtn ctx
	 * @param Object users
	 * ===================================================================================================
	 */
	GadgetTemplate.bbs = function(json, ctx, users) {
		var data = json.data, i = 0, len ,d, li,
			ul = DOM.create('ul').addClass('gadget_bbs');
		
		if (data.length === 0) {
			DOM.create('li').addClass('gadget_bbs_none').inText('書き込みはありません。').appendTo(ul);
			ctx.lastDate = ''
		} else {
			len = data.length;
			for (i; i < len; i++) {
				d = data[i];
				li = DOM.create('li').html(d.body + '<span class="username">posted&nbsp;by&nbsp;' + users[d.posted_user_id] + '<br />' + d.post_date + '</span>');
				li.appendTo(ul);
				if (i > 9 || i === len - 1) {
					break;
				}
			}
			ctx.lastDate = data[0].post_date;
		}
		
		return ul;
	}

	/**
	 * ===================================================================================================
	 * translate
	 * generate google translate gadget content
	 * @access public
	 * @param xELement ctx
	 * @param String word
	 * ===================================================================================================
	 */
	GadgetTemplate.translate = function(ctx, word) {
		var html = [
		            '<form><dl>',
		            '<dt>',
		            '<textarea name="translate_value" class="default_value" cols="1" rows="1">' + word + '</textarea>',
		            '<p><label><input type="radio" value="2" name="translate_to" checked="checked" />日本語&raquo;英語</label>',
		            '&nbsp;&nbsp;<label><input type="radio" value="1" name="translate_to" />英語&raquo;日本語&nbsp;</label></p>',
		            '<input type="button" value="翻訳する" />',
		            '</dt>',
		            '<dd>',
		            '<p class="trans_result">翻訳結果</p>',
		            '<textarea class="translated_box" name="translated_box"></textarea>',
		            '</dd></dl></form>'
		            ];
		ctx.html(html.join(''));
	}

	/**
	 * ===================================================================================================
	 * wikipedia
	 * generate wikipedia gadget content
	 * @access public
	 * @param xElement ctc
	 * @param String word
	 * ===================================================================================================
	 */
	GadgetTemplate.wikipedia = function(ctx, word) {
		var html = [
		            '<form><dl>',
		            '<dt>',
		            '<input name="translate_value" class="default_value wiki" type="text" value="' + word + '" />&nbsp;',
		            '<input type="button" value="調べる" />',
		            '</dt>',
		            '<dd>',
		            '<p class="wiki_result">検索結果<span style="margin-left:5px;color:#c00"></span></p>',
		            '<div class="translated_box" name="translated_box"></div>',
		            '</dd></dl></form>'
		            ];
		ctx.html(html.join(''));
	}

	/**
	 * ===================================================================================================
	 * Gadget generator Class
	 * create some gadget instances
	 * @constructor
	 * @global_name Gadget
	 * @access public [or global]
	 * ===================================================================================================
	 */
	var _gadget = {
		/**
		 * ===========================================================================================
		 * create
		 * create gadget frame
		 * @access public
		 * @param Object json
		 * @return void
		 * ===========================================================================================
		 */
		create : function(json) {
			var sp = GadgetTemplate.insertSeparator(), g;
			
			new Gadget._resizeable(sp);
			if (Gadget.hasOwnProperty(json.gadget_name)) {
				g = new Gadget[json.gadget_name](json);
				sortHandle.addSortElement(g.GT.box);
				gadgetStack.push(g);
			}
		},
		/**
		 * ===========================================================================================
		 * _resizable
		 * gadget frame to resizable
		 * @access private
		 * @param HTMLElement elm
		 * @reutrn void
		 * ===========================================================================================
		 */
		_resizeable : function(elm) {
			this.elm = DOM(elm).addStyle('cursor', 'n-resize');
			this.prevE = null;
			this.nextE = null;
			this.doc = document;
			this.mouse = {};
			FL.event.set(this.elm, 'mousedown', this.resizeInit, this);
		},
		/**
		 * ===========================================================================================
		 * memo
		 * create memo gadget
		 * @access public
		 * @param Object data
		 * @reutrn void
		 * ===========================================================================================
		 */
		memo : function(data) {
			this.token = data.token;
			this.gadget_id = data.gadget_master_id;
			this.gName = 'メモ帳';
			this.currentHeight = 150;
			this.GT = new GadgetTemplate(this.gName, this.gadget_id, this.currentHeight);
			// remove config adn that area
			this.GT.settings.get(3).parent().remove();
			this.GT.settings.get(4).parent().remove();
			this.GT.settings.get(2).parent().remove();
			this.GT.custom.remove();
			this.GT.box.appendTo(target);
			this.GT.title.addClass('memo');
			this.GT.content.addClass('memo');
			this.init();
		},
		/**
		 * ===========================================================================================
		 * weather
		 * create weather gadget
		 * @access public
		 * @param Object data
		 * @reutrn void
		 * ===========================================================================================
		 */
		weather : function(data) {
			this.token = data.token;
			this.gadget_id = data.gadget_master_id;
			this.gName = '天気';
			this.currentHeight = 150;
			this.GT = new GadgetTemplate(this.gName, this.gadget_id, this.currentHeight);
			// remove config adn that area
			this.GT.settings.get(3).parent().remove();
			this.GT.settings.get(4).parent().remove();
			//this.GT.custom.remove();
			this.GT.box.appendTo(target);
			this.GT.title.addClass('weather');
			this.GT.content.addClass('weather');
			this.setConfig();
			this.init();
		},
		/**
		 * ===========================================================================================
		 * gmail
		 * create gmail gadget
		 * @access public
		 * @param Object data
		 * @reutrn void
		 * ===========================================================================================
		 */
		gmail : function(data) {
			this.token = data.token;
			this.gadget_id = data.gadget_master_id;
			this.gName = 'Gmail';
			this.currentHeight = 200;
			this.GT = new GadgetTemplate(this.gName, this.gadget_id, this.currentHeight);
			// remove config btn that area
			this.GT.settings.get(2).parent().remove();
			this.GT.settings.get(3).parent().remove();
			//this.GT.settings.get(4).parent().remove();
			this.GT.custom.remove();
			this.GT.box.appendTo(target);
			this.GT.title.addClass('gmail');
			this.GT.content.addClass('gmail');
			this.email = '';
			this.password = '';
			var that = this;
			this.getMail();
		},
		/**
		 * ===========================================================================================
		 * twitter
		 * create twitter gadget
		 * @access public
		 * @param Object data
		 * @reutrn void
		 * ===========================================================================================
		 */
		twitter : function(data) {
			this.token = data.token;
			this.gadget_id = data.gadget_master_id;
			this.gName = 'Twitter';
			this.currentHeight = 200;
			this.GT = new GadgetTemplate(this.gName, this.gadget_id, this.currentHeight);
			this.GT.box.appendTo(target);
			this.GT.settings.get(4).event('click', function(ev) { ev.stopPropagation();this.getTwit();}, this)
										.event('mousedown', function(ev) { ev.stopPropagation();})
			this.GT.settings.get(3).parent().remove();
			this.GT.title.addClass('twitter');
			this.GT.content.addClass('twitter');
			this.timer = '';
			this.twitIdStack = {};
			this.newTwits = [];
			this.init();
		},
		/**
		 * ===========================================================================================
		 * rss
		 * create rss gadget
		 * @access pubic
		 * @param Object data
		 * @reutrn void
		 * ===========================================================================================
		 */
		rss : function(data) {
			this.token = data.token;
			this.gadget_id = data.gadget_master_id;
			this.gName = 'RSS';
			this.currentHeight = 150;
			this.GT = new GadgetTemplate(this.gName, this.gadget_id, this.currentHeight);
			this.GT.box.appendTo(target);
			this.GT.settings.get(4).event('click', function(ev) { ev.stopPropagation();this.init(true);}, this)
									.event('mousedown', function(ev) { ev.stopPropagation();})
			this.GT.settings.get(3).parent().remove();
			this.GT.title.addClass('rss');
			this.GT.content.addClass('rss');
			this.timer = '';
			this.rss_url = '';
			this.setConfig();
			this.init();
		},
		/**
		 * ===========================================================================================
		 * bbs
		 * create bbs gadget
		 * @access public
		 * @param Object data
		 * @reutrn void
		 * ===========================================================================================
		 */
		bbs : function(data) {
			var that = this;
			
			this.token = data.token;
			this.gadget_id = data.gadget_master_id;
			this.gName = 'ユーザーチャット';
			this.currentHeight = 200;
			this.GT = new GadgetTemplate(this.gName, this.gadget_id, this.currentHeight);
			this.GT.box.appendTo(target);
			this.GT.settings.get(4)
					.event('click', function(ev) {
							ev.stopPropagation();
							try {
								window.clearTimeout(that.timer);
							} catch(e) {}
							that.updateBBS();
							}, this)
					.event('mousedown', function(ev) { ev.stopPropagation();})
			this.GT.settings.get(3).parent().remove();
			this.GT.settings.get(2).parent().remove();
			this.GT.title.addClass('bbs');
			this.GT.content.addClass('bbs');
			this.lastDate = '';
			this.timer = '';
			this.init();
		},
		/**
		 * ===========================================================================================
		 * google_translate
		 * create google translate gadget
		 * @access public
		 * @param Object data
		 * @reutrn void
		 * ===========================================================================================
		 */
		google_translate : function(data) {
			this.token = data.token;
			this.gadget_id = data.gadget_master_id;
			this.gName = 'Google翻訳';
			this.currentHeight = 200;
			this.GT = new GadgetTemplate(this.gName, this.gadget_id, this.currentHeight);
			this.GT.box.appendTo(target);
			this.GT.settings.get(3).parent().remove();
			this.GT.settings.get(2).parent().remove();
			this.GT.settings.get(4).parent().remove();
			this.GT.title.addClass('translate');
			this.GT.content.addClass('translate');
			this.defaultWord = '翻訳する言葉を入力してください';
			this.currentWord = '';
			this.init();
		},
		/**
		 * ===========================================================================================
		 * wikipedia
		 * create wikipedia gadget
		 * @access public
		 * @param Object data
		 * @reutrn void
		 * ===========================================================================================
		 */
		wikipedia : function(data) {
			this.token = data.token;
			this.gadget_id = data.gadget_master_id;
			this.gName = 'Wikipedia';
			this.currentHeight = 150;
			this.GT = new GadgetTemplate(this.gName, this.gadget_id, this.currentHeight);
			this.GT.box.appendTo(target);
			this.GT.settings.get(3).parent().remove();
			this.GT.settings.get(2).parent().remove();
			this.GT.settings.get(4).parent().remove();
			this.GT.title.addClass('wikipedia');
			this.GT.content.addClass('wikipedia');
			this.defaultWord = '調べたい言葉を入力してください';
			this.currentWord = '';
			this.init();
		}
	};

	/**
	 * ===================================================================================================
	 * Gadget Class Method Protptypes
	 * ===================================================================================================
	 */
	_gadget._resizeable.prototype = {
		resizeInit : function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			this.prevG = gadgetStack[this.elm.prev().readAttr('gadget_number')];
			this.nextG = gadgetStack[this.elm.next().readAttr('gadget_number')];
			this.mouse = {x : ev.pageX, y : ev.pageY};
			FL.event.remove(this.elm, 'mousedown', arguments.callee);
			FL.event.set(this.doc, 'mousemove', this.doMove, this);
			FL.event.set(this.doc, 'mouseup', this.moveEnd, this);
		},
		doMove : function(ev) {
			var abs = Math.abs,
				offsetX = abs(this.mouse.x - ev.pageX),
				offsetY = abs(this.mouse.y - ev.pageY),
				flag = (this.mouse.y <= ev.pageY),
				po, no, end = false;
			
			if (flag) {
				po = this.prevG.currentHeight + offsetY;
				no = this.nextG.currentHeight - offsetY;
				if (no < 10) {
					end = true;
				}
			} else {
				po = this.prevG.currentHeight - offsetY;
				no = this.nextG.currentHeight + offsetY;
				if (po < 10) {
					end = true;
				}
			}
			this.prevG.GT.content.addStyle('height', po + 'px');
			this.nextG.GT.content.addStyle('height', no + 'px');
			if (end === true) {
				this.moveEnd();
			}
		},
		moveEnd : function() {
			FL.event.remove(this.doc, 'mousemove', this.doMove);
			FL.event.remove(this.doc, 'mouseup', arguments.callee);
			this.prevG.currentHeight = this.prevG.GT.content.readStyle('height', true);
			this.nextG.currentHeight = this.nextG.GT.content.readStyle('height', true);
			// reattach
			FL.event.set(this.elm, 'mousedown', this.resizeInit, this);
		}
	};
	
	_gadget.memo.prototype = {
		update : function(data) {
			var that = this;
			
			this.loading(true);
			FL.ajax.post('gadget_ajax/save_memo/' + that.token + '/' + FL.config.item('sz_token'), {
				async : true,
				param : {data : data},
				success : function() {
					that.loading();
				}
			});
		},
		init : function() {
			var that = this, d, data;
			
			FL.ajax.get('gadget_ajax/get_gadget_memo/' + this.token + '/' + FL.config.item('sz_token'), {
				async : true,
				error : function() {
					that.GT.content.html('データの取得に失敗しました。');
				},
				success : function(resp) {
					//eval('var d=' + resp.responseText);
					d = FL.json.parse(resp.responseText);
					if (!d) {
						that.GT.content.html('データの取得に失敗しました。');
						return;
					}
					that.updateTime = parseInt(d.update_time, 10);
					GadgetTemplate.memo(d.data, that.GT.content);
					FL.event.set(that.GT.content.detect('textarea').get(0), 'keydown', function(ev) {
						data = that.GT.content.detect('textarea').get(0).getValue();
						// save shortcut key is Ctrl + S
						if (ev.keyCode == 83 && ev.ctrlKey === true) {
							ev.preventDefault();
							(data !== '') && that.update(data);
						}
					});
				}
			});
		},
		loading : function(show) {
			this.GT.box.getOne('div.fl_gadget_connecting')[show ? 'show' :'hide']();
		}
	};
	
	_gadget.gmail.prototype = {
		getMail : function() {
			var that = this;
			
			FL.ajax.timeout = '100000';
			FL.ajax.post('gadget_ajax/get_gmail/' + this.token + '/' + FL.config.item('sz_token'), {
					async : true,
					error : function() {
						that.GT.content.html('データの取得に失敗しました。');
					},
					success : function(resp) {
						var tt = resp.responseText;
						if (tt === 'error') {
							that.GT.content.html('データの取得に失敗しました。');
							return;
						} else if (tt === 'need_login') {
							GadgetTemplate.gmail('', that.GT.content, 0);
							that.setUpLogin(that.GT.content);
						} else if (tt === 'no_account') {
							GadgetTemplate.gmail('', that.GT.contet, 2);
							that.setUpAccount(that.GT.content);
						} else {
							eval('var d=' + resp.responseText);
							if (!d) {
								that.GT.content.html('データの取得に失敗しました。');
							} else {
								GadgetTemplate.gmail(d, that.GT.content, 1);
								that.setUpShowBody(that.GT.content);
							}
						}
					}
				});
		},
		setUpLogin : function(ctx) {
			var that = this, ipt = ctx.detect('input');
			
			ctx.detect('input.loginbtn').get(0).event('click', function() {
				FL.ajax.post('gadget_ajax/gadget_gmail_login/' + FL.config.item('sz_token'), {
					param : { email : ipt.get(0).getValue(), password : ipt.get(1).getValue()},
					error : function() {alert('ログインに失敗しました');},
					success : function() {
						that.getMail();
					}
				});
			})
		},
		setUpShowBody : function(ctx) {
			var bd = DOM.create('div').addClass('gmail_body').appendTo(document.body),
				that = this;
			
			function clickHandle(ev) {
				ev.stopPropagation();
				var txt = DOM(this).detect('div.mail_body').get(0).getHTML(),
					pos = DOM(this).absDimension();

				bd.html(that.linkFormat(txt))
				.addStyle({top : pos.top + 20 + 'px', left : pos.left + 'px'})
				.show();
			}
			
			ctx.detect('td.subject').event('click', clickHandle);
			FL.event.set(document, 'click', function() {
				bd.hide();
			});
		},
		linkFormat : function(str) {
			return str.replace(/\b(https?:\/\/[\w\.\/]+)([\/|\?]?[\-_.!~\*a-zA-Z0-9\/\?:;@&=+$,%#]+)?\b/g, '<a href="$1$2" target="blank">$1$2</a>');
		}
	};
	_gadget.twitter.prototype = {
		init : function() {
			var that = this, json;
			
			FL.ajax.get('gadget_ajax/get_gadget_twitter/' + this.token + '/' + FL.config.item('sz_token'), {
				success : function(resp) {
					if (resp === 'error') {
						alert('データの取得に失敗しました。');
						return;
					} else {
						//eval('var json=' + resp.responseText);
						json = FL.json.parse(resp.responseText);
						
						if (!json) {
							alert('データの取得に失敗しました。');
							return;
						}
						that.accountName = json.account_name;
						that.updateTime = parseInt(json.update_time, 10);
						that.times = parseInt(json.show_count, 10);
						if (!json.account_name || json.account_name == 0) {
							that.url = 'http://twitter.com/statuses/public_timeline.json';
							that.accountName = '最近';
						} else {
							that.url = 'http://twitter.com/statuses/user_timeline/' + json.account_name + '.json';
							that.accountName = json.account_name;
						}
						that.setConfig();
						that.getTwit(true);
					}
				}
			});
		},
		setConfig : function() {
			this.c = this.GT.box.detect('div.fl_gadget_config_content').get(0);
			var html = [
			            '<form id="twitter_conf' + this.gadget_id + '">',
			            '<dl>',
			            '<dt>つぶやきを表示するユーザー:</dt>',
			            '<dd><input type="text" name="account_name" value="' + (this.accountName === '最近' ? '' : this.accountName) + '" /></dd>',
			            '<dt>更新間隔（分）:</dt>',
			            '<dd><input type="text" name="update_time" class="up_time" value="' + this.updateTime + '" /></dd>',
			            '<dt>取得件数:</dt>',
			            '<dd><input type="text" name="show_count" value="' + this.times + '" /></dd>',
			            '</dl>',
			            '<p class="twitter_config_submit">',
			            '<input type="button" value="設定変更" id="submit_' + this.gadget_id + '" \>',
			            '</p>',
			            '</form>'
			            ];
			this.c.html(html.join('\n'));
			
			this.c.getOne('form').event('keydown', function(ev) {
				if (ev.keyCode == 13) { ev.preventDefault();}
				this.customConfig();
			}, this);
			this.c.detect('input[type=button]').get(0).event('click', this.customConfig, this);
		},
		customConfig : function(ev) {
			ev.stopPropagation();
			var that = this, p = DOM.id('twitter_conf' + this.gadget_id).serialize(), json;
			
			if (isNaN(p.update_time)) { return alert('更新間隔は数値で入力してください。')}
			if (isNaN(p.show_count)) { return alert('取得件数は数値で入力してください。')}
			
			FL.ajax.post('gadget_ajax/gadget_twitter_config/' + this.token + '/' + FL.config.item('sz_token'), {
				param : p,
				error : function() {
					alert('設定変更に失敗しました。');
				},
				success : function(resp) {
					if (resp.responseText === 'error') {
						alert('設定変更に失敗しました。');
						return;
					}
					// eval('var json=' + resp.responseText);
					json = FL.json.parse(resp.responseText);
					if (!json) {
						alert('設定変更に失敗しました。');
						return;
					}
					if ( !json.account_name || json.account_name == '最新') {
						that.accountName = '最新';
					} else {
						that.accountName = json.account_name;
					}
					that.updateTime = json.update_time;
					that.times = json.show_count;
					if (that.accountName !== '最新') {
						that.url = 'http://twitter.com/statuses/user_timeline/' + that.accountName + '.json';
					} else {
						that.url = 'http://twitter.com/statuses/public_timeline.json';
					}
					try {clearTimeout(that.timer);}
					catch(e) {}
					that.c.hide();
					that.getTwit();
				}
			});
		},
		getTwit : function(flag) {
			this.firstGet = flag || false;
			this.loading(true);
			if (globalCheck && target.isHidden() === true) { return;}
			FL.ajax.jsonp(this.url, this.callback, this);
		},
		callback : function(obj) {
			if (!obj) {
				alert('データの取得に失敗しました。');
				return;
			}
			var len = obj.length, i = 0, twit, that = this, tmpStack = {};
			
			html = ['<p class="account">' + this.accountName + 'のつぶやき</p>'];
			html.push('<ul class="gadget_twitter">');
			for(i; i < len; i ++) {
				twit = obj[i];
				html.push('<li' + (i % 2 > 0 ? ' class="odd"' : '') + ' twitid="' + twit.id + '"');
				if (this.firstGet) {
					html.push(' hl="0">');
					this.twitIdStack[twit.id] = 1;
				} else if (!(twit.id in this.twitIdStack)) {
						html.push(' hl="1">');
				} else {
					html.push(' hl="0">');
				}
				tmpStack[twit.id] = 1;
				html.push(this.linkFormat(twit.text));
				html.push('<p class="twit_user">' + twit.user.screen_name + '&nbsp;at&nbsp;' + this.parseDate(twit.created_at) + '</p></li>');
				if (i === this.times -1) { break;}
			}
			html.push('</ul>');
			this.GT.content.html(html.join('\n'));
			this.GT.content.detect('li').foreach(function() {
				if (DOM(this).readAttr('hl') == 1) {
					DOM(this).animate('highLight');
				}
			});
			this.twitIdStack = tmpStack;
			this.timer = setTimeout(function() {that.getTwit()}, this.updateTime * 60000);
			this.loading();
		},
		// format UTC to japanese format
		parseDate : function(d) {
			var sp = d.split(' '), data = [sp[1], ' ', sp[2], ', ', sp[5], ' ', sp[3]],
				date = new Date(data.join(''));
			
			date.setHours(date.getHours() + 9);
			return Helper.date('m/d H:i', date.getTime());
		},
		linkFormat : function(str) {
			return str.replace(/\b(https?:\/\/[\w\.\/]+)([\/|\?]?[\-_.!~\*a-zA-Z0-9\/\?:;@&=+$,%#]+)?\b/g, '<a href="$1$2" target="blank">$1$2</a>');
		},
		loading : function(show) {
			this.GT.box.getOne('div.fl_gadget_connecting')[show ? 'show' :'hide']();
		}
	};
	_gadget.rss.prototype = {
		init : function(flag) {
			var that = this, type, json;
			
			FL.ajax.get('gadget_ajax/get_gadget_rss/' + this.token + '/' + FL.config.item('sz_token'), {
				error : function() {
					alert('データの取得に失敗しました。');
				},
				success : function(resp) {
					if (resp.responseText === 'error') {
						alert('データの取得に失敗しました。');
						return;
					}
					//eval ('var json=' + resp.responseText);
					json = FL.json.parse(resp.responseText);
					
					if (!json) {
						alert('データの取得に失敗しました。');
						return;
					}
					that.rss_url = json.rss_url;
					type = !that.rss_url ? 0 : !FL.ut.isObject(json.channel) ? 1 : 2;
					GadgetTemplate.rss(json, that.GT.content, type);
					if (type > 1) {
						that.GT.title.get(0).html(json.channel.title);
					}
					if (type > 0) {
						that.GT.box.detect('div.fl_gadget_config_content input[type=text]').get(0).setValue(that.rss_url);
					}
				}
			});
		},
		setConfig : function() {
			this.c = this.GT.box.detect('div.fl_gadget_config_content').get(0);
			var html = [
			            '<form id="rss_conf' + this.gadget_id + '">',
			            '<dl>',
			            '<dt>取得先のRSSのURL:</dt>',
			            '<dd><input type="text" name="rss_url" value="' + (this.rss_url) + '" style="width:250px"/></dd>',
			            '</dl>',
			            '<p class="rss_submit">',
			            '<input type="button" value="設定変更" id="submit_' + this.gadget_id + '" \>',
			            '</p>',
			            '</form>'
			            ];
			this.c.html(html.join('\n'));
			this.c.detect('input[type=button]').get(0).event('click', this.customConfig, this);
		},
		customConfig : function(ev) {
			ev.stopPropagation();
			var that = this, p = DOM.id('rss_conf' + this.gadget_id).serialize();
			FL.ajax.post('gadget_ajax/gadget_rss_config/' + this.token + '/' + FL.config.item('sz_token'), {
				param : p,
				error : function() {
					alert('設定変更に失敗しました。');
				},
				success : function(resp) {
					if (resp.responseText === 'error') {
						alert('設定変更に失敗しました。');
						return;
					}
					//response url has already sanityzed by CodeIgniter.
					that.rss_url = resp.responseText;
					that.c.hide();
					that.init(true);
				}
			});
		},
		getRSS : function() {
			var that = this, json;
			
			FL.ajax.get('gadget_ajax/get_gadget_rss_data/' + FL.config.item('sz_token'), {
				error : function() { alert('データの取得に失敗しました。');},
				success : function(resp) {
					if (resp.responseText === 'error') {
						alert('データの取得に失敗しました。');
						return;
					}
					//eval ('var json=' + resp.responseText);
					json = FL.json.parse(resp.responseText);
					if (!json) {
						alert('データの取得に失敗しました。');
						return;
					}
					GadgetTemplate.rss(json, that.GT.content, !(json.content === ''));
				}
			});
		}
	};
	// bbs prototype
	_gadget.bbs.prototype = {
		init : function() {
			var that = this, json;
			
			FL.ajax.get('gadget_ajax/gadget_bbs_get_data/' + FL.config.item('sz_token'), {
				error : function() { alert('データの取得に失敗しました。');},
				success : function(resp) {
					if (resp.responseText === 'error') {
						alert('データの取得に失敗しました。');
						return;
					}
					//eval ('var json=' + resp.responseText);
					json = FL.json.parse(resp.responseText);
					if (!json) {
						alert('データの取得に失敗しました。');
						return;
					}
					that.users = json.users;
					that.GT.content.detect('p.fl_gadget_init').get(0).remove();
					that.createTab();
					that.bbsContent.append(GadgetTemplate.bbs(json, that, that.users));
					that.time = window.setTimeout(function() { that.updateBBS();}, 300000) // 5 minutes update
				}
			});
		},
		createTab : function() {
			var tab = DOM.create('ul').addClass('gadget_tabs').addClass('clearfix'),
				ctx = this.GT.content, cns, tabs, cTab, cBox;
				
			tab.html('<li><a href="javascript:void(0)" class="active">書き込み</a></li><li><a href="javascript:void(0)">投稿</a></li>');
			tab.appendTo(ctx);
			this.bbsContent = DOM.create('div').addClass('gadget_tab_content').addClass('bbs_cn').appendTo(ctx);
			this.bbsSubmit = DOM.create('div').addClass('gadget_tab_content').appendTo(ctx).hide();
			this.createSubmit();
			cns = ctx.detect('div.gadget_tab_content');
			tabs = tab.detect('li a');
			cTab = tabs.get(0);
			cBox = cns.get(0);
			tabs.foreach(function(num) {
				DOM(this).event('click', function(ev) {
					if (DOM(this).hasClass('active')) { return;}
					cTab.removeClass('active');
					cBox.hide();
					cTab = DOM(this).addClass('active');
					cBox = cns.get(num).show();
				});
			});
		},
		createSubmit : function() {
			var html = [
			            '<form class="gadget_bbs_submit_box">',
			            '<textarea class="bbs_submit_value" cols="1" rows="1"></textarea>',
			            '<p id="value_count' + this.gadget_id + '">140</p>',
			            '<span id="bbs_message' + this.gadget_id + '"></span>',
			            '<input type="button" id="bbs_submit" value="投稿" />',
			            '</form>'
			            ],
			           gid = this.gadget_id;
			
			this.bbsSubmit.html(html.join(''));
			this.bbsSubmit.detect('textarea').get(0).event('keyup', function() {
				DOM.id('value_count' + gid).html((140 - this.value.length));
			});
			this.bbsSubmit.detect('input').get(0).event('click', this.postUpdate, this);
		},
		postUpdate : function(ev) {
			var tt = this.bbsSubmit.detect('textarea').get(0),
			 data = tt.getValue(), spn, that = this;
			
			if (data.length > 140) {
				alert('投稿できる文字数は140文字までです。');
				return;
			}
			
			FL.ajax.post('gadget_ajax/gadget_bbs_submit/' + FL.config.item('sz_token'), {
				param : { 'body' : data },
				error : function() {
					alert('投稿に失敗しました。');
				},
				success : function(resp) {
					if (resp.responseText !== 'complete') {
						alert('投稿に失敗しました。');
						that.loading();
						return;
					}
					spn = DOM.id('bbs_message' + that.gadget_id).html('投稿が完了しました。');
					window.setTimeout(function() { spn.html('');}, 2000);
					DOM.id('value_count' + that.gadget_id).html(140);
					tt.setValue('');
					try {
						window.clearTimeout(that.timer);
					} catch(e) {}
					that.updateBBS();
				}
			});
		},
		updateBBS : function() {
			var that = this, json, users, i = 0, len, d, ul, li;

			this.loading(true);
			FL.ajax.post('gadget_ajax/gadget_bbs_update/' + FL.config.item('sz_token'), {
				param : {last_update : this.lastDate},
				error : function() {
					alert('チャットデータの更新に失敗しました');
				},
				success : function(resp) {
					if (resp.responseText === 'error') {
						alert('チャットデータの更新に失敗しました');
						that.loading();
						return;
					}
					//eval('var json=' + resp.responseText);
					json = FL.json.parse(resp.responseText);
					if (!json) {
						alert('チャットデータの更新に失敗しました');
						that.loading();
						return;
					}
					users = json.users; len = json.data.length;
					ul = that.bbsContent.detect('ul').get(0);
					if (len > 0) {
						for (i; i < len; i++) {
							d = json.data[i];
							li = DOM.create('li').html(d.body + '<span class="username">posted&nbsp;by&nbsp;' + users[d.posted_user_id] + '<br />' + d.post_date + '</span>');
							li.appendTo(ul.first(), 'before');
							li.animate('highLight');
						}
						that.lastDate = json.data[0].post_date;
					}
					if (ul.detect('li.gadget_bbs_none').length > 0) {
						ul.getOne('li.gadget_bbs_none').remove();
					}
					that.loading();
					that.timer = window.setTimeout(function() { that.updateBBS;}, 300000);
				}
			});
		},
		loading : function(show) {
			this.GT.box.getOne('div.fl_gadget_connecting')[show ? 'show' :'hide']();
		}
	};

	_gadget.weather.prototype = {
		init : function() {
			var that = this, d;
			
			this.loading(true);
			FL.ajax.get('gadget_ajax/get_gadget_weather/' + this.token + '/' + FL.config.item('sz_token'), {
				async : true,
				error : function() {
					that.GT.content.html('データの取得に失敗しました。');
				},
				success : function(resp) {
					//eval('var d=' + resp.responseText);
					d = FL.json.parse(resp.responseText);
					if (!d) {
						that.GT.content.html('データの取得に失敗しました。');
						return;
					}
					GadgetTemplate.weather(d, that.GT.content);
					that.loading();
				}
			});
		},
		setConfig : function() {
			var html = '<p>表示したい地方を選択してください。</p>' + cityList, t;
			this.GT.custom.html(html);
			this.GT.custom.addStyle('width', '220px');
			this.GT.custom.event('click', function(ev) {
				t = DOM(ev.target);
				if (t.tag === 'a' && t.hasClass('city_ids')) {
					this.customConfig(t.readAttr('rel'));
				}
			}, this);
		},
		customConfig : function(cityId) {
			var that = this;
			
			FL.ajax.post('gadget_ajax/gadget_weather_change_area/' + this.token + '/' + FL.config.item('sz_token'), {
				param : {city_id : cityId},
				error : function() {
					alert('設定変更に失敗しました。');
				},
				success : function(resp) {
					if (resp.responseText === 'error') {
						alert('設定変更に失敗しました。');
						return;
					}
					that.GT.custom.hide();
					that.init();
				}
			});
		},
		loading : function(show) {
			this.GT.box.getOne('div.fl_gadget_connecting')[show ? 'show' :'hide']();
		}
	};

	// translate gadget
	_gadget.google_translate.prototype = {
		init : function() {
			var areas;
			
			GadgetTemplate.translate(this.GT.content, this.defaultWord);
			areas = this.GT.content.detect('textarea');
			this.tranlateValue = areas.get(0);
			this.translatedBox = areas.get(1);
			this.loading = this.GT.content.detect('p.trans_result').get(0);
			this.GT.content.detect('input[type=button]').get(0).event('click', this.doTranslate, this);
			this.tranlateValue.event('focus', this.setDefaultInit, this)
								.event('blur', this.setDefaultOut, this);
		},
		doTranslate : function(ev) {
			var that = this,
				v = this.tranlateValue.getValue(),
				json;
			
			if (v === '' || v === this.currentWord || v === this.defaultWord) {
				return;
			}
			this.loading.addClass('trans_loading');
			FL.ajax.post('gadget_ajax/gadget_do_translate/' + FL.config.item('sz_token'), {
				param : this.GT.content.detect('form').get(0).serialize(),
				error : function() { alert('翻訳に失敗しました。'); },
				success : function(resp) {
					that.loading.removeClass('trans_loading');
					if (resp.reponseText === 'error' || resp.responseText === 'access_denied') {
						alert('翻訳に失敗しました。');
						return;
					}
					//eval('var json=' + resp.responseText);
					json = FL.json.parse(resp.responseText);
					if (!json) {
						alert('翻訳に失敗しました。');
						return;
					}
					if (json.responseStatus && json.responseStatus == 200) {
						that.translatedBox.setValue(json.responseData.translatedText);
					} else {
						alert('翻訳に失敗しました。');
					}
				}
			});
		},
		setDefaultInit : function(ev) {
			var v = ev.target.value;
			
			if (v === this.defaultWord) {
				ev.target.value = '';
				DOM(ev.target).removeClass('default_value');
			}
		},
		setDefaultOut : function(ev) {
			var v = ev.target.value;
			
			if (v === this.defaultWord || v === '') {
				ev.target.value = this.defaultWord;
				DOM(ev.target).addClass('default_value');
			}
		}
	};

	// wikipedia gadget
	_gadget.wikipedia.prototype = {
		init : function() {
			var areas;
			
			GadgetTemplate.wikipedia(this.GT.content, this.defaultWord);
			areas = this.GT.content.detect('input[type=text]');
			this.GT.content.getOne('form').event('submit', function(ev) {
				ev.preventDefault();
				this.requestWiki(ev);
			}, this);
			this.wikiValue = areas.get(0);
			this.resultBox = this.GT.content.detect('div').get(0);
			this.loading = this.GT.content.detect('p.wiki_result').get(0);
			this.GT.content.detect('input[type=button]').get(0).event('click', this.requestWiki, this);
			this.wikiValue.event('focus', this.setDefaultInit, this)
								.event('blur', this.setDefaultOut, this);
		},
		requestWiki : function(ev) {
			var that = this, url,
				v = this.wikiValue.getValue(),
				enc = window.encodeURIComponent;
			
			if (v === '' || v === this.currentWord || v === this.defaultWord) {
				return;
			}
			this.loading.addClass('wiki_loading');
			// build jsonp url
			url = 'http://wikipedia.simpleapi.net/api?keyword=' + enc(v) + '&output=json';
			FL.ajax.jsonp(url, this.callback, this);
		},
		callback : function(obj) {
			var n;
			
			if (obj === null) {
				n = this.loading.removeClass('wiki_loading')
							.last()
							.html('ヒットしませんでした。');
				setTimeout(function() {
					n.html('');
				}, 2000);
				return;
			}
			if (!obj) {
				alert('データの取得に失敗しました:gadget:wikipedia');
				return;
			}
			this.loading.removeClass('wiki_loading')
							.last()
							.html('');
			this.resultBox.html(obj[0].body);
		},
		setDefaultInit : function(ev) {
			var v = ev.target.value;
			
			if (v === this.defaultWord) {
				ev.target.value = '';
				DOM(ev.target).removeClass('default_value');
			}
		},
		setDefaultOut : function(ev) {
			var v = ev.target.value;
			
			if (v === this.defaultWord || v === '') {
				ev.target.value = this.defaultWord;
				DOM(ev.target).addClass('default_value');
			}
		}
	};

	// move scope to Global window
	window.Gadget = _gadget;
	this.gadget = _gadget;

	/**
	 * ====================================================================================================
	 * setTarget
	 * change or preset gadget settarget
	 * @access public
	 * @param HTMLElement elm
	 * @return void
	 * ====================================================================================================
	 */
	this.setTarget = function(elm) {
		target = DOM(elm);
	}

	/**
	 * ====================================================================================================
	 * init
	 * initialize gadgets
	 * @access public
	 * @parm HTMLElement elm,
	 * @param bool checkHide
	 * @return void
	 * ====================================================================================================
	 */
	this.init = function(elm, checkHide) {
		var errorStack = [], gs, times = 0, g, len, i = 0;
		
		target = DOM(elm);
		globalCheck = checkHide || false;
		
		FL.load.css('fl_gadgets');
		FL.ajax.get(FL.config.siteUrl() + 'gadget_ajax/load_gadgets/' + FL.config.item('sz_token'), {
			error : function() { alert('ガジェットの取得に失敗しました。'); },
			success : function(resp) {
				if (resp.responseText === 'none') {
					if (checkHide === true) {
						target.html(([
						              '<p>使用しているガジェットはありません。<br />',
						              '<a href="', FL.config.siteUrl(), 'dashboard/gadget">ユーザーツール設定</a>',
						                'から使用ガジェットの設定が行えます。</p>'
						              ]).join(''));
					}
					return;
				}
				//eval('var gs=' + resp.responseText);
				try {
					gs = FL.json.parse(resp.responseText);
				} catch(e) {
					gs = false;
				}
				if (!gs) {
					alert('ガジェットの取得に失敗しました。');
					return;
				}
				len = gs.gadget.length;
				for (i; i < len; i++) {
					g = gs.gadget[i];
					if (Gadget[g.gadget_name]) {
						gadgetStack.push(new Gadget[g.gadget_name](g));
						if (++times < gs.count) {
							GadgetTemplate.insertSeparator();
						}
					} else {
						errorStack.push(g.gadget_name + 'のガジェットは定義されていません！');
					}
				}
				if (errorStack.length > 0) {
					alert(errorStack.join('\n'));
				}

				sortHandle = new Module.sortable({
						handleClass : 'fl_gadget_bar',
						callback : refreshSeparator,
						copyDrag : false,
						doCallback : true
					});

				// gadget mouse reize evenst
				target.detect('div.fl_gadget_separator').foreach(function() {
					new Gadget._resizeable(this);
				});
			}
		});
	};
	
	/**
	 * ====================================================================================================
	 * setShowFlag
	 * update timer guard flag change
	 * @access public
	 * @parm boolean flag,
	 * @return void
	 * ====================================================================================================
	 */
	this.setShowFlag = function(flag) {
		guardFlag = flag;
	};
});

