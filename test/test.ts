require("es6-shim");
require("../src/image-utils/image-utils.spec.ts");
import chai = require("chai");
import chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var w : any = window;
if (w.initMochaPhantomJS) {
	w.initMochaPhantomJS();
	mocha.setup("bdd");
}
