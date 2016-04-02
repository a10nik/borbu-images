import ImageTabs from "./image-tabs.component";
import TestUtils = require("react-addons-test-utils");
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import ImageEditor from "../image-editor/image-editor.component";

import chai = require('chai');
import Dropzone = require("react-dropzone");
var expect = chai.expect;

var black = require("../image-utils/black.spec.png");
var white = require("../image-utils/white.spec.png");
import * as ImageUtils from "../image-utils/image-utils";

function fixBinary(bin) {
    var length = bin.length;
    var buf = new ArrayBuffer(length);
    var arr = new Uint8Array(buf);
    for (var i = 0; i < length; i++) {
        arr[i] = bin.charCodeAt(i);
    }
    return buf;
}

function getBlob(canvas: HTMLCanvasElement): Blob {
    var dataURL = canvas.toDataURL("image/png");
    var base64 = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    var binary = fixBinary(atob(base64));
    var blob = new Blob([binary], {type: 'image/png'});
    return blob;
}

describe("image-tabs", () => {
    beforeEach(() => {
        this.imageTabs = TestUtils.renderIntoDocument(<ImageTabs/> as React.CElement<any, ImageTabs>);
        return ImageUtils.getCanvas(black).then(canvas => { this.blackBlob = getBlob(canvas) });
    });

    it("should have two editors inside", () => {
        let imgAreas = TestUtils.scryRenderedComponentsWithType(this.imageTabs, ImageEditor);
        expect(imgAreas.length).to.equal(2);
    });

    it("should display top-left pixel of black color when black square is loaded", (done) => {
        let imgArea = TestUtils.scryRenderedComponentsWithType(this.imageTabs, ImageEditor)[0];
        let dropzone = TestUtils.scryRenderedComponentsWithType(imgArea, Dropzone)[0];
        TestUtils.Simulate.drop(ReactDOM.findDOMNode(dropzone),
            { target: { files: [ this.blackBlob ] }} as any);
        imgArea.state.promise.then(() => {
            setTimeout(() => {
                let canvas = TestUtils.findRenderedDOMComponentWithTag(imgArea, "canvas") as any;
                let cornerPixel = canvas.getContext("2d").getImageData(0, 0, 1, 1);
                expect(Array.prototype.slice.call(cornerPixel.data, 0, 3)).to.eql([0, 0, 0]);
                done();
            }, 0);
        });
    });
    
});