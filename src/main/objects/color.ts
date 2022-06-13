export class Color implements IColor {
    readonly r!:    number;
    readonly g!:    number;
    readonly b!:    number;
    readonly a!:    number;

    constructor(c: IColor) {
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
        this.a = c.a ? c.a : 1;
    }

    public rescale(scale: number) {
        return new Color({r: Math.max(Math.min(scale * this.r, 255), 0), 
                          g: Math.max(Math.min(scale * this.g, 255), 0), 
                          b: Math.max(Math.min(scale * this.b, 255), 0),
                          a: this.a});
    }

    public get data(): IColor {
        return {
            r: this.r,
            g: this.g,
            b: this.b,
            a: this.a,
        }
    }

    public toString() {
        return 'rgba('.concat(this.r.toString(), ",", this.g.toString(), ",", this.b.toString(), ",", this.a.toString(), ")");
    }
}

export default Color;