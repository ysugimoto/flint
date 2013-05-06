/**
*flint profiler class
*システムの実行時間、ロードされたコントローラ、DOMツリー確認、コンソール等の機能を追加
*このクラスは公開時にはオフにしてください。（設定にてuseProfier : falseにする）
*@author : Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
*@create 2009/12/22
*/

(function() {
	var FL = getInstance(), win = window, doc = document, SYSTEM = FL.system;
	var DOM = FL.config.getGlobal('DOM'), Animation = FL.config.getGlobal('Animation');
	var Module = FL.config.getGlobal('Module');
	FL.load.css('flint_profiler');
	//modules.profiler - プロファイラークラス定義
	var Profiler = function() {
		this.layer = null;
		this.box = DOM.create('div', {id : 'fl_profiler_box'}).hide();
		if (FL.ua.IE6) {
			this.box.addStyle('height', doc.body.offsetHeight * 90 / 100 + 'px');
		}
		var wrap = DOM.create('div', {'class' : 'fl_profiler_wrapper'}).appendTo(this.box);

		// 20100205 added 各項目をタブ切り替え
		this.tab = DOM.create('ul', {'id' : 'fl_profiler_tabs'}).appendTo(wrap);
		var tabInner = '<li class="system_tab"><a href="javascript:void(0)" class="active">system&nbsp;info</a></li><li class="domtree_tab"><a href="javascript:void(0)">current&nbsp;document&nbsp;tree</a></li><li class="log_tab"><a href="javascript:void(0)">logs</a></li>';
		this.tab.html(tabInner);
		this.systemBox = DOM.create('div', {'class' : 'profiler_section tab_sys'}).appendTo(wrap);
		this.domtreeBox = DOM.create('div', {'class' : 'profiler_section tab_dt'}).appendTo(wrap).hide();
		this.logBox = DOM.create('div', {'class' : 'profiler_section tab_log'}).appendTo(wrap).hide();
		var cap = DOM.create('p', {'class' : 'fl_profiler_caption'}).appendTo(this.systemBox).inText('SYSTEM EXECUTE TIME');
		this.sysTable = DOM.create('div', {'class' : 'fl_profiler_system'}).appendTo(this.systemBox);
		cap.copy(true).appendTo(this.systemBox).inText('BENCH MARKS');
		this.benchMarks = DOM.create('div', {'class' : 'fl_profiler_bench'}).appendTo(this.systemBox);
		//this.treeBtn = DOM.create('a', {'class' : 'fl_domtree_opener'}).appendTo(this.box).inText('DOMTree').attr('href', 'javascript:void(0)');
		cap.copy(true).appendTo(this.domtreeBox).inText('CURRENT DOCUMENT TREE');
		this.domTree = DOM.create('div', {'class' : 'fl_profiler_tree'}).appendTo(this.domtreeBox);
		this.profileBtn = DOM.create('div', {'class' : 'fl_profiler_opener'}).html('<a href="javascript:void(0)" id="fl_profiler_opener_btn">profile</a>&nbsp;|&nbsp;<a href="javascript:void(0)" id="fl_profiler_console_btn">console</a>');
		this.treeWrapper = DOM.create('ul').appendTo(this.domTree);
		this.showFlag = false;
		this.treeShowFlag = false;
		this.consoleFlag = false;
		if (FL.ua.IE6){ this.consoleScFlag = false; this.boxScFlag = false;}
		cap.copy(true).appendTo(this.logBox).inText('APPLICATION LOG');
		this.log = DOM.create('div', {'class' : 'fl_profiler_log', id : 'fl_logging'}).appendTo(this.logBox);
		this.console = DOM.create('div', {id : 'fl_profiler_console'});
		this.cnt = DOM.create('textarea', {id : 'fl_profiler_console_value'}).appendTo(this.console);
		this.cntExecute = DOM.create('input', {type : 'button', id : 'fl_profiler_consle_execute', value : 'execute'}).appendTo(this.console);
		/*
		 * DOM構築完了、システム準備完了、ウインドウロード完了でプロファイル実行
		 */
		var that = this;
		if (FL.system.WINDOW_LOADED === true) {
			that.init();
		} else {
			FL.event.set(win, 'load', that.init, that);
		}
		// logging関数定義
		FL.alias('log', this.logging);
	};
	Profiler.prototype = {
		// window.onloadのタイミングでappend
		init : function() {
			this.layer = new Module.layer();
			this.createSystemData();
			//var page = FL.ut.getPageSize();
			this.box.appendTo();
			this.profileBtn.appendTo();
			this.console.appendTo();
			this.current = this.systemBox; this.currentTab = this.tab.detect('a').get(0, true);
//			FL.ut.positionFix(this.profileBtn);
			this.showBtn = DOM.id('fl_profiler_opener_btn');
			this.consoleBtn = DOM.id('fl_profiler_console_btn');
			for (var i in SYSTEM.BENCH_MARKS) {
				this.benchMarks.html(i + ' : ' + SYSTEM.BENCH_MARKS[i] + '<br />', 'after');
			}
			FL.event.set(this.showBtn.get(), 'click', this.toggleShow, this);
			FL.event.set(doc, 'keydown', this.keyBind, this);
			//FL.event.set(this.treeBtn.get(), 'click', this.showTree, this);
			FL.event.set(this.tab.get(), 'click', this.tabChange, this);
			FL.event.set(this.consoleBtn.get(), 'click', this.consoleToggleShow, this);

			// logging
			FL.event.set(doc, 'AjaxEnd', this.insertAjaxLog, this);
		},
		// タブ切り替え
		tabChange : function(ev) {
			ev.stopPropagation();
			var e = DOM(ev.target), p = e.parent(), cl, t, target;
			if (e.tag !== 'a' || p.tag !== 'li' || p.readAttr('class').indexOf('_tab') === -1) { return;}
			cl = p.readAttr('class'); target = cl.slice(0, cl.indexOf('_tab')); t = this[target + 'Box'];
			if (!t) { return;}
			this.current.hide(); this.currentTab.removeClass('active');
			t.show(); e.addClass('active');
			this.current = t; this.currentTab = e;
			if (target === 'domtree' &&!this.treeShowFlag) { this.showTree();}
		},
		// キーイベントハンドリング
		keyBind : function(ev) {
			var key = ev.keyCode;
			if (key == 27) {
				ev.preventDefault();
				ev.stopPropagation();
				this.toggleShow();
			}else if (key == 67 && ev.ctrlKey === true) {
				ev.preventDefault();
				ev.stopPropagation();
				this.consoleToggleShow();
			};
		},
		// Profiler表示切り替え
		toggleShow : function() {
			if (this.showFlag === false) {
				this.layer.show();
				this.box.show();
				if (FL.ua.IE6) {
//					var sc = FL.ut.getScrollPosition();
					this.box.addStyle('top', 40 + 'px');
					//var dim = this.box.absDimension();
					//if (this.boxScFlag === false) {
					//	Core.utility.positionFix(this.box);
					//	this.boxScFlag = true;
					//};
				};
				this.showBtn.addStyle('color', '#fc0');
				this.showFlag = true;
			} else {
				this.layer.hide();
				this.box.hide();
				this.showBtn.addStyle('color', '#fff');
				this.showFlag = false;
			};
		},
		// console表示切替
		consoleToggleShow : function() {
			if (this.consoleFlag === false) {
				this.console.show();
				if (FL.ua.IE6) {
					this.console.addStyle('top', this.profileBtn.absDimension().bottom + 30 + 'px');
					if (this.consoleScFlag === false) {
//						FL.ut.positionFix(this.console);
						this.consoleScFlag = true;
					};
				};
				FL.event.set(this.cntExecute.get(), 'click', this.consoleDo, this);
				this.consoleBtn.addStyle('color', '#fc0');
				DOM.id('fl_profiler_console_value').get().focus();
				this.consoleFlag = true;
			} else {
				this.console.hide();
				FL.event.remove(this.cntExecute.get(), 'click', this.consoleDo);
				this.consoleBtn.addStyle('color', '#fff');
				this.consoleFlag = false;
			};
		},
		// console実行
		consoleDo : function() {
			var val = DOM.id('fl_profiler_console_value').getValue();
			if (!val || val == '' && (/\S/.test(val) === false)) return;
			// グローバルラインで<script>生成
			var s = doc.createElement('script'), h = doc.getElementsByTagName('head')[0];
			// IE6はscriptの中身をtextNodeでは認識しないのでtextプロパティで代替
			if (FL.ua.IE) s.text = val;
			else s.appendChild(doc.createTextNode(val));
			// 一時的にグローバルでevalする
			h.insertBefore(s, h.firstChild);
			h.removeChild(s);
			//this.logging(val);
			DOM.id('fl_profiler_console_value').get().focus();
		},
		// Ajax Log
		insertAjaxLog : function(ev) {
			var x = ev.target, d = ev.data, log = [], p = ev.params;
			// create log string
			log[0] = '<p>';
			log[1] = 'Requested by ' + ((!FL.ua.IE6) ? 'XMLHttpRequest' : 'ActiveX');
			log[2] = 'Result status : ' + x.status + ' [ ' + SYSTEM.XHR_RESPONSES.STATUS[x.status] + ' ]';
			//log[3] = 'Send Parameter : ' + (p.param !== '') ? p.param.split('&').join('').split('=').join(' : ') : '';
			log[4] = 'ResponseHeader : ' + x.getAllResponseHeaders().replace(/\n/, '<br />');
			if (d) {
				log[5] = 'ResponseBody : ' + (d && d !== null) ? FL.ut.clean(d.responseText) : 'NULL';
			}
			log[6] = '</p>';
			this.logging(log.join('<br />'));
		},
		// logging関数
		logging : function(data) {
			if (FL.ut.isString(data)) { DOM.id('fl_logging').html(data + '<br /><hr />' + ' ', 'after');}
			else if (FL.ut.isObject(data)) { DOM.id('fl_logging').html(FL.JSON.stringify(data) + '<br /><hr />' + ' ', 'after');}
			else if (FL.ut.isArray(data)) { DOM.id('fl_logging').html(data.join(' ') + '<br /><hr />' + ' ', 'after');}
		},
		// domTreeの状態を表示
		showTree : function() {
			if (this.treeShowFlag === false) {
				this.domTree.addClass('fl_loading').addStyle('visibility', 'visible');
				var dom = this.__domToTree(doc.getElementsByTagName('html')[0]);
				this.treeWrapper.append(dom);
				this.domTree.removeClass('fl_loading').append(this.treeWrapper);
				FL.event.set(this.treeWrapper.get(), 'click', this.__toggleTreeElement, this);
				this.treeShowFlag = true;
			} else {
				FL.event.remove(this.treeWrapper.get(), 'click', this.__toggleTreeElement);
				this.domTree.addStyle('visibility', 'hidden');
				this.treeWrapper.html('');
				this.treeShowFlag = false;
			};
		},
		// システムデータ表示Table生成
		createSystemData : function() {
			var html =['<table class="fl_profiler_system_table"><tbody>'];
			html[1] = '<tr><th>EXECUTE CONTROLLER</th><td>' + SYSTEM.CONTROLLER_NAME + '</td></tr>';
			html[2] = '<tr><th>EXECUTE METHOD</th><td>' + SYSTEM.EXEC_METHOD + '</td></tr>';
			html[3] = '<tr><th>DOM READY TIME</th><td>' + SYSTEM.DOM_CREATE_TIME + '&nbsp;(ms)</td></tr>';
//			html[4] = '<tr><th>SYSTEM READY TIME</th><td>' + SYSTEM.READY_TIME + '&nbsp;(ms)</td></tr>';
			html[5] = '<tr><th>WINDOW ONLOAD TIME</th><td>' + SYSTEM.WINDOW_LOADED_TIME + '&nbsp;(ms)</td></tr>';
			html[6] = '</tbody></table>';
			this.sysTable.append(html.join(''));
		},
		// domTreeをリスト化
		__domToTree : function(html) {
			var res = doc.createElement('li'), cacheTag = {}, att = html.attributes, at = [], attlen = att.length, len, ch = html.childNodes;
			var noEndTag = {'input' : 1, 'img' : 1, 'link' : 1, 'meta' : 1, 'br' : 1, 'hr' : 1, 'param' : 1, 'area' : 1, 'embed' : 1, 'isindex' : 1, 'frame' : 1, 'bgsound' : 1};
			if (att != null && attlen > 0) {
				for (var a = 0; a < attlen; a++) {
					if (FL.ua.IE && (att[a].nodeValue == null || att[a].nodeValue == '' || att[a].nodeName.toLowerCase() == 'contenteditable'))continue;
					at.push(att[a].nodeName.toLowerCase() + '="' + ((att[a].nodeName == 'style') ? att[a].nodeValue.toLowerCase() : att[a].nodeValue) + '"');
				};
			}
			if (FL.ua.is('I6|I7') && html.style.cssText != '') {
				at.push('style="' + html.style.cssText.toLowerCase() + '"');
			}
			var htmlchlen = html.childNodes.length;
			for (var i = 0; i < htmlchlen; i++) {
				if (ch[i].nodeType === 3) {
					if (ch[i].nodeValue.replace(/[\s|\t|\n]/g, '') == '' || ch[i].nodeValue == null)continue;
					else ('text' in cacheTag) ? cacheTag['text'].push(ch[i].nodeValue) : cacheTag['text'] = [ch[i].nodeValue];
				}
				else if (ch[i].nodeType === 1)(ch[i].tagName.toLowerCase() in cacheTag) ? cacheTag[ch[i].tagName.toLowerCase()].push(arguments.callee(ch[i])) : cacheTag[ch[i].tagName.toLowerCase()] = [arguments.callee(ch[i])];
			}
			if (at.length == 0) var txt = (html.tagName.toLowerCase() in noEndTag) ? '<' + html.tagName.toLowerCase() +  ' />' : '<' + html.tagName.toLowerCase() +  '>';
			else var txt = (html.tagName.toLowerCase() in noEndTag) ? '<' + html.tagName.toLowerCase() + ' ' + at.join(' ') + ' />' : '<' + html.tagName.toLowerCase() + ' ' + at.join(' ') + '>';
			res.appendChild(doc.createTextNode(txt));
			for (var p in cacheTag) {
				if (p == 'text') {
					var chn = doc.createElement('ul');
					chn.style.display = 'none';
					var l = document.createElement('li');
					var inText = cacheTag['text'].join('').split(/\n/), lenT = inText.length;
					for (var t = 0; t < lenT; t++) {
						if (inText[t].replace(/[\t|\s]/g, '') == '')continue;
						if (/script|style/.test(html.tagName.toLowerCase())) {
							(!FL.ua.IE6) ? l.appendChild(doc.createTextNode(inText[t].replace(/[\t]/g, '　'))) : l.text(inText[t].replace(/[\t]/g, '　'));
						} else {
							l.appendChild(doc.createTextNode(inText[t].replace(/[\t]/g, '')));
						}
						l.appendChild(document.createElement('br'));
					};
					chn.appendChild(l);
				} else {
					if (FL.ut.isArray(cacheTag[p])) {
						var chn = doc.createElement('ul'), lenL = cacheTag[p].length;
						chn.style.display = 'none';
						for (var li = 0;li < lenL; li++) {
							chn.appendChild(cacheTag[p][li]);
						};
					};
				};
				res.appendChild(chn);
				if (res.childNodes.length > 0)res.className = 'attr_inner';
			}
			return res;
		},
		// domTreeの中身表示切替
		__toggleTreeElement : function(ev) {
			var elm = ev.target;
			ev.preventDefault();
			if (elm.tagName.toLowerCase() != 'li' || elm.className == '')return;
			var flag = false, ch = elm.childNodes, len = ch.length;
			for (var i = 0; i < len; i++) {
				if (ch[i].nodeType == 1 && ch[i].tagName.toLowerCase() == 'ul') {
					if (ch[i].style.display == 'block') {
						ch[i].style.display = 'none';
						elm.className = 'attr_inner';
						if (!flag) {
							if (elm.parentNode != null)(elm.parentNode.lastChild == elm) ? elm.parentNode.removeChild(elm.parentNode.lastChild) : elm.parentNode.removeChild(elm.nextSibling);
							flag = true;
						}
						continue;
					} else {
						ch[i].style.display = 'block';
						elm.className = 'attr_inner_close';
						if (!flag) {
							var txt = elm.firstChild.nodeValue;
							var end = doc.createElement('li');
							end.appendChild(doc.createTextNode(txt.replace(/^<([a-z]*?)\s?>??$/, '</$1>').replace(/\s(.*?)$/, '>')));
							(elm.parentNode.lastChild == elm) ? elm.parentNode.appendChild(end) : elm.parentNode.insertBefore(end, elm.nextSibling);
							flag = true;
						}
						continue;
					}
				}
			};
		}
	};
	new Profiler();
})();