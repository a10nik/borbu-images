import * as Utils from "./image-utils";
import chai = require('chai');
var expect = chai.expect;
var rascalPngSrc = require("./rascal.spec.png");
var rascalJpgSrc = require("./rascal.spec.jpg");
var blackPngSrc = require("./black.spec.png");
var whitePngSrc = require("./white.spec.png");

class Random {
    private seed: number;
    constructor(seed) {
        this.seed = seed;
    }
    public get() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    public getBound(from: number, to: number) {
        return Math.floor(this.get() * to) + from;
    }
}

describe("image-utils", () => {
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
    describe("psnr", () => {
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

    describe("YCrCb conversion", () => {
        var rnd = new Random(123);
        for (let i = 0; i < 100; i++) {
            let px = {
                r: rnd.getBound(0, 256),
                g: rnd.getBound(0, 256),
                b: rnd.getBound(0, 256),
                a: 255
            };
            it(`should not change much when converted to YCrCb and back ${JSON.stringify(px)}`, () => {
                let converted = Utils.yCrCbToPx(
                    Utils.getYOfPx(px), 
                    Utils.getCrOfPx(px),
                    Utils.getCbOfPx(px)
                    );
                let msg = `${JSON.stringify(px)} -> ${JSON.stringify(converted)}`
                expect(px.r, msg).to.be.closeTo(converted.r, 3);
                expect(px.g, msg).to.be.closeTo(converted.g, 3);
                expect(px.b, msg).to.be.closeTo(converted.b, 3);                
            });
        }
    });
});
