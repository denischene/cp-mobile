// Injector
const appRootElt = document.createElement(APP_NAME);
document.body.prepend(appRootElt);

/* Debug / QA hook: gives access to the services from the page console */
// @ts-ignore
window.cplus = {
	readAloud: readAloudServiceInstance,
	colorContrast: colorContrastServiceInstance,
	clickFacilite: clickFaciliteServiceInstance,
	clearlyLinks: clearlyLinksServiceInstance,
	magnifier: magnifierServiceInstance,
	dragDrop: dragDropServiceInstance,
	route: routeServiceInstance,
	storage: localStorageServiceInstance
};
