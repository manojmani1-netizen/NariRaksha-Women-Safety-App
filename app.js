// ========================
// DOM Elements
// ========================
// Screens
const authScreen = document.getElementById('authScreen');
const mainApp = document.getElementById('mainApp');
const accountCenter = document.getElementById('accountCenter');

// Auth Forms
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const otpForm = document.getElementById('otpForm');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');

// Login Inputs
const loginPhone = document.getElementById('loginPhone');
const loginPassword = document.getElementById('loginPassword');

// Register Inputs
const regName = document.getElementById('regName');
const regEmail = document.getElementById('regEmail');
const regPhone = document.getElementById('regPhone');
const regPassword = document.getElementById('regPassword');

// OTP Inputs
const otpInput = document.getElementById('otpInput');
const otpDisplayPhone = document.getElementById('otpDisplayPhone');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const cancelOtpBtn = document.getElementById('cancelOtpBtn');

// Profile & Header
const profileBtn = document.getElementById('profileBtn');
const headerAvatar = document.getElementById('headerAvatar');
const profileAvatarLarge = document.getElementById('profileAvatarLarge');
const profileNameDisplay = document.getElementById('profileNameDisplay');
const profilePhoneDisplay = document.getElementById('profilePhoneDisplay');
const profileEmailDisplay = document.getElementById('profileEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');

// Edit Profile
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileForm = document.getElementById('editProfileForm');
const editName = document.getElementById('editName');
const editEmail = document.getElementById('editEmail');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Admin Modal
const adminDbBtn = document.getElementById('adminDbBtn');
const adminModal = document.getElementById('adminModal');
const adminTableBody = document.getElementById('adminTableBody');
const closeAdminBtn = document.getElementById('closeAdminBtn');

// Dashboard Elements
const statusBanner = document.getElementById('statusBanner');
const statusTitle = document.getElementById('statusTitle');
const statusDesc = document.getElementById('statusDesc');
const locationName = document.getElementById('locationName');
const mapOverlay = document.getElementById('mapOverlay');
const contactsStatCard = document.getElementById('contactsStatCard');
const contactCount = document.getElementById('contactCount');
const batteryLevelDisplay = document.getElementById('batteryLevelDisplay');

// Toast Notifications
const toastContainer = document.getElementById('toastContainer');

function showToast(title, message, isDanger = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isDanger ? 'toast-danger' : ''}`;
    
    toast.innerHTML = `
        <div class="toast-icon">${isDanger ? '🚨' : '✅'}</div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// SOS Elements
const sosButton = document.getElementById('sosButton');
const sosModal = document.getElementById('sosModal');
const cancelSosBtn = document.getElementById('cancelSosBtn');
const sosContactsList = document.getElementById('sosContactsList');

// Contacts Management
const closeAcBtn = document.getElementById('closeAcBtn');
const addContactForm = document.getElementById('addContactForm');
const contactNameInput = document.getElementById('contactName');
const contactPhoneInput = document.getElementById('contactPhone');
const contactsList = document.getElementById('contactsList');

// ========================
// State & Storage
// ========================
let currentUser = localStorage.getItem('nariRaksha_user') || null;
let trustedContacts = currentUser ? JSON.parse(localStorage.getItem(`nariRaksha_contacts_${currentUser}`)) || [] : [];
// Registered users object: { "phone": { name: "...", password: "..." } }
let registeredUsers = JSON.parse(localStorage.getItem('nariRaksha_accounts')) || {};

// Ensure Super Admin account exists
if (!registeredUsers['9963441830']) {
    registeredUsers['9963441830'] = {
        name: 'Manoj Admin',
        email: 'admin@nariraksha.com',
        password: 'Manojmani1'
    };
    localStorage.setItem('nariRaksha_accounts', JSON.stringify(registeredUsers));
}

let gpsWatchId = null;

// ========================
// Authentication
// ========================
function checkAuth() {
    if (currentUser) {
        authScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        const user = registeredUsers[currentUser];
        
        if (user) {
            // Generate initials for avatar
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            headerAvatar.textContent = initials;
            profileAvatarLarge.textContent = initials;
            
            // Populate profile section
            profileNameDisplay.textContent = user.name;
            profilePhoneDisplay.textContent = currentUser;
            profileEmailDisplay.textContent = user.email || 'No email provided';
            
            // Admin Access Control
            if (currentUser === '9963441830') {
                adminDbBtn.classList.remove('hidden');
            } else {
                adminDbBtn.classList.add('hidden');
            }
        }
        
        // Load user specific contacts
        trustedContacts = JSON.parse(localStorage.getItem(`nariRaksha_contacts_${currentUser}`)) || [];
        renderContacts();
        startGPS();
    } else {
        authScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
        stopGPS();
    }
}

// ========================
// Authentication Logic
// ========================
let tempRegistrationData = null;
let expectedOTP = null;

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendMockSMS(phone, otp) {
    showToast('📩 SMS Received', `To: ${phone}<br>NariRaksha verification code: <b>${otp}</b>`);
}

showRegisterBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLoginBtn.addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Step 1: Request OTP
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = regPhone.value.trim();
    const name = regName.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value.trim();

    if (registeredUsers[phone]) {
        showToast('Registration Error', 'An account with this phone number already exists!', true);
        return;
    }

    // Check if email already exists
    const emailExists = Object.values(registeredUsers).some(user => user.email && user.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
        showToast('Registration Error', 'An account with this email address already exists!', true);
        return;
    }

    // Save temporarily
    tempRegistrationData = { phone, name, email, password };
    expectedOTP = generateOTP();

    // UI Changes
    registerForm.classList.add('hidden');
    otpForm.classList.remove('hidden');
    otpDisplayPhone.textContent = phone;
    otpInput.value = '';

    // Simulate sending SMS
    sendMockSMS(phone, expectedOTP);
});

// Step 2: Verify OTP
otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredOTP = otpInput.value.trim();

    if (enteredOTP === expectedOTP) {
        // Success: Register User
        const { phone, name, email, password } = tempRegistrationData;
        
        registeredUsers[phone] = { name, email, password };
        localStorage.setItem('nariRaksha_accounts', JSON.stringify(registeredUsers));

        // Auto login
        localStorage.setItem('nariRaksha_user', phone);
        currentUser = phone;
        checkAuth();
        
        // Clear forms
        regPhone.value = '';
        regName.value = '';
        regEmail.value = '';
        regPassword.value = '';
        otpInput.value = '';
        
        otpForm.classList.add('hidden');
    } else {
        showToast('Verification Failed', 'Incorrect OTP. Please try again.', true);
    }
});

resendOtpBtn.addEventListener('click', () => {
    if (tempRegistrationData) {
        expectedOTP = generateOTP();
        sendMockSMS(tempRegistrationData.phone, expectedOTP);
    }
});

cancelOtpBtn.addEventListener('click', () => {
    otpForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tempRegistrationData = null;
    expectedOTP = null;
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = loginPhone.value.trim();
    const password = loginPassword.value.trim();
    
    if (!registeredUsers[phone]) {
        showToast('Login Failed', 'Account not found. Please register first.', true);
        return;
    }

    if (registeredUsers[phone].password !== password) {
        showToast('Login Failed', 'Incorrect password. Please try again.', true);
        return;
    }

    localStorage.setItem('nariRaksha_user', phone);
    currentUser = phone;
    checkAuth();
    
    loginPhone.value = '';
    loginPassword.value = '';
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('nariRaksha_user');
    currentUser = null;
    accountCenter.classList.add('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    checkAuth();
});

// ========================
// Edit Profile Logic
// ========================
editProfileBtn.addEventListener('click', () => {
    editProfileForm.classList.remove('hidden');
    editProfileBtn.classList.add('hidden');
    
    const user = registeredUsers[currentUser];
    if (user) {
        editName.value = user.name || '';
        editEmail.value = user.email || '';
    }
});

cancelEditBtn.addEventListener('click', () => {
    editProfileForm.classList.add('hidden');
    editProfileBtn.classList.remove('hidden');
});

editProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = editName.value.trim();
    const newEmail = editEmail.value.trim();
    
    if (registeredUsers[currentUser]) {
        registeredUsers[currentUser].name = newName;
        registeredUsers[currentUser].email = newEmail;
        localStorage.setItem('nariRaksha_accounts', JSON.stringify(registeredUsers));
        
        checkAuth(); // Refresh profile UI
    }
    
    editProfileForm.classList.add('hidden');
    editProfileBtn.classList.remove('hidden');
});

// ========================
// Admin Database Logic
// ========================
adminDbBtn.addEventListener('click', () => {
    adminTableBody.innerHTML = '';
    
    // Loop through local storage users and create rows
    for (const [phone, user] of Object.entries(registeredUsers)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.name}</td>
            <td>${phone}</td>
            <td>${user.email || '<i class="text-muted">None</i>'}</td>
            <td style="font-family: monospace;">${user.password}</td>
        `;
        adminTableBody.appendChild(tr);
    }
    
    adminModal.classList.remove('hidden');
    accountCenter.classList.add('hidden');
});

closeAdminBtn.addEventListener('click', () => {
    adminModal.classList.add('hidden');
    accountCenter.classList.remove('hidden');
});

// ========================
// Account Center & Contacts
// ========================
profileBtn.addEventListener('click', () => accountCenter.classList.remove('hidden'));
closeAcBtn.addEventListener('click', () => accountCenter.classList.add('hidden'));
contactsStatCard.addEventListener('click', () => accountCenter.classList.remove('hidden'));

function renderContacts() {
    contactCount.textContent = `${trustedContacts.length} Active`;
    contactsList.innerHTML = '';
    
    if (trustedContacts.length === 0) {
        contactsList.innerHTML = '<p class="text-muted">No contacts added yet.</p>';
    } else {
        trustedContacts.forEach((contact, index) => {
            const li = document.createElement('li');
            li.className = 'contact-item';
            li.innerHTML = `
                <div class="contact-info">
                    <span class="c-name">${contact.name}</span>
                    <span class="c-phone">${contact.phone}</span>
                </div>
                <button class="delete-contact-btn" onclick="deleteContact(${index})">🗑️</button>
            `;
            contactsList.appendChild(li);
        });
    }
}

addContactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = contactNameInput.value.trim();
    const phone = contactPhoneInput.value.trim();
    if (name && phone) {
        trustedContacts.push({ name, phone });
        localStorage.setItem(`nariRaksha_contacts_${currentUser}`, JSON.stringify(trustedContacts));
        contactNameInput.value = '';
        contactPhoneInput.value = '';
        renderContacts();
    }
});

window.deleteContact = function(index) {
    trustedContacts.splice(index, 1);
    localStorage.setItem(`nariRaksha_contacts_${currentUser}`, JSON.stringify(trustedContacts));
    renderContacts();
};

// ========================
// Real GPS Location & Map
// ========================
let leafletMap = null;
let leafletMarker = null;

function initMap() {
    if (!leafletMap) {
        leafletMap = L.map('map', { zoomControl: false, attributionControl: false }).setView([20.5937, 78.9629], 5); // Default India
        
        // Terrain Map Layer
        L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
            attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
        }).addTo(leafletMap);
        
        // Custom marker style for dark theme
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:var(--accent);width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 10px var(--accent);'></div>",
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        leafletMarker = L.marker([20.5937, 78.9629], {icon: icon}).addTo(leafletMap);
    }
}

function startGPS() {
    initMap();
    if (!("geolocation" in navigator)) {
        updateZoneUI('error', 'GPS Not Supported', 'Your device does not support GPS tracking.');
        return;
    }

    gpsWatchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            updateZoneUI('safe', 'You are in a Safe Zone', 'GPS Signal Active & Monitored.');
            locationName.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            
            // Update Map
            leafletMap.setView([lat, lon], 16);
            leafletMarker.setLatLng([lat, lon]);

            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
                .then(res => res.json())
                .then(data => {
                    if(data.address) {
                        const street = data.address.road || data.address.suburb || data.address.city || "Current Location";
                        locationName.textContent = street;
                    }
                }).catch(err => console.log("Geocoding failed", err));
        },
        (error) => {
            if (error.code === error.PERMISSION_DENIED || error.code === error.POSITION_UNAVAILABLE) {
                updateZoneUI('danger', 'Location Disabled', 'Please turn on your device location and allow permissions to use NariRaksha.');
                locationName.textContent = 'Location Disabled';
            } else {
                updateZoneUI('warning', 'Location Error', 'Searching for GPS signal...');
                locationName.textContent = 'GPS Signal Lost';
            }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
}

function stopGPS() {
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
}

function updateZoneUI(type, title, desc) {
    statusBanner.className = 'status-banner';
    if (type === 'safe') {
        statusBanner.classList.add('status-safe');
        mapOverlay.style.borderColor = 'var(--safe)';
    } else if (type === 'warning') {
        statusBanner.classList.add('status-warning');
        mapOverlay.style.borderColor = 'var(--warning)';
    } else {
        statusBanner.classList.add('status-danger');
        mapOverlay.style.borderColor = 'var(--danger)';
    }
    
    statusTitle.textContent = title;
    statusDesc.textContent = desc;
}

// ========================
// SOS Logic (Hold for 3 seconds)
// ========================
let holdTimeout;
let isHolding = false;

function triggerAlerts() {
    // Show Modal
    sosModal.classList.remove('hidden');
    sosContactsList.innerHTML = '';
    
    if(trustedContacts.length === 0) {
        sosContactsList.innerHTML = '<li>⚠️ Authorities (911/100)</li><li>No trusted contacts added!</li>';
    } else {
        trustedContacts.forEach(c => {
            const li = document.createElement('li');
            li.textContent = `📞 ${c.name} (${c.phone})`;
            sosContactsList.appendChild(li);
        });
    }

    // Show our reliable custom Toast Notification
    showToast('SOS ALERTS SENT', 'Your emergency contacts have been notified of your location.', true);

    // Trigger actual notification (Native fallback)
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                try {
                    new Notification("NariRaksha SOS Triggered", {
                        body: "Emergency alerts and your location have been dispatched.",
                        icon: "🚨"
                    });
                } catch(e) { console.log(e); }
            }
        });
    }

    // Open SMS protocol with trusted contacts
    if (trustedContacts.length > 0) {
        const phoneNumbers = trustedContacts.map(c => c.phone).join(',');
        const message = encodeURIComponent(`Help me! I am in danger. My current location is: ${locationName.textContent}.`);
        
        // [DEMO MODE] Simulate successful delivery for presentation
        trustedContacts.forEach((c, index) => {
            setTimeout(() => {
                showToast('📱 SMS Delivered', `To: ${c.name} (${c.phone})<br>"Help me! I am in danger..."`);
            }, index * 800); // Stagger the popups for a cool effect!
        });

        window.open(`sms:${phoneNumbers}?body=${message}`, '_self');
    }
}

function startHold(e) {
    // Prevent default touch behaviors like scrolling/zooming
    if (e.type === 'touchstart') e.preventDefault();
    
    isHolding = true;
    sosButton.classList.add('holding');
    
    holdTimeout = setTimeout(() => {
        if (isHolding) {
            sosButton.classList.remove('holding');
            triggerAlerts();
            isHolding = false;
        }
    }, 3000); // 3 seconds hold
}

function stopHold() {
    isHolding = false;
    sosButton.classList.remove('holding');
    clearTimeout(holdTimeout);
}

function cancelSOS() {
    sosModal.classList.add('hidden');
}

// Mouse events
sosButton.addEventListener('mousedown', startHold);
sosButton.addEventListener('mouseup', stopHold);
sosButton.addEventListener('mouseleave', stopHold);

// Touch events for mobile
sosButton.addEventListener('touchstart', startHold, {passive: false});
sosButton.addEventListener('touchend', stopHold);
sosButton.addEventListener('touchcancel', stopHold);

cancelSosBtn.addEventListener('click', cancelSOS);

// ========================
// Battery Status API
// ========================
function initBattery() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            updateBatteryUI(battery);
            
            battery.addEventListener('levelchange', () => updateBatteryUI(battery));
            battery.addEventListener('chargingchange', () => updateBatteryUI(battery));
        });
    } else {
        batteryLevelDisplay.textContent = 'N/A';
    }
}

function updateBatteryUI(battery) {
    const level = Math.round(battery.level * 100);
    const isCharging = battery.charging ? '⚡' : '';
    batteryLevelDisplay.textContent = `${level}% ${isCharging}`;
    
    if (level <= 20 && !battery.charging) {
        batteryLevelDisplay.style.color = 'var(--danger)';
    } else {
        batteryLevelDisplay.style.color = 'var(--safe)';
    }
}

// ========================
// Initialization
// ========================
window.addEventListener('DOMContentLoaded', () => {
    initBattery();
    
    // Show splash screen for 2.5 seconds, then fade out
    setTimeout(() => {
        const splashScreen = document.getElementById('splashScreen');
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                checkAuth(); // Load the correct screen after splash
            }, 500);
        } else {
            checkAuth();
        }
    }, 2500);
});
