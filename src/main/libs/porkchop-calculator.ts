import TransferCalculator from "./transfer-calculator";
import { linspace } from "./math";
import Porkchop from "../objects/porkchop";

class PorkchopCalculator {
    private readonly _system:       ISolarSystem;
    private _sequenceUp!:           number[];
    private _sequenceDown!:         number[];

    private _startOrbit:            IOrbit;
    private _endOrbit:              IOrbit;

    private _startBody:             ICelestialBody;
    private _endBody:               ICelestialBody;
    private _transferBody!:         ICelestialBody;

    private _startDateMin:          number;
    private _startDateMax:          number;
    private _startDates!:           number[];
    private _nTimes:                number;

    private _ejectionInsertionType: "fastdirect" | "direct" | "fastoberth" | "oberth";
    private _planeChange:           0 | 1 | 2;
    private _matchStartMo:          boolean;
    private _matchEndMo:            boolean;
    private _noInsertionBurn:       boolean;

    private _flightTimeMin:         number;
    private _flightTimeMax:         number;
    private _flightTimes!:          number[];

    private _deltaVs!:              number[][];

    constructor(inputs: PorkchopInputs) {
        this._system        = inputs.system;
        this._startOrbit    = inputs.startOrbit;
        this._endOrbit      = inputs.endOrbit;
        this._startBody     = this.bodyFromId(this._startOrbit.orbiting);
        this._endBody       = this.bodyFromId(this._endOrbit.orbiting);
        this._startDateMin  = inputs.startDateMin;
        this._startDateMax  = inputs.startDateMax;
        this._flightTimeMin = inputs.flightTimeMin;
        this._flightTimeMax = inputs.flightTimeMax;
        this._nTimes!       = inputs.nTimes;

        this._ejectionInsertionType = inputs.ejectionInsertionType === undefined ? "fastdirect" : inputs.ejectionInsertionType;
        this._planeChange     = inputs.planeChange     === undefined ? 0 : inputs.planeChange;    
        this._matchStartMo    = inputs.matchStartMo    === undefined ? true  : inputs.matchStartMo;
        this._matchEndMo      = inputs.matchEndMo      === undefined ? false : inputs.matchEndMo;     
        this._noInsertionBurn = inputs.noInsertionBurn === undefined ? false : inputs.noInsertionBurn;
    }

    public get deltaVMatrix() {
        return this._deltaVs;
    }

    public get startDates() {
        return this._startDates;
    }

    public get flightTimes() {
        return this._flightTimes;
    }


    public get data(): IPorkchop {
        return {
            system:                 this._system,
            startOrbit:             this._startOrbit,
            endOrbit:               this._endOrbit,
            startDates:             this._startDates,
            flightTimes:            this._flightTimes,
            deltaVs:                this._deltaVs,
            ejectionInsertionType:  this._ejectionInsertionType,
            planeChange:            this._planeChange,
            matchStartMo:           this._matchStartMo,
            matchEndMo:             this._matchEndMo,
            noInsertionBurn:        this._noInsertionBurn,
        }
    }

    public get porkchop() {
        return new Porkchop(this.data)
    }

    public get bestTimes() {
        let bestDeltaV = Infinity;
        let i_best = -1;
        let j_best = -1;
        for(let i = 0; i < this._deltaVs.length; i++) {
            for(let j = 0; j < this._deltaVs[i].length; j++) {
                if (this._deltaVs[i][j] < bestDeltaV) {
                    bestDeltaV = this._deltaVs[i][j];
                    i_best = i;
                    j_best = j;
                }
            }
        }
        const bestStartDate = this.startDates[j_best];
        const bestFlightTime = this.flightTimes[i_best];
        return {bestStartDate, bestFlightTime};
    }

    public get bestTransfer(): ITransfer {
        const best = this.bestTimes;
        const transferCalc = new TransferCalculator({
            system:                 this._system,
            startOrbit:             this._startOrbit,
            endOrbit:               this._endOrbit,
            startDate:              best.bestStartDate,
            flightTime:             best.bestFlightTime,
            startBody:              this._startBody, 
            endBody:                this._endBody,
            ejectionInsertionType:  this._ejectionInsertionType,
            planeChange:            this._planeChange,
            matchStartMo:           this._matchStartMo,
            matchEndMo:             this._matchEndMo,
            noInsertionBurn:        this._noInsertionBurn,
        });
        return transferCalc.data;
    }

    public computeAllDeltaVs() {
        const startId = this._startBody.id;
        const endId = this._endBody.id;
        const transferId = this.commonAttractorId(startId, endId);
        this._transferBody = this.bodyFromId(transferId);
        
        this.computeSequenceUp();
        this.computeSequenceDown();

        this.prepareTimes();

        // initialize all delta Vs as infinity
        const deltaVs: number[][] = [...Array(this._nTimes)].map(x=>Array(this._nTimes).fill(Infinity));

        // fill the matrix with actual computed delta Vs
        for(let i=0; i<this._nTimes; i++) {
            const startDate = this._startDates[i];
            for(let j=0; j<this._nTimes; j++) {
                const flightTime = this._flightTimes[j];
                const dv = this.computeTransferDeltaV(startDate, flightTime);
                deltaVs[j][i] = dv;
            }
        }
        this._deltaVs = deltaVs;
    }

    private computeTransferDeltaV(startDate: number, flightTime: number) {
        const transferCalc = new TransferCalculator({
            system:                 this._system,
            startOrbit:             this._startOrbit,
            endOrbit:               this._endOrbit,
            startDate:              startDate,
            flightTime:             flightTime,
            sequenceUp:             this._sequenceUp,
            sequenceDown:           this._sequenceDown,
            startBody:              this._startBody, 
            endBody:                this._endBody, 
            transferBody:           this._transferBody,
            ejectionInsertionType:  this._ejectionInsertionType,
            planeChange:            this._planeChange,
            matchStartMo:           this._matchStartMo,
            matchEndMo:             this._matchEndMo,
            noInsertionBurn:        this._noInsertionBurn,
        });
        return transferCalc.deltaV;
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

    public sequenceToSun(id: number) {
        let bd = this.bodyFromId(id);
        let seq: number[] = [bd.id];
        while(bd.hasOwnProperty("orbiting")) {
            bd = this.bodyFromId((bd as IOrbitingBody).orbiting);
            seq.push(bd.id);
        }
        return seq
    }

    public commonAttractorId(id1: number, id2: number) {
        const sunSeq1 = this.sequenceToSun(id1);
        const sunSeq2 = this.sequenceToSun(id2);
        for(let i=0; i<sunSeq1.length; i++) {
            if(sunSeq2.includes(sunSeq1[i])) {
                return sunSeq1[i]
            }
        }
        throw new Error('Bodies do not share a common attractor (error in defining this SolarSystem)')
    }

    private computeSequenceUp() {
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
    
    private computeSequenceDown() {
        let bd = this._endBody;
        let seq: number[] = [this._endBody.id];
        while(bd.id !== this._transferBody.id) {
            if(bd.hasOwnProperty("orbiting")) {
                bd = this.bodyFromId((bd as IOrbitingBody).orbiting)
                seq.push(bd.id)
            } else {
                throw new Error('The start body does not orbit around the transfer body')
            }
        }
        this._sequenceDown = seq.reverse();
    }

    private prepareTimes() {
        this._startDates = linspace(this._startDateMin, this._startDateMax, this._nTimes)
        this._flightTimes = linspace(this._flightTimeMin, this._flightTimeMax, this._nTimes)
    }

}

export default PorkchopCalculator