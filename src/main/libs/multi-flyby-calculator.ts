import MultiFlyby from "../objects/multiflyby";
import Trajectories from "./trajectories";
import FlybyCalcs from "./flybycalcs";
import Kepler from "./kepler";
import { sub3, mag3, vec3, randomSign, cartesianToSpherical, sphericalToCartesian, mult3, lerp, clamp } from "./math";
import { nelderMeadMinimize } from "./optim";
import DifferentialEvolution from "./evolution";

class MultiFlybyCalculator {
    private readonly _system!:          ISolarSystem;

    private _startOrbit:                IOrbit;
    private _endOrbit:                  IOrbit;
    private _flybyIdSequence:           number[];
    private _flybyBodySequence:         IOrbitingBody[];

    private _startDate:                 number;
    private _flightTimes:               number[];
    private _flybyEncounterDates:       number[];
    private _endDate:                   number;

    private _DSMparams:                 DeepSpaceManeuverParams[];

    private _startBody:                 ICelestialBody;
    private _endBody:                   ICelestialBody;
    private _transferBody:              ICelestialBody;

    private _sequenceUp!:               number[];
    private _sequenceDown!:             number[];

    private _transferVelocities!:       {velOut: Vector3, velIn: Vector3}[];
    private _flybyParams:               FlybyParams[];

    private _transfers:                 Trajectory[];
    private _ejections:                 Trajectory[];
    private _insertions:                Trajectory[];
    private _flybys:                    Trajectory[];

    private _soiPatchPositions:         Vector3[];
    private _soiPatchBodies:            IOrbitingBody[];
    private _flybyDurations:            {inTime: number, outTime: number, total: number}[];
    private _summedPeriods?:            number;
    private _patchOptimizationBounds?:  number[][];

    private _ejectionInsertionType:    "fastdirect" | "fastoberth" | "direct" | "oberth";
    private _planeChange:               0 | 1 | 2;
    private _matchStartMo:              boolean;
    private _matchEndMo:                boolean;
    private _noInsertionBurn:           boolean;

    private _maneuvers:                 Maneuver[];
    private _maneuverContexts:          string[];
    private _deltaV!:                   number;

    constructor(inputs: MultiFlybyInputs) {
        this._system            = inputs.system;

        this._startOrbit        = inputs.startOrbit;
        this._endOrbit          = inputs.endOrbit;
        this._flybyIdSequence   = inputs.flybyIdSequence;
        this._flybyBodySequence = inputs.flybyIdSequence.map(i => this.bodyFromId(i) as IOrbitingBody);

        this._startDate         = inputs.startDate;
        this._flightTimes       = inputs.flightTimes;

        this._DSMparams         = inputs.DSMparams || [];

        this._startBody         = this.bodyFromId(this._startOrbit.orbiting);
        this._endBody           = this.bodyFromId(this._endOrbit.orbiting);
        this._transferBody      = this.bodyFromId(this.commonAttractorId(this._startBody.id, this._endBody.id));

        this._ejectionInsertionType = inputs.ejectionInsertionType || "fastdirect";
        this._planeChange       = inputs.planeChange || 0;    
        this._matchStartMo      = inputs.matchStartMo || true;
        this._matchEndMo        = inputs.matchEndMo || false;     
        this._noInsertionBurn   = inputs.noInsertionBurn || false;
    
        this._flybyEncounterDates = [];
        this._flybyParams         = [];
        this._transferVelocities  = [];
        this._transfers           = [];
        this._flybys              = [];
        this._maneuvers           = [];
        this._maneuverContexts    = [];
        this._ejections           = [];
        this._insertions          = [];

        this.setSequenceUp();
        this.setSequenceDown();



        const soiPatchSequence = [...this._sequenceUp.slice(0, this._sequenceUp.length - 1)];
        for (let i=0; i<this._flybyIdSequence.length; i++) {
            soiPatchSequence.push(this._flybyIdSequence[i], this._flybyIdSequence[i]);
        }
        soiPatchSequence.push(...this._sequenceDown.slice(1, this._sequenceDown.length));
        this._soiPatchBodies = soiPatchSequence.map(i => this.bodyFromId(i) as IOrbitingBody);

        // if not provided set all soi patch corrections to zero
        if(!inputs.soiPatchPositions) {
            this._soiPatchPositions = [];
            for (let i=0; i<soiPatchSequence.length; i++) {
                this._soiPatchPositions.push(vec3(0,0,0));
            }
        } else {
            this._soiPatchPositions = inputs.soiPatchPositions;
        }

        let sumDurations = 0.0;
        if(!inputs.flybyDurations) {
            this._flybyDurations = this._flybyIdSequence.map(() => {return {inTime: 0.0, outTime: 0.0, total: 0.0}});
        } else {
            this._flybyDurations = inputs.flybyDurations;
            for(let i=0; i<inputs.flybyDurations.length; i++) {
                sumDurations += inputs.flybyDurations[i].total;
            }
        }

        this._endDate = this._startDate + this._flightTimes.reduce((p,c) => p + c) + sumDurations;

        this.computeMinimalTrajectory();
    }

    public get data(): IMultiFlyby {
        return {
            system:                 this._system,
            startOrbit:             this._startOrbit,
            endOrbit:               this._endOrbit,
            startDate:              this._startDate,
            flightTimes:            this._flightTimes,
            endDate:                this._endDate,
            transferBody:           this._transferBody,
            flybyIdSequence:        this._flybyIdSequence,
            DSMparams:              this._DSMparams,
            ejections:              this._ejections,
            insertions:             this._insertions,
            transfers:              this._transfers,
            flybys:                 this._flybys,
            soiPatchPositions:      this._soiPatchPositions,
            flybyDurations:         this._flybyDurations,
            ejectionInsertionType:  this._ejectionInsertionType,
            planeChange:            this._planeChange,
            matchStartMo:           this._matchStartMo,
            matchEndMo:             this._matchEndMo,
            noInsertionBurn:        this._noInsertionBurn,
            maneuvers:              this._maneuvers,
            maneuverContexts:       this._maneuverContexts,
            deltaV:                 this._deltaV,
            patchPositionError:     this.soiPatchPositionError,
            patchTimeError:         this.soiPatchTimeError,
        }
    }

    public get multiFlyby(): MultiFlyby {
        return new MultiFlyby(this.data);
    }

    public get deltaV() {
        return this._deltaV;
    }

    private computeMinimalTrajectory() {
        this.clearTrajectory();
        this.computeTransferTrajectories();
        this.computeFlybyParams();
        this.computeEjectionTrajectories();
        this.computeInsertionTrajectories();
        this.computeDeltaV();
    }

    public computeFullTrajectory() {
        this.computeMinimalTrajectory();
        this.computeFlybyOrbits();
        this.setManeuvers();
        // this.setFlybyDurations();
    }

    private clearTrajectory() {
        this._flybyParams           = [];
        this._flybys                = [];
        this._ejections             = [];
        this._insertions            = [];
        this._transfers             = [];
        this._transferVelocities    = [];
        this._flybyEncounterDates   = [];
        this._maneuvers             = [];
        this._maneuverContexts      = [];
    }

    // private clearFlybyDurations() {
    //     this._flybyDurations = this._flybyIdSequence.map(() => {return {inTime: 0.0, outTime: 0.0, total: 0.0}});
    // }

    private bodyFromId(id: number) {
        if(id === 0) {
            return this._system.sun;
        } else {
            const body = this._system.orbiterIds.get(id);
            if(!body)
                throw new Error(`No body with id ${id}`);
            return body;
        }
    }

    private sequenceToSun(id: number) {
        let bd = this.bodyFromId(id);
        let seq: number[] = [bd.id];
        while(bd.hasOwnProperty("orbiting")) {
            bd = this.bodyFromId((bd as IOrbitingBody).orbiting);
            seq.push(bd.id);
        }
        return seq
    }

    private commonAttractorId(id1: number, id2: number) {
        const sunSeq1 = this.sequenceToSun(id1);
        const sunSeq2 = this.sequenceToSun(id2);
        for(let i=0; i<sunSeq1.length; i++) {
            if(sunSeq2.includes(sunSeq1[i])) {
                return sunSeq1[i]
            }
        }
        throw new Error('Bodies do not share a common attractor (error in defining this SolarSystem)')
    }

    private setSequenceUp() {
        let bd = this._startBody;
        let seq: number[] = [this._startBody.id];
        while(bd.id !== this._transferBody.id) {
            if(bd.hasOwnProperty("orbiting")) {
                bd = this.bodyFromId((bd as IOrbitingBody).orbiting)
                seq.push(bd.id)
            } else {
                throw new Error('The start body does not orbit around the transfer body')
            }
        }
        this._sequenceUp = seq;
    }

    private setSequenceDown() {
        let bd = this._endBody;
        let seq: number[] = [this._endBody.id];
        while(bd.id !== this._transferBody.id) {
            if(bd.hasOwnProperty("orbiting")) {
                bd = this.bodyFromId((bd as IOrbitingBody).orbiting)
                seq.push(bd.id)
            } else {
                throw new Error('The end body does not orbit around the transfer body')
            }
        }
        this._sequenceDown = seq.reverse();
    }

    private computeTransferTrajectories() {
        let eDate = this._startDate;
        let sPatchIdx = this._sequenceUp.length - 2;
        for(let i=0; i<this._flightTimes.length; i++) {
            const sDate = eDate + (i > 0 ? this._flybyDurations[i - 1].total : 0.0);
            const fTime = this._flightTimes[i];
            eDate = sDate + fTime;
            if(i < this._flightTimes.length - 1) {
                this._flybyEncounterDates.push(eDate)
            }

            const DSMparams = this._DSMparams.filter(params => params.leg === i);

            const sBody = this._sequenceUp.length === 0 ? this._transferBody : i === 0 ? this.bodyFromId(this._sequenceUp[this._sequenceUp.length === 1 ? 0 : this._sequenceUp.length -  2])    : this._flybyBodySequence[i -1];
            const eBody = i === this._flightTimes.length - 1 ? this.bodyFromId(this._sequenceDown[this._sequenceDown.length === 1 ? 0 : 1]) : this._flybyBodySequence[i];
            const sOrb  = i === 0 && this._startBody === this._transferBody ? this._startOrbit : (sBody as IOrbitingBody).orbit;
            const eOrb  = i === this._flightTimes.length - 1 && this._endBody === this._transferBody ? this._endOrbit : (eBody as IOrbitingBody).orbit;

            const sPatchPosition = sPatchIdx < 0 ? vec3(0,0,0) : this._soiPatchPositions[sPatchIdx];
            const ePatchPosition = sPatchIdx + 1 >= this._soiPatchPositions.length ? vec3(0,0,0) : this._soiPatchPositions[sPatchIdx + 1];
            sPatchIdx += 2;

            const trajectory = DSMparams.length === 0   ? Trajectories.transferTrajectory(sOrb, eOrb, this._transferBody, sDate, fTime, eDate, this._planeChange, sPatchPosition, ePatchPosition)
                                                        : Trajectories.transferWithDSMs(sOrb, eOrb, this._transferBody, sDate, fTime, eDate, DSMparams, sPatchPosition, ePatchPosition)
            this._transfers.push(trajectory);
            const manLen = trajectory.maneuvers.length;
            this._transferVelocities.push({
                velOut: trajectory.maneuvers[0].deltaV, 
                velIn:  mult3(trajectory.maneuvers[manLen - 1].deltaV, -1),
            });
        }
    }

    private computeFlybyParams() {
        for(let i=0; i<this._flybyIdSequence.length; i++) {
            const velIn  = this._transferVelocities[i].velIn;
            const velOut = this._transferVelocities[i+1].velOut;
            const body   = this._flybyBodySequence[i];
            const time   = this._flybyEncounterDates[i] + this._flybyDurations[i].inTime;

            const params = FlybyCalcs.flybyParameters({velIn, velOut, body, time});
            this._flybyParams.push(params);
        }
    }

    private computeEjectionTrajectories() {
        if(this._startBody.id !== this._transferBody.id) {
            const patchPositions = this._soiPatchPositions.slice(0, this._sequenceUp.length - 1);
            this._ejections = Trajectories.ejectionTrajectories(this._system, this._startOrbit, this._transfers[0].orbits[0], this._sequenceUp, this._startDate, this._matchStartMo, this._ejectionInsertionType, patchPositions);
        }
        if(this._ejections.length > 0 && !this._matchStartMo) {
            this._startOrbit = Kepler.stateToOrbit(this._ejections[0].maneuvers[0].preState, this._startBody)
        }
    }

    private computeInsertionTrajectories() {
        if(this._endBody.id !== this._transferBody.id) {
            const tferLen = this._transfers.length;
            const lastTrajLen = this._transfers[tferLen - 1].orbits.length;
            const patchPositions = this._soiPatchPositions.slice(this._sequenceUp.length - 1 + 2 * this._flybyIdSequence.length);
            this._insertions = Trajectories.insertionTrajectories(this._system, this._endOrbit, this._transfers[tferLen - 1].orbits[lastTrajLen - 1], this._sequenceDown, this._endDate, this._matchEndMo, this._ejectionInsertionType, patchPositions);
        }
        const nInsertions = this._insertions.length;
        if(nInsertions > 0 && !this._matchEndMo) {
            const nManeuvers = this._insertions[nInsertions-1].maneuvers.length;
            this._endOrbit = Kepler.stateToOrbit(this._insertions[nInsertions-1].maneuvers[nManeuvers-1].postState, this._endBody)
        }
    }

    private computeDeltaV() {
        let deltaV = 0.0;
        for(let i=0; i<this._flybyParams.length; i++) {
            deltaV += this._flybyParams[i].deltaV;
        }
        if(this._ejections.length > 0) {
            for(let i=0; i<this._ejections.length; i++) {
                for(let j=1; j<this._ejections[i].maneuvers.length; j++) {
                    deltaV += this._ejections[i].maneuvers[j].deltaVMag;
                }
                if(i === 0) {
                    deltaV += this._ejections[i].maneuvers[0].deltaVMag;
                }
            }
        } else {
            deltaV += mag3(this._transferVelocities[0].velOut);
        }


        for(let i=0; i<this._transfers.length; i++) {
            for(let j=1; j<this._transfers[i].maneuvers.length-1; j++) {
                deltaV += this._transfers[i].maneuvers[j].deltaVMag;
            }
        }
        
        if(this._insertions.length > 0) {
            for(let i=0; i<this._insertions.length; i++) {
                const manLen = this._insertions[i].maneuvers.length
                for( let j=0; j<manLen -1; j++) {
                    deltaV += this._insertions[i].maneuvers[j].deltaVMag;
                }
                if(!this._noInsertionBurn) {
                    if(i === this._insertions.length - 1) {
                        const manLen = this._insertions[i].maneuvers.length
                        deltaV += this._insertions[i].maneuvers[manLen - 1].deltaVMag;
                    }
                }
            }
        } else {
            deltaV += mag3(this._transferVelocities[this._transferVelocities.length - 1].velIn);
        }
        
        this._deltaV = deltaV;
    }

    private get deltaError() {
        let error = 0.0;
        for(let i=0; i<this._flybyParams.length; i++) {
            error += this._flybyParams[i].error;
        }
        return error;
    }

    public computeFitness() {
        if(this._deltaV === undefined) {
            this.computeDeltaV();
        }
        return this._deltaV + 1e6 * this.deltaError;
    }

    private computeFlybyOrbits() {
        for(let i=0; i<this._flybyParams.length; i++) {
            this._flybys.push(FlybyCalcs.flybyFromParameters(this._flybyParams[i], this._flybyBodySequence[i]));
        }
    }

    private setManeuvers() {
        this._maneuvers = [];
        this._maneuverContexts = [];
        if(this._ejections.length > 0) {
            for(let i=0; i<this._ejections.length; i++) {
                if(i === 0) {
                    const maneuvers = this._ejections[i].maneuvers;
                    const bodyname = this.bodyFromId(this._ejections[i].orbits[0].orbiting).name;
                    const contexts = ["Departure Burn"];
                    for(let j=0; j<maneuvers.length - 1; j++) {
                        contexts.push("Oberth Maneuver Burn over " + bodyname)
                    }
                    this._maneuvers.push(...maneuvers);
                    this._maneuverContexts.push(...contexts);
                } else {
                    const maneuvers = this._ejections[i].maneuvers.slice(1)
                    const bodyname = this.bodyFromId(this._ejections[i].orbits[0].orbiting).name;
                    const contexts: string[] = [];
                    for(let j=0; j<maneuvers.length; j++) {
                        contexts.push("Oberth Maneuver Burn over " + bodyname)
                    }
                    this._maneuvers.push(...maneuvers);
                    this._maneuverContexts.push(...contexts);
                }
            }
        } else {
            this._maneuvers.push(this._transfers[0].maneuvers[0]);
            this._maneuverContexts.push("Departure Burn");
        }
        for(let i=0; i<this._transfers.length; i++) {
            const tferManeuvers = this._transfers[i].maneuvers.slice(1,-1)
            const tferContexts: string[] = [];
            for(let j=0; j<tferManeuvers.length; j++) {
                tferContexts.push("Deep Space Maneuver");
            }
            this._maneuvers.push(...tferManeuvers);
            this._maneuverContexts.push(...tferContexts)
            if(i<this._transfers.length - 1) {
                this._maneuvers.push(...this._flybys[i].maneuvers);
                const flybyContexts: string[] = [];
                for(let j=0; j<this._flybys[i].maneuvers.length; j++) {
                    flybyContexts.push("Flyby Burn over " + this._flybyBodySequence[i].name);
                }
                this._maneuverContexts.push(...flybyContexts);
            }
        }
        if(this._insertions.length > 0) {
            for(let i=0; i<this._insertions.length; i++) {
                if(i === this._insertions.length - 1) {
                    const maneuvers = this._insertions[i].maneuvers;
                    const bodyname = this.bodyFromId(this._insertions[i].orbits[0].orbiting).name;
                    const contexts: string[] = [];
                    for(let j=0; j<maneuvers.length - 1; j++) {
                        contexts.push("Oberth Maneuver Burn over " + bodyname);
                    }
                    contexts.push("Arrival Burn");
                    this._maneuvers.push(...maneuvers);
                    this._maneuverContexts.push(...contexts);
                } else {
                    const maneuvers = this._insertions[i].maneuvers.slice(0,-1);
                    const bodyname = this.bodyFromId(this._insertions[i].orbits[0].orbiting).name;
                    const contexts: string[] = [];
                    for(let j=0; j<maneuvers.length; j++) {
                        contexts.push("Oberth Maneuver Burn over " + bodyname)
                    }
                    this._maneuvers.push(...maneuvers);
                    this._maneuverContexts.push(...contexts)
                }
            }
        } else {
            const tferLen = this._transfers.length;
            const lastManLen = this._transfers[tferLen - 1].maneuvers.length;
            this._maneuvers.push(this._transfers[tferLen - 1].maneuvers[lastManLen - 1]);
            this._maneuverContexts.push("Arrival Burn")
        }
    }

    ///// SoI patch optimization /////

    /// flyby durations ///

    private calculateFlybyDurations() {
        const flybyDurations: {inTime: number, outTime: number, total: number}[] = [];
        for(let i=0; i<this._flybys.length; i++) {
            const inTime  = this._flybys[i].intersectTimes[1] - this._flybys[i].intersectTimes[0];
            const outTime = this._flybys[i].intersectTimes[2] - this._flybys[i].intersectTimes[1];
            const total = inTime + outTime;
            flybyDurations.push({inTime, outTime, total});
        } 
        return flybyDurations;
    }

    private setFlybyDurations() {
        this._flybyDurations = this.calculateFlybyDurations();
        let sumDurations = 0.0;
        for(let i=0; i<this._flybyDurations.length; i++) {
            sumDurations += this._flybyDurations[i].total;
        }
        this._endDate = this._startDate + this._flightTimes.reduce((p,c) => p + c) + sumDurations;
    }

    /// patch calcualtion based on current trajectories ///
 
    private calculateSoiPatches() {
        const soiPatchPositions: Vector3[] = [];
        for(let i=0; i<this._ejections.length; i++) {
            const ejLen    = this._ejections[i].orbits.length;
            const ejOrbit  = this._ejections[i].orbits[ejLen - 1];
            const ejDate   = this._ejections[i].intersectTimes[ejLen];
            soiPatchPositions.push(Kepler.orbitToPositionAtDate(ejOrbit, ejDate));
        }
        for(let i=0; i<this._flybys.length; i++) {
            const inOrbit  = this._flybys[i].orbits[0];
            const outOrbit = this._flybys[i].orbits[1];
            const inDate   = this._flybys[i].intersectTimes[0];
            const outDate  = this._flybys[i].intersectTimes[2];
            soiPatchPositions.push(Kepler.orbitToPositionAtDate(inOrbit,  inDate));
            soiPatchPositions.push(Kepler.orbitToPositionAtDate(outOrbit, outDate));
        }
        for(let j=0; j<this._insertions.length; j++) {
            const inOrbit  = this._insertions[j].orbits[0];
            const inDate   = this._insertions[j].intersectTimes[0];
            soiPatchPositions.push(Kepler.orbitToPositionAtDate(inOrbit, inDate));
        }
        return soiPatchPositions
    }

    private setSoiPatchPositions() {
        this._soiPatchPositions = this.calculateSoiPatches();
    }

    /// spatial SoI patch error ///

    private get soiPatchPositionErrors() {
        const soiPatchPositions = this.calculateSoiPatches();
        return soiPatchPositions.map((pos, i) => mag3(sub3(this._soiPatchPositions[i], pos)));
    }

    public get soiPatchPositionError() {
        const errors = this.soiPatchPositionErrors;
        return errors.reduce((p,c) => p + c);
    }

    /// temporal SoI patch error ///

    private get soiPatchUpTimeErrors() {
        let errs: number[] = [];
        const lastEjIdx = this._ejections.length - 1;
        for(let i=0; i<=lastEjIdx; i++) {
            const ejLen = this._ejections[i].orbits.length;
            if(i === lastEjIdx) {
                errs.push(this._ejections[i].intersectTimes[ejLen] - this._startDate);
            } else{
                errs.push(this._ejections[i].intersectTimes[ejLen] - this._ejections[i+1].orbits[0].epoch);
            }
        }
        return errs;
    }

    private get soiPatchDownTimeErrors() {
        let errs: number[] = [];
        for(let i=0; i<this._insertions.length; i++) {
            if(i === 0 ) {
                errs.push(this._insertions[i].intersectTimes[0] - this._endDate);
            } else {
                const prevInLen = this._insertions[i-1].orbits.length;
                errs.push(this._insertions[i].intersectTimes[0] - this._insertions[i-1].intersectTimes[prevInLen]);
            }
        }
        return errs;
    }

    private get flybyEncounterTimeErrors() {
        let errs: number[] = [];
        for(let i=0; i<this._flybys.length; i++) {
            const prevTferLen = this._transfers[i].orbits.length;
            errs.push(this._flybys[i].intersectTimes[0] - this._transfers[i].intersectTimes[prevTferLen]);
            errs.push(this._flybys[i].intersectTimes[2] - this._transfers[i + 1].intersectTimes[0]);
        }
        return errs;
    }

    public get soiPatchTimeError() {
        let err = 0.0;
        const upErrs = this.soiPatchUpTimeErrors;
        for(let i=0; i<upErrs.length; i++) {
            err += isNaN(upErrs[i]) ? 0 : Math.abs(upErrs[i]);
        }
        const encErrs = this.flybyEncounterTimeErrors;
        for(let i=0; i<encErrs.length; i++) {
            err += isNaN(encErrs[i]) ? 0 : Math.abs(encErrs[i]);
        }
        const downErrs = this.soiPatchDownTimeErrors;
        for(let i=0; i<downErrs.length; i++) {
            err += isNaN(downErrs[i]) ? 0 : Math.abs(downErrs[i]);
        }
        return err;
    }

    /// represent SoI patch positions using spherical coordinates ///

    private patchPositionsToAngles(positions: Vector3[] = this._soiPatchPositions): number[] {
        // angles are returned in a single vector, [theta_1, phi_1, theta_2, phi_2, ...]
        const angles: number[] = [];
        for(let i = 0; i<positions.length; i++) {
            const sphericalPos = cartesianToSpherical(positions[i]);
            angles.push(sphericalPos.theta, sphericalPos.phi);
        }
        return angles;
    }

    private setPatchPositionsFromAngles(angles: number[]) {
        // angles should be arranged: [theta_1, phi_1, theta_2, phi_2, ...]
        for(let i = 0; i < this._soiPatchBodies.length; i++) {
            this._soiPatchPositions[i] = sphericalToCartesian({r: this._soiPatchBodies[i].soi, theta: angles[2*i], phi: angles[2*i + 1]});
        }
    }

    /// fitness function for SoI patch optimization ///

    private get summedPeriods() {
        if(this._summedPeriods === undefined) {
            // we only care about the starting and target orbits if 1) they involve an ejection/insertion and 2) we care about matching their mean anomaly
            let summedPeriods = (this._ejections.length > 0 && this._matchStartMo) ? this._startOrbit.siderealPeriod : 0;
            summedPeriods += (this._insertions.length > 0 && this._matchEndMo) ? this._endOrbit.siderealPeriod : 0;
            // we need to worry about every intermediate starting/target orbit for all of the intermediate ejections/insertions
            for(let i=1; i<this._ejections.length; i++) {
                summedPeriods += (this.bodyFromId(this._ejections[i-1].orbits[0].orbiting) as IOrbitingBody).orbit.siderealPeriod;
            }
            for(let i=0; i<this._insertions.length - 1; i++) {
                summedPeriods += (this.bodyFromId(this._insertions[i+1].orbits[0].orbiting) as IOrbitingBody).orbit.siderealPeriod;
            }
            // we also need to consider the duration of the flybys 
            if(this._flybyDurations.reduce((p,c) => p + c.total, 0) === 0) {
                this.setFlybyDurations();
            }
            for(let i=0; i<this._flybyDurations.length; i++) {
                summedPeriods += this._flybyDurations[i].total;
            }
            this._summedPeriods = summedPeriods || 1;
        }
        return this._summedPeriods;
    }

    public get soiPatchFitness() {
        return ( 
            this.soiPatchPositionErrors.reduce((p,c,i) => p + 0.5 * c / this._soiPatchBodies[i].soi, 0) / this._soiPatchBodies.length // averaged position error, each normalized by the max possible error
          + this.soiPatchTimeError / this.summedPeriods     // time error, normalized by the max possible in-SoI error
        ) * this._deltaV;   // summed position and time error scaled by the delta v
    }

    /// naive iterative approach to optimization ///

    public iterateSoiPatches(rtol: number = 1e-6, maxIt: number = 100) {
        let fitness = Infinity;
        for(let i=0; i<maxIt; i++) {
            const prevFitness = fitness;
            // the new start date is set to the escape time of the last ejection
            let nextStartDate = this._startDate;
            if(this._ejections.length > 0){
                const lastEj = this._ejections[this._ejections.length - 1];
                const lastEjLength = lastEj.orbits.length;
                nextStartDate = lastEj.intersectTimes[lastEjLength];
            }
            // the new end date is set to the encounter time of the first insertion
            const nextEndDate = this._insertions.length > 0 ? this._insertions[0].intersectTimes[0] : this._endDate;
            // the new flight times for the first and last legs need to be adjusted based on the new start and end dates
            // the idea is to keep the flyby encounter dates the same
            const nextFlightTimes = [...this._flightTimes];
            nextFlightTimes[0] += this._startDate - nextStartDate;
            nextFlightTimes[nextFlightTimes.length-1] += nextEndDate - this._endDate;
            // the flight times need to be adjusted based on changes to the flyby durations
            const prevFlybyDurations = [...this._flybyDurations];
            this.setFlybyDurations();
            nextFlightTimes[0] += prevFlybyDurations[0].inTime - this._flybyDurations[0].inTime;   
            for(let j=1; j<this._flightTimes.length-1; j++) {
                nextFlightTimes[j] += (prevFlybyDurations[j].inTime - this._flybyDurations[j].inTime) + (prevFlybyDurations[j-1].outTime - this._flybyDurations[j-1].outTime);
            }
            nextFlightTimes[nextFlightTimes.length-1] += prevFlybyDurations[prevFlybyDurations.length-1].outTime - this._flybyDurations[this._flybyDurations.length-1].outTime;
            // // the Deep Space Maneuver params need are adjusted to keep the maneuver times the same
            // const nextFlybyEncounterDates: number[] = [nextStartDate + nextFlightTimes[0]];
            // for(let j=1; j<nextFlightTimes.length-1; j++) {
            //     nextFlybyEncounterDates.push(nextFlybyEncounterDates[j-1] + prevFlybyDurations[j-1].total + nextFlightTimes[j])
            // }
            // const DSMdates = this._DSMparams.map((dsm) => {
            //     const sDate = dsm.leg > 0 ? this._flybyEncounterDates[dsm.leg - 1] : this._startDate;
            //     const eDate = sDate + this._flightTimes[dsm.leg];
            //     return lerp(sDate, eDate, dsm.alpha);
            // });
            // const nextAlphas = this._DSMparams.map((dsm, index) => (DSMdates[index] - (dsm.leg > 0 ? nextFlybyEncounterDates[dsm.leg-1] : nextStartDate)) / nextFlightTimes[dsm.leg])
            // const nextDSMparams: DeepSpaceManeuverParams[] = this._DSMparams.map((dsm, index) => { return {
            //     leg:    dsm.leg,
            //     alpha:  (dsm.alpha + nextAlphas[index]) / 2,
            //     theta:  dsm.theta,
            //     phi:    dsm.phi,
            //     radius: dsm.radius,
            // }})
            // the SoI patch positions are set based on the previously calculated ejection and insertion orbits
            this.setSoiPatchPositions();
            this._startDate = nextStartDate;
            this._flightTimes = nextFlightTimes;
            this._endDate = nextEndDate;
            // this._DSMparams = nextDSMparams;
            this.computeFullTrajectory();
            fitness = this.soiPatchFitness;
            if( (i > 1) && (2 * Math.abs((prevFitness - fitness) / (prevFitness + fitness)) < rtol) ) {break;}
        }
        return this.soiPatchFitness;
    }

    /// Differential Evolution global optimization ///

    public get patchOptimizationBounds(): number[][] {
        // the spherical coordinates describing SoI patches are bounded
        const minTheta = 0;         // angle in the x-y plane
        const maxTheta = Math.PI;
        const minPhi = 0;           // angle from the +z axis
        const maxPhi = 2 * Math.PI;

        // the patch time error should always be less than the summed periods of the starting/target orbits for the ejections/insertions      
        const minStartDate = this._startDate - this.summedPeriods;
        const maxStartDate = this._startDate + this.summedPeriods;
        const minFlightTimes = this._flightTimes.map(ft => ft - this.summedPeriods);
        const maxFlightTimes = this._flightTimes.map(ft => ft + this.summedPeriods);
        const flightTimeBounds = minFlightTimes.map((minft, i) => [minft, maxFlightTimes[i]]);

        return [[minStartDate, maxStartDate], ...flightTimeBounds, ...this._soiPatchPositions.map(() => [[minTheta, maxTheta], [minPhi, maxPhi]]).flat()];
    }

    private setPatchOptimizationBounds() {
        this._patchOptimizationBounds = this.patchOptimizationBounds;
    }

    public setFromAgent(agent: Agent) {
        if(this._patchOptimizationBounds === undefined) this.setPatchOptimizationBounds();
        const bounds = this._patchOptimizationBounds as number[][];
        const vals = bounds.map((bnds, i) => lerp(bnds[0], bnds[1], agent[i]));
        this._startDate = vals[0];
        this._flightTimes = vals.slice(1, this._flightTimes.length + 1);
        this._endDate = vals[0] + vals.slice(1, this._flightTimes.length + 1).reduce((p,c) => p + c);
        this.setPatchPositionsFromAngles(vals.slice(this._flightTimes.length + 1));
    }

    private currentTrajectoryToAgent() {
        if(this._patchOptimizationBounds === undefined) this.setPatchOptimizationBounds();
        const bounds = this._patchOptimizationBounds as number[][];
        const flightTimesLength = this._flightTimes.length;
        const agent: Agent = [
            (this._startDate - bounds[0][0]) / (bounds[0][1] - bounds[0][0]),
            ...this._flightTimes.map((ft,i) => (ft - bounds[i + 1][0]) / (bounds[i + 1][1] - bounds[i + 1][0])),
            ...this.patchPositionsToAngles().map(
                (angle, i) => ((angle - bounds[i + 1 + flightTimesLength][0]) / (bounds[i + 1 + flightTimesLength][1] - bounds[i + 1 + flightTimesLength][0]))
            )
        ];
        return agent;
    }

    public evaluateAgentFitness(agent: Agent): number {
        // set the patch positions, start date, and flight times
        this.setFromAgent(agent);
        // update the flyby durations
        this.computeMinimalTrajectory();
        this.computeFlybyOrbits();
        this.setFlybyDurations();
        // compute the full trajectory with the new flyby durations
        this.computeFullTrajectory();
        // return the fitness of trajectory
        return this.soiPatchFitness;
    }

    public optimizeDE(popSize = 25 + 25 * this._soiPatchBodies.length, maxGenerations = 500, rtol = 0.01) {
        // if there aren't any SoI patches, no need to continue
        if(this._soiPatchPositions.length === 0) {
            return
        }
        // make sure that SoI positions for the intial trajectories have been cached before starting
        if(mag3(this._soiPatchPositions[0]) === 0) {
            this.setSoiPatchPositions();
        }
        // bound the fitness function to this
        const fitnessFun = this.evaluateAgentFitness.bind(this);
        // initialize the population, keeping the current parameters in the first agent
        if(this._patchOptimizationBounds === undefined) this.setPatchOptimizationBounds();
        const bounds = this._patchOptimizationBounds as number[][];
        const agentDim = bounds.length;
        const initialAgent = this.currentTrajectoryToAgent();
        const originalDurations = [...this._flybyDurations];
        const initialFitness = this.evaluateAgentFitness(initialAgent);
        let population = DifferentialEvolution.createRandomPopulation(popSize, agentDim);
        let fitnesses = DifferentialEvolution.evaluatePopulationFitness(population, fitnessFun);
        population[0] = initialAgent;
        fitnesses[0] = initialFitness;
        // run DE
        let bestFitness: number = Math.min(...(fitnesses.filter(value => !isNaN(value))));
        let meanFitness: number = fitnesses.reduce((p,c) => p + (isNaN(c) ? 0 : c), 0) / fitnesses.length;
        for(let i=0; i<maxGenerations; i++) {
            if((meanFitness - bestFitness) / bestFitness < rtol) break;
            const res = DifferentialEvolution.evolvePopulation(population, fitnesses, fitnessFun);
            population = res.pop;
            fitnesses  = res.fit;
            bestFitness = Math.min(...(fitnesses.filter(value => !isNaN(value))));
            meanFitness = fitnesses.reduce((p,c) => p + (isNaN(c) ? 0 : c), 0) / fitnesses.length;
        }

        // set the flight times and patch positions from the DE result
        const bestIdx = fitnesses.findIndex(fitness => fitness === bestFitness)
        let optimizedFitness = this.evaluateAgentFitness(population[bestIdx]);
        if(initialFitness < optimizedFitness) {
            this._flybyDurations = originalDurations;
            optimizedFitness = this.evaluateAgentFitness(initialAgent);
            this._flybyDurations = originalDurations;
        }
    }


    /// Nelder-Mead local optimization ///

    private initialSimplex(step = 0.1) {
        const currentAgent = this.currentTrajectoryToAgent();
        // make new agents, with each having a perturbed parameter by the step size
        const initialPopulation: Agent[] = [currentAgent];
        for(let i = 0; i < 1 + this._flightTimes.length + 2 * this._soiPatchPositions.length; i++) { 
            const newAgent = [...currentAgent];
            newAgent[i] = clamp(newAgent[i] + randomSign() * step, 0, 1);
            initialPopulation.push(newAgent);
        }
        return initialPopulation;
    }

    public optimizeNM(step = 0.1, tol: number = 1e-9, maxit = (this._soiPatchPositions.length + 2) * 200) {
        if(this._soiPatchPositions.length === 0) {
            return
        }
        if(mag3(this._soiPatchPositions[0]) === 0) {
            this.setSoiPatchPositions();
        }
        const originalDurations = [...this._flybyDurations];
        const initialPopulation = this.initialSimplex(step);
        const initialFitness = this.evaluateAgentFitness(initialPopulation[0]);
        const optimizedAgent = nelderMeadMinimize(initialPopulation, this.evaluateAgentFitness.bind(this), tol, maxit);
        let optimizedFitness = this.evaluateAgentFitness(optimizedAgent);
        if(initialFitness < optimizedFitness) {
            this._flybyDurations = originalDurations;
            optimizedFitness = this.evaluateAgentFitness(initialPopulation[0]);
            this._flybyDurations = originalDurations;
        }
    }
}

export default MultiFlybyCalculator;