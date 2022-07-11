const urlPath = "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/textures/";

// map planet names to corresponding surface textures
const textures = new Map<string, string>();
textures.set("blank", urlPath + "blank.png");
// Bodies with surfaces/biomes
const solidBodyNames = [
    // Stock
    "Kerbin", "Mun", "Minmus", "Moho", "Eve", "Gilly", "Duna", "Ike", "Dres", "Laythe", "Vall", "Tylo", "Bop", "Pol", "Eeloo",
    // OPM
    "Hale", "Ovok", "Slate", "Tekto", "Polta", "Priax", "Wal", "Tal", "Plock", "Karen",
    // RSS and KSRSS
    "Earth", "Moon", "Mercury", "Venus", "Mars", "Phobos", "Deimos", "Vesta", "Ceres", "Ganymede", "Callisto", "Mimas", "Enceladus", "Tethys", "Dione", "Rhea", "Titan", "Iapetus",
    "Miranda", "Ariel", "Umbriel", "Titania", "Oberon", "Triton", "Pluto", "Charon", 
];
for(let i=0; i<solidBodyNames.length; i++) {
    // Color
    textures.set(solidBodyNames[i] + "Color", urlPath + solidBodyNames[i] + "Color.png");
    // Biome
    textures.set(solidBodyNames[i] + "Biome", urlPath + solidBodyNames[i] + "Biome.png");
    // Height
    textures.set(solidBodyNames[i] + "Height", urlPath + solidBodyNames[i] + "Height.png");
}
// Bodies without surfaces/biomes
const gasGiantNames = [
    // Stock
    "Jool",
    // OPM
    "Sarnus", "Urlum", "Neidon",
    // RSS and KSRSS
    "Jupiter", "Saturn", "Uranus", "Neptune",
];
for(let i=0; i<solidBodyNames.length; i++) {
    // Color
    textures.set(gasGiantNames[i] + "Color", urlPath + gasGiantNames[i] + "Color.png");
}
export default textures;
