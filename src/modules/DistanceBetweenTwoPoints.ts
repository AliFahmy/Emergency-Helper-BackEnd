import ILocation from './../interfaces/ILocation';
export const arePointsNear = (
  checkPoint: ILocation,
  centerPoint: ILocation
) => {
  var ky = 40000 / 360;
  var kx = Math.cos((Math.PI * centerPoint.coordinates[1]) / 180.0) * ky;
  var dx =
    Math.abs(centerPoint.coordinates[0] - checkPoint.coordinates[0]) * kx;
  var dy =
    Math.abs(centerPoint.coordinates[1] - checkPoint.coordinates[1]) * ky;
  return Math.sqrt(dx * dx + dy * dy);
};
