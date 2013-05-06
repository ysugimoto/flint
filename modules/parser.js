/**
* Flint Parser Module
* multi Parser Class
* @author Yoshiaki Sugimoto <neo.yoshiaki.sugimoto@gmail.com>
* @create 2010/01/24
*/

(function() {
	var FL = getInstance(), Module = FL.Module, doc = document, win = window;
	var IE = FL.ua.IE ? 'IE' : '', isAC = !!win.ActiveXObject;

	// main Class
	var Parser = function() {
		this.__construct();
	};

	Parser.prototype = {
		// __construct - コンストラクタ
		__construct : function() {
			this.XSLTParameters = [];
			this.XSLTProc = isAC ? new ActiveXObject("Msxml2.XSLTemplate") : new XSLTProcessor();
		},
		// XSLTTransform - XSLTファイルをXMLファイルに適用
		// @param String xml - ロードするXMLファイル
		//               String xslt - ロードするXSLTファイル
		//               Boolean toDOM - 返り値をDOMとして受け取るかどうか
		//                                   true : 返却値はDOM
		//                                   false : 返却値はString (Default)
		XSLTTransform : function(xml, xslt, toDOM) {
			return this['__transform' + IE](xml, xslt, toDOM || false);
		},
		// __transform - IE以外のブラウザ用オブジェクト生成
		__transform : function(xml, xslt, toDOM) {
			this.XSLTProc.reset();
			var xmlD = doc.implementation.createDocument('', '', null);
			var xsltD = doc.implementation.createDocument('', '', null);
			xmlD.async = false; xsltD.async = false;
			xmlD.load(xml);
			xsltD.load(xslt);
			this.XSLTProc.importStylesheet(xsltD);
			this.__setParameter(this.XSLTProc);
			var ret = this.XSLTProc.transformToDocument(xmlD, xsltD);
			return (toDOM) ? ret : (new XMLSerializer()).serializeToString(ret);
			//return {xml : xml, xslt : xslt};
		},
		// __transformIE - IE用オブジェクト生成
		__transformIE : function(xml, xslt, toDOM) {
			var xmlD = new ActiveXObject('Microsoft.XMLDOM');
			var xsltD = new ActiveXObject("Msxml2.FreeThreadedDOMDocument");
			xmlD.async = false; xsltD.async = false;
			xmlD.load(xml);
			xsltD.load(xslt);
			var ret = xmlD.transformNode(xsltD);
			return this.__createReturn(ret, xmlD, xsltD, toDOM);
		},
		// __createReturn - IE用返却値をDOMかStringかで変更する
		__createReturn : function(ret, xml, xslt, toDOM) {
			this.XSLTProc = new ActiveXObject("Msxml2.XSLTemplate"); // reset by create
			this.XSLTProc.stylesheet = xslt;
			var xsltProc = this.XSLTProc.createProcessor();
			xsltProc.input = xml;
			this.__setParameter(xsltProc);
			xsltProc.transform;
			if (toDOM) {
				var x = new ActiveXObject('Microsoft.XMLDOM');
				x.async = false;
				x.loadXML(xsltProc.output);
				return x;
			} else {
				return xsltProc.output;
			}
		},
		// __setParameter - XSLT変換時のパラメータがあればセット
		__setParameter : function(proc) {
			if (this.XSLTParameters.length > 0) {
				var p = this.XSLTParameters, len = p.length, i = 0;
				for (i; i < len; i++) {
					isAC ? proc.addParameter(p[0], p[1]) : proc.setParameter(null, p[0], p[1]);
				}
			}
		},
		// XML2String - XMLドキュメントを文字列に変換
		// @param - xmlDocument xml - 入力XMLドキュメント
		XML2String : function(xml) {
			if (FL.ut.isString(xml)) return xml;
			if (isAC) return xml.xml;
			else if (win.XMLSerializer) {
				return (new XMLSerializer()).serializeToString(xml);
			} else {
				throw new TypeError('can\'t convert to String in this userAgent');
			}
		},
		// XML2JSON - XMLドキュメントをJSONに変換
		// @ param mixed xml - 入力XMLドキュメント(xmlDoc or String)
		// @ note 引数xmlがStringの場合はドキュメントにビルドするが処理時間が増えるので注意
		XML2JSON : function(xml) {
			var xmlDoc;
			if (FL.ut.isString(xml)) {
				if (isAC) {
					var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
					xmlDoc.async = false;
					xmlDoc.loadXML(xml);
				}
				else if (win.DOMParser) xmlDoc =  (new DOMParser()).parseFromString(xml, "application/xml");
				else throw new TypeError('can\'t convert to String in this userAgent');
			} else { xmlDoc = xml;}
			var xml = xmlDoc.documentElement, nlReg = /[\s|\t|\n]/g;

			function loopParse(obj) {
				var res = {}, cacheTag = {}, ob = {}, att = obj.attributes, attlen = att.length, obclen = obj.childNodes.length;
				if (att !== null && attlen > 0) {
					for (var a = 0; a < attlen; a++) ob[att[a].nodeName.toLowerCase()] = att[a].nodeValue;
					res['_attr'] = ob;
				}
				for (var i = 0; i < obclen; i++) {
					var ch = obj.childNodes[i];
					if (ch.nodeType === 3) {
						if (ch.nodeValue.replace(nlReg,  '') === '' || ch.nodeValue === null) continue;
						else return ch.nodeValue;
					} else if (ch.nodeType === 1) {
						(ch.tagName in cacheTag) ? cacheTag[ch.tagName].push(arguments.callee(ch)) : cacheTag[ch.tagName] = [arguments.callee(ch)];
					}
				}
				for (var p in cacheTag)(FL.ut.isArray(cacheTag[p]) && cacheTag[p].length === 1) ? res[p] = cacheTag[p][0] : res[p] = cacheTag[p];
				return res;
			};
			return loopParse(xmlDoc);
		},
		// CSV2Array - CSV文字列を配列に変換
		// @param String csv - 入力CSV文字列
		//                Boolean first - 1行目のカラムをスキップするかどうか default false
		//                String nl - 改行文字 default [n]
		//                String delimiter - カラムの区切り文字 default [,]
		//                String escapable - エスケープ文字 default ["]
		CSV2Array : function(csv, first, nl, delimiter, escapable) {
			var d = delimiter || ',', e = escapable || '"', sk = first || false, res = [], esc, c, len,
				nl = (nl === 'r') ? /\r/ : (nl === 'rn') ? /\r\n/ : /\n/;
			c = csv.split(nl);
			c.pop(); // 末尾は必ず空白となるので削除
			len = c.length;
			for (var i = 0; i < len; i++) {
				if (first && i === 0) continue;
				res.push(c[i].replace(e, '').split(d));
			}
			return res;
		},
		// String2JSON - 文字列をJSONに変換
		String2JSON : function(str, rev) {
			return FL.JSON.parse(str, rev);
		},
		// JSON2String - JSONを文字列に変換
		JSON2String : function(json, rep, sp) {
			return FL.JSON.stringify(json, rep, sp);
		}
	};
	Module.attach({parser : new Parser()});
	Module.onReady('parser');
})();