import { Link } from "react-router-dom";
import backgroundImage from "../assets/background.jpg";

function Home() {
    return (
        <div style={{ fontFamily: "Arial, sans-serif" }}>
            {/* Top Navigation Bar */}
            <header
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    backgroundColor: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    zIndex: 1000,
                }}
            >
                <div
                    style={{
                        maxWidth: "1200px",
                        margin: "0 auto",
                        padding: "18px 40px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    {/* Logo */}
                    <div
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            color: "#1b5e20",
                        }}
                    >
                        🌍 EcoTrip
                    </div>

                    {/* Navigation Links */}
                    <nav
                        style={{
                            display: "flex",
                            gap: "30px",
                            alignItems: "center",
                        }}
                    >
                        <a href="#features" style={navStyle}>
                            Features
                        </a>

                        <a href="#how-it-works" style={navStyle}>
                            How It Works
                        </a>

                        <a href="#about" style={navStyle}>
                            About Us
                        </a>

                        <Link to="/planner">
                            <button
                                style={{
                                    backgroundColor: "#f4c20d",
                                    color: "#222",
                                    border: "none",
                                    padding: "10px 22px",
                                    fontWeight: "bold",
                                    borderRadius: "30px",
                                    cursor: "pointer",
                                }}
                            >
                                Start Planning
                            </button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section
                style={{
                    height: "100vh",
                    backgroundImage: `linear-gradient(
              rgba(0, 0, 0, 0.35),
              rgba(0, 0, 0, 0.45)
            ), url(${backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 80px",
                    color: "white",
                    marginTop: "80px", // prevents content from hiding behind fixed navbar
                }}
            >
                <div style={{ maxWidth: "700px" }}>
                    <p
                        style={{
                            fontSize: "1rem",
                            marginBottom: "10px",
                            opacity: 0.9,
                        }}
                    >
                        Gamified Sustainable Tourism
                    </p>

                    <h1
                        style={{
                            fontSize: "4.5rem",
                            fontWeight: "bold",
                            lineHeight: "1.1",
                            marginBottom: "25px",
                        }}
                    >
                        Plan greener city trips and earn rewards
                    </h1>

                    <p
                        style={{
                            fontSize: "1.2rem",
                            lineHeight: "1.8",
                            marginBottom: "35px",
                            maxWidth: "650px",
                        }}
                    >
                        Discover eco-friendly transport, sustainable accommodation,
                        local restaurants, and hidden gems. Earn points, unlock badges,
                        and reduce your travel footprint.
                    </p>

                    <Link to="/planner">
                        <button
                            style={{
                                backgroundColor: "#f4c20d",
                                color: "#222",
                                border: "none",
                                padding: "16px 32px",
                                fontSize: "1rem",
                                fontWeight: "bold",
                                borderRadius: "50px",
                                cursor: "pointer",
                            }}
                        >
                            Start Planning
                        </button>
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section
                id="features"
                style={{
                    background: "#f7f9f7",
                    padding: "90px 70px",
                }}
            >
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <h2
                        style={{
                            fontSize: "2.4rem",
                            color: "#1b5e20",
                            marginBottom: "15px",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                        }}
                    >
                        Our Core Features
                    </h2>

                    <p
                        style={{
                            maxWidth: "850px",
                            color: "#555",
                            lineHeight: "1.8",
                            fontSize: "1rem",
                            marginBottom: "60px",
                        }}
                    >
                        Sustainable Trip Planner helps users make greener travel decisions through
                        scoring, gamified rewards, and smart recommendations for eco-friendly city
                        trips.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: "35px",
                        }}
                    >
                        <FeatureCard
                            image="🌱"
                            title="Eco Score"
                            description="Measure the sustainability of your transport, food, accommodation, and activity choices."
                            action="Explore feature"
                        />

                        <FeatureCard
                            image="🏅"
                            title="Gamification"
                            description="Earn points, badges, and achievements by making greener travel decisions."
                            action="View rewards"
                        />

                        <FeatureCard
                            image="🗺️"
                            title="Smart Recommendations"
                            description="Discover local, low-impact, and less crowded alternatives for your city trip."
                            action="Get recommendations"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ image, title, description, action }) {
    return (
        <div
            style={{
                background: "white",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
                border: "1px solid #e5e5e5",
            }}
        >
            <div
                style={{
                    height: "180px",
                    background: "#eaf3ea",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "4rem",
                }}
            >
                {image}
            </div>

            <div style={{ padding: "28px" }}>
                <h3
                    style={{
                        fontSize: "1.5rem",
                        color: "#1b5e20",
                        marginBottom: "15px",
                    }}
                >
                    {title}
                </h3>

                <p
                    style={{
                        color: "#555",
                        lineHeight: "1.7",
                        marginBottom: "28px",
                    }}
                >
                    {description}
                </p>

                <button
                    style={{
                        background: "none",
                        border: "none",
                        color: "#1b5e20",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        padding: 0,
                    }}
                >
                    {action}
                </button>
            </div>
        </div>
    );
}

const navStyle = {
    textDecoration: "none",
    color: "#222",
    fontWeight: "500",
    fontSize: "0.95rem",
};

export default Home;