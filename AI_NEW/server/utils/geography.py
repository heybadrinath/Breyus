"""Geography helpers used for scoring and proximity estimates."""

from __future__ import annotations

import math
from typing import Dict, Optional, Tuple

# Simple static map for common countries (lat, lon). Extend as needed.
COUNTRY_COORDINATES: Dict[str, Tuple[float, float]] = {
    "AFGHANISTAN": (33.9391, 67.7100),
    "ALGERIA": (28.0339, 1.6596),
    "ARGENTINA": (-38.4161, -63.6167),
    "AUSTRALIA": (-25.2744, 133.7751),
    "AUSTRIA": (47.5162, 14.5501),
    "BANGLADESH": (23.6850, 90.3563),
    "BELGIUM": (50.5039, 4.4699),
    "BOLIVIA": (-16.2902, -63.5887),
    "BOTSWANA": (-22.3285, 24.6849),
    "BRAZIL": (-14.2350, -51.9253),
    "BULGARIA": (42.7339, 25.4858),
    "CAMBODIA": (12.5657, 104.9910),
    "CAMEROON": (7.3697, 12.3547),
    "CANADA": (56.1304, -106.3468),
    "CHILE": (-35.6751, -71.5430),
    "CHINA": (35.8617, 104.1954),
    "COLOMBIA": (4.5709, -74.2973),
    "CONGO, DEMOCRATIC REPUBLIC OF": (-4.0383, 21.7587),
    "COSTA RICA": (9.7489, -83.7534),
    "COTE D'IVOIRE": (7.5400, -5.5471),
    "CROATIA": (45.1000, 15.2000),
    "CZECH REPUBLIC": (49.8175, 15.4730),
    "CZECHIA": (49.8175, 15.4730),
    "DENMARK": (56.2639, 9.5018),
    "DEMOCRATIC REPUBLIC OF THE CONGO": (-4.0383, 21.7587),
    "DOMINICAN REPUBLIC": (18.7357, -70.1627),
    "DR CONGO": (-4.0383, 21.7587),
    "ECUADOR": (-1.8312, -78.1834),
    "EGYPT": (26.8206, 30.8025),
    "ETHIOPIA": (9.1450, 40.4897),
    "FINLAND": (61.9241, 25.7482),
    "FRANCE": (46.2276, 2.2137),
    "GERMANY": (51.1657, 10.4515),
    "GHANA": (7.9465, -1.0232),
    "GREECE": (39.0742, 21.8243),
    "GUYANA": (4.8604, -58.9302),
    "HUNGARY": (47.1625, 19.5033),
    "INDIA": (20.5937, 78.9629),
    "INDONESIA": (-0.7893, 113.9213),
    "IRAN": (32.4279, 53.6880),
    "IRAQ": (33.2232, 43.6793),
    "IRELAND": (53.4129, -8.2439),
    "ISRAEL": (31.0461, 34.8516),
    "ITALY": (41.8719, 12.5674),
    "IVORY COAST": (7.5400, -5.5471),
    "JAPAN": (36.2048, 138.2529),
    "KAZAKHSTAN": (48.0196, 66.9237),
    "KENYA": (-0.0236, 37.9062),
    "KOSOVO": (42.6026, 20.9030),
    "LESOTHO": (-29.6100, 28.2336),
    "LIBERIA": (6.4281, -9.4295),
    "MALAWI": (-13.2543, 34.3015),
    "MALAYSIA": (4.2105, 101.9758),
    "MEXICO": (23.6345, -102.5528),
    "MOLDOVA": (47.4116, 28.3699),
    "MOROCCO": (31.7917, -7.0926),
    "NAMIBIA": (-22.9576, 18.4904),
    "NEPAL": (28.3949, 84.1240),
    "NETHERLANDS": (52.1326, 5.2913),
    "NEW ZEALAND": (-40.9006, 174.8860),
    "NIGERIA": (9.0820, 8.6753),
    "NORWAY": (60.4720, 8.4689),
    "PAKISTAN": (30.3753, 69.3451),
    "PANAMA": (8.5380, -80.7821),
    "PARAGUAY": (-23.4425, -58.4438),
    "PERU": (-9.1900, -75.0152),
    "PHILIPPINES": (12.8797, 121.7740),
    "POLAND": (51.9194, 19.1451),
    "PORTUGAL": (39.3999, -8.2245),
    "ROMANIA": (45.9432, 24.9668),
    "RUSSIA": (61.5240, 105.3188),
    "SAO TOME AND PRINCIPE": (0.1864, 6.6131),
    "SAUDI ARABIA": (23.8859, 45.0792),
    "SENEGAL": (14.4974, -14.4524),
    "SERBIA": (44.0165, 21.0059),
    "SIERRA LEONE": (8.4606, -11.7799),
    "SINGAPORE": (1.3521, 103.8198),
    "SOUTH AFRICA": (-30.5595, 22.9375),
    "SOUTH KOREA": (35.9078, 127.7669),
    "SPAIN": (40.4637, -3.7492),
    "SRI LANKA": (7.8731, 80.7718),
    "SWEDEN": (60.1282, 18.6435),
    "SWITZERLAND": (46.8182, 8.2275),
    "TANZANIA": (-6.3690, 34.8888),
    "THAILAND": (15.8700, 100.9925),
    "TURKEY": (38.9637, 35.2433),
    "UAE": (23.4241, 53.8478),
    "UGANDA": (1.3733, 32.2903),
    "UK": (55.3781, -3.4360),
    "UKRAINE": (48.3794, 31.1656),
    "UNITED ARAB EMIRATES": (23.4241, 53.8478),
    "UNITED KINGDOM": (55.3781, -3.4360),
    "UNITED STATES": (37.0902, -95.7129),
    "UNITED STATES OF AMERICA": (37.0902, -95.7129),
    "URUGUAY": (-32.5228, -55.7658),
    "USA": (37.0902, -95.7129),
    "UZBEKISTAN": (41.3775, 64.5853),
    "VENEZUELA": (6.4238, -66.5897),
    "VIETNAM": (14.0583, 108.2772),
    "ZAMBIA": (-13.1339, 27.8493),
    "ZIMBABWE": (-19.0154, 29.1549),
}


def _normalize_country_name(country: str) -> str:
    return " ".join(country.strip().upper().split())


def get_country_coordinates(country: str) -> Optional[Tuple[float, float]]:
    """Return (lat, lon) for a country name if known."""
    if not country:
        return None
    key = _normalize_country_name(country)
    return COUNTRY_COORDINATES.get(key)


def calculate_distance(
    coord_a: Tuple[float, float], coord_b: Tuple[float, float]
) -> float:
    """Return Haversine distance in KM for two (lat, lon) coordinates."""
    lat1, lon1 = coord_a
    lat2, lon2 = coord_b
    rad = math.pi / 180.0
    dlat = (lat2 - lat1) * rad
    dlon = (lon2 - lon1) * rad
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1 * rad) * math.cos(lat2 * rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return 6371.0 * c


def normalize_distance(distance_km: float, max_km: float = 20000.0) -> float:
    """
    Normalize distance to 0-1, where shorter distance -> higher score.
    """
    if distance_km <= 0:
        return 1.0
    if max_km <= 0:
        return 0.0
    score = 1.0 - min(distance_km, max_km) / max_km
    return max(0.0, min(1.0, score))
