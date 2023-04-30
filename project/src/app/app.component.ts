import { Component, OnInit } from '@angular/core';
import * as cytoscape from 'cytoscape';
import { Graph, Solution } from './GraphStructure/GraphStructure';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  ngOnInit(): void {
    this.cy = cytoscape({
      container: document.getElementById('cy'),
      style: this.Style,
      userZoomingEnabled: false,
      userPanningEnabled: false,
    });
    this.height = this.cy.container()?.clientHeight!;
    this.Ydimension = this.height / 2;
    this.width = this.cy.container()?.clientWidth!;
    this.graph = new Graph();
  }
  title = 'ControlProject';
  showsolution: boolean = false;
  graph!: Graph;
  Ydimension!: number;
  Xdimension!: number;
  width!: number;
  height!: number;
  from: string = '';
  to: string = '';
  value: string = '';
  NumberOfNodes: number = 0;
  NextNodes: number = 0;
  cy!: cytoscape.Core;
  Style: cytoscape.Stylesheet[] = [
    {
      selector: 'node',
      style: {
        'border-color': 'black',
        'border-width': '2px',
        'background-color': 'white',
        'label': 'data(id)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': 'black',
        'font-weight': 'bold'
      }
    },
    {
      selector: '.sourceNode',
      style: {
        'background-color': 'green',
        'color': 'white'
      }
    },
    {
      selector: '.endNode',
      style: {
        'background-color': 'red',
        'color': 'white'
      }
    },
    {
      selector: 'edge',
      style: {
        'line-color': 'black',
        'width': '2px',
        'line-cap': 'round',
        'curve-style': 'unbundled-bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': 'black',
        'label': 'data(value)',
        'font-weight': 'bold',
        'color': 'white',
        'text-outline-color': 'black',
        'text-outline-width': '2px',
      }
    }
  ]

  overallfunction: string = '';
  forwardPaths: string = '';
  loops: string = '';
  nonTouchingLoops: string = '';
  deltas: string = '';

  getCurveValue(target: string, source: string): number {
    let curveValue: number = (this.cy.$id(target).position().x - this.cy.$id(source).position().x) / this.Xdimension;
    if (Math.abs(Math.abs(curveValue) - 1) <= 0.5 && curveValue < 0) {
      curveValue = 50;
    } else if (curveValue !== 0) {
      curveValue = (Math.abs(curveValue) - 1) * 100;
    }
    if ((curveValue / 2 + this.Ydimension) * this.cy.zoom() >= this.height) {
      curveValue = this.height - 50;
    }
    return curveValue;
  }
  OrganizeNodes(): void {
    this.Xdimension = this.width / (this.NumberOfNodes + 1);
    this.Ydimension = this.height / 2;
    this.cy.nodes().sort((ele1, ele2) => { return Number(ele1.id()) - Number(ele2.id()) }).positions((ele, i) => {
      return { x: (i + 1) * this.Xdimension, y: this.Ydimension };
    });
  }
  OrganizeEdges(): void {
    this.cy.edges().forEach((ele, i, eles) => {
      ele.style('control-point-distance', this.getCurveValue(ele.target().id(), ele.source().id()));
    });
  }
  Organize(): void {
    this.width = this.cy.container()?.clientWidth!;
    this.height = this.cy.container()?.clientHeight!;
    this.OrganizeNodes();
    this.OrganizeEdges();
  }
  AddNode(): void {
    this.cy.add({
      group: 'nodes',
      data: { id: this.NextNodes.toString() },
    });
    this.graph.addNode(this.NextNodes);
    this.NumberOfNodes++;
    this.NextNodes++;
    this.OrganizeNodes();
  }

  ConnectEdge() {
    if (this.from === '' || this.to === '' || this.value === '') {
      alert('pls enter valid arguments');
      return;
    }
    if (!(this.NodeExist(this.from) && this.NodeExist(this.to))) {
      alert('invalid input');
      return;
    }
    if (this.EdgeExist(this.from, this.to)) {
      alert('Duplicate edge');
      return;
    }
    this.AddEdge(this.from, this.to, this.value);
  }
  AddEdge(source: string, target: string, value: string) {
    let curveValue: number = this.getCurveValue(target, source);
    this.cy.add({
      group: 'edges',
      data: { value: value, source: source, target: target },
      style: {
        'control-point-distance': curveValue
      }
    });
    this.graph.addEdge(Number(source), Number(target), Number(value));
  }

  NodeExist(node: string) {
    return this.cy.getElementById(node).isNode();
  }

  EdgeExist(source: string, target: string): boolean {
    return this.cy.edges().filter((ele, i) => { return ele.source().id() === source && ele.target().id() === target }).size() !== 0;
  }

  SetSource() {
    let node: string = prompt('enter the node', '0')!;
    if (!this.NodeExist(node)) {
      alert('node not found');
      return;
    }
    this.cy.nodes().filter((ele, i) => ele.hasClass('sourceNode')).classes('');
    this.cy.getElementById(node).classes('sourceNode');
    this.graph.setSource(Number(node));
  }

  SetEnd() {
    let node: string = prompt('enter the node', (this.NumberOfNodes - 1).toString())!;
    if (!this.NodeExist(node)) {
      alert('node not found');
      return;
    }
    this.cy.nodes().filter((ele, i) => ele.hasClass('endNode')).classes('');
    this.cy.getElementById(node).classes('endNode');
    this.graph.setEnd(Number(node));
  }

  DeleteNode() {
    let node: string = prompt('enter the node', (this.NumberOfNodes - 1).toString())!;
    if (!this.NodeExist(node)) {
      alert('node not found');
      return;
    }
    this.cy.remove(this.cy.getElementById(node));
    this.NumberOfNodes--;
    this.Organize();
    this.graph.removeNode(Number(node));
  }

  Clear() {
    this.cy.elements().remove();
    this.NumberOfNodes = 0;
    this.NextNodes = 0;
    this.graph = new Graph();
  }

  solve() {
    this.overallfunction = '';
    this.forwardPaths = '';
    this.loops = '';
    this.nonTouchingLoops = '';
    this.deltas = '';
    if (this.cy.nodes().filter((ele, i) => ele.hasClass('sourceNode')).empty()) {
      alert('pls specify the src');
      return;
    }
    if (this.cy.nodes().filter((ele, i) => ele.hasClass('endNode')).empty()) {
      alert('pls specify the end');
      return;
    }
    this.showsolution = true;
    this.graph.solve();
    this.overallfunction = "overall transform function = " + this.graph.solution.overallFunction;
    for (let i = 0; i < this.graph.solution.forwardPaths.length; i++) {
      this.forwardPaths = this.forwardPaths.concat("P" + (i + 1) + ": {" + this.graph.solution.forwardPaths[i] + "}\n");
    }
    for (let i = 0; i < this.graph.solution.loops.length; i++) {
      this.loops = this.loops.concat("L" + (i + 1) + ": {" + this.graph.solution.loops[i] + "}\n");
    }
    for (let i = 0; i < this.graph.solution.nonTouchingLoops.length; i++) {
      let tmp: string = (i + 2) + " non-touching loops:\n";
      this.graph.solution.nonTouchingLoops[i].forEach((value: number[][]) => {
        tmp = tmp.concat("[");
        value.forEach((value: number[]) => { tmp = tmp.concat(" {" + value + "} "); })
        tmp = tmp.concat("] ");
      })
      tmp = tmp.concat("\n");
      this.nonTouchingLoops = this.nonTouchingLoops.concat(tmp);
    }
    for (let i = 0; i < this.graph.solution.answerDeltas.length; i++) {
      if (i === 0) {
        this.deltas = this.deltas.concat("Δ = " + this.graph.solution.answerDeltas[i] + "\n");
      } else {
        this.deltas = this.deltas.concat("Δ" + i + " = " + this.graph.solution.answerDeltas[i] + "\n");
      }
    }
  }

  closeSolution() {
    this.showsolution = false;
  }
}
