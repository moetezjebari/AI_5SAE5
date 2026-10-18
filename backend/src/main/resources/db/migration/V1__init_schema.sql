-- Core schema for the Student Performance Tracking & AI Recommendations module.

CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(190) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            ENUM('STUDENT', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE courses (
    id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title                       VARCHAR(200) NOT NULL,
    description                 TEXT,
    subject                     VARCHAR(100) NOT NULL,
    level                       ENUM('DEBUTANT', 'INTERMEDIAIRE', 'AVANCE') NOT NULL DEFAULT 'DEBUTANT',
    estimated_duration_minutes  INT NOT NULL DEFAULT 0,
    status                      ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_by                  BIGINT NOT NULL,
    created_at                  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_courses_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_subject ON courses(subject);
CREATE INDEX idx_courses_level ON courses(level);

CREATE TABLE course_lessons (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id           BIGINT NOT NULL,
    title               VARCHAR(200) NOT NULL,
    content             MEDIUMTEXT,
    topic               VARCHAR(150),
    duration_minutes    INT NOT NULL DEFAULT 0,
    position            INT NOT NULL DEFAULT 0,
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_lessons_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_lessons_course ON course_lessons(course_id, position);

CREATE TABLE quizzes (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    course_id           BIGINT NOT NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    difficulty          ENUM('FACILE', 'MOYEN', 'DIFFICILE') NOT NULL DEFAULT 'MOYEN',
    duration_minutes    INT NOT NULL DEFAULT 10,
    passing_score       DECIMAL(5,2) NOT NULL DEFAULT 50.00,
    status              ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    created_by          BIGINT NOT NULL,
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_quizzes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_quizzes_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE INDEX idx_quizzes_course ON quizzes(course_id);
CREATE INDEX idx_quizzes_status ON quizzes(status);

CREATE TABLE quiz_questions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    quiz_id         BIGINT NOT NULL,
    question_text   TEXT NOT NULL,
    question_type   ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE') NOT NULL DEFAULT 'SINGLE_CHOICE',
    topic           VARCHAR(150),
    points          INT NOT NULL DEFAULT 1,
    position        INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id, position);
CREATE INDEX idx_questions_topic ON quiz_questions(topic);

CREATE TABLE quiz_options (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id     BIGINT NOT NULL,
    option_text     TEXT NOT NULL,
    is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
    position        INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_options_question ON quiz_options(question_id, position);

CREATE TABLE quiz_attempts (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id              BIGINT NOT NULL,
    quiz_id                 BIGINT NOT NULL,
    score                   DECIMAL(6,2),
    total_possible_score    DECIMAL(6,2),
    correct_count           INT,
    status                  ENUM('IN_PROGRESS', 'SUBMITTED') NOT NULL DEFAULT 'IN_PROGRESS',
    started_at              DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    submitted_at            DATETIME(6),
    time_spent_seconds      INT,
    CONSTRAINT fk_attempts_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
) ENGINE=InnoDB;

CREATE INDEX idx_attempts_student ON quiz_attempts(student_id, started_at);
CREATE INDEX idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_student_quiz ON quiz_attempts(student_id, quiz_id, status);

CREATE TABLE quiz_answers (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    attempt_id      BIGINT NOT NULL,
    question_id     BIGINT NOT NULL,
    is_correct      BOOLEAN,
    points_earned   DECIMAL(6,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id),
    CONSTRAINT uq_answer_attempt_question UNIQUE (attempt_id, question_id)
) ENGINE=InnoDB;

CREATE INDEX idx_answers_attempt ON quiz_answers(attempt_id);

CREATE TABLE quiz_answer_selected_options (
    answer_id       BIGINT NOT NULL,
    option_id       BIGINT NOT NULL,
    PRIMARY KEY (answer_id, option_id),
    CONSTRAINT fk_selected_answer FOREIGN KEY (answer_id) REFERENCES quiz_answers(id) ON DELETE CASCADE,
    CONSTRAINT fk_selected_option FOREIGN KEY (option_id) REFERENCES quiz_options(id)
) ENGINE=InnoDB;

CREATE TABLE student_course_progress (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id          BIGINT NOT NULL,
    course_id           BIGINT NOT NULL,
    status              ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
    progress_percent    DECIMAL(5,2) NOT NULL DEFAULT 0,
    started_at          DATETIME(6),
    completed_at        DATETIME(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_progress_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_progress_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT uq_progress_student_course UNIQUE (student_id, course_id)
) ENGINE=InnoDB;

CREATE INDEX idx_progress_student ON student_course_progress(student_id, status);

CREATE TABLE student_lesson_progress (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT NOT NULL,
    lesson_id       BIGINT NOT NULL,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at    DATETIME(6),
    CONSTRAINT fk_lesson_progress_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
    CONSTRAINT uq_lesson_progress UNIQUE (student_id, lesson_id)
) ENGINE=InnoDB;

CREATE TABLE learning_activities (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id      BIGINT NOT NULL,
    activity_type   ENUM('COURSE_STARTED', 'LESSON_COMPLETED', 'COURSE_COMPLETED', 'QUIZ_ATTEMPTED') NOT NULL,
    course_id       BIGINT,
    quiz_id         BIGINT,
    lesson_id       BIGINT,
    description     VARCHAR(255),
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_activities_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_activities_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    CONSTRAINT fk_activities_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE SET NULL,
    CONSTRAINT fk_activities_lesson FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_activities_student ON learning_activities(student_id, created_at);
