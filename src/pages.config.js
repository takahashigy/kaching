import Lobby from './pages/Lobby';
import Room from './pages/Room';
import PurpleRanking from './pages/PurpleRanking';
import GoldFeatured from './pages/GoldFeatured';
import Watchlist from './pages/Watchlist';
import Search from './pages/Search';
import Profile from './pages/Profile';
import ShoutMode from './pages/ShoutMode';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Lobby": Lobby,
    "Room": Room,
    "PurpleRanking": PurpleRanking,
    "GoldFeatured": GoldFeatured,
    "Watchlist": Watchlist,
    "Search": Search,
    "Profile": Profile,
    "ShoutMode": ShoutMode,
}

export const pagesConfig = {
    mainPage: "Lobby",
    Pages: PAGES,
    Layout: __Layout,
};