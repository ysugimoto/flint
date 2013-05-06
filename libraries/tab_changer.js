/**
 *
 */
ClassExtend('Library', function tab_changer() {

	var FL = getInstance(), DOM = FL.DOM;

	var param = {
			tabClass : 'tabs',
			boxClass : 'tab_content',
			activeClass : 'active',
			initial : 0,
			onchange : null
	};

	this.setParams = function(hash) {
		param = FL.union(param, hash || {});
	};

	this.setUp = function(hash) {
		if (hash && FL.ut.isObject(hash)) {
			this.setParams(hash);
		}

		// detect tabs and contentBoxes
		var tab = DOM('a.' + param.tabClass),
			box = DOM('div.' + param.boxClass),
			handle;
		
		if (tab.length !== box.length) {
			throw Error('invalid tab-box count!');
			return false;
		}

		handle = new TabChanger(tab, box, param.activeClass, param.onchange, param.initial);

		// reset parameter
		param = {
			tabClass : 'tabs',
			boxClass : 'tab_content',
			activeClass : 'active',
			onchange : null
		};

		return handle;

	}
	

	/** inner TabChanger class **/
	function TabChanger(tab, box, ac, oc, initial) {
		this.tab = tab;
		this.box = box;
		this.initialActive = initial;
		this.activeClass = ac;
		this.hook = oc || null;
		this.currentTab;
		this.currentBox;
		this.actives = {};
		this.detectActives();
		this.init();
	}
	TabChanger.prototype = {
		detectActives : function() {
			var ac = this.activeClass, acv = this.actives,
				b = this.box, initial = this.initialActive;

			this.tab.foreach(function(num) {
				if (num === initial) {
					acv.tab = DOM(this).addClass('active');
					acv.box = b.get(num);
				} else {
					b.get(num).hide();
				}
				DOM(this).prop('__tabNum', num + 1);
			});

			if (!acv.tab) { acv.tab = this.tab.get(initial); }
			if (!acv.box) { acv.box = b.get(initial); }

			this.actives = acv;

		},
		init : function() {
			var that = this;

			this.tab.event('click', that.__handleTab, this);
		},
		changeTab : function(num) {
			var ac = this.activeClass, acv = this.actives, bt ,bb;

			if (acv.tab.prop('__tabNum') == num) { return; }

			bt = acv.tab.removeClass(ac);
			bb = acv.box.hide();

			acv.tab = this.tab.get(num - 1).addClass(ac);
			acv.box = this.box.get(num - 1).show();

			if (FL.ut.isFunction(this.hook)) {
				this.hook({
					fromTab : bt,
					fromBox : bb,
					toTab   : acv.tab,
					toBox   : acv.box
				});
			}
		},
		__handleTab : function(ev) {
			//ev.preventDefault();
			this.changeTab(DOM(ev.currentTarget).prop('__tabNum'));
		},
		addTabs : function(tab, box) {
			var f1 = false,
				f2 = false,
				t = DOM(tab).get(),
				b = DOM(box).get();
			
			this.tab.foreach(function() {
				if (this === t) {
					f1 = true;
					return false;
				}
			});
			this.box.foreach(function() {
				if (this === b) {
					f2 = true;
					return false;
				}
			});
			if (f1 || f2) {
				return;
			}
			this.tab.nodeList.push(t);
			t.__tabNum = ++this.tab.length;
			DOM(tab).event('click', this.__handleTab, this);
			
			this.box.nodeList.push(b);
			++this.box.length;
		}
	};
});