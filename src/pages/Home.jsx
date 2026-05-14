import { Link } from "react-router-dom";

function Home() {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f4f8f4",
                padding: "40px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            {/* Hero Section */}
            <section
                style={{
                    textAlign: "center",
                    maxWidth: "900px",
                    margin: "0 auto",
                    paddingTop: "60px",
                }}
            >
                <h1
                    style={{
                        fontSize: "3rem",
                        color: "#1b5e20",
                        marginBottom: "20px",
                    }}
                >
                    🌍 Sustainable Trip Planner
                </h1>

                <p
                    style={{
                        fontSize: "1.2rem",
                        color: "#555",
                        lineHeight: "1.8",
                        marginBottom: "40px",
                    }}
                >
                    Plan eco-friendly city trips, earn sustainability points,
                    unlock badges, and discover greener travel options.
                </p>

                <Link to="/planner">
                    <button
                        style={{
                            padding: "15px 30px",
                            fontSize: "1rem",
                            backgroundColor: "#2e7d32",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                        }}
                    >
                        Start Planning
                    </button>
                </Link>
            </section>

            {/* Features Section */}
            <section
                style={{
                    marginTop: "80px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "30px",
                    maxWidth: "1000px",
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
            >
                <FeatureCard
                    icon="🌱"
                    title="Eco Score"
                    description="Get a sustainability score based on your travel choices."
                />

                <FeatureCard
                    icon="🏅"
                    title="Gamification"
                    description="Earn badges and points for greener decisions."
                />

                <FeatureCard
                    icon="🗺️"
                    title="Smart Recommendations"
                    description="Discover local, low-impact, and less crowded places."
                />
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <div
            style={{
                background: "white",
                padding: "30px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                textAlign: "center",
            }}
        >
            <div style={{ fontSize: "2.5rem", marginBottom: "15px" }}>{icon}</div>
            <h3 style={{ color: "#1b5e20", marginBottom: "10px" }}>{title}</h3>
            <p style={{ color: "#666", lineHeight: "1.6" }}>{description}</p>
        </div>
    );
}

export default Home;