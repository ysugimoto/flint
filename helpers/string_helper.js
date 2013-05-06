/**
*flint string_helper.js
*this helper applies some string utility function
*@author Yoshiaki Sugimoto <neo.yoshiakisugimoto@gmail.com>
*@create 2009/12/21
*/

(function(){
	var FL = getInstance(), Helper = FL.config.getGlobal('Helper');
	if (!functionExists('clean')) {
		Helper.clean = function(str, bool) {
			var quoteMode = (isScript) ? isScript : true;
			if (typeof str == 'object') {
				for (var i in str) {
					str[i] = arguments.callee(str[i], isScript);
				};
				return str;
			};
			if (quoteMode) {
				str = str.replace(/<script>(.*?)<\/script>/ig, '[removedtag]$1[removedtag]');
				str = str.replace(/javascript:/ig, '[removedprotocol]');
			};
			// String.replaceは引数に関数を与えるよりも、逐一呼び出したほうが関数呼び出しコストが下がり高速である
			str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\'/g, '&#039;');
			return str;
		};
	}

	if (!functionExists('randomString')) {
		Helper.randomString = function(type, length) {
			var t = (type) ? type : 'alnum', len = (length) ? length : 8, strArr, res = [];
			switch (t) {
			case 'alnum': strArr = ['0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']; break;
			case 'alpha': strArr =  ['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']; break;
			case 'numeric': strArr = ['0123456789']; break;
			case 'nonzero': strArr = ['123456789']; break;
			};
			for (var i = 0; i < len; i++) res[res.length] = strArr[Math.round(Math.random() * strArr.length)];
			return res.join('');
		};
	}
})()
