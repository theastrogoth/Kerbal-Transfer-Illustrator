import SolarSystem from "./system";
import CelestialBody from "./body";
import Orbit from "./orbit";

class MultiFlyby implements IMultiFlyby {
    readonly system:                 SolarSystem;
    readonly startOrbit:             Orbit;
    readonly endOrbit:               Orbit;
    readonly startDate:              number;
    readonly flightTimes:            number[];
    readonly endDate:                number;
    readonly transferBody:           CelestialBody;
    readonly flybyIdSequence:        number[];
    readonly ejections:              Trajectory[];
    readonly insertions:             Trajectory[];
    readonly transfers:              Trajectory[];
    readonly flybys:                 Trajectory[];
    readonly maneuvers:              Maneuver[];
    readonly deltaV:                 number;
    readonly soiPatchPositions:      Vector3[];
    readonly flybyDurations:         { inTime: number; outTime: number; total: number; }[];
    readonly ejectionInsertionType:  "fastdirect" | "direct" | "fastoberth" | "oberth";
    readonly planeChange:            boolean;
    readonly matchStartMo:           boolean;
    readonly matchEndMo:             boolean;
    readonly noInsertionBurn:        boolean;

    readonly patchPositionError:     number;
    readonly patchTimeError:         number;

    constructor(inputs: IMultiFlyby) {
        this.system = new SolarSystem(inputs.system.sun, inputs.system.orbiters);
        this.startOrbit = new Orbit(inputs.startOrbit, this.system.bodyFromId(inputs.startOrbit.orbiting));
        this.endOrbit = new Orbit(inputs.endOrbit, this.system.bodyFromId(inputs.endOrbit.orbiting));
        this.startDate = inputs.startDate;
        this.flightTimes = inputs.flightTimes;
        if(inputs.endDate) {
            this.endDate = inputs.endDate;
        } else {
            this.endDate = inputs.startDate + inputs.flightTimes.reduce((p,c) => p + c);
        };
        this.transferBody           = this.system.bodyFromId(inputs.transferBody.id);
        this.flybyIdSequence        = inputs.flybyIdSequence;
        this.transfers   = inputs.transfers;
        this.ejections   = inputs.ejections;
        this.insertions  = inputs.insertions;
        this.flybys                 = inputs.flybys;
        this.maneuvers              = inputs.maneuvers;
        this.deltaV                 = inputs.deltaV;

        this.soiPatchPositions      = inputs.soiPatchPositions;
        this.flybyDurations         = inputs.flybyDurations;

        this.ejectionInsertionType = inputs.ejectionInsertionType;
        
        this.planeChange     = inputs.planeChange;
        this.matchStartMo    = inputs.matchStartMo;
        this.matchEndMo      = inputs.matchEndMo;
        this.noInsertionBurn = inputs.noInsertionBurn;

        this.patchPositionError = inputs.patchPositionError;
        this.patchTimeError     = inputs.patchTimeError;
    }

    public get data(): IMultiFlyby {
        return {
            system:                 this.system,
            startOrbit:             this.startOrbit,
            endOrbit:               this.endOrbit,
            flybyIdSequence:        this.flybyIdSequence,
            startDate:              this.startDate,
            flightTimes:            this.flightTimes,
            endDate:                this.endDate,
            transferBody:           this.transferBody,
            ejections:              this.ejections,
            insertions:             this.insertions,
            transfers:              this.transfers,
            flybys:                 this.flybys,
            maneuvers:              this.maneuvers,
            deltaV:                 this.deltaV,
            soiPatchPositions:      this.soiPatchPositions,
            flybyDurations:         this.flybyDurations,
            ejectionInsertionType:  this.ejectionInsertionType,
            planeChange:            this.planeChange,
            matchStartMo:           this.matchStartMo,
            matchEndMo:             this.matchEndMo,
            noInsertionBurn:        this.noInsertionBurn,
            patchPositionError:     this.patchPositionError,
            patchTimeError:         this.patchTimeError,
        }
    }
}

export default MultiFlyby;
