import SolarSystem from "./system";
import Orbit from "./orbit";
import TransferCalculator from "../libs/transfer-calculator";

export class Porkchop implements IPorkchop {
    readonly system:                SolarSystem;
    readonly startOrbit:            Orbit;
    readonly endOrbit:              Orbit;
    readonly startDates:            number[];
    readonly flightTimes:           number[];
    readonly deltaVs:               number[][];
    readonly ejectionInsertionType: "simple" | "direct" | "oberth";
    readonly planeChange:           boolean;
    readonly noInsertionBurn:       boolean;
    readonly matchStartMo:          boolean;
    readonly matchEndMo:            boolean;

    constructor(inputs: IPorkchop) {
        this.system = new SolarSystem(inputs.system.sun, inputs.system.orbiters);
        this.startOrbit = new Orbit(inputs.startOrbit, this.system.bodyFromId(inputs.startOrbit.orbiting));
        this.endOrbit = new Orbit(inputs.endOrbit, this.system.bodyFromId(inputs.endOrbit.orbiting));
        this.startDates = inputs.startDates;
        this.flightTimes = inputs.flightTimes;
        this.deltaVs = inputs.deltaVs;

        this.ejectionInsertionType = inputs.ejectionInsertionType;
        this.planeChange     = inputs.planeChange;    
        this.matchStartMo    = inputs.matchStartMo;
        this.matchEndMo      = inputs.matchEndMo;     
        this.noInsertionBurn = inputs.noInsertionBurn;
    }

    public get startBody() {
        return this.system.bodyFromId(this.startOrbit.orbiting);
    }

    public get endBody() {
        return this.system.bodyFromId(this.endOrbit.orbiting);
    }

    public get bestTimes() {
        let bestDeltaV = Infinity;
        let i_best = -1;
        let j_best = -1;
        for(let i = 0; i < this.deltaVs.length; i++) {
            for(let j = 0; j < this.deltaVs[i].length; j++) {
                if (this.deltaVs[i][j] < bestDeltaV) {
                    bestDeltaV = this.deltaVs[i][j];
                    i_best = i;
                    j_best = j;
                }
            }
        }
        const bestStartDate = this.startDates[j_best];
        const bestFlightTime = this.flightTimes[i_best];
        return {bestStartDate, bestFlightTime};
    }

    public get bestTransfer() {
        const best = this.bestTimes;
        const transferCalc = new TransferCalculator({
            system:          this.system,
            startOrbit:      this.startOrbit,
            endOrbit:        this.endOrbit,
            startDate:       best.bestStartDate,
            flightTime:      best.bestFlightTime,
            startBody:       this.startBody, 
            endBody:         this.endBody,
            planeChange:     this.planeChange,
            matchStartMo:    this.matchStartMo,
            matchEndMo:      this.matchEndMo,
            noInsertionBurn: this.noInsertionBurn,
        });
        transferCalc.computeTransfer();
        return transferCalc.transfer;
    }
}

export default Porkchop;