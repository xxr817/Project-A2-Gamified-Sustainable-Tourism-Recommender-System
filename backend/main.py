import json
import os
import ssl
import urllib.error
import urllib.request
from typing import Any

import certifi
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="EcoTrail API")

# Localhost origins are always allowed (dev). In production, set ALLOWED_ORIGINS
# to your deployed frontend URL(s), comma-separated, e.g.
#   ALLOWED_ORIGINS="https://ecotrail.vercel.app"
_DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
_EXTRA_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_DEFAULT_ORIGINS + _EXTRA_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"


class TripSearchRequest(BaseModel):
    from_city: str = Field(..., min_length=2)
    to_city: str = Field(..., min_length=2)
    depart_date: str
    return_date: str


CITY_INDEX = [
    {"name": "Paris, France", "subtitle": "Capital of France"},
    {"name": "Lisbon, Portugal", "subtitle": "Coastal capital"},
    {"name": "Munich, Germany", "subtitle": "Bavaria, Germany"},
    {"name": "Nuremberg, Germany", "subtitle": "Franconia, Bavaria", "aliases": ["Nürnberg", "Nuernberg", "纽伦堡"]},
    {"name": "Augsburg, Germany", "subtitle": "Bavaria, Germany", "aliases": ["奥格斯堡"]},
    {"name": "Würzburg, Germany", "subtitle": "Franconia, Bavaria", "aliases": ["Wurzburg", "Wuerzburg", "维尔茨堡", "伍兹堡", "雨堡"]},
    {"name": "Regensburg, Germany", "subtitle": "Bavaria, Germany", "aliases": ["雷根斯堡"]},
    {"name": "Ingolstadt, Germany", "subtitle": "Bavaria, Germany", "aliases": ["英戈尔施塔特"]},
    {"name": "Stuttgart, Germany", "subtitle": "Baden-Württemberg", "aliases": ["斯图加特"]},
    {"name": "Ulm, Germany", "subtitle": "Danube city", "aliases": ["乌尔姆"]},
    {"name": "Freiburg, Germany", "subtitle": "Black Forest gateway", "aliases": ["弗赖堡"]},
    {"name": "Heidelberg, Germany", "subtitle": "Neckar river city", "aliases": ["海德堡"]},
    {"name": "Dresden, Germany", "subtitle": "Saxony, Germany", "aliases": ["德累斯顿"]},
    {"name": "Leipzig, Germany", "subtitle": "Saxony, Germany", "aliases": ["莱比锡"]},
    {"name": "Bamberg, Germany", "subtitle": "Franconia, Bavaria", "aliases": ["班贝格"]},
    {"name": "Erlangen, Germany", "subtitle": "Franconia, Bavaria", "aliases": ["埃朗根"]},
    {"name": "Fürth, Germany", "subtitle": "Franconia, Bavaria", "aliases": ["Furth", "Fuerth", "菲尔特"]},
    {"name": "Bayreuth, Germany", "subtitle": "Upper Franconia, Bavaria", "aliases": ["拜罗伊特"]},
    {"name": "Passau, Germany", "subtitle": "Three-river city", "aliases": ["帕绍"]},
    {"name": "Landshut, Germany", "subtitle": "Lower Bavaria", "aliases": ["兰茨胡特"]},
    {"name": "Rosenheim, Germany", "subtitle": "Upper Bavaria", "aliases": ["罗森海姆"]},
    {"name": "Garmisch-Partenkirchen, Germany", "subtitle": "Bavarian Alps", "aliases": ["Garmisch", "加米施"]},
    {"name": "Memmingen, Germany", "subtitle": "Swabia, Bavaria", "aliases": ["梅明根"]},
    {"name": "Lindau, Germany", "subtitle": "Lake Constance", "aliases": ["林道"]},
    {"name": "Rothenburg ob der Tauber, Germany", "subtitle": "Romantic Road town", "aliases": ["Rothenburg", "罗滕堡"]},
    {"name": "Berlin, Germany", "subtitle": "Capital of Germany"},
    {"name": "Hamburg, Germany", "subtitle": "Northern Germany"},
    {"name": "Cologne, Germany", "subtitle": "Rhine region"},
    {"name": "Frankfurt, Germany", "subtitle": "Major rail and air hub"},
    {"name": "Barcelona, Spain", "subtitle": "Catalonia, Spain"},
    {"name": "Madrid, Spain", "subtitle": "Capital of Spain"},
    {"name": "Valencia, Spain", "subtitle": "Mediterranean coast"},
    {"name": "Seville, Spain", "subtitle": "Andalusia, Spain"},
    {"name": "Rome, Italy", "subtitle": "Capital of Italy"},
    {"name": "Milan, Italy", "subtitle": "Lombardy, Italy"},
    {"name": "Florence, Italy", "subtitle": "Tuscany, Italy"},
    {"name": "Venice, Italy", "subtitle": "Veneto, Italy"},
    {"name": "Naples, Italy", "subtitle": "Campania, Italy"},
    {"name": "Amsterdam, Netherlands", "subtitle": "Canal city"},
    {"name": "Rotterdam, Netherlands", "subtitle": "Port city"},
    {"name": "Brussels, Belgium", "subtitle": "Capital of Belgium"},
    {"name": "Antwerp, Belgium", "subtitle": "Flanders, Belgium"},
    {"name": "Vienna, Austria", "subtitle": "Capital of Austria"},
    {"name": "Salzburg, Austria", "subtitle": "Alpine rail stop"},
    {"name": "Prague, Czechia", "subtitle": "Capital of Czechia"},
    {"name": "Zurich, Switzerland", "subtitle": "Swiss rail hub"},
    {"name": "Geneva, Switzerland", "subtitle": "Lake Geneva"},
    {"name": "Basel, Switzerland", "subtitle": "Rhine rail hub"},
    {"name": "Copenhagen, Denmark", "subtitle": "Bike-friendly capital"},
    {"name": "Stockholm, Sweden", "subtitle": "Capital of Sweden"},
    {"name": "Oslo, Norway", "subtitle": "Capital of Norway"},
    {"name": "Helsinki, Finland", "subtitle": "Capital of Finland"},
    {"name": "London, United Kingdom", "subtitle": "Capital of the UK"},
    {"name": "Manchester, United Kingdom", "subtitle": "Northern England"},
    {"name": "Edinburgh, United Kingdom", "subtitle": "Capital of Scotland"},
    {"name": "Dublin, Ireland", "subtitle": "Capital of Ireland"},
    {"name": "Porto, Portugal", "subtitle": "Northern Portugal"},
    {"name": "Nice, France", "subtitle": "French Riviera"},
    {"name": "Lyon, France", "subtitle": "Auvergne-Rhone-Alpes"},
    {"name": "Marseille, France", "subtitle": "Mediterranean port"},
    {"name": "Bordeaux, France", "subtitle": "Nouvelle-Aquitaine"},
    {"name": "Budapest, Hungary", "subtitle": "Capital of Hungary"},
    {"name": "Warsaw, Poland", "subtitle": "Capital of Poland"},
    {"name": "Krakow, Poland", "subtitle": "Southern Poland"},
    {"name": "Athens, Greece", "subtitle": "Capital of Greece"},
    {"name": "Istanbul, Turkey", "subtitle": "Bosphorus city"},
    {"name": "Reykjavik, Iceland", "subtitle": "Capital of Iceland"},
    {"name": "Beijing, China", "subtitle": "Capital of China", "aliases": ["北京", "Peking"]},
    {"name": "Shanghai, China", "subtitle": "Yangtze River Delta", "aliases": ["上海"]},
    {"name": "Guangzhou, China", "subtitle": "Guangdong, China", "aliases": ["广州"]},
    {"name": "Shenzhen, China", "subtitle": "Guangdong, China", "aliases": ["深圳"]},
    {"name": "Chengdu, China", "subtitle": "Sichuan, China", "aliases": ["成都"]},
    {"name": "Chongqing, China", "subtitle": "Mountain city", "aliases": ["重庆"]},
    {"name": "Xi'an, China", "subtitle": "Shaanxi, China", "aliases": ["西安", "Xian"]},
    {"name": "Hangzhou, China", "subtitle": "Zhejiang, China", "aliases": ["杭州"]},
    {"name": "Suzhou, China", "subtitle": "Jiangsu, China", "aliases": ["苏州"]},
    {"name": "Nanjing, China", "subtitle": "Jiangsu, China", "aliases": ["南京"]},
    {"name": "Wuhan, China", "subtitle": "Hubei, China", "aliases": ["武汉"]},
    {"name": "Changsha, China", "subtitle": "Hunan, China", "aliases": ["长沙"]},
    {"name": "Qingdao, China", "subtitle": "Shandong, China", "aliases": ["青岛"]},
    {"name": "Tianjin, China", "subtitle": "Northern China", "aliases": ["天津"]},
    {"name": "Dalian, China", "subtitle": "Liaoning, China", "aliases": ["大连"]},
    {"name": "Shenyang, China", "subtitle": "Liaoning, China", "aliases": ["沈阳"]},
    {"name": "Jinan, China", "subtitle": "Shandong, China", "aliases": ["济南"]},
    {"name": "Zhengzhou, China", "subtitle": "Henan, China", "aliases": ["郑州"]},
    {"name": "Luoyang, China", "subtitle": "Henan, China", "aliases": ["洛阳"]},
    {"name": "Hefei, China", "subtitle": "Anhui, China", "aliases": ["合肥"]},
    {"name": "Ningbo, China", "subtitle": "Zhejiang, China", "aliases": ["宁波"]},
    {"name": "Wuxi, China", "subtitle": "Jiangsu, China", "aliases": ["无锡"]},
    {"name": "Fuzhou, China", "subtitle": "Fujian, China", "aliases": ["福州"]},
    {"name": "Harbin, China", "subtitle": "Heilongjiang, China", "aliases": ["哈尔滨"]},
    {"name": "Kunming, China", "subtitle": "Yunnan, China", "aliases": ["昆明"]},
    {"name": "Xiamen, China", "subtitle": "Fujian, China", "aliases": ["厦门"]},
    {"name": "Nanchang, China", "subtitle": "Jiangxi, China", "aliases": ["南昌"]},
    {"name": "Guiyang, China", "subtitle": "Guizhou, China", "aliases": ["贵阳"]},
    {"name": "Nanning, China", "subtitle": "Guangxi, China", "aliases": ["南宁"]},
    {"name": "Guilin, China", "subtitle": "Guangxi, China", "aliases": ["桂林"]},
    {"name": "Zhangjiajie, China", "subtitle": "Hunan, China", "aliases": ["张家界"]},
    {"name": "Haikou, China", "subtitle": "Hainan, China", "aliases": ["海口"]},
    {"name": "Sanya, China", "subtitle": "Hainan, China", "aliases": ["三亚"]},
    {"name": "Lhasa, China", "subtitle": "Tibet, China", "aliases": ["拉萨"]},
    {"name": "Urumqi, China", "subtitle": "Xinjiang, China", "aliases": ["乌鲁木齐"]},
    {"name": "Lanzhou, China", "subtitle": "Gansu, China", "aliases": ["兰州"]},
    {"name": "Xining, China", "subtitle": "Qinghai, China", "aliases": ["西宁"]},
    {"name": "Hohhot, China", "subtitle": "Inner Mongolia, China", "aliases": ["呼和浩特"]},
    {"name": "Hong Kong, China", "subtitle": "Special administrative region", "aliases": ["香港"]},
    {"name": "Macau, China", "subtitle": "Special administrative region", "aliases": ["澳门"]},
    {"name": "Taipei, Taiwan", "subtitle": "Northern Taiwan", "aliases": ["台北"]},
    {"name": "Tokyo, Japan", "subtitle": "Capital of Japan", "aliases": ["东京"]},
    {"name": "Kyoto, Japan", "subtitle": "Kansai, Japan", "aliases": ["京都"]},
    {"name": "Osaka, Japan", "subtitle": "Kansai, Japan", "aliases": ["大阪"]},
    {"name": "Seoul, South Korea", "subtitle": "Capital of South Korea", "aliases": ["首尔", "서울"]},
    {"name": "Singapore, Singapore", "subtitle": "City-state", "aliases": ["新加坡"]},
    {"name": "Bangkok, Thailand", "subtitle": "Capital of Thailand", "aliases": ["曼谷"]},
    {"name": "Kuala Lumpur, Malaysia", "subtitle": "Capital of Malaysia", "aliases": ["KL", "吉隆坡"]},
    {"name": "Jakarta, Indonesia", "subtitle": "Capital of Indonesia", "aliases": ["雅加达"]},
    {"name": "Bali, Indonesia", "subtitle": "Indonesia", "aliases": ["巴厘岛", "Denpasar"]},
    {"name": "Hanoi, Vietnam", "subtitle": "Capital of Vietnam", "aliases": ["河内"]},
    {"name": "Ho Chi Minh City, Vietnam", "subtitle": "Southern Vietnam", "aliases": ["Saigon", "胡志明市", "西贡"]},
    {"name": "Manila, Philippines", "subtitle": "Capital of the Philippines", "aliases": ["马尼拉"]},
    {"name": "Delhi, India", "subtitle": "India", "aliases": ["New Delhi", "新德里", "德里"]},
    {"name": "Mumbai, India", "subtitle": "Maharashtra, India", "aliases": ["孟买"]},
    {"name": "Bengaluru, India", "subtitle": "Karnataka, India", "aliases": ["Bangalore", "班加罗尔"]},
    {"name": "New York, United States", "subtitle": "New York State", "aliases": ["NYC", "纽约"]},
    {"name": "Boston, United States", "subtitle": "Massachusetts, United States", "aliases": ["波士顿"]},
    {"name": "Washington, D.C., United States", "subtitle": "Capital of the United States", "aliases": ["Washington DC", "华盛顿"]},
    {"name": "Chicago, United States", "subtitle": "Illinois, United States", "aliases": ["芝加哥"]},
    {"name": "San Francisco, United States", "subtitle": "California, United States", "aliases": ["旧金山"]},
    {"name": "Los Angeles, United States", "subtitle": "California, United States", "aliases": ["LA", "洛杉矶"]},
    {"name": "Seattle, United States", "subtitle": "Washington State, United States", "aliases": ["西雅图"]},
    {"name": "Miami, United States", "subtitle": "Florida, United States", "aliases": ["迈阿密"]},
    {"name": "Toronto, Canada", "subtitle": "Ontario, Canada", "aliases": ["多伦多"]},
    {"name": "Vancouver, Canada", "subtitle": "British Columbia, Canada", "aliases": ["温哥华"]},
    {"name": "Montreal, Canada", "subtitle": "Quebec, Canada", "aliases": ["蒙特利尔"]},
    {"name": "Sydney, Australia", "subtitle": "New South Wales, Australia", "aliases": ["悉尼"]},
    {"name": "Melbourne, Australia", "subtitle": "Victoria, Australia", "aliases": ["墨尔本"]},
    {"name": "Auckland, New Zealand", "subtitle": "North Island, New Zealand", "aliases": ["奥克兰"]},
    {"name": "Dubai, United Arab Emirates", "subtitle": "United Arab Emirates", "aliases": ["迪拜"]},
    {"name": "Doha, Qatar", "subtitle": "Capital of Qatar", "aliases": ["多哈"]},
    {"name": "Cairo, Egypt", "subtitle": "Capital of Egypt", "aliases": ["开罗"]},
    {"name": "Cape Town, South Africa", "subtitle": "Western Cape", "aliases": ["开普敦"]},
    {"name": "Marrakesh, Morocco", "subtitle": "Morocco", "aliases": ["Marrakech", "马拉喀什"]},
    {"name": "Mexico City, Mexico", "subtitle": "Capital of Mexico", "aliases": ["墨西哥城"]},
    {"name": "Buenos Aires, Argentina", "subtitle": "Capital of Argentina", "aliases": ["布宜诺斯艾利斯"]},
    {"name": "Rio de Janeiro, Brazil", "subtitle": "Brazil", "aliases": ["里约热内卢"]},
]


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "EcoTrail API is running"}


@app.post("/api/plan-trip")
def plan_trip(payload: TripSearchRequest) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return build_demo_plan(payload, source="demo")

    try:
        return call_openai_trip_search(payload, api_key)
    except Exception as exc:
        print(f"OpenAI search failed, using demo fallback: {exc}")
        demo = build_demo_plan(payload, source="demo-fallback")
        demo["notice"] = f"OpenAI search fallback used: {exc}"
        return demo


@app.get("/api/city-search")
def city_search(q: str = "", limit: int = 6) -> dict[str, Any]:
    query = q.strip().lower()
    safe_limit = max(1, min(limit, 10))

    if len(query) < 2:
        return {"cities": []}

    starts_with = []
    contains = []
    for city in CITY_INDEX:
        searchable_names = [city["name"], *city.get("aliases", [])]
        normalized_names = [item.lower() for item in searchable_names]
        if any(item.startswith(query) for item in normalized_names):
            starts_with.append(city)
        elif any(query in item for item in normalized_names):
            contains.append(city)

    return {
        "cities": [
            {"name": city["name"], "subtitle": city["subtitle"]}
            for city in (starts_with + contains)[:safe_limit]
        ]
    }


def call_openai_trip_search(payload: TripSearchRequest, api_key: str) -> dict[str, Any]:
    preferred_model = os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)
    model_candidates = list(dict.fromkeys([preferred_model, DEFAULT_OPENAI_MODEL]))
    last_error = None

    for model in model_candidates:
        try:
            return call_openai_trip_search_with_model(payload, api_key, model)
        except Exception as exc:
            last_error = exc
            print(f"OpenAI model {model} failed: {exc}")

    raise RuntimeError(last_error or "OpenAI search failed")


def call_openai_trip_search_with_model(payload: TripSearchRequest, api_key: str, model: str) -> dict[str, Any]:
    schema = {
        "type": "object",
        "additionalProperties": False,
        "required": ["summary", "transport", "activities", "stays", "eats"],
        "properties": {
            "summary": {"type": "string"},
            "transport": {
                "type": "array",
                "minItems": 3,
                "maxItems": 4,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "id",
                        "emoji",
                        "title",
                        "tag",
                        "pointsReward",
                        "detail",
                        "duration",
                        "co2",
                        "score",
                        "tone",
                        "why",
                        "warning",
                        "co2SavedKg",
                        "routeStops",
                    ],
                    "properties": {
                        "id": {"type": "string"},
                        "emoji": {"type": "string"},
                        "title": {"type": "string"},
                        "tag": {"type": "string"},
                        "pointsReward": {"type": "integer"},
                        "detail": {"type": "string"},
                        "duration": {"type": "string"},
                        "co2": {"type": "string"},
                        "score": {"type": "string"},
                        "tone": {"type": "string", "enum": ["forest", "moss", "rose"]},
                        "why": {"type": "string"},
                        "warning": {"type": "string"},
                        "co2SavedKg": {"type": "number"},
                        "routeStops": {
                            "type": "array",
                            "minItems": 2,
                            "maxItems": 8,
                            "items": {"type": "string"},
                        },
                    },
                },
            },
            "activities": {
                "type": "array",
                "minItems": 4,
                "maxItems": 6,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "id",
                        "name",
                        "tag",
                        "pointsReward",
                        "detail",
                        "crowd",
                        "score",
                        "gradient",
                        "warning",
                    ],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "tag": {"type": "string"},
                        "pointsReward": {"type": "integer"},
                        "detail": {"type": "string"},
                        "crowd": {"type": "integer"},
                        "score": {"type": "integer"},
                        "gradient": {"type": "string"},
                        "warning": {"type": "boolean"},
                    },
                },
            },
            "stays": {
                "type": "array",
                "minItems": 3,
                "maxItems": 4,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["id", "name", "cert", "district", "price", "score"],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "cert": {"type": "string"},
                        "district": {"type": "string"},
                        "price": {"type": "string"},
                        "score": {"type": "integer"},
                    },
                },
            },
            "eats": {
                "type": "array",
                "minItems": 3,
                "maxItems": 4,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["id", "emoji", "name", "district", "tags", "price"],
                    "properties": {
                        "id": {"type": "string"},
                        "emoji": {"type": "string"},
                        "name": {"type": "string"},
                        "district": {"type": "string"},
                        "tags": {"type": "array", "minItems": 1, "maxItems": 3, "items": {"type": "string"}},
                        "price": {"type": "string"},
                    },
                },
            },
        },
    }

    prompt = (
        "Generate sustainable trip planning options. Use realistic, route-specific demo data. "
        "Transport must include greener options and one high-emission option. "
        "For each transport option, calculate a plausible duration and CO2 estimate for this exact route. "
        "The detail field must name concrete legs, carriers or route segments when possible. "
        "The routeStops array must list the actual city/stop sequence, not generic text. "
        "Activities should be in or near the destination city, with larger point gaps up to 10. "
        "Stays must be eco-certified hotels actually in the destination city: each with a cert label "
        "(GreenKey, EU Ecolabel or Biosphere), a real district, a nightly price, and a green-score 80-99. "
        "Eats must be sustainable restaurants in the destination city (plant-based, local-sourced or MSC-certified), "
        "each with 1-3 short tags and a price band such as €, €€ or €€€. "
        f"Route: {payload.from_city} to {payload.to_city}. "
        f"Dates: {payload.depart_date} to {payload.return_date}."
    )

    body = {
        "model": model,
        "input": [
            {
                "role": "system",
                "content": (
                    "You are EcoTrail's sustainable travel search assistant. "
                    "Return only JSON matching the schema. Keep copy short and UI-ready."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "ecotrail_trip_plan",
                "schema": schema,
                "strict": True,
            }
        },
    }

    request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        with urllib.request.urlopen(request, timeout=45, context=ssl_context) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI API error {exc.code}: {detail}") from exc

    content = extract_response_text(result)
    parsed = json.loads(content)
    parsed["source"] = "openai"
    parsed["model"] = model
    return parsed


def extract_response_text(result: dict[str, Any]) -> str:
    if result.get("output_text"):
        return result["output_text"]

    for output in result.get("output", []):
        for item in output.get("content", []):
            if item.get("type") in {"output_text", "text"} and item.get("text"):
                return item["text"]

    raise RuntimeError("OpenAI response did not include JSON text")


def build_demo_plan(payload: TripSearchRequest, source: str) -> dict[str, Any]:
    route = f"{payload.from_city} -> {payload.to_city}"
    destination = payload.to_city.split(",")[0].strip() or payload.to_city

    return {
        "source": source,
        "summary": (
            f"Demo search for {route}: greener routes are ranked first, "
            f"then local low-crowd activities in {destination}."
        ),
        "transport": [
            {
                "id": "search-train",
                "emoji": "🚆",
                "title": "Train route",
                "tag": "Greenest",
                "pointsReward": 25,
                "detail": f"{route} · rail-first route with scenic transfer stops",
                "duration": "30-34 h",
                "co2": "78 kg",
                "score": "96 / 100",
                "tone": "forest",
                "why": "Lowest-carbon option in this demo search and best fit for slow travel.",
                "warning": "",
                "co2SavedKg": 234,
                "routeStops": ["Munich", "Paris", "Hendaye", "Lisbon"],
            },
            {
                "id": "search-bus-train",
                "emoji": "🚌",
                "title": "Bus + train combo",
                "tag": "Budget",
                "pointsReward": 18,
                "detail": f"{route} · overnight coach plus regional rail connection",
                "duration": "26-31 h",
                "co2": "96 kg",
                "score": "87 / 100",
                "tone": "moss",
                "why": "Usually cheaper than the full rail route while keeping emissions far below flying.",
                "warning": "",
                "co2SavedKg": 216,
                "routeStops": ["Munich", "Lyon", "Barcelona", "Madrid", "Lisbon"],
            },
            {
                "id": "search-flight",
                "emoji": "✈️",
                "title": "Direct flight",
                "tag": "High CO2",
                "pointsReward": 0,
                "detail": f"{route} · fastest route, highest emissions",
                "duration": "3-5 h",
                "co2": "312 kg",
                "score": "22 / 100",
                "tone": "rose",
                "why": "",
                "warning": "Fast, but much higher CO2 than rail or bus options.",
                "co2SavedKg": 0,
                "routeStops": ["Munich", "Lisbon"],
            },
        ],
        "activities": [
            {
                "id": "search-green-walk",
                "name": f"{destination} park and viewpoint walk",
                "tag": "Low-crowd",
                "pointsReward": 10,
                "detail": "Free · 2-3h · public transport friendly",
                "crowd": 1,
                "score": 96,
                "gradient": "from-moss-300 to-forest-500",
                "warning": False,
            },
            {
                "id": "search-local-market",
                "name": f"{destination} local market morning",
                "tag": "Local",
                "pointsReward": 7,
                "detail": "Low-waste food stalls · best before noon",
                "crowd": 2,
                "score": 88,
                "gradient": "from-forest-400 to-forest-700",
                "warning": False,
            },
            {
                "id": "search-museum",
                "name": f"{destination} off-peak museum route",
                "tag": "Indoor",
                "pointsReward": 5,
                "detail": "Weekday slot · combine with tram or metro",
                "crowd": 3,
                "score": 82,
                "gradient": "from-moss-200 to-moss-500",
                "warning": False,
            },
            {
                "id": "search-peak-sight",
                "name": f"{destination} famous peak-hour sight",
                "tag": "Crowded",
                "pointsReward": 1,
                "detail": "Go early or pick a nearby alternative",
                "crowd": 5,
                "score": 45,
                "gradient": "from-gold-200 to-gold-400",
                "warning": True,
            },
        ],
        "stays": [
            {"id": "demo-stay-1", "name": f"{destination} GreenKey Boutique", "cert": "🌿 GreenKey", "district": f"Central {destination} · 100% renewable energy", "price": "€168", "score": 93},
            {"id": "demo-stay-2", "name": f"{destination} EU Ecolabel Hotel", "cert": "🌿 EU Ecolabel", "district": f"{destination} old town · zero-waste kitchen", "price": "€142", "score": 90},
            {"id": "demo-stay-3", "name": f"Casa Verde {destination}", "cert": "🌿 Biosphere", "district": f"{destination} · local-owned · plant-based breakfast", "price": "€118", "score": 86},
        ],
        "eats": [
            {"id": "demo-eat-1", "emoji": "🥗", "name": f"Verde — {destination} Vegan Kitchen", "district": f"{destination} centre · 100% plant-based", "tags": ["Plant-based", "Local"], "price": "€€"},
            {"id": "demo-eat-2", "emoji": "🐟", "name": f"Mar Azul {destination}", "district": f"{destination} · MSC-certified seafood", "tags": ["MSC", "Day-boat"], "price": "€€€"},
            {"id": "demo-eat-3", "emoji": "🌱", "name": f"Horta {destination}", "district": f"{destination} · family-run · seasonal", "tags": ["Local owned", "Vegetarian"], "price": "€"},
        ],
    }
