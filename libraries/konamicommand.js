/**
 * @author sugimoto
 */
ClassExtend('Library',
function konamicommand() {
	var pointer = 0, thisClass = this, FL = getInstance();
	var keyNames = ('38,38,40,40,37,39,37,39,98,97').split(',');

	var catchKeyCode = function (ev) {
		var evt = ev || window.event;
		var key = (evt.keyCode) ? evt.keyCode : evt.charCode;
		if (key == 13) {
			if (pointer == keyNames.length) {
				thisClass.complete();
			}
			pointer = 0;
			return;
		}
		else if (key == keyNames[pointer]) {
			pointer++;
		}
		else {
			pointer = 0;
		}
	}
	this.complete = function() {
		alert('フルパワーアップ！');
	}
	this.setUp = function(fn) {
		if(fn && FL.ut.isFunction(fn)) {
			this.complete = fn;
		}
		FL.event.set(document, 'keypress', catchKeyCode);
	}

});