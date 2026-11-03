// Configuration de l'appli Orvéa. Même projet Firebase que l'appli privée NN Coaching, mais base de données SÉPARÉE : « orvea ».
// (publique par nature : la sécurité est dans les règles de la base, orvea/firestore.rules)
window.FB_CONFIG = {
  apiKey: "AIzaSyDYPeSt5PK69X9XqayHR86PeDqJehDaSfY",
  authDomain: "nn-coaching-bd311.firebaseapp.com",
  projectId: "nn-coaching-bd311",
  storageBucket: "nn-coaching-bd311.firebasestorage.app",
  messagingSenderId: "360502778523",
  appId: "1:360502778523:web:d423f6e358f1b583ba843e"
};
window.OV_BASE = "orvea";
window.COACH_EMAIL = "";          // pas d'espace coach : l'appli est autonome
window.NN_IA_ACTIF = true;        // coach IA (fonctions serveur du dossier functions-orvea)
/* Firestore (SDK compat) sur la base nommée « orvea » : le SDK compat n'a pas d'option pour ça,
   on prend l'instance modulaire de cette base et on l'enveloppe dans l'objet compat. */
window.OV_DB = function(){
  const app = firebase.app(), base = window.OV_BASE;
  if (!base || base === "(default)") return firebase.firestore();
  const modulaire = app._delegate.container.getProvider("firestore").getImmediate({identifier: base});
  return new firebase.firestore.Firestore(app, modulaire);
};
