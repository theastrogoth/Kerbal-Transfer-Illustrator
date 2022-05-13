import Color from "../objects/color";
import { linspace } from "./math";

// see https://github.com/empet/Texture-mapping-with-Plotly/blob/main/texture.py for outline of approach
namespace SurfaceTexture {
    // random sampling without replacement
    function randomSamples(array: number[][], n: number): number[][] {
        const bucket = array.slice()
        const samples: number[][] = [];
        for(let i=0; i<n; i++) {
            const randomIndex = Math.floor(Math.random()*bucket.length);
            samples.push(bucket.splice(randomIndex, 1)[0]);
        }
        return samples;
    }

    // clustering
    function kmeans(observations: number[][], k: number, maxIters: number = 50) {
        const n = observations.length;
        const dims = observations[0].length;

        // initialize means
        const means = randomSamples(observations, k);

        let clusterAssignments = observations.map(o => -1);
        let prevAssignments = observations.map(o => -2);
        let iter = 0;
        while(iter < maxIters) {
            iter++;
            prevAssignments = clusterAssignments.slice();

            // new cluster assignments
            const res = kmeansAssignment(observations, means);
            const clusterSums = res.clusterSums;
            const clusterCounts = res.clusterCounts;
            clusterAssignments = res.clusterAssignments;

            if(clusterAssignments === prevAssignments) {
                break
            }

            // new cluster means
            for(let i=0; i<k; i++) {
                for(let j=0; j<dims; j++) {
                    means[i][j] = clusterSums[i][j] / clusterCounts[i];
                }
            }
        }
        return means;
    }

    function kmeansAssignment(observations: number[][], means: number[][]) {
        let clusterAssignments = observations.map(o => -1);
        let clusterSums = means.map(m => means[0].map(v => 0));
        let clusterCounts = means.map(m => 0);
        for(let i=0; i<observations.length; i++) {
            let closestMean = -1;
            let distanceSq = Infinity;
            for(let j=0; j<means.length; j++) {
                const distSq = observations[i].map((o, index) => Math.pow(o - means[j][index], 2)).reduce((p,c) => p + c);
                if(distSq < distanceSq) {
                    closestMean = j;
                    distanceSq = distSq;
                }
            }
            clusterAssignments[i] = closestMean;
            clusterCounts[closestMean]++;
            for(let j=0; j<observations[0].length; j++) {
                clusterSums[closestMean][j] += observations[i][j];
            }
        }
        return {clusterAssignments, clusterSums, clusterCounts}
    }

    // image processing
    function imageDataToColorData(imageData: number[]) {
        const len = imageData.length / 4
        if(!Number.isInteger(len)) {
            throw Error("The image data must be an array with length divisible by 4")
        }

        const colorData: number[][] = []
        for(let i=0; i<len; i++) {
            colorData.push(imageData.slice(4 * i, 4 * (i + 1)));
        }

        return colorData;
    }

    function colorDataToColors(colorData: number[][]): Color[] {
        return colorData.map(cd => { return new Color({r: cd[0], g: cd[1], b: cd[2], a: cd[3]}) });
    }

    // colorscale assignment
    function colorDataToColorScale(colorData: number[][], nColors: number = 64, nTrainPixels = 800) {

        const trainData = randomSamples(colorData, nTrainPixels);
        const means = kmeans(trainData, nColors);
        const {clusterAssignments} = kmeansAssignment(colorData, means);

        // const plotColorData = clusterAssignments.map(a => means[a]);
        // const plotColors = colorDataToColors(plotColorData);
        const meanColors = colorDataToColors(means);

        const zValues = clusterAssignments.map(ca => ca / (nColors - 1));
        const scaleValues = linspace(0, 1, nColors)
        const colorScale: [number, String][] = [];
        for(let i=0; i<meanColors.length; i++) {
            colorScale.push([scaleValues[i], meanColors[i].toString()])
        }
        
        return {zValues, colorScale};
    }

    // triangulation
    function regularTriangles(zValues: number[], nRows: number, nCols: number) {
        const i: number[] = [];
        const j: number[] = [];
        const k: number[] = [];
        const triangleZValues: number[] = [];
        for(let ii=0; ii<nRows-1; ii++) {
            for(let jj=0; jj<nCols; jj++) {
                const kk = jj + ii * nCols;
                if(jj !== nCols - 1) {
                    i.push(kk, kk);
                    j.push(kk + nCols, kk + 1 + nCols);
                    k.push(kk + 1 + nCols, kk + 1);
                    triangleZValues.push(zValues[kk + nCols], zValues[kk + 1]);
                } else {
                    i.push(kk, kk);
                    j.push(kk + nCols, kk + 1);
                    k.push(kk + 1, kk - nCols + 1);
                    triangleZValues.push(zValues[kk + nCols], zValues[kk - nCols + 1]);
                }
            }
        }
        return {i, j, k, triangleZValues};
    }

    function meshData(imageData: number[], nRows: number, nCols: number, nColors: number = 64, nTrainPixels = 800) {
        const colorData = imageDataToColorData(imageData);
        const {zValues, colorScale} = colorDataToColorScale(colorData, nColors, nTrainPixels);

        const {i, j, k, triangleZValues} = regularTriangles(zValues, nRows, nCols);

    }

}

export default SurfaceTexture;