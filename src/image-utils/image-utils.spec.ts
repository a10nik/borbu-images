import * as Utils from "./image-utils";
import chai = require('chai');
var expect = chai.expect;
var rascalPngSrc = require("./rascal.spec.png");
var rascalJpgSrc = require("./rascal.spec.jpg");
var blackPngSrc = require("./black.spec.png");
var whitePngSrc = require("./white.spec.png");



describe("image-utils psnr", () => {
    it("should be Inf for equal images", () => {
        return expect(
            Utils.getImage(rascalPngSrc).then(img => Utils.getPsnr(img, img))
        ).to.eventually.equal(Infinity);
    });
    it("should be non-negative for different images", () => {
        return expect(
            Promise
                .all([Utils.getImage(rascalPngSrc), Utils.getImage(rascalJpgSrc)])
                .then(imgs => Utils.getPsnr(imgs[0], imgs[1]))
        ).to.eventually.be.lessThan(Infinity).and.greaterThan(0);
    });
    it("should be 0 for a completely black and a completely white image", () => {
        return expect(
            Promise
                .all([Utils.getImage(whitePngSrc), Utils.getImage(blackPngSrc)])
                .then(imgs => Utils.getPsnr(imgs[0], imgs[1]))
        ).to.eventually.be.equal(0);
    });
    it("should throw when sizes differ", () => {
        return expect(
            Promise
                .all([Utils.getImage(whitePngSrc), Utils.getImage(rascalPngSrc)])
                .then(imgs => Utils.getPsnr(imgs[0], imgs[1]))
        ).to.eventually.be.rejected;
    });
});