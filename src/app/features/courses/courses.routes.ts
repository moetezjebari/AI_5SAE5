import { Routes } from '@angular/router';

export const COURSES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/courses-page').then(m => m.CoursesPage) },
  { path: 'create', loadComponent: () => import('./pages/course-edit-page').then(m => m.CourseEditPage) },
  { path: ':id/edit', loadComponent: () => import('./pages/course-edit-page').then(m => m.CourseEditPage) },
  { path: 'summary', loadComponent: () => import('./pages/course-summary-page').then(m => m.CourseSummaryPage) },
  { path: ':id', loadComponent: () => import('./pages/course-detail-page').then(m => m.CourseDetailPage) }
];
