export function getImage(src: string): Promise<HTMLImageElement> {
    var image = new Image();
    return new Promise((resolve, reject) => {
        image.src = src;
        image.onload = () => resolve(image);
        image.onerror = () => reject();
    });
}

export function imgToCanvas(img: HTMLImageElement): HTMLCanvasElement {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);
    return canvas;
}

function imgToData(img: HTMLImageElement): Uint8ClampedArray {
    return imgToCanvas(img).getContext("2d").getImageData(0, 0, img.width, img.height).data;
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

export function getPsnr(img1: HTMLImageElement, img2: HTMLImageElement): number {
    var data1 = imgToData(img1);
    var data2 = imgToData(img2);
    var pixelCount = img1.height * img1.width;
    var mseSum = getMseSum(data1, data2);
    return 10 * (log10(sqr(255) * pixelCount * 3) - log10(mseSum));
}

interface Pixel {
    r: number;
    g: number;
    b: number;
    a: number;
}

function mapPixels(fn: (Pixel) => Pixel, img: CanvasImage): CanvasImage {
    let {width, height} = img.canvas;
    let data = img.canvas.getContext("2d")
        .getImageData(0, 0, width, height).data;
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
   return new CanvasImage(newCanvas, img.name);
}

export class CanvasImage {
    public canvas: HTMLCanvasElement;
    public name: string;
    private src: string;
    
    public constructor(canvas: HTMLCanvasElement, name: string) {
        this.canvas = canvas;
        this.name = name;
    } 
    
    public getSrc() {
        if (!this.src)
            this.src = this.canvas.toDataURL(); 
        return this.src;
    }
}