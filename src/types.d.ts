interface ISolarSystem {
    readonly sun:        ICelestialBody;
    readonly orbiters:   IOrbitingBody[];
    readonly orbiterIds: Map<number, IOrbitingBody>;
}

interface ICelestialBody {
    readonly id:                number;
    readonly name:              string;
    readonly radius:            number;
    readonly maxTerrainHeight?: number;
    readonly atmosphereHeight?: number;
    readonly mass:              number;
    readonly stdGravParam:      number;
    readonly soi:               number;
    readonly color:             IColor;
}

interface IOrbitingBody extends ICelestialBody {
    readonly orbiting:      number;
    readonly orbit:         IOrbit;
}

interface IOrbit {
    readonly semiMajorAxis:     number;
    readonly apoapsis?:         number;
    readonly periapsis?:        number;
    readonly eccentricity:      number;
    readonly inclination:       number;
    readonly argOfPeriapsis:    number;
    readonly ascNodeLongitude:  number;
    meanAnomalyEpoch:           number;
    epoch:                      number;
    readonly semiLatusRectum:   number;
    readonly siderealPeriod:    number;
    readonly orbiting:          number;
}

interface ITransfer {
    readonly system:                    ISolarSystem;
    readonly startOrbit:                IOrbit;
    readonly endOrbit:                  IOrbit;
    readonly startDate:                 number;
    readonly flightTime:                number;
    readonly endDate:                   number;
    readonly transferTrajectory:        Trajectory;
    readonly ejections:                 Trajectory[];
    readonly insertions:                Trajectory[];
    readonly maneuvers:                 Maneuver[];
    readonly maneuverContexts:          String[];
    readonly deltaV:                    number;
    readonly soiPatchPositions:         Vector3[];
    readonly ejectionInsertionType:     "fastdirect" | "direct" | "fastoberth" | "oberth";
    readonly planeChange:               boolean;
    readonly noInsertionBurn:           boolean;
    readonly matchStartMo:              boolean;
    readonly matchEndMo:                boolean;
    readonly patchPositionError:        number;
    readonly patchTimeError:            number;
}

interface IPorkchop {
    readonly system:                    ISolarSystem;
    readonly startOrbit:                IOrbit;
    readonly endOrbit:                  IOrbit;
    readonly startDates:                number[];
    readonly flightTimes:               number[];
    readonly deltaVs:                   number[][];
    readonly ejectionInsertionType:     "fastdirect" | "direct" | "fastoberth" | "oberth",
    readonly planeChange:               boolean;
    readonly noInsertionBurn:           boolean;
    readonly matchStartMo:              boolean;
    readonly matchEndMo:                boolean;
}

interface IVessel {
    readonly name:          string,
    readonly orbit:         IOrbit,
    readonly maneuvers:     ManeuverComponents[],
}

interface IFlyby {
    readonly inOrbit:   IOrbit,
    readonly outOrbit:  IOrbit,
    readonly maneuver:  Maneuver,
}

interface IMultiFlyby {
    readonly system:                ISolarSystem,
    readonly startOrbit:            IOrbit,
    readonly endOrbit:              IOrbit,
    readonly startDate:             number,
    readonly flightTimes:           number[],
    readonly endDate:               number,
    readonly transferBody:          ICelestialBody,
    readonly flybyIdSequence:       number[],
    readonly ejections:             Trajectory[],
    readonly insertions:            TrajcetoryInfo[],
    readonly transfers:             Trajectory[],
    readonly flybys:                Trajectory[],
    readonly maneuvers:             Maneuver[],
    readonly maneuverContexts:      String[],
    readonly soiPatchPositions:     Vector3[],
    readonly flybyDurations:        {inTime: number, outTime: number, total: number}[];
    readonly deltaV:                number,
    readonly ejectionInsertionType: "fastdirect" | "direct" | "fastoberth" | "oberth";
    readonly planeChange:           boolean,
    readonly matchStartMo:          boolean,
    readonly matchEndMo:            boolean,
    readonly noInsertionBurn:       boolean,
    readonly patchPositionError:    number;
    readonly patchTimeError:        number;
}

type Vector2 = {x: number, y: number};
type Vector3 = {x: number, y: number, z: number};
type Spherical = {r: number, theta: number, phi: number};

type Agent = number[];

type OrbitalState = {
    date:            number,
    readonly pos:    Vector3,
    readonly vel:    Vector3,
};

type OrbitalElements = {
    readonly orbiting:           number,
    readonly semiMajorAxis:      number,
    readonly eccentricity:       number,
    readonly inclination:        number,
    readonly argOfPeriapsis:     number,
    readonly ascNodeLongitude:   number,
    readonly meanAnomalyEpoch:   number,
    readonly epoch:              number,
    readonly semiLatusRectum?:   number,
    readonly siderealPeriod?:    number,
};

type Trajectory = {
    readonly orbits:         IOrbit[],
    readonly intersectTimes: number[],
    readonly maneuvers:      Maneuver[],
}

type Maneuver = {
    readonly preState:   OrbitalState,
    readonly postState:  OrbitalState,
    readonly deltaV:     Vector3,
    readonly deltaVMag:  number,
}

type ManeuverComponents = {
    readonly prograde:  number,
    readonly normal:    number,
    readonly radial:    number,
    readonly date:      number,
}

type OrbitingBodyInputs = {
    readonly id:                number;
    readonly name:              string;
    readonly radius:            number;
    readonly maxTerrainHeight?: number;
    readonly atmosphereHeight?: number;
    readonly geeASL?:           number;
    readonly mass?:             number;
    readonly stdGravParam?:     number;
    readonly soi?:              number;
    readonly color?:            IColor;
    readonly orbit:             OrbitalElements;
}

type FlybyInputs = {
    readonly velIn:             Vector3;
    readonly velOut:            Vector3;
    readonly body:              IOrbitingBody;
    readonly time:              number;
}

type FlybyParams = {
    readonly inSemiMajorAxis:   number;
    readonly inEccentricity:    number;
    readonly inDirection:       Vector3;
    readonly outSemiMajorAxis:  number;
    readonly outEccentricity:   number;
    readonly outDirection:      Vector3;
    readonly normalDirection:   Vector3;
    readonly deltaV:            number;
    readonly error:             number;
    readonly time:              number;
}

type TransferInputs = {
    readonly system:                    SolarSystem;
    readonly startOrbit:                IOrbit;
    readonly endOrbit:                  IOrbit;
    readonly startDate:                 number;
    readonly flightTime:                number;
    readonly sequenceUp?:               number[];
    readonly sequenceDown?:             number[];
    readonly startBody?:                ICelestialBody;
    readonly endBody?:                  ICelestialBody;
    readonly transferBody?:             ICelestialBody;
    readonly soiPatchPositions?:        Vector3[];
    readonly ejectionInsertionType?:    "fastdirect" | "direct" | "fastoberth" | "oberth",
    readonly planeChange?:              boolean;
    readonly matchStartMo?:             boolean;
    readonly matchEndMo?:               boolean;
    readonly noInsertionBurn?:          boolean;
}

type PorkchopInputs = {
    readonly system:                    SolarSystem;
    readonly startOrbit:                IOrbit;
    readonly endOrbit:                  IOrbit;
    startDateMin:                       number;
    startDateMax:                       number;
    flightTimeMin:                      number;
    flightTimeMax:                      number;
    readonly nTimes:                    number;
    readonly ejectionInsertionType?:    "fastdirect" | "direct" | "fastoberth" | "oberth",
    readonly planeChange?:              boolean;
    readonly matchStartMo?:             boolean;
    readonly matchEndMo?:               boolean;
    readonly noInsertionBurn?:          boolean;
}

type MultiFlybyInputs = {
    readonly system:                    SolarSystem;
    readonly startOrbit:                IOrbit;
    readonly endOrbit:                  IOrbit;
    readonly flybyIdSequence:           number[];
    readonly startDate:                 number;
    readonly flightTimes:               number[];
    readonly soiPatchPositions?:        Vector3[];
    readonly flybyDurations?:           {inTime: number, outTime: number, total: number}[],
    readonly ejectionInsertionType?:    "fastdirect" | "direct" | "fastoberth" | "oberth",
    readonly planeChange?:              boolean;
    readonly matchStartMo?:             boolean;
    readonly matchEndMo?:               boolean;
    readonly noInsertionBurn?:          boolean;
}

type MultiFlybySearchInputs = {
    readonly system:                    SolarSystem;
    readonly startOrbit:                IOrbit;
    readonly endOrbit:                  IOrbit;
    readonly flybyIdSequence:           number[];
    readonly startDateMin:              number;
    readonly startDateMax:              number;
    readonly flightTimesMin:            number[];
    readonly flightTimesMax:            number[];
    readonly ejectionInsertionType?:    "fastdirect" | "direct" | "fastoberth" | "oberth",
    readonly planeChange?:              boolean;
    readonly matchStartMo?:             boolean;
    readonly matchEndMo?:               boolean;
    readonly noInsertionBurn?:          boolean;
}

type FlightPlan = {
    readonly name:                      string;
    readonly color:                     IColor;
    readonly trajectories:              Trajectory[];
}

// Plotting and Display

type TimeSettings = {
    readonly hoursPerDay:       number,
    readonly daysPerYear:       number,
}

type CalendarDate = {
    readonly year:      number,
    readonly day:       number,
    readonly hour:      number,
    readonly minute:    number,
    readonly second:    number,
}

type PorkchopData = {
    readonly deltaVs:       number[][],
    readonly startDates:    number[],
    readonly flightTimes:   number[],
    readonly timeSettings:  TimeSettings,
}

interface IColor {
    readonly r:      number,
    readonly g:      number,
    readonly b:      number,
    readonly a?:     number,
}

type LineOptions = {
    color?:                  number[] | string | undefined,
    readonly colorscale?:    string | string[][] | undefined,
    readonly dash?:          "dash" | "dashdot" | "dot" | "longdash" | "longdashdot" | "solid" | undefined,
    readonly width?:         number | undefined,
}

type MarkerOptions = {
    color?:                  number[] | string | undefined,
    readonly colorscale?:    string | string[][] | undefined,
    readonly symbol?:        "circle" | "circle-open" | "cross" | "diamond" | "diamond-open" | "square" | "square-open" | "x" | undefined,
    readonly size?:          number | undefined,
}

type Font = {
    readonly family: string,
    readonly size:   number,
}

type HoverLabel = {
    readonly bgcolor?:       string,
    readonly bordercolor?:   string,
    readonly font?:          Font,
    readonly align?:         "left" | "auto" | "right" | undefined,
}

type Line3DTrace = {
    x:                       number[],
    y:                       number[],
    z:                       number[],
    readonly type:           "scatter3d",
    readonly mode:           "lines",
    line?:                   LineOptions,
    readonly customdata?:    any,
    readonly name?:          string | undefined,
    readonly hovertemplate?: string,
    readonly hoverinfo?:     "skip" | undefined,
    readonly hoverlabel?:    HoverLabel,
    readonly showlegend?:    boolean | undefined,
    readonly visible?:       "legendonly" | undefined,
}

type Marker3DTrace = {
    x:                       number[],
    y:                       number[],
    z:                       number[],
    readonly type:           "scatter3d",
    readonly mode:           "markers",
    marker?:                 MarkerOptions,
    readonly customdata?:    any,
    readonly name?:          string | undefined,
    readonly hovertemplate?: string,
    readonly hoverinfo?:     "skip" | undefined,
    readonly hoverlabel?:    HoverLabel,
    readonly showlegend?:    boolean | undefined,
    readonly visible?:       "legendonly" | undefined,            
}

type Mesh3DTrace = {
    x:                       number[],
    y:                       number[],
    z:                       number[],
    i:                       number[],
    j:                       number[],
    k:                       number[],
    readonly type:           "mesh3d",
    opacity:                 number,
    intensity:               number[],
    colorscale:              [number, String][];
}

type SystemTraces = {
    bodyOrbitTraces:        Line3DTrace[],
    centralBodyTrace:       Line3DTrace | Mesh3DTrace,
    centralBodyOrbitTrace?: Line3DTrace,
    orbitingBodyTraces:     Line3DTrace[],
    orbitingSoiTraces:      Line3DTrace[],
    markerTraces:           Line3DTrace[],
}

type OrbitPlotTraces = {
    systemTraces:       SystemTraces,
    orbitTraces:        Line3DTrace[],
    markerTraces?:      Marker3DTrace[],
}


// React component types
type PorkchopPlotData = {
    deltaVs:            number[][],
    startDates:         number[],
    flightTimes:        number[],
    logDeltaVs:         number[][],
    startDays:          number[],
    flightDays:         number[],
    levels:             number[],
    logLevels:          number[],
    tickLabels:         string[],
    bestTransfer:       ITransfer,
    transferStartDay:   number,
    transferFlightDay:  number,
}