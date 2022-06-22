import blankTexture from './textures/blank.png'
// stock bodies
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
// OPM bodies
import sarnusTexture from './textures/sarnus.png'
import haleTexture from './textures/hale.png'
import ovokTexture from './textures/ovok.png'
import slateTexture from './textures/slate.png'
import tektoTexture from './textures/tekto.png'
import urlumTexture from './textures/urlum.png'
import poltaTexture from './textures/polta.png'
import priaxTexture from './textures/priax.png'
import walTexture from './textures/wal.png'
import talTexture from './textures/tal.png'
import neidonTexture from './textures/neidon.png'
import thatmoTexture from './textures/thatmo.png'
import nisseeTexture from './textures/nissee.png'
import plockTexture from './textures/plock.png'
import karenTexture from './textures/karen.png'

// map planet names to corresponding surface textures
const textures = new Map<string, string>();
textures.set("blank", blankTexture);
// Stock
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
// OPM
textures.set("Sarnus", sarnusTexture);
textures.set("Hale", haleTexture);
textures.set("Ovok", ovokTexture);
textures.set("Slate", slateTexture);
textures.set("Tekto", tektoTexture);
textures.set("Urlum", urlumTexture);
textures.set("Polta", poltaTexture);
textures.set("Priax", priaxTexture);
textures.set("Wal", walTexture);
textures.set("Tal", talTexture);
textures.set("Neidon", neidonTexture);
textures.set("Thatmo", thatmoTexture);
textures.set("Nissee", nisseeTexture);
textures.set("Plock", plockTexture);
textures.set("Karen", karenTexture);


export default textures;
