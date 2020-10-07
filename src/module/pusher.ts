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

export function pushPusherMessage(pusher:any, event: string, message: string) {
  pusher.trigger(
    `${PUSHER.channel_prefix}${process.env.PUSHER_CHANNEL_NAME_TWICE}`,
    event,
    {
      "message": message
    },
    () => {}
  );
}
