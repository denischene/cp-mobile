// @ts-ignore
const PREFIX = 'cplus-';

// Internal browser pages where the extension must stay disabled
// @ts-ignore
const INTERNAL_PAGES = ['edge:', 'chrome:', 'about:', 'moz-extension:', 'resource:'];

// @ts-ignore
const isInternalPage = (url?: string): boolean => INTERNAL_PAGES.some(scheme => url?.startsWith(scheme));

// On Firefox for Android some per-tab action methods (setIcon, enable, disable)
// are not implemented and throw. We wrap them so a failure never breaks the
// core "click to inject the toolbar" flow.
// @ts-ignore
const safeAction = (method: string, ...args: any[]): void => {
        try {
                const action: any = (chrome as any).action;
                if (action && typeof action[method] === 'function') {
                        const result = action[method](...args);
                        if (result && typeof result.catch === 'function') {
                                result.catch(() => { /* unsupported on this platform */ });
                        }
                }
        } catch (error) {
                // Silently ignore: action UI customisation is best-effort on mobile
        }
};


// Script injection helpers: a rejected executeScript (restricted page, tab
// closed, service worker recycled) must never bubble up, otherwise the whole
// listener stops and Confort+ looks "dead" until the browser is restarted.
// @ts-ignore
const injectScript = (tabId: number, file: string): Promise<any> => {
        try {
                return chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: [file]
                }).catch((error: any) => {
                        console.info(`Confort+: cannot inject ${file} in tab ${tabId}.`, error);
                });
        } catch (error) {
                console.info(`Confort+: cannot inject ${file} in tab ${tabId}.`, error);
                return Promise.resolve();
        }
};

// The toolbar bundle must never be injected twice in the same document: all its
// services are singletons and throw on a second run, which breaks the palette.
// @ts-ignore
const isToolbarPresent = async (tabId: number): Promise<boolean> => {
        try {
                const results: any = await chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        func: () => !!document.querySelector('cplus-app-root')
                });
                return !!results?.[0]?.result;
        } catch (error) {
                return false;
        }
};

// @ts-ignore
const injectToolbar = async (tabId: number): Promise<void> => {
        if (await isToolbarPresent(tabId)) {
                return;
        }
        await injectScript(tabId, 'js/toolbar.js');
};

chrome.runtime.onInstalled.addListener(async () => {
        // Update action icon and state
        const tabs = await chrome.tabs.query({ currentWindow: true });
        for (const tab of tabs) {
                // Set Confort+ disable by default
                updateButtonIcon(false, tab.id as number);
                // Disable action on internal browser pages
                if (isInternalPage(tab.url)) {
                        safeAction('disable', tab.id);
                } else {
                        safeAction('enable', tab.id);
                        const states = await chrome.storage.local.get(`${PREFIX}is-enabled-${tab.id}`);
                        chrome.storage.local.set({ [`${PREFIX}is-enabled-${tab.id}`]: false });
                        // Reload tabs that had Confort+ loaded and active
                        if (states[`${PREFIX}is-enabled-${tab.id}`]) {
                                chrome.tabs.reload(tab.id as number)
                                        .catch(error => {
                                                console.error(`Cannot reload tab ${tab.id}. Error: ${error}`)
                                        });
                        }
                }
        }
});

// Update Confort+ button icon
// @ts-ignore
const updateButtonIcon = (isEnabled: boolean, tabId: number) => {
        if (isEnabled) {
                safeAction('setIcon', {
                        tabId: tabId,
                        path: {
                                "16": "../assets/img/icon-16.png",
                                "19": "../assets/img/icon-19.png",
                                "32": "../assets/img/icon-32.png",
                                "38": "../assets/img/icon-38.png",
                                "48": "../assets/img/icon-48.png",
                                "64": "../assets/img/icon-64.png",
                                "128": "../assets/img/icon-128.png"
                        }
                });
        } else {
                safeAction('setIcon', {
                        tabId: tabId,
                        path: {
                                "16": "../assets/img/icon-disabled-16.png",
                                "19": "../assets/img/icon-disabled-19.png",
                                "32": "../assets/img/icon-disabled-32.png",
                                "38": "../assets/img/icon-disabled-38.png",
                                "48": "../assets/img/icon-disabled-48.png",
                                "64": "../assets/img/icon-disabled-64.png",
                                "128": "../assets/img/icon-disabled-128.png"
                        }
                });
        }
}

// Confort+ button click event
chrome.action.onClicked.addListener(async (tab) => {
        // Just in case we're on internal browser page and action couldn't be disabled before
        if (isInternalPage(tab.url)) {
                safeAction('disable', tab.id);
                return false;
        }

        const activations = await chrome.storage.local.get(`${PREFIX}is-enabled-${tab.id}`);
        const isEnabled = activations[`${PREFIX}is-enabled-${tab.id}`];
        chrome.storage.local.set({ [`${PREFIX}is-enabled-${tab.id}`]: !isEnabled });

        const injections = await chrome.storage.local.get(`${PREFIX}is-injected-${tab.id}`);
        const isInjected = injections[`${PREFIX}is-injected-${tab.id}`];

        updateButtonIcon(!isEnabled, tab.id as number);

        const toolbarPresent = await isToolbarPresent(tab.id as number);

        if (!isInjected || !toolbarPresent) {
                // Not injected yet, or the document was replaced (navigation, auto refresh)
                await injectToolbar(tab.id as number);
                chrome.storage.local.set({ [`${PREFIX}is-injected-${tab.id}`]: true });
        } else if (!isEnabled) {
                await injectScript(tab.id as number, 'js/restore.js');
        } else {
                await injectScript(tab.id as number, 'js/eject.js');
        }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.getTabId) {
                sendResponse({ tabId: sender?.tab?.id });
        }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        // Sites that refresh themselves (news homepages, ads) fire a lot of
        // updates: only react to a real navigation or to the end of a load.
        if (!changeInfo.url && changeInfo.status !== 'complete') {
                return;
        }

        if (isInternalPage(tab.url)) {
                safeAction('disable', tabId);
                updateButtonIcon(false, tabId);
        } else {
                safeAction('enable', tabId);

                const activations = await chrome.storage.local.get(`${PREFIX}is-enabled-${tabId}`);
                const isEnabled = activations[`${PREFIX}is-enabled-${tabId}`];

                const reloads = await chrome.storage.local.get(`${PREFIX}is-reloaded-${tab.id}`);
                const isReload = reloads[`${PREFIX}is-reloaded-${tab.id}`];

                if (changeInfo.url || isReload) {
                        if (isEnabled) {
                                await injectToolbar(tabId);
                                chrome.storage.local.set({ [`${PREFIX}is-reloaded-${tabId}`]: false });
                        }
                        chrome.storage.local.set({ [`${PREFIX}is-injected-${tabId}`]: isEnabled });
                }

                updateButtonIcon(isEnabled, tabId);
        }
});

chrome.webNavigation.onCommitted.addListener((details) => {
        if (details.transitionType === 'reload') {
                chrome.storage.local.set({ [`${PREFIX}is-reloaded-${details.tabId}`]: true });
        }
});

chrome.tabs.onCreated.addListener(tab => {
        updateButtonIcon(false, tab.id as number);
        safeAction('disable', tab.id);
        if (!isInternalPage(tab.url)) {
                safeAction('enable', tab.id);
        }
});

// @note Debugging storage
// @see https://developer.chrome.com/docs/extensions/reference/storage/#synchronous-response-to-storage-updates
// @note Kept commented out: on long sessions these logs flood the console.
// chrome.storage.onChanged.addListener((changes, namespace) => { ... });
