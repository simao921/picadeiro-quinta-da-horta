/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAI from './pages/AdminAI';
import AdminBlockedSlots from './pages/AdminBlockedSlots';
import AdminContent from './pages/AdminContent';
import AdminDashboard from './pages/AdminDashboard';
import AdminEmails from './pages/AdminEmails';
import AdminGallery from './pages/AdminGallery';
import AdminInstructors from './pages/AdminInstructors';
import AdminLogin from './pages/AdminLogin';
import AdminNotifications from './pages/AdminNotifications';
import AdminPayments from './pages/AdminPayments';
import AdminPicadeiroStudents from './pages/AdminPicadeiroStudents';
import AdminRegulations from './pages/AdminRegulations';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminStudentSchedules from './pages/AdminStudentSchedules';
import AdminStudents from './pages/AdminStudents';
import AdminUsers from './pages/AdminUsers';
import Bookings from './pages/Bookings';
import ClientDashboard from './pages/ClientDashboard';
import DeveloperPanel from './pages/DeveloperPanel';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Services from './pages/Services';
import UserPreferences from './pages/UserPreferences';
import AdminImages from './pages/AdminImages';
import AdminLessons from './pages/AdminLessons';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAI": AdminAI,
    "AdminBlockedSlots": AdminBlockedSlots,
    "AdminContent": AdminContent,
    "AdminDashboard": AdminDashboard,
    "AdminEmails": AdminEmails,
    "AdminGallery": AdminGallery,
    "AdminInstructors": AdminInstructors,
    "AdminLogin": AdminLogin,
    "AdminNotifications": AdminNotifications,
    "AdminPayments": AdminPayments,
    "AdminPicadeiroStudents": AdminPicadeiroStudents,
    "AdminRegulations": AdminRegulations,
    "AdminReports": AdminReports,
    "AdminSettings": AdminSettings,
    "AdminStudentSchedules": AdminStudentSchedules,
    "AdminStudents": AdminStudents,
    "AdminUsers": AdminUsers,
    "Bookings": Bookings,
    "ClientDashboard": ClientDashboard,
    "DeveloperPanel": DeveloperPanel,
    "Gallery": Gallery,
    "Home": Home,
    "ProductDetail": ProductDetail,
    "Services": Services,
    "UserPreferences": UserPreferences,
    "AdminImages": AdminImages,
    "AdminLessons": AdminLessons,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};