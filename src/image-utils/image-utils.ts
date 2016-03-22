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

function canvasImgToData(canvas: HTMLCanvasElement): Uint8ClampedArray {
    return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
}

export function getPsnr(canvas1: HTMLCanvasElement, canvas2: HTMLCanvasElement): number {
    var data1 = canvasImgToData(canvas1);
    var data2 = canvasImgToData(canvas2);
    var pixelCount = canvas1.height * canvas1.width;
    var mseSum = getMseSum(data1, data2);
    return 10 * (log10(sqr(255) * pixelCount * 3) - log10(mseSum));
}

interface Pixel {
    r: number;
    g: number;
    b: number;
    a: number;
}

function mapPixels(fn: (Pixel) => Pixel, canvas: HTMLCanvasElement): HTMLCanvasElement {
    let {width, height} = canvas;
    let data = canvasImgToData(canvas);
    let length = data.length;
    for (var i = 0; i < length; i += 4) {
        let {r, g, b, a} = fn({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3]});
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
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

export function toUniformGreyscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
    return toGreyscale(({r, g, b}) => (r + g + b) / 3, canvas);
}

export function toCcir6011Greyscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
    return toGreyscale(({r, g, b}) =>  0.299 * r + 0.587 * g + 0.114 * b, canvas);
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
    
    public withCanvas(canvas): CanvasImage {
        return new CanvasImage(canvas, this.name);
    }
}