import Pusher from 'pusher';
import { PUSHER } from "./const";

const {PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CHANNEL_NAME_TWICE, PUSHER_CLUSTER_TWICE} = process.env;
const pusher = createPusher(PUSHER_APP_ID_TWICE, PUSHER_APP_KEY_TWICE, PUSHER_SECRET_TWICE, PUSHER_CLUSTER_TWICE);

export function createPusher(appId:string, key:string, secret:string, cluster:string) {
  return new Pusher({
    appId,
    key,
    secret,
    cluster
  });
}

export function pushPusherMessage(event: string, message: string) {
  pusher.trigger(
    `${PUSHER.channel_prefix}${PUSHER_CHANNEL_NAME_TWICE}`,
    event,
    {
      "message": message
    },
    () => {}
  );
}
