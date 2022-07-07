import Kepler from "./kepler";
import Trajectories from "./trajectories";
import Transfer from "../objects/transfer";
import { sub3, vec3, mag3, sphericalToCartesian, cartesianToSpherical, randomSign, lerp, clamp} from "./math";
import { nelderMeadMinimize } from "./optim";
import DifferentialEvolution from "./evolution";

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
    private _soiPatchBodies:            IOrbitingBody[];
    private _summedPeriods?:            number;
    private _patchOptimizationBounds?:  number[][];

    private _ejectionInsertionType:     "fastdirect" | "direct" | "fastoberth" | "oberth";

    private _planeChange:               boolean;
    private _noInsertionBurn:           boolean;
    private _matchStartMo:              boolean;
    private _matchEndMo:                boolean;

    private _maneuvers:                 Maneuver[];
    private _maneuverContexts:          string[];
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
        this._soiPatchBodies = soiPatchSequence.map(i => this.bodyFromId(i) as IOrbitingBody);

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
        this._maneuverContexts = [];

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
            ejections:              this._ejections,
            insertions:             this._insertions,
            maneuvers:              this._maneuvers,
            maneuverContexts:       this._maneuverContexts,
            deltaV:                 this._deltaV,
            soiPatchPositions:      this._soiPatchPositions,
            ejectionInsertionType:  this._ejectionInsertionType,
            planeChange:            this._planeChange,
            matchStartMo:           this._matchStartMo,
            matchEndMo:             this._matchEndMo,
            noInsertionBurn:        this._noInsertionBurn,
            patchPositionError:     this.soiPatchPositionError,
            patchTimeError:         this.soiPatchTimeError,
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
        this._maneuverContexts = [];
    }

    ///// Trajectory calculation /////

    public computeTransfer() {
        this.clearOrbits();
        this.setTransferOrbit();
        this.setEjectionOrbits();
        this.setInsertionOrbits();
        this.setManeuvers();
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
    }

    private setEjectionOrbits() {
        const nEjections = this._sequenceUp.length - 1;
        this._ejections = Trajectories.ejectionTrajectories(this._system, this._startOrbit, this._transferTrajectory.orbits[0], this._sequenceUp, this._startDate, 
                                                            this._matchStartMo, this._ejectionInsertionType, this._soiPatchPositions.slice(0, nEjections));
        if(nEjections > 0 && !this._matchStartMo) {
            this._startOrbit = Kepler.stateToOrbit(this._ejections[0].maneuvers[0].preState, this._startBody)
        }
    }

    private setInsertionOrbits() {
        const nEjections  = this._sequenceUp.length   - 1;
        const transferLength = this._transferTrajectory.orbits.length;
        this._insertions = Trajectories.insertionTrajectories(this._system, this._endOrbit, this._transferTrajectory.orbits[transferLength- 1], this._sequenceDown, this._endDate, 
                                                              this._matchEndMo, this._ejectionInsertionType, this._soiPatchPositions.slice(nEjections));
        const nInsertions = this._insertions.length;
        if(nInsertions > 0 && !this._matchEndMo) {
            const nManeuvers = this._insertions[nInsertions-1].maneuvers.length;
            this._endOrbit = Kepler.stateToOrbit(this._insertions[nInsertions-1].maneuvers[nManeuvers-1].postState, this._endBody)
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
            this._maneuvers.push(this._transferTrajectory.maneuvers[0]);
            this._maneuverContexts.push("Departure Burn")
        }

        if(this._transferTrajectory.maneuvers.length > 2) {
            const maneuvers = this._transferTrajectory.maneuvers.slice(1,-1);
            const contexts  = maneuvers.map(m => "Plane Change Burn")
            this._maneuvers.push(...maneuvers);
            this._maneuverContexts.push(...contexts);
        }

        if(this._insertions.length > 0) {
            for(let i=0; i<this._insertions.length; i++) {
                if(i === this._insertions.length - 1) {
                    const maneuvers = this._insertions[i].maneuvers;
                    const bodyname = this.bodyFromId(this._insertions[i].orbits[0].orbiting).name;
                    const contexts: string[] = [];
                    for(let j=0; j<maneuvers.length - 1; j++) {
                        contexts.push("Oberth Maneuver Burn over " + bodyname)
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
            const lastManLen = this._transferTrajectory.maneuvers.length;
            this._maneuvers.push(this._transferTrajectory.maneuvers[lastManLen - 1]);
            this._maneuverContexts.push("Arrival Burn")
        }
    }

    private setDeltaV() {
        let dv = 0;
        const lastManeuverIdx = this._noInsertionBurn ? this._maneuvers.length - 2 : this._maneuvers.length - 1;
        for(let i=0; i<=lastManeuverIdx; i++) {
            dv += this._maneuvers[i].deltaVMag;
        }
        if (isNaN(dv)) {
            dv = Number.MAX_VALUE;
        }
        this._deltaV = dv;
    }

    ///// SoI patch optimization /////

    /// patch calcualtion based on current trajectories ///

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

    /// spatical SoI patch error ///

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

    public get soiPatchTimeError() {
        let err = 0.0;
        const upErrs = this.soiPatchUpTimeErrors;
        for(let i=0; i<upErrs.length; i++) {
            err += Math.abs(upErrs[i]);
        }
        const downErrs = this.soiPatchDownTimeErrors;
        for(let i=0; i<downErrs.length; i++) {
            err += Math.abs(downErrs[i])
        }
        return err;
    }


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
            this._summedPeriods = summedPeriods;
        }
        return this._summedPeriods;
    }

    private get soiPatchFitness() {
        return ( this.soiPatchPositionErrors.reduce((p,c,i) => p + 0.5 * c / this._soiPatchBodies[i].soi, 0) / this._soiPatchBodies.length + this.soiPatchTimeError / this.summedPeriods ) * this._deltaV;
    }

    /// naive iterative approach to optimization ///

    public iterateSoiPatches(rtol: number = 1e-6, maxIt: number = 100) {
        let fitness = Infinity;
        for(let i=0; i<maxIt; i++) {
            const prevFitness = fitness;
            // the new start date is set to the escape time of the last ejection
            const lastEj = this._ejections[this._ejections.length - 1];
            const lastEjLength = lastEj.orbits.length;
            const nextStartDate = lastEj.intersectTimes[lastEjLength];
            // the new end date is set to the encounter time of the first insertion
            const nextEndDate = this._insertions[0].intersectTimes[0];
            // the new flight time is the difference between the end and start dates
            const nextFlightTime = nextEndDate - nextStartDate;
            // the SoI patch positions are set based on the previously calculated ejection and insertion orbits
            this.setSoiPatchPositions();
            this._startDate = nextStartDate;
            this._flightTime = nextFlightTime;
            this._endDate = nextEndDate;
            // the trajectories are all recomputed with the new parameters
            this.computeTransfer();
            // stop iterating if the change in fitness does not exceed the relative tolerance
            fitness = this.soiPatchFitness;
            if( 2 * (prevFitness - fitness) / (prevFitness + fitness) < rtol) {break;}
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
        const minFlightTime = this._flightTime - this.summedPeriods;
        const maxFlightTime = this._flightTime + this.summedPeriods;

        return [[minStartDate, maxStartDate], [minFlightTime, maxFlightTime], ...this._soiPatchPositions.map(() => [[minTheta, maxTheta], [minPhi, maxPhi]]).flat()];
    }

    private setPatchOptimizationBounds() {
        this._patchOptimizationBounds = this.patchOptimizationBounds;
    }

    public setFromAgent(agent: Agent) {
        if(this._patchOptimizationBounds === undefined) this.setPatchOptimizationBounds();
        const bounds = this._patchOptimizationBounds as number[][];
        const vals = bounds.map((bnds, i) => lerp(bnds[0], bnds[1], agent[i]));
        this._startDate = vals[0];
        this._flightTime = vals[1];
        this._endDate = vals[0] + vals[1];
        this.setPatchPositionsFromAngles(vals.slice(2));
    }

    private currentTransferToAgent() {
        if(this._patchOptimizationBounds === undefined) this.setPatchOptimizationBounds();
        const bounds = this._patchOptimizationBounds as number[][];
        const agent: Agent = [
            (this._startDate - bounds[0][0]) / (bounds[0][1] - bounds[0][0]),
            (this._flightTime - bounds[1][0]) / (bounds[1][1] - bounds[1][0]),
            ...this.patchPositionsToAngles().map(
                (angle, i) => ((angle - bounds[i + 2][0]) / (bounds[i + 2][1] - bounds[i + 2][0]))
            )
        ];
        return agent;
    }

    public evaluateAgentFitness(agent: Agent): number {
        this.setFromAgent(agent);
        this.computeTransfer();
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
        // initialize the population, keeping the current parameters in the first agent.
        if(this._patchOptimizationBounds === undefined) this.setPatchOptimizationBounds();
        const bounds = this._patchOptimizationBounds as number[][];
        const agentDim = bounds.length;
        const initialAgent = this.currentTransferToAgent();
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
            optimizedFitness = this.evaluateAgentFitness(initialAgent);
        }
    }


    /// Nelder-Mead local optimization ///

    private initialSimplex(step = 0.1) {
        const currentAgent = this.currentTransferToAgent();
        // make new agents, with each having a perturbed parameter by the step size
        const initialPopulation: Agent[] = [currentAgent];
        for(let i = 0; i < 2 + 2 * this._soiPatchPositions.length; i++) { 
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
        const initialPopulation = this.initialSimplex(step);
        const optimizedAgent = nelderMeadMinimize(initialPopulation, this.evaluateAgentFitness.bind(this), tol, maxit);
        const initialFitness = this.evaluateAgentFitness(initialPopulation[0]);
        let optimizedFitness = this.evaluateAgentFitness(optimizedAgent);
        if(initialFitness < optimizedFitness) {
            optimizedFitness = this.evaluateAgentFitness(initialPopulation[0]);
        }
    }
}

export default TransferCalculator