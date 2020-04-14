export default class Response {
  private message: string;
  private payload: any;
  constructor( message?: string, payload?: any,) {
    this.message = message;
    this.payload = payload;
  }
  public getData() {
    return {
      message: this.message,
      payload: this.payload,
    }
  }
}