// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,                             // Flag que habilita/deshabilita debugging
  apiUrl: 'https://copper-mobil-app.onrender.com/api', // URL base del backend
  pusherKey: '5bdb901f27232e86c93c',             // Clave pública de Pusher
  pusherCluster: 'us2' 
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
