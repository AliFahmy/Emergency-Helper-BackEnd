import IRequestOffer from './../interfaces/request/IRequestOffer';
export const time = 60000;
export function checkOfferTime(offer: IRequestOffer): boolean {
  if (timeLeft(offer) > 0) {
    return true;
  }
  return false;
}

export function timeLeft(offer: IRequestOffer): number {
  return time - (new Date().getTime() - new Date(offer.createdAt).getTime());
}
