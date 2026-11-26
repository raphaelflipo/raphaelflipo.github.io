import { exportPhoto, restoreCamera, saveCamera, shareView } from './vues-3d.js';

const labels = {
  frontWing: ['Aileron avant', 'Front wing',
    'Les profils avant génèrent de l’appui et orientent l’écoulement qui atteint les roues et le plancher.',
    'The front elements generate downforce and influence the flow reaching the wheels and floor.',
    'Les fentes interprofils contribuent à maîtriser la couche limite dans les zones de récupération de pression.',
    'Slot gaps help manage the boundary layer through the pressure-recovery regions.'],
  nose: ['Nez', 'Nose',
    'La forme du nez laisse un passage entre l’aileron avant et l’entrée du plancher.',
    'The nose shape leaves a passage between the front wing and the floor inlet.',
    'La section et la hauteur du nez modifient la distribution tridimensionnelle de débit sous le châssis.',
    'Nose section and height affect the three-dimensional mass-flow distribution beneath the chassis.'],
  frontSuspension: ['Suspension avant', 'Front suspension',
    'Les bras guident la roue. Leur forme et leur position influencent aussi l’air autour du châssis.',
    'The links guide the wheel. Their shape and position also influence flow around the chassis.',
    'La cinématique contrôle l’assiette. Les bras exposés perturbent localement le champ de vitesse en amont des pontons.',
    'The kinematics help control attitude. Exposed links locally disturb the velocity field upstream of the sidepods.'],
  wheels: ['Roues et freins', 'Wheels and brakes',
    'Les roues produisent un sillage turbulent. Les conduits acheminent de l’air frais vers les freins.',
    'The wheels leave a turbulent wake. Ducts deliver cooling air to the brakes.',
    'Le sillage d’un pneu en rotation présente un déficit de pression totale. Son interaction avec le sol dépend du lacet et de la déformation du pneu.',
    'The wake of a rotating tyre has a total-pressure deficit. Its interaction with the ground depends on yaw and tyre deformation.'],
  sidepods: ['Pontons', 'Sidepods',
    'Les pontons intègrent le refroidissement et orientent l’air le long de la carrosserie.',
    'The sidepods package the cooling system and guide external flow along the bodywork.',
    'Le creusement sous le ponton redirige l’écoulement latéral, avec une interaction entre carrosserie, bord du plancher et sillage des pneus.',
    'The sidepod undercut redirects lateral flow, with interactions between the bodywork, floor edge and tyre wake.'],
  inlets: ['Entrées d’air des pontons', 'Sidepod inlets',
    'Les prises alimentent les échangeurs internes. Seule la géométrie externe est observable ici.',
    'The intakes feed the internal heat exchangers. The external geometry is the feature shown here.',
    'La lèvre sépare le débit capté du débit dévié vers l’extérieur. Le débit de refroidissement dépend du circuit complet et de ses pertes de charge.',
    'The inlet lip divides captured flow from external flow. Cooling mass flow depends on the full duct system and its pressure losses.'],
  floor: ['Plancher', 'Floor',
    'Les canaux sous la voiture permettent d’abaisser la pression dans le soubassement.',
    'The channels underneath the car allow lower pressure beneath the floor.',
    'Le débit et la pression résultent de la géométrie du canal, du jeu au sol et du diffuseur. Le tangage, le roulis et le lacet modifient ces conditions.',
    'Mass flow and pressure depend on passage geometry, ground clearance and the diffuser. Pitch, roll and yaw affect these conditions.'],
  diffuser: ['Diffuseur', 'Diffuser',
    'La section s’élargit à l’arrière pour ramener progressivement l’écoulement vers la pression extérieure.',
    'The passage widens towards the rear, gradually recovering pressure towards the external flow.',
    'Une expansion excessive peut déstabiliser la couche limite sous gradient de pression adverse et dégrader la récupération de pression.',
    'Too much expansion can cause boundary-layer separation under an adverse pressure gradient and reduce pressure recovery.'],
  cockpit: ['Habitacle et Halo', 'Cockpit and Halo',
    'Le Halo protège le pilote. Le tube et les supports créent aussi une perturbation locale de l’air.',
    'The Halo protects the driver. Its structure and supports also disturb the local airflow.',
    'Le sillage de la structure et celui des rétroviseurs peuvent modifier l’écoulement reçu en aval par la prise d’air et la carrosserie.',
    'The wakes of the structure and mirrors can affect downstream flow reaching the air intake and bodywork.'],
  airbox: ['Prise d’air supérieure', 'Airbox',
    'La prise d’air au-dessus du pilote alimente le groupe propulseur.',
    'The intake above the driver supplies air to the power unit.',
    'La captation dépend de la pression totale disponible et de l’environnement du cockpit. Les conduits internes ne sont pas déduits de l’ouverture visible.',
    'Inlet capture depends on available total pressure and cockpit flow. The visible opening does not establish the internal duct layout.'],
  engineCover: ['Capot moteur', 'Engine cover',
    'Le capot enveloppe les organes internes et laisse sortir l’air chaud de refroidissement.',
    'The cover encloses the internal components and provides outlets for hot cooling air.',
    'Le carénage règle la section externe et le mélange entre les rejets chauds et l’écoulement extérieur, en amont de l’ensemble arrière.',
    'The bodywork sets the outer section and influences mixing between warm cooling outflow and external air upstream of the rear assembly.'],
  rearSuspension: ['Suspension arrière', 'Rear suspension',
    'Les bras raccordent les roues au châssis. Leur cinématique influence la tenue de hauteur du plancher.',
    'The rear links connect the wheels to the chassis. Their kinematics influence floor ride height.',
    'Les bras traversent le champ de vitesse du train arrière. L’influence aérodynamique s’ajoute à l’effet mécanique de la raideur et de la cinématique.',
    'The links cross the rear velocity field. Their aerodynamic influence adds to the mechanical effects of stiffness and kinematics.'],
  rearWing: ['Aileron arrière', 'Rear wing',
    'Les profils créent une force vers le sol sur l’arrière de la voiture.',
    'The profiles create downward force at the rear of the car.',
    'Les pressions sur les profils déterminent la charge arrière. Le sillage et les tourbillons d’extrémité participent à la traînée induite.',
    'Pressure over the profiles determines rear load. The wake and tip vortices contribute to induced drag.'],
  drs: ['Volet DRS', 'DRS flap',
    'L’ouverture du volet réduit la traînée et l’appui de l’aileron arrière.',
    'Opening the flap reduces rear-wing drag and downforce.',
    'L’ouverture modifie la géométrie effective de l’aileron, réduit sa circulation et déplace la balance aérodynamique vers l’avant.',
    'Opening changes the effective rear-wing geometry, reduces circulation and shifts the aerodynamic balance forwards.']
};

const reference = {
  frontWing: [-2.58, .18, .47, -55, 61, 3],
  nose: [-2.22, .48, 0, -64, 62, 3.1],
  frontSuspension: [-1.56, .39, .4, -45, 63, 2.7],
  wheels: [-1.77, .37, .8, -40, 72, 3],
  sidepods: [.18, .5, .49, -37, 66, 3.05],
  inlets: [-.39, .54, .4, -63, 67, 2.75],
  floor: [.12, .11, .32, -10, 149, 4.1],
  diffuser: [2.12, .22, .28, 67, 134, 3.2],
  cockpit: [-.26, .62, 0, 25, 40, 2.6],
  airbox: [.22, .96, 0, -29, 55, 2.8],
  engineCover: [.73, .63, .09, 24, 55, 3.6],
  rearSuspension: [1.53, .39, .4, 48, 58, 2.8],
  rearWing: [2.2, .84, .27, 62, 68, 3.45],
  drs: [2.32, .93, .08, 71, 70, 3.2]
};

const adjusted = {
  W13: { sidepods: [1.4, .52, .39], inlets: [1.03, .57, .3], cockpit: [1.25, .62, 0], drs: [3.91, .94, .08] },
  W14: { sidepods: [.05, .47, .62], inlets: [-.48, .51, .5] },
  W15: { inlets: [-.36, .52, .47], rearWing: [2.19, .82, .27] },
  W16: { inlets: [-.41, .53, .4], rearWing: [2.16, .84, .27] }
};

const pinIds = ['frontWing', 'sidepods', 'cockpit', 'rearWing'];
// Positions relevées par lancer de rayon sur les surfaces des GLB publiés.
const pinPositions = {
  W13: {
    frontWing: [-.817, .205, .496], sidepods: [1.408, .514, .379],
    cockpit: [.996, .798, .239], rearWing: [4.137, .858, .269]
  },
  W14: {
    frontWing: [-2.595, .190, .481], sidepods: [-.088, .572, .803],
    cockpit: [-.409, .788, .304], rearWing: [2.252, .864, .298]
  },
  W15: {
    frontWing: [-2.628, .212, .503], sidepods: [.025, .615, .695],
    cockpit: [-.225, .750, .288], rearWing: [2.299, .892, .298]
  },
  W16: {
    frontWing: [-2.622, .208, .499], sidepods: [.016, .621, .707],
    cockpit: [-.224, .752, .289], rearWing: [2.324, .915, .357]
  }
};

export function setupWorkshop(panel, viewer, controls, viewButtons) {
  const english = document.documentElement.lang.startsWith('en');
  const workshop = controls.querySelector('.car-workshop');
  const catalogue = controls.querySelector('.car-nomenclature');
  const catalogueName = catalogue.querySelector('[data-part-name]');
  const description = catalogue.querySelector('[data-part-description]');
  const article = catalogue.querySelector('[data-part-dossier]');
  const list = catalogue.querySelector('[data-part-list]');
  const level = catalogue.querySelector('[data-part-level]');
  const photo = workshop.querySelector('[data-car-photo]');
  const backdrop = workshop.querySelector('[data-car-backdrop]');
  const urlField = workshop.querySelector('[data-car-url]');
  const status = workshop.querySelector('[data-workshop-status]');
  const lookup = {};
  const format = values => values.map(value => `${value}m`).join(' ');
  const prefix = english ? '/en' : '';
  const car = panel.dataset.car;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const messages = english ? {
    copied: 'Link copied.', copyManually: 'Copy the selected link.',
    exported: 'PNG image exported.', error: 'The PNG export is unavailable in this browser.'
  } : {
    copied: 'Lien copié.', copyManually: 'Copiez le lien sélectionné.',
    exported: 'Image PNG exportée.', error: 'L’export PNG est indisponible dans ce navigateur.'
  };
  const defaults = new URL(location.href).searchParams;
  let selected;
  let first = true;

  function componentDescription() {
    const items = labels[selected];
    if (!items) return;
    const explore = catalogue.querySelector('[data-workshop-explore]');
    if(explore) explore.href = prefix + '/mercedes-' + car.toLowerCase() + '/composants/?piece=' + selected;
    catalogueName.textContent = items[Number(english)];
    description.textContent = items[(level.value === 'engineering' ? 4 : 2) + Number(english)];
    article.href = `${prefix}/ingenierie/${car.toLowerCase()}/#${selected}`;
  }

  function selectComponent(id) {
    selected = id;
    const [x, y, z, azimuth, elevation, radius] = reference[id];
    const target = adjusted[car]?.[id] ?? [car === 'W13' ? x + 1.8 : x, y, z];
    panel.dispatchEvent(new Event('workshop-camera-change'));
    for (const button of viewButtons) button.setAttribute('aria-pressed', 'false');
    viewer.cameraTarget = format(target);
    viewer.cameraOrbit = `${azimuth}deg ${elevation}deg ${radius * (panel.clientWidth < 620 ? 1.27 : 1)}m`;
    viewer.fieldOfView = '28deg';
    if (reduceMotion.matches) viewer.jumpCameraToGoal();
    for (const [key, buttons] of Object.entries(lookup)) {
      for (const button of buttons) button.setAttribute('aria-pressed', String(key === id));
    }
    componentDescription();
  }

  function clearComponent() {
    selected = undefined;
    catalogueName.textContent = '';
    description.textContent = '';
    article.href = `${prefix}/ingenierie/${car.toLowerCase()}/`;
    for (const buttons of Object.values(lookup)) {
      for (const button of buttons) button.setAttribute('aria-pressed', 'false');
    }
  }

  for (const [id, names] of Object.entries(labels)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.component = id;
    button.textContent = names[Number(english)];
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => selectComponent(id));
    list.append(button);
    lookup[id] = [button];
    if (!pinIds.includes(id)) continue;
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'car-pin';
    pin.dataset.component = id;
    pin.slot = `hotspot-${id}`;
    pin.dataset.position = format(pinPositions[car][id]);
    pin.dataset.normal = '0m 1m 0m';
    pin.setAttribute('aria-label', names[Number(english)]);
    pin.setAttribute('aria-pressed', 'false');
    pin.textContent = String(pinIds.indexOf(id) + 1);
    pin.title = names[Number(english)];
    pin.addEventListener('click', () => selectComponent(id));
    viewer.append(pin);
    lookup[id].push(pin);
  }

  catalogue.addEventListener('toggle', () => panel.classList.toggle('car-pins-on', catalogue.open));
  level.addEventListener('change', componentDescription);
  backdrop.addEventListener('change', () => panel.dataset.backdrop = backdrop.value);
  for (const button of viewButtons) button.addEventListener('click', clearComponent);
  controls.querySelector('[data-reset-camera]')?.addEventListener('click', clearComponent);

  function restore() {
    if (!first) return;
    first = false;
    for (const [name, field] of [['lumiere', '.car-light'], ['matiere', '.car-surface']]) {
      const value = defaults.get(name);
      const choice = [...controls.querySelectorAll(`${field} input`)].find(input => input.value === value);
      if (choice) {
        choice.checked = true;
        choice.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const drs = controls.querySelector('.w13-drs input');
    const opening = defaults.get('drs');
    if (opening && /^\d{1,2}$/.test(opening) && Number(opening) <= Number(drs.max)) {
      drs.value = opening;
      drs.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const background = defaults.get('fond');
    if ([...backdrop.options].some(option => option.value === background)) {
      backdrop.value = background;
      panel.dataset.backdrop = background;
    }
    const part = defaults.get('piece');
    if (Object.hasOwn(labels, part)) {
      catalogue.open = true;
      selectComponent(part);
    }
    if (restoreCamera(viewer, defaults)) panel.dispatchEvent(new Event('workshop-camera-change'));
  }

  photo.addEventListener('click', async () => {
    if (!viewer.loaded || photo.disabled) return;
    const picker = panel.querySelector('#car-driver');
    if (picker) picker.disabled = true;
    photo.disabled = true;
    try {
      const suffix = panel.dataset.driver ? `-${panel.dataset.driver}` : '';
      const dimensions = await exportPhoto(viewer, `Mercedes-AMG-${car}${suffix}`, backdrop.value);
      status.textContent = `${messages.exported} ${dimensions} px`;
    } catch {
      status.textContent = messages.error;
    } finally {
      if (picker) picker.disabled = false;
      photo.disabled = false;
    }
  });

  workshop.querySelector('[data-car-share]').addEventListener('click', () => {
    const url = new URL(location.pathname, location.origin);
    for (const [name, value] of Object.entries({
      pilote: panel.dataset.driver, lumiere: panel.dataset.light,
      matiere: panel.dataset.surface, drs: controls.querySelector('.w13-drs input').value,
      fond: backdrop.value, piece: selected
    })) if (value != null) url.searchParams.set(name, value);
    url.hash = panel.id;
    saveCamera(viewer, url.searchParams);
    shareView(url, urlField, status, messages);
  });

  restore();
  workshop.hidden = false;
  catalogue.hidden = false;
  viewer.addEventListener('load', clearComponent);
}
