
interface DimensionBoundary {
    min: number;
    max: number
}

function getLength(dim: DimensionBoundary): number {
    return dim.max - dim.min;
}

function cmp(x, y) { return x > y ? 1 : x < y ? -1 : 0; }

export class MedCut {
    
    private getBoundaries(points: number[][]): DimensionBoundary[] {
        let maximums = points[0].map(
            (_, dim) => points.reduce(
                (prev, curr) => Math.max(prev[dim], curr[dim]), Number.MIN_VALUE));
        let minimums = points[0].map(
            (_, dim) => points.reduce(
                (prev, curr) => Math.min(prev[dim], curr[dim]), Number.MAX_VALUE));
        return points[0].map((_, dim) => ({min: minimums[dim], max: maximums[dim]}));
    }
    
    private getLongestDim(dims: DimensionBoundary[]): number {
        return dims.reduce((oldInd, newDim, newInd) =>
            getLength(newDim) > getLength(dims[oldInd]) ? newInd : oldInd, 0);
    }
    
    public quantize(points: number[][], depth: number): number[][] {
        var longestDimension = this.getLongestDim(this.getBoundaries(points));
        points.sort((a, b) => cmp(a[longestDimension], b[longestDimension]));
        if (depth == 0) {
            return [points[Math.floor(points.length / 2)]];
        } else {
            let firstHalf = points.slice(0, Math.floor(points.length / 2));
            let secondHalf = points.slice(Math.floor(points.length / 2));
            return this.quantize(firstHalf, depth - 1)
                    .concat(this.quantize(secondHalf, depth - 1));
        }
    }
}