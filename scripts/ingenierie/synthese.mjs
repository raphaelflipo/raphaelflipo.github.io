export const physique = [
  ['q = ½ρV²', 'Pression dynamique q en Pa. ρ est la masse volumique de l’air en kg/m³ et V sa vitesse relative en m/s.', 'Dynamic pressure q in Pa. ρ is air density in kg/m³ and V is relative air speed in m/s.'],
  ['Fz = qSCz', 'Force verticale Fz en N. L’axe z est positif vers le haut et Cz est sans dimension. Pour une voiture qui génère de l’appui, Cz et Fz sont négatifs. L’appui vaut |Fz|.', 'Vertical force Fz in N. The z axis is positive upwards and Cz is dimensionless. For a car producing downforce, Cz and Fz are negative. Downforce is |Fz|.'],
  ['Fx = qSCx', 'Traînée Fx en N avec x orienté dans le sens de l’écoulement relatif incident. Cx est sans dimension et positif pour une traînée résistante. S est une même surface de référence en m² pour les deux forces.', 'Drag Fx in N with x pointing in the direction of the incoming relative flow. Cx is dimensionless and positive for resistive drag. S is the same reference area in m² for both forces.'],
  ['|Cz| / Cx', 'Rendement aérodynamique sans dimension, à comparer pour la même convention et les mêmes conditions de fonctionnement.', 'Dimensionless aerodynamic efficiency, comparable under the same conventions and operating conditions.'],
  ['Re = ρVL/μ', 'Nombre de Reynolds sans dimension. L est une longueur caractéristique en m et μ la viscosité dynamique en Pa·s.', 'Dimensionless Reynolds number. L is a characteristic length in m and μ is dynamic viscosity in Pa·s.'],
  ['ṁ = ρVA', 'Débit massique ṁ en kg/s à travers une aire A en m², pour une vitesse normale uniforme. En général, on intègre la composante normale de ρV sur la section.', 'Mass flow rate ṁ in kg/s through area A in m² for uniform normal velocity. In general, integrate the normal component of ρV across the section.'],
  ['Cp = (p − p∞)/q∞', 'Coefficient de pression sans dimension. p est la pression statique locale, p∞ la pression statique de référence et q∞ la pression dynamique de référence, toutes en Pa.', 'Dimensionless pressure coefficient. p is local static pressure, p∞ is reference static pressure and q∞ is reference dynamic pressure, all in Pa.'],
];

export const comparaison = [
  ['Entrées de pontons', 'Sidepod inlets', 'Ouverture triangulaire annoncée à Bahreïn.', 'Ouvertures horizontale et verticale déclarées à Melbourne.', 'Triangular opening declared at Bahrain.', 'Horizontal and vertical openings declared at Melbourne.', 'inlets'],
  ['Dégagement inférieur', 'Undercut', 'Creux sous le bord avant du ponton visible sur le profil.', 'Creux prolongé sous le ponton, déclaré plus prononcé.', 'Recess under the leading edge of the sidepod visible in profile.', 'Recess extending along the sidepod, declared to be deeper.', 'sidepods'],
  ['Suspension avant', 'Front suspension', 'Triangles et poussoirs confirmés.', 'Poussoir conservé. Mercedes signale une biellette implantée plus bas.', 'Wishbones and push-rods confirmed.', 'Push-rod retained. Mercedes reports a lower track rod.', 'frontSuspension'],
  ['Plancher', 'Floor', 'Cloisons et profil de tunnel redessinés.', 'Nouvelle révision des cloisons et du profil de tunnel.', 'Redesigned fences and tunnel profile.', 'Another revision of the fences and tunnel profile.', 'floor'],
  ['Aileron arrière', 'Rear wing', 'Découpe d’extrémité du volet plus marquée et profils inférieurs révisés.', 'Profils de l’aileron supérieur et du beam wing retravaillés.', 'Larger flap-tip cut-out and revised lower profiles.', 'Reprofiled upper wing and beam wing.', 'rearWing'],
];

export const synthese = {
  pontons: {
    title: ['Quatre façons d’alimenter l’arrière', 'Four ways to feed the rear of the car'],
    body: [
      [
        'La W13 de Bahreïn libère une large zone du plancher extérieur autour d’une ouverture étroite. En 2023, le paquet de Monaco agrandit le ponton, remonte sa bouche et repositionne un bras avant. Ces changements se lisent ensemble. La carrosserie reçoit déjà un écoulement perturbé par le pneu et par la suspension.',
        'Avec la W15, la bouche triangulaire, le capot et l’arrière mécanique sont revus ensemble. Sur la W16 de Melbourne, les ouvertures horizontale et verticale et le passage plus creusé sous le ponton modifient la géométrie visible de l’entrée. Une vue de profil montre le dégagement, tandis qu’une vue trois-quarts distingue mieux les deux bouches. Les documents publics décrivent les intentions et le changement de forme. Les volumes internes et le débit de refroidissement restent inconnus.',
      ],
      [
        'The Bahrain W13 leaves a wide exposed outer floor around a narrow opening. In 2023, the Monaco package enlarged the sidepod, raised its opening and repositioned a front link. Read those changes together. Bodywork receives flow already disturbed by the tyre and suspension.',
        'The W15 reworked its triangular opening, engine cover and rear mechanical layout together. On the Melbourne W16, horizontal and vertical openings and a deeper undercut changed visible inlet geometry. A side view shows the clearance while a three-quarter view distinguishes the two openings. Public documents describe changes in shape and stated aims. The internal volumes and cooling mass flow remain unknown.',
      ],
    ],
    sources: ['f113', 'monaco23', 'bahrain24', 'melbourne25'],
  },
  plancher: {
    title: ['Ce qui fait travailler le plancher', 'What makes the floor work'],
    body: [
      [
        'Le débit qui passe réellement dans les tunnels dépend de l’entrée et de la pression à leur sortie. Les cloisons, le sol en mouvement relatif, les bords du plancher, les roues et l’aspiration de l’ensemble arrière fixent les conditions de ce passage. Dans un tube de courant, une réduction d’aire peut faire augmenter la vitesse moyenne. Le champ de pression sur la voiture s’obtient ensuite en tenant compte de l’écoulement entier et des pertes.',
        'La position verticale est une variable aérodynamique. Une faible garde au sol peut amplifier la dépression, puis diminuer le débit ou provoquer un décollement si le passage devient trop contraint. Le mouvement du châssis peut alors changer rapidement la charge. Au-delà de la géométrie nominale, il faut connaître la plage de hauteur, de tangage, de roulis et de lacet pour caractériser l’appui.',
      ],
      [
        'The mass flow passing through the tunnels depends on entry flow and pressure at the outlet. Fences, road motion, floor edges, wheels and the rear aerodynamic assembly set the boundary conditions. In a streamtube, reducing area can increase mean speed. Finding surface pressure on the car requires the whole flow field and its losses.',
        'Vertical position is an aerodynamic variable. Low clearance can increase suction before constriction reduces mass flow or produces separation. Chassis motion can then change the load rapidly. Beyond nominal geometry, downforce must be characterised over ride height, pitch, roll and yaw.',
      ],
    ],
    sources: ['ground', 'bouncing', 'floor23'],
  },
  modelisation: {
    title: ['Du rendu Blender à la géométrie dans le navigateur', 'From Blender renders to browser geometry'],
    body: [
      [
        'Les rendus fixes servent d’abord à lire une silhouette ou une jonction de carrosserie. La visionneuse charge le GLB à la demande pour changer de point de vue et animer le volet. Toutes les illustrations techniques de ces fiches utilisent les rendus de la collection.',
        'Un nom de nœud glTF identifie un objet de l’export, sans établir qu’il s’agit d’une pièce constructeur. Les exports W14, W15 et W16 regroupent l’essentiel de la carrosserie et de la mécanique visible. Isoler chaque composant requiert une nomenclature et un export séparé de véritables objets Blender. Avec les fichiers actuels, les observations par zone restent géométriques et les vues sous le plancher restent des reconstitutions.',
      ],
      [
        'Still renders first establish a silhouette or bodywork junction. The viewer loads the GLB on demand, allowing users to move the camera and animate the flap. The technical illustrations here all use renders from the collection.',
        'A glTF node name identifies an exported object without establishing that it matches a manufacturer part. The W14, W15 and W16 exports combine most bodywork and visible mechanical geometry. Isolating each component requires a parts inventory and export of actual separate Blender objects. With the present files, observations are geometric and underfloor views remain reconstructions.',
      ],
    ],
    sources: [],
  },
};
