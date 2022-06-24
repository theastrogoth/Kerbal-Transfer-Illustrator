// import { TWO_PI, HALF_PI, radToDeg, linspace, wrapAngle, mag3, sub3, vec3, timeToCalendarDate } from "./math";
// import Kepler from "./kepler";
// import { CelestialBody, isOrbitingBody } from "../objects/body";
// import { OrbitingBody } from "../objects/body";
// import { Color } from "../objects/color";

// export namespace Draw {

//     function orbitHoverLabel(c: IColor): HoverLabel {
//         const color = new Color(c);
//         const font: Font = {
//             family: "Courier New, monospace",
//             size: 10,
//         };
//         const align = "left";

//         return {bgcolor: color.toString(), font, align}

//     }

//     ///// Orbit drawing /////
//     export function drawOrbitPathFromAngles(orbit: IOrbit, minTrueAnomaly: number, maxTrueAnomaly: number, startTime: number, timeSettings: TimeSettings, color: IColor, name: string | undefined, 
//                                             colorfade: boolean = true, dash: "dash" | "dot" | "longdash" | "solid" | undefined = "solid", nPoints: number = 201): Line3DTrace {
//         // true anomalies, positions, and times
//         const safeMaxTrueAnomaly = wrapAngle(maxTrueAnomaly, minTrueAnomaly + 1e-6);
//         const nus = linspace(minTrueAnomaly, safeMaxTrueAnomaly, nPoints);
//         // const nus2: number[] = [];
//         let positions: Vector3[] = [];
//         let times: number[] = [];
//         let tMin = startTime - 1e-6;

//         for(let i=0; i<nus.length; i++) {
//             positions.push(Kepler.positionAtTrueAnomaly(orbit, nus[i]));
//             tMin = (Kepler.trueAnomalyToOrbitDate(nus[i], orbit, orbit.eccentricity < 1 ? tMin : undefined));
//             times.push(tMin);
//             // nus2.push(Kepler.dateToOrbitTrueAnomaly(tMin, orbit));
//         }

//         // attempt to debug hyperbolic orbit dates
//         // if(orbit.eccentricity > 1) {
//         //     // console.log(times[0], times[times.length -1])
//         //     // console.log(times)
//         //     // console.log(positions[positions.length - 1], Kepler.orbitToPositionAtDate(orbit, times[times.length - 1]))
//         //     // console.log(orbit)
//         //     // console.log(nus[nus.length -1], Kepler.dateToOrbitTrueAnomaly(times[times.length-1], orbit))
//         //     // console.log(nus)
//         //     // console.log(nus2)
//         // }
 
//         // separate out coordinates for plotting
//         const x = positions.map(i => i.x);
//         const y = positions.map(i => i.y);
//         const z = positions.map(i => i.z);

//         // dates from times in seconds
//         const dates = times.map(timeSec => timeToCalendarDate(timeSec, timeSettings, 1, 1));

//         // line attributes
//         const c = new Color(color);
//         const colorscale = [["0", c.rescale(1/3).toString()], ["1", c.toString()]];

//         const line: LineOptions = colorfade ?
//         {
//             color: nus,
//             colorscale,
//             dash,
//         } :
//         {
//             color: c.rescale(0.75).toString(),
//             dash,
//         };


//         // hover display
//         const customdata = [...nus.keys()].map(i => 
//                                 [mag3(positions[i])/1000,
//                                  dates[i].year,
//                                  dates[i].day,
//                                  dates[i].hour,
//                                  dates[i].minute,
//                                  dates[i].second,
//                                  times[i],
//                                  wrapAngle(nus[i])]);
                                 
//         const hovertemplate =   "<b>Orbital Distance</b><br>".concat(
//                                 "   r  = %{customdata[0]:.3e} km<br>",
//                                 "<b>Date and Time</b><br>",
//                                 "   Year %{customdata[1]:.0f}, " ,
//                                 "Day %{customdata[2]:.0f}, " ,
//                                 "%{customdata[3]:0>2d}:" ,
//                                 "%{customdata[4]:0>2d}:" ,
//                                 "%{customdata[5]:0>2d}<br>" ,
//                                 "   UT:  %{customdata[6]:.3f} s<br>" ,
//                                 "   θ:   %{customdata[7]:.5f} rad<br>" ,
//                                 "<b>Orbit Parameters</b><br>",
//                                 "   periapsis = ", (Math.round(orbit.periapsis || orbit.semiMajorAxis*(1-orbit.eccentricity))).toString(), " m<br>" ,
//                                 "   apoapsis  = ", orbit.eccentricity > 1 ? "Inf<br>" : (Math.round(orbit.apoapsis || orbit.semiMajorAxis*(1+orbit.eccentricity))).toString() + " m<br>",
//                                 "   a  = ", (Math.round(orbit.semiMajorAxis)).toString(), " m<br>" ,
//                                 "   e  = ", (Math.round(orbit.eccentricity * 1000) / 1000.0).toString(), "<br>" ,
//                                 "   i  = ", (Math.round(radToDeg(orbit.inclination) * 1000) / 1000.0).toString(), "°<br>" ,
//                                 "   ω  = ", (Math.round(radToDeg(orbit.argOfPeriapsis) * 1000) / 1000.0).toString(), "°<br>",
//                                 "   Ω  = ", (Math.round(radToDeg(orbit.ascNodeLongitude) * 1000) / 1000.0).toString(), "°<br>",
//                                 "   Mₒ = ", (Math.round(orbit.meanAnomalyEpoch * 1000) / 1000.0).toString(), " rad<br>",
//                                 "   tₒ = ", (Math.round(orbit.epoch * 100) / 100.0).toString(), " s");

//         const hoverlabel = orbitHoverLabel(color);

//         return {
//             x,
//             y,
//             z,
//             mode: "lines",
//             type: "scatter3d",
//             line,
//             customdata,
//             name,
//             hovertemplate,
//             hoverlabel,
//             showlegend: false,
//         }
//     }

//     export function drawOrbitPathFromTimes(orbit: IOrbit, startTime: number, endTime: number, timeSettings: TimeSettings, color: Color = new Color({r: 255, g: 255, b: 255}), name: string | undefined = undefined, 
//                                            colorfade: boolean = true, dash: "dash" | "dot" | "longdash" | "solid" | undefined = "solid", nPoints: number = 201): Line3DTrace {
//         const minTrueAnomaly = Kepler.dateToOrbitTrueAnomaly(startTime, orbit);
//         const maxTrueAnomaly = (orbit.eccentricity < 1 && (endTime > startTime + orbit.siderealPeriod)) ? minTrueAnomaly : Kepler.dateToOrbitTrueAnomaly(endTime, orbit);
//         return drawOrbitPathFromAngles(orbit, minTrueAnomaly, maxTrueAnomaly, startTime, timeSettings, color, name, colorfade, dash, nPoints)
//     }

//     export function drawOrbitPathFromStartTime(orbit: IOrbit, startTime: number, timeSettings: TimeSettings, color: Color = new Color({r: 255, g: 255, b: 255}), name: string | undefined = undefined, 
//                                                colorfade: boolean = true, dash: "dash" | "dot" | "longdash" | "solid" | undefined = "solid", nPoints: number = 201): Line3DTrace {
//         let endTime: number;
//         if (orbit.eccentricity < 1){
//             endTime = startTime + orbit.siderealPeriod;
//         } else {
//             // TO DO: figure out convenient way to acces SOI here
//             endTime = startTime + orbit.siderealPeriod;
//         }
//         return drawOrbitPathFromTimes(orbit, startTime, endTime, timeSettings, color, name, colorfade, dash, nPoints)
//     }

//     export function drawBodyOrbitFromAngles(body: OrbitingBody, minTrueAnomaly: number, maxTrueAnomaly: number, startTime: number, timeSettings: TimeSettings,
//                                            colorfade: boolean = true,  dash: "dash" | "dot" | "longdash" | "solid" | undefined = "solid", nPoints: number = 201): Line3DTrace {
//         const orbit = body.orbit;
//         const color = body.color;
//         const name = body.name;
//         return drawOrbitPathFromAngles(orbit, minTrueAnomaly, maxTrueAnomaly, startTime, timeSettings, color, name, colorfade, dash, nPoints);
//     }

//     export function drawBodyOrbitFromStartTime(body: OrbitingBody, startTime: number, timeSettings: TimeSettings, 
//                                                colorfade: boolean = true, dash: "dash" | "dot" | "longdash" | "solid" | undefined = "solid", nPoints: number = 201): Line3DTrace {
//         const orbit = body.orbit;
//         const color = body.color;
//         const name = body.name;
//         return drawOrbitPathFromStartTime(orbit, startTime, timeSettings, color, name, colorfade, dash, nPoints);
//     }

//     export function drawCentralBodyOrbitAtAngle(body: OrbitingBody, nu: number, colorfade: boolean = true, nPoints: number = 201): Line3DTrace {
//         // calculate starting and stopping true anomalies for plotting
//         const plotSize = body.orbiters.length === 0 ? body.soi : 1.5 * body.furtherstOrbiterDistance;
//         const dist = Kepler.distanceAtOrbitTrueAnomaly(nu, body.orbit)
//         const arcWidth = plotSize / dist;
//         const angles = linspace(nu - arcWidth, nu + arcWidth, nPoints).map(a => wrapAngle(a, nu));

//         // calculate positions 
//         const currentPosition = Kepler.positionAtTrueAnomaly(body.orbit, nu);
//         const positions: Vector3[] = angles.map(a => sub3(Kepler.positionAtTrueAnomaly(body.orbit, a), currentPosition));

//         // separate out coordinates for plotting
//         const x = positions.map(i => i.x);
//         const y = positions.map(i => i.y);
//         const z = positions.map(i => i.z);

//          // line attributes
//          const line: LineOptions = colorfade ?
//          {
//              color: angles,
//              colorscale: [["0", body.color.rescale(1/3).toString()], ["1", body.color.toString()]],
//          } :
//          {
//              color: body.color.rescale(0.5).toString(),
//          };

//          // return trace
//          return {
//             x,
//             y,
//             z,
//             mode:           "lines",
//             type:           "scatter3d",
//             line:           line,
//             name:           body.name,
//             hoverinfo:      "skip",
//             showlegend:     false,
//         }
//     }
//     export function drawCentralBodyOrbitAtTime(body: OrbitingBody, time: number, colorfade: boolean = true, nPoints: number = 201): Line3DTrace {
//         const nu = Kepler.dateToOrbitTrueAnomaly(time, body.orbit);
//         return drawCentralBodyOrbitAtAngle(body, nu, colorfade, nPoints);
//     }

//     ///// Body/Object drawing /////
//     // wireframe
//     export function drawWireframeSphere(center: Vector3, radius: number, line: LineOptions | undefined, name: string | undefined = '', color: IColor = {r: 255, g: 255, b: 255}, hovertemplate: string | undefined = name, nPoints: number = 11): Line3DTrace {
//         const phis = linspace(0, TWO_PI, nPoints);              // this is the angle of a vector projected to the x-y plane from the +x-axis
//         const thetas = linspace(-HALF_PI, HALF_PI, nPoints);    // this is the angle of a vector with the positive z-axis
//         // vertical circles (longitude lines)
//         const vxs = phis.map(phi => thetas.map(theta => radius * Math.cos(theta) * Math.sin(phi) + center.x)); //.concat([NaN]));
//         const vys = phis.map(phi => thetas.map(theta => radius * Math.cos(theta) * Math.cos(phi) + center.y)); //.concat([NaN]));
//         const vzs = phis.map(phi => thetas.map(theta => radius * Math.sin(theta) + center.z));
//         // horizontal circles (latitude lines)
//         const hxs = thetas.map(theta => phis.map(phi => radius * Math.cos(theta) * Math.sin(phi) + center.x)); //.concat([NaN]));
//         const hys = thetas.map(theta => phis.map(phi => radius * Math.cos(theta) * Math.cos(phi) + center.y)); //.concat([NaN]));
//         const hzs = thetas.map(theta => phis.map(phi => radius * Math.sin(theta) + center.z)); //.concat([NaN]));

//         const x = vxs.flat().concat(hxs.flat());
//         const y = vys.flat().concat(hys.flat());
//         const z = vzs.flat().concat(hzs.flat());

//         const hoverinfo = (hovertemplate === '' || hovertemplate === undefined) ? 'skip' : undefined;

//         const hoverlabel = orbitHoverLabel(color);

//         return {x,
//                 y,
//                 z,
//                 mode: "lines",
//                 type: "scatter3d",
//                 line,
//                 name,
//                 hovertemplate,
//                 hoverinfo,
//                 hoverlabel,
//                 showlegend: false,
//         }
//     }

//     // mesh3D
//     // export function drawMeshSphere() {}

//     export function drawCentralBodySphere(body: ICelestialBody, nPoints = 11): Line3DTrace {
//         const center = vec3(0,0,0);
//         const radius = body.radius;
//         const name = body.name;
//         const line: LineOptions = {color: (new Color(body.color)).toString()};
//         const hovertemplate = ("<b>"+name+"</b><br>").concat(
//             "   radius = ", (Math.round(body.radius)).toString(), " m<br>" ,
//             body.soi ? ("   SoI    = " + (Math.round(body.soi as number)).toString() + " m<br>") : '',
//             body.atmosphereHeight ? "   atmosphere height = " + (Math.round(body.atmosphereHeight)).toString() + " m<br>" : "",
//             body.maxTerrainHeight ? "   highest terrain   = " + (Math.round(body.maxTerrainHeight)).toString() + " m<br>" : "",
//         )
//         return drawWireframeSphere(center, radius, line, name, body.color, hovertemplate, nPoints);
//     }

//     export function drawOrbitingBodySphereAtAngle(body: IOrbitingBody, nu: number, nPoints: number = 11): Line3DTrace {
//         const center = Kepler.positionAtTrueAnomaly(body.orbit, nu);
//         const radius = body.radius;
//         const name = body.name;
//         const line: LineOptions = {color: (new Color(body.color)).toString()};
//         const hovertemplate = ("<b>"+name+"</b><br>").concat(
//             "   radius = ", (Math.round(body.radius)).toString(), " m<br>" ,
//             "   SoI    = ", (Math.round(body.soi)).toString(), " m<br>",
//             body.atmosphereHeight ? "   atmosphere height = " + (Math.round(body.atmosphereHeight)).toString() + " m<br>" : "",
//             body.maxTerrainHeight ? "   highest terrain   = " + (Math.round(body.maxTerrainHeight)).toString() + " m<br>" : "",
//         )
//         return drawWireframeSphere(center, radius, line, name, body.color, hovertemplate, nPoints);
//     }

//     export function drawOrbitingBodySphereAtTime(body: IOrbitingBody, time: number, nPoints: number = 11): Line3DTrace {
//         const nu = Kepler.dateToOrbitTrueAnomaly(time, body.orbit);
//         return drawOrbitingBodySphereAtAngle(body, nu, nPoints);
//     }

//     export function drawSoiSphereAtAngle(body: IOrbitingBody, nu: number, nPoints: number = 11): Line3DTrace {
//         const center = Kepler.positionAtTrueAnomaly(body.orbit, nu);
//         const radius = body.soi;
//         const name = body.name;
//         const fadedColor = new Color(body.color).rescale(1/2);
//         const line: LineOptions = {color: fadedColor.toString()};
//         const hovertemplate = ("<b>"+name+"</b><br>").concat(
//             "   SoI    = ", (Math.round(body.soi)).toString(), " m<br>",
//         )
//         return drawWireframeSphere(center, radius, line, name, fadedColor, hovertemplate, nPoints);
//     }

//     export function drawSoiSphereAtTime(body: IOrbitingBody, time: number, nPoints: number = 11): Line3DTrace {
//         const nu = Kepler.dateToOrbitTrueAnomaly(time, body.orbit);
//         return drawSoiSphereAtAngle(body, nu, nPoints);
//     }

//     ///// markers and text /////

//     export function drawReferenceDirection(centralBody: CelestialBody): Line3DTrace {
//         const dist = getPlotSize(centralBody);
//         return {
//             x:          [0, dist],
//             y:          [0, 0],
//             z:          [0, 0],
//             mode:       "lines",
//             type:       "scatter3d",
//             line:       {color: (new Color({r: 255, g: 255, b: 255})).toString(), dash: "longdash"},
//             name:       "Reference Direction",
//             hoverinfo:  "skip",
//             showlegend: true,
//             visible:    "legendonly",
//         }
//     }

//     export function drawOrbitPositionMarkerAtTime(orbit: IOrbit, time: number, symbol: "circle" | "circle-open" | "cross" | "diamond" | "diamond-open" | "square" | "square-open" | "x" | undefined = "diamond", size: number = 3, color: Color = new Color({r: 255, g: 255, b: 255}), name: string | undefined = 'Vessel'): Marker3DTrace {
//         const pos = Kepler.orbitToPositionAtDate(orbit, time);
//         return {
//             x:      [pos.x],
//             y:      [pos.y],
//             z:      [pos.z],
//             mode:   "markers",
//             type:   "scatter3d",
//             marker: {symbol, size, color: color.toString()},
//             name,
//             hoverinfo: "skip",
//             showlegend: false,
//         }
//     }

//     ///// draw entire system //////

//     export function drawSystemAtTime(centralBody: CelestialBody, time: number, timeSettings: TimeSettings, 
//                                      colorfade: boolean = true, dash: "dash" | "dot" | "longdash" | "solid" | undefined = "solid", nPoints: number = 201): SystemTraces {
//         const bodyOrbitTraces       = centralBody.orbiters.map(body => drawBodyOrbitFromStartTime(body, time, timeSettings, colorfade, dash, nPoints));
//         const centralBodyTrace      = drawCentralBodySphere(centralBody);
//         const orbitingBodyTraces    = centralBody.orbiters.map(body => drawOrbitingBodySphereAtTime(body, time));
//         const orbitingSoiTraces     = centralBody.orbiters.map(body => drawSoiSphereAtTime(body, time));
//         const markerTraces          = [drawReferenceDirection(centralBody)];

//         if(isOrbitingBody(centralBody)) {
//             const centralBodyOrbitTrace = drawCentralBodyOrbitAtTime(centralBody, time, colorfade, nPoints);
//             return {
//                 bodyOrbitTraces,
//                 centralBodyTrace,
//                 centralBodyOrbitTrace,
//                 orbitingBodyTraces,
//                 orbitingSoiTraces,
//                 markerTraces,
//             }
//         } else {
//             return {
//                 bodyOrbitTraces,
//                 centralBodyTrace,
//                 orbitingBodyTraces,
//                 orbitingSoiTraces,
//                 markerTraces,
//             }
//         }
//     }

//     export function getPlotSize(centralBody: CelestialBody) {
//         const plotSize = centralBody.orbiters.length === 0 ? centralBody.soi || 2 * centralBody.radius : 2 * centralBody.furtherstOrbiterDistance;
//         return plotSize;
//     }

// }

// export default Draw;