// Les coordonnées sont celles des exports métriques glTF. X longitudinal
// croît vers l'arrière, Y est la verticale, Z est transversal. Le repère
// de châssis est le nez de l'ouverture du cockpit dans le plan médian.
export const monoplaces = {
  w13: {
    name: 'W13', year: 2022, circuit: 'Bahreïn',
    page: '/mercedes-w13/', model: '/mercedes-w13/mercedes-w13.glb',
    poster: '/mercedes-w13/mercedes-w13.webp',
    anchors: { front: 0, rear: 3.54, chassis: .96 }
  },
  w14: {
    name: 'W14', year: 2023, circuit: 'Monaco',
    page: '/mercedes-w14/', model: '/mercedes-w14/mercedes-w14.glb?v=2',
    poster: '/mercedes-w14/studio-800.webp?v=2',
    anchors: { front: -1.80, rear: 1.80, chassis: -.79 }
  },
  w15: {
    name: 'W15', year: 2024, circuit: 'Bahreïn',
    page: '/mercedes-w15/', model: '/mercedes-w15/mercedes-w15.glb',
    poster: '/mercedes-w15/studio-800.webp',
    anchors: { front: -1.80, rear: 1.80, chassis: -.675 }
  },
  w16: {
    name: 'W16', year: 2025, circuit: 'Melbourne',
    page: '/mercedes-w16/', model: '/mercedes-w16/mercedes-w16.glb',
    poster: '/mercedes-w16/studio-800.webp',
    anchors: { front: -1.80, rear: 1.80, chassis: -.675 }
  }
};

export const repereCommun = { front: -1.80, rear: 1.80, chassis: -.75 };

// Les cadrages suivent la pièce autour de l'essieu correspondant.
// X est un décalage longitudinal en mètres par rapport à l'essieu choisi.
export const pieces = {
  nose: { anchor: 'front', point: [-.68,.34,0], width: 2.3, yaw: -.74, pitch: .36 },
  frontWing: { anchor: 'front', point: [-.88,.22,0], width: 2.9, yaw: -1.16, pitch: .48 },
  frontSuspension: { anchor: 'front', point: [.02,.40,.51], width: 1.7, yaw: -.45, pitch: .52 },
  sidepods: { anchor: 'front', point: [1.83,.47,.42], width: 3.2, yaw: -.25, pitch: .30 },
  inlets: { anchor: 'front', point: [1.48,.54,.48], width: 1.9, yaw: -.71, pitch: .30 },
  floor: { anchor: 'front', point: [1.90,.10,0], width: 4.3, yaw: -.25, pitch: -.49 },
  engineCover: { anchor: 'rear', point: [-.91,.63,0], width: 3.0, yaw: .36, pitch: .51 },
  diffuser: { anchor: 'rear', point: [.43,.18,0], width: 2.5, yaw: 1.19, pitch: -.25 },
  rearSuspension: { anchor: 'rear', point: [0,.37,.52], width: 1.85, yaw: .57, pitch: .49 },
  rearWing: { anchor: 'rear', point: [.40,.80,0], width: 2.35, yaw: 1.03, pitch: .33 }
};
