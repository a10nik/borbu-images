import * as ImageUtils from "./image-utils";
let LZString = require("lz-string/libs/lz-string");
type Square = number[][]
 
function toYCrCbSquares(canvas: HTMLCanvasElement, size: number): {y: Square[][], cr: Square[][], cb: Square[][]} {
    let {width, height} = canvas;
    let channelSquares = [[], [], []];
    let imData = canvas.getContext("2d").getImageData(0, 0, width, height).data;
    let squaresIndicesInColumn = range(0, Math.ceil(height / size));
    let squaresIndicesInRow = range(0, Math.ceil(width / size));
    let indicesInsideSquare = range(0, size);
    let [y, cr, cb] = [ImageUtils.getYOfRgb, ImageUtils.getCrOfRgb, ImageUtils.getCbOfRgb].map(toYCrCbComp =>
        squaresIndicesInColumn.map(sqRow =>
            squaresIndicesInRow.map(sqCol =>
                indicesInsideSquare.map(rowInSq =>
                    indicesInsideSquare.map(colInSq => {
                        let row = Math.min(rowInSq + sqRow * size, height - 1);
                        let col = Math.min(colInSq + sqCol * size, width - 1);
                        let r = imData[4 * (row * width + col) + 0];
                        let g = imData[4 * (row * width + col) + 1];
                        let b = imData[4 * (row * width + col) + 2];
                        return toYCrCbComp(r, g, b);
                    })
                )
            )
        )
    );
    return {y, cr, cb};
}

function decimate2x2(square: Square, decimationFn: ((old: number[][]) => number[][])): Square {
    let res: Square = square.map(_ => []);
    for (let i = 0; i < square.length; i += 2) {
        for (let j = 0; j < square.length; j += 2) {
            let [[a, b], [c, d]] = decimationFn(
                [[square[i][j], square[i][j + 1]], 
                [square[i + 1][j], square[i + 1][j + 1]]] 
            );
            res[i][j] = a;
            res[i][j + 1] = b;
            res[i + 1][j] = c;
            res[i + 1][j + 1] = d;
        }
    }
    return res;
}

export enum DecimationType { Leave2Left, Leave2Top, Leave1TopLeft, None }

export function getDecimationFn(decimationType: DecimationType): ((old: number[][]) => number[][]) {
    switch (decimationType) {
        case DecimationType.Leave1TopLeft:
            return ([[a,b],[c,d]]) => [[a,a],[a,a]];
        case DecimationType.Leave2Left:
            return ([[a,b],[c,d]]) => [[a,a],[c,c]];
        case DecimationType.Leave2Top:
            return ([[a,b],[c,d]]) => [[a,b],[a,b]];
        case DecimationType.None:
            return x => x;
    }
}

function range(start: number, len: number): number[] {
    let arr = [];
    for (let i = 0; i < len; i++) {
        arr.push(i + start);
    }
    return arr;
}

let cosines: Square = range(0, 8).map(
    i => range(0, 8).map(j => i == 0 ? 1 / Math.sqrt(8) : 1/2 * Math.cos((2 * j + 1) * i * Math.PI / 16)));
let cosinesTrans: Square = range(0, 8).map(i => range(0, 8).map(j => cosines[j][i]));

function multiply(a: Square, b: Square): Square {
    let aNumRows = a.length;
    let aNumCols = a[0].length;
    let bNumRows = b.length;
    let bNumCols = b[0].length;
    let m: Square = new Array(aNumRows);
    for (var r = 0; r < aNumRows; ++r) {
        m[r] = new Array(bNumCols);
        for (var c = 0; c < bNumCols; ++c) {
            m[r][c] = 0;
            for (var i = 0; i < aNumCols; ++i) {
            m[r][c] += a[r][i] * b[i][c];
            }
        }
    }
    return m;
}

function scalarMultiply(s: Square, c: number): Square {
    return s.map(ln => ln.map(x => x * c));
}

function dct(square: Square): Square {
    return multiply(multiply(cosines, square), cosinesTrans);
}

function backDct(square: Square): Square {
    return multiply(multiply(cosinesTrans, square), cosines);
}

function forEachZigZagIndexCorrespondence(width: number, height: number, fn: (x: number, y: number, zigZagIndex: number) => void) {
    let m = height;
    let n = width;
    let j = 0;
    for (let i = 0; i < m + n - 1; i++){
        if (i % 2 == 1){
            for (let y = Math.min(i, n - 1); y >= Math.max(0, i - m + 1); y--){
                fn(y, i - y, j++);
            }
        } else {
            for (let x = Math.min(i, m - 1); x >= Math.max(0, i - n + 1); x--){
                fn(x, i - x, j++);
            }
        }
    }
}

function zigZag<T>(matrix: T[][]): T[] {
    let res = new Array(matrix.length * matrix[0].length);
    forEachZigZagIndexCorrespondence(matrix[0].length, matrix.length, (x, y, z) => {
        res[z] = matrix[y][x];
    });
    return res;
}

function unZigZag<T>(zigZag: T[], width: number, height: number): T[][] {
    let res = range(0, height).map(_ => []);
    forEachZigZagIndexCorrespondence(width, height, (x, y, z) => {
        res[y][x] = zigZag[z];
    });
    return res;
}

export function quantizeWithTable(square: Square, quantizationTable: Square): Square {
    return square.map((ln, i) => ln.map((x, j) => Math.round(x / quantizationTable[i][j]) * quantizationTable[i][j]))
}

export function quantizeByMaxima(square: Square, count: number): Square {
    let all = [].concat.apply([], square.map(ln => ln.map(Math.abs)));
    all.sort((a, b) => a - b);
    let borderline = all[all.length - count];
    let replaced = 0;
    return square.map((ln, i) => ln.map((x, j) => {
        if ((Math.abs(x) >= borderline || (i === 0 && j === 0)) && replaced < count) {
            replaced++;
            return x;
        } else {
            return 0;
        }
    }));
}

function chunks<T>(arr: T[], chunkSize: number): T[][] {
    var res = [];
    for (var i = 0; i < arr.length; i += chunkSize)
        res.push(arr.slice(i, i + chunkSize));
    return res;
}

function withDeltaEncodedDcs(zigZags: number[][]): number[][] {
    return zigZags
        .map((z, i) => i == 0 ? z[0] : z[0] - zigZags[i - 1][0])
        .map((z0, i) => [z0].concat(zigZags[i].slice(1)));
}

function withDeltaDecodedDcs(zigZags: number[][]): number[][] {
    let last = null;
    return zigZags
        .map((z, i) => {
            if (i == 0) {
                last = z[0];
                return last;
            } else {
                 last += z[0];
                 return last;
            }
        })
        .map((z0, i) => [z0].concat(zigZags[i].slice(1)));
}

function yCrCbSquaresToCanvas(ySquares: Square[][], crSquares: Square[][], cbSquares: Square[][], squareSize: number, realWidth: number, realHeight: number): HTMLCanvasElement {
    let canvasData = new Uint8ClampedArray(realWidth * realHeight * 4);
    let ys = range(0, realHeight);
    let xs = range(0, realWidth); 
    ys.forEach(y => {
        xs.forEach(x => {
            let squareX = Math.floor(x / squareSize);
            let xInsideSquare = x % squareSize;
            let squareY = Math.floor(y / squareSize);
            let yInsideSquare = y % squareSize;
            let {r, g, b} = ImageUtils.yCrCbToPx(
                ySquares[squareY][squareX][yInsideSquare][xInsideSquare],
                crSquares[squareY][squareX][yInsideSquare][xInsideSquare],
                cbSquares[squareY][squareX][yInsideSquare][xInsideSquare]
            );
            canvasData[(y * realWidth + x) * 4 + 0] = r; 
            canvasData[(y * realWidth + x) * 4 + 1] = g; 
            canvasData[(y * realWidth + x) * 4 + 2] = b; 
            canvasData[(y * realWidth + x) * 4 + 3] = 255; 
        });
    });
    let canvas = document.createElement("canvas");
    canvas.width = realWidth;
    canvas.height = realHeight;
    canvas.getContext("2d").putImageData(new ImageData(canvasData, realWidth, realHeight), 0, 0);
    return canvas;
}

interface Compressed {
    yData: Uint8Array,
    crData: Uint8Array,
    cbData: Uint8Array,
    width: number,
    height: number
}

export function toJpeg(canvas: HTMLCanvasElement,
                    yDecimation: ((old: number[][]) => number[][]), cDecimation: ((old: number[][]) => number[][]),
                    yQuantization: (Square) => Square, cQuantization: (Square) => Square) : Compressed {
    let encodeChannel = (ch: Square[][], decimationFn: ((old: number[][]) => number[][]), quantizationFn: (Square) => Square) : Uint8Array => {
        let data = [].concat.apply([],
            withDeltaEncodedDcs(zigZag(ch.map(ln => ln.map(sq => zigZag(quantizationFn(dct(decimate2x2(sq, decimationFn))))))))
        ) as number[];
        return LZString.compressToUint8Array({length: data.length, charAt: (i) => String.fromCharCode(255 * 64 + data[i])});
    }
        
    let {width, height} = canvas;                    
    let {y, cr, cb} = toYCrCbSquares(canvas, 8);
    let encodedY = encodeChannel(y, yDecimation, yQuantization);
    let encodedCr = encodeChannel(cr, cDecimation, cQuantization);
    let encodedCb = encodeChannel(cb, cDecimation, cQuantization);
    return {
        yData: encodedY,
        crData: encodedCr,
        cbData: encodedCb,
        width,
        height
    };
}

export function fromJpeg(compressed: Compressed) {
    
    let decodeChannel = (encoded: Uint8Array, width: number, height: number) => {
        let decompressed: string = LZString.decompressFromUint8Array(encoded);
        let channelData = range(0, decompressed.length).map(i => decompressed.charCodeAt(i) - 255 * 64);
        return unZigZag(withDeltaDecodedDcs(chunks(channelData, 64)).map(z => backDct(unZigZag(z, 8, 8))), Math.ceil(width / 8), Math.ceil(height / 8));
    }
    
    let {width, height} = compressed;
    let decodedY = decodeChannel(compressed.yData, width, height);
    let decodedCr = decodeChannel(compressed.crData, width, height);
    let decodedCb = decodeChannel(compressed.cbData, width, height);
    return yCrCbSquaresToCanvas(decodedY, decodedCr, decodedCb, 8, width, height);    
}


let standardYQuantizationMatrix = [
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99]
];

let standardCQuantizationMatrix = [
    [17, 18, 24, 47, 99, 99, 99, 99],
    [18, 21, 26, 66, 99, 99, 99, 99],
    [24, 26, 56, 99, 99, 99, 99, 99],
    [47, 66, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99],
    [99, 99, 99, 99, 99, 99, 99, 99]
];

export function getStandardYQuantizationMatrixMultiplied(c: number) {
    return scalarMultiply(standardYQuantizationMatrix, c);
}

export function getStandardCQuantizationMatrixMultiplied(c: number) {
    return scalarMultiply(standardCQuantizationMatrix, c);
}

export function quantizationTable(a: number, g: number): number[][] {
    return range(0, 8).map(
        i => range(0, 8).map(
            j => a * (1 + g * (i + j + 2)) 
        )
    );
}