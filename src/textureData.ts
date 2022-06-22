import kerbinTexture from './textures/kerbin.png'
import munTexture from './textures/mun.png'
import minmusTexture from './textures/minmus.png'
import mohoTexture from './textures/moho.png'
import eveTexture from './textures/eve.png'
import gillyTexture from './textures/gilly.png'
import dunaTexture from './textures/duna.png'
import ikeTexture from './textures/ike.png'
import dresTexture from './textures/dres.png'
import joolTexture from './textures/jool.png'
import laytheTexture from './textures/laythe.png'
import vallTexture from './textures/vall.png'
import tyloTexture from './textures/tylo.png'
import bopTexture from './textures/bop.png'
import polTexture from './textures/pol.png'
import eelooTexture from './textures/eeloo.png'
import blankTexture from './textures/blank.png'

// map planet names to corresponding surface textures (stock only)
const textures = new Map<string, string>();
textures.set("Kerbin", kerbinTexture);
textures.set("Mun", munTexture);
textures.set("Minmus", minmusTexture);
textures.set("Moho", mohoTexture);
textures.set("Eve", eveTexture);
textures.set("Gilly", gillyTexture);
textures.set("Duna", dunaTexture);
textures.set("Ike", ikeTexture);
textures.set("Dres", dresTexture);
textures.set("Jool", joolTexture);
textures.set("Laythe", laytheTexture);
textures.set("Vall", vallTexture);
textures.set("Tylo", tyloTexture);
textures.set("Bop", bopTexture);
textures.set("Pol", polTexture);
textures.set("Eeloo", eelooTexture);
textures.set("blank", blankTexture);

export default textures;
