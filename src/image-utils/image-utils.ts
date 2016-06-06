import {GenLloyd} from "./gen-lloyd";
import {MedCut} from "./med-cut";

function getImage(src: string): Promise<HTMLImageElement> {
    var image = new Image();
    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject();
        image.src = src;
    });
}

function imgToCanvas(img: HTMLImageElement): HTMLCanvasElement {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
    return canvas;
}

export function getCanvas(src: string): Promise<HTMLCanvasElement> {
    return getImage(src).then(imgToCanvas);
}

function sqr(num: number): number {
    return num * num;
}

function log10(y) {
    return Math.log(y) / Math.log(10);
}

function getMseSum(data1: Uint8ClampedArray, data2: Uint8ClampedArray): number {
    if (data1.length !== data2.length)
        throw new Error("getMseSum needs 2 images of equal sizes");
    var length = data1.length;
    var sum = 0;
    for (var i = 0; i < length; i++) {
        if (i % 4 !== 3) // skip alpha channel
            sum += sqr(data1[i] - data2[i]);
    }
    return sum;
}

export function canvasImgToData(canvas: HTMLCanvasElement): Uint8ClampedArray {
    return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
}

export function getPsnr(canvas1: HTMLCanvasElement, canvas2: HTMLCanvasElement): number {
    var data1 = canvasImgToData(canvas1);
    var data2 = canvasImgToData(canvas2);
    var pixelCount = canvas1.height * canvas1.width;
    var mseSum = getMseSum(data1, data2);
    return 10 * (log10(sqr(255) * pixelCount * 3) - log10(mseSum));
}

export interface Pixel {
    r: number;
    g: number;
    b: number;
    a: number;
}

function byteBoundaries(b: number) : number {
    return Math.max(Math.min(b, 255), 0);
}

function mapPixels(fn: (Pixel) => Pixel, canvas: HTMLCanvasElement): HTMLCanvasElement {
    let {width, height} = canvas;
    let data = canvasImgToData(canvas);
    let length = data.length;
    for (var i = 0; i < length; i += 4) {
        let {r, g, b, a} = fn({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3]});
        data[i] = byteBoundaries(r);
        data[i + 1] = byteBoundaries(g);
        data[i + 2] = byteBoundaries(b);
        data[i + 3] = byteBoundaries(a);
   }
   var newCanvas = document.createElement("canvas");
   newCanvas.width = width;
   newCanvas.height = height;
   newCanvas.getContext("2d").putImageData(new ImageData(data, width, height), 0, 0);
   return newCanvas;
}

function toGreyscale(fn: (Pixel) => number, canvas: HTMLCanvasElement) {
    return mapPixels(px => {
        let greyVal = fn(px);
        return { r: greyVal, g: greyVal, b: greyVal, a: px.a};
    }, canvas);
}

export function getYOfRgb(r: number, g: number, b: number): number {
    return (77 * r + 150 * g + 29 * b) >> 8;
}

export function getCrOfRgb(r: number, g: number, b: number): number {
    return ((128 * r + -107 * g + -21 * b) >> 8) + 128;
}

export function getCbOfRgb(r: number, g: number, b: number): number {
    return ((-43 * r + -85 * g + 128 * b) >> 8) + 128;
}

export function getYOfPx({r, g, b}: Pixel): number {
    return getYOfRgb(r, g, b);
}

export function getCrOfPx({r, g, b}: Pixel): number {
    return getCrOfRgb(r, g, b);
}

export function getCbOfPx({r, g, b}: Pixel): number {
    return getCbOfRgb(r, g, b);
}

function getCbCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    return mapPixels(px => ({ r: 0, g: 0, b: getCbOfPx(px), a: 255 }), canvas);
}

function getCrCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    return mapPixels(px => ({ r: getCrOfPx(px), g: 0, b: 0, a: 255 }), canvas);
}

function quantizeByte(byte: number, bitsToBeLeft: number) {
    var bitsToBeErased = 8 - bitsToBeLeft;
    var mask = 255 << bitsToBeErased;
    return byte & mask;
}

function quantizeByteWithHalfUpwards(byte: number, bitsToBeLeft: number) {
    var bitsToBeErased = 8 - bitsToBeLeft;
    var smoothingHalf = 1 << (bitsToBeErased - 1);  
    return quantizeByte(byte, bitsToBeLeft) + smoothingHalf;
}

function quantizePxInYCrCb(px: Pixel, yBits: number, crBits: number, cbBits: number) : Pixel {
    var y = getYOfPx(px);
    var cr = getCrOfPx(px);
    var cb = getCbOfPx(px);
    return yCrCbToPx(quantizeByteWithHalfUpwards(y, yBits), quantizeByteWithHalfUpwards(cr, crBits), quantizeByteWithHalfUpwards(cb, cbBits));
}

export function quantizeCanvasInYCrCb(canvas: HTMLCanvasElement, yBits: number, crBits: number, cbBits: number): HTMLCanvasElement {
     return mapPixels(px => quantizePxInYCrCb(px, yBits, crBits, cbBits), canvas);
}

export function quantizeCanvasInRgb(canvas: HTMLCanvasElement, rBits: number, gBits: number, bBits: number): HTMLCanvasElement {
     return mapPixels(({r, g, b, a}) => ({
            r: quantizeByteWithHalfUpwards(r, rBits),
            g: quantizeByteWithHalfUpwards(g, gBits),
            b: quantizeByteWithHalfUpwards(b, bBits),
            a: a
        }), canvas);
}

export function toYCrCbCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    var y = toCcir6011Greyscale(canvas);
    var cr = getCrCanvas(canvas);
    var cb = getCbCanvas(canvas);
    var result = document.createElement("canvas");
    result.width = canvas.width;
    result.height = canvas.height * 3;
    var ctx = result.getContext("2d");
    ctx.putImageData(y.getContext("2d").getImageData(0, 0, canvas.width, canvas.height), 0, 0); 
    ctx.putImageData(cr.getContext("2d").getImageData(0, 0, canvas.width, canvas.height), 0, canvas.height); 
    ctx.putImageData(cb.getContext("2d").getImageData(0, 0, canvas.width, canvas.height), 0, canvas.height * 2);
    return result;
}

export function yCrCbToPx(y: number, cr: number, cb: number): Pixel {
    return {
        r: y + Math.floor(256 * (cr - 128) / 183),
        g: y - Math.floor((5329 * (cb - 128) + 11103 * (cr - 128)) / 15481),
        b: y + Math.floor(256 * (cb - 128) / 144),
        a: 255
    };
}

export function fromYCrCbCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    var width = canvas.width;
    var height = Math.round(canvas.height / 3);
    var yData = canvas.getContext("2d").getImageData(0, 0, width, height).data;
    var crData = canvas.getContext("2d").getImageData(0, height, width, height).data;
    var cbData = canvas.getContext("2d").getImageData(0, height * 2, width, height).data;
    var resArray = new Uint8ClampedArray(height * width * 4);
    for (var i = 0; i < resArray.length; i += 4) {
        let y = yData[i];
        let cr = crData[i];
        let cb = cbData[i + 2];
        let {r, g, b, a} = yCrCbToPx(y, cr, cb);
        resArray[i] = byteBoundaries(r);
        resArray[i + 1] = byteBoundaries(g);
        resArray[i + 2] = byteBoundaries(b);
        resArray[i + 3] = byteBoundaries(a);
   }
   var newCanvas = document.createElement("canvas");
   newCanvas.width = width;
   newCanvas.height = height;
   newCanvas.getContext("2d").putImageData(new ImageData(resArray, width, height), 0, 0);
   return newCanvas; 
}

export function toUniformGreyscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
    return toGreyscale(({r, g, b}) => (r + g + b) / 3, canvas);
}

export function toCcir6011Greyscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
    return toGreyscale(getYOfPx, canvas);
}

export class CanvasImage {
    public canvas: HTMLCanvasElement;
    public name: string;
    private src: string;
    
    public constructor(canvas: HTMLCanvasElement, name: string) {
        this.canvas = canvas;
        this.name = name;
    } 
    
    public getSrc(): string {
        if (!this.src)
            this.src = this.canvas.toDataURL(); 
        return this.src;
    }
    
    public withCanvas(canvas: HTMLCanvasElement): CanvasImage {
        return new CanvasImage(canvas, this.name);
    }
}

function dist(px1: Pixel, px2: Pixel): number {
    return (px1.r - px2.r) * (px1.r - px2.r) +
            (px1.g - px2.g) * (px1.g - px2.g) + 
            (px1.b - px2.b) * (px1.b - px2.b) +
            (px1.a - px2.a) * (px1.a - px2.a);
}

function closest(pxs: Pixel[], px: Pixel): Pixel {
    var closest = pxs[0];
    var bestDist = dist(px, closest);
    pxs.forEach(otherPx => {
        var otherDist = dist(otherPx, px);
        if (otherDist < bestDist) {
            bestDist = otherDist;
            closest = otherPx; 
        }
    });
    return closest;
}


function quantizeWithPalette(quantize: (sample: number[][]) => number[][], canvas: HTMLCanvasElement) : HTMLCanvasElement {
    let colors : number[][] = [];
    mapPixels(px => {
        colors.push([px.r, px.g, px.b, px.a]);
        return px;
    }, canvas);
    let alg = new GenLloyd();
    let samplePxs = quantize(colors).map(color => ({
       r: color[0],
       g: color[1],
       b: color[2],
       a: color[3]
    }));
    return mapPixels(px => closest(samplePxs, px), canvas);
}

export function toLbgColors(canvas: HTMLCanvasElement, k: number): HTMLCanvasElement {
    let alg = new GenLloyd();
    return quantizeWithPalette(sample => alg.quantize(sample, k), canvas);
}

export function quantizeWithMedCut(canvas: HTMLCanvasElement, k: number): HTMLCanvasElement {
    let alg = new MedCut();
    return quantizeWithPalette(sample => alg.quantize(sample, k), canvas);
}
