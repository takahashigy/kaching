import GoldFeatured from './pages/GoldFeatured';
import Lobby from './pages/Lobby';
import Profile from './pages/Profile';
import PurpleRanking from './pages/PurpleRanking';
import Room from './pages/Room';
import Search from './pages/Search';
import ShoutMode from './pages/ShoutMode';
import Watchlist from './pages/Watchlist';
import __Layout from './Layout.jsx';


export const PAGES = {
    "GoldFeatured": GoldFeatured,
    "Lobby": Lobby,
    "Profile": Profile,
    "PurpleRanking": PurpleRanking,
    "Room": Room,
    "Search": Search,
    "ShoutMode": ShoutMode,
    "Watchlist": Watchlist,
}

export const pagesConfig = {
    mainPage: "Lobby",
    Pages: PAGES,
    Layout: __Layout,
};