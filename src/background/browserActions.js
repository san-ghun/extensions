import links from './links'
import common from './common'
import config from './config'
var {extension, getCurrentTab, browserName, isNewTabPage, updateTabAndGoToRaindrop} = require('./extension').default

var manifest = require('json!../config/manifest.json');
var popupPath = manifest.browser_action.default_popup;

class BrowserAction {
	constructor() {
		const onMessage = (r, sender, sendResponse)=>{
			switch(r.action){
				case "rerenderBrowserAction":
					this.render();
					return true
		
				case "setStatus":
					getCurrentTab((tab)=>{
						var obj = Object.assign({},r);
						if (!obj.url)
							obj.url = tab.url;
		
						links.setStatus(obj);
						this.render();
					});
					return true
		
				case "appStarted":
					//Inject script
					extension.tabs.executeScript({
						code: 'window.raindropInjectScriptLoaded'
					}, function([alreadyInjected=false]) {
						if (!alreadyInjected)
							extension.tabs.executeScript({
								file: 'inject.js'
							})
					})
		
					links.resetAll();
					return true
			}
		}
		
		const onTabUpdate = (tab)=>{
			setTimeout(this.render, 100)
		}
		
		const onClicked = (tab)=>{
			updateTabAndGoToRaindrop()
		}
		
		if (extension){
			extension.browserAction.onClicked.removeListener(onClicked);
			extension.browserAction.onClicked.addListener(onClicked);
		
			extension.runtime.onMessage.removeListener(onMessage);
			extension.runtime.onMessage.addListener(onMessage);
		
			extension.tabs.onUpdated.removeListener(onTabUpdate);
			extension.tabs.onUpdated.addListener(onTabUpdate);
		
			extension.tabs.onActivated.removeListener(onTabUpdate);
			extension.tabs.onActivated.addListener(onTabUpdate);
		
			//button.initIcons();
			extension.browserAction.setBadgeBackgroundColor({color: '#0087EA'})
			try{
				extension.browserAction.setBadgeTextColor({color: '#FFFFFF'})
			}catch(e){}
		
			this.render();
		}
	}

	render() {
		getCurrentTab((tab={})=>{
			const { url='' } = tab

			var isAppBuild = false;
			//Is AppBuild
			if (__APPBUILD__){
				if (common.getSetting('appbuild'))
					isAppBuild = true;
			}

			var /*buttonIcon="",*/buttonBadge="", buttonPopup="", buttonTitle="";

			if ((isNewTabPage(url))&&(!isAppBuild)) {
				//Open Raindrop.io
				//buttonIcon = button.icons["idle"]
				buttonTitle = extension.i18n.getMessage("open")+" Raindrop.io"
			}
			else{
				var status = links.getStatus(url);
				if (status == 'saved')
					buttonBadge = '★'
				//buttonIcon = button.icons[status];
				buttonPopup = popupPath
				buttonTitle = extension.i18n.getMessage("saveToRaindrop")

				if (isAppBuild)
					buttonPopup = config.appBuildPage
			}

			//extension.browserAction.setIcon({tabId: tab.id, path: buttonIcon});
			extension.browserAction.setBadgeText({text: buttonBadge})
			extension.browserAction.setPopup({tabId: tab.id, popup: buttonPopup})
			extension.browserAction.setTitle({tabId: tab.id, title: buttonTitle})
			extension.browserAction.enable(tab.id);
		})
	}
}

export default new BrowserAction()