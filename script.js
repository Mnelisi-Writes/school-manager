// Authentication Functions
function showSignup() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
    document.getElementById('new-password-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

async function signup() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    
    if (!name || !email || !password) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        // Create Firebase auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        let studentId = null;
        if (role === 'student') {
            const studentRef = await studentsCollection.add({
                name,
                grade: '',
                attendance: '100%'
            });
            studentId = studentRef.id;
        }
        
        // Create user document
        await usersCollection.add({
            name,
            email,
            role,
            studentId,
            uid: userCredential.user.uid
        });
        
        alert('Account created successfully! Please login.');
        showLogin();
    } catch (error) {
        alert('Error creating account: ' + error.message);
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const snapshot = await usersCollection.where('email', '==', email).get();
        
        if (snapshot.empty) {
            alert('User not found');
            return;
        }
        
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        
        currentUser.id = userDoc.id;
        currentUser.name = userData.name;
        currentUser.email = userData.email;
        currentUser.role = userData.role;
        currentUser.studentId = userData.studentId;
        currentUser.isAuthenticated = true;
        
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        document.getElementById('user-name').textContent = userData.name;
        setUserType(userData.role);
    } catch (error) {
        alert('Login error: ' + error.message);
    }
}

function logout() {
    auth.signOut().then(() => {
        currentUser.isAuthenticated = false;
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-content').classList.add('hidden');
    });
}

// Initialize app
function initApp() {
    // Show today's date
    document.getElementById('today-date').textContent = formatDate(new Date().toISOString().split('T')[0]);
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const snapshot = await usersCollection.where('email', '==', user.email).get();
            if (!snapshot.empty) {
                const userDoc = snapshot.docs[0];
                const userData = userDoc.data();
                
                currentUser.id = userDoc.id;
                currentUser.name = userData.name;
                currentUser.email = userData.email;
                currentUser.role = userData.role;
                currentUser.studentId = userData.studentId;
                currentUser.isAuthenticated = true;
                
                document.getElementById('auth-container').classList.add('hidden');
                document.getElementById('app-content').classList.remove('hidden');
                document.getElementById('user-name').textContent = userData.name;
                setUserType(userData.role);
            }
        }
    });
}

window.onload = initApp;

// User Interface Functions
function setUserType(type) {
    currentUser.type = type;
    document.getElementById('student-view').classList.add('hidden');
    document.getElementById('teacher-view').classList.add('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    
    if (type === 'student') {
        document.getElementById('student-view').classList.remove('hidden');
        loadStudentData();
    } else if (type === 'teacher') {
        document.getElementById('teacher-view').classList.remove('hidden');
        loadTeacherData();
    }
}

// ... (keep existing functions until loadStudentData)

async function loadStudentData() {
    if (!currentUser.studentId) return;
    
    try {
        const studentDoc = await studentsCollection.doc(currentUser.studentId).get();
        if (studentDoc.exists) {
            const student = studentDoc.data();
            document.getElementById('student-grades').innerHTML = `
                <p><strong>Current Grade:</strong> ${student.grade || 'Not set'}</p>
            `;
            
            // Calculate attendance percentage
            const attendanceRecords = student.attendance || [];
            const presentCount = attendanceRecords.filter(a => a.status === "present").length;
            const attendancePercentage = attendanceRecords.length > 0 
                ? Math.round((presentCount / attendanceRecords.length) * 100) 
                : 0;
            
            // Display attendance records with dates
            let attendanceHTML = `
                <p><strong>Attendance Rate:</strong> ${attendancePercentage}%</p>
                <div class="attendance-records">
                    <h4>Recent Records:</h4>
                    <ul>
            `;
            
            attendanceRecords.slice(-5).reverse().forEach(record => {
                attendanceHTML += `
                    <li>${formatDate(record.date)}: ${record.status}</li>
                `;
            });
            
            attendanceHTML += `</ul></div>`;
            document.getElementById('student-attendance').innerHTML = attendanceHTML;
        }
    } catch (error) {
        console.error("Error loading student data: ", error);
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Update attendance functions
async function markPresent() {
    await markAttendance("present");
}

async function markAbsent() {
    await markAttendance("absent");
}

async function markAttendance(status) {
    const studentId = document.getElementById('attendance-select').value;
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const studentRef = studentsCollection.doc(studentId);
        const studentDoc = await studentRef.get();
        let attendance = studentDoc.data().attendance || [];
        
        // Check if attendance already recorded today
        const todayRecordIndex = attendance.findIndex(a => a.date === today);
        
        if (todayRecordIndex >= 0) {
            // Update existing record
            attendance[todayRecordIndex].status = status;
        } else {
            // Add new record
            attendance.push({
                date: today,
                status: status
            });
        }
        
        await studentRef.update({ attendance });
        
        // Update UI
        if (currentUser.role === 'teacher') {
            loadTeacherData();
        } else {
            loadStudentData();
        }
        
        alert(`Marked ${status} for ${studentDoc.data().name} on ${formatDate(today)}`);
    } catch (error) {
        alert('Error updating attendance: ' + error.message);
    }
}

// ... (keep rest of the existing code)

async function loadTeacherData() {
    try {
        const studentSelect = document.getElementById('student-select');
        const attendanceSelect = document.getElementById('attendance-select');
        
        studentSelect.innerHTML = '';
        attendanceSelect.innerHTML = '';
        
        const snapshot = await studentsCollection.get();
        snapshot.forEach(doc => {
            const student = doc.data();
            studentSelect.innerHTML += `<option value="${doc.id}">${student.name}</option>`;
            attendanceSelect.innerHTML += `<option value="${doc.id}">${student.name}</option>`;
        });
    } catch (error) {
        console.error("Error loading teacher data: ", error);
    }
}

async function recordGrade() {
    const studentId = document.getElementById('student-select').value;
    const grade = document.getElementById('grade-input').value;
    
    try {
        await studentsCollection.doc(studentId).update({ grade });
        const studentDoc = await studentsCollection.doc(studentId).get();
        alert(`Grade updated for ${studentDoc.data().name}: ${grade}`);
    } catch (error) {
        alert('Error updating grade: ' + error.message);
    }
}

function markPresent() {
    const studentId = document.getElementById('attendance-select').value;
    alert(`Marked present for student ID: ${studentId}`);
}

function markAbsent() {
    const studentId = document.getElementById('attendance-select').value;
    alert(`Marked absent for student ID: ${studentId}`);
}

// Password Reset Functions
function showReset() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('reset-form').classList.remove('hidden');
}

async function sendResetLink() {
    const email = document.getElementById('reset-email').value;
    
    if (!email) {
        alert('Please enter your email');
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        alert('Password reset email sent. Please check your inbox.');
        showLogin();
    } catch (error) {
        alert('Error sending reset email: ' + error.message);
    }
}

// AI Assistant
function askAssistant() {
    const input = document.getElementById('user-input').value.toLowerCase();
    const chatBox = document.getElementById('chat-box');
    
    chatBox.innerHTML += `<p><strong>You:</strong> ${input}</p>`;
    
    let response = "I'm not sure about that. Please contact the school office.";
    
    if (input.includes("grade") || input.includes("score")) {
        response = "Grades are updated every Friday. Contact your teacher for specific questions.";
    } else if (input.includes("attendance") || input.includes("absent")) {
        response = "Attendance records are maintained by your homeroom teacher. Excused absences require a note.";
    } else if (input.includes("homework") || input.includes("assignment")) {
        response = "Homework assignments are posted in Google Classroom. Due dates vary by teacher.";
    }
    
    chatBox.innerHTML += `<p><strong>Assistant:</strong> ${response}</p>`;
    document.getElementById('user-input').value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
}