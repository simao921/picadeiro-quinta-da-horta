import Home from './pages/Home';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Bookings from './pages/Bookings';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import ClientDashboard from './pages/ClientDashboard';
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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};