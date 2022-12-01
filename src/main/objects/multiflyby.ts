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
    readonly DSMparams:              DeepSpaceManeuverParams[];      
    readonly ejections:              Trajectory[];
    readonly insertions:             Trajectory[];
    readonly transfers:              Trajectory[];
    readonly flybys:                 Trajectory[];
    readonly maneuvers:              Maneuver[];
    readonly maneuverContexts:       string[];
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
        this.DSMparams              = inputs.DSMparams;
        this.transferBody           = this.system.bodyFromId(inputs.transferBody.id);
        this.flybyIdSequence        = inputs.flybyIdSequence;
        this.transfers              = inputs.transfers;
        this.ejections              = inputs.ejections;
        this.insertions             = inputs.insertions;
        this.flybys                 = inputs.flybys;
        this.maneuvers              = inputs.maneuvers;
        this.maneuverContexts       = inputs.maneuverContexts;
        this.deltaV                 = inputs.deltaV;

        this.soiPatchPositions      = inputs.soiPatchPositions;
        this.flybyDurations         = inputs.flybyDurations;

        this.ejectionInsertionType = inputs.ejectionInsertionType;
        
        this.planeChange            = inputs.planeChange;
        this.matchStartMo           = inputs.matchStartMo;
        this.matchEndMo             = inputs.matchEndMo;
        this.noInsertionBurn        = inputs.noInsertionBurn;

        this.patchPositionError     = inputs.patchPositionError;
        this.patchTimeError         = inputs.patchTimeError;
    }

    public get data(): IMultiFlyby {
        return {
            system:                 this.system.data,
            startOrbit:             this.startOrbit.data,
            endOrbit:               this.endOrbit.data,
            flybyIdSequence:        this.flybyIdSequence,
            startDate:              this.startDate,
            flightTimes:            this.flightTimes,
            endDate:                this.endDate,
            DSMparams:              this.DSMparams,
            transferBody:           this.transferBody.data,
            ejections:              this.ejections,
            insertions:             this.insertions,
            transfers:              this.transfers,
            flybys:                 this.flybys,
            maneuvers:              this.maneuvers,
            maneuverContexts:       this.maneuverContexts,
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

    public flightPlan(commRange: number = 0): FlightPlan {
        const name = 'Transfer';
        const color = {r: 255, g: 255, b: 255};
        const trajectories: Trajectory[] = [];

        for(let i=0; i<this.ejections.length; i++) {
            const orbits: IOrbit[] = [...this.ejections[i].orbits];
            const maneuvers: Maneuver[] = [...this.ejections[i].maneuvers];
            const intersectTimes: number[] = [...this.ejections[i].intersectTimes];
            if(i===0) {
                orbits.unshift(this.startOrbit.data);
                intersectTimes.unshift(-Infinity);
            } else {
                maneuvers.splice(0,1);
            }
            trajectories.push({orbits, maneuvers, intersectTimes});
        }
        for(let i=0; i<this.transfers.length; i++) {
            const orbits: IOrbit[] = [...this.transfers[i].orbits];
            const maneuvers: Maneuver[] = [...this.transfers[i].maneuvers];
            const intersectTimes: number[] = [...this.transfers[i].intersectTimes];
            if(i===0 && this.ejections.length===0) {
                orbits.unshift(this.startOrbit.data);
                intersectTimes.unshift(-Infinity);
            } else {
                maneuvers.splice(0,1);
            }
            if(i===this.transfers.length-1 && this.insertions.length===0) {
                orbits.push(this.endOrbit.data);
                intersectTimes.push(Infinity);
            } else {
                maneuvers.pop();
            }
            trajectories.push({orbits, maneuvers, intersectTimes});

            if(i < this.transfers.length - 1) {
                trajectories.push(this.flybys[i]);
            }
        }
        for(let i=0; i<this.insertions.length; i++) {
            const orbits: IOrbit[] = [...this.insertions[i].orbits];
            const maneuvers: Maneuver[] = [...this.insertions[i].maneuvers];
            const intersectTimes: number[] = [...this.insertions[i].intersectTimes];
            if(i===this.insertions.length-1) {
                orbits.push(this.endOrbit.data);
                intersectTimes.push(Infinity);
            } else {
                maneuvers.pop();
            }
            trajectories.push({orbits, maneuvers, intersectTimes});
        }

        return {name, color, trajectories, maneuverContexts: this.maneuverContexts, commRange};
    }

}

export default MultiFlyby;
