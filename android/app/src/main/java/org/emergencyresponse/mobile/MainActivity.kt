package org.emergencyresponse.mobile

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.delay

private val db by lazy { FirebaseFirestore.getInstance() }
private val auth by lazy { FirebaseAuth.getInstance() }
private val red = Color(0xFFB42318)

class MainActivity : ComponentActivity() {
    private var locationPermission by mutableStateOf(false)
    private val permissionRequest = registerForActivityResult(ActivityResultContracts.RequestPermission()) { locationPermission = it }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (FirebaseApp.getApps(this).isEmpty()) {
            val options = FirebaseOptions.Builder().setApiKey("AIzaSyApnOocMKxam0h02OqqxOgEIgI1Jjzx5r8")
                .setApplicationId("1:626095788579:android:mobileprototype")
                .setProjectId("emergencyresponsesystem-8686b").setGcmSenderId("626095788579").build()
            FirebaseApp.initializeApp(this, options)
        }
        locationPermission = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        setContent {
            var dark by remember { mutableStateOf(false) }
            MaterialTheme(colorScheme = if (dark) darkColorScheme(primary = Color(0xFFFF6B61)) else lightColorScheme(primary = red)) {
                Surface(Modifier.fillMaxSize()) {
                    MobileApp(locationPermission, { permissionRequest.launch(Manifest.permission.ACCESS_FINE_LOCATION) },
                        { dark = !dark }, dark, { openMap(it) })
                }
            }
        }
    }
    private fun openMap(destination: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.openstreetmap.org/directions?to=$destination"))
        startActivity(intent)
    }
}

@Composable
private fun MobileApp(hasLocation: Boolean, requestLocation: () -> Unit, toggleTheme: () -> Unit, dark: Boolean, navigate: (String) -> Unit) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    var role by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var registering by remember { mutableStateOf(false) }
    var fullName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var emergencyContact by remember { mutableStateOf("") }
    var error by remember { mutableStateOf("") }
    var userRole by remember { mutableStateOf("") }
    var profileName by remember { mutableStateOf("") }
    var profilePhone by remember { mutableStateOf("") }
    var emergency by remember { mutableStateOf<Map<String, Any>?>(null) }
    var assignedAmbulance by remember { mutableStateOf<Map<String, Any>?>(null) }
    var emergencyId by remember { mutableStateOf("") }
    var ambulance by remember { mutableStateOf<Map<String, Any>?>(null) }
    var ambulanceId by remember { mutableStateOf("") }
    var location by remember { mutableStateOf<Pair<Double, Double>?>(null) }
    var locationInput by remember { mutableStateOf("") }
    var emergencyType by remember { mutableStateOf("ACCIDENT") }
    var patientCount by remember { mutableIntStateOf(1) }
    var loading by remember { mutableStateOf(false) }
    var toast by remember { mutableStateOf("") }

    LaunchedEffect(hasLocation) {
        if (hasLocation) runCatching { LocationServices.getFusedLocationProviderClient(context).lastLocation.await() }
            .getOrNull()?.let { location = it.latitude to it.longitude; locationInput = "${it.latitude}, ${it.longitude}" }
    }
    LaunchedEffect(auth.currentUser?.uid) {
        val uid = auth.currentUser?.uid ?: return@LaunchedEffect
        val profile = runCatching { db.collection("users").document(uid).get().await() }.getOrNull()
        userRole = profile?.getString("role")?.uppercase().orEmpty()
        profileName = profile?.getString("fullName").orEmpty()
        profilePhone = profile?.getString("phone").orEmpty()
        if (userRole == "PATIENT") {
            db.collection("emergency_requests").whereEqualTo("callerUid", uid).addSnapshotListener { snap, _ ->
                val docs = snap?.documents.orEmpty()
                val current = docs.firstOrNull { it.getString("status") !in listOf("COMPLETED", "CANCELLED") }
                    ?: docs.maxByOrNull { it.getTimestamp("requestedAt")?.toDate()?.time ?: 0L }
                current?.let { emergencyId = it.id; emergency = it.data }
            }
        } else if (userRole == "DRIVER") {
            db.collection("ambulances").whereEqualTo("driverUid", uid).limit(1).addSnapshotListener { snap, _ ->
                snap?.documents?.firstOrNull()?.let { ambulanceId = it.id; ambulance = it.data }
            }
        }
    }
    LaunchedEffect((ambulance?.get("assignedEmergencyId") as? String).orEmpty()) {
        val id = ambulance?.get("assignedEmergencyId") as? String ?: return@LaunchedEffect
        db.collection("emergency_requests").document(id).addSnapshotListener { snap, _ -> emergency = snap?.data; emergencyId = id }
    }
    LaunchedEffect(emergency?.get("assignedAmbulanceId") as? String) {
        val id = emergency?.get("assignedAmbulanceId") as? String ?: return@LaunchedEffect
        db.collection("ambulances").document(id).addSnapshotListener { snap, _ -> assignedAmbulance = snap?.data }
    }
    LaunchedEffect(userRole, ambulanceId, hasLocation) {
        if (userRole != "DRIVER" || ambulanceId.isBlank() || !hasLocation) return@LaunchedEffect
        val client = LocationServices.getFusedLocationProviderClient(context)
        while (true) {
            runCatching {
                val point = client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, CancellationTokenSource().token).await()
                if (point != null) db.collection("ambulances").document(ambulanceId).update(
                    mapOf("latitude" to point.latitude, "longitude" to point.longitude, "locationUpdatedAt" to FieldValue.serverTimestamp())
                ).await()
            }
            delay(15_000)
        }
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(22.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column { Text("EMERGENCY RESPONSE", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary); Text(if (userRole == "DRIVER") "Driver" else "Patient & bystander", style = MaterialTheme.typography.headlineSmall) }
            TextButton(onClick = toggleTheme) { Text(if (dark) "☀ Light" else "☾ Dark") }
        }
        if (auth.currentUser == null) {
            if (role.isEmpty()) {
                Text("Choose your sign-in role. Your account’s saved role will be verified after login.")
                Button(onClick = { role = "PATIENT" }, Modifier.fillMaxWidth()) { Text("👤  Patient / Bystander") }
                Button(onClick = { role = "DRIVER" }, Modifier.fillMaxWidth()) { Text("🚑  Ambulance Driver") }
            } else {
                TextButton(onClick = { role = "" }) { Text("← Change role") }
                if (registering && role == "PATIENT") {
                    OutlinedTextField(fullName, { fullName = it }, Modifier.fillMaxWidth(), label = { Text("Full name") })
                    OutlinedTextField(phone, { phone = it }, Modifier.fillMaxWidth(), label = { Text("Phone number") })
                    OutlinedTextField(emergencyContact, { emergencyContact = it }, Modifier.fillMaxWidth(), label = { Text("Emergency contact (optional)") })
                }
                OutlinedTextField(email, { email = it }, Modifier.fillMaxWidth(), label = { Text("Email") })
                OutlinedTextField(password, { password = it }, Modifier.fillMaxWidth(), label = { Text("Password") })
                Button(enabled = !loading, onClick = { loading = true; scope.launch {
                    try {
                        if (registering) {
                            val result = auth.createUserWithEmailAndPassword(email.trim(), password).await()
                            val uid = result.user!!.uid
                            db.collection("users").document(uid).set(mapOf("uid" to uid, "fullName" to fullName.trim(), "phone" to phone.trim(), "emergencyContact" to emergencyContact.trim(), "email" to email.trim(), "role" to "PATIENT", "status" to "ACTIVE", "createdAt" to FieldValue.serverTimestamp())).await()
                            userRole = "PATIENT"; role = "PATIENT"; profileName = fullName.trim(); profilePhone = phone.trim(); error = ""
                        } else {
                            val result = auth.signInWithEmailAndPassword(email.trim(), password).await()
                            val profile = db.collection("users").document(result.user!!.uid).get().await()
                            val actual = profile.getString("role")?.uppercase()
                            if (actual != role) { auth.signOut(); error = "This account is not registered as ${role.lowercase()}." }
                            else { userRole = actual.orEmpty(); profileName = profile.getString("fullName").orEmpty(); profilePhone = profile.getString("phone").orEmpty(); error = "" }
                        }
                    } catch (e: Exception) { error = e.localizedMessage ?: "Sign in failed" }
                    loading = false
                } }, modifier = Modifier.fillMaxWidth()) { Text(if (loading) "Please wait…" else if (registering) "Create patient account" else "Sign in") }
                if (role == "PATIENT") TextButton(onClick = { registering = !registering; error = "" }) { Text(if (registering) "Already registered? Sign in" else "New here? Create patient account") }
            }
        } else if (userRole == "PATIENT") {
            if (emergency == null || emergency?.get("status") == "COMPLETED") {
                Text("Request help with one tap. Add only the details responders need.")
                Text("Emergency type")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf("ACCIDENT", "MEDICAL", "FIRE", "OTHER").forEach { FilterChip(emergencyType == it, { emergencyType = it }, label = { Text(it) }) } }
                Text("People affected: $patientCount")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { OutlinedButton(onClick = { patientCount = (patientCount - 1).coerceAtLeast(1) }) { Text("−") }; OutlinedButton(onClick = { patientCount = (patientCount + 1).coerceAtMost(20) }) { Text("+") } }
                if (!hasLocation) OutlinedButton(onClick = requestLocation) { Text("◎ Enable current location") }
                OutlinedTextField(locationInput, { input ->
                    locationInput = input
                    val parts = input.split(",").map { it.trim().toDoubleOrNull() }
                    if (parts.size == 2 && parts.all { it != null }) location = parts[0]!! to parts[1]!!
                }, Modifier.fillMaxWidth(), label = { Text("Location (latitude, longitude) · editable") })
                Text("Set GPS first, then adjust the coordinates or paste a map pin.")
                Button(enabled = !loading && location != null, onClick = { loading = true; scope.launch {
                    try {
                        val (lat, lon) = location!!
                        val ref = db.collection("emergency_requests").add(mapOf(
                            "callerName" to (profileName.ifBlank { auth.currentUser?.displayName ?: "Mobile caller" }), "callerUid" to auth.currentUser?.uid,
                            "contactNumber" to profilePhone, "emergencyType" to emergencyType, "patientCount" to patientCount,
                            "address" to "$lat, $lon", "latitude" to lat, "longitude" to lon, "priority" to "HIGH",
                            "description" to "", "status" to "PENDING", "assignedAmbulanceId" to null,
                            "requestedAt" to FieldValue.serverTimestamp(), "assignedAt" to null, "completedAt" to null)).await()
                        emergencyId = ref.id; toast = "Emergency request sent to dispatch." 
                    } catch (e: Exception) { error = e.localizedMessage ?: "Request failed" }
                    loading = false
                } }, modifier = Modifier.fillMaxWidth().height(62.dp), colors = ButtonDefaults.buttonColors(containerColor = red)) { Text(if (loading) "SENDING…" else "🚨  REQUEST AMBULANCE") }
            } else {
                Text("Help is on the way", style = MaterialTheme.typography.headlineMedium)
                Text("Status: ${emergency?.get("status") ?: "PENDING"}")
                Text("Emergency: ${emergency?.get("emergencyType") ?: ""} · ${emergency?.get("patientCount") ?: 1} person(s)")
                emergency?.get("assignedAmbulanceId")?.let { Text("Assigned ambulance: $it") }
                val lat = emergency?.get("latitude") as? Number; val lon = emergency?.get("longitude") as? Number
                if (lat != null && lon != null) OutlinedButton(onClick = { navigate("${lat.toDouble()},${lon.toDouble()}") }) { Text("View emergency location") }
                val unitLat = assignedAmbulance?.get("latitude") as? Number; val unitLon = assignedAmbulance?.get("longitude") as? Number
                if (unitLat != null && unitLon != null) OutlinedButton(onClick = { navigate("${unitLat.toDouble()},${unitLon.toDouble()}") }) { Text("View assigned ambulance position") }
                emergency?.get("status")?.toString()?.let { Text("Live request updates · $it") }
            }
        } else if (userRole == "DRIVER") {
            if (ambulance == null) Text("Driver profile is not linked to an ambulance yet. Ask an administrator to set driverUid to your account ID.")
            else if (emergency == null) Text("${ambulance?.get("vehicleNumber") ?: "Ambulance"} · ${ambulance?.get("status") ?: "AVAILABLE"}\nWaiting for dispatcher assignment.")
            else {
                Text("Assignment · ${emergency?.get("emergencyType") ?: "Emergency"}", style = MaterialTheme.typography.titleLarge)
                Text("Priority: ${emergency?.get("priority") ?: "HIGH"} · People: ${emergency?.get("patientCount") ?: 1}")
                Text("Location: ${emergency?.get("address") ?: ""}")
                val lat = emergency?.get("latitude") as? Number; val lon = emergency?.get("longitude") as? Number
                if (lat != null && lon != null) Button(onClick = { navigate("${lat.toDouble()},${lon.toDouble()}") }, Modifier.fillMaxWidth()) { Text("Navigate to emergency") }
                val status = emergency?.get("status") as? String ?: "ASSIGNED"
                val next = when (status) { "ASSIGNED" -> "ON_THE_WAY"; "ON_THE_WAY" -> "ARRIVED"; "ARRIVED" -> "PICKED_UP"; "PICKED_UP" -> "GOING_TO_HOSPITAL"; else -> "COMPLETED" }
                Button(onClick = { scope.launch {
                    runCatching {
                        db.collection("emergency_requests").document(emergencyId).update("status", next, "updatedAt", FieldValue.serverTimestamp()).await()
                        db.collection("ambulances").document(ambulanceId).update("status", when (next) { "ON_THE_WAY" -> "GOING_TO_EMERGENCY"; "ARRIVED" -> "AT_EMERGENCY_LOCATION"; "PICKED_UP", "GOING_TO_HOSPITAL" -> "TRANSPORTING_PATIENT"; else -> "AVAILABLE" }, "assignedEmergencyId", if (next == "COMPLETED") null else emergencyId).await()
                    }.onFailure { error = it.localizedMessage ?: "Status update failed" }
                } }, Modifier.fillMaxWidth()) { Text("Update status · $next") }
            }
        }
        if (toast.isNotBlank()) Text(toast, color = MaterialTheme.colorScheme.primary)
        if (error.isNotBlank()) Text(error, color = MaterialTheme.colorScheme.error)
        if (auth.currentUser != null) OutlinedButton(onClick = { auth.signOut(); userRole = ""; role = ""; emergency = null; ambulance = null; toast = "Signed out" }, Modifier.fillMaxWidth()) { Text("Sign out") }
    }
}
