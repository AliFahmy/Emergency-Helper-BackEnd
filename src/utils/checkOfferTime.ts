import IRequestOffer from './../interfaces/request/IRequestOffer';
const time = 300000;
export function checkOfferTime(offer: IRequestOffer): boolean {
  if (
    time -
      Math.abs(new Date().getTime() - new Date(offer.createdAt).getTime()) >
    0
  ) {
    console.log('true');
    return true;
  }
  console.log('false');
  return false;
}

export function timeLeft(offer: IRequestOffer): number {
  return (
    time - Math.abs(new Date().getTime() - new Date(offer.createdAt).getTime())
  );
}
