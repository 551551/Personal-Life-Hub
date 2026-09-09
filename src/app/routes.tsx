import { lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { AppShell } from '../components/layout/AppShell'

const HomePage = lazy(() => import('../features/home/HomePage').then((module) => ({ default: module.HomePage })))
const TodayPage = lazy(() => import('../features/today/TodayPage').then((module) => ({ default: module.TodayPage })))
const MediaPage = lazy(() => import('../features/media/MediaPage').then((module) => ({ default: module.MediaPage })))
const ResearchPage = lazy(() => import('../features/research/ResearchPage').then((module) => ({ default: module.ResearchPage })))
const FitnessPage = lazy(() => import('../features/fitness/FitnessPage').then((module) => ({ default: module.FitnessPage })))
const DietPage = lazy(() => import('../features/diet/DietPage').then((module) => ({ default: module.DietPage })))
const LeisurePage = lazy(() => import('../features/leisure/LeisurePage').then((module) => ({ default: module.LeisurePage })))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })))

export function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="today/:date?" element={<TodayPage />} />
          <Route path="media/:contentId?" element={<MediaPage />} />
          <Route path="research/:projectId?" element={<ResearchPage />} />
          <Route path="fitness/:date?" element={<FitnessPage />} />
          <Route path="diet/:date?" element={<DietPage />} />
          <Route path="leisure" element={<LeisurePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
