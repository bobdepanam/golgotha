// Thème du site : dark par défaut ; seul un choix explicite (bouton du header) est
// enregistré, puis reste prioritaire. Module partagé serveur / client.

/** Clé de la préférence explicite (l'ancienne clé `theme` était écrite automatiquement à chaque visite). */
export const THEME_STORAGE_KEY = 'golgotha:theme';

/** Script inline du layout : applique la préférence enregistrée avant le premier affichage (aucun flash). */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='light'){var h=document.documentElement;h.classList.remove('dark');h.classList.add('light')}}catch(e){}`;
