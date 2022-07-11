const urlPath = "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/main/public/assets/textures/";

import blankTexture from './assets/textures/blank.png';

// map planet names to corresponding surface textures
const textures = new Map<string, string>();
textures.set("blank", blankTexture);

const texturedBodyNames = [
// Stock
"Kerbin", "Mun", "Minmus", "Moho", "Eve", "Gilly", "Duna", "Ike", "Dres", "Jool", "Laythe", "Vall", "Tylo", "Bop", "Pol", "Eeloo",
// OPM
"Sarnus", "Hale", "Ovok", "Slate", "Tekto", "Urlum", "Polta", "Priax", "Wal", "Tal", "Neidon", "Plock", "Karen",
// RSS and KSRSS
"Earth", "Moon", "Mercury", "Venus", "Mars", "Phobos", "Deimos", "Vesta", "Ceres", "Jupiter", "Ganymede", "Callisto", "Saturn", "Mimas", "Enceladus", "Tethys", "Dione", "Rhea", "Titan", "Iapetus",
 "Uranus", "Miranda", "Ariel", "Umbriel", "Titania", "Oberon", "Neptune", "Triton", "Pluto", "Charon", 
]

for(let i=0; i<texturedBodyNames.length; i++) {
    textures.set(texturedBodyNames[i], urlPath + texturedBodyNames[i].toLowerCase() + ".png")
}
export default textures;
