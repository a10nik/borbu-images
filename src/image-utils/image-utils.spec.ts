import * as Utils from "./image-utils";
import chai = require('chai');
var expect = chai.expect;
var rascalPngSrc = require("./rascal.spec.png");
var rascalJpgSrc = require("./rascal.spec.jpg");
var blackPngSrc = require("./black.spec.png");
var whitePngSrc = require("./white.spec.png");

describe("image-utils psnr", () => {
    beforeEach(() => {
        return Promise
            .all([
                Utils.getCanvas(rascalPngSrc),
                Utils.getCanvas(rascalJpgSrc),
                Utils.getCanvas(whitePngSrc),
                Utils.getCanvas(blackPngSrc)
                ])
            .then(imgs => {
                this.rascalPng = imgs[0];
                this.rascalJpg = imgs[1];    
                this.whitePng = imgs[2];    
                this.blackPng = imgs[3];    
            });
    });
    it("should be Inf for equal images", () => {
        expect(Utils.getPsnr(this.rascalPng, this.rascalPng))
            .to.equal(Infinity);
    });
    it("should be non-negative for different images", () => {
        expect(Utils.getPsnr(this.rascalPng, this.rascalJpg))
            .to.be.lessThan(Infinity).and.greaterThan(0);
    });
    it("should be commutative", () => {
        expect(Utils.getPsnr(this.rascalPng, this.rascalJpg))
            .to.equal(Utils.getPsnr(this.rascalJpg, this.rascalPng));
    });
    it("should be 0 for a completely black and a completely white image", () => {
        expect(Utils.getPsnr(this.blackPng, this.whitePng))
            .to.equal(0);
    });
    it("should throw when sizes differ", () => {
        expect(() => Utils.getPsnr(this.blackPng, this.rascalPng))
            .to.throw;
    });
});