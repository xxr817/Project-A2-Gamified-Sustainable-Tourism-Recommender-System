import { useState } from "react";
import { useNavigate } from "react-router-dom";

function TripPlanner() {
    const navigate = useNavigate();

    const [transport, setTransport] = useState("");
    const [hotel, setHotel] = useState("");
    const [food, setFood] = useState("");
    const [activity, setActivity] = useState("");

    const options = {
        transport: [
            { name: "Train", score: 50 },
            { name: "Bus", score: 35 },
            { name: "Taxi", score: 10 },
            { name: "Flight", score: 5 },
        ],
        hotel: [
            { name: "Eco-certified Hotel", score: 40 },
            { name: "Local Guesthouse", score: 30 },
            { name: "Chain Hotel", score: 10 },
        ],
        food: [
            { name: "Local Vegetarian Restaurant", score: 40 },
            { name: "Local Restaurant", score: 25 },
            { name: "Fast Food", score: 5 },
        ],
        activity: [
            { name: "Hidden Gem Museum", score: 35 },
            { name: "Local Market", score: 30 },
            { name: "Popular Attraction at Peak Time", score: 5 },
        ],
    };

    const getScore = () => {
        const selected = [transport, hotel, food, activity];

        return selected.reduce((total, item) => {
            const allOptions = [
                ...options.transport,
                ...options.hotel,
                ...options.food,
                ...options.activity,
            ];

            const found = allOptions.find((option) => option.name === item);
            return total + (found ? found.score : 0);
        }, 0);
    };

    const score = getScore();

    const handleShowResults = () => {
        navigate("/results", {
            state: {
                transport,
                hotel,
                food,
                activity,
                score,
            },
        });
    };

    const isComplete =
        transport && hotel && food && activity;

    return (
        <div
            style={{
                padding: "40px",
                fontFamily: "Arial",
                background: "#f4f8f4",
                minHeight: "100vh",
            }}
        >
            <h1>Plan Your Sustainable Trip</h1>
            <p>Choose your travel options and earn sustainability points.</p>

            <SelectBox
                title="Transport"
                value={transport}
                setValue={setTransport}
                options={options.transport}
            />

            <SelectBox
                title="Accommodation"
                value={hotel}
                setValue={setHotel}
                options={options.hotel}
            />

            <SelectBox
                title="Food"
                value={food}
                setValue={setFood}
                options={options.food}
            />

            <SelectBox
                title="Activity"
                value={activity}
                setValue={setActivity}
                options={options.activity}
            />

            <div
                style={{
                    marginTop: "30px",
                    padding: "20px",
                    background: "white",
                    borderRadius: "12px",
                }}
            >
                <h2>Your Sustainability Score: {score}</h2>
                <p>
                    {score >= 120
                        ? "🏅 Badge earned: Green Explorer"
                        : "Choose greener options to earn a badge!"}
                </p>

                <button
                    onClick={handleShowResults}
                    disabled={!isComplete}
                    style={{
                        marginTop: "20px",
                        padding: "12px 24px",
                        fontSize: "16px",
                        backgroundColor: isComplete ? "#2e7d32" : "#cccccc",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: isComplete ? "pointer" : "not-allowed",
                    }}
                >
                    Show Final Results
                </button>
            </div>
        </div>
    );
}

function SelectBox({ title, value, setValue, options }) {
    return (
        <div style={{ marginTop: "25px" }}>
            <h3>{title}</h3>
            <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{
                    padding: "12px",
                    width: "300px",
                    borderRadius: "8px",
                }}
            >
                <option value="">Select {title}</option>

                {options.map((option) => (
                    <option key={option.name} value={option.name}>
                        {option.name} (+{option.score})
                    </option>
                ))}
            </select>
        </div>
    );
}

export default TripPlanner;