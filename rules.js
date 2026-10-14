// Rule text is verbatim from NLF. English is our translation, not official.
// Update this file (only) when NLF publishes a new revision. See rules/README.md.

export const RULES = {
  handbook: {
    name: 'Modellflyhåndboka',
    version: '2.2',
    validFrom: '2025-06-01',
    url: 'https://nlf.no/siteassets/modellfly/sikkerhet-og-utdanning/modellflyhandboka/modellflyhandboka/modellflyhandboka-v-2.2---01.06-2025.pdf',
  },
  checklist: {
    name: 'Vedlegg H – Sjekkliste FPV uten utkikksperson',
    version: '1.0',
    validFrom: '2019-10-16',
    url: 'https://nlf.no/siteassets/modellfly/sikkerhet-og-utdanning/modellflyhandboka/modellflyhandboka/vedlegg-h---sjekkliste-fpv-uten-utkikksperson-v1.0.pdf',
    intro: {
      nb: 'Hvis alle sjekkpunkter kan besvares med JA innebærer det en akseptabel grad av risiko ved flyging i førstepersonsperspektiv (FPV) uten utkikksperson dersom flygingen foregår utenfor etablert modellflyplass. Sjekklisten skal medbringes ved flyging, og fylles ut av piloten før flyging finner sted.',
      en: 'If every item can be answered YES, solo FPV outside an established model airfield carries an acceptable level of risk. The checklist must be brought along and filled out by the pilot before flying.',
    },
  },
  // hint: which contextual helper the UI shows under the item
  items: [
    { n: 1, hint: 'area',
      nb: 'Er hele flyområdet egnet til FPV-flyging uten utkikksperson, med hensyn til 3. parts og annen lufttrafikks sikkerhet?',
      en: 'Is the whole flying area suitable for solo FPV, with regard to the safety of third parties and other air traffic?' },
    { n: 2, hint: 'traffic',
      nb: 'Har du gjort deg kjent med og tar hensyn til potensiell lufttrafikk i området?',
      en: 'Have you familiarised yourself with, and do you account for, potential air traffic in the area?' },
    { n: 3, hint: 'people',
      nb: 'Vil all flyging foregå utenfor bebodd område, og unngå områder hvor det kan oppholde seg andre mennesker?',
      en: 'Will all flying take place outside populated areas, avoiding areas where other people may be present?' },
    { n: 4, hint: 'distance',
      nb: 'Vil all flyging foregå mer enn 50 meter unna kjøretøy, bygning eller personer som ikke er under modellflygers kontroll, med unntak av under start og landing?',
      en: 'Will all flying stay more than 50 m from vehicles, buildings or people not under the pilot’s control, except during takeoff and landing?' },
    { n: 5, hint: 'airport',
      nb: 'Er det minst 5 km til nærmeste lufthavn, og vil all flyging foregå utenfor kontrollert luftrom, med mindre annet er avtalt med lufttrafikktjenesten?',
      en: 'Is it at least 5 km to the nearest airport, and will all flying stay outside controlled airspace unless agreed with air traffic services?' },
    { n: 6, hint: 'permitted',
      nb: 'Er det tillatt å fly der?',
      en: 'Is flying permitted there?' },
    { n: 7, hint: 'height',
      nb: 'Vil all flyging foregå lavere enn 120 meter over terrenget?',
      en: 'Will all flying stay below 120 m above terrain?' },
    { n: 8, hint: 'weight',
      nb: 'Veier modellen maksimalt 1 kg, inkludert batteri?',
      en: 'Does the model weigh at most 1 kg, including battery?' },
    { n: 9, hint: 'failsafe',
      nb: 'Er failsafe programmert slik at energien i modellen reduseres ved evt. tap av kontroll, eksempelvis ved at propellen stopper?',
      en: 'Is failsafe programmed so the model’s energy is reduced on loss of control, e.g. by stopping the propellers?' },
    { n: 10, hint: 'strobe',
      nb: 'Er strobelys montert og aktivert?',
      en: 'Is a strobe light mounted and switched on?' },
  ],
  // §3.6.2 requirements that are not phrased as checklist questions
  soloRequirements: {
    nb: [
      'Modellflyet skal kunne kontrolleres manuelt.',
      'Blink/strobelys: hvitt, minst 10 candela, minimum 20 blink i minuttet.',
      'Maksimal tillatt vekt på modellflyet er 1 kg.',
    ],
    en: [
      'The model must be manually controllable.',
      'Strobe: white, at least 10 candela, at least 20 flashes per minute.',
      'Maximum model weight is 1 kg.',
    ],
  },
  recommendation: {
    nb: 'Modellfly som ikke er konstruert for å gi minst mulig skade (propellbeskyttere, energiabsorberende materiale) bør holde hastigheten under 19 m/s (ca. 70 km/t).',
    en: 'Models not built to minimise impact damage (prop guards, energy-absorbing materials) should stay below 19 m/s (~70 km/h).',
  },
  spotter: {
    rule: {
      nb: 'Flyging med modellfly i førstepersonsperspektiv er tillatt hvis den som fører modellflyet har bistand fra en utkikksperson, og modellflyet til enhver tid er godt synlig for utkikkspersonen og denne er i kontakt med modellflyger.',
      en: 'FPV is permitted when the pilot is assisted by a spotter, the model is clearly visible to the spotter at all times, and the spotter is in contact with the pilot.',
    },
    // Our own reminder list derived from §3.6.2 / §3.4.3 — not an official form.
    items: [
      { n: 1, nb: 'Utkikkspersonen ser modellen godt hele tiden.', en: 'The spotter can clearly see the model at all times.' },
      { n: 2, nb: 'Utkikkspersonen er i kontakt med piloten.', en: 'The spotter is in contact with the pilot.' },
      { n: 3, nb: 'Tilstrekkelig avstand til personer og faste objekter.', en: 'Sufficient distance to people and fixed objects.' },
      { n: 4, nb: 'Minst 5 km til lufthavn, med mindre annet er avtalt med lufttrafikktjenesten.', en: 'At least 5 km from airports unless agreed with air traffic services.' },
      { n: 5, nb: 'Verneområder sjekket (kart.naturbase.no).', en: 'Protected areas checked (kart.naturbase.no).' },
    ],
  },
  night: {
    nb: 'Utenom dagslysperioden skal modellflyet være påmontert lys eller være belyst, slik at det til enhver tid er godt synlig for modellflyger, og ikke flys høyere enn 120 m over terrenget (med mindre lysene møter SERA.3215).',
    en: 'Outside daylight the model must carry lights or be lit so the pilot can see it at all times, and stay below 120 m (unless lights meet SERA.3215).',
  },
  pending: {
    nb: 'Krav om bestått teoriprøve (M-FPV) for FPV uten utkikksperson er varslet «i nær fremtid». Prøven tas i TMS → Teoriprøver.',
    en: 'A passed theory test (M-FPV) for solo FPV has been announced for “the near future”. The test is taken in TMS → Teoriprøver.',
    url: 'https://nlf.no/Nyhetsvisning/2026/ta-teoriprove-for-fpv-i-dag-sa-er-du-klar-nar-kravet-kommer/',
  },
  links: {
    naturbase: 'https://kart.naturbase.no/',
    nsm: 'https://nsm.geodataonline.no/sensorapp/',
    fire: 'https://skogbrannfare.met.no/',
    avinorDrone: 'https://www.avinor.no/praktisk-info/drone/',
  },
};
