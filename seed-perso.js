/* Séances perso du coach (haut des pecs, 29/10 → 24/11/2026), créées une seule fois à la connexion du coach si la fiche n'existe pas */
window.SEED_PERSO = {
 "id": "coach-perso",
 "member": {
  "prenom": "Nathanael",
  "objectif": "Rattraper le retard du haut des pecs.",
  "forfait": "1/1 perso : salle réservée pour moi, mardi, jeudi et dimanche à 11h",
  "manual": true,
  "cycle": {
   "nom": "Rattrapage haut des pecs",
   "nb": 12,
   "debut": "2026-10-29",
   "rythme": "3 séances / semaine (mar, jeu, dim à 11h) · 1-2 reps en réserve",
   "phases": [
    {
     "de": 1,
     "a": 6,
     "nom": "Semaines 1-2",
     "focus": "Alterner A (force) et B (volume), banc à 30°. Trouver les charges de travail."
    },
    {
     "de": 7,
     "a": 12,
     "nom": "Semaines 3-4",
     "focus": "Barre : même charge jusqu'au haut de la fourchette, puis +10 kg (un 5 kg de chaque côté)."
    }
   ]
  }
 },
 "seances": {
  "s01": {
   "num": 1,
   "titre": "1/1 perso · Haut des pecs A · force",
   "lieu": "Salle",
   "visible": true,
   "semaine": 1,
   "date": "2026-10-29",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "30 kg x 8, puis 45 kg x 5",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Force haut des pecs",
     "tours": "repos 2-3 min",
     "exos": [
      {
       "n": "Développé incliné barre (banc 30° dans le rack)",
       "d": "4 x 6-10 · 60 kg",
       "v": "",
       "c": "Règle les sécurités du rack juste sous la poitrine. Omoplates serrées et basses, barre vers le haut de la poitrine, descente en 2-3 s.\nProgression avec tes disques (+10 kg mini) : garde la même charge et ajoute des reps jusqu'à 4 x 10, puis +10 kg (un 5 kg de chaque côté) et repars à 4 x 6."
      },
      {
       "n": "Développé incliné haltères (30-45°)",
       "d": "3 x 8-10 · 24-26 kg / main",
       "v": "",
       "c": ""
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75-90 s",
     "exos": [
      {
       "n": "Écarté élastique du bas vers le haut",
       "d": "3 x 12-15 · élastique moyen",
       "v": "",
       "c": "Élastique accroché en bas du rack (ou sous les pieds). Bras légèrement fléchis, mains qui remontent jusqu'au niveau des yeux, serrer 1 s en haut."
      },
      {
       "n": "Pompes pieds surélevés sur le banc",
       "d": "3 x max · poids du corps",
       "v": "",
       "c": "Plus dur : pieds sur la Swiss ball."
      }
     ]
    }
   ]
  },
  "s02": {
   "num": 2,
   "titre": "1/1 perso · Haut des pecs B · volume",
   "lieu": "Salle",
   "visible": true,
   "semaine": 1,
   "date": "2026-11-01",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "12 kg x 10, puis 20 kg x 6 / main",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Volume haut des pecs",
     "tours": "repos 2 min",
     "exos": [
      {
       "n": "Développé incliné haltères (30°)",
       "d": "4 x 8-10 · 26-28 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Développé incliné barre, tempo lent (3 s de descente, 1 s de pause)",
       "d": "3 x 8-12 · 50 kg",
       "v": "",
       "c": "Charge plus légère que la séance A, sécurités du rack en place.\nProgression : même charge jusqu'à 3 x 12, puis +10 kg et repars à 3 x 8."
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75 s",
     "exos": [
      {
       "n": "Écarté incliné haltères",
       "d": "3 x 12 · 12-14 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Squeeze press incliné (haltères collés l'un contre l'autre)",
       "d": "3 x 12 · 16-18 kg / main",
       "v": "",
       "c": "Pousse les haltères l'un contre l'autre pendant toute la série."
      }
     ]
    }
   ]
  },
  "s03": {
   "num": 3,
   "titre": "1/1 perso · Haut des pecs A · force",
   "lieu": "Salle",
   "visible": true,
   "semaine": 1,
   "date": "2026-11-03",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "30 kg x 8, puis 45 kg x 5",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Force haut des pecs",
     "tours": "repos 2-3 min",
     "exos": [
      {
       "n": "Développé incliné barre (banc 30° dans le rack)",
       "d": "4 x 6-10 · 60 kg",
       "v": "",
       "c": "Règle les sécurités du rack juste sous la poitrine. Omoplates serrées et basses, barre vers le haut de la poitrine, descente en 2-3 s.\nProgression avec tes disques (+10 kg mini) : garde la même charge et ajoute des reps jusqu'à 4 x 10, puis +10 kg (un 5 kg de chaque côté) et repars à 4 x 6."
      },
      {
       "n": "Développé incliné haltères (30-45°)",
       "d": "3 x 8-10 · 24-26 kg / main",
       "v": "",
       "c": ""
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75-90 s",
     "exos": [
      {
       "n": "Écarté élastique du bas vers le haut",
       "d": "3 x 12-15 · élastique moyen",
       "v": "",
       "c": "Élastique accroché en bas du rack (ou sous les pieds). Bras légèrement fléchis, mains qui remontent jusqu'au niveau des yeux, serrer 1 s en haut."
      },
      {
       "n": "Pompes pieds surélevés sur le banc",
       "d": "3 x max · poids du corps",
       "v": "",
       "c": "Plus dur : pieds sur la Swiss ball."
      }
     ]
    }
   ]
  },
  "s04": {
   "num": 4,
   "titre": "1/1 perso · Haut des pecs B · volume",
   "lieu": "Salle",
   "visible": true,
   "semaine": 2,
   "date": "2026-11-05",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "12 kg x 10, puis 20 kg x 6 / main",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Volume haut des pecs",
     "tours": "repos 2 min",
     "exos": [
      {
       "n": "Développé incliné haltères (30°)",
       "d": "4 x 8-10 · 26-28 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Développé incliné barre, tempo lent (3 s de descente, 1 s de pause)",
       "d": "3 x 8-12 · 50 kg",
       "v": "",
       "c": "Charge plus légère que la séance A, sécurités du rack en place.\nProgression : même charge jusqu'à 3 x 12, puis +10 kg et repars à 3 x 8."
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75 s",
     "exos": [
      {
       "n": "Écarté incliné haltères",
       "d": "3 x 12 · 12-14 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Squeeze press incliné (haltères collés l'un contre l'autre)",
       "d": "3 x 12 · 16-18 kg / main",
       "v": "",
       "c": "Pousse les haltères l'un contre l'autre pendant toute la série."
      }
     ]
    }
   ]
  },
  "s05": {
   "num": 5,
   "titre": "1/1 perso · Haut des pecs A · force",
   "lieu": "Salle",
   "visible": true,
   "semaine": 2,
   "date": "2026-11-08",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "30 kg x 8, puis 45 kg x 5",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Force haut des pecs",
     "tours": "repos 2-3 min",
     "exos": [
      {
       "n": "Développé incliné barre (banc 30° dans le rack)",
       "d": "4 x 6-10 · 60 kg",
       "v": "",
       "c": "Règle les sécurités du rack juste sous la poitrine. Omoplates serrées et basses, barre vers le haut de la poitrine, descente en 2-3 s.\nProgression avec tes disques (+10 kg mini) : garde la même charge et ajoute des reps jusqu'à 4 x 10, puis +10 kg (un 5 kg de chaque côté) et repars à 4 x 6."
      },
      {
       "n": "Développé incliné haltères (30-45°)",
       "d": "3 x 8-10 · 24-26 kg / main",
       "v": "",
       "c": ""
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75-90 s",
     "exos": [
      {
       "n": "Écarté élastique du bas vers le haut",
       "d": "3 x 12-15 · élastique moyen",
       "v": "",
       "c": "Élastique accroché en bas du rack (ou sous les pieds). Bras légèrement fléchis, mains qui remontent jusqu'au niveau des yeux, serrer 1 s en haut."
      },
      {
       "n": "Pompes pieds surélevés sur le banc",
       "d": "3 x max · poids du corps",
       "v": "",
       "c": "Plus dur : pieds sur la Swiss ball."
      }
     ]
    }
   ]
  },
  "s06": {
   "num": 6,
   "titre": "1/1 perso · Haut des pecs B · volume",
   "lieu": "Salle",
   "visible": true,
   "semaine": 2,
   "date": "2026-11-10",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "12 kg x 10, puis 20 kg x 6 / main",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Volume haut des pecs",
     "tours": "repos 2 min",
     "exos": [
      {
       "n": "Développé incliné haltères (30°)",
       "d": "4 x 8-10 · 26-28 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Développé incliné barre, tempo lent (3 s de descente, 1 s de pause)",
       "d": "3 x 8-12 · 50 kg",
       "v": "",
       "c": "Charge plus légère que la séance A, sécurités du rack en place.\nProgression : même charge jusqu'à 3 x 12, puis +10 kg et repars à 3 x 8."
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75 s",
     "exos": [
      {
       "n": "Écarté incliné haltères",
       "d": "3 x 12 · 12-14 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Squeeze press incliné (haltères collés l'un contre l'autre)",
       "d": "3 x 12 · 16-18 kg / main",
       "v": "",
       "c": "Pousse les haltères l'un contre l'autre pendant toute la série."
      }
     ]
    }
   ]
  },
  "s07": {
   "num": 7,
   "titre": "1/1 perso · Haut des pecs A · force",
   "lieu": "Salle",
   "visible": true,
   "semaine": 3,
   "date": "2026-11-12",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "30 kg x 8, puis 45 kg x 5",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Force haut des pecs",
     "tours": "repos 2-3 min",
     "exos": [
      {
       "n": "Développé incliné barre (banc 30° dans le rack)",
       "d": "4 x 6-10 · 60 kg",
       "v": "",
       "c": "Règle les sécurités du rack juste sous la poitrine. Omoplates serrées et basses, barre vers le haut de la poitrine, descente en 2-3 s.\nProgression avec tes disques (+10 kg mini) : garde la même charge et ajoute des reps jusqu'à 4 x 10, puis +10 kg (un 5 kg de chaque côté) et repars à 4 x 6."
      },
      {
       "n": "Développé incliné haltères (30-45°)",
       "d": "3 x 8-10 · 24-26 kg / main",
       "v": "",
       "c": ""
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75-90 s",
     "exos": [
      {
       "n": "Écarté élastique du bas vers le haut",
       "d": "3 x 12-15 · élastique moyen",
       "v": "",
       "c": "Élastique accroché en bas du rack (ou sous les pieds). Bras légèrement fléchis, mains qui remontent jusqu'au niveau des yeux, serrer 1 s en haut."
      },
      {
       "n": "Pompes pieds surélevés sur le banc",
       "d": "3 x max · poids du corps",
       "v": "",
       "c": "Plus dur : pieds sur la Swiss ball."
      }
     ]
    }
   ]
  },
  "s08": {
   "num": 8,
   "titre": "1/1 perso · Haut des pecs B · volume",
   "lieu": "Salle",
   "visible": true,
   "semaine": 3,
   "date": "2026-11-15",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "12 kg x 10, puis 20 kg x 6 / main",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Volume haut des pecs",
     "tours": "repos 2 min",
     "exos": [
      {
       "n": "Développé incliné haltères (30°)",
       "d": "4 x 8-10 · 26-28 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Développé incliné barre, tempo lent (3 s de descente, 1 s de pause)",
       "d": "3 x 8-12 · 50 kg",
       "v": "",
       "c": "Charge plus légère que la séance A, sécurités du rack en place.\nProgression : même charge jusqu'à 3 x 12, puis +10 kg et repars à 3 x 8."
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75 s",
     "exos": [
      {
       "n": "Écarté incliné haltères",
       "d": "3 x 12 · 12-14 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Squeeze press incliné (haltères collés l'un contre l'autre)",
       "d": "3 x 12 · 16-18 kg / main",
       "v": "",
       "c": "Pousse les haltères l'un contre l'autre pendant toute la série."
      }
     ]
    }
   ]
  },
  "s09": {
   "num": 9,
   "titre": "1/1 perso · Haut des pecs A · force",
   "lieu": "Salle",
   "visible": true,
   "semaine": 3,
   "date": "2026-11-17",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "30 kg x 8, puis 45 kg x 5",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Force haut des pecs",
     "tours": "repos 2-3 min",
     "exos": [
      {
       "n": "Développé incliné barre (banc 30° dans le rack)",
       "d": "4 x 6-10 · 60 kg",
       "v": "",
       "c": "Règle les sécurités du rack juste sous la poitrine. Omoplates serrées et basses, barre vers le haut de la poitrine, descente en 2-3 s.\nProgression avec tes disques (+10 kg mini) : garde la même charge et ajoute des reps jusqu'à 4 x 10, puis +10 kg (un 5 kg de chaque côté) et repars à 4 x 6."
      },
      {
       "n": "Développé incliné haltères (30-45°)",
       "d": "3 x 8-10 · 24-26 kg / main",
       "v": "",
       "c": ""
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75-90 s",
     "exos": [
      {
       "n": "Écarté élastique du bas vers le haut",
       "d": "3 x 12-15 · élastique moyen",
       "v": "",
       "c": "Élastique accroché en bas du rack (ou sous les pieds). Bras légèrement fléchis, mains qui remontent jusqu'au niveau des yeux, serrer 1 s en haut."
      },
      {
       "n": "Pompes pieds surélevés sur le banc",
       "d": "3 x max · poids du corps",
       "v": "",
       "c": "Plus dur : pieds sur la Swiss ball."
      }
     ]
    }
   ]
  },
  "s10": {
   "num": 10,
   "titre": "1/1 perso · Haut des pecs B · volume",
   "lieu": "Salle",
   "visible": true,
   "semaine": 4,
   "date": "2026-11-19",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "12 kg x 10, puis 20 kg x 6 / main",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Volume haut des pecs",
     "tours": "repos 2 min",
     "exos": [
      {
       "n": "Développé incliné haltères (30°)",
       "d": "4 x 8-10 · 26-28 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Développé incliné barre, tempo lent (3 s de descente, 1 s de pause)",
       "d": "3 x 8-12 · 50 kg",
       "v": "",
       "c": "Charge plus légère que la séance A, sécurités du rack en place.\nProgression : même charge jusqu'à 3 x 12, puis +10 kg et repars à 3 x 8."
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75 s",
     "exos": [
      {
       "n": "Écarté incliné haltères",
       "d": "3 x 12 · 12-14 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Squeeze press incliné (haltères collés l'un contre l'autre)",
       "d": "3 x 12 · 16-18 kg / main",
       "v": "",
       "c": "Pousse les haltères l'un contre l'autre pendant toute la série."
      }
     ]
    }
   ]
  },
  "s11": {
   "num": 11,
   "titre": "1/1 perso · Haut des pecs A · force",
   "lieu": "Salle",
   "visible": true,
   "semaine": 4,
   "date": "2026-11-22",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "30 kg x 8, puis 45 kg x 5",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Force haut des pecs",
     "tours": "repos 2-3 min",
     "exos": [
      {
       "n": "Développé incliné barre (banc 30° dans le rack)",
       "d": "4 x 6-10 · 60 kg",
       "v": "",
       "c": "Règle les sécurités du rack juste sous la poitrine. Omoplates serrées et basses, barre vers le haut de la poitrine, descente en 2-3 s.\nProgression avec tes disques (+10 kg mini) : garde la même charge et ajoute des reps jusqu'à 4 x 10, puis +10 kg (un 5 kg de chaque côté) et repars à 4 x 6."
      },
      {
       "n": "Développé incliné haltères (30-45°)",
       "d": "3 x 8-10 · 24-26 kg / main",
       "v": "",
       "c": ""
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75-90 s",
     "exos": [
      {
       "n": "Écarté élastique du bas vers le haut",
       "d": "3 x 12-15 · élastique moyen",
       "v": "",
       "c": "Élastique accroché en bas du rack (ou sous les pieds). Bras légèrement fléchis, mains qui remontent jusqu'au niveau des yeux, serrer 1 s en haut."
      },
      {
       "n": "Pompes pieds surélevés sur le banc",
       "d": "3 x max · poids du corps",
       "v": "",
       "c": "Plus dur : pieds sur la Swiss ball."
      }
     ]
    }
   ]
  },
  "s12": {
   "num": 12,
   "titre": "1/1 perso · Haut des pecs B · volume",
   "lieu": "Salle",
   "visible": true,
   "semaine": 4,
   "date": "2026-11-24",
   "heure": "11:00",
   "statut": "prevue",
   "blocs": [
    {
     "code": "A1",
     "nom": "Échauffement",
     "tours": "10 min",
     "exos": [
      {
       "n": "Mobilité sur le tapis (cercles de bras, chat-vache, ouvertures thoraciques)",
       "d": "5 min",
       "v": "",
       "c": ""
      },
      {
       "n": "Rotations externes à l'élastique",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Écarté élastique (pull-apart)",
       "d": "2 x 15",
       "v": "",
       "c": ""
      },
      {
       "n": "Séries légères du 1er exercice",
       "d": "12 kg x 10, puis 20 kg x 6 / main",
       "v": "",
       "c": "Charges indicatives, calculées à partir de 100 kg au développé couché. Sur la 1re séance, si la dernière série passe avec plus de 3 reps en réserve, monte d'un cran ; si tu n'atteins pas le bas de la fourchette, baisse."
      }
     ]
    },
    {
     "code": "B1",
     "nom": "Volume haut des pecs",
     "tours": "repos 2 min",
     "exos": [
      {
       "n": "Développé incliné haltères (30°)",
       "d": "4 x 8-10 · 26-28 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Développé incliné barre, tempo lent (3 s de descente, 1 s de pause)",
       "d": "3 x 8-12 · 50 kg",
       "v": "",
       "c": "Charge plus légère que la séance A, sécurités du rack en place.\nProgression : même charge jusqu'à 3 x 12, puis +10 kg et repars à 3 x 8."
      }
     ]
    },
    {
     "code": "B2",
     "nom": "Isolation",
     "tours": "repos 75 s",
     "exos": [
      {
       "n": "Écarté incliné haltères",
       "d": "3 x 12 · 12-14 kg / main",
       "v": "",
       "c": ""
      },
      {
       "n": "Squeeze press incliné (haltères collés l'un contre l'autre)",
       "d": "3 x 12 · 16-18 kg / main",
       "v": "",
       "c": "Pousse les haltères l'un contre l'autre pendant toute la série."
      }
     ]
    }
   ]
  }
 }
};
