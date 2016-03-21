require("es6-shim");
require("blob-polyfill");

require("../src/image-utils/image-utils.spec.ts");
require("../src/image-tabs/image-tabs.spec.tsx");
import chai = require("chai");
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var w : any = window;
if (w.initMochaPhantomJS) {
	w.initMochaPhantomJS();
	mocha.setup("bdd");
}
