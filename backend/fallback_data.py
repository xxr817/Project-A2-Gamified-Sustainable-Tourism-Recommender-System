"""Static examples used when live trip search is unavailable."""


def demo_stays(destination: str) -> list[dict]:
    return [
        _demo_stay(1, destination, "GreenKey", "Central area", "€168", 93),
        _demo_stay(2, destination, "EU Ecolabel", "Old town", "€142", 90),
        _demo_stay(3, destination, "Biosphere", "City centre", "€118", 86),
        _demo_stay(4, destination, "GreenKey", "Garden area", "€154", 91),
        _demo_stay(5, destination, "EU Ecolabel", "Transit area", "€136", 88),
        _demo_stay(6, destination, "Biosphere", "Riverside area", "€126", 87),
    ]


def _demo_stay(number: int, destination: str, cert: str, area: str, price: str, score: int) -> dict:
    name = f"Demo Hotel {number}"
    return {
        "id": f"demo-stay-{number}",
        "name": name,
        "cert": f"🌿 {cert}",
        "district": f"{area}, {destination}",
        "price": price,
        "score": score,
        "imageUrl": "",
        "imageAlt": name,
        "photoSourceUrl": "",
        "hotelPageUrl": "",
    }


def demo_eats(destination: str) -> list[dict]:
    areas = ["Centre", "Old town", "Creative area", "Market area", "Riverside", "Garden area"]
    tags = [
        ["Vegan", "Local"],
        ["Vegetarian", "Family run"],
        ["Vegan", "Organic"],
        ["Vegetarian", "Local"],
        ["Vegan options", "Low waste"],
        ["Vegan", "Quiet"],
    ]
    prices = ["€€", "€", "€€", "€€", "€", "€€"]
    scores = [92, 88, 90, 86, 84, 89]
    details = [
        "Seasonal plant based food.",
        "Simple vegetarian meals.",
        "Organic vegan dishes.",
        "Vegetarian food with local ingredients.",
        "Quick vegan bowls.",
        "Plant based dinner options.",
    ]
    return [
        {
            "id": f"demo-eat-{index + 1}",
            "emoji": "🥗",
            "name": f"Demo Vegetarian Restaurant {index + 1}",
            "district": f"{area}, {destination}",
            "tags": tags[index],
            "price": prices[index],
            "score": scores[index],
            "detail": details[index],
            "restaurantPageUrl": "",
        }
        for index, area in enumerate(areas)
    ]


EXTRA_ACTIVITY_TEMPLATES = [
    ("family-park", "family park route", "Family", 6, "Easy walk with a playground.", 2, 86, "from-moss-200 to-forest-400", False, "family,park"),
    ("gallery", "accessible gallery", "Accessible", 6, "Step free indoor visit.", 2, 85, "from-forest-300 to-moss-500", False, "gallery,museum"),
    ("viewpoint", "free sunset viewpoint", "Budget", 8, "Free visit after rush hour.", 2, 88, "from-moss-300 to-forest-500", False, "viewpoint,sunset"),
    ("quiet-area", "quiet neighbourhood walk", "Less crowded", 7, "Self guided walk on quieter streets.", 1, 89, "from-forest-400 to-moss-600", False, "quiet,street"),
    ("transit-loop", "public transport loop", "Transit", 7, "Flexible route with a day pass.", 2, 87, "from-moss-200 to-moss-500", False, "tram,city"),
    ("craft", "local craft workshop", "Local", 5, "Small group workshop.", 2, 82, "from-forest-300 to-moss-400", False, "workshop,craft"),
    ("library", "library visit", "Indoor", 4, "Quiet and low cost indoor option.", 1, 80, "from-moss-200 to-forest-300", False, "library"),
    ("market", "farmers market walk", "Local food", 6, "Morning market with regional produce.", 3, 83, "from-forest-400 to-moss-500", False, "farmers,market"),
    ("landmark", "early landmark visit", "Off peak", 6, "Visit before the main crowds.", 2, 84, "from-moss-300 to-forest-600", False, "landmark,morning"),
    ("rooftop", "green rooftop", "Hidden place", 8, "Small urban nature project.", 1, 90, "from-forest-500 to-moss-400", False, "rooftop,garden"),
    ("ferry", "river ferry", "Low effort", 5, "Public transport with little walking.", 2, 81, "from-moss-200 to-forest-400", False, "waterfront,ferry"),
    ("community", "community venue", "Community", 7, "Small local venue.", 2, 85, "from-forest-300 to-moss-600", False, "community,venue"),
    ("nature", "nearby nature reserve", "Nature", 9, "Regional train access and low crowds.", 1, 92, "from-moss-300 to-forest-700", False, "nature,reserve"),
    ("old-town", "accessible old town route", "Accessible", 6, "Short route with rest stops.", 2, 84, "from-forest-300 to-moss-500", False, "old,town"),
]
