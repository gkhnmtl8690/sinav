// Database API
class DatabaseSync {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingChanges = [];
        this.setupOnlineListener();
    }

    setupOnlineListener() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingChanges();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async syncToDatabase(dataType, data) {
        if (!this.isOnline) {
            this.pendingChanges.push({ dataType, data });
            return;
        }

        try {
            const response = await fetch('https://8d09f432-5eed-4a64-9e74-04c5c4d04ea5-00-38up2j3p1fryf.pike.replit.dev/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ dataType, data })
            });
            if (!response.ok) throw new Error('Sync failed');
        } catch (error) {
            console.log('Database sync failed, saving for later:', error);
            this.pendingChanges.push({ dataType, data });
        }
    }

    async loadFromDatabase() {
        if (!this.isOnline) return null;
        
        try {
            const response = await fetch('https://8d09f432-5eed-4a64-9e74-04c5c4d04ea5-00-38up2j3p1fryf.pike.replit.dev/api/data');
            if (!response.ok) throw new Error('Load failed');
            return await response.json();
        } catch (error) {
            console.log('Database load failed, using localStorage:', error);
            return null;
        }
    }

    async syncPendingChanges() {
        while (this.pendingChanges.length > 0 && this.isOnline) {
            const change = this.pendingChanges.shift();
            await this.syncToDatabase(change.dataType, change.data);
        }
    }
}

// Database instance
const dbSync = new DatabaseSync();

// Uygulama durumu (state)
let appState = {
    currentPage: 'anasayfa',
    currentTab: 'schools',
    selectedSchoolIndex: null,
    selectedGrade: null,
    selectedSchoolForClass: null,
    selectedClassForStudents: null,
    schools: [],
    criteriaByGrade: {
        5: [],
        6: [],
        7: [],
        8: []
    },
    exams: [],
    selectedCriteria: [],
    selectedCriteriaWithDeadlines: [],
    currentExamScores: {}
};

// Veri yükleme (Database + LocalStorage hybrid)
async function loadAppState() {
    // Önce database'den yüklemeyi dene
    const dbData = await dbSync.loadFromDatabase();
    
    if (dbData) {
        // Database'den yüklendi
        appState.schools = dbData.schools || [];
        appState.criteriaByGrade = dbData.criteriaByGrade || {5: [], 6: [], 7: [], 8: []};
        appState.exams = dbData.exams || [];
        
        // LocalStorage'a da backup olarak kaydet
        localStorage.setItem('okulYonetimSistemi', JSON.stringify({
            schools: appState.schools,
            criteriaByGrade: appState.criteriaByGrade,
            exams: appState.exams
        }));
    } else {
        // Database başarısızsa localStorage'dan yükle
        const savedState = localStorage.getItem('okulYonetimSistemi');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            appState.schools = parsed.schools || [];
            appState.criteriaByGrade = parsed.criteriaByGrade || {5: [], 6: [], 7: [], 8: []};
            appState.exams = parsed.exams || [];
            
            // LocalStorage'daki veriyi database'e sync et
            dbSync.syncToDatabase('schools', appState.schools);
            dbSync.syncToDatabase('criteria', appState.criteriaByGrade);
            dbSync.syncToDatabase('exams', appState.exams);
        }
    }
    
    // Diğer state değerlerini sıfırla
    appState.selectedCriteria = [];
    appState.selectedCriteriaWithDeadlines = [];
    appState.currentExamScores = {};
}

// Veri kaydetme (Database + LocalStorage hybrid)
function saveAppState() {
    const stateToSave = {
        schools: appState.schools,
        criteriaByGrade: appState.criteriaByGrade,
        exams: appState.exams
    };
    
    // LocalStorage'a kaydet (offline backup)
    localStorage.setItem('okulYonetimSistemi', JSON.stringify(stateToSave));
    
    // Database'e sync et
    dbSync.syncToDatabase('schools', appState.schools);
    dbSync.syncToDatabase('criteria', appState.criteriaByGrade);
    dbSync.syncToDatabase('exams', appState.exams);
}

// Sayfa geçişleri
function navigateTo(page) {
    // Tüm sayfaları gizle ve scrollable sınıfını kaldır
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
        p.classList.remove('scrollable');
    });
    
    // Seçili sayfayı göster
    document.getElementById(page).classList.remove('hidden');
    
    // Compact mode toggle for okul-ekle and sinif-yonetimi
    if (page === 'okul-ekle' || page === 'sinif-yonetimi') {
        document.body.classList.add('compact');
        document.body.classList.remove('allow-scroll');
    } else {
        document.body.classList.remove('compact');
    }
    
    // Scrollbar gerekli sayfalara scrollable sınıfı ekle
    if (page === 'sinav-olustur' || page === 'sinif-kriterleri' || page === 'sinavlarim' || page === 'rapor-al' || page === 'sinav-puanlama') {
        document.getElementById(page).classList.add('scrollable');
    }
    
    appState.currentPage = page;
    
    // Sayfa yüklendiğinde güncelleme
    if (page === 'okul-ekle') {
        updateSchoolList();
        updateSchoolSelectForClass();
    } else if (page === 'sinav-olustur') {
        updateExamSchools();
        updateExamsList();
    } else if (page === 'sinavlarim') {
        updateMyExamsList();
    } else if (page === 'rapor-al') {
        updateReportExamSelect();
    }
}

// Tab değiştirme
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.add('hidden'));
    
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    if (tabName === 'schools') {
        document.getElementById('school-management').classList.remove('hidden');
        updateSchoolList();
    } else if (tabName === 'classes') {
        document.getElementById('class-management').classList.remove('hidden');
        updateSchoolSelectForClass();
    }
    
    appState.currentTab = tabName;
}

// Okul yönetimi
function addSchool() {
    const schoolNameInput = document.getElementById('school-name');
    const schoolName = schoolNameInput.value.trim();
    
    if (schoolName) {
        const newSchool = {
            name: schoolName,
            classes: [],
            id: Date.now()
        };
        
        appState.schools.push(newSchool);
        schoolNameInput.value = '';
        updateSchoolList();
        saveAppState();
    }
}

function deleteSchool(index) {
    if (confirm('Bu okulu silmek istediğinizden emin misiniz? Tüm sınıfları ve öğrencileri silinecektir.')) {
        appState.schools.splice(index, 1);
        updateSchoolList();
        updateSchoolSelectForClass();
        saveAppState();
    }
}

function updateSchoolList() {
    const schoolsList = document.getElementById('schools-list');
    const schoolCount = document.getElementById('school-count');
    
    schoolCount.textContent = appState.schools.length;
    
    if (appState.schools.length === 0) {
        schoolsList.innerHTML = '<div class="list-item" style="font-style: italic; color: #666;">Henüz okul eklenmedi.</div>';
        return;
    }
    
    schoolsList.innerHTML = appState.schools.map((school, index) => `
        <div class="school-item">
            <div class="school-header">
                <div>
                    <div class="school-name">${school.name}</div>
                    <div class="class-count">${school.classes.length} sınıf</div>
                </div>
                <div class="action-buttons">
                    <button class="small-button view-button" onclick="selectSchoolForClassManagement(${index})">
                        Sınıfları Görüntüle
                    </button>
                    <button class="small-button delete-button" onclick="deleteSchool(${index})">
                        Sil
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Sınıf yönetimi
function selectSchoolForClassManagement(schoolIndex) {
    switchTab('classes');
    document.getElementById('selected-school').value = schoolIndex;
    selectSchoolForClass();
}

function updateSchoolSelectForClass() {
    const select = document.getElementById('selected-school');
    select.innerHTML = '<option value="">Okul seçiniz...</option>' +
        appState.schools.map((school, index) => 
            `<option value="${index}">${school.name}</option>`
        ).join('');
}

function selectSchoolForClass() {
    const selectedIndex = document.getElementById('selected-school').value;
    appState.selectedSchoolForClass = selectedIndex !== '' ? parseInt(selectedIndex) : null;
    
    const classManager = document.getElementById('class-manager');
    
    if (appState.selectedSchoolForClass !== null) {
        classManager.classList.remove('hidden');
        updateClassList();
    } else {
        classManager.classList.add('hidden');
    }
}

function addClass() {
    const classNameInput = document.getElementById('class-name');
    const className = classNameInput.value.trim();
    
    if (className && appState.selectedSchoolForClass !== null) {
        const newClass = {
            name: className,
            students: [],
            id: Date.now()
        };
        
        appState.schools[appState.selectedSchoolForClass].classes.push(newClass);
        classNameInput.value = '';
        updateClassList();
        updateSchoolList(); // Ana listeyı de güncelle
        saveAppState();
    }
}

function deleteClass(classIndex) {
    if (confirm('Bu sınıfı silmek istediğinizden emin misiniz? Tüm öğrencileri silinecektir.')) {
        appState.schools[appState.selectedSchoolForClass].classes.splice(classIndex, 1);
        updateClassList();
        updateSchoolList();
        saveAppState();
    }
}

function updateClassList() {
    if (appState.selectedSchoolForClass === null) return;
    
    const school = appState.schools[appState.selectedSchoolForClass];
    const classesList = document.getElementById('classes-list');
    const classCount = document.getElementById('class-count');
    
    classCount.textContent = school.classes.length;
    
    if (school.classes.length === 0) {
        classesList.innerHTML = '<div class="list-item" style="font-style: italic; color: #666;">Bu okulda henüz sınıf bulunmuyor.</div>';
        return;
    }
    
    classesList.innerHTML = school.classes.map((classItem, index) => `
        <div class="class-item">
            <div>
                <span class="class-name">${classItem.name}</span>
                <div class="student-count">
                    ${(classItem.students || []).length} öğrenci
                </div>
            </div>
            <div class="action-buttons">
                <button class="small-button view-button" onclick="navigateToStudentManagement(${appState.selectedSchoolForClass}, ${index})">
                    Öğrenci Yönet
                </button>
                <button class="small-button delete-button" onclick="deleteClass(${index})">
                    Sınıfı Sil
                </button>
            </div>
        </div>
    `).join('');
}

// Kriter yönetimi
function navigateToGradeCriteria(grade) {
    appState.selectedGrade = grade;
    document.getElementById('criteria-grade').textContent = grade;
    document.getElementById('criteria-grade-title').textContent = grade;
    navigateTo('sinif-kriterleri');
    updateCriteriaList();
}

function addCriteria() {
    const criteriaInput = document.getElementById('criteria-text');
    const criteriaText = criteriaInput.value.trim();
    
    if (criteriaText && appState.selectedGrade) {
        appState.criteriaByGrade[appState.selectedGrade].push(criteriaText);
        criteriaInput.value = '';
        updateCriteriaList();
        saveAppState();
    }
}

function deleteCriteria(index) {
    if (confirm('Bu kriteri silmek istediğinizden emin misiniz?')) {
        appState.criteriaByGrade[appState.selectedGrade].splice(index, 1);
        updateCriteriaList();
        saveAppState();
    }
}

function updateCriteriaList() {
    if (!appState.selectedGrade) return;
    
    const criteriaList = document.getElementById('criteria-list');
    const criteriaCount = document.getElementById('criteria-count');
    const criteria = appState.criteriaByGrade[appState.selectedGrade];
    
    criteriaCount.textContent = criteria.length;
    
    if (criteria.length === 0) {
        criteriaList.innerHTML = `<div class="list-item" style="font-style: italic; color: #666;">Henüz ${appState.selectedGrade}. sınıf için kriter eklenmedi.</div>`;
        return;
    }
    
    criteriaList.innerHTML = criteria.map((criteriaItem, index) => `
        <div class="list-item" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>Kriter ${index + 1}:</strong> ${criteriaItem}
            </div>
            <button class="small-button delete-button" onclick="deleteCriteria(${index})" style="margin-left: 10px;">
                Sil
            </button>
        </div>
    `).join('');
}

// Öğrenci yönetimi
function navigateToStudentManagement(schoolIndex, classIndex) {
    appState.selectedSchoolIndex = schoolIndex;
    appState.selectedClassIndex = classIndex;
    
    const school = appState.schools[schoolIndex];
    const classItem = school.classes[classIndex];
    
    document.getElementById('student-school-name').textContent = school.name;
    document.getElementById('student-class-name').textContent = classItem.name;
    
    navigateTo('sinif-yonetimi');
    updateStudentsList();
}

function addStudent() {
    const numberInput = document.getElementById('student-number');
    const nameInput = document.getElementById('student-name');
    const number = numberInput.value.trim();
    const name = nameInput.value.trim();
    
    if (number && name && appState.selectedSchoolIndex !== null && appState.selectedClassIndex !== null) {
        const student = {
            number: number,
            name: name,
            id: Date.now()
        };
        
        const classItem = appState.schools[appState.selectedSchoolIndex].classes[appState.selectedClassIndex];
        if (!classItem.students) classItem.students = [];
        classItem.students.push(student);
        
        numberInput.value = '';
        nameInput.value = '';
        updateStudentsList();
        saveAppState();
    }
}

function deleteStudent(studentId) {
    if (confirm('Bu öğrenciyi silmek istediğinizden emin misiniz?')) {
        const classItem = appState.schools[appState.selectedSchoolIndex].classes[appState.selectedClassIndex];
        classItem.students = classItem.students.filter(s => s.id !== studentId);
        updateStudentsList();
        saveAppState();
    }
}

function uploadStudentFile() {
    const fileInput = document.getElementById('student-file');
    const file = fileInput.files[0];
    
    if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            parseAndAddStudents(content);
        };
        reader.readAsText(file, 'UTF-8');
    } else {
        alert('Lütfen .txt uzantılı bir dosya seçin.');
    }
}

function parseAndAddStudents(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const newStudents = [];
    
    lines.forEach(line => {
        const parts = line.trim().split('\t');
        if (parts.length >= 2) {
            const number = parts[0].trim();
            const name = parts[1].trim();
            if (number && name) {
                newStudents.push({
                    number: number,
                    name: name,
                    id: Date.now() + Math.random()
                });
            }
        }
    });
    
    if (newStudents.length > 0) {
        const classItem = appState.schools[appState.selectedSchoolIndex].classes[appState.selectedClassIndex];
        if (!classItem.students) classItem.students = [];
        classItem.students.push(...newStudents);
        
        updateStudentsList();
        saveAppState();
        alert(`${newStudents.length} öğrenci başarıyla eklendi.`);
    } else {
        alert('Dosyada geçerli öğrenci bilgisi bulunamadı. Format: Numara[TAB]Ad Soyad');
    }
}

function updateStudentsList() {
    if (appState.selectedSchoolIndex === null || appState.selectedClassIndex === null) return;
    
    const classItem = appState.schools[appState.selectedSchoolIndex].classes[appState.selectedClassIndex];
    const students = classItem.students || [];
    const studentsList = document.getElementById('students-list');
    const studentsCount = document.getElementById('students-count');
    
    studentsCount.textContent = students.length;
    
    if (students.length === 0) {
        studentsList.innerHTML = '<div class="list-item" style="font-style: italic; color: #666;">Bu sınıfta henüz öğrenci bulunmuyor.</div>';
        return;
    }
    
    studentsList.innerHTML = students.map(student => `
        <div class="student-item">
            <div class="student-info">
                <span class="student-number">#${student.number}</span>
                <span class="student-name">${student.name}</span>
            </div>
            <button class="small-button delete-button" onclick="deleteStudent(${student.id})">
                Sil
            </button>
        </div>
    `).join('');
}

// Sınav yönetimi
function updateExamSchools() {
    const select = document.getElementById('exam-school');
    select.innerHTML = '<option value="">Okul seçiniz...</option>' +
        appState.schools.map((school, index) => 
            `<option value="${index}">${school.name}</option>`
        ).join('');
}

function updateExamClasses() {
    const schoolIndex = document.getElementById('exam-school').value;
    const classSelect = document.getElementById('exam-class');
    
    if (schoolIndex === '') {
        classSelect.innerHTML = '<option value="">Sınıf seçiniz...</option>';
        classSelect.disabled = true;
        return;
    }
    
    const school = appState.schools[parseInt(schoolIndex)];
    classSelect.disabled = false;
    classSelect.innerHTML = '<option value="">Sınıf seçiniz...</option>' +
        school.classes.map((classItem, index) => 
            `<option value="${index}">${classItem.name}</option>`
        ).join('');
}

function updateExamCriteria() {
    const grade = document.getElementById('exam-grade').value;
    const criteriaSection = document.getElementById('criteria-selection-section');
    const criteriaDiv = document.getElementById('criteria-selection');
    
    if (grade === '') {
        criteriaSection.classList.add('hidden');
        return;
    }
    
    const criteria = appState.criteriaByGrade[grade] || [];
    
    if (criteria.length === 0) {
        criteriaSection.classList.add('hidden');
        alert(`${grade}. sınıf için henüz kriter eklenmemiş. Lütfen önce kriterler bölümünden kriter ekleyiniz.`);
        return;
    }
    
    criteriaSection.classList.remove('hidden');
    appState.selectedCriteria = [];
    appState.selectedCriteriaWithDeadlines = [];
    
    criteriaDiv.innerHTML = criteria.map((criteria, index) => `
        <div class="criteria-with-deadline">
            <div class="criteria-checkbox-with-date" onclick="toggleCriteriaWithDeadline('${criteria}', ${index})">
                <input type="checkbox" id="criteria-${index}">
                <span>${criteria}</span>
                <input type="date" id="deadline-${index}" class="date-input" onclick="event.stopPropagation()" onchange="updateCriteriaDeadline('${criteria}', ${index})">
            </div>
        </div>
    `).join('');
    
    updateSelectedCriteriaCount();
    updateExamSummary();
}

function toggleCriteriaWithDeadline(criteria, index) {
    const checkbox = document.getElementById(`criteria-${index}`);
    const criteriaDiv = checkbox.parentElement;
    const deadlineInput = document.getElementById(`deadline-${index}`);
    
    if (appState.selectedCriteria.includes(criteria)) {
        // Remove criteria
        appState.selectedCriteria = appState.selectedCriteria.filter(c => c !== criteria);
        appState.selectedCriteriaWithDeadlines = appState.selectedCriteriaWithDeadlines.filter(c => c.criteria !== criteria);
        checkbox.checked = false;
        criteriaDiv.classList.remove('selected');
        deadlineInput.value = '';
    } else {
        // Add criteria
        appState.selectedCriteria.push(criteria);
        appState.selectedCriteriaWithDeadlines.push({
            criteria: criteria,
            deadline: deadlineInput.value || ''
        });
        checkbox.checked = true;
        criteriaDiv.classList.add('selected');
    }
    
    updateSelectedCriteriaCount();
    updateExamSummary();
}

function updateCriteriaDeadline(criteria, index) {
    const deadlineInput = document.getElementById(`deadline-${index}`);
    const deadlineValue = deadlineInput.value;
    
    // Update the deadline in selectedCriteriaWithDeadlines
    const criteriaItem = appState.selectedCriteriaWithDeadlines.find(c => c.criteria === criteria);
    if (criteriaItem) {
        criteriaItem.deadline = deadlineValue;
        updateExamSummary();
    }
}

function updateSelectedCriteriaCount() {
    document.getElementById('selected-criteria-count').textContent = appState.selectedCriteria.length;
}

function updateExamSummary() {
    const examName = document.getElementById('exam-name').value;
    const schoolIndex = document.getElementById('exam-school').value;
    const semester = document.getElementById('exam-semester').value;
    const classIndex = document.getElementById('exam-class').value;
    const grade = document.getElementById('exam-grade').value;
    
    const summaryDiv = document.getElementById('exam-summary');
    const summaryContent = document.getElementById('exam-summary-content');
    
    if (examName && schoolIndex !== '' && semester && classIndex !== '' && grade && appState.selectedCriteriaWithDeadlines.length > 0) {
        const school = appState.schools[parseInt(schoolIndex)];
        const classItem = school.classes[parseInt(classIndex)];
        
        const criteriaList = appState.selectedCriteriaWithDeadlines.map(c => 
            `<li>${c.criteria} ${c.deadline ? `(Son Teslim: ${c.deadline})` : ''}</li>`
        ).join('');
        
        summaryDiv.classList.remove('hidden');
        summaryContent.innerHTML = `
            <p><strong>Sınav Adı:</strong> ${examName}</p>
            <p><strong>Okul:</strong> ${school.name}</p>
            <p><strong>Dönem:</strong> ${semester}. DÖNEM</p>
            <p><strong>Sınıf:</strong> ${classItem.name}</p>
            <p><strong>Seviye:</strong> ${grade}. Sınıf</p>
            <p><strong>Seçilen Kriterler (${appState.selectedCriteriaWithDeadlines.length}):</strong></p>
            <ul>${criteriaList}</ul>
        `;
    } else {
        summaryDiv.classList.add('hidden');
    }
}

function createExam() {
    const examName = document.getElementById('exam-name').value.trim();
    const schoolIndex = document.getElementById('exam-school').value;
    const semester = document.getElementById('exam-semester').value;
    const classIndex = document.getElementById('exam-class').value;
    const grade = document.getElementById('exam-grade').value;
    
    if (examName && schoolIndex !== '' && semester && classIndex !== '' && grade && appState.selectedCriteriaWithDeadlines.length > 0) {
        const school = appState.schools[parseInt(schoolIndex)];
        const classItem = school.classes[parseInt(classIndex)];
        
        const newExam = {
            id: Date.now(),
            name: examName,
            school: school.name,
            schoolIndex: parseInt(schoolIndex),
            semester: semester,
            class: classItem.name,
            classIndex: parseInt(classIndex),
            grade: grade,
            criteriaWithDeadlines: [...appState.selectedCriteriaWithDeadlines],
            students: [...(classItem.students || [])],
            scores: {},
            createdAt: new Date().toLocaleDateString('tr-TR')
        };
        
        // Initialize scores for all students
        newExam.students.forEach(student => {
            newExam.scores[student.id] = {};
            newExam.criteriaWithDeadlines.forEach(criteria => {
                newExam.scores[student.id][criteria.criteria] = null; // null = not scored yet
            });
        });
        
        appState.exams.push(newExam);
        
        // Formu temizle
        document.getElementById('exam-name').value = '';
        document.getElementById('exam-school').value = '';
        document.getElementById('exam-semester').value = '';
        document.getElementById('exam-class').value = '';
        document.getElementById('exam-grade').value = '';
        document.getElementById('exam-class').disabled = true;
        document.getElementById('criteria-selection-section').classList.add('hidden');
        document.getElementById('exam-summary').classList.add('hidden');
        appState.selectedCriteria = [];
        appState.selectedCriteriaWithDeadlines = [];
        
        updateExamsList();
        saveAppState();
        alert('Sınav başarıyla oluşturuldu!');
    } else {
        alert('Lütfen tüm alanları doldurun, dönem seçin ve en az bir kriter seçin.');
    }
}

function updateExamsList() {
    const examsListContainer = document.getElementById('exams-list-container');
    const examsList = document.getElementById('exams-list');
    const examsCount = document.getElementById('exams-count');
    
    examsCount.textContent = appState.exams.length;
    
    if (appState.exams.length === 0) {
        examsListContainer.classList.add('hidden');
        return;
    }
    
    examsListContainer.classList.remove('hidden');
    examsList.innerHTML = appState.exams.map(exam => `
        <div class="list-item">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${exam.name}</strong><br/>
                    <small>${exam.school} - ${exam.class} (${exam.grade}. Sınıf) - ${exam.semester}. DÖNEM - ${exam.criteriaWithDeadlines.length} kriter</small><br/>
                    <small style="color: #666;">Oluşturulma: ${exam.createdAt}</small>
                </div>
            </div>
        </div>
    `).join('');
}

function updateMyExamsList() {
    const examsList = document.getElementById('my-exams-list');
    const examsCount = document.getElementById('my-exams-count');
    
    examsCount.textContent = appState.exams.length;
    
    if (appState.exams.length === 0) {
        examsList.innerHTML = '<div class="list-item" style="font-style: italic; color: #666;">Henüz sınav oluşturulmamış.</div>';
        return;
    }
    
    examsList.innerHTML = appState.exams.map(exam => `
        <div class="list-item" style="cursor: pointer;" onclick="openExamScoring(${exam.id})">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${exam.class} ${exam.semester}. DÖNEM ${exam.name}</strong><br/>
                    <small>${exam.school} - ${exam.grade}. Sınıf - ${exam.criteriaWithDeadlines.length} kriter - ${exam.students.length} öğrenci</small><br/>
                    <small style="color: #666;">Oluşturulma: ${exam.createdAt}</small>
                </div>
                <div style="color: #667eea;">
                    <span style="font-size: 24px;">▶</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateReportExamSelect() {
    const select = document.getElementById('report-exam-select');
    select.innerHTML = '<option value="">Rapor alınacak sınavı seçiniz...</option>' +
        appState.exams.map((exam, index) => 
            `<option value="${index}">${exam.class} ${exam.semester}. DÖNEM ${exam.name} - ${exam.school}</option>`
        ).join('');
}

function openExamScoring(examId) {
    const exam = appState.exams.find(e => e.id === examId);
    if (!exam) return;
    
    appState.currentExam = exam;
    document.getElementById('scoring-exam-title').textContent = 
        `${exam.class} ${exam.semester}. DÖNEM ${exam.name} - Puanlama`;
    
    createScoringTable(exam);
    navigateTo('sinav-puanlama');
}

function createScoringTable(exam) {
    const container = document.getElementById('scoring-table-container');
    
    if (exam.students.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center;">Bu sınıfta öğrenci bulunmuyor.</p>';
        return;
    }
    
    const headerCells = exam.criteriaWithDeadlines.map(c => 
        `<th style="min-width: 120px;">
            ${c.criteria}<br/>
            <small>(${c.deadline || 'Tarih yok'})<br/>(20 puan)</small>
        </th>`
    ).join('');
    
    const studentRows = exam.students.map(student => {
        const criteriaCells = exam.criteriaWithDeadlines.map(criteria => {
            const currentScore = exam.scores[student.id][criteria.criteria];
            return `
                <td>
                    <div class="score-buttons">
                        <button class="score-btn g ${currentScore === 10 ? 'selected' : ''}" 
                                onclick="setStudentScore(${student.id}, '${criteria.criteria}', 10)">G</button>
                        <button class="score-btn iyi ${currentScore === 15 ? 'selected' : ''}" 
                                onclick="setStudentScore(${student.id}, '${criteria.criteria}', 15)">İYİ</button>
                        <button class="score-btn ci ${currentScore === 20 ? 'selected' : ''}" 
                                onclick="setStudentScore(${student.id}, '${criteria.criteria}', 20)">Çİ</button>
                    </div>
                </td>
            `;
        }).join('');
        
        const totalScore = Object.values(exam.scores[student.id]).reduce((sum, score) => {
            return sum + (score || 0);
        }, 0);
        
        return `
            <tr>
                <td class="student-number">${student.number}</td>
                <td class="student-name">${student.name}</td>
                ${criteriaCells}
                <td class="total-score">${totalScore}</td>
            </tr>
        `;
    }).join('');
    
    container.innerHTML = `
        <table class="scoring-table">
            <thead>
                <tr>
                    <th>OKUL NO</th>
                    <th>AD SOYAD</th>
                    ${headerCells}
                    <th>TOPLAM</th>
                </tr>
            </thead>
            <tbody>
                ${studentRows}
            </tbody>
        </table>
    `;
}

function setStudentScore(studentId, criteria, score) {
    if (!appState.currentExam) return;
    
    // Sanitize criteria to prevent XSS
    const safeCriteria = criteria.replace(/'/g, "&#x27;");
    
    // Update score in current exam
    appState.currentExam.scores[studentId][criteria] = score;
    
    // Update score in stored exams
    const examIndex = appState.exams.findIndex(e => e.id === appState.currentExam.id);
    if (examIndex !== -1) {
        appState.exams[examIndex].scores[studentId][criteria] = score;
    }
    
    // Recreate the table to show updated scores
    createScoringTable(appState.currentExam);
    saveAppState();
}

function saveExamScores() {
    saveAppState();
    alert('Puanlar başarıyla kaydedildi!');
}

function updateReportPreview() {
    const examIndex = document.getElementById('report-exam-select').value;
    const previewDiv = document.getElementById('report-preview');
    const contentDiv = document.getElementById('report-content');
    
    if (examIndex === '') {
        previewDiv.classList.add('hidden');
        return;
    }
    
    const exam = appState.exams[parseInt(examIndex)];
    if (!exam) return;
    
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    const headerCells = exam.criteriaWithDeadlines.map(c => 
        `<th style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: top;">
            ${c.criteria}<br/>
            ${c.deadline || '..../..../.....'}'
        </th>`
    ).join('');
    
    const scoringCells = exam.criteriaWithDeadlines.map(() => 
        `<th style="border: 1px solid #000; padding: 4px;">
            <div style="display: flex; justify-content: space-around;">
                <span>G</span><span>İYİ</span><span>Çİ</span>
            </div>
        </th>`
    ).join('');
    
    const studentRows = exam.students.map(student => {
        const criteriaCells = exam.criteriaWithDeadlines.map(criteria => {
            const score = exam.scores[student.id][criteria.criteria];
            const gMark = score === 10 ? '●' : '○';
            const iyiMark = score === 15 ? '●' : '○';
            const ciMark = score === 20 ? '●' : '○';
            
            return `
                <td style="border: 1px solid #000; padding: 4px;">
                    <div style="display: flex; justify-content: space-around;">
                        <span>${gMark}</span><span>${iyiMark}</span><span>${ciMark}</span>
                    </div>
                </td>
            `;
        }).join('');
        
        const totalScore = Object.values(exam.scores[student.id]).reduce((sum, score) => {
            return sum + (score || 0);
        }, 0);
        
        return `
            <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${student.number}</td>
                <td style="border: 1px solid #000; padding: 8px;">${student.name}</td>
                ${criteriaCells}
                <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">${totalScore}</td>
            </tr>
        `;
    }).join('');
    
    contentDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14px;">
            ${currentYear} – ${nextYear} EĞİTİM ÖĞRETİM YILI ${exam.school} ${exam.class} SINIFI ${exam.semester}. DÖNEM ${exam.name}
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: Arial, sans-serif;">
            <thead>
                <tr>
                    <th rowspan="2" style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">OKUL NO</th>
                    <th rowspan="2" style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">AD SOYAD</th>
                    ${headerCells}
                    <th rowspan="2" style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">TOPLAM</th>
                </tr>
                <tr>
                    ${scoringCells}
                </tr>
            </thead>
            <tbody>
                ${studentRows}
            </tbody>
        </table>
        
        <div style="margin-top: 20px; font-size: 12px;">
            <strong>G: 10 PUAN &nbsp;&nbsp; İYİ: 15 PUAN &nbsp;&nbsp; Çİ: 20 PUAN</strong>
        </div>
    `;
    
    previewDiv.classList.remove('hidden');
}

function exportToWord() {
    const examIndex = document.getElementById('report-exam-select').value;
    if (examIndex === '') {
        alert('Lütfen önce bir sınav seçin.');
        return;
    }
    
    const exam = appState.exams[parseInt(examIndex)];
    const content = document.getElementById('report-content').innerHTML;
    
    // Create a complete HTML document for Word export
    const fullContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${exam.class} ${exam.semester}. DÖNEM ${exam.name}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #000; padding: 4px; text-align: center; }
                .student-name { text-align: left; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `;
    
    // Create and download the file
    const blob = new Blob([fullContent], { type: 'application/msword' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.class}_${exam.semester}_DONEM_${exam.name}_SINAV_RAPORU.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('Rapor başarıyla indirildi!');
}

// Enter tuşu ile form gönderme
document.addEventListener('DOMContentLoaded', async function() {
    // Database + Local Storage'dan veriyi yükle
    await loadAppState();
    
    // Enter tuşu event listeners
    document.getElementById('school-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addSchool();
    });
    
    document.getElementById('class-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addClass();
    });
    
    document.getElementById('criteria-text').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addCriteria();
    });
    
    document.getElementById('student-number').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('student-name').focus();
        }
    });
    
    document.getElementById('student-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addStudent();
    });
    
    // Sınav formu değişiklik dinleyicileri
    document.getElementById('exam-name').addEventListener('input', updateExamSummary);
    document.getElementById('exam-school').addEventListener('change', updateExamSummary);
    document.getElementById('exam-semester').addEventListener('change', updateExamSummary);
    document.getElementById('exam-class').addEventListener('change', updateExamSummary);
    document.getElementById('exam-grade').addEventListener('change', updateExamSummary);
    
    // İlk sayfa yüklemesi
    navigateTo('anasayfa');
});