function imgToCanvas(img: HTMLImageElement): HTMLCanvasElement {
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
