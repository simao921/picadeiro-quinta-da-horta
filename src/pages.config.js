import AdminCoupons from './pages/AdminCoupons';
import AdminDashboard from './pages/AdminDashboard';
import AdminGallery from './pages/AdminGallery';
import AdminInstructors from './pages/AdminInstructors';
import AdminLessons from './pages/AdminLessons';
import AdminLogin from './pages/AdminLogin';
import AdminMessages from './pages/AdminMessages';
import AdminOrders from './pages/AdminOrders';
import AdminPayments from './pages/AdminPayments';
import AdminSettings from './pages/AdminSettings';
import AdminShop from './pages/AdminShop';
import AdminStudents from './pages/AdminStudents';
import Bookings from './pages/Bookings';
import Cart from './pages/Cart';
import ClientDashboard from './pages/ClientDashboard';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import Services from './pages/Services';
import Shop from './pages/Shop';
import AdminAI from './pages/AdminAI';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminCoupons": AdminCoupons,
    "AdminDashboard": AdminDashboard,
    "AdminGallery": AdminGallery,
    "AdminInstructors": AdminInstructors,
    "AdminLessons": AdminLessons,
    "AdminLogin": AdminLogin,
    "AdminMessages": AdminMessages,
    "AdminOrders": AdminOrders,
    "AdminPayments": AdminPayments,
    "AdminSettings": AdminSettings,
    "AdminShop": AdminShop,
    "AdminStudents": AdminStudents,
    "Bookings": Bookings,
    "Cart": Cart,
    "ClientDashboard": ClientDashboard,
    "Contact": Contact,
    "Gallery": Gallery,
    "Home": Home,
    "Services": Services,
    "Shop": Shop,
    "AdminAI": AdminAI,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};