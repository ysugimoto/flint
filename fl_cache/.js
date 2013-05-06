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
			this.box.addStyle('height', screen.height / 2 + 'px');
		}
		var wrap = DOM.create('div', {'class' : 'fl_profiler_wrapper'}).appendTo(this.box);
		this.sysTable = DOM.create('div', {'class' : 'fl_profiler_system'}).appendTo(wrap);
		this.treeBtn = DOM.create('a', {'class' : 'fl_domtree_opener'}).appendTo(this.box).inText('DOMTree').attr('href', 'javascript:void(0)');
		this.domTree = DOM.create('div', {'class' : 'fl_profiler_tree'}).appendTo(this.box);
		this.profileBtn = DOM.create('div', {'class' : 'fl_profiler_opener'}).html('<a href="javascript:void(0)" id="fl_profiler_opener_btn">profile</a>&nbsp;|&nbsp;<a href="javascript:void(0)" id="fl_profiler_console_btn">console</a>');
		this.treeWrapper = DOM.create('ul').appendTo(this.domTree);
		this.showFlag = false;
		this.treeShowFlag = false;
		this.consoleFlag = false;
		if (FL.ua.IE6) this.consoleScFlag = false; this.boxScFlag = false;
		this.log = DOM.create('div', {'class' : 'fl_profiler_log', id : 'fl_logging'}).appendTo(wrap);
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
//			FL.ut.positionFix(this.profileBtn);
			this.showBtn = DOM.id('fl_profiler_opener_btn');
			this.consoleBtn = DOM.id('fl_profiler_console_btn');
			FL.event.set(this.showBtn.get(), 'click', this.toggleShow, this);
			FL.event.set(doc, 'keyup', this.keyBind, this);
			FL.event.set(this.treeBtn.get(), 'click', this.showTree, this);
			FL.event.set(this.consoleBtn.get(), 'click', this.consoleToggleShow, this);
		},
		// キーイベントハンドリング
		keyBind : function(ev) {
			ev.preventDefault();
			ev.stopPropagation();
			var key = ev.keyCode;
			if (key == 27) {
				this.toggleShow();
			}else if (key == 9) {
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
		// logging関数
		logging : function(data) {
			DOM.id('fl_logging').inText(FL.ut.uneval(data) + '\n' + ' ', 'after');
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
