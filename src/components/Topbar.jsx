import { Search, Bell } from "lucide-react";

function Topbar() {
  return (
    <header className="topbar">
      <div className="search">
        <Search size={20}/>
        <input placeholder="Rechercher une formation, une leçon, un document..." />
      </div>

      <div className="profile">
        <Bell size={21}/>
        <div className="avatar">MP</div>
        <span>Bonjour, <strong>Mickael !</strong></span>
      </div>
    </header>
  );
}

export default Topbar;
