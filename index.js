var {Cc, Ci} = require("chrome");

var tabdownloads = {
	init: function() {
		this.windowMediatorService = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
		this.obsService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		this.browserWindows = require("sdk/windows").browserWindows;

		let windowsEnumerator = this.windowMediatorService.getEnumerator("navigator:browser");
		while (windowsEnumerator.hasMoreElements()) {
			let domWindow = windowsEnumerator.getNext().QueryInterface(Ci.nsIDOMWindow);
			let newBrowserDownloadsUI = new this.BrowserDownloadsUI(domWindow);
			newBrowserDownloadsUI.init();
		}
	}
};

tabdownloads.BrowserDownloadsUI = function(window) {
	this._window = window;
	this._original = this._window.BrowserDownloadsUI;
};

tabdownloads.BrowserDownloadsUI.prototype.init = function() {
	tabdownloads.obsService.addObserver(this, "tabdownloads-unload", false);

	let self = this;
	this._window.BrowserDownloadsUI = function() {
		self._window.openUILinkIn("about:downloads", "tab");
	};
};

tabdownloads.BrowserDownloadsUI.prototype.observe = function(aSubject, aTopic, aData) {
	if (aTopic == "tabdownloads-unload") {
		this.uninit();
	}
};

tabdownloads.BrowserDownloadsUI.prototype.uninit = function() {
	this._window.BrowserDownloadsUI = this._original;
	tabdownloads.obsService.removeObserver(this, "tabdownloads-unload");
};

tabdownloads.init();

tabdownloads.browserWindows.on('open', function(window) {
	let domWindow = tabdownloads.windowMediatorService.getMostRecentWindow("navigator:browser");
	let newBrowserDownloadsUI = new tabdownloads.BrowserDownloadsUI(domWindow);
	newBrowserDownloadsUI.init();
});

exports.onUnload = function (reason) {
	tabdownloads.obsService.notifyObservers(null, "tabdownloads-unload", null);
};
