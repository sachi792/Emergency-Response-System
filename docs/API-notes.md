# Maps and mobile app integration

## Map services

The dispatcher map uses public OpenStreetMap raster tiles and the public OSRM routing demo endpoint. It needs no API key. The map shows emergency and ambulance records that include numeric `latitude` and `longitude` fields. If an assigned ambulance has coordinates, OSRM draws a road route and reports its distance and modelled duration.

The Android app opens OpenStreetMap directions for navigation. Android and the existing browser ambulance page publish GPS coordinates to the ambulance document; patient requests save GPS coordinates with the emergency record. The patient request form also accepts corrected decimal latitude/longitude.

OSM tiles are donation-funded, best effort, and have no service-level guarantee. Keep visible attribution, allow the browser to cache tiles, and request only tiles in the current viewport. The OSRM demo is for prototype use and does not account for live traffic or emergency vehicle conditions. Its ETA is a route estimate, not a response-time guarantee. For a deployed or high-volume system, choose a hosted map/routing provider with an explicit service plan or host the services yourself. See the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/) and [OSRM API documentation](https://project-osrm.org/docs/v5.24.0/api/).

## Firestore data contract

`emergency_requests` records keep the existing fields (`callerName`, `contactNumber`, `emergencyType`, `patientCount`, `address`, `priority`, `description`, `status`, `assignedAmbulanceId`, timestamps). Mobile requests additionally set `callerUid`, `latitude`, and `longitude`.

`ambulances` records keep the existing fields (`vehicleNumber`, `driverName`, `contactNumber`, `status`, `assignedEmergencyId`). Mobile driver accounts must be linked by an administrator with `driverUid` set to the Firebase Authentication UID. Driver location updates set `latitude`, `longitude`, and `locationUpdatedAt`.

The Android app checks `users/{uid}.role` after sign-in. Patient accounts created in the app receive `role: PATIENT`, `status: ACTIVE`, and basic profile fields. Driver accounts and ambulance links must be created by an administrator; choosing Driver on the sign-in screen does not grant that role.

## Android setup

1. In Firebase Console for `emergencyresponsesystem-8686b`, enable Email/Password under Authentication.
2. Add an Android app with package name `org.emergencyresponse.mobile` to that Firebase project. Replace the Android `FirebaseOptions.applicationId` in `android/app/src/main/java/org/emergencyresponse/mobile/MainActivity.kt` with the app ID from its `google-services.json` (`mobilesdk_app_id`). The existing web API key, project ID, and sender ID are already filled in.
3. Create driver Firebase Auth accounts and `users/{uid}` role profiles with `role: DRIVER`, then set the linked ambulance document's `driverUid` to that UID.
4. Open the `android` directory in Android Studio and let Gradle sync/download the declared dependencies. Grant location permission on the device. Location is shared while the app is open and the driver is signed in.

The app uses the existing Firebase project and collections; no separate backend service or paid map key is required for this prototype.
