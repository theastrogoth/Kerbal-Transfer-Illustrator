import Kepler from "./kepler";
import Trajectories from "./trajectories";
import Transfer from "../objects/transfer";
import { sub3, vec3, mag3, sphericalToCartesian, cartesianToSpherical, randomSign} from "./math";
import { nelderMeadMinimize } from "./optim";

class TransferCalculator {
    private readonly _system:           ISolarSystem;
    private _sequenceUp!:               number[];
    private _sequenceDown!:             number[];

    private _startOrbit:                IOrbit;
    private _endOrbit:                  IOrbit;

    private _startBody:                 ICelestialBody;
    private _endBody:                   ICelestialBody;
    private _transferBody:              ICelestialBody;

    private _startDate:                 number;
    private _flightTime:                number;
    private _endDate:                   number;

    private _transferTrajectory:        Trajectory;
    private _ejections:                 Trajectory[];
    private _insertions:                Trajectory[];

    private _soiPatchPositions:         Vector3[];
    private _soiPatchBodies:            ICelestialBody[];

    private _ejectionInsertionType:     "fastdirect" | "direct" | "fastoberth" | "oberth";

    private _planeChange:               boolean;
    private _noInsertionBurn:           boolean;
    private _matchStartMo:              boolean;
    private _matchEndMo:                boolean;

    private _maneuvers:                 Maneuver[];
    private _deltaV!:                   number;

    constructor(inputs: TransferInputs) {
        this._system        = inputs.system;
        this._startOrbit    = inputs.startOrbit;
        this._startBody     = (inputs.startBody) ? inputs.startBody : this.bodyFromId(this._startOrbit.orbiting);
        this._endOrbit      = inputs.endOrbit;
        this._endBody       = (inputs.endBody) ? inputs.endBody : this.bodyFromId(this._endOrbit.orbiting);
        this._startDate     = inputs.startDate;
        this._flightTime    = inputs.flightTime
        this._endDate       = inputs.startDate + inputs.flightTime;

        if(!inputs.transferBody) {
            const startId = this._startBody.id;
            const endId = this._endBody.id;
            const transferId = this.commonAttractorId(startId, endId);
            this._transferBody = this.bodyFromId(transferId);
        } else {
            this._transferBody = inputs.transferBody;
        }

        if(!inputs.sequenceUp) {
            this.setSequenceUp();
        } else {
            this._sequenceUp = inputs.sequenceUp;
        }

        if(!inputs.sequenceDown) {
            this.setSequenceDown();
        } else {
            this._sequenceDown = inputs.sequenceDown;
        }

        const soiPatchSequence = [...this._sequenceUp.slice(0, this._sequenceUp.length - 1), ...this._sequenceDown.slice(1, this._sequenceDown.length)];
        this._soiPatchBodies = soiPatchSequence.map(i => this.bodyFromId(i));

        this._ejectionInsertionType = inputs.ejectionInsertionType === undefined ? "fastdirect" : inputs.ejectionInsertionType;
        this._planeChange     = inputs.planeChange     === undefined ? false : inputs.planeChange;    
        this._matchStartMo    = inputs.matchStartMo    === undefined ? true  : inputs.matchStartMo;
        this._matchEndMo      = inputs.matchEndMo      === undefined ? false : inputs.matchEndMo;     
        this._noInsertionBurn = inputs.noInsertionBurn === undefined ? false : inputs.noInsertionBurn;

        // initialize arrays of orbits and maneuvers
        this._transferTrajectory = {orbits: [], intersectTimes: [], maneuvers: []};
        this._ejections = [];
        this._insertions = [];
        this._maneuvers = [];

        // if not provided set all soi patch corrections to zero
        if(!inputs.soiPatchPositions) {
            this._soiPatchPositions = [];
            for(let i=1; i<=this._soiPatchBodies.length; i++) {
                this._soiPatchPositions.push(vec3(0.0, 0.0, 0.0));
            }
        } else {
            this._soiPatchPositions = inputs.soiPatchPositions;
        }

        // compute the rest of the transfer information
        this.computeTransfer();
    }

    public get deltaV() {
        return this._deltaV;
    }

    public get ejectionDeltaV() {
        return this._maneuvers[0].deltaV;
    }

    public get insertion() {
        return this._maneuvers[this._maneuvers.length].deltaV;
    }

    public get data(): ITransfer {
        return {
            system:                 this._system,
            startOrbit:             this._startOrbit,
            endOrbit:               this._endOrbit,
            startDate:              this._startDate,
            flightTime:             this._flightTime,
            endDate:                this._endDate,
            transferTrajectory:     this._transferTrajectory,
            ejections:   this._ejections,
            insertions:  this._insertions,
            maneuvers:              this._maneuvers,
            deltaV:                 this._deltaV,
            soiPatchPositions:      this._soiPatchPositions,
            ejectionInsertionType:  this._ejectionInsertionType,
            planeChange:            this._planeChange,
            matchStartMo:           this._matchStartMo,
            matchEndMo:             this._matchEndMo,
            noInsertionBurn:        this._noInsertionBurn,
            patchPositionError:     this.soiPatchPositionError(),
            patchTimeError:         this.soiPatchTimeError(),
        }
    }

    public get transfer() {
        return new Transfer(this.data)
    }

    private clearOrbits() {
        this._transferTrajectory = {orbits: [], intersectTimes: [], maneuvers: []};
        this._ejections = [];
        this._insertions = [];
        this._maneuvers = [];
    }

    ///// Trajectory calculation /////

    public computeTransfer() {
        this.clearOrbits();
        this.setTransferOrbit();
        this.setEjectionOrbits();
        this.setInsertionOrbits();
        this.setDeltaV();        
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

    private setTransferOrbit() {
        // Get the orbit/position at the start of the transfer
        const sOrb = this._sequenceUp.length === 1 ? 
            this._startOrbit : 
            (this.bodyFromId(this._sequenceUp[this._sequenceUp.length - 2]) as IOrbitingBody).orbit;

        const startPatchIdx = this._sequenceUp.length - 2;
        const startPatchPos = startPatchIdx >= 0 ? this._soiPatchPositions[startPatchIdx] : vec3(0.0, 0.0, 0.0);

        // Get the orbit/position at the end of the transfer
        const eOrb = this._sequenceDown.length ===1 ? 
            this._endOrbit : 
            (this.bodyFromId(this._sequenceDown[1]) as IOrbitingBody).orbit;

        const endPatchIdx = startPatchIdx + 1;
        const endPatchPos = endPatchIdx <= this._soiPatchPositions.length ? this._soiPatchPositions[endPatchIdx] : vec3(0.0, 0.0, 0.0);

        this._transferTrajectory = Trajectories.transferTrajectory(sOrb, eOrb, this._transferBody, this._startDate, this._flightTime, this._endDate, this._planeChange, startPatchPos, endPatchPos);

        // If there are no ejection orbits, add the first burn maneuver to the list
        if(this._sequenceUp.length === 1) {
            this._maneuvers.push(this._transferTrajectory.maneuvers[0]);
        }
        // If there is a plane change burn, add it to the maneuver list
        if(this._planeChange) {
            this._maneuvers.push(this._transferTrajectory.maneuvers[1]);
        }
        // If there are no insertion orbits, add the last burn maneuver to the list
        if(this._sequenceUp.length === 1) {
            const transferLength = this._transferTrajectory.orbits.length;
            this._maneuvers.push(this._transferTrajectory.maneuvers[transferLength]);
        }
    }

    private setEjectionOrbits() {
        const nEjections = this._sequenceUp.length - 1;
        this._ejections = Trajectories.ejectionTrajectories(this._system, this._startOrbit, this._transferTrajectory.orbits[0], this._sequenceUp, this._startDate, 
                                                            this._matchStartMo, this._ejectionInsertionType, this._soiPatchPositions.slice(0, nEjections + 1));
        // store ejection maneuvers
        const ejectionManeuvers: Maneuver[] = [];
        for(let i=0; i<nEjections; i++) {
            if(i > 0) { // ignore the periapsis burn 
                ejectionManeuvers.push(...this._ejections[i].maneuvers.slice(1));
            } else {    // except for the first ejection
                ejectionManeuvers.push(...this._ejections[i].maneuvers);
            }
        }
        this._maneuvers = [...ejectionManeuvers, ...this._maneuvers]
    }

    private setInsertionOrbits() {
        const nEjections  = this._sequenceUp.length   - 1;
        const nInsertions = this._sequenceDown.length - 1;
        const transferLength = this._transferTrajectory.orbits.length;
        this._insertions = Trajectories.insertionTrajectories(this._system, this._endOrbit, this._transferTrajectory.orbits[transferLength- 1], this._sequenceDown, this._endDate, 
                                                              this._matchEndMo, this._ejectionInsertionType, this._soiPatchPositions.slice(nEjections));
        // store insertion orbits and maneuvers
        for(let i=0; i<nInsertions; i++) {
            if(i < nInsertions - 1) { // ignore the periapsis burn
                this._maneuvers.push(...this._insertions[i].maneuvers.slice(0,-1));
            } else {                  // except for the last insertion
                this._maneuvers.push(...this._insertions[i].maneuvers)
            }
        }
    }

    private setDeltaV() {
        let dv = 0;
        for(let i=0; i<this._maneuvers.length; i++) {
            dv += this._maneuvers[i].deltaVMag;
        }
        if (isNaN(dv)) {
            dv = Number.MAX_VALUE;
        }
        this._deltaV = dv;
    }

    ///// SoI patch optimization /////

    private calculateSoiPatches() {
        const soiPatchPositions: Vector3[] = [];
        for(let i=0; i<this._ejections.length; i++) {
            const ejLen = this._ejections[i].orbits.length;
            const ejOrbit = this._ejections[i].orbits[ejLen - 1];
            const ejDate = this._ejections[i].intersectTimes[ejLen];
            soiPatchPositions.push(Kepler.orbitToPositionAtDate(ejOrbit, ejDate));
        }
        for(let j=0; j<this._insertions.length; j++) {
            const inOrbit = this._insertions[j].orbits[0];
            const inDate = this._insertions[j].intersectTimes[0];
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

    private soiPatchTimeError() {
        let err = 0.0;
        const upErrs = this.soiPatchUpTimeErrors();
        for(let i=0; i<upErrs.length; i++) {
            err += Math.abs(upErrs[i]);
        }
        const downErrs = this.soiPatchDownTimeErrors();
        for(let i=0; i<downErrs.length; i++) {
            err += Math.abs(downErrs[i])
        }
        return err;
    }

    // private upTimeOffset() {
    //     return this.soiPatchUpTimeErrors().reduce((p,c) => p + c);
    // }

    // private downTimeOffset() {
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
    
    // private startDateOffset() {
    //     let off = 0.0;
    //     const lastEjIdx = this._ejections.length - 1;
    //     if(lastEjIdx >= 0) {
    //         const ejLen = this._ejections[lastEjIdx].orbits.length;
    //         const ejTime = this._ejections[ejLen -1].intersectTimes[ejLen];
    //         off += ejTime - this._startDate;
    //     }
    //     return off;
    // }

    // private endDateOffset() {
    //     let off = 0.0;
    //     if(this._insertions.length > 0) {
    //         const inTime = this._insertions[0].intersectTimes[0];
    //         off += inTime - this._endDate;
    //     }
    //     return off;
    // }

    public optimizeSoiPatchPositions(tol: number = 0.001, maxit: number = this._soiPatchPositions.length * 100) {
        console.log("\tOptimizing transfer SoI patch positions only.")
        if(this._soiPatchPositions.length === 0) {
            return
        }
        if(mag3(this._soiPatchPositions[0]) === 0) {
            this.setSoiPatchPositions();
        }
        const objective = (x: number[]): number => {
            // x contains alternating theta and phi positions for each patch position
            this.setPatchPositionsFromAngles(x);
            this.computeTransfer();
            return this.soiPatchPositionError() + 1000 * this._deltaV;
        }
        const initialPoints: number[][] = [this.patchPositionsToAngles()];
        for(let i = 0; i < this._soiPatchBodies.length; i++) {
            const newPoint1 = initialPoints[0].slice();
            const newPoint2 = initialPoints[0].slice();
            newPoint1[2 * i]     += randomSign() * (Math.random() * Math.PI / 24);
            newPoint2[2 * i + 1] += randomSign() * (Math.random() * Math.PI / 12);
            initialPoints.push(newPoint1);
            initialPoints.push(newPoint2);
        }
        const optimizedPoint = nelderMeadMinimize(initialPoints, objective, tol, maxit);
        this.setPatchPositionsFromAngles(optimizedPoint);
        this.computeTransfer();
    }

    private initialPositionAndAnglePoints() {
        const sOrb = this._sequenceUp.length === 1 ? 
        this._startOrbit : 
            (this.bodyFromId(this._sequenceUp[this._sequenceUp.length - 2]) as IOrbitingBody).orbit;
        const eOrb = this._sequenceDown.length ===1 ? 
            this._endOrbit : 
            (this.bodyFromId(this._sequenceDown[1]) as IOrbitingBody).orbit;

        const initialPoints: number[][] = [[this._startDate, this._flightTime, ...this.patchPositionsToAngles()],                                                                                           // current start and end dates
                                           [this._startDate + randomSign() * Math.random() * this._transferTrajectory.orbits[0].siderealPeriod / 4, this._flightTime, ...this.patchPositionsToAngles()],    // perturb start date
                                           [this._startDate, this._flightTime + randomSign() * Math.random() * this._transferTrajectory.orbits[0].siderealPeriod / 4, ...this.patchPositionsToAngles()]];   // perturb end date
        for(let i = 1; i <= this._soiPatchBodies.length; i++) {                                                                                                                                             // perturb each SoI angle                  
            const newPoint1 = initialPoints[0].slice();
            const newPoint2 = initialPoints[0].slice();
            newPoint1[2 * i]     += randomSign() * (Math.random() * Math.PI / 24);
            newPoint2[2 * i + 1] += randomSign() * (Math.random() * Math.PI / 12);
            initialPoints.push(newPoint1);
            initialPoints.push(newPoint2);
        }
        return initialPoints;
    }

    public optimizeSoiPatchPositionsAndTimes(tol: number = 0.001, maxit = (this._soiPatchPositions.length + 2) * 100) {
        console.log("\tOptimizing transfer SoI patch positions and times.")
        if(this._soiPatchPositions.length === 0) {
            return
        }
        if(mag3(this._soiPatchPositions[0]) === 0) {
            this.setSoiPatchPositions();
        }
        const objective = (x: number[]): number => {
            // the first two elements of x are the transfer start date and transfer end date
            // the remaining elements of x contain alternating theta and phi positions for each patch position
            this._startDate = x[0];
            this._flightTime = x[1];
            this._endDate = x[0] + x[1];
            this.setPatchPositionsFromAngles(x.slice(2,x.length));
            this.computeTransfer();
            return this.soiPatchPositionError() + 10 * this.soiPatchTimeError() + 100 * this._deltaV;   // mixed units, so the coefficients here are arbitrary
        }

        const initialPoints = this.initialPositionAndAnglePoints();
        const optimizedPoint = nelderMeadMinimize(initialPoints, objective, tol, maxit);
        const optimizedPointObj = objective(optimizedPoint);
        // console.log(this._soiPatchPositions)
        // console.log(this.calculateSoiPatches())
        // console.log(optimizedPointObj)
    }

    public optimizeSoiPatches() {
        if(this._soiPatchPositions.length === 0) {
            console.log("\tThere are no SoI patches to optimize.")
        } else if((this._ejections.length === 0 || (this._ejections.length === 1 && !this._matchStartMo)) &&
                  (this._insertions.length === 0 || (this._insertions.length === 1 && !this._matchEndMo))) {
            this.optimizeSoiPatchPositions();
        } else {
            this.optimizeSoiPatchPositionsAndTimes();
        }
    }
}

export default TransferCalculator