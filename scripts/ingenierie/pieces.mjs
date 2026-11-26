export const pieces = [
  {
    id: 'frontWing',
    title: ['Aileron avant', 'Front wing'],
    simple: ['L’aileron plaque le train avant au sol et prépare l’air qui arrive sur les roues et sous la voiture.', 'The front wing loads the front axle and shapes the air reaching the wheels and underfloor.'],
    detail: [
      'Le profil principal et les volets inversés dévient la quantité de mouvement de l’air vers le haut. La différence de pression entre leurs faces produit une force vers le sol. La corde et le calage varient selon l’envergure pour répartir la charge et régler la balance. Les fentes interprofils orientent l’écoulement autour du bord d’attaque de l’élément suivant et influencent la récupération de pression, ce qui permet de répartir la déviation sur plusieurs profils. Une incidence ou un gradient adverse excessifs peuvent provoquer un décollement avant le bord de fuite.',
      'The inverted mainplane and flaps turn the air’s momentum upwards. Pressure differences between their surfaces produce a downward force. Chord and incidence vary across the span to distribute load and set the balance. Slot gaps guide flow at the next element’s leading edge and influence pressure recovery, sharing the turning across several elements. Excessive incidence or an adverse pressure gradient can cause separation before the trailing edge.',
    ],
    interactions: [
      'Les dérives et les extrémités des profils modifient les échanges de pression latéraux et le sillage des pneus. Les raccords au nez modifient la charge au centre et l’alimentation du plancher. En tangage, la distance au sol change et peut déplacer la balance, même à incidence mécanique constante.',
      'Endplates and element tips influence spanwise pressure leakage and the tyre wake. Nose junctions change centre-section loading and how the floor is fed. Pitch changes ground clearance and can move the balance even with fixed wing incidence.',
    ],
    terms: ['mainplane', 'flap', 'endplate', 'boundary-layer', 'balance', 'slot-gap'], sources: ['lift', 'ground'],
  },
  {
    id: 'nose',
    title: ['Nez et châssis avant', 'Nose and front chassis'],
    simple: ['Le nez porte l’aileron avant et organise le passage de l’air vers le plancher.', 'The nose carries the front wing and shapes the air path towards the floor.'],
    detail: [
      'Le nez prolonge la cellule de survie par une structure d’absorption frontale. Sa section, sa largeur et sa hauteur déterminent la place laissée à l’air au-dessous et sur les côtés. Leur raccord avec le profil d’aileron modifie le champ de pression à la jonction. Le volume réglementaire et les exigences de choc limitent la liberté de dessiner ce passage.',
      'The nose extends the survival cell with a frontal impact structure. Its cross-section, width and height set the room for flow underneath and around its sides. Its junction with the wing changes the local pressure field. Regulatory volumes and impact requirements limit freedom to shape that passage.',
    ],
    interactions: [
      'Déplacer le raccord peut charger différemment le centre de l’aileron et modifier les conditions d’entrée sous le châssis. Le bilan dépend du plancher, de la garde au sol et des sillages des jonctions. Une photo ne permet pas de quantifier la répartition de l’appui.',
      'Moving the junction can change centre-wing loading and under-chassis inflow. The result depends on the floor, ride height and junction wakes. A photograph cannot quantify the load distribution.',
    ],
    terms: ['mainplane', 'balance', 'pressure-coefficient'], sources: ['lift'],
  },
  {
    id: 'frontSuspension',
    title: ['Suspension avant', 'Front suspension'],
    simple: ['Les bras guident la roue. La géométrie de suspension influence la façon dont le nez descend au freinage.', 'Suspension links guide the wheel. Their geometry affects how the nose dives under braking.'],
    detail: [
      'Les triangles haut et bas contraignent le mouvement du porte-moyeu et la biellette de direction règle son orientation. Un poussoir actionne la suspension intérieure surtout en compression lors de l’enfoncement, un tirant surtout en traction. En vue latérale, l’orientation des bras permet de faire transiter une partie des efforts longitudinaux par les liaisons. Cette géométrie anti-plongée limite, selon le cas, la compression due au freinage. La cinématique réelle dépend des centres instantanés, des points d’ancrage en trois dimensions et de la répartition de freinage.',
      'Upper and lower wishbones constrain upright motion and the steering link sets its orientation. A push-rod actuates the inboard suspension mainly in compression during bump, a pull-rod mainly in tension. In side view, wishbone geometry routes part of the longitudinal load through the links. This anti-dive geometry can limit braking-related suspension compression. Actual kinematics depend on instant centres, three-dimensional pickup points and brake balance.',
    ],
    interactions: [
      'La mécanique contrôle la position de la roue et l’assiette. Les carénages des bras, eux, affectent localement la direction du flux et le sillage devant les roues ou le plancher. Une variation visible d’un bras ne suffit pas à déduire un pourcentage d’anti-plongée.',
      'Mechanically, the assembly sets wheel position and pitch. The link fairings also influence local flow direction and the wake approaching the wheels or floor. A change to a visible link cannot establish an anti-dive percentage.',
    ],
    terms: ['push-rod', 'pull-rod', 'anti-dive', 'pitch', 'ride-height'], sources: ['suspensions'],
  },
  {
    id: 'wheels',
    title: ['Roues, pneumatiques et freins', 'Wheels, tyres and brakes'],
    simple: ['Une roue tourne dans l’air et crée un sillage turbulent. Les conduits de frein captent une partie de l’air pour évacuer la chaleur.', 'A rotating wheel creates a turbulent wake. Brake ducts capture some air to remove heat.'],
    detail: [
      'Une roue exposée est un obstacle non profilé. La rotation et la proximité du sol modifient le point de séparation et la structure du sillage. Ce sillage transporte un déficit de pression totale vers le ponton et le bord du plancher. Le nez du conduit de frein capte de l’air à pression totale utile. L’échauffement et les pertes de charge à travers le circuit imposent un compromis entre refroidissement, débit et traînée. La déformation du pneu et le braquage modifient ces phénomènes.',
      'An exposed wheel is a bluff body. Rotation and proximity to the road affect separation and wake structure. The wake carries a total-pressure deficit towards the sidepod and floor edge. The brake duct captures air with useful total pressure. Heating and pressure losses in the duct impose a cooling, mass-flow and drag trade-off. Tyre deformation and steering alter these effects.',
    ],
    interactions: [
      'Les enjoliveurs et les déflecteurs sont encadrés par la réglementation. La géométrie autour des roues agit avec les fentes de l’aileron avant, les bords du plancher et les angles de lacet. À l’arrière, les écoulements chassés latéralement du contact pneu–sol peuvent interagir avec la sortie du diffuseur.',
      'Wheel covers and deflectors are constrained by the rules. Wheel-area geometry works alongside front-wing slots, floor edges and yaw angle. At the rear, flow displaced sideways near the contact patch can interact with the diffuser outlet.',
    ],
    terms: ['wake', 'separation', 'total-pressure', 'yaw', 'mass-flow'], sources: ['ground'],
  },
  {
    id: 'sidepods',
    title: ['Pontons et passage inférieur', 'Sidepods and undercut'],
    simple: ['Les pontons enveloppent les échangeurs. Leur forme laisse aussi un passage d’air vers l’arrière, au-dessus du plancher.', 'Sidepods enclose heat exchangers and shape a passage for air flowing above the floor towards the rear.'],
    detail: [
      'La lèvre d’entrée répartit l’air entre le conduit de refroidissement et la carrosserie extérieure. L’undercut est la concavité sous l’épaule du ponton qui dégage un passage longitudinal. La rampe supérieure et le rétrécissement arrière guident d’autres portions du flux. La qualité de ce guidage dépend de la courbure, des gradients de pression et du sillage des pneus. Une forme très creusée peut aussi imposer des contraintes d’encombrement, de rigidité et de refroidissement.',
      'The inlet lip divides flow between the cooling duct and outer bodywork. The undercut is the recess below the sidepod shoulder, creating a streamwise passage. The upper ramp and rear taper guide other parts of the flow. Curvature, pressure gradients and the tyre wake govern how well this works. A deep recess may also constrain packaging, stiffness and cooling.',
    ],
    interactions: [
      'L’air longeant l’undercut interagit avec le bord du plancher et le sillage de la roue arrière. La qualité du flux externe et le débit interne doivent être étudiés ensemble. Les volumes d’échangeurs et leurs performances ne se déduisent pas de la forme extérieure.',
      'Flow along the undercut interacts with the floor edge and rear-wheel wake. External flow quality and internal mass flow must be considered together. The exterior shape does not establish exchanger volume or performance.',
    ],
    terms: ['sidepod', 'undercut', 'wake', 'separation', 'coke-bottle'], sources: ['ground'],
  },
  {
    id: 'inlets',
    title: ['Entrées de refroidissement des pontons', 'Sidepod cooling inlets'],
    simple: ['Les ouvertures prélèvent de l’air pour refroidir les échangeurs. Le reste contourne le ponton.', 'These openings capture cooling air for the heat exchangers. The rest passes around the sidepod.'],
    detail: [
      'La géométrie de la lèvre oriente la ligne de partage entre air capté et flux externe. Le débit requis dépend de la charge thermique et des pertes de pression du circuit. L’efficacité dépend de la pression totale à l’entrée et de la différence de pression effective à travers l’échangeur. Une ouverture plus grande ne garantit pas un meilleur refroidissement si le flux capté est irrégulier ou si la perte de charge interne augmente.',
      'Lip geometry guides the dividing streamline between captured air and external flow. Required mass flow depends on heat load and pressure losses through the passage. Performance depends on inlet total pressure and the effective pressure difference across the exchanger. A larger opening does not guarantee better cooling if incoming flow is uneven or internal pressure losses increase.',
    ],
    interactions: [
      'Faire sortir l’air chaud par les ouïes ou la sortie arrière change sa trajectoire et sa rencontre avec l’air extérieur. Les ouvertures visibles s’étudient donc avec les pontons, le capot et le plancher.',
      'Sending warmed air through louvres or the rear outlet changes its path and its interaction with external air. Visible openings are therefore read alongside the sidepods, engine cover and floor.',
    ],
    terms: ['sidepod', 'total-pressure', 'mass-flow', 'pressure-recovery'], sources: ['drag'],
  },
  {
    id: 'floor',
    title: ['Plancher et effet de sol', 'Floor and ground effect'],
    simple: ['Le passage entre la voiture et la piste accélère une partie de l’air. La pression sous le plancher peut alors être plus basse, ce qui génère de l’appui.', 'The passage between the car and track accelerates some of the air. Lower pressure beneath the floor can produce downforce.'],
    detail: [
      'Le plancher, les cloisons d’entrée et le sol forment un écoulement tridimensionnel ouvert latéralement. La section convergente réorganise le flux vers le col. La conservation du débit relie vitesse et aire dans un tube de courant identifié. En réalité, le débit capté varie avec les conditions aux limites, les fuites latérales et la couche limite. La force résulte de l’intégration du champ de pression sur les surfaces. Une relation de Bernoulli idéale aide à lire une ligne de courant loin des pertes, mais ne prédit ni le débit effectivement capté ni la charge du plancher.',
      'The floor, inlet fences and road define a three-dimensional passage open at the sides. Its converging region organises flow towards the throat. Continuity relates speed and area within an identified streamtube. Captured mass flow nonetheless depends on boundary conditions, lateral leakage and boundary layers. Force follows from integrating surface pressure. An ideal Bernoulli relation helps interpret a streamline away from losses but cannot predict mass flow capture or floor load.',
    ],
    interactions: [
      'Les cloisons et ailettes peuvent créer des structures tourbillonnaires qui modifient la pénétration latérale de l’air et du sillage des roues. Le roulis déplace les jeux gauche et droit, le lacet rend l’alimentation asymétrique et le tangage déplace l’étranglement. À très faible hauteur, le débit peut chuter ou se séparer. Un couplage entre charge, débattement et déformation peut soutenir le marsouinage. Le contact mécanique avec la piste peut créer un rebond distinct.',
      'Fences and edge wings can produce vortical structures that alter lateral inflow and wheel-wake ingestion. Roll changes left and right gaps, yaw makes the feed asymmetric and pitch shifts the constriction. At very low ride height, mass flow may fall or separate. Coupling between aerodynamic load, suspension travel and deflection can sustain porpoising. Mechanical contact with the track can cause a separate bouncing mechanism.',
    ],
    terms: ['ground-effect', 'floor-fences', 'venturi', 'vortex', 'porpoising', 'roll', 'yaw', 'ride-height'], sources: ['ground'],
  },
  {
    id: 'diffuser',
    title: ['Diffuseur arrière', 'Rear diffuser'],
    simple: ['Le diffuseur élargit le passage sous l’arrière de la voiture. Il aide l’air du plancher à rejoindre le sillage.', 'The diffuser expands the passage under the rear of the car so underfloor air can rejoin the wake.'],
    detail: [
      'Le diffuseur est la section divergente terminale. Une expansion progressive peut ralentir le courant moyen et récupérer une partie de la pression statique après le col. Cette récupération implique un gradient de pression adverse. Si l’expansion est trop abrupte pour la quantité de mouvement dans la couche limite, celle-ci se décolle. La récupération et le débit traversant le soubassement peuvent alors diminuer ensemble. L’angle apparent d’une rampe ne suffit pas à caractériser une expansion tridimensionnelle.',
      'The diffuser is the terminal divergent section. Gradual expansion can slow the mean flow and recover some static pressure after the throat. This recovery entails an adverse pressure gradient. If expansion is too abrupt for the momentum in the boundary layer, it separates. Pressure recovery and underfloor mass flow may then both fall. An apparent ramp angle cannot characterise a three-dimensional expansion.',
    ],
    interactions: [
      'Les cloisons, le sillage des roues et la garde au sol modifient l’alimentation des rampes. Le beam wing et l’aileron supérieur modifient le champ de pression aval, donc les conditions d’extraction. Leurs forces ne s’additionnent pas comme celles d’éléments isolés.',
      'Strakes, tyre wake and ground clearance affect ramp inflow. The beam wing and upper rear wing change the downstream pressure field and hence extraction conditions. Their forces do not combine like isolated components.',
    ],
    terms: ['diffuser', 'pressure-recovery', 'pressure-gradient', 'beam-wing'], sources: ['ground'],
  },
  {
    id: 'cockpit',
    title: ['Halo, cockpit et rétroviseurs', 'Halo, cockpit and mirrors'],
    simple: ['Le Halo protège le pilote. Le cockpit et les rétroviseurs remplissent leurs fonctions de conduite et modifient aussi le flux local.', 'The Halo protects the driver. The cockpit and mirrors serve the driver and also alter local airflow.'],
    detail: [
      'Le Halo est une structure de protection. Comme le bord du cockpit, le casque et les supports de rétroviseurs, il déplace l’air et peut créer des sillages de jonction. Les équipes peuvent intégrer les carénages permis au dessin du châssis. Les exigences de résistance et de visibilité restent prioritaires.',
      'The Halo is a protective structure. Like the cockpit rim, helmet and mirror mounts, it displaces air and can generate junction wakes. Teams can integrate permitted fairings into the shape of the chassis. Strength and visibility requirements remain primary.',
    ],
    interactions: [
      'Ces perturbations peuvent se propager vers la prise d’air supérieure ou l’épaule du ponton selon la hauteur, le lacet et l’implantation. Le déplacement d’un cockpit entraîne aussi une réorganisation mécanique et ergonomique.',
      'These disturbances can reach the upper intake or sidepod shoulder depending on height, yaw and placement. Moving the cockpit also requires mechanical and ergonomic changes.',
    ],
    terms: ['halo', 'wake', 'yaw'], sources: [],
  },
  {
    id: 'airbox',
    title: ['Prise d’air supérieure', 'Upper air intake'],
    simple: ['L’ouverture au-dessus du pilote alimente le groupe propulseur en air et peut servir à des fonctions auxiliaires selon l’architecture.', 'The opening above the driver supplies air to the power unit and can serve auxiliary functions depending on the layout.'],
    detail: [
      'L’entrée d’air de l’Airbox prélève un flux au-dessus de l’appuie-tête. L’admission du moteur requiert une pression totale et une distorsion acceptables compte tenu du débit demandé. Des conduits auxiliaires peuvent être logés dans la même enveloppe selon l’architecture. La photographie externe ne permet pas d’attribuer des voies internes à tel échangeur.',
      'The airbox intake captures flow above the headrest. Engine induction needs acceptable total pressure and distortion at the required mass flow. Auxiliary ducts may share the housing depending on the layout. External imagery cannot assign internal passages to a particular exchanger.',
    ],
    interactions: [
      'Les sillages du Halo et du casque peuvent influencer l’aspiration. La forme extérieure de l’Airbox et du capot influence le courant libre vers l’aileron arrière et son niveau de turbulence.',
      'Halo and helmet wakes can influence the intake. The exterior of the airbox and engine cover affects the free stream and turbulence approaching the rear wing.',
    ],
    terms: ['airbox', 'total-pressure', 'mass-flow', 'wake'], sources: [],
  },
  {
    id: 'engineCover',
    title: ['Capot moteur et refroidissement', 'Engine cover and cooling'],
    simple: ['Le capot enveloppe le groupe propulseur. Ses ouvertures permettent à l’air réchauffé de sortir.', 'The cover encloses the power unit and allows heated air to leave through its outlets.'],
    detail: [
      'L’enveloppe, les ouïes et la sortie arrière répartissent le débit de refroidissement. Leur section et la pression externe à proximité des sorties influencent la perte de charge du circuit et les jets sortants. Le pincement arrière, dit coke bottle, libère un passage entre carrosserie et roue. Une arête dorsale éventuelle peut influencer le flux en lacet. Les fonctions d’une arête visible et son effet net nécessitent des données indépendantes.',
      'The envelope, louvres and rear outlet distribute cooling mass flow. Their area and the outside pressure near the exits influence circuit losses and outlet jets. The coke-bottle taper opens a path between bodywork and wheel. A dorsal fin, if present, may influence yawed flow. The function and net effect of a visible ridge require independent evidence.',
    ],
    interactions: [
      'L’air issu du refroidissement rencontre le flux externe puis rejoint l’écoulement vers le beam wing, le diffuseur ou l’aileron supérieur. Le dessin doit équilibrer les besoins thermiques et la qualité de ces écoulements aval.',
      'Cooling discharge mixes with the external flow and heads towards the beam wing, diffuser or upper rear wing. The design balances thermal demands against downstream flow quality.',
    ],
    terms: ['coke-bottle', 'mass-flow', 'wake', 'beam-wing'], sources: ['drag'],
  },
  {
    id: 'rearSuspension',
    title: ['Suspension arrière', 'Rear suspension'],
    simple: ['La suspension arrière guide la roue et maintient la voiture dans une plage de hauteur où le plancher travaille efficacement.', 'The rear suspension guides the wheel and helps keep the car within a ride-height range where the floor works efficiently.'],
    detail: [
      'Les triangles et leurs ancrages gèrent les mouvements de la roue, tandis que le poussoir ou tirant actionne les éléments élastiques et d’amortissement embarqués. L’anti-cabrage à l’accélération dépend de la géométrie des liaisons et du chemin d’effort, indépendamment du choix poussoir ou tirant. Changer l’architecture déplace l’encombrement des éléments intérieurs et peut libérer ou contraindre la carrosserie arrière.',
      'Wishbones and their pickups guide wheel movement, while the push-rod or pull-rod actuates inboard springs and dampers. Anti-squat under acceleration depends on link geometry and the load path, independently of the choice of actuation. Changing layout moves the inboard hardware and can open or restrict rear bodywork space.',
    ],
    interactions: [
      'Le contrôle de l’assiette aide à stabiliser la géométrie relative du col et de la piste. À l’extérieur, les bras et leurs carénages travaillent dans l’écoulement provenant du ponton, voisin des sillages du pneu et du diffuseur.',
      'Pitch control helps stabilise the geometry between the floor throat and road. Outside, links and fairings work in the flow from the sidepod, close to tyre and diffuser wakes.',
    ],
    terms: ['push-rod', 'pull-rod', 'anti-squat', 'ride-height', 'pitch'], sources: ['suspensions', 'ground'],
  },
  {
    id: 'rearWing',
    title: ['Aileron arrière et beam wing', 'Rear wing and beam wing'],
    simple: ['L’aileron charge l’arrière de la voiture. Le petit aileron placé plus bas travaille avec le diffuseur.', 'The upper wing loads the rear of the car. The smaller wing below works with the diffuser.'],
    detail: [
      'Le profil principal et le volet supérieur organisent la circulation et une différence de pression génératrice d’appui. Près des extrémités, la communication entre zones de pression favorise des tourbillons marginaux. Leur influence sur la traînée induite dépend de la répartition de charge et de la géométrie des plaques latérales et des raccords. Les mâts supportent l’assemblage et peuvent générer des interactions de jonction. Le beam wing se trouve plus bas, à proximité de la sortie du diffuseur.',
      'The mainplane and upper flap establish circulation and a pressure difference that produces downforce. Near the tips, communication between pressure regions promotes trailing vortices. Their effect on induced drag depends on the load distribution and the geometry of endplates and junctions. Pylons support the assembly and can introduce junction-flow interactions. The beam wing sits lower, near the diffuser outlet.',
    ],
    interactions: [
      'Une variation du profil ou de son incidence modifie le compromis entre charge arrière, traînée et répartition avant–arrière. L’aileron supérieur et le beam wing modifient le champ de pression dans lequel débouche le diffuseur. La circulation d’un profil isolé ne suffit pas à déterminer le résultat de l’ensemble.',
      'Changing section shape or incidence alters the trade-off between rear load, drag and front-to-rear balance. The upper wing and beam wing change the pressure field at the diffuser exit. Circulation around an isolated section does not establish the behaviour of the combined system.',
    ],
    terms: ['mainplane', 'flap', 'endplate', 'beam-wing', 'circulation', 'induced-drag'], sources: ['lift', 'drag', 'ground'],
  },
  {
    id: 'drs',
    title: ['DRS et volet mobile', 'DRS and movable flap'],
    simple: ['Le volet arrière s’ouvre dans les zones autorisées. L’appui et la résistance à l’avancement diminuent généralement.', 'The rear flap opens in authorised zones, generally reducing downforce and resistance to forward motion.'],
    detail: [
      'En position fermée, le volet participe au profil courbé et à la charge de l’assemblage. Lorsqu’il pivote, l’ouverture et la cambrure effective changent. L’augmentation du passage entre éléments modifie l’écoulement et la circulation de l’ensemble. L’appui arrière et les contributions de pression et de traînée induite tendent à diminuer. À conditions comparables, cette réduction peut favoriser l’accélération en ligne droite. L’effet réel dépend de l’aileron, de sa charge initiale et des conditions de piste.',
      'With the flap closed, it contributes to the wing assembly’s curvature and load. When it pivots, the opening and effective camber change. The larger gap alters flow and circulation around the assembly. Rear downforce and pressure and induced drag contributions tend to decrease. All else equal, lower drag can help straight-line acceleration. The actual effect depends on the wing, its initial load and track conditions.',
    ],
    interactions: [
      'En course, l’activation se limite aux secteurs prévus et dépend de l’écart au point de détection et de l’autorisation électronique. Les conditions météorologiques ou les drapeaux peuvent désactiver le dispositif. L’animation 3D illustre une rotation du volet sans reconstituer la logique de course ni mesurer l’appui.',
      'In a race, activation is limited to designated zones and depends on the detection-point gap and electronic authorisation. Weather or flags can disable the system. The 3D animation shows flap rotation without reproducing the race logic or measuring downforce.',
    ],
    terms: ['drs', 'flap', 'drag', 'downforce', 'slot-gap'], sources: ['lift', 'drag'],
  },
];
