from __future__ import annotations

import json
from typing import Any, Dict, Optional


def _ensure_dict(value: Any) -> Dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except Exception:
            return {}
    return {}


def _first_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, list):
        for entry in value:
            if isinstance(entry, str) and entry.strip():
                return entry.strip()
        return None
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def flatten_contact_info(
    contact_info: Any,
    fallback_phone: Optional[str] = None,
    fallback_email: Optional[str] = None,
    fallback_website: Optional[str] = None,
) -> Dict[str, Optional[str]]:
    data = _ensure_dict(contact_info)
    phone = _first_value(data.get("phone")) or _first_value(data.get("mobile")) or fallback_phone
    email = _first_value(data.get("email")) or fallback_email
    website = _first_value(data.get("website")) or fallback_website
    return {
        "contact_phone": phone,
        "contact_email": email,
        "contact_website": website,
    }


def extract_trade_contact(extra: Any) -> Dict[str, Optional[str]]:
    data = _ensure_dict(extra)
    phone = _first_value(data.get("contact_no"))
    email = _first_value(data.get("e_mail_id"))
    return {
        "contact_phone": phone,
        "contact_email": email,
    }


def extract_trade_location(extra: Any) -> Dict[str, Optional[str]]:
    data = _ensure_dict(extra)
    city = _first_value(data.get("exporter_city")) or _first_value(data.get("city"))
    state = _first_value(data.get("state"))
    pin_code = _first_value(data.get("pin_code"))
    return {
        "city": city,
        "state": state,
        "pin_code": pin_code,
    }


def format_location(
    address_full: Optional[str],
    city: Optional[str],
    state: Optional[str],
    country: Optional[str],
    pin_code: Optional[str] = None,
) -> Optional[str]:
    if address_full and address_full.strip():
        return address_full.strip()
    parts = [city, state, pin_code, country]
    cleaned = [p.strip() for p in parts if isinstance(p, str) and p.strip()]
    if cleaned:
        return ", ".join(cleaned)
    return country
