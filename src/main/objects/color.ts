export class Color implements IColor {
    readonly r!:    number;
    readonly g!:    number;
    readonly b!:    number;

    constructor(c: IColor) {
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
    }

    public rescale(scale: number) {
        return new Color({r: Math.max(Math.min(scale * this.r, 255), 0), 
                          g: Math.max(Math.min(scale * this.g, 255), 0), 
                          b: Math.max(Math.min(scale * this.b, 255), 0)});
    }

    public toString() {
        return 'rgb('.concat(this.r.toString(), ",", this.g.toString(), ",", this.b.toString(), ")");
    }
}

export default Color;