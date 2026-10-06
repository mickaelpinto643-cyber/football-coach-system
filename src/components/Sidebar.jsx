import {
  Home,
  BookOpen,
  PlayCircle,
  FileText,
  BadgeCheck,
  Users,
  BarChart3,
  Brain,
  CalendarDays,
  Settings,
  Headphones
} from "lucide-react";

function Sidebar({ onHome, onNavigate, onLogout, activePage }) {

  const menu = [
    [Home, "Dashboard", "home"],
    [BookOpen, "Modules & Leçons", "modules"],
    [PlayCircle, "Vidéos", "videos"],
    [FileText, "Documents", "documents"],
    [BadgeCheck, "Quiz", "quizzes"],
    [Users, "Apprenants", "learners"],
    [BarChart3, "Progression", "tracking"],
    [Brain, "Modèle de jeu", "model-game"],
    [CalendarDays, "Lives & Replays", "lives"],
    [Settings, "Paramètres", "settings"]
  ];

  return (
    <aside className="sidebar">

      <div className="brand">
        <div className="brandMark">FCS</div>

        <div>
          <strong>FOOTBALL COACH</strong>
          <div className="tagline">
            MÉTHODE · MODÈLE · PERFORMANCE
          </div>
        </div>
      </div>

      <nav>
        {menu.map(([Icon, label, route]) => {

          const active =
            activePage === route ||
            (route === "home" && activePage === "dashboard");

          return (
            <button
              key={route}
              className={`navItem ${active ? "active" : ""}`}
              onClick={() => {
                if (route === "home") {
                  onHome();
                } else {
                  onNavigate(route);
                }
              }}
            >
              <Icon size={21}/>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        style={{
          width: "calc(100% - 28px)",
          margin: "10px 14px 18px",
          padding: "12px 14px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,.18)",
          background: "rgba(255,255,255,.06)",
          color: "#fff",
          fontWeight: 700,
          fontSize: "14px",
          cursor: "pointer",
          textAlign: "left"
        }}
      >
        🚪 Déconnexion
      </button>

      <div className="support">
        <Headphones size={28}/>
        <strong>Besoin d'aide ?</strong>

        <p>
          Une question ?<br/>
          Notre équipe est là pour vous accompagner.
        </p>

        <button onClick={() => onNavigate("community")}>
          Nous contacter
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
