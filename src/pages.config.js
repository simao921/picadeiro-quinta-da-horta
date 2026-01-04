import AdminAI from './pages/AdminAI';
import AdminBlockedSlots from './pages/AdminBlockedSlots';
import AdminContent from './pages/AdminContent';
import AdminCoupons from './pages/AdminCoupons';
import AdminDashboard from './pages/AdminDashboard';
import AdminEmails from './pages/AdminEmails';
import AdminGallery from './pages/AdminGallery';
import AdminInstructors from './pages/AdminInstructors';
import AdminLessons from './pages/AdminLessons';
import AdminLogin from './pages/AdminLogin';
import AdminMessages from './pages/AdminMessages';
import AdminNotifications from './pages/AdminNotifications';
import AdminOrders from './pages/AdminOrders';
import AdminPayments from './pages/AdminPayments';
import AdminPicadeiroStudents from './pages/AdminPicadeiroStudents';
import AdminRegulations from './pages/AdminRegulations';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminShop from './pages/AdminShop';
import AdminStudentSchedules from './pages/AdminStudentSchedules';
import AdminStudents from './pages/AdminStudents';
import AdminUsers from './pages/AdminUsers';
import Bookings from './pages/Bookings';
import Cart from './pages/Cart';
import ClientDashboard from './pages/ClientDashboard';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Services from './pages/Services';
import Shop from './pages/Shop';
import UserPreferences from './pages/UserPreferences';
import Wishlist from './pages/Wishlist';
import StaffLogin from './pages/StaffLogin';
import DeveloperLogin from './pages/DeveloperLogin';
import StaffDashboard from './pages/StaffDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAI": AdminAI,
    "AdminBlockedSlots": AdminBlockedSlots,
    "AdminContent": AdminContent,
    "AdminCoupons": AdminCoupons,
    "AdminDashboard": AdminDashboard,
    "AdminEmails": AdminEmails,
    "AdminGallery": AdminGallery,
    "AdminInstructors": AdminInstructors,
    "AdminLessons": AdminLessons,
    "AdminLogin": AdminLogin,
    "AdminMessages": AdminMessages,
    "AdminNotifications": AdminNotifications,
    "AdminOrders": AdminOrders,
    "AdminPayments": AdminPayments,
    "AdminPicadeiroStudents": AdminPicadeiroStudents,
    "AdminRegulations": AdminRegulations,
    "AdminReports": AdminReports,
    "AdminSettings": AdminSettings,
    "AdminShop": AdminShop,
    "AdminStudentSchedules": AdminStudentSchedules,
    "AdminStudents": AdminStudents,
    "AdminUsers": AdminUsers,
    "Bookings": Bookings,
    "Cart": Cart,
    "ClientDashboard": ClientDashboard,
    "Contact": Contact,
    "Gallery": Gallery,
    "Home": Home,
    "ProductDetail": ProductDetail,
    "Services": Services,
    "Shop": Shop,
    "UserPreferences": UserPreferences,
    "Wishlist": Wishlist,
    "StaffLogin": StaffLogin,
    "DeveloperLogin": DeveloperLogin,
    "StaffDashboard": StaffDashboard,
    "DeveloperDashboard": DeveloperDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};