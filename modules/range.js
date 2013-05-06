/**
* Range Module - クロスブラウザでのRengeオブジェクトの生成
* @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
* @create 2009/11/27
*
* TODO : Control Rangeの機能を追加
**/

function  Range() {
	var FL = getInstance(), r, doc = document, win = window;

	this.__rangeType; // for IE ('Control or Text')

	// 現在の選択範囲の取得
	if (FL.ua.IE) {
		if (doc.selection.type == 'Control') return alert('選択範囲の取得に失敗'); // not Impl.
		else if (!doc.selection.type) return; // not selected.
		r = doc.selection.createRange();
	} else {
		r = win.getSelection();
	};
	if (!r) return;
	this.current = r;
	this.__FL = FL;
}

Range.prototype = {
	getText  : function() {
		return (this.__FL.ua.IE) ? this.current.text : this.current.getRangeAt(0).cloneContents().textContent; /* for Mozilla*/
	},
	getHTML : function() {
		if (this.__FL.ua.IE) return this.current.htmlText;
		var c = this.current.getRangeAt(0).cloneContents(), wrap = document.createElement('div');
		wrap.appendChild(c);
		return wrap.innerHTML;
	},
	count : function() {
		var c = this.current.getRangeAt(0).cloneContents(), list = c.childNodes.length;
		for (var i = 0; i < list; i ++) {
			var e = c.childNodes;
			if (e[i].nodeType)alert(e[i].nodeType);
		};
	},
	wrapHTML : function(tag) {
		var wrap, doc = document, outer = doc.createElement('div');
		if (tag.nodeType && tag.nodeType === 1) wrap = tag;
		else if (typeof tag == 'string') wrap = doc.createElement(tag);
		else throw Error('first argument of wrapHTML() must be Element or tagname.');
		if (this.__FL.ua.IE) {
			wrap.innerHTML = this.current.htmlText;
			outer.appendChild(wrap);
			try {
				this.current.pasteHTML(outer.innerHTML);
			} catch(e) {
				throw e;
			};
		} else {
			var r = this.current.getRangeAt(0);
			try {
				r.surroundContents(wrap);
			} catch (e) {
				alert('選択範囲に閉じられていないタグが存在します。');
			};
		};
	}
};