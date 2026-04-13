import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
    LayoutGrid,
    Star,
    Folder,
    Users,
    BarChart3,
    MessageCircle,
    User,
    ChevronLeft,
    Settings,
} from "lucide-react";

const Icons = {
    Feed: LayoutGrid,
    Celebrate: Star,
    Projects: Folder,
    Collabs: Users,
    Progress: BarChart3,
    Messages: MessageCircle,
    Friends: User,
    Chevron: ChevronLeft,
    Settings: Settings,
};


const NAV_SECTIONS = [
    {
        key: "discover",
        label: "Discover",
        items: [
            { key: "feed", label: "Feed", icon: Icons.Feed, path: "/feed" },
            {
                key: "celebrate",
                label: "Celebration wall",
                icon: Icons.Celebrate,
                path: "/celebrate",
            },
        ],
    },
    {
        key: "work",
        label: "My work",
        items: [
            {
                key: "projects",
                label: "My projects",
                icon: Icons.Projects,
                path: "/projects",
            },
            {
                key: "collabs",
                label: "Collaborations",
                icon: Icons.Collabs,
                path: "/collabs",
                badge: 3,
            },
            {
                key: "progress",
                label: "Progress tracker",
                icon: Icons.Progress,
                path: "/progress",
            },
        ],
    },
    {
        key: "social",
        label: "Social",
        items: [
            {
                key: "messages",
                label: "Messages",
                icon: Icons.Messages,
                path: "/messages",
                badge: 5,
            },
            {
                key: "friends",
                label: "Friends",
                icon: Icons.Friends,
                path: "/friends",
                badge: 2,
            },
        ],
    },
];

function NavItem({ item, isActive, isCollapsed, onClick }) {
    const IconComponent = item.icon;

    return (
        <button
            onClick={() => onClick(item.path)}
            className={`flex items-center gap-2 w-full rounded-lg transition px-2 py-2
        ${isCollapsed ? "justify-center" : ""}
        ${isActive ? "bg-[#EEEDFE]" : "hover:bg-[#f0efe8]"}
      `}
        >
            <div
                className={`w-8 h-8 flex items-center justify-center rounded-lg
        ${isActive
                        ? "bg-[#CECBF6] text-[#534AB7]"
                        : "bg-[#f0efe8] text-gray-500"
                    }`}
            >
                <IconComponent size={18} />
            </div>

            {!isCollapsed && (
                <span
                    className={`text-sm flex-1 text-left ${isActive ? "text-[#534AB7] font-medium" : "text-gray-600"
                        }`}
                >
                    {item.label}
                </span>
            )}

            {!isCollapsed && item.badge && (
                <span className="text-xs bg-[#7F77DD] text-white px-2 rounded-full">
                    {item.badge}
                </span>
            )}
        </button>
    );
}

function SidebarSection({ section, currentPath, isCollapsed, onNavigate }) {
    return (
        <div className="sidebar-section">
            {!isCollapsed && (
                <p className="section-label">{section.label}</p>
            )}
            {section.items.map((item) => (
                <NavItem
                    key={item.key}
                    item={item}
                    isActive={currentPath === item.path}
                    isCollapsed={isCollapsed}
                    onClick={onNavigate}
                />
            ))}
        </div>
    );
}

export default function Sidebar({ user, badgeCounts = {}, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();

    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem("sidebar_collapsed") === "true";
        } catch {
            return false;
        }
    });

    const [showUserMenu, setShowUserMenu] = useState(false);

    const sectionsWithCounts = NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
            ...item,
            badge: badgeCounts[item.key] ?? item.badge,
        })),
    }));

    const handleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem("sidebar_collapsed", String(next));
    };

    const handleNavigate = (path) => {
        navigate(path);
        setShowUserMenu(false);
    };

    return (
        <aside
            className={`flex flex-col min-h-screen bg-[#fafaf9] border-r border-black/10 transition-all duration-200 ${isCollapsed ? "w-16" : "w-56"
                }`}
        >
            {/* Logo */}
            <div className="flex items-center gap-2 px-3 py-4 border-b border-black/10">
                <div className="w-7 h-7 rounded-lg bg-[#7F77DD] flex items-center justify-center text-white">
                    <User size={14} />
                </div>

                {!isCollapsed && (
                    <span className="text-sm font-medium text-gray-900">
                        dev<span className="text-[#7F77DD]">collab</span>
                    </span>
                )}

                <div className="flex-1" />

                <button
                    onClick={handleCollapse}
                    className="w-6 h-6 flex items-center justify-center rounded-md border border-black/20 bg-white hover:bg-gray-100"
                >
                    <ChevronLeft
                        size={14}
                        className={`transition-transform ${isCollapsed ? "rotate-180" : ""
                            }`}
                    />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-2">
                {sectionsWithCounts.map((section) => (
                    <SidebarSection
                        key={section.key}
                        section={section}
                        currentPath={location.pathname}
                        isCollapsed={isCollapsed}
                        onNavigate={handleNavigate}
                    />
                ))}
            </nav>

            {/* User */}
            <div className="border-t border-black/10 p-2 relative">
                {!isCollapsed && showUserMenu && (
                    <div className="absolute bottom-full left-2 right-2 bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => handleNavigate("/profile")}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 text-sm"
                        >
                            <Folder size={16} /> Profile
                        </button>

                        <button
                            onClick={() => handleNavigate("/settings")}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 text-sm"
                        >
                            <Settings size={16} /> Settings
                        </button>

                        <div className="h-px bg-black/10" />

                        <button
                            onClick={onLogout}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            Sign out
                        </button>
                    </div>
                )}

                <div
                    onClick={() => !isCollapsed && setShowUserMenu((v) => !v)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[#f0efe8] ${isCollapsed ? "justify-center" : ""
                        }`}
                >
                    <div className="w-8 h-8 rounded-full bg-[#CECBF6] flex items-center justify-center text-[#534AB7] text-xs font-medium">
                        {user?.avatarInitials ?? "?"}
                    </div>

                    {!isCollapsed && (
                        <>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                    {user?.name ?? "Developer"}
                                </div>
                                <div className="text-xs text-gray-400">
                                    @{user?.handle ?? "user"}
                                </div>
                            </div>

                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                        </>
                    )}
                </div>
            </div>
        </aside>
    );
}
