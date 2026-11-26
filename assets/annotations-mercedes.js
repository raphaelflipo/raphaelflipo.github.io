const gp22 = ['https://www.motorsport.com/f1/news/bahrain-gp-f1-technical-photos/9112692/', 'Motorsport · Bahreïn 2022'];
const test22 = ['https://www.motorsport.com/f1/news/bahrain-f1-2022-testing-latest-technical-images-from-the-pits/8877642/', 'Motorsport · Essais de Bahreïn'];
const wing22 = ['https://au.motorsport.com/f1/news/bahrain-f1-2022-testing-latest-technical-images-from-the-pits/8877644/', 'Motorsport · Comparaison des ailerons'];
const pod22 = ['https://www.formula1.com/en/latest/article/analysis-a-first-look-at-mercedes-astonishing-new-update-for-the-official.3BKri90fPodxyRfiY2Xayl', 'Formula 1 · Pontons de la W13'];
const race22 = ['https://www.mercedesamgf1.com/news/lewis-finishes-bahrain-grand-prix-in-p3-george-p4', 'Mercedes · Grand Prix 2022'];
const fia23 = ['https://www.fia.com/sites/default/files/07_mco_car_presentation_submissions.pdf', 'FIA · Évolutions de Monaco 2023'];
const gp23 = ['https://www.motorsport.com/f1/news/monaco-gp-f1-technical-images-explained/10473521/', 'Motorsport · Monaco 2023'];
const front23 = ['https://www.formula1.com/en/latest/article/tech-tuesday-the-intriguing-design-details-behind-mercedes-major-w14-upgrade.5eTDAzSewyhT5HM7pejqDf', 'Formula 1 · Suspension à Monaco'];
const fia24 = ['https://www.fia.com/sites/default/files/decision-document/2024%20Bahrain%20Grand%20Prix%20-%20Car%20Display%20Procedure.pdf', 'FIA · Évolutions de Bahreïn 2024'];
const tech24 = ['https://www.mercedesamgf1.com/f1-w15-2024-technical-specifications', 'Mercedes · Fiche technique W15'];
const gp24 = ['https://www.motorsport.com/f1/news/what-we-learned-about-the-new-f1-car-designs-in-the-bahrain-gp/10583289/', 'Motorsport · Bahreïn 2024'];
const note = ([source, credit], text) => ({ text, source, credit });

export const annotations = {
  w13: {
    nose: note(wing22, 'Sur la version de Bahreïn, les profils centraux remontent au contact de la pointe du nez.'),
    frontWing: note(wing22, 'Le volet supérieur a changé de bord de fuite entre les essais de Barcelone et ceux de Bahreïn. Sélectionne la vue de face pour lire ses courbes près du pneu.'),
    frontSuspension: note(gp22, 'Les triangles rejoignent le porte-moyeu à l’intérieur de la roue avant. Les photos des stands permettent de situer l’ensemble de freinage.'),
    sidepods: note(pod22, 'La carrosserie se resserre fortement de chaque côté du cockpit. Le carénage de la structure d’impact déborde largement du ponton.'),
    inlets: note(pod22, 'Les entrées de radiateur se lisent comme des fentes triangulaires presque verticales.'),
    floor: note(gp22, 'Pour la course, Mercedes présente un nouveau plancher avec un bord central relevé et des cloisons d’entrée révisées.'),
    engineCover: note(test22, 'Les prises de vue arrière montrent la sortie de refroidissement et les panneaux à ouïes sur le capot et les pontons.'),
    diffuser: note(gp22, 'L’extrémité des tunnels s’ouvre derrière le train arrière. Les sections intérieures du modèle sont estimées.'),
    rearWing: note(race22, 'Le volet supérieur s’étend entre les deux dérives. Une vue arrière permet de comparer sa silhouette à celle des versions suivantes.')
  },
  w14: {
    nose: note(gp23, 'Observe le raccord de la pointe avec les profils de l’aileron. La photographie de la voiture dans les stands donne un repère de hauteur.'),
    frontWing: note(gp23, 'La vue de face aide à comparer la courbure des profils et la façon dont leurs extrémités rejoignent les dérives.'),
    frontSuspension: note(front23, 'À Monaco, l’ancrage intérieur du bras avant du triangle supérieur remonte sur le châssis.'),
    sidepods: note(gp23, 'Mercedes élargit les pontons et adopte une rampe qui descend vers le train arrière.'),
    inlets: note(fia23, 'L’entrée d’air haute et large laisse davantage de passage sous le premier volume du ponton.'),
    floor: note(fia23, 'Mercedes déclare une nouvelle cambrure des cloisons à l’avant du fond plat.'),
    engineCover: note(fia23, 'Le capot moteur de la version de Monaco s’élargit avec les pontons.'),
    diffuser: note(fia23, 'La déclaration de Monaco relie la révision des cloisons de plancher à l’écoulement vers le diffuseur. La géométrie interne reste estimée.'),
    rearWing: note(fia23, 'À Monaco, Mercedes modifie la courbure du volet de l’aileron arrière.')
  },
  w15: {
    nose: note(fia24, 'Le profil le plus avancé de l’aileron passe sous la pointe en laissant un espace visible.'),
    frontWing: note(gp24, 'Une bande de carbone très étroite relie la partie intérieure du volet supérieur au nez. La partie externe conserve un profil plus profond.'),
    frontSuspension: note(tech24, 'Des triangles en composite et un poussoir transmettent les mouvements de la roue avant aux ressorts et aux amortisseurs.'),
    sidepods: note(fia24, 'Le volume s’élargit autour de la prise de refroidissement et se resserre à son pied. Observe le passage sous le ponton en trois quarts.'),
    inlets: note(fia24, 'Mercedes déclare une prise d’air triangulaire pour la première course de 2024.'),
    floor: note(fia24, 'Les cloisons d’entrée et les profils de tunnel évoluent. La coupe intérieure visible dans le modèle demeure une reconstruction.'),
    engineCover: note(fia24, 'L’épaulement entre le sommet du capot et son flanc présente un raccord plus doux.'),
    diffuser: note(fia24, 'La révision des tunnels s’accompagne de deux profils redessinés pour l’aileron inférieur qui surplombe le diffuseur.'),
    rearWing: note(fia24, 'À Bahreïn, la découpe à l’extrémité du volet est agrandie et son profil revu.')
  }
};
