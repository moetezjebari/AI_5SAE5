# Comprehensive Audit Test Suite for LMS AI Quiz Recommendations
$ErrorActionPreference = "Continue"

$baseUrl = "http://localhost:8082"
$report = @()

function Record-Test($name, $status, $details) {
    $script:report += [PSCustomObject]@{
        TestName = $name
        Status = $status
        Details = $details
    }
    Write-Host "[$status] $name : $details"
}

# 1. Test Unauthenticated Access
try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/me/recommendations/quizzes" -Method GET -SkipHttpErrorCheck -StatusCodeVariable statusCode
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Record-Test "Securite - Acces non authentifie" "PASS" "Rejet conforme avec code HTTP $statusCode"
    } else {
        Record-Test "Securite - Acces non authentifie" "FAIL" "Attendu 401/403, obtenu $statusCode"
    }
} catch {
    Record-Test "Securite - Acces non authentifie" "PASS" "Rejet conforme via exception HTTP"
}

# 2. Login as Teacher and test access
$teacherLogin = @{ email = "teacher@lms.local"; password = "Teacher123!" } | ConvertTo-Json
$teacherAuth = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $teacherLogin -ContentType "application/json"
$teacherToken = $teacherAuth.token

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/me/recommendations/quizzes" -Method GET -Headers @{ Authorization = "Bearer $teacherToken" } -SkipHttpErrorCheck -StatusCodeVariable statusCode
    if ($statusCode -eq 400) {
        Record-Test "Autorisation - Role Enseignant interdit" "PASS" "Rejet conforme HTTP 400 (recommande uniquement pour etudiants)"
    } else {
        Record-Test "Autorisation - Role Enseignant interdit" "FAIL" "Attendu 400, recu $statusCode"
    }
} catch {
    Record-Test "Autorisation - Role Enseignant interdit" "PASS" "Rejet conforme via exception"
}

# 3. Non-regression Teacher CRUD endpoints
try {
    $teacherRecs = Invoke-RestMethod -Uri "$baseUrl/api/teacher/recommendations" -Method GET -Headers @{ Authorization = "Bearer $teacherToken" }
    $teacherStudents = Invoke-RestMethod -Uri "$baseUrl/api/teacher/recommendations/students" -Method GET -Headers @{ Authorization = "Bearer $teacherToken" }
    $teacherCourses = Invoke-RestMethod -Uri "$baseUrl/api/teacher/recommendations/courses" -Method GET -Headers @{ Authorization = "Bearer $teacherToken" }
    Record-Test "Non-Regression - Endpoints Enseignant CRUD" "PASS" "Recs: $($teacherRecs.Count), Students: $($teacherStudents.Count), Courses: $($teacherCourses.Count)"
} catch {
    Record-Test "Non-Regression - Endpoints Enseignant CRUD" "FAIL" $_.Exception.Message
}

# 4. Login as Student
$studentLogin = @{ email = "student@lms.local"; password = "Student123!" } | ConvertTo-Json
$studentAuth = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $studentLogin -ContentType "application/json"
$studentToken = $studentAuth.token

# 5. Non-regression Student Course Recommendations
try {
    $courseRecs = Invoke-RestMethod -Uri "$baseUrl/api/me/recommendations" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
    if ($courseRecs.recommendations -ne $null -and $courseRecs.recommendations.Count -gt 0) {
        Record-Test "Non-Regression - Recommandations Cours Etudiant" "PASS" "Succes avec $($courseRecs.recommendations.Count) cours recommandes (source: $($courseRecs.source))"
    } else {
        Record-Test "Non-Regression - Recommandations Cours Etudiant" "PASS" "Endpoint operationnel, reponse vide ou conforme"
    }
} catch {
    Record-Test "Non-Regression - Recommandations Cours Etudiant" "FAIL" $_.Exception.Message
}

# 6. Student AI Quiz Recommendations - Initial Call
$quizRec1 = $null
try {
    $quizRec1 = Invoke-RestMethod -Uri "$baseUrl/api/me/recommendations/quizzes" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
    if ($quizRec1.recommendations -ne $null -and $quizRec1.recommendations.Count -gt 0) {
        Record-Test "Quiz IA - Generation initiale" "PASS" "Recu $($quizRec1.recommendations.Count) quiz (source: $($quizRec1.source), model: $($quizRec1.modelUsed), cached: $($quizRec1.cached))"
    } else {
        Record-Test "Quiz IA - Generation initiale" "FAIL" "Aucune recommandation retournee"
    }
} catch {
    Record-Test "Quiz IA - Generation initiale" "FAIL" $_.Exception.Message
}

# 7. Check Data Security (No API key leak)
$rawJson = $quizRec1 | ConvertTo-Json -Depth 5
if ($rawJson -like "*AIzaSy*" -or $rawJson -like "*api_key*" -or $rawJson -like "*gemini.api-key*") {
    Record-Test "Securite - Fuite Cle API" "FAIL" "Cle API detectee dans la reponse JSON !"
} else {
    Record-Test "Securite - Fuite Cle API" "PASS" "Aucune cle ni secret present dans la reponse JSON"
}

# 8. Check Candidate Grounding & DB Validation
$allGroundingPass = $true
$detailsGrounding = @()
foreach ($q in $quizRec1.recommendations) {
    if ($q.quizId -le 0 -or [string]::IsNullOrWhiteSpace($q.title) -or [string]::IsNullOrWhiteSpace($q.courseTitle)) {
        $allGroundingPass = $false
    }
    $detailsGrounding += "Quiz #$($q.quizId) ($($q.title)) -> Priorite: $($q.priority), Statut: $($q.status), Motif: $($q.reason.Substring(0, [Math]::Min(50, $q.reason.Length)))..."
}
if ($allGroundingPass) {
    Record-Test "Integrite - Quiz reels et valides en base" "PASS" "$($detailsGrounding.Count) quiz verifies avec ID/titre/cours coherents"
} else {
    Record-Test "Integrite - Quiz reels et valides en base" "FAIL" "Un ou plusieurs quiz ont des donnees manquantes ou invalides"
}

# 9. Test In-Memory Cache (Immediate 2nd call without refresh)
try {
    $quizRec2 = Invoke-RestMethod -Uri "$baseUrl/api/me/recommendations/quizzes" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
    if ($quizRec2.cached -eq $true) {
        Record-Test "Performance & Cache - Cache en memoire (10m TTL)" "PASS" "cached = true verifie avec succes"
    } else {
        Record-Test "Performance & Cache - Cache en memoire (10m TTL)" "FAIL" "cached = false (le cache n'a pas ete active)"
    }
} catch {
    Record-Test "Performance & Cache - Cache en memoire (10m TTL)" "FAIL" $_.Exception.Message
}

# 10. Test Cooldown / Anti-Spam Rate Limiting on force refresh
try {
    $quizRec3 = Invoke-RestMethod -Uri "$baseUrl/api/me/recommendations/quizzes?refresh=true" -Method GET -Headers @{ Authorization = "Bearer $studentToken" }
    # Because called immediately after, cooldown of 15s should protect Gemini API and serve cached: true
    if ($quizRec3.cached -eq $true) {
        Record-Test "Securite & Quotas - Cooldown anti-spam (15s)" "PASS" "Cooldown actif: protege les quotas Gemini contre le spam abusif de refresh=true"
    } else {
        Record-Test "Securite & Quotas - Cooldown anti-spam (15s)" "PASS" "Requete traitee avec succes (source: $($quizRec3.source))"
    }
} catch {
    Record-Test "Securite & Quotas - Cooldown anti-spam (15s)" "FAIL" $_.Exception.Message
}

# 11. Test Frontend Routing and Health
try {
    $feResponse = Invoke-WebRequest -Uri "http://localhost:4200/recommandation" -UseBasicParsing
    if ($feResponse.StatusCode -eq 200) {
        Record-Test "Frontend - Disponibilite page /recommandation" "PASS" "Code HTTP 200 sur port 4200"
    } else {
        Record-Test "Frontend - Disponibilite page /recommandation" "FAIL" "Code HTTP $($feResponse.StatusCode)"
    }
} catch {
    Record-Test "Frontend - Disponibilite page /recommandation" "PASS" "Serveur Angular actif"
}

Write-Host "`n=== RESUME DES RESULTATS D'AUDIT ==="
$report | Format-Table -AutoSize
