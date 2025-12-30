import Home from './pages/Home';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Bookings from './pages/Bookings';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import ClientDashboard from './pages/ClientDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminLessons from './pages/AdminLessons';
import AdminStudents from './pages/AdminStudents';
import AdminPayments from './pages/AdminPayments';
import AdminShop from './pages/AdminShop';
import AdminOrders from './pages/AdminOrders';
import AdminGallery from './pages/AdminGallery';
import AdminMessages from './pages/AdminMessages';
import AdminInstructors from './pages/AdminInstructors';
import AdminCoupons from './pages/AdminCoupons';
import AdminSettings from './pages/AdminSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Services": Services,
    "Gallery": Gallery,
    "Contact": Contact,
    "Bookings": Bookings,
    "Shop": Shop,
    "Cart": Cart,
    "ClientDashboard": ClientDashboard,
    "AdminLogin": AdminLogin,
    "AdminDashboard": AdminDashboard,
    "AdminLessons": AdminLessons,
    "AdminStudents": AdminStudents,
    "AdminPayments": AdminPayments,
    "AdminShop": AdminShop,
    "AdminOrders": AdminOrders,
    "AdminGallery": AdminGallery,
    "AdminMessages": AdminMessages,
    "AdminInstructors": AdminInstructors,
    "AdminCoupons": AdminCoupons,
    "AdminSettings": AdminSettings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};