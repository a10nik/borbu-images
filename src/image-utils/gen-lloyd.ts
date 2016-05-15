class Distances {
    public static euclid(a: number[], b: number[]): number {
        let dist = 0.0;
        for (var i = 0; i < a.length; i++) {
            dist += (a[i] - b[i]) * (a[i] - b[i]);
        }
        if (isNaN(dist))
            throw "Distance is NaN";
        return dist;
    }
}

export class GenLloyd {
    protected samplePoints: number[][];
    protected clusterPoints: number[][];
    protected relClusterWeight: number[];
    protected absClusterWeight: number[];

    private pointApproxIndices: number[];
    private pointDimension = 0;
    
    protected epsilon = 0.05;
    protected avgDistortion = 0.0;

    private setSamplePoints(samplePoints: number[][]) {
        if (samplePoints.length > 0) {
            this.samplePoints = samplePoints;
            this.pointDimension = samplePoints[0].length;
        }
    }

    public quantize(samplePoints: number[][], k: number) {
        this.setSamplePoints(samplePoints);
        this.calcClusters(k);
        return this.clusterPoints;
    }

    private makePoint(): number[] {
        let point : number[] = [];
        for (let i = 0; i < this.pointDimension; i++)
            point[i] = 0;
        return point;
    }

    /**
     * Calculate <numClusters> cluster points. This methods needs to be called
     * BEFORE getClusterPoints() and getClusterWeight()
     * @param numClusters Number of calculated cluster points
     */
    private calcClusters(numClusters: number) {
        // initialize with first cluster
        this.clusterPoints = [this.makePoint()];
        this.relClusterWeight = [];
        this.absClusterWeight = [];
        this.relClusterWeight[0] = 1.0;
        this.absClusterWeight[0] = this.samplePoints.length;

        let newClusterPoint = this.initializeClusterPoint(this.samplePoints);
        this.clusterPoints[0] = newClusterPoint;
        

        if (numClusters > 1) {
            // calculate initial average distortion
            this.avgDistortion = 0.0;
            this.samplePoints.forEach(samplePoint => {
                this.avgDistortion += Distances.euclid(samplePoint, newClusterPoint);
            });

            this.avgDistortion /= this.samplePoints.length * this.pointDimension;

            // set up array of point approximization indices
            this.pointApproxIndices = [];

            // split the clusters
            let i = 1;
            do {
                i = this.splitClusters();
            } while (i < numClusters);
        }
    }

    protected splitClusters(): number {
        let newClusterPointSize = 2;
        if (this.clusterPoints.length != 1) {
            newClusterPointSize = this.clusterPoints.length * 2;
        }

        // split clusters
        let newClusterPoints = [];
        let newClusterPointIdx = 0;
        this.clusterPoints.forEach(clusterPoint =>{
            newClusterPoints[newClusterPointIdx] = this.createNewClusterPoint(clusterPoint, -1);
            newClusterPoints[newClusterPointIdx+1] = this.createNewClusterPoint(clusterPoint, +1);
            newClusterPointIdx += 2;
        });

        this.clusterPoints = newClusterPoints;

        // iterate to approximate cluster points
        //int iteration = 0;
        let curAvgDistortion = 0.0;
        do {
            curAvgDistortion = this.avgDistortion;

            // find the min values
            for (let pointIdx = 0; pointIdx < this.samplePoints.length; pointIdx++) {
                let minDist = Number.MAX_VALUE;
                for (let clusterPointIdx = 0; clusterPointIdx < this.clusterPoints.length; clusterPointIdx++) {
                    let newMinDist = Distances.euclid(this.samplePoints[pointIdx], this.clusterPoints[clusterPointIdx]);
                    if (newMinDist < minDist) {
                        minDist = newMinDist;
                        this.pointApproxIndices[pointIdx] = clusterPointIdx;
                    }
                }
            }

            // update codebook
            for (let clusterPointIdx = 0; clusterPointIdx < this.clusterPoints.length; clusterPointIdx++) {
                let newClusterPoint = this.makePoint();
                let num = 0;
                for (let pointIdx = 0; pointIdx < this.samplePoints.length; pointIdx++) {
                    if (this.pointApproxIndices[pointIdx] == clusterPointIdx) {
                        this.addPointValues(newClusterPoint, this.samplePoints[pointIdx]);
                        num++;
                    }
                }

                if (num > 0) {
                    this.multiplyPointValues(newClusterPoint, 1.0 / num);
                    this.clusterPoints[clusterPointIdx] = newClusterPoint;
                    this.relClusterWeight[clusterPointIdx] = num / this.samplePoints.length;
                    this.absClusterWeight[clusterPointIdx] = num;
                }
            }

            // increase iteration count
            //System.out.println("  > Iteration = " + iteration);
            //iteration++;

            // update average distortion
            this.avgDistortion = 0.0;
            for (let pointIdx = 0; pointIdx < this.samplePoints.length; pointIdx++) {
                this.avgDistortion += Distances.euclid(this.samplePoints[pointIdx], this.clusterPoints[this.pointApproxIndices[pointIdx]]);
            }

            this.avgDistortion /= this.samplePoints.length * this.pointDimension;

        } while (((curAvgDistortion - this.avgDistortion) / curAvgDistortion) > this.epsilon);
        
        return this.clusterPoints.length;
    }

    protected initializeClusterPoint(pointsInCluster: number[][]): number[] {
        // calculate point sum
        let clusterPoint = this.makePoint();
        for (let numPoint = 0; numPoint < pointsInCluster.length; numPoint++) {
            this.addPointValues(clusterPoint, pointsInCluster[numPoint]);
        }

        // calculate average
        this.multiplyPointValues(clusterPoint, 1.0 / pointsInCluster.length);

        return clusterPoint;
    }

    protected createNewClusterPoint(clusterPoint: number[], epsilonFactor: number): number[] {
        let newClusterPoint = this.makePoint();
        this.addPointValues(newClusterPoint, clusterPoint);
        this.multiplyPointValues(newClusterPoint, 1.0 + epsilonFactor * this.epsilon);

        return newClusterPoint;
    }

    protected addPointValues(v1: number[], v2: number[]) {
        for (let pointIdx = 0; pointIdx < v1.length; pointIdx++) {
            v1[pointIdx] += v2[pointIdx];
        }
    }

    protected multiplyPointValues (v1: number[], f: number) {
        for (let pointIdx = 0; pointIdx < v1.length; pointIdx++) {
            v1[pointIdx] *= f;
        }
    }
}