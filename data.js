// Firestore collections
const usersCollection = db.collection("users");
const studentsCollection = db.collection("students");

const currentUser = {
    id: null,
    name: null,
    email: null,
    role: null,
    studentId: null,
    isAuthenticated: false
};

// Initialize default data
async function initializeDefaultData() {
    const usersSnapshot = await usersCollection.get();
    if (usersSnapshot.empty) {
        // Create default teacher
        const teacherCredential = await auth.createUserWithEmailAndPassword(
            "teacher@school.com", 
            "123456"
        );
        
        await usersCollection.add({
            name: "Admin Teacher",
            email: "teacher@school.com",
            role: "teacher",
            studentId: null,
            uid: teacherCredential.user.uid
        });
        const adminCredential = await auth.createUserWithEmailAndPassword(
            "admin@school.com", 
            "admin123"
        );
        
        await usersCollection.add({
            name: "System Admin",
            email: "admin@school.com",
            role: "admin",
            studentId: null,
            uid: adminCredential.user.uid
        });

        // Create default student with attendance array
        const studentCredential = await auth.createUserWithEmailAndPassword(
            "student@school.com",
            "123456"
        );
        
        const studentRef = await studentsCollection.add({
            name: "Demo Student",
            grade: "B",
            attendance: [
                {
                    date: new Date().toISOString().split('T')[0],
                    status: "present"
                }
            ]
        });

        await usersCollection.add({
            name: "Demo Student",
            email: "student@school.com",
            role: "student",
            studentId: studentRef.id,
            uid: studentCredential.user.uid
        });
    }
}

// Call initialization when the app starts
initializeDefaultData();
