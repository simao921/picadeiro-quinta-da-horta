import AdminAI from './pages/AdminAI';
import AdminContent from './pages/AdminContent';
import AdminCoupons from './pages/AdminCoupons';
import AdminDashboard from './pages/AdminDashboard';
import AdminGallery from './pages/AdminGallery';
import AdminInstructors from './pages/AdminInstructors';
import AdminLessons from './pages/AdminLessons';
import AdminLogin from './pages/AdminLogin';
import AdminMessages from './pages/AdminMessages';
import AdminOrders from './pages/AdminOrders';
import AdminPayments from './pages/AdminPayments';
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
import Wishlist from './pages/Wishlist';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAI": AdminAI,
    "AdminContent": AdminContent,
    "AdminCoupons": AdminCoupons,
    "AdminDashboard": AdminDashboard,
    "AdminGallery": AdminGallery,
    "AdminInstructors": AdminInstructors,
    "AdminLessons": AdminLessons,
    "AdminLogin": AdminLogin,
    "AdminMessages": AdminMessages,
    "AdminOrders": AdminOrders,
    "AdminPayments": AdminPayments,
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
    "Wishlist": Wishlist,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};