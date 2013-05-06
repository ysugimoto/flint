/**
*Flint crypt helper
*this helper supplies some crypt functions.
*use MD5, base64 (encode and decode)
*@author Yoshiaki Sugimoto <neio.yoshiaki.sugimoto@gmail.com>
*@create 2009/12/25
*Refered to Md5.js(http://www.onicos.com/staff/iz/amuse/javascript/expert/md5.txt) thanks!
*Refered to http://user1.matsumoto.ne.jp/~goma/js/md5.js thanks!
*/

(function(){
	var FL = getInstance(), Helper = FL.config.getGlobal('Helper');

	if ( ! functionExists('md5')) {
		// Helper.md5 md5でハッシュ変換した16進数を得る
		Helper.md5 = function(str) {
			if (typeof str != 'string') {
				throw Error('first argument must be String!');
				return '';
			}
			var data = MD5.packToArray(str);
			data = MD5.paddingBit(data);
			var rounded = MD5.roundFunc(data);
			var res = '', len = rounded.length;
			for (var i = 0; i < len; i++) {
				res += (rounded[i] > 0xf ? '' : '0')+ rounded[i].toString(16);
			}
			return res;
		};

		// MD5 - md5計算用内部メソッド格納オブジェクト
		var MD5 = {
			byteLength : 64,
			state : [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476],
			// packToArray - 文字列をビット配列に変換
			packToArray : function(str /* String */) {
				var res = [], code, len = str.length;
				for (var i =0, n = 0; i < len; i++) {
					code = str.charCodeAt(i);
					if (code <= 0xff) { res[n++] = code;}
					else {
						res[n++] = code >>> 8;
						res[n++] = code & 0xff;
					}
				}
				return res;
			},
			// paddingBit - バイト数を合わせるため、ビットを詰める
			paddingBit : function(str /* Array */) {
				var len = str.length, n = len, padding1, padding2;
				// 1を詰める
				str[n++] = 0x80;
				while (n % MD5.byteLength != 56) {
					str[n++] = 0;
				}
				len = len * 8;
				padding1 = MD5.fromLittleEndian32bit([len]);
				padding2 = [0, 0, 0, 0];
				return str.concat(padding1, padding2);
			},
			// toLittleEndian32bit - 下位32ビットから結合
			toLittleEndian32bit : function(str /* Array */) {
				var res = [], len = str.length, n = 0;
				for (var i = 0; i < len; i += 4, n++) {
					res[n] = (str[i + 3] << 24) | (str[i + 2] << 16) | (str[i + 1] << 8) | str[i];
				}
				return res;
			},
			fromLittleEndian32bit : function(str /* Array */) {
				var res = [], len = str.length, n = 0;
				for (var i = 0; i < len; i++) {
					res[n++] = str[i] & 0xff;
					res[n++] = (str[i] >>> 8) & 0xff;
					res[n++] = (str[i] >>> 16) & 0xff;
					res[n++] = (str[i] >>> 24) & 0xff;
				}
				return res;
			},
			// roundFunc - アルゴリズムに基づき計算
			roundFunc : function(str /* Array */) {
				var st = [MD5.state[0], MD5.state[1], MD5.state[2], MD5.state[3]];
				var tmp, x, tmpState = [], len = str.length, round;
				for (var i = 0; i < len; i+= MD5.byteLength) {
					for (var l = 0; l < 4; l++) {
						tmpState[l] = st[l];
					}
					x = MD5.toLittleEndian32bit(str.slice(i, i + MD5.byteLength));
					for (var k = 0; k < 64; k++) {
						if (k < 16) {
							tmp = (st[1] & st[2]) | (~st[1] & st[3]);  //F
						} else if (k < 32) {
							tmp = (st[1] & st[3]) | (st[2] & ~st[3]); // G
						} else if (k < 48) {
							tmp = st[1] ^ st[2] ^ st[3]; // H
						} else {
							tmp = st[2] ^ (st[1] | ~st[3]); // I
						}
						round = MD5.roundTable[k];
						tmp += x[round[0]] + round[2] + st[0]; // (a + FGHI() + X[k] + T[i])
						st[0] = st[1] + ((tmp << round[1]) | tmp >>> (32 - round[1])); // a = b + ↑
						st = [st[3], st[0], st[1], st[2]];
					}
					for (var m = 0; m < MD5.state.length; m++) {st[m]+= tmpState[m];}
				}
				return MD5.fromLittleEndian32bit(st);
			},
			// roundTable - ハッシュアルゴリズムで使用する値の配列[k, s, T[i]]
			roundTable : [
			 // round_1
			  [0, 7, 0xd76aa478], [1, 12, 0xe8c7b756], [2, 17, 0x242070db], [3, 22, 0xc1bdceee],
			  [4, 7, 0xf57c0faf], [5, 12, 0x4787c62a], [6, 17, 0xa8304613], [7, 22, 0xfd469501],
			  [8, 7, 0x698098d8], [9, 12, 0x8b44f7af], [10, 17, 0xffff5bb1], [11, 22, 0x895cd7be],
			  [12, 7, 0x6b901122], [13, 12, 0xfd987193], [14, 17, 0xa679438e], [15, 22, 0x49b40821],
			// round_2
			  [1, 5, 0xf61e2562], [6, 9, 0xc040b340], [11, 14, 0x265e5a51], [0, 20, 0xe9b6c7aa],
			  [5, 5, 0xd62f105d], [10, 9, 0x2441453], [15, 14, 0xd8a1e681], [4, 20, 0xe7d3fbc8],
			  [9, 5, 0x21e1cde6], [14, 9, 0xc33707d6], [3, 14, 0xf4d50d87], [8, 20, 0x455a14ed],
			  [13, 5, 0xa9e3e905], [2, 9, 0xfcefa3f8], [7, 14, 0x676f02d9], [12, 20, 0x8d2a4c8a],
			// round_3
			  [5, 4, 0xfffa3942], [8, 11, 0x8771f681], [11, 16, 0x6d9d6122], [14, 23, 0xfde5380c],
			  [1, 4, 0xa4beea44], [4, 11, 0x4bdecfa9], [7, 16, 0xf6bb4b60], [10, 23, 0xbebfbc70],
			  [13, 4, 0x289b7ec6], [0, 11, 0xeaa127fa], [3, 16, 0xd4ef3085], [6, 23, 0x4881d05],
			  [9, 4, 0xd9d4d039], [12, 11, 0xe6db99e5], [15, 16, 0x1fa27cf8], [2, 23, 0xc4ac5665],
			// round_4
			  [0, 6, 0xf4292244], [7, 10, 0x432aff97], [14, 15, 0xab9423a7], [5, 21, 0xfc93a039],
			  [12, 6, 0x655b59c3], [3, 10, 0x8f0ccc92], [10, 15, 0xffeff47d], [1, 21, 0x85845dd1],
			  [8, 6, 0x6fa87e4f], [15, 10, 0xfe2ce6e0], [6, 15, 0xa3014314], [13, 21, 0x4e0811a1],
			  [4, 6, 0xf7537e82], [11, 10, 0xbd3af235], [2, 15, 0x2ad7d2bb], [9, 21, 0xeb86d391]
			]
		};
	}  // end funtionExists if block

	if ( ! functionExists('base64Encode')) {
		// Helper.base64Encode - base64にエンコード
		Helper.base64Encode = function(str) {
			return BASE64.encode(BASE64.packToArray(str));
		};
		Helper.base64Decode = function(str) {
			return BASE64.decode(str);
		};

		// BASE64 - base64変換用ユーティリティオブジェクト
		var BASE64 = {
			chars : 'A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,0,1,2,3,4,5,6,7,8,9,+,/'
		};
		BASE64.base64e = BASE64.chars.split(',');
			var res = [], b64 = BASE64.base64e.join('');
			for (var i = 0, len = BASE64.base64e.length; i < len; i++) {
				res[b64.charAt(i)] = i;
			}
		BASE64.base64d = res;
		BASE64.packToArray = function(str) {
			var res = [], code, len = str.length;
			for (var i =0, n = 0; i < len; i++) {
				code = str.charCodeAt(i);
				if (code <= 0xff) { res[n++] = code;}
				else {
					res[n++] = code >>> 8;
					res[n++] = code & 0xff;
				}
			}
			return res;
		};
		BASE64.encode = function(str /* Array */) {
			var res = [], tmp, len = str.length, pad = len % 3;
			if (pad > 0) {
				while (len % 3 != 0) {
					str[len + 1] = 0x00;
					len++;
				}
			}
			for (var i = 0; i < len; i += 3) {
				tmp = (str[i] << 16 | (str[i + 1] << 8) | str[i + 2]);
				res.push(BASE64.base64e[(tmp >>> 18) & 0x3f], BASE64.base64e[(tmp >>> 12) & 0x3f], BASE64.base64e[(tmp >>> 6) & 0x3f], BASE64.base64e[(tmp & 0x3f)]);
			}
			if (pad > 0) {
				while(pad > 0) {
					res[res.length - 1] = '=';
					pad--;
				}
			}
			return res.join('');
		};
		BASE64.decode = function(str /* encoded */) {
			var b = str.replace(/[^0-9A-Za-z\+\/]/g, ''), pad = b.length % 4, res = [], len = b.length, tmp;
			if (pad > 0) {
				var t = pad;
				while(pad > 0) {
					b += 'A';
					pad--;
				}
				pad = t;
				len = b.length;
			}
			for (var i = 0, j = 0; i < len; i += 4, j += 3) {
				tmp = (BASE64.base64d[b.charAt(i)] << 18) | (BASE64.base64d[b.charAt(i + 1)] << 12) | (BASE64.base64d[b.charAt(i + 2)] << 6) | BASE64.base64d[b.charAt(i + 3)];
				res[j] = tmp >>> 16;
				res[j + 1] = (tmp >>> 8) & 0xff;
				res[j + 2] = tmp & 0xff;
			}
			if (pad > 0) {
				res.splice(res.length - pad, res.length);
			}
			return BASE64.toUTFString(res);
		};
		BASE64.toUTFString = function(arr) {
			var len = arr.length, res = [];
			for (var i = 0; i < len; i++) {
				res.push(String.fromCharCode(arr[i]));
			}
			return res.join('');
		};
	}
	
	! functionExists('sha1') && (function() {
	
	var blockLength          = 64,
	    hashBlockState       = [0x67452301 , 0xefcdab89 , 0x98badcfe , 0x10325476 , 0xc3d2e1f0],
	    hashBlockStateLength = hashBlockState.length,
	    keyTable             = [0x5a827999 , 0x6ed9eba1 , 0x8f1bbcdc , 0xca62c1d6];
	
	function sha1(str) {
		var data = _unpack(str)
		
		data = _paddingBit(data);
		return _encrypt_sha1(data);
	}
	
	// Unicode配列に変換
	function _unpack(str) {
		var len = str.length,
		    i = 0,
		    n = 0,
		    stack = [],
		    ch;
		
		for ( ; i < len; ++i ) {
			ch = str.charCodeAt(i);
			if ( ch <= 0xff ) {
				stack[n++] = ch;
			} else {
				stack[n++] = c >>> 8;
				stack[n++] = c & 0xff;
			}
		}
		return stack;
	}

	// paddingBit - バイト数を合わせるため、ビットを詰める
	function _paddingBit(data) {
		var len = data.length,
	    n = len;
	
	// 1を詰める
		data[n++] = 0x80;
		while (n % blockLength != 56) {
			data[n++] = 0;
		}
		len *=  8;
		return data.concat(0, 0, 0, 0, _fromBigEndian32bit([len]));
	}
	
	function _fromBigEndian32bit(data) {
		var res = [],
		    len = data.length,
		    n = 0,
		    i = 0;
		
		for ( ; i < len; ++i ) {
			res[n++] = (data[i] >>> 24) & 0xff;
			res[n++] = (data[i] >>> 16) & 0xff;
			res[n++] = (data[i] >>> 8) & 0xff;
			res[n++] = data[i] & 0xff;
		}
		return res;
	}
	
	function _toBigEndian32Bit(data) {
		var res = [],
		    i = 0,
		    n = 0,
		    len = data.length;
		
		for ( ; i < len ; i += 4, n++) {
			res[n] = (data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3];
		}
		return res;
	}
	
	function _rotL(v, s) {
		return (v << s) | (v >>> (32 - s));
	}
	
	function _encrypt_sha1(data) {
		var stack    = [],
		    tmpStack = [],
		    x = [],
		    ret = [],
		    i,
		    j,
		    tmp,
		    len = hashBlockStateLength,
		    len2 = data.length;
		    
		for ( j = 0; j < len; j++) {
			stack[j] = hashBlockState[j];
		}
		
		for ( i = 0; i < len2; i += blockLength ) {
			for ( j = 0; j < len; j++ ) {
				tmpStack[j] = stack[j];
			}
			
			x = _toBigEndian32Bit(data.slice(i, i + blockLength));
			
			for ( j = 16; j < 80; j++ ) {
				x[j] = _rotL(x[j - 3] ^ x[j - 8] ^ x[j - 14] ^ x[j - 16], 1);
			}
		
			for ( j = 0; j < 80; j++ ) {
				tmp = ( j < 20 )
				      ? ((stack[1] & stack[2]) ^ (~stack[1] & stack[3])) + keyTable[0]
				      : ( j < 40 )
				        ? (stack[1] ^ stack[2] ^ stack[3]) + keyTable[1]
				        : ( j < 60 )
				          ? ((stack[1] & stack[2]) ^ (stack[1] & stack[3]) ^ (stack[2] & stack[3])) + keyTable[2]
				          : (stack[1] ^ stack[2] ^ stack[3]) + keyTable[3];
				
				tmp += _rotL(stack[0], 5) + x[j] + stack[4];
				stack[4] = stack[3];
				stack[3] = stack[2];
				stack[2] = _rotL(stack[1], 30);
				stack[1] = stack[0];
				stack[0] = tmp;
			}
			for ( j = 0; j < len; j++ )  {
				stack[j] += tmpStack[j];
			}
		}
		
		stack = _fromBigEndian32bit(stack);
		len   = stack.length;
		for ( i = 0; i < len; ++i ) {
			ret[ret.length] = ( stack[i] > 0xf ? '' : '0' ) + stack[i].toString(16);
		}
		return ret.join('');
	}
	Helper.sha1 = sha1;
	})();

})();