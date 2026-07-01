import json
import os
import ssl
import urllib.error
import urllib.parse
import urllib.request
import re
from typing import Any

import certifi
from fastapi import FastAPI, HTTPException, Response
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
MAX_PROXY_IMAGE_BYTES = 6 * 1024 * 1024
WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
IMAGE_SEARCH_CACHE: dict[str, dict[str, str] | None] = {}
CITY_IMAGE_FALLBACKS = {
    "lisbon": {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg/960px-Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg",
        "imageAlt": "Lisbon Torre de Belem",
        "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg",
    },
    "berlin": {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Brandenburg_Gate_Quadriga_at_Night.jpg/960px-Brandenburg_Gate_Quadriga_at_Night.jpg",
        "imageAlt": "Brandenburg Gate in Berlin",
        "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Brandenburg_Gate_Quadriga_at_Night.jpg",
    },
    "paris": {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/960px-Tour_Eiffel_Wikimedia_Commons.jpg",
        "imageAlt": "Eiffel Tower in Paris",
        "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Tour_Eiffel_Wikimedia_Commons.jpg",
    },
    "munich": {
        "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Freising_-_Marienplatz_mit_Rathaus.jpg/960px-Freising_-_Marienplatz_mit_Rathaus.jpg",
        "imageAlt": "Marienplatz near Munich",
        "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Freising_-_Marienplatz_mit_Rathaus.jpg",
    },
}
CITY_IMAGE_FALLBACK_LISTS = {
    "lisbon": [
        {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg/960px-Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg",
            "imageAlt": "Belem Tower in Lisbon",
            "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg",
        },
        {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/A_Lisbon_view.jpg/960px-A_Lisbon_view.jpg",
            "imageAlt": "Lisbon city view",
            "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:A_Lisbon_view.jpg",
        },
        {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Alfama-CCBY.jpg/960px-Alfama-CCBY.jpg",
            "imageAlt": "Alfama in Lisbon",
            "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Alfama-CCBY.jpg",
        },
        {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Arco_Triunfal_da_Rua_Augusta%2C_Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_02.JPG/960px-Arco_Triunfal_da_Rua_Augusta%2C_Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_02.JPG",
            "imageAlt": "Rua Augusta Arch in Lisbon",
            "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Arco_Triunfal_da_Rua_Augusta,_Plaza_del_Comercio,_Lisboa,_Portugal,_2012-05-12,_DD_02.JPG",
        },
        {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Ascensor_da_Bica_01.JPG/960px-Ascensor_da_Bica_01.JPG",
            "imageAlt": "Bica funicular in Lisbon",
            "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Ascensor_da_Bica_01.JPG",
        },
        {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Lisbon_City_Museum%2C_2006-01-04.jpg/960px-Lisbon_City_Museum%2C_2006-01-04.jpg",
            "imageAlt": "Lisbon City Museum",
            "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Lisbon_City_Museum,_2006-01-04.jpg",
        },
        {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Building_of_the_Museum_of_Art%2C_Architecture_and_Technology_in_Lisbon%2C_20250604_2006_9600.jpg/960px-Building_of_the_Museum_of_Art%2C_Architecture_and_Technology_in_Lisbon%2C_20250604_2006_9600.jpg",
            "imageAlt": "MAAT in Lisbon",
            "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Building_of_the_Museum_of_Art,_Architecture_and_Technology_in_Lisbon,_20250604_2006_9600.jpg",
        },
        {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Gabriel_at_the_Tropical_Indian_at_Lisbon_Oceanarium%2C_Portugal_julesvernex2.jpg/960px-Gabriel_at_the_Tropical_Indian_at_Lisbon_Oceanarium%2C_Portugal_julesvernex2.jpg",
            "imageAlt": "Lisbon Oceanarium",
            "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:Gabriel_at_the_Tropical_Indian_at_Lisbon_Oceanarium,_Portugal_julesvernex2.jpg",
        },
        {
            "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/2025-08-22_Lisbon%2C_Parque_Eduardo_VII.jpg/960px-2025-08-22_Lisbon%2C_Parque_Eduardo_VII.jpg",
            "imageAlt": "Parque Eduardo VII in Lisbon",
            "photoSourceUrl": "https://commons.wikimedia.org/wiki/File:2025-08-22_Lisbon,_Parque_Eduardo_VII.jpg",
        },
    ],
    "berlin": [
        CITY_IMAGE_FALLBACKS["berlin"],
    ],
    "paris": [
        CITY_IMAGE_FALLBACKS["paris"],
    ],
    "munich": [
        CITY_IMAGE_FALLBACKS["munich"],
    ],
}


class TripSearchRequest(BaseModel):
    from_city: str = Field(..., min_length=2)
    to_city: str = Field(..., min_length=2)
    depart_date: str
    return_date: str
    preferences: dict[str, bool] = Field(default_factory=dict)
    activity_count: int = Field(default=12, ge=12, le=20)


@app.get("/api/photo-proxy")
def photo_proxy(url: str) -> Response:
    parsed_url = urllib.parse.urlparse(url)
    hostname = (parsed_url.hostname or "").lower()
    if parsed_url.scheme not in {"http", "https"} or not hostname:
        raise HTTPException(status_code=400, detail="Invalid image URL")
    if hostname in {"localhost", "127.0.0.1", "::1"} or hostname.endswith(".local"):
        raise HTTPException(status_code=400, detail="Local image URLs are not allowed")

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "EcoTrail/1.0 image preview",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
    )

    try:
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        with urllib.request.urlopen(request, timeout=12, context=ssl_context) as remote:
            content_type = remote.headers.get("Content-Type", "").split(";", 1)[0].strip()
            if not content_type.startswith("image/"):
                raise HTTPException(status_code=415, detail="URL did not return an image")
            image_bytes = remote.read(MAX_PROXY_IMAGE_BYTES + 1)
            if len(image_bytes) > MAX_PROXY_IMAGE_BYTES:
                raise HTTPException(status_code=413, detail="Image is too large")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Image fetch failed: {exc}") from exc

    return Response(
        content=image_bytes,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


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
    {"name": "Luxembourg City, Luxembourg", "subtitle": "Capital of Luxembourg", "aliases": ["Luxembourg", "卢森堡"]},
    {"name": "Strasbourg, France", "subtitle": "Alsace, France", "aliases": ["斯特拉斯堡"]},
    {"name": "Toulouse, France", "subtitle": "Occitanie, France", "aliases": ["图卢兹"]},
    {"name": "Nantes, France", "subtitle": "Loire-Atlantique, France", "aliases": ["南特"]},
    {"name": "Lille, France", "subtitle": "Hauts-de-France", "aliases": ["里尔"]},
    {"name": "Montpellier, France", "subtitle": "Occitanie, France", "aliases": ["蒙彼利埃"]},
    {"name": "Bilbao, Spain", "subtitle": "Basque Country, Spain", "aliases": ["毕尔巴鄂"]},
    {"name": "Granada, Spain", "subtitle": "Andalusia, Spain", "aliases": ["格拉纳达"]},
    {"name": "Malaga, Spain", "subtitle": "Andalusia, Spain", "aliases": ["Málaga", "马拉加"]},
    {"name": "Zaragoza, Spain", "subtitle": "Aragon, Spain", "aliases": ["萨拉戈萨"]},
    {"name": "San Sebastian, Spain", "subtitle": "Basque Country, Spain", "aliases": ["Donostia", "圣塞巴斯蒂安"]},
    {"name": "Bologna, Italy", "subtitle": "Emilia-Romagna, Italy", "aliases": ["博洛尼亚"]},
    {"name": "Turin, Italy", "subtitle": "Piedmont, Italy", "aliases": ["Torino", "都灵"]},
    {"name": "Verona, Italy", "subtitle": "Veneto, Italy", "aliases": ["维罗纳"]},
    {"name": "Palermo, Italy", "subtitle": "Sicily, Italy", "aliases": ["巴勒莫"]},
    {"name": "Bari, Italy", "subtitle": "Puglia, Italy", "aliases": ["巴里"]},
    {"name": "Ghent, Belgium", "subtitle": "Flanders, Belgium", "aliases": ["Gent", "根特"]},
    {"name": "Bruges, Belgium", "subtitle": "Flanders, Belgium", "aliases": ["Brugge", "布鲁日"]},
    {"name": "Utrecht, Netherlands", "subtitle": "Central Netherlands", "aliases": ["乌得勒支"]},
    {"name": "The Hague, Netherlands", "subtitle": "South Holland, Netherlands", "aliases": ["Den Haag", "海牙"]},
    {"name": "Eindhoven, Netherlands", "subtitle": "North Brabant, Netherlands", "aliases": ["埃因霍温"]},
    {"name": "Graz, Austria", "subtitle": "Styria, Austria", "aliases": ["格拉茨"]},
    {"name": "Innsbruck, Austria", "subtitle": "Tyrol, Austria", "aliases": ["因斯布鲁克"]},
    {"name": "Linz, Austria", "subtitle": "Upper Austria", "aliases": ["林茨"]},
    {"name": "Bern, Switzerland", "subtitle": "Capital of Switzerland", "aliases": ["Berne", "伯尔尼"]},
    {"name": "Lucerne, Switzerland", "subtitle": "Central Switzerland", "aliases": ["Luzern", "卢塞恩"]},
    {"name": "Lausanne, Switzerland", "subtitle": "Lake Geneva region", "aliases": ["洛桑"]},
    {"name": "Brno, Czechia", "subtitle": "South Moravia, Czechia", "aliases": ["布尔诺"]},
    {"name": "Cesky Krumlov, Czechia", "subtitle": "South Bohemia, Czechia", "aliases": ["Český Krumlov", "克鲁姆洛夫"]},
    {"name": "Bratislava, Slovakia", "subtitle": "Capital of Slovakia", "aliases": ["布拉迪斯拉发"]},
    {"name": "Kosice, Slovakia", "subtitle": "Eastern Slovakia", "aliases": ["Košice", "科希策"]},
    {"name": "Ljubljana, Slovenia", "subtitle": "Capital of Slovenia", "aliases": ["卢布尔雅那"]},
    {"name": "Bled, Slovenia", "subtitle": "Julian Alps, Slovenia", "aliases": ["布莱德"]},
    {"name": "Zagreb, Croatia", "subtitle": "Capital of Croatia", "aliases": ["萨格勒布"]},
    {"name": "Split, Croatia", "subtitle": "Dalmatian coast, Croatia", "aliases": ["斯普利特"]},
    {"name": "Dubrovnik, Croatia", "subtitle": "Adriatic coast, Croatia", "aliases": ["杜布罗夫尼克"]},
    {"name": "Rijeka, Croatia", "subtitle": "Kvarner Bay, Croatia", "aliases": ["里耶卡"]},
    {"name": "Belgrade, Serbia", "subtitle": "Capital of Serbia", "aliases": ["贝尔格莱德"]},
    {"name": "Novi Sad, Serbia", "subtitle": "Vojvodina, Serbia", "aliases": ["诺维萨德"]},
    {"name": "Sarajevo, Bosnia and Herzegovina", "subtitle": "Capital of Bosnia and Herzegovina", "aliases": ["萨拉热窝"]},
    {"name": "Mostar, Bosnia and Herzegovina", "subtitle": "Herzegovina region", "aliases": ["莫斯塔尔"]},
    {"name": "Podgorica, Montenegro", "subtitle": "Capital of Montenegro", "aliases": ["波德戈里察"]},
    {"name": "Kotor, Montenegro", "subtitle": "Bay of Kotor, Montenegro", "aliases": ["科托尔"]},
    {"name": "Tirana, Albania", "subtitle": "Capital of Albania", "aliases": ["地拉那"]},
    {"name": "Skopje, North Macedonia", "subtitle": "Capital of North Macedonia", "aliases": ["斯科普里"]},
    {"name": "Pristina, Kosovo", "subtitle": "Capital of Kosovo", "aliases": ["Prishtina", "普里什蒂纳"]},
    {"name": "Sofia, Bulgaria", "subtitle": "Capital of Bulgaria", "aliases": ["索非亚"]},
    {"name": "Plovdiv, Bulgaria", "subtitle": "Southern Bulgaria", "aliases": ["普罗夫迪夫"]},
    {"name": "Bucharest, Romania", "subtitle": "Capital of Romania", "aliases": ["布加勒斯特"]},
    {"name": "Cluj-Napoca, Romania", "subtitle": "Transylvania, Romania", "aliases": ["Cluj", "克卢日"]},
    {"name": "Brasov, Romania", "subtitle": "Transylvania, Romania", "aliases": ["Brașov", "布拉索夫"]},
    {"name": "Tallinn, Estonia", "subtitle": "Capital of Estonia", "aliases": ["塔林"]},
    {"name": "Tartu, Estonia", "subtitle": "Southern Estonia", "aliases": ["塔尔图"]},
    {"name": "Riga, Latvia", "subtitle": "Capital of Latvia", "aliases": ["里加"]},
    {"name": "Vilnius, Lithuania", "subtitle": "Capital of Lithuania", "aliases": ["维尔纽斯"]},
    {"name": "Kaunas, Lithuania", "subtitle": "Central Lithuania", "aliases": ["考纳斯"]},
    {"name": "Gdansk, Poland", "subtitle": "Baltic coast, Poland", "aliases": ["Gdańsk", "格但斯克"]},
    {"name": "Wroclaw, Poland", "subtitle": "Lower Silesia, Poland", "aliases": ["Wrocław", "弗罗茨瓦夫"]},
    {"name": "Poznan, Poland", "subtitle": "Greater Poland", "aliases": ["Poznań", "波兹南"]},
    {"name": "Lodz, Poland", "subtitle": "Central Poland", "aliases": ["Łódź", "罗兹"]},
    {"name": "Aarhus, Denmark", "subtitle": "Jutland, Denmark", "aliases": ["奥胡斯"]},
    {"name": "Odense, Denmark", "subtitle": "Funen, Denmark", "aliases": ["欧登塞"]},
    {"name": "Gothenburg, Sweden", "subtitle": "West Sweden", "aliases": ["Göteborg", "哥德堡"]},
    {"name": "Malmo, Sweden", "subtitle": "Skane, Sweden", "aliases": ["Malmö", "马尔默"]},
    {"name": "Bergen, Norway", "subtitle": "Western Norway", "aliases": ["卑尔根"]},
    {"name": "Trondheim, Norway", "subtitle": "Central Norway", "aliases": ["特隆赫姆"]},
    {"name": "Tampere, Finland", "subtitle": "Pirkanmaa, Finland", "aliases": ["坦佩雷"]},
    {"name": "Turku, Finland", "subtitle": "Southwest Finland", "aliases": ["图尔库"]},
    {"name": "Cork, Ireland", "subtitle": "Southern Ireland", "aliases": ["科克"]},
    {"name": "Galway, Ireland", "subtitle": "West Ireland", "aliases": ["戈尔韦"]},
    {"name": "Belfast, United Kingdom", "subtitle": "Northern Ireland", "aliases": ["贝尔法斯特"]},
    {"name": "Glasgow, United Kingdom", "subtitle": "Scotland", "aliases": ["格拉斯哥"]},
    {"name": "Cardiff, United Kingdom", "subtitle": "Capital of Wales", "aliases": ["加的夫"]},
    {"name": "Bristol, United Kingdom", "subtitle": "South West England", "aliases": ["布里斯托"]},
    {"name": "Liverpool, United Kingdom", "subtitle": "North West England", "aliases": ["利物浦"]},
    {"name": "Oxford, United Kingdom", "subtitle": "England", "aliases": ["牛津"]},
    {"name": "Cambridge, United Kingdom", "subtitle": "England", "aliases": ["剑桥"]},
    {"name": "Valletta, Malta", "subtitle": "Capital of Malta", "aliases": ["瓦莱塔"]},
    {"name": "Nicosia, Cyprus", "subtitle": "Capital of Cyprus", "aliases": ["尼科西亚"]},
    {"name": "Limassol, Cyprus", "subtitle": "Southern Cyprus", "aliases": ["利马索尔"]},
    {"name": "Andorra la Vella, Andorra", "subtitle": "Capital of Andorra", "aliases": ["安道尔城"]},
    {"name": "Monaco, Monaco", "subtitle": "Principality of Monaco", "aliases": ["摩纳哥"]},
    {"name": "Vaduz, Liechtenstein", "subtitle": "Capital of Liechtenstein", "aliases": ["瓦杜兹"]},
    {"name": "San Marino, San Marino", "subtitle": "Capital of San Marino", "aliases": ["圣马力诺"]},
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
    activity_count = payload.activity_count
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
                "minItems": activity_count,
                "maxItems": activity_count,
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
                        "imageUrl",
                        "imageAlt",
                        "photoSourceUrl",
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
                        "imageUrl": {"type": "string"},
                        "imageAlt": {"type": "string"},
                        "photoSourceUrl": {"type": "string"},
                    },
                },
            },
            "stays": {
                "type": "array",
                "minItems": 6,
                "maxItems": 6,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "id",
                        "name",
                        "cert",
                        "district",
                        "price",
                        "score",
                        "imageUrl",
                        "imageAlt",
                        "photoSourceUrl",
                        "hotelPageUrl",
                    ],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "cert": {"type": "string"},
                        "district": {"type": "string"},
                        "price": {"type": "string"},
                        "score": {"type": "integer"},
                        "imageUrl": {"type": "string"},
                        "imageAlt": {"type": "string"},
                        "photoSourceUrl": {"type": "string"},
                        "hotelPageUrl": {"type": "string"},
                    },
                },
            },
            "eats": {
                "type": "array",
                "minItems": 6,
                "maxItems": 6,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "id",
                        "emoji",
                        "name",
                        "district",
                        "tags",
                        "price",
                        "score",
                        "detail",
                        "restaurantPageUrl",
                    ],
                    "properties": {
                        "id": {"type": "string"},
                        "emoji": {"type": "string"},
                        "name": {"type": "string"},
                        "district": {"type": "string"},
                        "tags": {
                            "type": "array",
                            "minItems": 2,
                            "maxItems": 4,
                            "items": {"type": "string"},
                        },
                        "price": {"type": "string"},
                        "score": {"type": "integer"},
                        "detail": {"type": "string"},
                        "restaurantPageUrl": {"type": "string"},
                    },
                },
            },
        },
    }

    preference_labels = {
        "lowCo2": "prefer low-CO2 routes and low-emission activities",
        "family": "family with kids",
        "offPeak": "off-peak and less-crowded choices",
        "budget": "budget-friendly first",
        "accessibility": "accessibility mode with step-free, easy-access suggestions",
    }
    active_preferences = [
        label
        for key, label in preference_labels.items()
        if payload.preferences.get(key)
    ]
    preference_text = (
        "Active user preferences: " + "; ".join(active_preferences) + ". "
        if active_preferences
        else "No extra user preferences selected. "
    )

    prompt = (
        "Generate sustainable trip planning options. Use realistic, route-specific demo data. "
        + preference_text +
        "Reflect active preferences in ranking, tags, warnings, detail copy, and recommended activities/stays/restaurants. "
        "Transport must include greener options and one high-emission option. "
        "For each transport option, calculate a plausible duration and CO2 estimate for this exact route. "
        "The detail field must name concrete legs, carriers or route segments when possible. "
        "The routeStops array must list the actual city/stop sequence, not generic text. "
        f"Use web search to choose exactly {activity_count} real activities or sights in or near the destination city, "
        "with larger point gaps up to 10. For every activity, include a direct HTTPS imageUrl that can be "
        "rendered in a browser, a concise imageAlt, and a photoSourceUrl. Prefer Wikimedia Commons, "
        "official tourism pages, museum/venue pages, or other stable public pages; avoid restaurants and stock-only pages. "
        "Return exactly 6 eco-certified stays actually in the destination city. For each stay, use web search "
        "to find the hotel's own official page or a hotel-specific Booking.com, Google Travel/Maps, or Tripadvisor page. "
        "Do not use city-wide hotel listing/category pages. Set hotelPageUrl to that hotel-specific page. "
        "Set imageUrl to a direct HTTPS image URL from the same hotel page, "
        "the hotel's official media/gallery, Booking.com, Google, Tripadvisor, or another hotel listing/gallery. "
        "The imageUrl must point directly to an image asset, preferably ending in .jpg, .jpeg, .png, .webp, .avif, or containing a hotel image CDN path. "
        "Set photoSourceUrl to the page where the photo came from. Do not use Wikimedia or generic city/landmark photos for stays. "
        "If you cannot verify a hotel-specific direct image URL, use an empty string for imageUrl and keep hotelPageUrl/photoSourceUrl. "
        "Each stay needs a cert label (GreenKey, EU Ecolabel or Biosphere), a real district, a nightly price, and a green-score 80-99. "
        "Return exactly 6 local vegetarian or vegan restaurants in the destination city. They should be distinctive local picks, "
        "not international chains. Prefer fully vegan or vegetarian places, and include restaurantPageUrl from an official site, "
        "Google Maps, Tripadvisor, HappyCow, or another restaurant-specific page. "
        "The summary must cover transport, activities, stays, and vegetarian dining. "
        f"Route: {payload.from_city} to {payload.to_city}. "
        f"Dates: {payload.depart_date} to {payload.return_date}."
    )

    body = {
        "model": model,
        "max_output_tokens": 12000,
        "tools": [{"type": "web_search"}],
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
        with urllib.request.urlopen(request, timeout=90, context=ssl_context) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI API error {exc.code}: {detail}") from exc

    content = extract_response_text(result)
    parsed = json.loads(content)
    parsed["source"] = "openai"
    parsed["model"] = model
    enrich_plan_images(parsed, payload.to_city)
    return parsed


def enrich_plan_images(plan: dict[str, Any], destination: str) -> None:
    enrich_activity_images(plan, destination)
    enrich_hotel_images_from_sources(plan)


def enrich_activity_images(plan: dict[str, Any], destination: str) -> None:
    activities = plan.get("activities")
    if not isinstance(activities, list):
        return

    destination_name = destination.split(",")[0].strip()
    for activity in activities:
        if not isinstance(activity, dict):
            continue
        name = str(activity.get("name") or "")
        image = fetch_wikimedia_image(f"{name} {destination_name}") or fetch_wikimedia_image(name)
        if image:
            activity["imageUrl"] = image["imageUrl"]
            activity["imageAlt"] = image["imageAlt"]
            activity["photoSourceUrl"] = image["photoSourceUrl"]
        else:
            activity["imageUrl"] = ""
            activity["imageAlt"] = activity.get("name", "Activity photo")
            activity["photoSourceUrl"] = ""


def enrich_stay_images(plan: dict[str, Any], destination: str) -> None:
    stays = plan.get("stays")
    if not isinstance(stays, list):
        return

    destination_name = destination.split(",")[0].strip()
    destination_images = get_destination_images(destination_name)

    for index, stay in enumerate(stays):
        if not isinstance(stay, dict):
            continue
        name = str(stay.get("name") or "")
        image = (
            fetch_wikimedia_image(f"{name} {destination_name}")
            or (destination_images[index % len(destination_images)] if destination_images else None)
        )
        if image:
            stay["imageUrl"] = image["imageUrl"]
            stay["imageAlt"] = image["imageAlt"]
            stay["photoSourceUrl"] = image["photoSourceUrl"]
        else:
            stay["imageUrl"] = ""
            stay["imageAlt"] = stay.get("name", "Hotel photo")
            stay["photoSourceUrl"] = ""


def get_destination_images(destination_name: str) -> list[dict[str, str]]:
    city_key = destination_name.lower()
    images: list[dict[str, str]] = []
    seen_urls: set[str] = set()

    for image in CITY_IMAGE_FALLBACK_LISTS.get(city_key, []):
        if image["imageUrl"] not in seen_urls:
            images.append(image)
            seen_urls.add(image["imageUrl"])

    queries = [
        f"{destination_name} hotel exterior",
        f"{destination_name} city view",
        f"{destination_name} old town",
        f"{destination_name} architecture",
        f"{destination_name} waterfront",
        f"{destination_name} street",
        f"{destination_name} landmark",
        f"{destination_name} garden",
        f"{destination_name} skyline",
    ]
    for query in queries:
        image = fetch_wikimedia_image(query)
        if image and image["imageUrl"] not in seen_urls:
            images.append(image)
            seen_urls.add(image["imageUrl"])
        if len(images) >= 9:
            break

    single_fallback = CITY_IMAGE_FALLBACKS.get(city_key)
    if single_fallback and single_fallback["imageUrl"] not in seen_urls:
        images.append(single_fallback)

    return images


def enrich_hotel_images_from_sources(plan: dict[str, Any]) -> None:
    stays = plan.get("stays")
    if not isinstance(stays, list):
        return

    for stay in stays:
        if not isinstance(stay, dict):
            continue

        image_url = str(stay.get("imageUrl") or "").strip()
        hotel_page_url = str(stay.get("hotelPageUrl") or "").strip()
        photo_source_url = str(stay.get("photoSourceUrl") or "").strip()

        if is_probably_direct_image_url(image_url):
            continue

        page_candidates = [hotel_page_url, photo_source_url, image_url]
        for page_url in page_candidates:
            preview_image = fetch_page_preview_image(page_url)
            if preview_image:
                stay["imageUrl"] = preview_image
                stay["imageAlt"] = stay.get("imageAlt") or stay.get("name", "Hotel photo")
                if not stay.get("photoSourceUrl"):
                    stay["photoSourceUrl"] = page_url
                break
        else:
            if hotel_page_url:
                stay["imageUrl"] = hotel_page_screenshot_url(hotel_page_url)
                stay["imageAlt"] = f"Preview of {stay.get('name', 'hotel page')}"
                if not stay.get("photoSourceUrl"):
                    stay["photoSourceUrl"] = hotel_page_url
            else:
                stay["imageUrl"] = ""
                stay["imageAlt"] = stay.get("name", "Hotel photo")


def hotel_page_screenshot_url(page_url: str) -> str:
    parsed = urllib.parse.urlparse(page_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""
    return f"https://image.thum.io/get/width/900/crop/600/noanimate/{page_url}"


def is_probably_direct_image_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.lower()
    return parsed.scheme in {"http", "https"} and path.endswith((
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif",
    ))


def fetch_page_preview_image(page_url: str) -> str:
    parsed = urllib.parse.urlparse(page_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""

    request = urllib.request.Request(
        page_url,
        headers={
            "User-Agent": "Mozilla/5.0 EcoTrail hotel media lookup",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )

    try:
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        with urllib.request.urlopen(request, timeout=12, context=ssl_context) as response:
            content_type = response.headers.get("Content-Type", "")
            if "text/html" not in content_type and "application/xhtml" not in content_type:
                return ""
            html = response.read(700_000).decode("utf-8", errors="ignore")
    except Exception:
        return ""

    patterns = [
        r'<meta[^>]+property=["\\\']og:image(?::secure_url)?["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\']',
        r'<meta[^>]+content=["\\\']([^"\\\']+)["\\\'][^>]+property=["\\\']og:image(?::secure_url)?["\\\']',
        r'<meta[^>]+name=["\\\']twitter:image["\\\'][^>]+content=["\\\']([^"\\\']+)["\\\']',
        r'<meta[^>]+content=["\\\']([^"\\\']+)["\\\'][^>]+name=["\\\']twitter:image["\\\']',
        r'<link[^>]+rel=["\\\']image_src["\\\'][^>]+href=["\\\']([^"\\\']+)["\\\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, flags=re.IGNORECASE)
        if match:
            image_url = urllib.parse.urljoin(page_url, match.group(1).strip())
            if urllib.parse.urlparse(image_url).scheme in {"http", "https"}:
                return image_url
    return ""


def fetch_wikimedia_image(query: str) -> dict[str, str] | None:
    clean_query = re.sub(r"\s+", " ", query).strip()
    if not clean_query:
        return None
    cache_key = clean_query.lower()
    if cache_key in IMAGE_SEARCH_CACHE:
        return IMAGE_SEARCH_CACHE[cache_key]

    params = urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrsearch": clean_query,
        "gsrnamespace": "6",
        "gsrlimit": "5",
        "prop": "imageinfo",
        "iiprop": "url|mime",
        "iiurlwidth": "900",
        "format": "json",
    })
    request = urllib.request.Request(
        f"{WIKIMEDIA_API}?{params}",
        headers={"User-Agent": "EcoTrail/1.0 activity image search"},
    )

    try:
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        with urllib.request.urlopen(request, timeout=8, context=ssl_context) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception:
        return None

    pages = result.get("query", {}).get("pages", {})
    for page in pages.values():
        image_info = (page.get("imageinfo") or [{}])[0]
        mime = image_info.get("mime", "")
        image_url = image_info.get("thumburl") or image_info.get("url")
        if image_url and mime.startswith("image/"):
            title = str(page.get("title", "Activity photo")).replace("File:", "")
            image = {
                "imageUrl": image_url,
                "imageAlt": title,
                "photoSourceUrl": image_info.get("descriptionurl") or image_url,
            }
            IMAGE_SEARCH_CACHE[cache_key] = image
            return image
    return None


def extract_response_text(result: dict[str, Any]) -> str:
    if result.get("output_text"):
        return result["output_text"]

    for output in result.get("output", []):
        for item in output.get("content", []):
            if item.get("type") in {"output_text", "text"} and item.get("text"):
                return item["text"]

    raise RuntimeError("OpenAI response did not include JSON text")


def with_empty_hotel_media(stay: dict[str, Any]) -> dict[str, Any]:
    stay.update({
        "imageUrl": "",
        "imageAlt": stay.get("name", "Hotel photo"),
        "photoSourceUrl": "",
        "hotelPageUrl": "",
    })
    return stay


def build_demo_plan(payload: TripSearchRequest, source: str) -> dict[str, Any]:
    route = f"{payload.from_city} -> {payload.to_city}"
    destination = payload.to_city.split(",")[0].strip() or payload.to_city

    plan = {
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
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},park,viewpoint",
                "imageAlt": f"Green park viewpoint in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
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
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},market",
                "imageAlt": f"Local market in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
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
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},museum",
                "imageAlt": f"Museum in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
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
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},landmark",
                "imageAlt": f"Busy landmark in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
            },
            {
                "id": "search-bike-loop",
                "name": f"{destination} riverside bike loop",
                "tag": "Bike-friendly",
                "pointsReward": 9,
                "detail": "Bike-share route · 90 min · mostly protected lanes",
                "crowd": 2,
                "score": 91,
                "gradient": "from-forest-300 to-moss-500",
                "warning": False,
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},cycling,river",
                "imageAlt": f"Riverside cycling route in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
            },
            {
                "id": "search-community-tour",
                "name": f"{destination} neighbourhood walking tour",
                "tag": "Community-led",
                "pointsReward": 8,
                "detail": "Small group · local guide · avoids peak corridors",
                "crowd": 2,
                "score": 89,
                "gradient": "from-moss-300 to-forest-600",
                "warning": False,
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},neighbourhood,street",
                "imageAlt": f"Neighbourhood street in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
            },
            {
                "id": "search-urban-garden",
                "name": f"{destination} urban garden visit",
                "tag": "Hidden gem",
                "pointsReward": 8,
                "detail": "Donation-based · local biodiversity project",
                "crowd": 1,
                "score": 90,
                "gradient": "from-moss-200 to-forest-400",
                "warning": False,
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},urban,garden",
                "imageAlt": f"Urban garden in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
            },
            {
                "id": "search-public-art",
                "name": f"{destination} public art trail",
                "tag": "Free",
                "pointsReward": 6,
                "detail": "Self-guided · tram-accessible · flexible timing",
                "crowd": 2,
                "score": 84,
                "gradient": "from-forest-400 to-moss-600",
                "warning": False,
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},public,art",
                "imageAlt": f"Public art in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
            },
            {
                "id": "search-waterfront-cleanup",
                "name": f"{destination} volunteer cleanup hour",
                "tag": "Positive impact",
                "pointsReward": 10,
                "detail": "1h · community event · bring reusable gloves",
                "crowd": 1,
                "score": 94,
                "gradient": "from-forest-500 to-moss-400",
                "warning": False,
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},waterfront",
                "imageAlt": f"Waterfront in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
            },
            {
                "id": "search-busy-landmark",
                "name": f"{destination} headline landmark at midday",
                "tag": "Very crowded",
                "pointsReward": 1,
                "detail": "Highest crowd window · choose early morning instead",
                "crowd": 5,
                "score": 42,
                "gradient": "from-gold-200 to-gold-500",
                "warning": True,
                "imageUrl": f"https://source.unsplash.com/900x600/?{destination},tourist,landmark",
                "imageAlt": f"Popular tourist landmark in {destination}",
                "photoSourceUrl": "https://unsplash.com/",
            },
        ],
        "stays": [
            with_empty_hotel_media({"id": "demo-stay-1", "name": f"{destination} GreenKey Boutique", "cert": "🌿 GreenKey", "district": f"Central {destination} · 100% renewable energy", "price": "€168", "score": 93}),
            with_empty_hotel_media({"id": "demo-stay-2", "name": f"{destination} EU Ecolabel Hotel", "cert": "🌿 EU Ecolabel", "district": f"{destination} old town · zero-waste kitchen", "price": "€142", "score": 90}),
            with_empty_hotel_media({"id": "demo-stay-3", "name": f"Casa Verde {destination}", "cert": "🌿 Biosphere", "district": f"{destination} · local-owned · plant-based breakfast", "price": "€118", "score": 86}),
            with_empty_hotel_media({"id": "demo-stay-4", "name": f"{destination} Solar Garden Inn", "cert": "🌿 GreenKey", "district": f"{destination} garden quarter · solar hot water", "price": "€154", "score": 91}),
            with_empty_hotel_media({"id": "demo-stay-5", "name": f"{destination} Low-Waste Suites", "cert": "🌿 EU Ecolabel", "district": f"{destination} transit hub · refill stations", "price": "€136", "score": 88}),
            with_empty_hotel_media({"id": "demo-stay-6", "name": f"{destination} Riverside Eco Lodge", "cert": "🌿 Biosphere", "district": f"{destination} riverside · local materials", "price": "€126", "score": 87}),
        ],
        "eats": [
            {"id": "demo-eat-1", "emoji": "🥗", "name": f"Verde — {destination} Vegan Kitchen", "district": f"{destination} centre", "tags": ["Vegan", "Local"], "price": "€€", "score": 92, "detail": "Plant-based seasonal menu with local produce.", "restaurantPageUrl": ""},
            {"id": "demo-eat-2", "emoji": "🌱", "name": f"Horta {destination}", "district": f"{destination} old town", "tags": ["Vegetarian", "Family-run"], "price": "€", "score": 88, "detail": "Casual vegetarian plates and low-waste lunch specials.", "restaurantPageUrl": ""},
            {"id": "demo-eat-3", "emoji": "🥬", "name": f"Raiz Plant Bistro", "district": f"{destination} creative quarter", "tags": ["Vegan", "Organic"], "price": "€€", "score": 90, "detail": "Small plant-forward bistro near public transport.", "restaurantPageUrl": ""},
            {"id": "demo-eat-4", "emoji": "🍲", "name": f"Green Spoon {destination}", "district": f"{destination} market area", "tags": ["Vegetarian", "Local sourced"], "price": "€€", "score": 86, "detail": "Vegetarian comfort food with regional ingredients.", "restaurantPageUrl": ""},
            {"id": "demo-eat-5", "emoji": "🥙", "name": f"Leaf & Grain", "district": f"{destination} riverside", "tags": ["Vegan options", "Low-waste"], "price": "€", "score": 84, "detail": "Quick vegan bowls and reusable-container friendly service.", "restaurantPageUrl": ""},
            {"id": "demo-eat-6", "emoji": "🍛", "name": f"Jardim Veg", "district": f"{destination} garden district", "tags": ["Vegan", "Hidden gem"], "price": "€€", "score": 89, "detail": "Quiet dinner spot with plant-based local specials.", "restaurantPageUrl": ""},
        ],
    }
    normalize_demo_activity_count(plan, destination, payload.activity_count)
    enrich_plan_images(plan, payload.to_city)
    return plan


def normalize_demo_activity_count(plan: dict[str, Any], destination: str, count: int) -> None:
    activities = plan.get("activities")
    if not isinstance(activities, list):
        plan["activities"] = []
        activities = plan["activities"]

    extra_templates = [
        ("family-playground-route", "family-friendly park route", "Family", 6, "Easy walk · playground stop · stroller-friendly", 2, 86, "from-moss-200 to-forest-400", False, "family,park"),
        ("accessible-gallery", "accessible gallery visit", "Accessible", 6, "Step-free venue · indoor break · transit nearby", 2, 85, "from-forest-300 to-moss-500", False, "gallery,museum"),
        ("budget-viewpoint", "free sunset viewpoint", "Budget", 8, "Free · best after rush hour · bring a reusable bottle", 2, 88, "from-moss-300 to-forest-500", False, "viewpoint,sunset"),
        ("quiet-neighbourhood", "quiet neighbourhood loop", "Less crowded", 7, "Self-guided · local cafes · avoids peak corridors", 1, 89, "from-forest-400 to-moss-600", False, "quiet,street"),
        ("transit-day-pass", "public transport discovery loop", "Transit", 7, "Day-pass friendly · low walking strain · flexible stops", 2, 87, "from-moss-200 to-moss-500", False, "tram,city"),
        ("local-workshop", "local craft workshop", "Local", 5, "Small group · book ahead · supports local makers", 2, 82, "from-forest-300 to-moss-400", False, "workshop,craft"),
        ("rainy-day-library", "rainy-day library and cafe stop", "Indoor", 4, "Low-cost · quiet · good accessibility backup", 1, 80, "from-moss-200 to-forest-300", False, "library,cafe"),
        ("farmers-market", "farmers market tasting walk", "Local food", 6, "Morning route · regional produce · low-waste stalls", 3, 83, "from-forest-400 to-moss-500", False, "farmers,market"),
        ("early-landmark", "early-morning landmark visit", "Off-peak", 6, "Go before crowds · short transit hop · photo stop", 2, 84, "from-moss-300 to-forest-600", False, "landmark,morning"),
        ("green-rooftop", "green rooftop or urban farm", "Hidden gem", 8, "Biodiversity project · limited slots · book ahead", 1, 90, "from-forest-500 to-moss-400", False, "rooftop,garden"),
        ("river-ferry", "river ferry or waterfront tram", "Low effort", 5, "Scenic public transport · minimal walking · family-friendly", 2, 81, "from-moss-200 to-forest-400", False, "waterfront,tram"),
        ("community-event", "community event evening", "Community", 7, "Local calendar pick · low-cost · small venue", 2, 85, "from-forest-300 to-moss-600", False, "community,event"),
        ("nature-reserve", "nearby nature reserve half-day", "Nature", 9, "Regional train access · low crowd · picnic-friendly", 1, 92, "from-moss-300 to-forest-700", False, "nature,reserve"),
        ("accessible-old-town", "accessible old-town highlights", "Accessible", 6, "Flatter streets · rest stops · shorter route", 2, 84, "from-forest-300 to-moss-500", False, "old,town"),
    ]

    template_index = 0
    while len(activities) < count:
        suffix, label, tag, points, detail, crowd, score, gradient, warning, image_query = extra_templates[template_index % len(extra_templates)]
        activities.append({
            "id": f"demo-{suffix}-{template_index}",
            "name": f"{destination} {label}",
            "tag": tag,
            "pointsReward": points,
            "detail": detail,
            "crowd": crowd,
            "score": score,
            "gradient": gradient,
            "warning": warning,
            "imageUrl": f"https://source.unsplash.com/900x600/?{destination},{image_query}",
            "imageAlt": f"{label.title()} in {destination}",
            "photoSourceUrl": "https://unsplash.com/",
        })
        template_index += 1

    plan["activities"] = activities[:count]
