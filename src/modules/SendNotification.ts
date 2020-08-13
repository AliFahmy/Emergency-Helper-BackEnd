import { Expo } from 'expo-server-sdk';
const expo = new Expo();

export const SendNotfication = async (
  title: string,
  body: any,
  data: any,
  pushToken: string
): Promise<boolean> => {
  return new Promise<boolean>(async (resolve, reject) => {
    let notifications = [];
    if (!Expo.isExpoPushToken(pushToken)) {
      reject(`Push token ${pushToken} is not a valid Expo push token`);
    }
    notifications.push({
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    });

    let chunks = expo.chunkPushNotifications(notifications);
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        reject(error);
      }
    }
    resolve(true);
  });
};
