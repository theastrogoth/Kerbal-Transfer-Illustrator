import SolarSystem from "./system";
import { OrbitingBody } from "./body";
import Orbit from "./orbit";
import TransferCalculator from "../libs/transfer-calculator";
import Kepler from "../libs/kepler";
import { wrapAngle } from "../libs/math";


export class Transfer implements ITransfer {
    readonly system:                    SolarSystem;
    readonly startOrbit:                Orbit;
    readonly endOrbit:                  Orbit;
    readonly startDate:                 number;
    readonly flightTime:                number;
    readonly endDate:                   number;
    readonly transferTrajectory:        Trajectory;
    readonly ejections:                 Trajectory[];
    readonly insertions:                Trajectory[];
    readonly maneuvers:                 Maneuver[];
    readonly maneuverContexts:          string[];
    readonly deltaV:                    number;
    readonly soiPatchPositions:         Vector3[];
    readonly ejectionInsertionType:     "fastdirect" | "direct" | "fastoberth" | "oberth";
    readonly planeChange:               boolean;
    readonly noInsertionBurn:           boolean;
    readonly matchStartMo:              boolean;
    readonly matchEndMo:                boolean;

    readonly patchPositionError:        number;
    readonly patchTimeError:            number;

    constructor(inputs: ITransfer) {
        this.system = new SolarSystem(inputs.system.sun, inputs.system.orbiters);
        this.startOrbit = new Orbit(inputs.startOrbit, this.system.bodyFromId(inputs.startOrbit.orbiting));
        this.endOrbit = new Orbit(inputs.endOrbit, this.system.bodyFromId(inputs.endOrbit.orbiting));
        this.startDate = inputs.startDate;
        this.flightTime = inputs.flightTime;
        if(inputs.endDate) {
            this.endDate = inputs.endDate;
        } else {
            this.endDate = inputs.startDate + inputs.flightTime
        };
        this.transferTrajectory = inputs.transferTrajectory;
        this.ejections          = inputs.ejections;
        this.insertions         = inputs.insertions;
        this.maneuvers          = inputs.maneuvers;
        this.maneuverContexts   = inputs.maneuverContexts;
        this.deltaV             = inputs.deltaV;

        this.ejectionInsertionType  = inputs.ejectionInsertionType;
        this.planeChange            = inputs.planeChange;    
        this.matchStartMo           = inputs.matchStartMo;
        this.matchEndMo             = inputs.matchEndMo;       
        this.noInsertionBurn        = inputs.noInsertionBurn;

        this.soiPatchPositions  = inputs.soiPatchPositions;

        this.patchPositionError = inputs.patchPositionError;
        this.patchTimeError     = inputs.patchTimeError;
    }

    public get data(): ITransfer {
        return {
            system:                 this.system.data,
            startOrbit:             this.startOrbit.data,
            endOrbit:               this.endOrbit.data,
            startDate:              this.startDate,
            flightTime:             this.flightTime,
            endDate:                this.endDate,
            transferTrajectory:     this.transferTrajectory,
            ejections:              this.ejections,
            insertions:             this.insertions,
            maneuvers:              this.maneuvers,
            maneuverContexts:       this.maneuverContexts,
            deltaV:                 this.deltaV,
            soiPatchPositions:      this.soiPatchPositions,
            ejectionInsertionType:  this.ejectionInsertionType,
            planeChange:            this.planeChange,
            matchStartMo:           this.matchStartMo,
            matchEndMo:             this.matchEndMo,
            noInsertionBurn:        this.noInsertionBurn,
            patchPositionError:     this.patchPositionError,
            patchTimeError:         this.patchTimeError,
        }
    }

    public optimizeSoiPatches() {
        const inputs: TransferInputs = {
            system:             this.system,
            startOrbit:         this.startOrbit,
            endOrbit:           this.endOrbit,
            startDate:          this.startDate,
            flightTime:         this.flightTime,
            soiPatchPositions:  this.soiPatchPositions,
            planeChange:        this.planeChange,
            matchStartMo:       this.matchStartMo, 
            matchEndMo:         this.matchEndMo,
            noInsertionBurn:    this.noInsertionBurn,
        }
        const transferCalculator = new TransferCalculator(inputs);
        transferCalculator.optimizeSoiPatches();
        return transferCalculator.transfer;
    }

    public get transferBody() {
        return this.system.bodyFromId(this.system.commonAttractorId(this.startOrbit.orbiting, this.endOrbit.orbiting));
    }

    public get startBody() {
        return this.system.bodyFromId(this.startOrbit.orbiting);
    }

    public get endBody() {
        return this.system.bodyFromId(this.endOrbit.orbiting);
    }

    public get phaseAngle() {
        const sOrb = this.ejections.length === 0  ? this.startOrbit : (this.system.bodyFromId(this.ejections[this.ejections.length - 1].orbits[0].orbiting) as OrbitingBody).orbit;
        const eOrb = this.insertions.length === 0 ? this.endOrbit   : (this.system.bodyFromId(this.insertions[0].orbits[0].orbiting) as OrbitingBody).orbit;
        const sPos = Kepler.orbitToPositionAtDate(sOrb, this.startDate);    // start orbit position at start
        const ePos = Kepler.orbitToPositionAtDate(eOrb, this.startDate);    // target position at start
        const sAngle = Kepler.angleInOrbitPlane(sPos, sOrb);
        const eAngle = Kepler.angleInOrbitPlane(ePos, sOrb);
        return wrapAngle(eAngle - sAngle);
    }
}

export default Transfer;