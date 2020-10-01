import Pusher from 'pusher';
import { PUSHER } from "./const";

export function createPusher(appId:string, key:string, secret:string, cluster:string) {
  return new Pusher({
    appId,
    key,
    secret,
    cluster
  });
}
