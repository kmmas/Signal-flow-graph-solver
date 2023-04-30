export class Edge {
    destination!: number;
    weight!: number;
    constructor(dest: number, weight: number) {
        this.destination = dest;
        this.weight = weight;
    }
}
export class Solution {
    forwardPaths: number[][] = [];
    loops: number[][] = [];
    nonTouchingLoops: number[][][][] = [];
    answerDeltas: number[] = [];
    overallFunction!: number;
}
export class Graph {
    private source!: number;
    private end!: number;
    adjList!: Map<number, Edge[]>;
    numberOfNodes!: number;
    solution!: Solution;

    constructor() {
        this.adjList = new Map<number, Edge[]>;
        this.numberOfNodes = 0;
        this.solution = new Solution();
    }

    setSource(node: number) {
        if (this.adjList.has(node)) {
            this.source = node;
        }
    }

    setEnd(node: number) {
        if (this.adjList.has(node)) {
            this.end = node;
        }
    }

    addNode(node: number): void {
        if (!this.adjList.has(node)) {
            this.adjList.set(node, []);
            this.numberOfNodes++;
        }
    }

    addEdge(source: number, destination: number, weight: number): void {
        this.addNode(source);
        this.addNode(destination);
        this.adjList.get(source)?.push(new Edge(destination, weight));
    }

    edgeExist(source: number, destination: number): boolean {
        if (!(this.adjList.has(source) && this.adjList.has(destination))) {
            return false;
        }
        return this.adjList.get(source)?.some((value: Edge) => value.destination === destination)!;
    }

    findEdge(source: number, destination: number): Edge {
        return this.adjList.get(source)?.find((value: Edge) => value.destination === destination)!;
    }

    findEdgeIndex(source: number, destination: number): number {
        return this.adjList.get(source)?.findIndex((value: Edge) => value.destination === destination)!;
    }

    removeNode(node: number) {
        if (!this.adjList.has(node)) {
            return;
        }
        this.adjList.forEach((value: Edge[], key: number) => {
            if (this.edgeExist(key, node)) {
                value.splice(this.findEdgeIndex(key, node), 1);
            }
        });
        this.adjList.delete(node);
        this.numberOfNodes--;
    }

    printGraph() {
        this.adjList.forEach((value: Edge[], key: number) => { console.log(key, value) });
    }

    findForwardPaths() {
        let visited: boolean[] = new Array<boolean>(this.numberOfNodes).fill(false);
        let currentPath: number[] = [];
        currentPath.push(this.source);
        this.findAllPaths(this.source, this.end, visited, currentPath);
    }

    findAllPaths(src: number, dest: number, visited: boolean[], path: number[]) {
        if (src === dest) {
            this.solution.forwardPaths.push(path.slice());
            return;
        }
        visited[src] = true;
        for (let edge of this.adjList.get(src)!) {
            if (!visited[edge.destination]) {
                path.push(edge.destination);
                this.findAllPaths(edge.destination, dest, visited, path);
                path.splice(path.indexOf(edge.destination), 1);
            }
        }
        visited[src] = false;
    }

    findAllLoops() {
        this.adjList.forEach((value: Edge[], key: number) => { this.dfs(key, [key], new Set<number>()); });
        this.deleteClone();
    }

    dfs(node: number, path: number[], visited: Set<number>) {
        visited.add(node);
        this.adjList.get(node)?.forEach((value: Edge) => {
            let neighbour: number = value.destination;
            if (path.includes(neighbour)) {
                let loop: number[] = path.slice(path.indexOf(neighbour));
                this.solution.loops.push(loop);
            } else if (!visited.has(neighbour)) {
                this.dfs(neighbour, [...path, neighbour], visited);
            }
        });
        visited.delete(node);
    }

    deleteClone() {
        // summary: we remove duplicated after sorting each loop
        let filtered: number[][] = this.solution.loops.filter((row: number[], index: number) => {
            return index === this.solution.loops.findIndex((value: number[]) =>
                row.slice().sort().toString() === value.slice().sort().toString()
            );
        });
        this.solution.loops = filtered;
        this.solution.loops.forEach((value: number[]) => { value.push(value[0]); });
    }

    isTouching(path1: number[], path2: number[]): boolean {
        for (let i = 0; i < path1.length; i++) {
            if (path2.includes(path1[i]))
                return true;
        }
        return false;
    }

    nonTouchingloopsCombinations(numberOfLoops: number): number[][][] {
        let arr: number[][] = this.solution.loops;
        let result: number[][][] = [];
        function combine(startIndex: number, combination: number[][]) {
            if (combination.length == numberOfLoops) {
                result.push(combination.slice());
                return;
            }
            for (let i = startIndex; i < arr.length; i++) {
                combination.push(arr[i]);
                combine(i + 1, combination);
                combination.pop();
            }
        }
        combine(0, []);
        return result;
    }

    findNonTouchingLoops() {
        // let twoNonTouching: number[][][] = []
        // for (let i = 0; i < this.solution.loops.length; i++) {
        //     for (let j = i + 1; j < this.solution.loops.length; j++) {
        //         if (!this.isTouching(this.solution.loops[i], this.solution.loops[j])) {
        //             twoNonTouching.push([this.solution.loops[i], this.solution.loops[j]]);
        //         }
        //     }
        // }
        for (let size = 2; size <= this.solution.loops.length; size++) {
            let loopsCombinations = this.nonTouchingloopsCombinations(size);
            let nonTouchingPairs: number[][][] = [];
            for (let i = 0; i < loopsCombinations.length; i++) {
                let currentCombination: number[][] = loopsCombinations[i];
                let areNonTouching: boolean = true;
                for (let j = 0; j < currentCombination.length; j++) {
                    for (let k = j + 1; k < currentCombination.length; k++) {
                        if (this.isTouching(currentCombination[j], currentCombination[k])) {
                            areNonTouching = false;
                            break;
                        }
                    }
                    if (!areNonTouching) {
                        break;
                    }
                }
                if (areNonTouching) {
                    nonTouchingPairs.push(currentCombination);
                }
            }
            if (nonTouchingPairs.length !== 0) {
                this.solution.nonTouchingLoops.push(nonTouchingPairs);
            }
            else {
                break;
            }
        }
    }

    calculateGain(path: number[]) {
        let gain: number = 1;
        for (let i = 0; i < path.length - 1; i++) {
            gain *= this.findEdge(path[i], path[i + 1]).weight;
        }
        return gain;
    }

    sumGain(paths: number[][]) {
        let gain: number = 0;
        paths.forEach((value: number[]) => { gain += this.calculateGain(value); });
        return gain;
    }

    multipleGainpaths(paths: number[][]) {
        let gain: number = 1;
        paths.forEach((value: number[]) => { gain *= this.calculateGain(value); });
        return gain;
    }

    getDelta(): number {
        let delta: number = 1;
        delta -= this.sumGain(this.solution.loops);
        for (let i = 0; i < this.solution.nonTouchingLoops.length; i++) {
            let tmp: number = 0;
            this.solution.nonTouchingLoops[i].forEach((value: number[][]) => { tmp += this.multipleGainpaths(value); });
            delta += (i % 2 === 0) ? tmp : -1 * tmp;
        }
        return delta;
    }

    hasLoopTouching(Forwardpath: number[], loops: number[][]): boolean {
        return loops.some((value: number[]) => (this.isTouching(Forwardpath, value)));
    }

    getForwardPathDelta(pathNumber: number): number {
        let delta: number = 1;
        let loops: number[][] = this.solution.loops.filter((value: number[]) => !(this.isTouching(this.solution.forwardPaths[pathNumber], value)));
        if (loops.length == 0) {
            return delta;
        } else {
            delta -= this.sumGain(loops);
        }
        for (let i = 0; i < this.solution.nonTouchingLoops.length; i++) {
            let tmp: number = 0;
            let tmpLoops: number[][][] = this.solution.nonTouchingLoops[i].filter((value: number[][]) => (!(this.hasLoopTouching(this.solution.forwardPaths[pathNumber], value))));
            if (tmpLoops.length === 0) {
                break;
            }
            tmpLoops.forEach((value: number[][]) => { tmp += this.multipleGainpaths(value); });
            delta += (i % 2 === 0) ? tmp : -1 * tmp;
        }
        return delta;
    }

    solve() {
        this.solution = new Solution();
        this.findForwardPaths();
        this.findAllLoops();
        this.findNonTouchingLoops();
        let numerator: number = 0;
        let denominator: number = this.getDelta();
        this.solution.answerDeltas.push(denominator);
        for (let i = 0; i < this.solution.forwardPaths.length; i++) {
            let tmp: number = this.getForwardPathDelta(i);
            this.solution.answerDeltas.push(tmp);
            numerator += this.calculateGain(this.solution.forwardPaths[i]) * tmp;
        }
        this.solution.overallFunction = numerator / denominator;
    }
}