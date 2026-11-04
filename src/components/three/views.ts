import type { Dictionary } from "@/lib/i18n";

export type ViewId = keyof Dictionary["model3d"]["views"];

export interface CameraView {
  id: ViewId;
  position: [number, number, number];
  target: [number, number, number];
}

/** Camera presets from design/Site3D.dc.html. */
export const CAMERA_VIEWS: ReadonlyArray<CameraView> = [
  { id: "overview", position: [170, 135, 190], target: [4, 6, -4] },
  { id: "columns", position: [92, 34, 34], target: [40, 8, -30] },
  { id: "tanks", position: [-10, 55, 50], target: [-25, 6, -28] },
  { id: "air", position: [34, 22, 82], target: [11, 4, 46] },
  { id: "fire", position: [126, 20, 74], target: [103, 4, 38] },
  { id: "flare", position: [128, 40, 4], target: [104, 26, -47] },
];

export const HOME_VIEW = CAMERA_VIEWS[0];
