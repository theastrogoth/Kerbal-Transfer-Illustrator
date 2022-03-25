import MultiFlyby from "../objects/multiflyby";
import Trajectories from "./trajectories";
import FlybyCalcs from "./flybycalcs";
import Kepler from "./kepler";
import { sub3, mag3, vec3, randomSign, cartesianToSpherical, sphericalToCartesian, mult3 } from "./math";
import { nelderMeadMinimize } from "./optim";
import { createNamedExports } from "typescript";

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

    private _startBody:                 ICelestialBody;
    private _endBody:                   ICelestialBody;
    private _transferBody:              ICelestialBody;

    private _sequenceUp!:               number[];
    private _sequenceDown!:             number[];

    private _transferVelocities!:       {velOut: Vector3, velIn: Vector3}[];
    private _flybyParams!:              FlybyParams[];

    private _transfers:                 Trajectory[];
    private _ejections:                 Trajectory[];
    private _insertions:                Trajectory[];
    private _flybys!:                   Trajectory[];

    private _soiPatchPositions:         Vector3[];
    private _soiPatchBodies:            IOrbitingBody[];
    private _flybyDurations:            {inTime: number, outTime: number, total: number}[];

    private _ejectionInsertionType:    "fastdirect" | "fastoberth" | "direct" | "oberth";
    private _planeChange:               boolean;
    private _matchStartMo:              boolean;
    private _matchEndMo:                boolean;
    private _noInsertionBurn:           boolean;

    private _maneuvers!:                Maneuver[];
    private _deltaV!:                   number;

    constructor(inputs: MultiFlybyInputs) {
        this._system            = inputs.system;

        this._startOrbit        = inputs.startOrbit;
        this._endOrbit          = inputs.endOrbit;
        this._flybyIdSequence   = inputs.flybyIdSequence;
        this._flybyBodySequence = inputs.flybyIdSequence.map(i => this.bodyFromId(i) as IOrbitingBody);

        this._startDate         = inputs.startDate;
        this._flightTimes       = inputs.flightTimes;

        this._startBody         = this.bodyFromId(this._startOrbit.orbiting);
        this._endBody           = this.bodyFromId(this._endOrbit.orbiting);
        this._transferBody      = this.bodyFromId(this.commonAttractorId(this._startBody.id, this._endBody.id));

        this._ejectionInsertionType = inputs.ejectionInsertionType === undefined ? "fastdirect" : inputs.ejectionInsertionType;
        this._planeChange       = inputs.planeChange     === undefined ? false : inputs.planeChange;    
        this._matchStartMo      = inputs.matchStartMo    === undefined ? true  : inputs.matchStartMo;
        this._matchEndMo        = inputs.matchEndMo      === undefined ? false : inputs.matchEndMo;     
        this._noInsertionBurn   = inputs.noInsertionBurn === undefined ? false : inputs.noInsertionBurn;
    
        this._flybyEncounterDates = [];
        this._flybyParams         = [];
        this._transferVelocities  = [];
        this._transfers           = [];
        this._flybys              = [];
        this._maneuvers           = [];
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
            this._flybyDurations = this._flybyIdSequence.map((id, index) => {return {inTime: 0.0, outTime: 0.0, total: 0.0}});
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
            ejections:              this._ejections,
            insertions:             this._insertions,
            transfers:              this._transfers,
            flybys:                 this._flybys,
            soiPatchPositions:      this._soiPatchPositions,
            flybyDurations:         this._flybyDurations,
            planeChange:            this._planeChange,
            matchStartMo:           this._matchStartMo,
            matchEndMo:             this._matchEndMo,
            noInsertionBurn:        this._noInsertionBurn,
            maneuvers:              this._maneuvers,
            deltaV:                 this._deltaV,
            patchPositionError:     this.soiPatchPositionError(),
            patchTimeError:         this.soiPatchTimeError(),
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
    }

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

            const sBody = this._sequenceUp.length === 0 ? this._transferBody : i === 0 ? this.bodyFromId(this._sequenceUp[this._sequenceUp.length === 1 ? 0 : this._sequenceUp.length -  2])    : this._flybyBodySequence[i -1];
            const eBody = i === this._flightTimes.length - 1 ? this.bodyFromId(this._sequenceDown[this._sequenceDown.length === 1 ? 0 : 1]) : this._flybyBodySequence[i];
            const sOrb  = i === 0 && this._startBody === this._transferBody ? this._startOrbit : (sBody as IOrbitingBody).orbit;
            const eOrb  = i === this._flightTimes.length - 1 && this._endBody === this._transferBody ? this._endOrbit : (eBody as IOrbitingBody).orbit;

            const sPatchPosition = sPatchIdx < 0 ? vec3(0,0,0) : this._soiPatchPositions[sPatchIdx];
            const ePatchPosition = sPatchIdx + 1 >= this._soiPatchPositions.length ? vec3(0,0,0) : this._soiPatchPositions[sPatchIdx + 1];
            sPatchIdx += 2;

            const trajectory = Trajectories.transferTrajectory(sOrb, eOrb, this._transferBody, sDate, fTime, eDate, this._planeChange, sPatchPosition, ePatchPosition)
            this._transfers.push(trajectory);
            const manLen = trajectory.maneuvers.length;
            const sVel = Kepler.orbitToVelocityAtDate(sOrb, this._transferBody, sDate);
            const eVel = Kepler.orbitToVelocityAtDate(eOrb, this._transferBody, eDate);
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
    }

    private computeInsertionTrajectories() {
        if(this._endBody.id !== this._transferBody.id) {
            const tferLen = this._transfers.length;
            const lastTrajLen = this._transfers[tferLen - 1].orbits.length;
            const patchPositions = this._soiPatchPositions.slice(this._sequenceUp.length - 1 + 2 * this._flybyIdSequence.length);
            this._insertions = Trajectories.insertionTrajectories(this._system, this._endOrbit, this._transfers[tferLen - 1].orbits[lastTrajLen - 1], this._sequenceDown, this._endDate, this._matchEndMo, this._ejectionInsertionType, patchPositions);
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

        if(this._planeChange) {
            for(let i=0; i<this._transfers.length; i++) {
                deltaV += this._transfers[i].maneuvers[1].deltaVMag;
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
        if(this._ejections.length > 0) {
            for(let i=0; i<this._ejections.length; i++) {
                if(i === 0) {
                    this._maneuvers.push(...this._ejections[i].maneuvers);
                } else {
                    this._maneuvers.push(...this._ejections[i].maneuvers.slice(1));
                }
            }
        } else {
            this._maneuvers.push(this._transfers[0].maneuvers[0]);
        }
        for(let i=0; i<this._transfers.length; i++) {
            this._maneuvers.push(...this._transfers[i].maneuvers.slice(1,-1));
            if(i<this._transfers.length - 1) {
                this._maneuvers.push(...this._flybys[i].maneuvers);
            }
        }
        if(this._insertions.length > 0) {
            for(let i=0; i<this._insertions.length; i++) {
                if(i === this._insertions.length - 1) {
                    this._maneuvers.push(...this._insertions[i].maneuvers);
                } else {
                    this._maneuvers.push(...this._insertions[i].maneuvers.slice(0,-1));
                }
            }
        } else {
            const tferLen = this._transfers.length;
            const lastManLen = this._transfers[tferLen - 1].maneuvers.length;
            this._maneuvers.push(this._transfers[tferLen - 1].maneuvers[lastManLen - 1]);
        }
    }

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

    private soiPatchPositionError() {
        const soiPatchPositions = this.calculateSoiPatches();
        let err = 0.0;
        for(let i=0; i<this._soiPatchPositions.length; i++) {
            err += mag3(sub3(this._soiPatchPositions[i], soiPatchPositions[i]));
        }
        return err;
    }

    private soiPatchUpTimeErrors() {
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

    private soiPatchDownTimeErrors() {
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

    private flybyEncounterTimeErrors() {
        let errs: number[] = [];
        for(let i=0; i<this._flybys.length; i++) {
            const prevTferLen = this._transfers[i].orbits.length;
            errs.push(this._flybys[i].intersectTimes[0] - this._transfers[i].intersectTimes[prevTferLen]);
            errs.push(this._flybys[i].intersectTimes[2] - this._transfers[i + 1].intersectTimes[0]);
        }
        return errs;
    }

    private soiPatchTimeError() {
        let err = 0.0;
        const upErrs = this.soiPatchUpTimeErrors();
        for(let i=0; i<upErrs.length; i++) {
            err += Math.abs(upErrs[i]);
        }
        const encErrs = this.flybyEncounterTimeErrors();
        for(let i=0; i<encErrs.length; i++) {
            err += Math.abs(encErrs[i]);
        }
        const downErrs = this.soiPatchDownTimeErrors();
        for(let i=0; i<downErrs.length; i++) {
            err += Math.abs(downErrs[i])
        }
        return err;
    }

    // private startTimeOffset() {
    //     return this.soiPatchUpTimeErrors().reduce((p,c) => p + c);
    // }

    // private endTimeOffset() {
    //     return this.soiPatchDownTimeErrors().reduce((p,c) => p + c);
    // }

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

    public optimizeSoiPatches(tol: number = 0.001, maxit: number = this._soiPatchPositions.length * 100) {
        console.log("\tOptimizing flyby SoI patches")
        if(mag3(this._soiPatchPositions[0]) === 0) {
            this.setSoiPatchPositions();
            this.setFlybyDurations();
        }
        const objective = (x: number[]): number => {
            // x contains alternating theta and phi positions for each patch position
            const patchLen = this._soiPatchPositions.length;
            this.setPatchPositionsFromAngles(x.slice(0, 2*patchLen));
            this._startDate = x[2*patchLen];
            this._flightTimes = x.slice(2*patchLen + 1);
            this.computeMinimalTrajectory();
            this.computeFlybyOrbits();
            this.setFlybyDurations();
            this.computeFullTrajectory();
            return this.soiPatchPositionError() + 10 * this.soiPatchTimeError() + 1000 * this._deltaV;
        }
        const initialPoints: number[][] = [[...this.patchPositionsToAngles(), this._startDate, ...this._flightTimes]];
        const numPatches = this._soiPatchBodies.length;
        for(let i = 0; i < numPatches; i++) {
            const newPoint1 = initialPoints[0].slice();
            const newPoint2 = initialPoints[0].slice();
            newPoint1[2 * i]     += randomSign() * (Math.random() * Math.PI / 24);
            newPoint2[2 * i + 1] += randomSign() * (Math.random() * Math.PI / 12);
            initialPoints.push(newPoint1);
            initialPoints.push(newPoint2);
        }

        const newPoint = initialPoints[0].slice();
        newPoint[2 * numPatches] += randomSign() * Math.random() * this._transfers[0].orbits[0].siderealPeriod / 4;
        initialPoints.push(newPoint);

        const ftStartIdx = 2 * numPatches + 1;
        for(let i = 0; i < this._transfers.length; i++) {
            const newPoint = initialPoints[0].slice();
            newPoint[ftStartIdx + i] += Math.max(1, randomSign() * Math.random() * this._transfers[i].orbits[0].siderealPeriod / 4);
            initialPoints.push(newPoint)
        }

        const optimizedPoint = nelderMeadMinimize(initialPoints, objective, tol, maxit);
        const score = objective(optimizedPoint)
        // console.log(this._soiPatchPositions)
        // console.log(this.calculateSoiPatches())
        // console.log(score)
    };
}

export default MultiFlybyCalculator;