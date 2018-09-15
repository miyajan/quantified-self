import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';
import Timestamp = admin.firestore.Timestamp;

admin.initializeApp();
const db = admin.firestore();
const settings = {timestampsInSnapshots: true};
db.settings(settings);

export const collectNatureRemoEvents = functions.https.onRequest(async (request, response) => {
  const token = functions.config().natureremo.token;
  let devices;
  try {
    devices = await fetch('https://api.nature.global/1/devices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }).then(resp => {
      return resp.json()
    });
  } catch (error) {
    console.error(`Error getting devices: ${error}`);
    response.sendStatus(500);
    return;
  }

  // I have only one device now
  const device = devices[0];

  let document;
  try {
    document = await db.collection('nature-remo-events').add({
      "createdAt": Timestamp.now(),
      "temperature": device.newest_events.te.val,
      "humidity": device.newest_events.hu.val,
      "illumination": device.newest_events.il.val
    });
  } catch (error) {
    console.error(`Error adding document: ${error}`);
    console.error(`devices: ${devices}`);
    response.sendStatus(500);
    return;
  }

  console.log(`Document written with ID: ${document.id}`);
  response.sendStatus(200);
});
