// import React from "react";
// import Plot from "react-plotly.js";

// export class OrbitPlot extends React.Component<{ uirevision: string, plotSize: number, traces: OrbitPlotTraces }> {

//     shouldComponentUpdate(nextProps: any): boolean {
//         if (this.props.traces === nextProps.traces) {
//             return false;
//         } 
//         return true;
//     }

//     render() {
//         return (
//             <Plot
//             // @ts-ignore
//                 data={[
//                     ...this.props.traces.orbitTraces,
//                     this.props.traces.systemTraces.centralBodyTrace,
//                     ...this.props.traces.systemTraces.bodyOrbitTraces,
//                     ...this.props.traces.systemTraces.orbitingBodyTraces,
//                     ...this.props.traces.systemTraces.orbitingSoiTraces,
//                     ...this.props.traces.systemTraces.markerTraces,
//                     ...(this.props.traces.systemTraces.centralBodyOrbitTrace !== undefined ? [this.props.traces.systemTraces.centralBodyOrbitTrace] : [] as Line3DTrace[]),
//                     ...(this.props.traces.markerTraces !== undefined ? this.props.traces.markerTraces : [] as Marker3DTrace[]),
//                 ]}
//                 useResizeHandler={true}
//                 style={{ width: '100%', height: '100%' }}
//                 layout={{
//                     uirevision: this.props.uirevision,
//                     autosize: true,
//                     paper_bgcolor:  "rgb(30,30,30)",
//                     plot_bgcolor:   "rgb(30,30,30)",
//                     margin:         {l: 0, r: 0, b: 0, t: 20},
//                     legend: {
//                         xanchor:        "right",
//                         font:           {color: "white"},
//                         bgcolor:        'rgba(0,0,0,0)'
//                     },
//                     scene: {
//                         aspectmode: "cube",
//                         xaxis: {
//                             visible: false,
//                             range: [-this.props.plotSize, this.props.plotSize]
//                         },
//                         yaxis: {
//                             visible: false,
//                             range: [-this.props.plotSize, this.props.plotSize]
//                         },
//                         zaxis: {
//                             visible: false,
//                             range: [-this.props.plotSize, this.props.plotSize]
//                         },
//                         camera: {
//                             center: {x: 0, y: 0, z: 0},
//                             eye:    {x: 0.2, y: 0.2, z: 0.2},
//                         }
//                     },
//                 }}
//             />
//         )
//     }
// }

// export default React.memo(OrbitPlot);