import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'XR BUILDERS — Immersive XR Solutions & VR Welding Simulator',
    loadComponent: () =>
      import('./xr-builder/xr-builder.component').then((m) => m.XrBuilderComponent),
  },
  {
    path: 'vr-welding-simulator',
    title: 'VR Welding Simulator — Naveen Kumar S',
    loadComponent: () =>
      import('./vr-welding-simulator/vr-welding-simulator.component').then(
        (m) => m.VrWeldingSimulatorComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
