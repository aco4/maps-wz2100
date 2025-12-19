const NUM_PLAYERS = 2 * (gameRand(5) + 1);

const MIN_TILE_HEIGHT = 0;
const MAX_TILE_HEIGHT = 510;

const BaseLayouts = Object.freeze({
    "20x29_normal-cF3-rF": [
        "                             ",
        "        x   x   x   x   x    ",
        "        c   c   c   c   c    ",
        "                             ",
        "      xxx xxx xxx xxx xxx    ",
        "      xfx xfx xfx xfx xfx    ",
        "      xxx xxx xxx xxx xxx    ",
        "                             ",
        "             txxt            ",
        " o o o o     txht            ",
        " o o o o                     ",
        " o o o o  xx xx xx xx xx     ",
        " o o o o  xr xr xr xr xr     ",
        " o o o o                     ",
        " o o o o  xx xx xx xx xx     ",
        " o o o o  xp xp xp xp xp     ",
        " o o o o                     ",
        " o o o o  xx xx xx xx xx     ",
        " o o o o  xp xp xp xp xp     ",
        "                             ",
    ]
});

// A "layout" is an array of strings
// A "dictionary" is a mapping of each character to an object and/or function
// Together, these are passed into pasteLayout()

const ntwBase = {
    layout: [
        "                             ",
        "        c   c   c   c   c    ",
        "        c   c   c   c   c    ",
        "                             ",
        "      fff fff fff fff fff    ",
        "      fff fff fff fff fff    ",
        "      fff fff fff fff fff    ",
        "                             ",
        "             thht            ",
        " o o o o     thht            ",
        " o o o o                     ",
        " o o o o  rr rr rr rr rr     ",
        " o o o o  rr rr rr rr rr     ",
        " o o o o                     ",
        " o o o o  pp pp pp pp pp     ",
        " o o o o  pp pp pp pp pp     ",
        " o o o o                     ",
        " o o o o  pp pp pp pp pp     ",
        " o o o o  pp pp pp pp pp     ",
        "                             ",
    ],
    dictionary: {
        "o": [
            {
                name: "A0ResourceExtractor",
                position: [0, 0],
                direction: 0 * 0x4000,
                modules: 0,
                player: null,
            },
            (x, y) => {},
        ],
        "t": {
            objs: [
                {
                    name: "ConstructionDroid",
                    position: [64, 64],
                    direction: 2 * 0x4000,
                }
            ]
        },
    }
};

const Layout = {
    STRUCTURES: {"A0ADemolishStructure":{"length":1,"width":1},"A0BaBaVtolPad":{"length":1,"width":1},"bbaatow":{"length":1,"width":1},"A0BaBaVtolFactory":{"length":2,"width":2},"ScavRepairCentre":{"length":1,"width":1},"A0BaBaBunker":{"length":1,"width":1},"A0BaBaFactory":{"length":1,"width":2},"A0BaBaFlameTower":{"length":1,"width":1},"A0BaBaGunTower":{"length":1,"width":1},"A0BaBaGunTowerEND":{"length":1,"width":1},"A0BaBaHorizontalWall":{"length":1,"width":1},"A0BaBaMortarPit":{"length":1,"width":1},"A0BaBaPowerGenerator":{"length":1,"width":1},"A0BaBaRocketPit":{"length":1,"width":1},"A0BaBaRocketPitAT":{"length":1,"width":1},"A0BabaCornerWall":{"length":1,"width":1},"A0CannonTower":{"length":1,"width":1},"A0ComDroidControl":{"length":2,"width":2},"A0CommandCentre":{"length":2,"width":2},"A0CommandCentreCO":{"length":2,"width":2},"A0CommandCentreNE":{"length":2,"width":2},"A0CommandCentreNP":{"length":2,"width":2},"A0CyborgFactory":{"length":2,"width":1},"A0FacMod1":{"length":3,"width":3},"A0HardcreteMk1CWall":{"length":1,"width":1},"A0HardcreteMk1Gate":{"length":1,"width":1},"A0HardcreteMk1Wall":{"length":1,"width":1},"A0LasSatCommand":{"length":2,"width":2},"A0LightFactory":{"length":3,"width":3},"A0PowMod1":{"length":2,"width":2},"A0PowerGenerator":{"length":2,"width":2},"A0RepairCentre3":{"length":1,"width":1},"A0ResearchFacility":{"length":2,"width":2},"A0ResearchModule1":{"length":2,"width":2},"A0ResourceExtractor":{"length":1,"width":1},"A0Sat-linkCentre":{"length":2,"width":2},"A0TankTrap":{"length":1,"width":1},"A0VTolFactory1":{"length":3,"width":3},"A0VtolPad":{"length":1,"width":1},"AASite-QuadBof":{"length":1,"width":1},"AASite-QuadBof02":{"length":1,"width":1},"AASite-QuadMg1":{"length":1,"width":1},"AASite-QuadRotMg":{"length":1,"width":1},"CO-Tower-HVCan":{"length":1,"width":1},"CO-Tower-HvATRkt":{"length":1,"width":1},"CO-Tower-HvFlame":{"length":1,"width":1},"CO-Tower-LtATRkt":{"length":1,"width":1},"CO-Tower-MG3":{"length":1,"width":1},"CO-Tower-MdCan":{"length":1,"width":1},"CO-Tower-RotMG":{"length":1,"width":1},"CO-WallTower-HvCan":{"length":1,"width":1},"CO-WallTower-RotCan":{"length":1,"width":1},"CollectiveCWall":{"length":1,"width":1},"CollectiveWall":{"length":1,"width":1},"CoolingTower":{"length":1,"width":1},"ECM1PylonMk1":{"length":1,"width":1},"Emplacement-HPVcannon":{"length":1,"width":1},"Emplacement-HeavyLaser":{"length":1,"width":1},"Emplacement-ParticleGun":{"length":1,"width":1},"Emplacement-Howitzer-Incendiary":{"length":1,"width":1},"Emplacement-Howitzer-Incenediary":{"length":1,"width":1},"Emplacement-Howitzer105":{"length":1,"width":1},"Emplacement-Howitzer150":{"length":1,"width":1},"Emplacement-HvART-pit":{"length":1,"width":1},"Emplacement-HvyATrocket":{"length":1,"width":1},"Emplacement-MRL-pit":{"length":1,"width":1},"Emplacement-MRLHvy-pit":{"length":1,"width":1},"Emplacement-MdART-pit":{"length":1,"width":1},"Emplacement-MortarEMP":{"length":1,"width":1},"Emplacement-MortarPit-Incendiary":{"length":1,"width":1},"Emplacement-MortarPit-Incenediary":{"length":1,"width":1},"Emplacement-MortarPit01":{"length":1,"width":1},"Emplacement-MortarPit02":{"length":1,"width":1},"Emplacement-PlasmaCannon":{"length":1,"width":1},"Emplacement-HeavyPlasmaLauncher":{"length":1,"width":1},"Emplacement-PrisLas":{"length":1,"width":1},"Emplacement-PulseLaser":{"length":1,"width":1},"Emplacement-Rail2":{"length":1,"width":1},"Emplacement-Rail3":{"length":1,"width":1},"Emplacement-Rocket06-IDF":{"length":1,"width":1},"Emplacement-RotHow":{"length":1,"width":1},"Emplacement-RotMor":{"length":1,"width":1},"GuardTower-ATMiss":{"length":1,"width":1},"GuardTower-BeamLas":{"length":1,"width":1},"GuardTower-Rail1":{"length":1,"width":1},"GuardTower-RotMg":{"length":1,"width":1},"GuardTower1":{"length":1,"width":1},"GuardTower2":{"length":1,"width":1},"GuardTower3":{"length":1,"width":1},"GuardTower4":{"length":1,"width":1},"GuardTower5":{"length":1,"width":1},"GuardTower6":{"length":1,"width":1},"LookOutTower":{"length":1,"width":1},"NEXUSCWall":{"length":1,"width":1},"NEXUSWall":{"length":1,"width":1},"NX-ANTI-SATSite":{"length":1,"width":1},"NX-CruiseSite":{"length":1,"width":1},"NX-Emp-MedArtMiss-Pit":{"length":1,"width":1},"NX-Emp-MultiArtMiss-Pit":{"length":1,"width":1},"NX-Emp-Plasma-Pit":{"length":1,"width":1},"NX-Tower-ATMiss":{"length":1,"width":1},"NX-Tower-PulseLas":{"length":1,"width":1},"NX-Tower-Rail1":{"length":1,"width":1},"NX-WallTower-BeamLas":{"length":1,"width":1},"NX-WallTower-Rail2":{"length":1,"width":1},"NX-WallTower-Rail3":{"length":1,"width":1},"NuclearReactor":{"length":2,"width":2},"P0-AASite-Laser":{"length":1,"width":1},"P0-AASite-SAM1":{"length":1,"width":1},"P0-AASite-SAM2":{"length":1,"width":1},"P0-AASite-Sunburst":{"length":1,"width":1},"PillBox-Cannon6":{"length":1,"width":1},"PillBox1":{"length":1,"width":1},"PillBox2":{"length":1,"width":1},"PillBox3":{"length":1,"width":1},"PillBox4":{"length":1,"width":1},"PillBox5":{"length":1,"width":1},"PillBox6":{"length":1,"width":1},"Pillbox-RotMG":{"length":1,"width":1},"Plasmite-flamer-bunker":{"length":1,"width":1},"Sys-CB-Tower01":{"length":1,"width":1},"Sys-NEXUSLinkTOW":{"length":1,"width":1},"Sys-NX-CBTower":{"length":1,"width":1},"Sys-NX-SensorTower":{"length":1,"width":1},"Sys-NX-VTOL-CB-Tow":{"length":1,"width":1},"Sys-NX-VTOL-RadTow":{"length":1,"width":1},"Sys-RadarDetector01":{"length":1,"width":1},"Sys-SensoTower01":{"length":1,"width":1},"Sys-SensoTower02":{"length":1,"width":1},"Sys-SensoTowerWS":{"length":1,"width":1},"Sys-SpyTower":{"length":1,"width":1},"Sys-VTOL-CB-Tower01":{"length":1,"width":1},"Sys-VTOL-RadarTower01":{"length":1,"width":1},"TankTrapC":{"length":1,"width":1},"Tower-Projector":{"length":1,"width":1},"Tower-RotMg":{"length":1,"width":1},"Tower-VulcanCan":{"length":1,"width":1},"UplinkCentre":{"length":2,"width":2},"Wall-RotMg":{"length":1,"width":1},"Wall-VulcanCan":{"length":1,"width":1},"WallTower-Atmiss":{"length":1,"width":1},"WallTower-DoubleAAGun":{"length":1,"width":1},"WallTower-DoubleAAGun02":{"length":1,"width":1},"WallTower-EMP":{"length":1,"width":1},"WallTower-HPVcannon":{"length":1,"width":1},"WallTower-HvATrocket":{"length":1,"width":1},"WallTower-Projector":{"length":1,"width":1},"WallTower-PulseLas":{"length":1,"width":1},"WallTower-QuadRotAAGun":{"length":1,"width":1},"WallTower-Rail2":{"length":1,"width":1},"WallTower-Rail3":{"length":1,"width":1},"WallTower-SamHvy":{"length":1,"width":1},"WallTower-SamSite":{"length":1,"width":1},"WallTower-TwinAssaultGun":{"length":1,"width":1},"WallTower01":{"length":1,"width":1},"WallTower02":{"length":1,"width":1},"WallTower03":{"length":1,"width":1},"WallTower04":{"length":1,"width":1},"WallTower05":{"length":1,"width":1},"WallTower06":{"length":1,"width":1},"WreckedTransporter":{"length":3,"width":3},"X-Super-Cannon":{"length":2,"width":2},"X-Super-MassDriver":{"length":2,"width":2},"X-Super-Missile":{"length":2,"width":2},"X-Super-Rocket":{"length":2,"width":2}},

    DROIDS: new Set(["A-Cobra-Hover-HMG","A-Cobra-Hover-MC","A-Cobra-Trk-HMG","A-Cobra-Wheels-HMG","A-Mantis-Trk-Lancer","A-Mantis-Trk-Pulse","A-Mantis-Trk-Rail","A-Python-Hover-HC","A-Python-Hover-MC","A-Python-Trk-HC","A-Python-Trk-Lancer","A-Rep-Cobra-Trk","A-Rep-Mantis-Trk","A-Retrib-Trk-Needle","A-Scorp-Hover-MC","A-Scorp-Trk-MC","A-Tiger-Trk-HC","A-Tiger-Trk-Needle","A-Veng-Trk-Guass","A-Veng-Trk-Needle","A-Veng-Trk-Rail","A-Veng-Trk-Scourge","A-Veng-Trk-TK","A-Viper-Trk-HMG","A-Viper-Trk-MG","A-Viper-Trk-TMG","A-Viper-Wheels-HMG","A-Viper-Wheels-MG","A-Viper-Wheels-TMG","ASPOTTER","ATESTVTOL","BaBaCivilian","BaBaPeople","BabaBusCan","BabaFireCan","BabaFireTruck","BabaJeep","BabaPickUp","BabaRKJeep","BarbarianBuggy","BarbarianRKBuggy","BarbarianTrike","Cobra-Hover-HC","Cobra-Trk-Com","CobraBBTracks","CobraComHalftrack","CobraFlameTracks","CobraHMGHalfTrack","CobraHMGTracks","CobraHRepairHover","CobraHoverTruck","CobraHvyCnTrks","CobraHvyMortarHalftrack","CobraInfernoHTracks","CobraInfernoHover","CobraLtA-Thalftrack","CobraLtCnTrks","CobraMRLHalftrack","CobraMRLTracks","CobraMedCnHTrks","CobraMedCnTrks","CobraMortarHalfTrack","CobraPODHTracks","CobraPODTracks","CobraSensorHalftrack","CobraSpadeTracks","CobraTrkLancer","ConstructionDroid","ConstructorDroid","Cyb-Atmiss-GROUND","Cyb-Cannon-GROUND","Cyb-Chain-GROUND","Cyb-ComEng","Cyb-Flamer-GROUND","Cyb-Gren","Cyb-Hvy-A-T","Cyb-Hvy-Acannon","Cyb-Hvy-HPV","Cyb-Hvy-Mcannon","Cyb-Hvy-PulseLsr","Cyb-Hvy-RailGunner","Cyb-Hvy-TK","Cyb-Laser1-GROUND","Cyb-Mechanic","Cyb-Rail1-GROUND","Cyb-Rocket-GROUND","Cyb-RotMG-GROUND","Cyb-Thermite","CyborgCannon01Grd","CyborgChain01Ground","CyborgFlamer01Grd","CyborgRkt01Ground","CyborgRotMgGround","Dragon-Hover-SeraphGauss","H-Scorp-Trk-HC","H-Scorp-Trk-Lancer","H-Scorp-VTOL-BB","H-Scorp-VTOL-Lancer","LeopardHoverPulseLas","MP-Cyb-ATmiss-GRD","MP-Cyb-Laser1-GRD","MP-Cyb-Needle-GRD","Mantis-Trk-Com","MantisBBTracks","MantisHoverAC","MantisHoverTruck","MantisScourgeTracks","MantisTKTracks","MantisTrkHC","P0CobraFlameTracks","P0CobraHvyMGHtrack","P0CobraLtATRktHtrack","P0CobraMedCnTrks","P0CobraRepairTrks","P0CobraSpadeTracks","P0PythonComTracks","P0PythonHvyCnTrks","P0cam3CobCONTrk","P0cam3PyAsltGnTrk","P0cam3PyFlakHT","P0cam3PyHPVcanTrk","P0cam3PyHvyATTrk","P6-L-Bomb1-V","P6-L-LTAT-V","P6-M-QMG1-HT","PantherHoverPulseLas","PhytonHTrackAssGun","PhytonHoverAssGun","PythonComTracks","PythonGaussTracks","PythonHoverHVC","PythonHoverInferno","PythonHvyCnTrks","PythonLtCnTrks","PythonMedCanTracks","PythonMedCnTrks","PythonPulseTracks","PythonScourgeTracks","PythonTKTracks","RetreHoverFlashLight","SK-Bug-Hover-HMG","SK-Bug-Hover-Repair","SK-Bug-Hover-Sensor","SK-Bug-VTOL-BB","SK-Bug-VTOL-CLBomb","SK-Cobra-Hover-BB","SK-Cobra-Hover-HMG","SK-Cobra-Hover-Lancer","SK-Cobra-Track-HVC","SK-Cobra-Track-TK","SK-Leopard-HTrk-ASGun","SK-Leopard-Hover-Needle","SK-Leopard-Hover-Repair","SK-Leopard-Hover-Sensor","SK-Leopard-Htrk-Needle","SK-Leopard-Track-Lancer","SK-Leopard-VTOL-BB","SK-Leopard-VTOL-PhosBomb","SK-Mantis-Hover-HVC","SK-Mantis-Hover-Hcannon","SK-Mantis-VTOL-BB","SK-Mantis-VTOL-HBB","SK-Mantis-VTOL-PBB","SK-Panther-Hover-HVC","SK-Panther-Hover-TK","SK-Panther-Htrk-ASGun","SK-Panther-Htrk-BB","SK-Panther-Track-HVC","SK-Panther-Track-RailGun","SK-Panther-Track-Repair","SK-Panther-Track-TK","SK-Panther-VTOL-BB","SK-Panther-VTOL-Phosbomb","SK-Panther-VTOL-TK","SK-Panther-VTOL-Thermite","SK-Python-Hover-Hcannon","SK-Python-Hover-Lancer","SK-Python-Hover-Mcannon","SK-Python-Track-Hcannon","SK-Retal-Hover-Repair","SK-Retal-Hover-Sensor","SK-Retal-Track-Needle","SK-Retal-VTOL-Phosbomb","SK-Retal-VTOL-Scourge","SK-Retre-Hover-RailGun","SK-Retre-Hover-Scourge","SK-Retre-Htrk-Pepper","SK-Retre-Track-FlashLight","SK-Retre-Track-PulseLsr","SK-Retre-Track-RailGun","SK-Retre-Track-Scourge","SK-Retre-VTOL-HBB","SK-Retre-VTOL-Plasmite","SK-Retre-VTOL-PulseLsr","SK-Retre-VTOL-Scourge","SK-Retre-VTOL-Thermite","SK-Scorp-Hover-ASGUN","SK-Scorp-Hover-BB","SK-Scorp-Hover-Bombard","SK-Scorp-Hover-Lancer","SK-Scorp-Hover-Mcannon","SK-Scorpion-VTOL-BB","SK-Scorpion-VTOL-Hbomb","SK-Tiger-Hover-ASCannon","SK-Tiger-Hover-Gauss","SK-Tiger-Hover-HVC","SK-Tiger-Hover-Hcannon","SK-Tiger-Hover-Scourge","SK-Tiger-Hover-TK","SK-Tiger-Track-ASCannon","SK-Tiger-Track-Gauss","SK-Tiger-Track-HVC","SK-Tiger-Track-Hcannon","SK-Tiger-Track-Scourge","SK-Tiger-Track-TK","SK-Veng-Hover-Gauss","SK-Veng-Hover-PulseLsr","SK-Veng-Hover-Scourge","SK-Veng-Hover-Seraph","SK-Veng-Track-C6TwinAslt","SK-Veng-Track-Gauss","SK-Veng-Track-HvyLaser","SK-Veng-Track-PulseLsr","SK-Veng-Track-Scourge","Scorp-Trk-Com","ScorpBBTracks","ScorpHRepairHover","ScorpHTrackHMG","ScorpHoverTruck","ScorpRepairTrk","ScorpTrkHMG","Scourge-Mantis-H","Sk-CobraBBHover","Sk-PythonHvCanTrack","SuperTransport","TK-Mantis-H","TigerHoverPulseLas","TigerHoverRailGun","TigerHvLaserTracks","TigerPulseTracks","Transporter","V-Bug-BB","V-Bug-ClusterBomb","V-Bug-HPV","V-Bug-Lancer","V-Mantis-HPV","V-Mantis-Lancer","V-Scor-BB","V-Scor-ClusterBomb","V-Scor-HPV","V-Scor-Lancer","Viper-Trk-Com","ViperBBWheels","ViperFlameHalfTracks","ViperFlameWheels","ViperHMGHalftrack","ViperHMGTracks","ViperHMGWheels","ViperLtA-Twheels","ViperLtCannonHTracks","ViperLtCannonTracks","ViperLtCannonWheels","ViperLtMGHalfTracks","ViperMG01Wheels","ViperMG02Halftrack","ViperMG02Wheels","ViperMRLHalfTracks","ViperMRLWheels","ViperMedCnTrks","ViperPODHalfTracks","ViperPODWheels","ViperRepairHalftrack","ViperRepairWheels","ViperSensorWheels","ViperTrkLancer","WyvernGaussTracks","WyvernHvLaserTracks","WyvernPlasmaCTracks","WyvernPulseTracks","WyvernScourgeTracks"]),

    FEATURES: {"Advmaterialslab":{"length":2,"width":2},"Aerodynamicslab":{"length":2,"width":2},"AirTrafficControl":{"length":1,"width":1},"BaBaHorizontalWall":{"length":1,"width":1},"BabaCornerWall":{"length":1,"width":1},"BarbHUT":{"length":1,"width":1},"BarbTechRuin":{"length":1,"width":2},"BarbWarehouse1":{"length":1,"width":2},"BarbWarehouse2":{"length":1,"width":2},"BarbWarehouse3":{"length":1,"width":1},"BlueCar":{"length":1,"width":1},"Boulder1":{"length":1,"width":1},"Boulder2":{"length":1,"width":1},"Boulder3":{"length":1,"width":1},"Chevy":{"length":1,"width":1},"Crane":{"length":1,"width":1},"Crate":{"length":1,"width":1},"Heavywepslab":{"length":2,"width":2},"Indirectlab":{"length":2,"width":2},"Laseropticslab":{"length":2,"width":2},"LogCabin1":{"length":1,"width":1},"LogCabin2":{"length":1,"width":1},"LogCabin3":{"length":1,"width":1},"LogCabin4":{"length":1,"width":1},"LogCabin5":{"length":1,"width":1},"Nanolab":{"length":2,"width":2},"OilDrum":{"length":1,"width":1},"OilResource":{"length":1,"width":1},"OilTower":{"length":1,"width":1},"OldFactory":{"length":2,"width":2},"Pickup":{"length":1,"width":1},"Pipe":{"length":1,"width":1},"Pipe1":{"length":1,"width":1},"Pipe1A":{"length":1,"width":1},"Pipe2A":{"length":1,"width":1},"Pipe3A":{"length":1,"width":1},"Powlab":{"length":2,"width":2},"Pylon":{"length":1,"width":1},"Rotarywepslab":{"length":2,"width":2},"Ruin1":{"length":1,"width":1},"Ruin10":{"length":1,"width":1},"Ruin3":{"length":1,"width":1},"Ruin4":{"length":1,"width":1},"Ruin5":{"length":1,"width":1},"Ruin6":{"length":1,"width":1},"Ruin7":{"length":1,"width":1},"Ruin8":{"length":1,"width":1},"Ruin9":{"length":1,"width":1},"Tree1":{"length":1,"width":1},"Tree2":{"length":1,"width":1},"Tree3":{"length":1,"width":1},"TreeSnow1":{"length":1,"width":1},"TreeSnow2":{"length":1,"width":1},"TreeSnow3":{"length":1,"width":1},"Wall":{"length":1,"width":1},"WallCorner":{"length":1,"width":1},"WallCornerSmashed":{"length":1,"width":1},"WallSmashed":{"length":1,"width":1},"WaterBuilding":{"length":2,"width":2},"WaterBuilding2":{"length":2,"width":2},"WaterBuilding3":{"length":2,"width":2},"WaterTower":{"length":1,"width":1},"Wreck0":{"length":1,"width":1},"Wreck1":{"length":1,"width":1},"Wreck2":{"length":1,"width":1},"Wreck3":{"length":1,"width":1},"Wreck4":{"length":1,"width":1},"Wreck5":{"length":1,"width":1},"WreckedBridge":{"length":2,"width":1},"WreckedBuilding16":{"length":3,"width":3},"WreckedBuilding17":{"length":2,"width":2},"WreckedBuilding9":{"length":2,"width":2},"WreckedDroidHub":{"length":1,"width":1},"WreckedSuzukiJeep":{"length":1,"width":1},"WreckedTankerV":{"length":2,"width":1},"WreckedVertCampVan":{"length":1,"width":1},"arizonabush1":{"length":1,"width":1},"arizonabush2":{"length":1,"width":1},"arizonabush3":{"length":1,"width":1},"arizonabush4":{"length":1,"width":1},"arizonatree1":{"length":1,"width":1},"arizonatree2":{"length":1,"width":1},"arizonatree3":{"length":1,"width":1},"arizonatree4":{"length":1,"width":1},"arizonatree5":{"length":1,"width":1},"arizonatree6":{"length":1,"width":1},"barrier":{"length":1,"width":1},"bigcooltowr":{"length":2,"width":2},"bridgeend":{"length":1,"width":1},"bridgefull":{"length":5,"width":1},"bridgemiddle":{"length":1,"width":1},"building1":{"length":3,"width":3},"building10":{"length":1,"width":2},"building11":{"length":3,"width":3},"building12":{"length":1,"width":2},"building2":{"length":3,"width":3},"building3":{"length":3,"width":3},"building7":{"length":3,"width":3},"building8":{"length":3,"width":3},"hoverwreck":{"length":1,"width":1},"miruin2":{"length":1,"width":1},"nukepowstat":{"length":2,"width":2},"trapcorner":{"length":1,"width":1},"trapstraight":{"length":1,"width":1}},

    isStruct(obj) {
        return !!this.STRUCTURES[obj.name];
    },
    isDroid(obj) {
        return this.DROIDS.has(obj.name);
    },
    isFeature(obj) {
        return !!this.FEATURES[obj.name];
    },
    typeOf(obj) {
        if (isStruct(obj)) {
            return "STRUCTURE";
        } else if (isDroid(obj)) {
            return "DROID";
        } else if (isFeature(obj)) {
            return "FEATURE";
        } else {
            throw new Error(`typeOf() failed to identify object as STRUCTURE DROID or FEATURE: ${JSON.stringify(obj)}`);
        }
    },
    // Check if a structure/feature fits at (x, y), where (x, y) is the bottom-right corner of the object
    // e.g. the following returns true
    // canPasteObj("A0LightFactory" 2, 2, [
    //   "fff",
    //   "fff",
    //   "fff",
    // ])
    canPasteObj(obj, x, y, layout, dictionary) {
        if (this.isDroid(obj)) {
            return true;
        }
        const { width, length } = (() => {
            if (isStruct(obj)) {
                return this.STRUCTURES[obj.name];
            } else if (isFeature(obj)) {
                return this.FEATURES[obj.name];
            }
        })();

        for () {
            for () {

            }
        }
    },
    // Append an object to its corresponding array
    pasteObj(obj, structures, droids, features) {
        switch (typeOf(obj)) {
            case "STRUCTURE":
                structures.push(obj);
                break;
            case "DROID":
                droids.push(obj);
                break;
            case "FEATURE":
                features.push(obj);
                break;
        }
    },
    // Return a new array
    // Handles ragged arrays (make uniformly rectangular)
    pad(layout) {
        const width = Math.max(...layout.map(s => s.length));
        return layout.map(row => row.padEnd(width, " "));
    },
    // Find the width and length of a layout. Assumes non-ragged
    dimensions(layout) {
        return {
            width: layout[0].length,
            length: layout.length,
        };
    },
    // Return a new transformed layout after (1) rotation and (2) left/right mirror
    transform(layout, rotation = 0, mirror = false) {
        const padded = this.pad(layout);
        const { width, length } = this.dimensions(padded);

        const result = [];

        for (let row = 0; row < (rotation % 2 === 0 ? length : width); row++) {
            let line = "";
            for (let col = 0; col < (rotation % 2 === 0 ? width : length); col++) {
                const char = (() => {
                    switch (rotation) {
                        case 0: // 0°
                            return mirror ? padded[row][width - 1 - col]
                                          : padded[row][col];

                        case 1: // 90° clockwise
                            return mirror ? padded[length - 1 - col][width - 1 - row]
                                          : padded[length - 1 - col][row];

                        case 2: // 180°
                            return mirror ? padded[length - 1 - row][col]
                                          : padded[length - 1 - row][width - 1 - col];

                        case 3: // 270° clockwise
                            return mirror ? padded[col][row]
                                          : padded[col][width - 1 - row];
                    }
                })();
                line += char;
            }
            result.push(line);
        }

        return { width, length, layout: result };
    },
    // layout     : an array of strings representing the layout
    // dictionary : a mapping between each character and a list of objects/functions
    // mirror     : left/right mirror
    pasteLayout(x, y, layout, dictionary, structures, droids, features, player = 0, rotation = 0, mirror = false) {
        const { width, length, layout: transformed } = this.transform(layout, rotation, mirror);
        for (let row = 0; row < length; row++) {
            for (let col = 0; col < width; col++) {
                const char = transformed[row][col];
                const entries = dictionary[char] ?? [];
                for (const entry of entries) {
                    const [x2, y2] = [x+col, y+col];
                    if (typeof entry === "function") {
                        entry(x2, y2);
                    } else {
                        entry.obj.position[0] += x2;
                        entry.obj.position[1] += y2;
                        entry.obj.direction = ((entry.obj.direction + rotation) % 4) * 0x4000;
                        entry.obj.player = player;
                        pasteObj(entry.obj, structures, droids, features);
                    }
                }
            }
        }
    },
};

// x, y     - the northwest corner of the location where the layout is to be pasted
// layout   - an array of strings representing the layout
// rotation - an integer 0, 1, 2, or 3 representing 0, 90, 180, and 270 degree clockwise rotation of the layout
// mirror   - a boolean for if the layout should be mirrored lengthwise (left becomes right, right becomes left)
// player   - an integer repsenting the player that the structures/droids belong to
function pasteLayout(x, y, layout, rotation, mirror, player, structures, droids) {
    let width_t = layout[0].length;
    let length_t = layout.length;

    for (let row = 0; row < length_t; row++) {
        for (let col = 0; col < width_t; col++) {
            let char = (() => {
                switch (rotation) {
                    case 0: return mirror ? layout[row][width_t-1-col] : layout[row][col];
                    case 1: throw new Error("Not yet implemented"); // TODO
                    case 2: return mirror ? layout[length_t-1-row][col] : layout[length_t-1-row][width_t-1-col];
                    case 3: throw new Error("Not yet implemented"); // TODO
                }
            })();

            switch (char) {
                case "c":
                    structures.push({
                        name: "A0CyborgFactory",
                        position: [128 * (x+col) + 64, 128 * (y+row+(rotation==2)) + 64],
                        direction: ((2+rotation)%4) * 0x4000,
                        modules: 0,
                        player: player
                    });
                    break;
                case "f":
                    structures.push({
                        name: "A0LightFactory",
                        position: [128 * (x+col) + 64, 128 * (y+row) + 64],
                        direction: ((2+rotation)%4) * 0x4000,
                        modules: 2,
                        player: player
                    });
                    break;
                case "h":
                    structures.push({
                        name: "A0CommandCentre",
                        position: [128 * (x+col+(mirror!=(rotation==2))) + 64, 128 * (y+row+(rotation==2)) + 64],
                        direction: ((0+rotation)%4) * 0x4000,
                        modules: 0,
                        player: player
                    });
                    break;
                case "p":
                    structures.push({
                        name: "A0PowerGenerator",
                        position: [128 * (x+col+(mirror!=(rotation==2))) + 64, 128 * (y+row+(rotation==2)) + 64],
                        direction: ((0+rotation)%4) * 0x4000,
                        modules: 1,
                        player: player
                    });
                    break;
                case "r":
                    structures.push({
                        name: "A0ResearchFacility",
                        position: [128 * (x+col+(mirror!=(rotation==2))) + 64, 128 * (y+row+(rotation==2)) + 64],
                        direction: ((0+rotation)%4) * 0x4000,
                        modules: 1,
                        player: player
                    });
                    break;
                case "o":
                    structures.push({
                        name: "A0ResourceExtractor",
                        position: [128 * (x+col) + 64, 128 * (y+row) + 64],
                        direction: ((0+rotation)%4) * 0x4000,
                        modules: 0,
                        player: player
                    });
                    break;
                case "t":
                    droids.push({
                        name: "ConstructionDroid",
                        position: [128 * (x+col) + 64, 128 * (y+row) + 64],
                        direction: (2+rotation)%4 * 0x4000,
                        player: player
                    });
                    break;
            }
        }
    }
}

const Texture = Object.freeze({
    TRANSITION:       0, // sand + yellow
    TRANSITION:       1, // sand + yellow
    TRANSITION:       2, // brown + sand
    TRANSITION:       3, // brown + sand
    TRANSITION:       4, // brown + sand
    BROWN_1:          5, // darkness: -1
    BROWN_2:          6, // darkness: 0
    BROWN_3:          7, // darkness: 1
    BROWN_4:          8, // darkness: 2
    YELLOW_1:         9, // light
    TRANSITION:       10, // sand + yellow
    YELLOW_2:         11, // dark
    SAND:             12,
    TRANSITION:       13, // brown + sand + water
    TRANSITION:       14, // sand + water
    TRANSITION:       15, // sand + water
    TRANSITION:       16, // sand + water
    WATER:            17,
    CLIFF_DOUBLE:     18,
    TRANSITION:       19, // concrete + red
    TRANSITION:       20, // concrete + red
    TRANSITION:       21, // concrete + red
    CONCRETE_1:       22, // dirty
    GREEN:            23,
    TRANSITION:       24, // green + brown
    TRANSITION:       25, // green + brown
    TRANSITION:       26, // green + brown
    TRANSITION:       27, // red + yellow
    TRANSITION:       28, // red + yellow
    TRANSITION:       29, // red + yellow
    TRANSITION:       30, // brown + green + water
    TRANSITION:       31, // green + water
    TRANSITION:       32, // green + water
    TRANSITION:       33, // green + water
    TRANSITION:       34, // brown + red
    TRANSITION:       35, // brown + red
    TRANSITION:       36, // brown + red
    ROAD_PATH:        37,
    TRANSITION:       38,
    TRANSITION:       39,
    TRANSITION:       40,
    TRANSITION:       41,
    TRANSITION:       42,
    TRANSITION:       43,
    RED_1:            44, // darkness: 0
    CLIFF_CORNER_1:   45, // light
    CLIFF_STRAIGHT_1: 46, // light
    ROAD_END:         47,
    RED_2:            48, // darkness: 4
    PATH_STRAIGHT_1:  49, // weak
    PATH_CORNER:      50,
    PATH_STRAIGHT_2:  51, // strong
    PATH_END:         52,
    RED_3:            53, // darkness: 3
    RED_4:            54, // darkness: 5
    CRATER_YELLOW:    55,
    CRATER_RED:       56,
    ROAD_T:           57,
    CRATER_BROWN:     58,
    ROAD_STRAIGHT:    59,
    DITCH_1:          60, // weak
    DITCH_2:          61, // strong
    CRATER_GREEN:     62,
    CRATER_BIG:       63,
    CRATER_BIG:       64,
    CRATER_BIG:       65,
    CRATER_BIG:       66,
    CRATER_BIG:       67,
    CRATER_BIG:       68,
    CRATER_BIG:       69,
    CRATER_BIG:       70,
    CLIFF_STRAIGHT_2: 71, // dark
    PATH_T:           72,
    PATH_PLUS:        73,
    RED_5:            74, // darkness: 1
    CLIFF_CORNER_2:   75, // dark
    RED_6:            76, // darkness: 2
    CONCRETE_2:       77, // clean

    // Returns the texture without rotation data
    id(texture) {
        return texture & 0x0fff;
    },
    // Returns the rotation of the texture (0, 1, 2, 3)
    rotation(texture) {
        return texture >> 12;
    },
    // Returns the texture rotated by some amount
    rotate(texture, amount=1) {
        if (amount === 0) return texture;
        if (amount < 0 || amount > 3) throw new Error("Texture.rotate() accepts 0, 1, 2, or 3");
        const rotation = (this.rotation(texture) + amount) % 4;
        return this.id(texture) | (rotation * 0x1000);
    },
    // Returns the texture rotated by a random amount
    spin(texture) {
        return this.id(texture) | (gameRand(4) * 0x1000);
    },
    isBrown(texture) {
        const id = this.id(texture);
        return id === this.BROWN_1
            || id === this.BROWN_2
            || id === this.BROWN_3
            || id === this.BROWN_4;
    },
    isRed(texture) {
        const id = this.id(texture);
        return id === this.RED_1
            || id === this.RED_2
            || id === this.RED_3
            || id === this.RED_4
            || id === this.RED_5
            || id === this.RED_6;
    },
    isConcrete(texture) {
        const id = this.id(texture);
        return id === this.CONCRETE_1
            || id === this.CONCRETE_2;
    },
    isYellow(texture) {
        const id = this.id(texture);
        return id === this.YELLOW_1
            || id === this.YELLOW_2;
    },
    isRoad(texture) {
        const id = this.id(texture);
        return id === this.ROAD_PATH
            || id === this.ROAD_END
            || id === this.ROAD_T
            || id === this.ROAD_STRAIGHT;
    },
    isCliff(texture) {
        const id = this.id(texture);
        return id === this.CLIFF_DOUBLE
            || id === this.CLIFF_CORNER_1
            || id === this.CLIFF_STRAIGHT_1
            || id === this.CLIFF_CORNER_2
            || id === this.CLIFF_STRAIGHT_2;
    },
    isWater(texture) {
        return this.id(texture) === this.WATER;
    },
    isSand(texture) {
        return this.id(texture) === this.SAND;
    },
});

// Map making library
const Strata = Object.freeze({
    parseArgs(props, ...children) {
        const defaultProps = {
            minWidth:           0,           // minimum width (x) in tiles
            minLength:          0,           // minimum length (y) in tiles
            height:             null,        // height (null = inherit from parent)
            texture:            null,        // texture (null = inherit from parent)
            roughness:          0,           // randomly subtract some height
            gap:                0,           // gap between children in tiles
            direction:          "vertical",  // layout children in column (vertical) or row (horizontal)
            justifyChildren:    "start",     // position of children along the major axis
            alignChildren:      "start",     // position of children along the cross axis
            padding:            0,           //
            paddingLeft:        0,           //
            paddingRight:       0,           //
            paddingTop:         0,           //
            paddingBottom:      0,           //
            paddingVertical:    0,           //
            paddingHorizontal:  0,           //
            margin:             0,           //
            marginLeft:         0,           //
            marginRight:        0,           //
            marginTop:          0,           //
            marginBottom:       0,           //
            marginVertical:     0,           //
            marginHorizontal:   0,           //
            soft:               false,       // soft = the edge vertices will not be set
            softLeft:           false,       //
            softRight:          false,       //
            softTop:            false,       //
            softBottom:         false,       //
            softVertical:       false,       //
            softHorizontal:     false,       //
        };

        // The first argument can be a child element OR a props object
        if (props.hasOwnProperty("texturemap")) {
            children.unshift(props); // include the first argument
            return [{ ...defaultProps }, children];
        } else {
            return [{ ...defaultProps, ...props }, children];
        }
    },
    createBaseElement(props, WIDTH, LENGTH) {
        // Calculate texturemap area
        const AREA = WIDTH * LENGTH;

        // Calculate heightmap dimensions
        const WIDTH_H = WIDTH + 1;
        const LENGTH_H = LENGTH + 1;
        const AREA_H = WIDTH_H * LENGTH_H;

        // Create texturemap
        const texturemap = typeof props.texture === "function"
            ? Array.from({ length: AREA }, props.texture)
            : Array(AREA).fill(props.texture);

        const heightmap = (() => {
            const arr = Array(AREA_H).fill(null);
            if (props.height === null) {
                return arr;
            }
            for (let x = 0; x < WIDTH_H; x++) {
                for (let y = 0; y < LENGTH_H; y++) {
                    if ((props.soft && (x === 0 || y === 0 || x === WIDTH_H-1 || y === LENGTH_H-1))
                        || (props.softLeft && (x === 0))
                        || (props.softRight && (x === WIDTH_H-1))
                        || (props.softTop && (y === 0))
                        || (props.softBottom && (y === LENGTH_H-1))
                        || (props.softVertical && (y === 0 || y === LENGTH_H-1))
                        || (props.softHorizontal && (x === 0 || x === WIDTH_H-1))
                    ) {
                        continue;
                    }
                    const i = y*WIDTH_H + x;
                    arr[i] = Math.max(0, Math.min(MAX_TILE_HEIGHT, props.height - gameRand(props.roughness + 1)));
                }
            }
            return arr;
        })();

        const structures = [];
        const droids = [];
        const features = [];

        return {
            width: WIDTH,
            length: LENGTH,
            texturemap,
            heightmap,
            structures,
            droids,
            features,
        };
    },
    // Overwrite the baseElement with children
    mergeAll(props, baseElement, children) {
        const { width, length } = baseElement;

        let x = props.padding;
        let y = props.padding;

        // total size of children + gaps on main axis
        const totalChildrenMainSize = (() => {
            if (props.direction === "vertical") {
                const childrenSize = children.reduce((len, child) => len + child.length, 0);
                const gaps = props.gap * Math.max(0, children.length - 1);
                return childrenSize + gaps;
            } else {
                const childrenSize = children.reduce((w, child) => w + child.width, 0);
                const gaps = props.gap * Math.max(0, children.length - 1);
                return childrenSize + gaps;
            }
        })();

        // available space along main axis inside padding box
        const availableMainSize = props.direction === "vertical"
            ? length - props.padding * 2
            : width - props.padding * 2;

        let mainOffset = 0;
        if (props.justifyChildren === "center") {
            mainOffset = Math.floor((availableMainSize - totalChildrenMainSize) / 2);
        } else if (props.justifyChildren === "end") {
            mainOffset = availableMainSize - totalChildrenMainSize;
        } // "start" is just 0

        if (props.direction === "vertical") {
            y = props.padding + mainOffset;
        } else {
            x = props.padding + mainOffset;
        }

        for (const child of children) {
            let childX = x;
            let childY = y;

            if (props.direction === "vertical") {
                // Cross-axis = x
                if (props.alignChildren === "start") {
                    childX = props.padding;
                } else if (props.alignChildren === "end") {
                    childX = width - props.padding - child.width;
                } else if (props.alignChildren === "center") {
                    childX = Math.floor((width - child.width) / 2);
                }

                this.merge(baseElement, child, childX, childY);
                y += child.length + props.gap;

            } else {
                // Cross-axis = y
                if (props.alignChildren === "start") {
                    childY = props.padding;
                } else if (props.alignChildren === "end") {
                    childY = length - props.padding - child.length;
                } else if (props.alignChildren === "center") {
                    childY = Math.floor((length - child.length) / 2);
                }

                this.merge(baseElement, child, childX, childY);
                x += child.width + props.gap;
            }
        }
    },
    createElement(...args) {
        const [props, children] = this.parseArgs(...args);

        // Calculate texturemap width
        const WIDTH = (() => {
            const totalWidth = props.direction === "vertical"
                ? Math.max(0, ...children.map(c => c.width))
                : children.reduce((width, child) => width + child.width, 0);

            const totalGap = props.direction === "vertical"
                ? 0
                : props.gap * Math.max(0, children.length - 1);

            return Math.max(props.minWidth, 2 * props.padding + totalWidth + totalGap);
        })();

        // Calculate texturemap length
        const LENGTH = (() => {
            const totalLength = props.direction === "vertical"
                ? children.reduce((length, child) => length + child.length, 0)
                : Math.max(0, ...children.map(c => c.length));

            const totalGap = props.direction === "vertical"
                ? props.gap * Math.max(0, children.length - 1)
                : 0;

            return Math.max(props.minLength, 2 * props.padding + totalLength + totalGap);
        })();

        // Create base element
        const baseElement = this.createBaseElement(props, WIDTH, LENGTH);

        // Merge children
        this.mergeAll(props, baseElement, children);

        return baseElement;
    },

    // Write element2 into element1 texturemap, with optional offset
    mergeTexturemap(element1, element2, x = 0, y = 0) {
        for (let row = 0; row < element2.length; row++) {
            for (let col = 0; col < element2.width; col++) {
                const targetRow = y + row;
                const targetCol = x + col;

                // Bounds check
                if (
                    targetRow < 0 || targetRow >= element1.length ||
                    targetCol < 0 || targetCol >= element1.width
                ) {
                    continue;
                }

                const i1 = targetRow * element1.width + targetCol;
                const i2 = row * element2.width + col;

                element1.texturemap[i1] = element2.texturemap[i2] ?? element2.texturemap[i2];
            }
        }
    },

    // Write element2 into element1 heightmap, with optional offset
    mergeHeightmap(element1, element2, x = 0, y = 0) {
        const width1 = element1.width + 1;
        const length1 = element1.length + 1;
        const width2 = element2.width + 1;
        const length2 = element2.length + 1;

        for (let row = 0; row < length2; row++) {
            for (let col = 0; col < width2; col++) {
                const targetRow = y + row;
                const targetCol = x + col;

                // Bounds check
                if (
                    targetRow < 0 || targetRow >= length1 ||
                    targetCol < 0 || targetCol >= width1
                ) {
                    continue;
                }

                const i1 = targetRow * width1 + targetCol;
                const i2 = row * width2 + col;

                element1.heightmap[i1] = element2.heightmap[i2] ?? element1.heightmap[i1];
            }
        }
    },

    mergeDroids(element1, element2, x = 0, y = 0) {
        element2.droids.forEach(d => {
            d.position[0] += 128*x;
            d.position[1] += 128*y;
            element1.droids.push(d);
        });
    },

    mergeStructures(element1, element2, x = 0, y = 0) {
        element2.structures.forEach(d => {
            d.position[0] += 128*x;
            d.position[1] += 128*y;
            element1.structures.push(d);
        });
    },

    mergeFeatures(element1, element2, x = 0, y = 0) {
        element2.features.forEach(d => {
            d.position[0] += 128*x;
            d.position[1] += 128*y;
            element1.features.push(d);
        });
    },

    // Write element2 into element1, with optional offset
    // e.g. merge(Ocean(), Iceberg())
    merge(element1, element2, x = 0, y = 0) {
        this.mergeTexturemap(element1, element2, x, y);
        this.mergeHeightmap(element1, element2, x, y);
        this.mergeDroids(element1, element2, x, y);
        this.mergeStructures(element1, element2, x, y);
        this.mergeFeatures(element1, element2, x, y);
    },

    // Pass an element into setMapData
    publish(element) {
        // Internally, the heightmap is width+1, length+1
        // But setMapData expects texturemap.length === heightmap.length
        // So trim the heightmap (remove last row and col)
        function trim(heightmap, W, L) {
            const result = [];
            const widthH = W + 1; // internal heightmap width
            // L+1 rows in internal heightmap, but we only want L rows
            for (let row = 0; row < L; row++) {
                for (let col = 0; col < W; col++) {
                    const i = row * widthH + col;
                    result.push(heightmap[i]);
                }
            }
            return result;
        }

        const e = element();

        setMapData(
            /* width      = */ e.width,
            /* length     = */ e.length,
            /* texturemap = */ e.texturemap,
            /* heightmap  = */ trim(e.heightmap, e.width, e.length),
            /* structures = */ e.structures,
            /* droids     = */ e.droids,
            /* features   = */ e.features,
        );
    }
});

////////////////////////////////////////////////////////////////////////////////

function StrataMap() {
    return Strata.createElement({
        texture: () => Texture.spin(Texture.CLIFF_DOUBLE),
        padding: 5,
        height: MAX_TILE_HEIGHT,
        roughness: 64,
    },
        Battlefield(),
    );
}

function Battlefield() {
    return Strata.createElement({
        height: 255,
        texture: Texture.CONCRETE_1,
        gap: 49,
    },
        Bases("A", NUM_PLAYERS >> 1),
        Road(),
        Bases("B", NUM_PLAYERS >> 1),
    );
}

function Bases(team, teamSize) {
    const children = [];

    for (let i = 0; i < teamSize; i++) {
        const player = i + (team === "A" ? 0 : 5);
        children.push(Base(team, player));
        if (i !== teamSize - 1) {
            children.push(Divider(team));
        }
    }

    return Strata.createElement({
        texture: Texture.CONCRETE_1,
        direction: "horizontal",
        alignChildren: team === "A" ? "start" : "end",
    },
        ...children
    );
}

function Base(team, player) {
    const structures = [];
    const droids = [];

    pasteLayout(0, 0, BaseLayouts["20x29_normal-cF3-rF"], team === "A" ? 2 : 0, 0, player, structures, droids);

    return {
        ...Strata.createElement({
            minWidth: 29,
            minLength: 20,
            texture: Texture.CONCRETE_1,
        }),
        structures: structures,
        droids:     droids,
    }
}

function Divider(team) {
    return Strata.createElement({
        minWidth: 3,
        minLength: 12,
        softBottom: team === "A",
        softTop: team === "B",
        softHorizontal: true,
        texture: () => Texture.spin(Texture.CLIFF_DOUBLE),
        height: MAX_TILE_HEIGHT,
        roughness: 64,
    });
}

function Road() {
    return Strata.createElement({
        // minWidth: 157,
        minLength: 2,
        texture: Texture.ROAD_STRAIGHT,
    });
}

Strata.publish(StrataMap);
